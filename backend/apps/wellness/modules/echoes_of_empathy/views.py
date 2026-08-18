from rest_framework.decorators import (
    api_view,
    permission_classes,
)

from rest_framework.permissions import IsAuthenticated

from rest_framework.response import Response

from rest_framework import status

from .serializers import (
    EmpathyScenarioSerializer,
    EmpathySessionSerializer,
    EmpathyResponseSerializer,
)

from .services import (
    get_scenarios,
    create_session,
    submit_response,
    get_history,
    complete_session,
)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def empathy_info(request):

    return Response({
        "success": True,
        "module": {
            "name": "Echoes of Empathy",
            "description": (
                "Practice responding to difficult "
                "situations with empathy."
            ),
        },
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def empathy_scenarios(request):

    scenarios = get_scenarios()

    return Response({
        "success": True,
        "scenarios": EmpathyScenarioSerializer(
            scenarios,
            many=True,
        ).data,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def start_empathy_session(request):

    scenario_id = request.data.get(
        "scenario_id"
    )

    if not scenario_id:

        return Response(
            {
                "success": False,
                "message": "scenario_id is required.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:

        session = create_session(
            user=request.user,
            scenario_id=scenario_id,
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
            "session": EmpathySessionSerializer(
                session
            ).data,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_empathy_response(
    request,
    session_id,
):

    serializer = EmpathyResponseSerializer(
        data={
            "scenario_id": request.data.get(
                "scenario_id",
                0,
            ),
            "response": request.data.get(
                "response",
                "",
            ),
        }
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

        session = submit_response(
            user=request.user,
            session_id=session_id,
            response=serializer.validated_data[
                "response"
            ],
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
        "message": "Response evaluated.",
        "session": EmpathySessionSerializer(
            session
        ).data,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def empathy_history(request):

    sessions = get_history(
        request.user
    )

    return Response({
        "success": True,
        "history": EmpathySessionSerializer(
            sessions,
            many=True,
        ).data,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def complete_empathy_session(
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
            "Echoes of Empathy completed."
            if not result["already_completed"]
            else "Session already completed."
        ),
        "already_completed": result[
            "already_completed"
        ],
        "xp_awarded": result[
            "xp_awarded"
        ],
        "session": EmpathySessionSerializer(
            result["session"]
        ).data,
    })