from rest_framework import serializers

from apps.wellness.models import EmpathyScenario


class EmpathyScenarioSerializer(serializers.ModelSerializer):
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