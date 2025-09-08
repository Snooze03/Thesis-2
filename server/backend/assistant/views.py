from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Conversation, Message
from .llm_service import FitnessAssistant
from .serializers import ConversationSerializer, MessageSerializer


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def conversations(request):
    if request.method == "GET":
        user_conversations = Conversation.objects.filter(user=request.user)
        serializer = ConversationSerializer(user_conversations, many=True)
        return Response(serializer.data)

    elif request.method == "POST":
        conversation = Conversation.objects.create(
            user=request.user, title=request.data.get("title", "New Conversation")
        )
        serializer = ConversationSerializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_message(request, conversation_id):
    try:
        conversation = Conversation.objects.get(id=conversation_id, user=request.user)
        user_message = request.data.get("message")

        if not user_message:
            return Response(
                {"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Get user profile for context
        user_profile = getattr(request.user, "profile", None)

        # Generate AI response (now sync)
        assistant = FitnessAssistant()
        result = assistant.generate_response(
            conversation_id, user_message, user_profile
        )

        if result["success"]:
            # Return updated conversation with messages
            messages = conversation.messages.all()
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

    except Conversation.DoesNotExist:
        return Response(
            {"error": "Conversation not found"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"Error in send_message: {e}")
        return Response(
            {"error": "Internal server error"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def conversation_messages(request, conversation_id):
    try:
        conversation = Conversation.objects.get(id=conversation_id, user=request.user)
        messages = conversation.messages.all()
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)
    except Conversation.DoesNotExist:
        return Response(
            {"error": "Conversation not found"}, status=status.HTTP_404_NOT_FOUND
        )
