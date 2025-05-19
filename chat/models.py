from django.db import models
from django.contrib.auth.models import User
from ai_model.models import Diagnosis


class ChatRoom(models.Model):
    participants = models.ManyToManyField(User, related_name='chat_rooms')
    title = models.CharField(max_length=100, blank=True)
    is_ai_chat = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Chat {self.id}: {self.title or 'Untitled'}"

    @property
    def last_message(self):
        return self.messages.order_by('-sent_at').first()


class Message(models.Model):
    chat_room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages', null=True, blank=True)
    content = models.TextField()
    is_ai_message = models.BooleanField(default=False)
    related_diagnosis = models.ForeignKey(Diagnosis, on_delete=models.SET_NULL, null=True, blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['sent_at']

    def __str__(self):
        if self.is_ai_message:
            return f"AI message in {self.chat_room}"
        return f"Message from {self.sender.username} in {self.chat_room}"


class AIResponse(models.Model):
    query = models.TextField()
    response = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    diagnosis = models.ForeignKey(Diagnosis, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"AI Response to: {self.query[:30]}..."