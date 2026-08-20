from rest_framework import serializers

from apps.wellness.models import (
    WordGridPuzzle,
    WordGridScore,
)


class WordGridPuzzleSerializer(serializers.ModelSerializer):
    class Meta:
        model = WordGridPuzzle
        fields = [
            "id",
            "puzzle_date",
            "title",
            "theme",
            "grid",
            "target_words",
        ]


class WordGridScoreSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    class Meta:
        model = WordGridScore
        fields = [
            "id",
            "username",
            "words_found",
            "time_taken_seconds",
            "score",
            "completed_at",
        ]