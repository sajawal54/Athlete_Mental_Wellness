from rest_framework import serializers

from apps.wellness.models import BreathworkSession


class BreathworkSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BreathworkSession
        fields = [
            "id",
            "duration_minutes",
            "elapsed_seconds",
            "status",
            "started_at",
            "completed_at",
        ]