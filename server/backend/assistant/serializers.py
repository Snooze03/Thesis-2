from rest_framework import serializers
from .models import Chat, Message


class MessageSerializer(serializers.ModelSerializer):
    timestamp = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Message
        fields = ["id", "role", "content", "timestamp"]


class ChatSerializer(serializers.ModelSerializer):
    last_message = MessageSerializer(read_only=True)

    class Meta:
        model = Chat
        fields = ["id", "title", "created_at", "updated_at", "last_message"]
        read_only_fields = ["created_at", "updated_at"]
