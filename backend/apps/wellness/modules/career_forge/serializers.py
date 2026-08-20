from rest_framework import serializers

from apps.wellness.models import CareerRoadmap


class CareerRoadmapSerializer(serializers.ModelSerializer):
    class Meta:
        model = CareerRoadmap
        fields = [
            "id",
            "target_role",
            "industry",
            "transferable_skills",
            "milestones",
            "financial_goals",
            "timeline_months",
            "notes",
            "created_at",
            "updated_at",
        ]