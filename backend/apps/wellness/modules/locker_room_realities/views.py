from rest_framework.decorators import (
    api_view,
    permission_classes,
)

from rest_framework.permissions import IsAuthenticated

from rest_framework.response import Response

from rest_framework import status

from .serializers import (
    LockerRoomScenarioSerializer,
    LockerRoomSessionSerializer,
    LockerRoomDecisionSerializer,
)

from .services import (
    get_scenarios,
    start_session,
    submit_decision,
    get_history,
    complete_session,
)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def locker_room_info(request):

    return Response({
        "success": True,
        "module": {
            "name": "Locker Room Realities",
            "description": (
                "Practice decision-making "
                "through realistic athlete scenarios."
            ),
        }
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def scenario_list(request):

    scenarios = get_scenarios()

    return Response({
        "success": True,
        "scenarios": LockerRoomScenarioSerializer(
            scenarios,
            many=True
        ).data
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def start_locker_session(request):

    scenario_id = request.data.get(
        "scenario_id"
    )

    if not scenario_id:

        return Response(
            {
                "success": False,
                "message": "scenario_id is required."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    try:

        session = start_session(
            request.user,
            scenario_id
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
            "session": LockerRoomSessionSerializer(
                session
            ).data
        },
        status=status.HTTP_201_CREATED
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_locker_decision(
    request,
    session_id
):

    serializer = LockerRoomDecisionSerializer(
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

        session = submit_decision(
            user=request.user,
            session_id=session_id,
            choice=serializer.validated_data[
                "choice"
            ]
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
        "session": LockerRoomSessionSerializer(
            session
        ).data
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def locker_history(request):

    sessions = get_history(
        request.user
    )

    return Response({
        "success": True,
        "history": LockerRoomSessionSerializer(
            sessions,
            many=True
        ).data
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def complete_locker_session(
    request,
    session_id
):

    try:

        result = complete_session(
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
        "message": "Locker Room Realities completed.",
        "already_completed": result[
            "already_completed"
        ],
        "xp_awarded": result[
            "xp_awarded"
        ],
        "session": LockerRoomSessionSerializer(
            result["session"]
        ).data
    })