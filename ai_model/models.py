from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User


class Symptom(models.Model):
    """Model representing a symptom"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name


class Disease(models.Model):
    """Model representing a disease"""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    test_recommendation = models.CharField(max_length=200, blank=True, null=True)
    medicine_recommendation = models.CharField(max_length=200, blank=True, null=True)

    def __str__(self):
        return self.name


class Diagnosis(models.Model):
    """Model to store user diagnosis history"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    symptoms = models.ManyToManyField(Symptom, through='DiagnosisSymptom')
    primary_disease = models.ForeignKey(Disease, on_delete=models.SET_NULL, null=True, related_name='primary_diagnoses')

    # Store the complete prediction results
    prediction_data = models.JSONField(default=dict)

    def __str__(self):
        return f"Diagnosis {self.id} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"

    class Meta:
        verbose_name_plural = "Diagnoses"
        ordering = ['-created_at']


class DiagnosisSymptom(models.Model):
    """Junction table for many-to-many relationship between Diagnosis and Symptom"""
    diagnosis = models.ForeignKey(Diagnosis, on_delete=models.CASCADE)
    symptom = models.ForeignKey(Symptom, on_delete=models.CASCADE)
    is_present = models.BooleanField(default=False)

    def __str__(self):
        status = "Present" if self.is_present else "Absent"
        return f"{self.symptom.name}: {status}"

    class Meta:
        unique_together = ('diagnosis', 'symptom')