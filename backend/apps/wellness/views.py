import traceback

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    UserModuleProgress,
    WellnessCompletion,
    WellnessModule,
    WellnessSession,
)

from .serializers import (
    UserModuleProgressSerializer,
    WellnessCompletionSerializer,
    WellnessModuleSerializer,
    WellnessSessionSerializer,
)

from .services import (
    complete_module,
    get_module_by_slug,
    start_module,
    update_module_progress,
)

from apps.notifications.services import (
    create_wellness_notification,
)

from apps.wellness.service.groq_service import (
    generate_wellness_ai,
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
    """
    Creates a Wellness notification for the authenticated user.

    All Wellness completion notifications are created through
    the central notification service.
    """

    return create_wellness_notification(
        user=user,
        title=title,
        message=message,
        action_url=action_url,
    )


# =============================================================
# AI ASSISTANT
# =============================================================

class WellnessAIAssistantView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        module_type = request.data.get("module_type")
        user_input = request.data.get("user_input", "")
        extra_context = request.data.get("extra_context", "")

        if not module_type:
            return Response(
                {
                    "success": False,
                    "error": "module_type is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            ai_result = generate_wellness_ai(
                module_type=module_type,
                user_input=user_input,
                extra_context=extra_context,
            )

            return Response(
                {
                    "success": True,
                    "module_type": module_type,
                    "data": ai_result,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as error:
            print("\n" + "=" * 60)
            print("GROQ AI ERROR IN WELLNESS BACKEND")
            print("=" * 60)
            print(str(error))
            traceback.print_exc()
            print("=" * 60 + "\n")

            return Response(
                {
                    "success": False,
                    "error": str(error),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# =============================================================
# 1. CORE SHARED WELLNESS MODULE LIFECYCLE
# =============================================================


class WellnessModuleListAPIView(APIView):
    """
    Returns all active Wellness modules.

    Individual module logic does NOT belong here.
    Each module can have its own app/views.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        modules = (
            WellnessModule.objects
            .filter(status="active")
            .order_by("order", "name")
        )

        serializer = WellnessModuleSerializer(
            modules,
            many=True,
            context={"request": request},
        )

        return Response(
            {
                "success": True,
                "count": modules.count(),
                "modules": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class WellnessModuleDetailAPIView(APIView):
    """
    Returns basic information about one Wellness module.

    Module-specific content is handled by the respective module app.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        module = get_module_by_slug(slug)

        if not module:
            return Response(
                {
                    "success": False,
                    "message": "Wellness module not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = WellnessModuleSerializer(
            module,
            context={"request": request},
        )

        return Response(
            {
                "success": True,
                "module": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class WellnessModuleStartAPIView(APIView):
    """
    Starts a Wellness module using the shared lifecycle service.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        module = get_module_by_slug(slug)

        if not module:
            return Response(
                {
                    "success": False,
                    "message": "Wellness module not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            progress, session = start_module(
                request.user,
                module,
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
                "message": f"Started {module.name}.",
                "progress": UserModuleProgressSerializer(
                    progress
                ).data,
                "session": (
                    WellnessSessionSerializer(
                        session
                    ).data
                    if session
                    else None
                ),
            },
            status=status.HTTP_200_OK,
        )


class WellnessModuleProgressUpdateAPIView(APIView):
    """
    Updates progress for any Wellness module.

    The actual module-specific activity remains outside this file.
    """

    permission_classes = [IsAuthenticated]

    def patch(self, request, slug):
        module = get_module_by_slug(slug)

        if not module:
            return Response(
                {
                    "success": False,
                    "message": "Wellness module not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        progress_value = request.data.get("progress")
        current_step = request.data.get("current_step")
        session_data = request.data.get("session_data")

        if progress_value is None:
            return Response(
                {
                    "success": False,
                    "message": "progress is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            progress_value = float(progress_value)

            if progress_value < 0 or progress_value > 100:
                return Response(
                    {
                        "success": False,
                        "message": (
                            "progress must be between 0 and 100."
                        ),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except (TypeError, ValueError):
            return Response(
                {
                    "success": False,
                    "message": "progress must be a valid number.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            progress = update_module_progress(
                user=request.user,
                module=module,
                progress_value=progress_value,
                current_step=current_step,
                session_data=session_data,
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
                "message": "Progress updated successfully.",
                "progress": UserModuleProgressSerializer(
                    progress
                ).data,
            },
            status=status.HTTP_200_OK,
        )


class WellnessModuleCompleteAPIView(APIView):
    """
    Completes a Wellness module through the shared service.

    XP awarding and completion handling are centralized here.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        module = get_module_by_slug(slug)

        if not module:
            return Response(
                {
                    "success": False,
                    "message": "Wellness module not found.",
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        session_id = request.data.get("session_id")
        score = request.data.get("score", 0)

        try:
            score = float(score)
        except (TypeError, ValueError):
            return Response(
                {
                    "success": False,
                    "message": "score must be a valid number.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        session = None

        if session_id:
            session = WellnessSession.objects.filter(
                id=session_id,
                user=request.user,
                module=module,
            ).first()

            if not session:
                return Response(
                    {
                        "success": False,
                        "message": (
                            "The specified session was not found."
                        ),
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )

        try:
            result = complete_module(
                user=request.user,
                module=module,
                session=session,
                score=score,
            )

        except ValueError as error:
            return Response(
                {
                    "success": False,
                    "message": str(error),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        xp_awarded = result.get("xp_awarded", 0)
        already_completed = result.get(
            "already_completed",
            False,
        )

        # ---------------------------------------------------------
        # WELLNESS COMPLETION NOTIFICATION
        # ---------------------------------------------------------

        if xp_awarded > 0 and not already_completed:
            notify_wellness_completion(
                user=request.user,
                title="Wellness Module Completed!",
                message=(
                    f"You earned {xp_awarded} XP "
                    f"for completing {module.name}!"
                ),
                action_url="/modules",
            )

        return Response(
            {
                "success": True,
                "already_completed": already_completed,
                "message": (
                    "Module was already completed previously."
                    if already_completed
                    else (
                        f"Congratulations! "
                        f"You completed {module.name}."
                    )
                ),
                "xp_awarded": xp_awarded,
                "progress": UserModuleProgressSerializer(
                    result["progress"]
                ).data,
                "completion": (
                    WellnessCompletionSerializer(
                        result["completion"]
                    ).data
                    if result.get("completion")
                    else None
                ),
            },
            status=status.HTTP_200_OK,
        )


class WellnessMyProgressAPIView(APIView):
    """
    Returns the authenticated user's progress
    across all Wellness modules.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        progress = (
            UserModuleProgress.objects
            .filter(user=request.user)
            .select_related("module")
            .order_by("module__order")
        )

        return Response(
            {
                "success": True,
                "count": progress.count(),
                "progress": UserModuleProgressSerializer(
                    progress,
                    many=True,
                ).data,
            },
            status=status.HTTP_200_OK,
        )