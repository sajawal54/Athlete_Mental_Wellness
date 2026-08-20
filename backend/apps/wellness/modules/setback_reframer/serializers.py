from rest_framework import serializers

from apps.wellness.models import ReframeSession


class ReframeSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReframeSession
        fields = [
            "id",
            "negative_thought",
            "reframe",
            "safety_message",
            "status",
            "created_at",
        ]