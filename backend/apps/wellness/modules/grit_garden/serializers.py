from rest_framework import serializers

from apps.wellness.models import GritGardenSession


class GritGardenSessionSerializer(serializers.ModelSerializer):
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
        ]