from rest_framework import serializers

from .models import BreathworkSession


class BreathworkSessionSerializer(
    serializers.ModelSerializer
):

    duration_seconds = serializers.SerializerMethodField()

    remaining_seconds = serializers.SerializerMethodField()

    class Meta:
        model = BreathworkSession

        fields = [
            "id",
            "duration_minutes",
            "duration_seconds",
            "elapsed_seconds",
            "remaining_seconds",
            "status",
            "started_at",
            "paused_at",
            "completed_at",
        ]

        read_only_fields = [
            "id",
            "duration_seconds",
            "remaining_seconds",
            "status",
            "started_at",
            "paused_at",
            "completed_at",
        ]

    def get_duration_seconds(self, obj):

        return obj.duration_minutes * 60

    def get_remaining_seconds(self, obj):

        total = obj.duration_minutes * 60

        remaining = total - obj.elapsed_seconds

        return max(0, remaining)