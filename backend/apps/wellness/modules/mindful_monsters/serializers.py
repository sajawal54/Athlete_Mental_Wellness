from rest_framework import serializers

from apps.wellness.models import MindfulMonsterStep


class MindfulMonsterStepSerializer(serializers.ModelSerializer):
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