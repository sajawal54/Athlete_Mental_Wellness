from rest_framework import serializers

from apps.wellness.models import SelfTalkEntry


class SelfTalkEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = SelfTalkEntry
        fields = [
            "id",
            "negative_thought",
            "distortion_type",
            "analysis",
            "suggested_rewrite",
            "actionable_tip",
            "created_at",
        ]