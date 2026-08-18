from rest_framework.decorators import (
    api_view,
    permission_classes,
)

from rest_framework.permissions import IsAuthenticated

from rest_framework.response import Response

from rest_framework import status

from .serializers import (
    ReactionPromptSerializer,
    ReactionGameSessionSerializer,
    ReactionAnswerSerializer,
)

from .services import (
    start_game,
    submit_answer,
    get_leaderboard,
    get_history,
    complete_game,
)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reaction_zone_info(request):

    return Response({
        "success": True,
        "module": {
            "name": "Reaction Zone",
            "description": (
                "Test your reaction speed "
                "and build focus."
            ),
        }
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def start_reaction_game(request):

    try:

        session, prompt = start_game(
            request.user
        )

    except ValueError as error:

        return Response(
            {
                "success": False,
                "message": str(error)
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    return Response(
        {
            "success": True,
            "session": ReactionGameSessionSerializer(
                session
            ).data,
            "prompt": ReactionPromptSerializer(
                prompt
            ).data,
        },
        status=status.HTTP_201_CREATED
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_reaction_answer(
    request,
    session_id
):

    serializer = ReactionAnswerSerializer(
        data=request.data
    )

    if not serializer.is_valid():

        return Response(
            {
                "success": False,
                "errors": serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    try:

        result = submit_answer(
            user=request.user,
            session_id=session_id,
            prompt_id=serializer.validated_data[
                "prompt_id"
            ],
            answer=serializer.validated_data[
                "answer"
            ],
            reaction_time=serializer.validated_data[
                "reaction_time"
            ],
        )

    except ValueError as error:

        return Response(
            {
                "success": False,
                "message": str(error)
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    return Response({
        "success": True,
        "correct": result["correct"],
        "score": result["score"],
        "session": ReactionGameSessionSerializer(
            result["session"]
        ).data,
        "next_prompt": ReactionPromptSerializer(
            result["next_prompt"]
        ).data if result["next_prompt"] else None,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def complete_reaction_game(
    request,
    session_id
):

    try:

        result = complete_game(
            request.user,
            session_id
        )

    except ValueError as error:

        return Response(
            {
                "success": False,
                "message": str(error)
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    return Response({
        "success": True,
        "message": "Reaction Zone completed.",
        "already_completed": result[
            "already_completed"
        ],
        "xp_awarded": result[
            "xp_awarded"
        ],
        "session": ReactionGameSessionSerializer(
            result["session"]
        ).data,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reaction_leaderboard(request):

    sessions = get_leaderboard()

    data = []

    for index, session in enumerate(
        sessions,
        start=1
    ):

        data.append({
            "rank": index,
            "username": session.user.username,
            "score": session.score,
            "correct_answers": session.correct_answers,
        })

    return Response({
        "success": True,
        "leaderboard": data,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reaction_history(request):

    sessions = get_history(
        request.user
    )

    return Response({
        "success": True,
        "history": ReactionGameSessionSerializer(
            sessions,
            many=True
        ).data,
    })