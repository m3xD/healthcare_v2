from rest_framework import serializers
from ..models import ChatRoom, Message, AIResponse
from django.contrib.auth.models import User


class ChatParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'chat_room', 'sender', 'sender_name', 'content',
                  'is_ai_message', 'related_diagnosis', 'sent_at', 'is_read']
        read_only_fields = ['sent_at']

    def get_sender_name(self, obj):
        if obj.is_ai_message:
            return "AI Assistant"
        if obj.sender:
            return f"{obj.sender.first_name} {obj.sender.last_name}".strip() or obj.sender.username
        return "Unknown"


class ChatRoomSerializer(serializers.ModelSerializer):
    participants = ChatParticipantSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = ['id', 'participants', 'title', 'is_ai_chat',
                  'is_active', 'created_at', 'updated_at',
                  'last_message', 'unread_count']
        read_only_fields = ['created_at', 'updated_at']

    def get_last_message(self, obj):
        last_msg = obj.last_message
        if last_msg:
            content = last_msg.content or ""
            return {
                'content': content[:50] + ('...' if len(content) > 50 else ''),
                'sender': last_msg.sender.username if last_msg.sender else 'AI',
                'sent_at': last_msg.sent_at,
                'is_ai_message': last_msg.is_ai_message
            }
        return None

    def get_unread_count(self, obj):
        user = self.context.get('request').user
        return obj.messages.filter(is_read=False).exclude(sender=user).count()


class ChatRoomCreateSerializer(serializers.ModelSerializer):
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True
    )

    class Meta:
        model = ChatRoom
        fields = ['title', 'is_ai_chat', 'participant_ids']

    def create(self, validated_data):
        participant_ids = validated_data.pop('participant_ids')

        # Create the chat room
        chat_room = ChatRoom.objects.create(**validated_data)

        # Add the current user as a participant
        current_user = self.context['request'].user
        chat_room.participants.add(current_user)

        # Add other participants
        for user_id in participant_ids:
            try:
                user = User.objects.get(id=user_id)
                chat_room.participants.add(user)
            except User.DoesNotExist:
                pass

        return chat_room


class AIResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIResponse
        fields = ['id', 'query', 'response', 'created_at', 'user', 'diagnosis']
        read_only_fields = ['created_at']