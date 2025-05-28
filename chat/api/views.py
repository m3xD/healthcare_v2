# chat/api/views.py (improved version)
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import ChatRoom, Message, AIResponse
from .serializers import (
    ChatRoomSerializer,
    ChatRoomCreateSerializer,
    MessageSerializer,
    AIResponseSerializer
)
from django.db.models import Q, F, Max, Count
from django.utils import timezone
from ai_model.ml.prediction import get_diagnosis
import json
import logging

# Set up logging
logger = logging.getLogger(__name__)


class IsChatParticipant(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Check if user is a participant in the chat room
        if isinstance(obj, ChatRoom):
            return request.user in obj.participants.all()

        # Check for messages within chat rooms
        if isinstance(obj, Message):
            return request.user in obj.chat_room.participants.all()

        return False


class ChatRoomViewSet(viewsets.ModelViewSet):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated, IsChatParticipant]

    def get_serializer_class(self):
        if self.action == 'create':
            return ChatRoomCreateSerializer
        return ChatRoomSerializer

    def get_queryset(self):
        return ChatRoom.objects.filter(participants=self.request.user).annotate(
            last_message_time=Max('messages__sent_at')
        ).order_by(F('last_message_time').desc(nulls_last=True))

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        chat_room = self.get_object()
        messages = chat_room.messages.all()

        # Mark messages as read
        unread_messages = messages.filter(is_read=False).exclude(sender=request.user)
        unread_messages.update(is_read=True)

        # Paginate results
        page = self.paginate_queryset(messages)
        if page is not None:
            serializer = MessageSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        chat_room = self.get_object()
        content = request.data.get('content')

        if not content:
            return Response(
                {"detail": "Message content cannot be empty."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create the user message
        message = Message.objects.create(
            chat_room=chat_room,
            sender=request.user,
            content=content
        )

        # If this is an AI chat, generate AI response
        if chat_room.is_ai_chat:
            try:
                ai_response = self._generate_ai_response(content, request.user)

                # Create AI message
                ai_message = Message.objects.create(
                    chat_room=chat_room,
                    content=ai_response,
                    is_ai_message=True
                )

                # Include AI response in the returned data
                return Response({
                    "user_message": MessageSerializer(message).data,
                    "ai_response": MessageSerializer(ai_message).data
                })

            except Exception as e:
                logger.error(f"Error generating AI response: {str(e)}")
                # Return just the user message if AI response fails
                return Response({
                    "user_message": MessageSerializer(message).data,
                    "error": "Failed to generate AI response"
                })

        serializer = MessageSerializer(message)
        return Response(serializer.data)

    def _generate_ai_response(self, query, user):
        """
        Enhanced AI response generation using the existing diagnosis model
        """
        # Extract symptoms from query using keyword matching
        # This is a simplified approach - in production, use NLP
        symptom_values = self._extract_symptoms_from_query(query)

        # If we detected symptoms, use the diagnosis model
        if sum(symptom_values) > 0:
            try:
                # Use the existing diagnosis model
                result = get_diagnosis(symptom_values)

                # Format the response
                confidence = int(result['confidence'] * 100)
                response = f"Based on your symptoms, I think you may have **{result['diagnosis']}** with a confidence of {confidence}%.\n\n"

                if result['test_recommendation']:
                    response += f"**Recommended tests:** {result['test_recommendation']}\n\n"

                if result['medicine_recommendation']:
                    response += f"**Medication recommendations:** {result['medicine_recommendation']}\n\n"

                # Add disclaimer
                response += "Please note that this is just an AI assessment and not a professional medical diagnosis. Always consult with a healthcare provider for proper medical advice."

                # Save AI response for analytics
                AIResponse.objects.create(
                    query=query,
                    response=response,
                    user=user
                )

                return response

            except Exception as e:
                logger.error(f"Error in diagnosis algorithm: {str(e)}")
                return "I apologize, but I encountered an issue while analyzing your symptoms. Please try describing them differently or consult with a healthcare provider."

        # Handle general health queries
        lower_query = query.lower()

        # Check for greeting
        if any(greeting in lower_query for greeting in ['hello', 'hi', 'hey', 'greetings']):
            return "Hello! I'm your health assistant. How can I help you today? You can describe your symptoms or ask health-related questions."

        # Check for gratitude
        if any(thanks in lower_query for thanks in ['thank', 'thanks', 'appreciate']):
            return "You're welcome! Is there anything else I can help you with regarding your health concerns?"

        # Check for specific health topics
        if 'covid' in lower_query or 'coronavirus' in lower_query:
            return "COVID-19 is a respiratory illness caused by the SARS-CoV-2 virus. Common symptoms include fever, cough, and fatigue. If you're experiencing these symptoms, please consider getting tested and follow your local health guidelines."

        if 'diet' in lower_query or 'nutrition' in lower_query or 'healthy eating' in lower_query:
            return "A balanced diet typically includes a variety of fruits, vegetables, whole grains, lean proteins, and healthy fats. It's recommended to limit processed foods, sugars, and excessive salt. Would you like more specific nutritional advice?"

        if 'exercise' in lower_query or 'workout' in lower_query or 'physical activity' in lower_query:
            return "Regular physical activity is important for good health. Adults should aim for at least 150 minutes of moderate exercise or 75 minutes of vigorous exercise weekly, plus muscle-strengthening activities. Always start gradually if you're new to exercise."

        if 'sleep' in lower_query or 'insomnia' in lower_query or 'tired' in lower_query:
            return "Good sleep is essential for health. Adults typically need 7-9 hours of quality sleep. Establishing a regular sleep schedule, creating a restful environment, and avoiding screens before bedtime can help improve sleep quality."

        # Default response for other health queries
        return "To provide you with more specific health information, could you please share more details about your symptoms or health concerns? This will help me give you more relevant information. Remember, I'm here to provide general health information, but I can't replace professional medical advice."

    def _extract_symptoms_from_query(self, query):
        """
        Extract symptom values from user query
        Returns a list of binary values (0 or 1) for each symptom
        """
        # Default all symptoms to 0 (not present)
        symptom_values = [0] * 9  # Assuming 9 symptoms in the model

        lower_query = query.lower()

        # Simple keyword matching for symptoms
        # In a real application, use NLP for better extraction
        symptom_keywords = {
            'fever': 0,
            'temperature': 0,
            'hot': 0,
            'cough': 1,
            'coughing': 1,
            'headache': 2,
            'head pain': 2,
            'head hurts': 2,
            'sore throat': 3,
            'throat pain': 3,
            'fatigue': 4,
            'tired': 4,
            'exhausted': 4,
            'no energy': 4,
            'taste': 5,
            'smell': 5,
            'eye': 6,
            'itchy eyes': 6,
            'watery eyes': 6,
            'rash': 7,
            'skin irritation': 7,
            'body ache': 8,
            'muscle pain': 8,
            'joint pain': 8,
            'pain': 8,
            'chills': 8,
            'cold': 8
        }

        # Check for each symptom keyword
        for keyword, index in symptom_keywords.items():
            if keyword in lower_query:
                symptom_values[index] = 1

        return symptom_values


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated, IsChatParticipant]

    def get_queryset(self):
        return Message.objects.filter(
            chat_room__participants=self.request.user
        )

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        message = self.get_object()

        if not message.is_read and message.sender != request.user:
            message.is_read = True
            message.save()

        return Response({"status": "Message marked as read"})