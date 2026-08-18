from rest_framework import serializers

from .models import GritGardenSession


class GritGardenSessionSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = GritGardenSession

        fields = [
            "id",
            "exercise_type",
            "journal_text",
            "exercise_response",
            "status",
            "created_at",
            "updated_at",
            "completed_at",
        ]

        read_only_fields = [
            "id",
            "status",
            "created_at",
            "updated_at",
            "completed_at",
        ]


class GritGardenCreateSerializer(
    serializers.Serializer
):

    exercise_type = serializers.ChoiceField(
        choices=[
            "reflection",
            "stress_release",
            "gratitude",
        ]
    )

    journal_text = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=5000,
    )

    exercise_response = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=5000,
    )