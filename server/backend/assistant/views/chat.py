from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from ..models import Chat, Message
from ..serializers import ChatSerializer, MessageSerializer
from ..llm_service import LLMService


class ChatViewSet(viewsets.ModelViewSet):
    serializer_class = ChatSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Chat.objects.filter(user=self.request.user).order_by("-updated_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def update(self, request, *args, **kwargs):
        """Handle PATCH requests for renaming chats"""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        """Handle PATCH requests for renaming chats"""
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Handle DELETE requests for deleting chats"""
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["get"])
    def messages(self, request, pk=None):
        """Get messages for a specific chat"""
        chat = self.get_object()
        messages = Message.objects.filter(chat=chat).order_by("created_at")
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def send(self, request, pk=None):
        """Send a message to the chat"""
        chat = self.get_object()
        user_message_content = request.data.get("message")

        if not user_message_content:
            return Response(
                {"error": "Message content is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Create user message
            user_message = Message.objects.create(
                chat=chat, role="user", content=user_message_content
            )

            # Get AI response
            llm_service = LLMService()
            ai_response = llm_service.get_response(user_message_content, chat.id)

            # Create AI message
            ai_message = Message.objects.create(
                chat=chat, role="assistant", content=ai_response
            )

            # Update chat's updated_at timestamp
            chat.save()

            # Return all messages for the chat
            messages = Message.objects.filter(chat=chat).order_by("created_at")
            serializer = MessageSerializer(messages, many=True)

            return Response(
                {
                    "messages": serializer.data,
                    "user_message": MessageSerializer(user_message).data,
                    "ai_message": MessageSerializer(ai_message).data,
                }
            )

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
