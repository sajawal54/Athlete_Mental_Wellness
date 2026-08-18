from rest_framework.decorators import (
    api_view,
    permission_classes,
)

from rest_framework.permissions import IsAuthenticated

from rest_framework.response import Response

from rest_framework import status

from .serializers import (
    CodexCategorySerializer,
    CodexLessonSerializer,
    UserLessonProgressSerializer,
)

from .services import (
    get_categories,
    get_lesson_by_id,
    get_lesson_progress,
    start_lesson,
    update_lesson_progress,
    complete_lesson,
)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def codex_categories(request):
    """
    Return Codex categories and lessons.
    """

    categories = get_categories()

    serializer = CodexCategorySerializer(
        categories,
        many=True,
        context={"request": request},
    )

    return Response(
        {
            "success": True,
            "categories": serializer.data,
        }
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def codex_lesson_detail(request, lesson_id):
    """
    Return a single Codex lesson.
    """

    lesson = get_lesson_by_id(
        lesson_id
    )

    if not lesson:
        return Response(
            {
                "success": False,
                "message": "Lesson not found.",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = CodexLessonSerializer(
        lesson,
        context={"request": request},
    )

    return Response(
        {
            "success": True,
            "lesson": serializer.data,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def codex_start_lesson(request, lesson_id):
    """
    Start a Codex lesson.
    """

    lesson = get_lesson_by_id(
        lesson_id
    )

    if not lesson:
        return Response(
            {
                "success": False,
                "message": "Lesson not found.",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    try:

        progress = start_lesson(
            request.user,
            lesson,
        )

    except ValueError as error:

        return Response(
            {
                "success": False,
                "message": str(error),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = UserLessonProgressSerializer(
        progress
    )

    return Response(
        {
            "success": True,
            "message": "Lesson started.",
            "progress": serializer.data,
        }
    )


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def codex_update_progress(
    request,
    lesson_id,
):
    """
    Update lesson progress.
    """

    lesson = get_lesson_by_id(
        lesson_id
    )

    if not lesson:
        return Response(
            {
                "success": False,
                "message": "Lesson not found.",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    progress_value = request.data.get(
        "progress"
    )

    if progress_value is None:
        return Response(
            {
                "success": False,
                "message": "progress is required.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:

        progress = update_lesson_progress(
            request.user,
            lesson,
            progress_value,
        )

    except ValueError as error:

        return Response(
            {
                "success": False,
                "message": str(error),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = UserLessonProgressSerializer(
        progress
    )

    return Response(
        {
            "success": True,
            "progress": serializer.data,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def codex_complete_lesson(
    request,
    lesson_id,
):
    """
    Complete a Codex lesson.
    """

    lesson = get_lesson_by_id(
        lesson_id
    )

    if not lesson:
        return Response(
            {
                "success": False,
                "message": "Lesson not found.",
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    try:

        result = complete_lesson(
            request.user,
            lesson,
        )

    except ValueError as error:

        return Response(
            {
                "success": False,
                "message": str(error),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    serializer = UserLessonProgressSerializer(
        result["progress"]
    )

    return Response(
        {
            "success": True,
            "message": (
                "Lesson completed."
                if not result["already_completed"]
                else "Lesson was already completed."
            ),
            "already_completed": result[
                "already_completed"
            ],
            "xp_awarded": result["xp_awarded"],
            "progress": serializer.data,
        }
    )