from django.db import models
from django.contrib.auth.models import User
from doctors.models import Doctor
from ai_model.models import Diagnosis


class LabTest(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    normal_range = models.CharField(max_length=100, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    preparation_instructions = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class LabTechnician(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    specialization = models.CharField(max_length=100)
    license_number = models.CharField(max_length=50)
    joined_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"Technician: {self.user.first_name} {self.user.last_name}"


class LabRequest(models.Model):
    STATUS_CHOICES = [
        ('requested', 'Requested'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    ]

    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lab_requests')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='ordered_lab_tests')
    diagnosis = models.ForeignKey(Diagnosis, on_delete=models.SET_NULL, null=True, blank=True)
    request_date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='requested')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Lab request #{self.id} for {self.patient.username}"


class LabTestResult(models.Model):
    lab_request = models.ForeignKey(LabRequest, on_delete=models.CASCADE, related_name='test_results')
    lab_test = models.ForeignKey(LabTest, on_delete=models.CASCADE)
    technician = models.ForeignKey(LabTechnician, on_delete=models.SET_NULL, null=True, blank=True)
    result_value = models.CharField(max_length=100)
    reference_range = models.CharField(max_length=100)
    unit = models.CharField(max_length=20)
    is_abnormal = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    report_file = models.FileField(upload_to='lab_reports/', blank=True, null=True)
    performed_date = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Result: {self.lab_test.name} for {self.lab_request.patient.username}"