from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.wellness.models import ReframeSession

from apps.wellness.modules.setback_reframer.serializers import (
    ReframeSessionSerializer,
)

from apps.wellness.services import (
    complete_module,
    generate_setback_reframe,
    get_module_by_slug,
)

from apps.notifications.services import (
    create_wellness_notification,
)


def notify_wellness_completion(
    user,
    title,
    message,
    action_url="/modules",
):
    """
    Creates a Wellness notification for the user.
    """

    return create_wellness_notification(
        user=user,
        title=title,
        message=message,
        action_url=action_url,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def setback_reframe_generate_view(request):
    """
    Generates an AI-based reframe for a user's
    negative thought or setback.

    The generated result is saved as a ReframeSession.
    """

    thought = request.data.get(
        "negative_thought",
        "",
    ).strip()

    category = request.data.get(
        "category",
        "performance",
    )

    if not thought:
        return Response(
            {
                "success": False,
                "message": (
                    "Please describe the setback or thought."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        result = generate_setback_reframe(
            thought,
            category,
        )

    except Exception as exc:
        return Response(
            {
                "success": False,
                "message": (
                    "Unable to generate a reframe right now."
                ),
                "error": str(exc),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    session = ReframeSession.objects.create(
        user=request.user,
        negative_thought=thought,
        reframe=result["reframe"],
        safety_message=result["safety_message"],
        status="completed",
        completed_at=timezone.now(),
    )

    module = get_module_by_slug(
        "setback-reframer"
    )

    xp_awarded = 0

    if module:
        completion_result = complete_module(
            user=request.user,
            module=module,
            session=None,
            score=100,
        )

        xp_awarded = completion_result.get(
            "xp_awarded",
            0,
        )

        if xp_awarded > 0:
            notify_wellness_completion(
                user=request.user,
                title="Setback Reframed!",
                message=(
                    f"You earned {xp_awarded} XP "
                    "for completing Setback Reframer!"
                ),
                action_url="/modules",
            )

    return Response(
        {
            "success": True,
            "reframe": result["reframe"],
            "action_step": result["action_step"],
            "safety_message": result["safety_message"],
            "session_id": session.id,
            "xp_awarded": xp_awarded,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def setback_reframe_history_view(request):
    """
    Returns the user's latest 10 Setback Reframer sessions.
    """

    sessions = (
        ReframeSession.objects
        .filter(user=request.user)
        .order_by("-created_at")[:10]
    )

    serializer = ReframeSessionSerializer(
        sessions,
        many=True,
    )

    return Response(
        {
            "success": True,
            "history": serializer.data,
        },
        status=status.HTTP_200_OK,
    )