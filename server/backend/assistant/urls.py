from django.urls import path
from . import views

app_name = "assistant"

urlpatterns = [
    # Conversation management
    path("conversations/", views.conversations, name="conversations"),
    path(
        "conversations/<int:conversation_id>/messages/",
        views.conversation_messages,
        name="conversation_messages",
    ),
    path(
        "conversations/<int:conversation_id>/send/",
        views.send_message,
        name="send_message",
    ),
]
