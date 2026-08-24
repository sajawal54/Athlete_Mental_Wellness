from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.wellness.models import (
    TransitionResource,
    ResourceView,
)

from apps.wellness.services import (
    complete_module,
    get_module_by_slug,
)

from apps.notifications.services import (
    create_wellness_notification,
)

from .serializers import TransitionResourceSerializer


# =============================================================
# WELLNESS NOTIFICATION HELPER
# =============================================================

def notify_wellness_completion(
    user,
    title,
    message,
    action_url="/modules",
):
    return create_wellness_notification(
        user=user,
        title=title,
        message=message,
        action_url=action_url,
    )


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

    # Robust module lookup with slug fallbacks
    module = get_module_by_slug("transition-support")
    if not module:
        module = get_module_by_slug("transition_support")

    xp_awarded = 0

    if module:
        result = complete_module(
            user=request.user,
            module=module,
            score=100,
        )

        xp_awarded = int(
            result.get("xp_awarded") 
            or module.xp_reward 
            or 0
        )

        if xp_awarded == 0 and module.xp_reward:
            xp_awarded = int(module.xp_reward)

        if xp_awarded > 0:
            notify_wellness_completion(
                user=request.user,
                title="Transition Resource Explored!",
                message=f"You earned {xp_awarded} XP!",
                action_url="/modules",
            )
    else:
        xp_awarded = 15  # Fallback XP

    return Response(
        {
            "success": True,
            "message": f"Resource marked as viewed. You earned {xp_awarded} XP!",
            "resource_id": resource.id,
            "xp_awarded": xp_awarded,
        },
        status=status.HTTP_200_OK,
    )