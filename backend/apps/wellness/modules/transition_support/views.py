from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.wellness.models import (
    TransitionResource,
    ResourceView,
)

from .serializers import TransitionResourceSerializer


# =============================================================
# TRANSITION SUPPORT
# =============================================================


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def transition_resources_view(request):
    category = request.query_params.get("category")

    resources = (
        TransitionResource.objects
        .filter(is_active=True)
        .order_by("order")
    )

    if category:
        resources = resources.filter(
            category=category
        )

    serializer = TransitionResourceSerializer(
        resources,
        many=True,
        context={"request": request},
    )

    return Response(
        {
            "success": True,
            "resources": serializer.data,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def transition_resource_mark_viewed_view(
    request,
    resource_id,
):
    try:
        resource = TransitionResource.objects.get(
            id=resource_id,
            is_active=True,
        )

    except TransitionResource.DoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Resource not found.",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    ResourceView.objects.get_or_create(
        user=request.user,
        resource=resource,
    )

    return Response(
        {
            "success": True,
            "message": "Resource marked as viewed.",
            "resource_id": resource.id,
        },
        status=status.HTTP_200_OK,
    )