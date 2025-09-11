from rest_framework import serializers
from .models import Chat, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "role", "content", "timestamp", "tokens_used"]
        read_only_fields = ["id", "timestamp"]


class ChatSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Chat
        fields = [
            "id",
            "title",
            "created_at",
            "updated_at",
            "messages",
            "message_count",
            "last_message",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_message_count(self, obj):
        """Return the total number of messages in the chat"""
        return obj.messages.count()

    def get_last_message(self, obj):
        """Return the last message in the chat for preview"""
        last_message = obj.messages.filter(role__in=["user", "assistant"]).last()
        if last_message:
            return {
                "content": (
                    last_message.content[:100] + "..."
                    if len(last_message.content) > 100
                    else last_message.content
                ),
                "role": last_message.role,
                "timestamp": last_message.timestamp,
            }
        return None


class ChatListSerializer(serializers.ModelSerializer):
    """Lighter serializer for listing chats without all messages"""

    message_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Chat
        fields = [
            "id",
            "title",
            "created_at",
            "updated_at",
            "message_count",
            "last_message",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_message_count(self, obj):
        return obj.messages.count()

    def get_last_message(self, obj):
        last_message = obj.messages.filter(role__in=["user", "assistant"]).last()
        if last_message:
            return {
                "content": (
                    last_message.content[:100] + "..."
                    if len(last_message.content) > 100
                    else last_message.content
                ),
                "role": last_message.role,
                "timestamp": last_message.timestamp,
            }
        return None


class MessageCreateSerializer(serializers.Serializer):
    """Serializer for creating new messages"""

    message = serializers.CharField(max_length=2000)

    def validate_message(self, value):
        if not value.strip():
            raise serializers.ValidationError("Message cannot be empty")
        return value.strip()
