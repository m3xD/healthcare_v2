from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class InsuranceProvider(models.Model):
    name = models.CharField(max_length=100)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20)
    address = models.TextField()
    website = models.URLField(blank=True)
    logo = models.ImageField(upload_to='insurance_logos/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class PatientInsurance(models.Model):
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='insurance_details')
    insurance_provider = models.ForeignKey(InsuranceProvider, on_delete=models.CASCADE)
    policy_number = models.CharField(max_length=50)
    group_number = models.CharField(max_length=50, blank=True)
    valid_from = models.DateField()
    valid_until = models.DateField()
    coverage_percentage = models.PositiveIntegerField(default=80)  # e.g., 80 means 80% coverage
    max_coverage_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    insurance_card_front = models.ImageField(upload_to='insurance_cards/', blank=True, null=True)
    insurance_card_back = models.ImageField(upload_to='insurance_cards/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.patient.username}'s insurance with {self.insurance_provider.name}"


class Bill(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
        ('partially_paid', 'Partially Paid'),
        ('insurance_review', 'Insurance Review')
    ]

    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bills')
    issue_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    insurance_claim = models.ForeignKey('InsuranceClaim', on_delete=models.SET_NULL, null=True, blank=True,
                                        related_name='bills')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Bill #{self.id} for {self.patient.username}"

    @property
    def remaining_amount(self):
        return self.total_amount - self.paid_amount


class BillItem(models.Model):
    ITEM_TYPE_CHOICES = [
        ('appointment', 'Appointment'),
        ('lab_test', 'Laboratory Test'),
        ('medicine', 'Medicine'),
        ('procedure', 'Medical Procedure'),
        ('consultation', 'Consultation'),
        ('other', 'Other')
    ]

    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name='items')
    item_type = models.CharField(max_length=20, choices=ITEM_TYPE_CHOICES)
    description = models.CharField(max_length=200)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    related_object_id = models.PositiveIntegerField(null=True,
                                                    blank=True)  # ID of related object (e.g., appointment ID)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.description} - ${self.total_price}"


class InsuranceClaim(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('in_review', 'In Review'),
        ('approved', 'Approved'),
        ('partially_approved', 'Partially Approved'),
        ('rejected', 'Rejected'),
        ('appealed', 'Appealed')
    ]

    patient_insurance = models.ForeignKey(PatientInsurance, on_delete=models.CASCADE)
    submission_date = models.DateField(auto_now_add=True)
    claim_number = models.CharField(max_length=50, blank=True)
    diagnosis_codes = models.CharField(max_length=200, blank=True)
    procedure_codes = models.CharField(max_length=200, blank=True)
    claimed_amount = models.DecimalField(max_digits=10, decimal_places=2)
    approved_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    notes = models.TextField(blank=True)
    supporting_documents = models.FileField(upload_to='insurance_claims/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Claim #{self.id} - {self.patient_insurance.patient.username}"


@receiver(post_save, sender=BillItem)
def update_bill_total(sender, instance, **kwargs):
    """
    Update the bill's total amount when bill items are added or modified
    """
    bill = instance.bill
    total = sum(item.total_price for item in bill.items.all())
    bill.total_amount = total
    bill.save()