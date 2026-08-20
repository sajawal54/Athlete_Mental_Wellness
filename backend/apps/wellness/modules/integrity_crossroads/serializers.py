from rest_framework import serializers

from apps.wellness.models import IntegrityScenario


class IntegrityScenarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = IntegrityScenario
        fields = [
            "id",
            "title",
            "category",
            "dilemma",
            "choices",
            "explanation",
            "order",
        ]