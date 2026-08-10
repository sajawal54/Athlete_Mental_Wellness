from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):

    class Meta:
        model = Message
        fields = [
            "id",
            "role",
            "content",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "role",
            "created_at",
        ]


class ConversationSerializer(serializers.ModelSerializer):

    messages = MessageSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Conversation
        fields = [
            "id",
            "title",
            "messages",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "messages",
            "created_at",
            "updated_at",
        ]