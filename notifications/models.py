from django.db import models
from django.contrib.auth.models import User


class Notification(models.Model):
    TYPE_CHOICES = [
        ('appointment', 'Appointment Reminder'),
        ('lab_result', 'Lab Result Available'),
        ('prescription', 'New Prescription'),
        ('message', 'New Message'),
        ('bill', 'New Bill'),
        ('system', 'System Notification')
    ]

    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=100)
    message = models.TextField()
    related_object_id = models.PositiveIntegerField(null=True, blank=True)
    related_object_type = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    is_email_sent = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.type} notification for {self.recipient.username}: {self.title}"