from rest_framework import serializers

from .models import (
    LockerRoomScenario,
    LockerRoomSession,
)


class LockerRoomScenarioSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = LockerRoomScenario

        fields = [
            "id",
            "title",
            "situation",
            "question",
            "choices",
            "difficulty",
            "order",
        ]


class LockerRoomSessionSerializer(
    serializers.ModelSerializer
):

    scenario_title = serializers.CharField(
        source="scenario.title",
        read_only=True
    )

    class Meta:
        model = LockerRoomSession

        fields = [
            "id",
            "scenario",
            "scenario_title",
            "selected_choice",
            "score",
            "evaluation",
            "status",
            "created_at",
            "completed_at",
        ]

        read_only_fields = [
            "id",
            "scenario_title",
            "score",
            "evaluation",
            "status",
            "created_at",
            "completed_at",
        ]


class LockerRoomDecisionSerializer(
    serializers.Serializer
):

    choice = serializers.IntegerField(
        min_value=0
    )