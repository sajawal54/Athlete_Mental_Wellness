from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.wellness.models import SelfTalkEntry

from apps.wellness.services import (
    analyze_self_talk,
    complete_module,
    get_module_by_slug,
)

from apps.notifications.services import (
    create_wellness_notification,
)

from .serializers import SelfTalkEntrySerializer


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
# SELF-TALK DETECTIVE
# =============================================================


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def self_talk_analyze_view(request):
    thought = request.data.get(
        "negative_thought",
        "",
    )

    if not isinstance(thought, str):
        thought = str(thought)

    thought = thought.strip()

    if not thought:
        return Response(
            {
                "success": False,
                "message": (
                    "Please enter a self-talk statement."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        analysis_res = analyze_self_talk(
            thought
        )

    except Exception as exc:
        return Response(
            {
                "success": False,
                "message": (
                    "Unable to analyze the self-talk statement."
                ),
                "error": str(exc),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    entry = SelfTalkEntry.objects.create(
        user=request.user,
        negative_thought=thought,
        distortion_type=analysis_res.get(
            "distortion_type",
            "",
        ),
        analysis=analysis_res.get(
            "analysis",
            "",
        ),
        suggested_rewrite=analysis_res.get(
            "suggested_rewrite",
            "",
        ),
        actionable_tip=analysis_res.get(
            "actionable_tip",
            "",
        ),
    )

    # ---------------------------------------------------------
    # Complete Wellness Module
    # ---------------------------------------------------------

    module = get_module_by_slug(
        "self-talk-detective"
    )

    xp_awarded = 0

    if module:
        result = complete_module(
            user=request.user,
            module=module,
            score=100,
        )

        xp_awarded = result.get(
            "xp_awarded",
            0,
        )

        # -----------------------------------------------------
        # Wellness Notification
        # -----------------------------------------------------

        if xp_awarded > 0:
            notify_wellness_completion(
                user=request.user,
                title="Self-Talk Analysis Completed!",
                message=(
                    f"You earned {xp_awarded} XP!"
                ),
                action_url="/modules",
            )

    return Response(
        {
            "success": True,
            "entry": SelfTalkEntrySerializer(
                entry
            ).data,
            "distortion_label": analysis_res.get(
                "distortion_label",
                "",
            ),
            "xp_awarded": xp_awarded,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def self_talk_history_view(request):
    entries = (
        SelfTalkEntry.objects
        .filter(user=request.user)
        .order_by("-created_at")[:10]
    )

    serializer = SelfTalkEntrySerializer(
        entries,
        many=True,
    )

    return Response(
        {
            "success": True,
            "history": serializer.data,
        },
        status=status.HTTP_200_OK,
    )