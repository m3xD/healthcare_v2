from django.db import models
from django.contrib.auth.models import User
from doctors.models import Doctor
from ai_model.models import Diagnosis


class Medicine(models.Model):
    name = models.CharField(max_length=100)
    generic_name = models.CharField(max_length=100)
    category = models.CharField(max_length=50)
    description = models.TextField()
    dosage_form = models.CharField(max_length=50)  # e.g., tablet, capsule, liquid
    stock_quantity = models.PositiveIntegerField(default=0)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.dosage_form})"


class Prescription(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('filled', 'Filled'),
        ('cancelled', 'Cancelled')
    ]

    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='prescriptions')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE)
    diagnosis = models.ForeignKey(Diagnosis, on_delete=models.SET_NULL, null=True, blank=True)
    issue_date = models.DateField(auto_now_add=True)
    expiry_date = models.DateField()  # When prescription expires
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Prescription for {self.patient.username} by Dr. {self.doctor.user.last_name}"


class PrescriptionItem(models.Model):
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='items')
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE)
    dosage = models.CharField(max_length=50)  # e.g., "1 tablet twice daily"
    duration = models.CharField(max_length=50)  # e.g., "7 days"
    quantity = models.PositiveIntegerField()
    instructions = models.TextField(blank=True)

    def __str__(self):
        return f"{self.medicine.name} - {self.dosage}"