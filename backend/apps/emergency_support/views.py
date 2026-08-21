from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .serializers import (
    EmergencyContactSerializer,
    CounselorSerializer,
    CallbackRequestSerializer,
    CrisisInformationSerializer,
    BreathingExerciseSerializer,
)
from .services import (
    get_emergency_contacts,
    get_counselors,
    get_crisis_information,
    get_breathing_exercises,
    create_callback_request,
    get_user_callback_requests,
)


@api_view(["GET"])
@permission_classes([AllowAny])
def emergency_contacts_view(request):
    """Return active emergency contacts for the requested region."""

    region = request.query_params.get("region")

    contacts = get_emergency_contacts(region=region)

    serializer = EmergencyContactSerializer(
        contacts,
        many=True,
    )

    return Response(
        {
            "success": True,
            "contacts": serializer.data,
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def counselors_view(request):
    """Return active counselors."""

    counselors = get_counselors()

    serializer = CounselorSerializer(
        counselors,
        many=True,
    )

    return Response(
        {
            "success": True,
            "counselors": serializer.data,
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def crisis_information_view(request):
    """Return active crisis information."""

    information = get_crisis_information()

    serializer = CrisisInformationSerializer(
        information,
        many=True,
    )

    return Response(
        {
            "success": True,
            "information": serializer.data,
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def breathing_exercises_view(request):
    """Return active breathing exercises."""

    exercises = get_breathing_exercises()

    serializer = BreathingExerciseSerializer(
        exercises,
        many=True,
    )

    return Response(
        {
            "success": True,
            "exercises": serializer.data,
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def callback_request_create_view(request):
    """Create a counselor callback request."""

    serializer = CallbackRequestSerializer(
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

    callback_request = create_callback_request(
        user=request.user,
        name=serializer.validated_data["name"],
        contact=serializer.validated_data["contact"],
        reason=serializer.validated_data["reason"],
        urgency=serializer.validated_data.get(
            "urgency",
            "normal",
        ),
        message=serializer.validated_data.get(
            "message",
            "",
        ),
    )

    response_serializer = CallbackRequestSerializer(
        callback_request
    )

    return Response(
        {
            "success": True,
            "message": (
                "Your callback request has been submitted "
                "successfully."
            ),
            "request": response_serializer.data,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def callback_request_list_view(request):
    """Return callback requests belonging to the current user."""

    requests = get_user_callback_requests(
        request.user
    )

    serializer = CallbackRequestSerializer(
        requests,
        many=True,
    )

    return Response(
        {
            "success": True,
            "requests": serializer.data,
        }
    )