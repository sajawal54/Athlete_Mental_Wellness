from rest_framework import serializers

from .models import ReframeSession


class ReframeSessionSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = ReframeSession

        fields = [
            "id",
            "negative_thought",
            "reframe",
            "safety_message",
            "status",
            "created_at",
            "completed_at",
        ]

        read_only_fields = [
            "id",
            "reframe",
            "safety_message",
            "status",
            "created_at",
            "completed_at",
        ]


class ReframeCreateSerializer(
    serializers.Serializer
):

    negative_thought = serializers.CharField(
        min_length=3,
        max_length=2000,
    )