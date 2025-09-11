from django.urls import path
from . import views

app_name = "assistant"

urlpatterns = [
    # Chat management
    path("chats/", views.chats, name="chats"),
    path(
        "chats/<int:chat_id>/messages/",
        views.chat_messages,
        name="chat_messages",
    ),
    path(
        "chats/<int:chat_id>/send/",
        views.send_message,
        name="send_message",
    ),
]
