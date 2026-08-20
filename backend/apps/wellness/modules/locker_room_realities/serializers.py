from rest_framework import serializers

from apps.wellness.models import LockerRoomScenario


class LockerRoomScenarioSerializer(serializers.ModelSerializer):

    class Meta:
        model = LockerRoomScenario

        fields = [
            "id",
            "title",
            "situation",
            "question",
            "choices",
            "explanation",
            "difficulty",
            "order",
        ]