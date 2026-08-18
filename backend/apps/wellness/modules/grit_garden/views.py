from rest_framework.decorators import (
    api_view,
    permission_classes,
)

from rest_framework.permissions import IsAuthenticated

from rest_framework.response import Response

from rest_framework import status

from .serializers import (
    GritGardenSessionSerializer,
    GritGardenCreateSerializer,
)

from .services import (
    create_session,
    autosave_session,
    get_history,
    complete_session,
)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def grit_garden_info(request):

    return Response({
        "success": True,
        "module": {
            "name": "Grit Garden",
            "description": (
                "A reflection and stress-release "
                "space for building resilience."
            ),
        },
        "exercises": [
            {
                "type": "reflection",
                "title": "Daily Reflection",
                "description": (
                    "Reflect on a challenge "
                    "and what you learned."
                ),
            },
            {
                "type": "stress_release",
                "title": "Stress Release",
                "description": (
                    "Write down what is "
                    "causing pressure and release it."
                ),
            },
            {
                "type": "gratitude",
                "title": "Gratitude",
                "description": (
                    "Write about something "
                    "positive from today."
                ),
            },
        ],
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_grit_session(request):

    serializer = GritGardenCreateSerializer(
        data=request.data
    )

    if not serializer.is_valid():

        return Response(
            {
                "success": False,
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:

        session = create_session(
            user=request.user,
            exercise_type=serializer.validated_data[
                "exercise_type"
            ],
            journal_text=serializer.validated_data.get(
                "journal_text",
                "",
            ),
            exercise_response=serializer.validated_data.get(
                "exercise_response",
                "",
            ),
        )

    except ValueError as error:

        return Response(
            {
                "success": False,
                "message": str(error),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        {
            "success": True,
            "session": GritGardenSessionSerializer(
                session
            ).data,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def update_grit_session(
    request,
    session_id,
):

    try:

        session = autosave_session(
            user=request.user,
            session_id=session_id,
            journal_text=request.data.get(
                "journal_text"
            ),
            exercise_response=request.data.get(
                "exercise_response"
            ),
        )

    except ValueError as error:

        return Response(
            {
                "success": False,
                "message": str(error),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response({
        "success": True,
        "message": "Progress saved.",
        "session": GritGardenSessionSerializer(
            session
        ).data,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def grit_garden_history(request):

    sessions = get_history(
        request.user
    )

    return Response({
        "success": True,
        "history": GritGardenSessionSerializer(
            sessions,
            many=True,
        ).data,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def complete_grit_session(
    request,
    session_id,
):

    try:

        result = complete_session(
            user=request.user,
            session_id=session_id,
        )

    except ValueError as error:

        return Response(
            {
                "success": False,
                "message": str(error),
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response({
        "success": True,
        "message": (
            "Grit Garden completed."
            if not result["already_completed"]
            else "Session already completed."
        ),
        "already_completed": result[
            "already_completed"
        ],
        "xp_awarded": result[
            "xp_awarded"
        ],
        "session": GritGardenSessionSerializer(
            result["session"]
        ).data,
    })