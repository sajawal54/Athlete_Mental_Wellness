from rest_framework import serializers

from .models import (
    EmpathyScenario,
    EmpathySession,
)


class EmpathyScenarioSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = EmpathyScenario

        fields = [
            "id",
            "title",
            "situation",
            "prompt",
            "difficulty",
            "order",
        ]


class EmpathySessionSerializer(
    serializers.ModelSerializer
):

    scenario_title = serializers.CharField(
        source="scenario.title",
        read_only=True,
    )

    class Meta:
        model = EmpathySession

        fields = [
            "id",
            "scenario",
            "scenario_title",
            "response",
            "feedback",
            "score",
            "status",
            "created_at",
            "completed_at",
        ]

        read_only_fields = [
            "id",
            "scenario_title",
            "feedback",
            "score",
            "status",
            "created_at",
            "completed_at",
        ]


class EmpathyResponseSerializer(
    serializers.Serializer
):

    scenario_id = serializers.IntegerField()

    response = serializers.CharField(
        min_length=3,
        max_length=3000,
    )