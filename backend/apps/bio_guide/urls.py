from django.urls import path

from .views import (
    ConversationListCreateView,
    ConversationMessageView,
    ConversationDeleteView,
)

urlpatterns = [

    # Get all conversations
    # Create a new conversation
    path(
        "conversations/",
        ConversationListCreateView.as_view(),
        name="conversation-list-create",
    ),

    # Send a message to an existing conversation
    path(
        "conversations/<int:pk>/message/",
        ConversationMessageView.as_view(),
        name="conversation-message",
    ),
    
    path(
    "conversations/<int:pk>/", ConversationDeleteView.as_view(), name="conversation-delete"),

]
