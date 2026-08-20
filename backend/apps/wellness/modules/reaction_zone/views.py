from django.db.models import OuterRef, Subquery
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.gamification.service import award_xp

from apps.notifications.services import (
    create_wellness_notification,
)

from apps.wellness.models import (
    ReactionPrompt,
    ReactionGameSession,
)

from apps.wellness.services import (
    complete_module,
    get_module_by_slug,
)

from .serializers import (
    ReactionPromptSerializer,
    ReactionGameSessionSerializer,
)


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
# REACTION ZONE
# =============================================================


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reaction_zone_prompts_view(request):
    prompts = (
        ReactionPrompt.objects
        .filter(is_active=True)
        .order_by("id")
    )

    serializer = ReactionPromptSerializer(
        prompts,
        many=True,
    )

    return Response(
        {
            "success": True,
            "prompts": serializer.data,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reaction_zone_submit_score_view(request):
    try:
        score = int(
            request.data.get(
                "score",
                0,
            )
        )

        correct = int(
            request.data.get(
                "correct_answers",
                0,
            )
        )

        total = int(
            request.data.get(
                "total_prompts",
                5,
            )
        )

        duration = int(
            request.data.get(
                "duration_seconds",
                10,
            )
        )

    except (TypeError, ValueError):
        return Response(
            {
                "success": False,
                "message": "Score values must be valid numbers.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Prevent invalid negative values
    score = max(score, 0)
    correct = max(correct, 0)
    total = max(total, 1)
    duration = max(duration, 0)

    # Correct answers cannot exceed total prompts
    correct = min(correct, total)

    session = ReactionGameSession.objects.create(
        user=request.user,
        score=score,
        correct_answers=correct,
        total_prompts=total,
        duration_seconds=duration,
        status="completed",
        completed_at=timezone.now(),
    )

    module = get_module_by_slug(
        "reaction-zone"
    )

    xp_awarded = 0

    if module:
        result = complete_module(
            user=request.user,
            module=module,
            score=score,
        )

        xp_awarded = result.get(
            "xp_awarded",
            0,
        )

        if xp_awarded > 0:
            notify_wellness_completion(
                user=request.user,
                title="Reaction Zone Score Saved!",
                message=(
                    f"You earned {xp_awarded} XP "
                    "for playing Reaction Zone!"
                ),
                action_url="/modules",
            )

    return Response(
        {
            "success": True,
            "message": "Reaction score submitted!",
            "score": score,
            "correct_answers": correct,
            "total_prompts": total,
            "duration_seconds": duration,
            "session_id": session.id,
            "xp_awarded": xp_awarded,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reaction_zone_leaderboard_view(request):
    # Best score for each user
    best_session_ids = (
        ReactionGameSession.objects
        .filter(
            user=OuterRef("user")
        )
        .order_by(
            "-score",
            "duration_seconds",
            "created_at",
        )
        .values("id")[:1]
    )

    top_scores = (
        ReactionGameSession.objects
        .filter(
            id=Subquery(best_session_ids)
        )
        .select_related("user")
        .order_by(
            "-score",
            "duration_seconds",
        )[:10]
    )

    serializer = ReactionGameSessionSerializer(
        top_scores,
        many=True,
    )

    return Response(
        {
            "success": True,
            "leaderboard": serializer.data,
        },
        status=status.HTTP_200_OK,
    )