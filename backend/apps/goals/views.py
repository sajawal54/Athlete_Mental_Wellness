from django.db import transaction
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from .models import DailyGoal
from .serializers import DailyGoalSerializer
from apps.accounts.models import Profile


GOAL_XP_REWARD = 100


class DailyGoalListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()

        goals = DailyGoal.objects.filter(
            user=request.user,
            created_at=today
        ).order_by("-id")

        serializer = DailyGoalSerializer(
            goals,
            many=True
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    def post(self, request):
        serializer = DailyGoalSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        goal = serializer.save(
            user=request.user
        )

        return Response(
            DailyGoalSerializer(goal).data,
            status=status.HTTP_201_CREATED
        )


class DailyGoalToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            goal = DailyGoal.objects.get(
                pk=pk,
                user=request.user
            )
        except DailyGoal.DoesNotExist:
            return Response(
                {"error": "Goal not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        was_completed = goal.is_completed

        with transaction.atomic():

            goal.is_completed = not goal.is_completed
            goal.save(update_fields=["is_completed"])

            profile, _ = Profile.objects.get_or_create(
                user=request.user
            )

            xp_gained = 0

            # incomplete -> Conplete
            if not was_completed and goal.is_completed:
                profile.add_xp(GOAL_XP_REWARD)
                xp_gained = GOAL_XP_REWARD

            # complete -> incomplete
            elif was_completed and not goal.is_completed:
                profile.add_xp(-GOAL_XP_REWARD)
                xp_gained = -GOAL_XP_REWARD

            profile.refresh_from_db()

        data = DailyGoalSerializer(goal).data

        data["xp_gained"] = xp_gained
        data["new_total_xp"] = profile.xp
        data["level"] = profile.level

        return Response(
            data,
            status=status.HTTP_200_OK
        )




class DailyGoalDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            goal = DailyGoal.objects.get(
                pk=pk,
                user=request.user
            )
        except DailyGoal.DoesNotExist:
            return Response(
                {"error": "Goal not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        goal.delete()

        return Response(
            {"message": "Goal deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )