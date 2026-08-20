from rest_framework import serializers

from apps.wellness.models import ReactionPrompt, ReactionGameSession


class ReactionPromptSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReactionPrompt
        fields = [
            "id",
            "prompt",
            "correct_answer",
            "difficulty",
        ]


class ReactionGameSessionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    class Meta:
        model = ReactionGameSession
        fields = [
            "id",
            "username",
            "score",
            "total_prompts",
            "correct_answers",
            "duration_seconds",
            "completed_at",
        ]