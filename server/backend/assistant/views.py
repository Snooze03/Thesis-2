from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Chat, Message
from .llm_service import FitnessAssistant
from .serializers import ChatSerializer, MessageSerializer


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def chats(request):
    if request.method == "GET":
        user_chats = Chat.objects.filter(user=request.user)
        serializer = ChatSerializer(user_chats, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        chat = Chat.objects.create(
            user=request.user, title=request.data.get("title", "New Chat")
        )
        serializer = ChatSerializer(chat)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_message(request, chat_id):
    try:
        chat = Chat.objects.get(id=chat_id, user=request.user)
        user_message = request.data.get("message")

        if not user_message:
            return Response(
                {"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Get user profile for context
        user_profile = getattr(request.user, "profile", None)

        # Generate AI response (now sync)
        assistant = FitnessAssistant()
        result = assistant.generate_response(chat_id, user_message, user_profile)

        if result["success"]:
            # Return updated chat with messages
            messages = chat.messages.all()
            serializer = MessageSerializer(messages, many=True)
            return Response(
                {
                    "messages": serializer.data,
                    "tokens_used": result.get("tokens_used", 0),
                }
            )
        else:
            return Response(
                {"error": result["error"]}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    except Chat.DoesNotExist:
        return Response({"error": "Chat not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Error in send_message: {e}")
        return Response(
            {"error": "Internal server error"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def chat_messages(request, chat_id):
    try:
        chat = Chat.objects.get(id=chat_id, user=request.user)
        messages = chat.messages.all()
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)
    except Chat.DoesNotExist:
        return Response({"error": "Chat not found"}, status=status.HTTP_404_NOT_FOUND)
