from rest_framework import serializers

from .models import (
    ReactionPrompt,
    ReactionGameSession,
)


class ReactionPromptSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = ReactionPrompt

        fields = [
            "id",
            "prompt",
            "difficulty",
        ]


class ReactionGameSessionSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = ReactionGameSession

        fields = [
            "id",
            "score",
            "total_prompts",
            "correct_answers",
            "duration_seconds",
            "status",
            "created_at",
            "completed_at",
        ]

        read_only_fields = [
            "id",
            "score",
            "correct_answers",
            "status",
            "created_at",
            "completed_at",
        ]


class ReactionAnswerSerializer(
    serializers.Serializer
):

    prompt_id = serializers.IntegerField()

    answer = serializers.CharField(
        max_length=100
    )

    reaction_time = serializers.FloatField(
        min_value=0
    )