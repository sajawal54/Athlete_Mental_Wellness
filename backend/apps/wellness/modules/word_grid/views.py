from django.db.models import OuterRef, Subquery
from django.utils import timezone

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.wellness.models import (
    WordGridPuzzle,
    WordGridScore,
)

from apps.wellness.services import (
    complete_module,
    get_module_by_slug,
)

from apps.notifications.services import (
    create_wellness_notification,
)

from .serializers import (
    WordGridPuzzleSerializer,
    WordGridScoreSerializer,
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
# WORD GRID
# =============================================================


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def word_grid_daily_view(request):
    today = timezone.localdate()

    puzzle = (
        WordGridPuzzle.objects
        .filter(
            is_active=True,
            puzzle_date=today,
        )
        .first()
    )

    # ---------------------------------------------------------
    # Fallback: use any active puzzle if today's puzzle
    # doesn't exist.
    # ---------------------------------------------------------

    if not puzzle:
        puzzle = (
            WordGridPuzzle.objects
            .filter(is_active=True)
            .order_by("-puzzle_date")
            .first()
        )

    # ---------------------------------------------------------
    # Create default puzzle if none exists
    # ---------------------------------------------------------

    if not puzzle:
        puzzle = WordGridPuzzle.objects.create(
            puzzle_date=today,
            title="Athlete Mental Focus",
            theme="Mindset & Resilience",
            grid=[
                ["F", "O", "C", "U", "S", "M"],
                ["R", "E", "S", "E", "T", "I"],
                ["G", "R", "I", "T", "P", "N"],
                ["C", "A", "L", "M", "E", "D"],
                ["P", "O", "W", "E", "R", "S"],
                ["Z", "O", "N", "E", "A", "T"],
            ],
            target_words=[
                {
                    "word": "FOCUS",
                    "hint": (
                        "Concentration on the present task"
                    ),
                },
                {
                    "word": "GRIT",
                    "hint": (
                        "Passion and sustained perseverance"
                    ),
                },
                {
                    "word": "RESET",
                    "hint": (
                        "Quickly clearing the mind after an error"
                    ),
                },
                {
                    "word": "CALM",
                    "hint": (
                        "Maintaining physiological composure"
                    ),
                },
                {
                    "word": "POWER",
                    "hint": (
                        "Internal strength and explosiveness"
                    ),
                },
                {
                    "word": "ZONE",
                    "hint": (
                        "Optimal state of athletic flow"
                    ),
                },
            ],
        )

    user_score = (
        WordGridScore.objects
        .filter(
            user=request.user,
            puzzle=puzzle,
        )
        .first()
    )

    return Response(
        {
            "success": True,
            "puzzle": WordGridPuzzleSerializer(
                puzzle
            ).data,
            "user_score": (
                WordGridScoreSerializer(
                    user_score
                ).data
                if user_score
                else None
            ),
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def word_grid_submit_view(request):
    puzzle_id = request.data.get(
        "puzzle_id"
    )

    if not puzzle_id:
        return Response(
            {
                "success": False,
                "message": "puzzle_id is required.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    words_found = request.data.get(
        "words_found",
        [],
    )

    if not isinstance(words_found, list):
        return Response(
            {
                "success": False,
                "message": "words_found must be a list.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        time_taken = int(
            request.data.get(
                "time_taken_seconds",
                60,
            )
        )

        score = int(
            request.data.get(
                "score",
                len(words_found) * 50,
            )
        )

    except (TypeError, ValueError):
        return Response(
            {
                "success": False,
                "message": (
                    "time_taken_seconds and score "
                    "must be valid integers."
                ),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    time_taken = max(time_taken, 0)
    score = max(score, 0)

    try:
        puzzle = WordGridPuzzle.objects.get(
            id=puzzle_id
        )

    except WordGridPuzzle.DoesNotExist:
        return Response(
            {
                "success": False,
                "message": "Puzzle not found.",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    score_obj, created = (
        WordGridScore.objects.update_or_create(
            user=request.user,
            puzzle=puzzle,
            defaults={
                "words_found": words_found,
                "time_taken_seconds": time_taken,
                "score": score,
            },
        )
    )

    # ---------------------------------------------------------
    # Complete Wellness Module
    # ---------------------------------------------------------

    module = get_module_by_slug(
        "word-grid"
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
                title="Word Grid Solved!",
                message=(
                    f"You earned {xp_awarded} XP!"
                ),
                action_url="/modules",
            )

    return Response(
        {
            "success": True,
            "message": "Word Grid score recorded!",
            "score": score_obj.score,
            "session_id": score_obj.id,
            "xp_awarded": xp_awarded,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def word_grid_leaderboard_view(request):
    # Best score for every user
    best_score_ids = (
        WordGridScore.objects
        .filter(
            user=OuterRef("user")
        )
        .order_by(
            "-score",
            "time_taken_seconds",
            "-completed_at",
        )
        .values("id")[:1]
    )

    top_scores = (
        WordGridScore.objects
        .filter(
            id=Subquery(best_score_ids)
        )
        .select_related(
            "user",
            "puzzle",
        )
        .order_by(
            "-score",
            "time_taken_seconds",
        )[:10]
    )

    serializer = WordGridScoreSerializer(
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