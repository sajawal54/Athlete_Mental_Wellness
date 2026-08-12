
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

from apps.goals.models import DailyGoal
from apps.moods.models import MoodLog
from apps.accounts.models import Profile


class DashboardOverviewAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.localdate()

        # Get or create profile
        profile, _ = Profile.objects.get_or_create(
            user=user
        )

        # USER SUMMARY
        user_summary = {
            "username": user.username,
            "first_name": user.first_name,
            "name": user.get_full_name() or user.username,

            # Backend is the single source of truth for XP
            "xp": profile.xp,
            "total_xp": profile.xp,

            "level": profile.level,
            "streak": profile.streak,
        }

        # TODAY'S GOAL

        todays_goal = DailyGoal.objects.filter(
            user=user,
            created_at=today
        ).first()

        if todays_goal:
            goal_data = {
                "id": todays_goal.id,
                "title": todays_goal.title,
                "points": getattr(
                    todays_goal,
                    "points",
                    100
                ),
                "completed": todays_goal.is_completed,
                "is_completed": todays_goal.is_completed,
                "category": getattr(
                    todays_goal,
                    "category",
                    "Recovery"
                ),
            }
        else:
            goal_data = {
                "id": None,
                "title": "No goal created for today",
                "points": 100,
                "completed": False,
                "is_completed": False,
                "category": "Mindfulness",
            }

        # TODAY'S MOOD
        today_mood = (
            MoodLog.objects
            .filter(
                user=user,
                created_at__date=today
            )
            .order_by("-created_at")
            .first()
        )

        # Recent moods
        recent_moods = (
            MoodLog.objects
            .filter(user=user)
            .order_by("-created_at")[:5]
        )

        mood_labels = {
            "great": "Energized / Great",
            "good": "Calm / Focused",
            "neutral": "Neutral / Okay",
            "anxious": "Stressed / Anxious",
            "exhausted": "Exhausted / Low",
        }

        mood_emojis = {
            "great": "🔥",
            "good": "😌",
            "neutral": "😐",
            "anxious": "😰",
            "exhausted": "😫",
        }

        # TODAY MOOD RESPONSE
        if today_mood:
            mood_key = today_mood.mood

            today_mood_data = {
                "checked_in": True,
                "mood": mood_key,
                "label": mood_labels.get(
                    mood_key,
                    mood_key
                ),
                "emoji": (
                    getattr(
                        today_mood,
                        "emoji",
                        None
                    )
                    or mood_emojis.get(
                        mood_key
                    )
                ),
                "energy_level": getattr(
                    today_mood,
                    "energy_level",
                    None
                ),
                "notes": getattr(
                    today_mood,
                    "notes",
                    ""
                ),
                "created_at": today_mood.created_at,
            }
        else:
            today_mood_data = {
                "checked_in": False,
                "mood": None,
                "label": "No check-in yet",
                "emoji": None,
                "energy_level": None,
                "notes": "",
                "created_at": None,
            }

        # MOOD TREND
        trend = []

        for mood in reversed(recent_moods):
            mood_key = mood.mood

            trend.append({
                "mood": mood_key,
                "label": mood_labels.get(
                    mood_key,
                    mood_key
                ),
                "emoji": (
                    getattr(
                        mood,
                        "emoji",
                        None
                    )
                    or mood_emojis.get(
                        mood_key
                    )
                ),
                "created_at": mood.created_at,
            })

        mood_summary = {
            "today": today_mood_data,
            "trend": trend,
        }

        # AI GUIDE
        ai_guide = {
            "prompt": (
                "How to stay focused under pressure?"
            ),
        }

        # QUICK MODULES
        quick_modules = [
            {
                "id": 1,
                "title": "Mood Check-In",
                "status": (
                    "Completed"
                    if today_mood
                    else "Pending"
                ),
                "progress": (
                    "100%"
                    if today_mood
                    else "0%"
                ),
                "path": "/mood-checkin",
            },
            {
                "id": 2,
                "title": "Daily Goals",
                "status": (
                    "Completed"
                    if todays_goal
                    and todays_goal.is_completed
                    else "Pending"
                ),
                "progress": (
                    "100%"
                    if (
                        todays_goal
                        and todays_goal.is_completed
                    )
                    else "0%"
                ),
                "path": "/goals",
            },
            {
                "id": 3,
                "title": "AI Bio Guide",
                "status": "Unlocked",
                "progress": "0%",
                "path": "/bio-guide",
            },
        ]

        # FINAL RESPONSE
        return Response({
            "user_summary": user_summary,
            "todays_goal": goal_data,
            "mood_summary": mood_summary,
            "ai_guide": ai_guide,
            "quick_modules": quick_modules,
        })

