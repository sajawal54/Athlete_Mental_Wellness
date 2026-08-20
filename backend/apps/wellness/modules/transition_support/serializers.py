from rest_framework import serializers

from apps.wellness.models import (
    TransitionResource,
    ResourceView,
)


class TransitionResourceSerializer(serializers.ModelSerializer):
    is_viewed = serializers.SerializerMethodField()

    class Meta:
        model = TransitionResource
        fields = [
            "id",
            "title",
            "description",
            "content",
            "resource_type",
            "category",
            "file",
            "order",
            "is_viewed",
        ]

    def get_is_viewed(self, obj):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return False

        return ResourceView.objects.filter(
            user=request.user,
            resource=obj,
        ).exists()