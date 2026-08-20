
from django.db import transaction
from django.utils import timezone
from django.db.models import Q

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from .models import DailyGoal
from .serializers import DailyGoalSerializer
from apps.accounts.models import Profile
from apps.gamification.service import award_xp
from apps.notifications.services import create_goal_notification


GOAL_XP_REWARD = 100


class DailyGoalListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request): 
       today = timezone.localdate() 
       yesterday = today - timezone.timedelta(days=1) 
       goals = DailyGoal.objects.filter( user=request.user ).filter( Q(is_completed=False) | Q(created_at__in=[today, yesterday]) ).order_by("-id") 
       serializer = DailyGoalSerializer( goals, many=True ) 
       return Response( serializer.data, status=status.HTTP_200_OK )

    def post(self, request):
        serializer = DailyGoalSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        goal = serializer.save(
            user=request.user
        )

        # Notification: daily goal reminder
        create_goal_notification(
            user=request.user,
            message=f"You have a new daily goal waiting: {goal.title}",
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

            # incomplete -> Complete
            if not was_completed and goal.is_completed:
                xp_result = award_xp(
                    user=request.user,
                    amount=GOAL_XP_REWARD,
                    source="daily_goal",
                    description=f"Completed Daily Goal : {goal.title}"
                )

                xp_gained = GOAL_XP_REWARD

                # Notification: goal completed
                create_goal_notification(
                    user=request.user,
                    message=f"Great job! You completed your daily goal: {goal.title}",
                )

            # complete -> incomplete
            elif was_completed and not goal.is_completed:
                xp_result = award_xp(
                    user=request.user,
                    amount=-GOAL_XP_REWARD,
                    source="daily_goal_reversal",
                    description=f"Reversed XP for incomplete goal   : {goal.title}"
                )

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

