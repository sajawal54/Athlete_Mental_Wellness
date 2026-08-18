from rest_framework import serializers

from .models import (
    TransitionResource,
    ResourceView,
)


class TransitionResourceSerializer(
    serializers.ModelSerializer
):

    viewed = serializers.SerializerMethodField()

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
            "is_active",
            "order",
            "viewed",
            "created_at",
        ]

    def get_viewed(self, obj):

        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return False

        return ResourceView.objects.filter(
            user=request.user,
            resource=obj,
        ).exists()


class ResourceViewSerializer(
    serializers.ModelSerializer
):

    resource_title = serializers.CharField(
        source="resource.title",
        read_only=True,
    )

    class Meta:
        model = ResourceView

        fields = [
            "id",
            "resource",
            "resource_title",
            "viewed_at",
        ]

        read_only_fields = [
            "id",
            "viewed_at",
        ]