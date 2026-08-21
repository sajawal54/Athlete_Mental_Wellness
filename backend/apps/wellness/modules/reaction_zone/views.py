from django.db.models import OuterRef, Subquery
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.wellness.models import (
    ReactionPrompt,
    ReactionGameSession,
    WellnessModule,
)

from .serializers import (
    ReactionPromptSerializer,
    ReactionGameSessionSerializer,
)


# =============================================================
# REACTION ZONE
# =============================================================


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reaction_zone_prompts_view(request):
    """
    Returns all active Reaction Zone prompts.

    Prompts are reusable and can be played again on a new day.
    """

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
    """
    Save a Reaction Zone game session.

    IMPORTANT:
    This endpoint records the module-specific game result only.

    XP is NOT awarded here.

    XP is awarded through the shared Wellness lifecycle:

        ModuleShell
            ↓
        completeModule()
            ↓
        complete_module()
            ↓
        XPHistory
            ↓
        Profile XP

    This prevents duplicate XP and keeps all Wellness modules
    consistent with the shared lifecycle.
    """

    # ---------------------------------------------------------
    # READ INPUT
    # ---------------------------------------------------------

    try:
        score = int(
            request.data.get(
                "score",
                0,
            )
        )

        correct_answers = int(
            request.data.get(
                "correct_answers",
                0,
            )
        )

        total_prompts = int(
            request.data.get(
                "total_prompts",
                5,
            )
        )

        duration_seconds = int(
            request.data.get(
                "duration_seconds",
                10,
            )
        )

    except (TypeError, ValueError):
        return Response(
            {
                "success": False,
                "message": (
                    "Score values must be valid numbers."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # ---------------------------------------------------------
    # SANITIZE VALUES
    # ---------------------------------------------------------

    score = max(score, 0)

    total_prompts = max(
        total_prompts,
        1,
    )

    correct_answers = max(
        correct_answers,
        0,
    )

    duration_seconds = max(
        duration_seconds,
        0,
    )

    # Correct answers can never exceed total prompts.
    correct_answers = min(
        correct_answers,
        total_prompts,
    )

    # ---------------------------------------------------------
    # SAVE GAME SESSION
    # ---------------------------------------------------------

    session = ReactionGameSession.objects.create(
        user=request.user,
        score=score,
        total_prompts=total_prompts,
        correct_answers=correct_answers,
        duration_seconds=duration_seconds,
        status="completed",
        completed_at=timezone.now(),
    )

    # ---------------------------------------------------------
    # GET MODULE XP INFORMATION
    # ---------------------------------------------------------
    #
    # We DO NOT award XP here.
    #
    # This is only informational so frontend knows how much
    # XP the shared completion lifecycle can award.
    #
    # Actual awarded XP comes from complete_module().
    # ---------------------------------------------------------

    module = (
        WellnessModule.objects
        .filter(
            slug="word-grid"
        )
        .first()
    )

    # The above lookup is intentionally NOT used for awarding XP.
    # Reaction Zone has its own module slug.
    #
    # Find it safely below.

    reaction_module = (
        WellnessModule.objects
        .filter(
            module_type="reaction_zone",
            status="active",
        )
        .first()
    )

    module_xp_reward = (
        int(reaction_module.xp_reward or 0)
        if reaction_module
        else 0
    )

    # ---------------------------------------------------------
    # RESPONSE
    # ---------------------------------------------------------

    return Response(
        {
            "success": True,
            "message": (
                "Reaction Zone score submitted successfully."
            ),
            "score": session.score,
            "correct_answers": session.correct_answers,
            "total_prompts": session.total_prompts,
            "duration_seconds": session.duration_seconds,
            "session_id": session.id,

            # IMPORTANT:
            # This is NOT awarded XP.
            # It is only the module's configured reward.
            "module_xp_reward": module_xp_reward,

            # Actual XP must come from the shared completion API.
            "xp_awarded": 0,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reaction_zone_leaderboard_view(request):
    """
    Returns the top 10 users based on their best
    Reaction Zone score.
    """

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