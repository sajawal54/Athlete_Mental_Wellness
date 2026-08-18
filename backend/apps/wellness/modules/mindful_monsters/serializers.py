from rest_framework import serializers

from .models import (
    MindfulMonsterStep,
    MindfulMonsterSession,
)


class MindfulMonsterStepSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = MindfulMonsterStep

        fields = [
            "id",
            "title",
            "instruction",
            "phase",
            "duration_seconds",
            "order",
        ]


class MindfulMonsterSessionSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = MindfulMonsterSession

        fields = [
            "id",
            "current_step",
            "completed_steps",
            "total_steps",
            "status",
            "started_at",
            "completed_at",
        ]

        read_only_fields = [
            "id",
            "total_steps",
            "status",
            "started_at",
            "completed_at",
        ]