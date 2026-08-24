from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.wellness.models import (
    CodexCategory,
    CodexLesson,
    UserLessonProgress,
)

User = get_user_model()


class CodexAPITestCase(APITestCase):
    """
    Comprehensive test suite for Codex Module Endpoints, Serializers, and Models.
    Covered features:
    - Authentication checks for all codex endpoints
    - Codex categories listing with active lessons and user status
    - Daily reset evaluation logic for lesson progress
    - Lesson detail retrieval (handling valid and non-existent IDs)
    - Starting a lesson and updating status to in_progress
    - Completing a lesson, daily duplicate prevention, and XP awarding
    - Model string representations
    """

    def setUp(self):
        # 1. Primary Test User
        self.user = User.objects.create_user(
            username="sajawalkhan",
            email="sajawal@example.com",
            password="StrongPassword123!",
        )

        # 2. Sample Codex Category
        self.category = CodexCategory.objects.create(
            name="Mental Resilience",
            description="Foundations of mental toughness",
            order=1,
            is_active=True,
        )

        # 3. Sample Codex Lessons
        self.lesson_1 = CodexLesson.objects.create(
            category=self.category,
            title="Understanding Stress",
            description="Basics of stress response",
            content="Detailed lesson content about stress...",
            required_xp=0,
            xp_reward=15,
            order=1,
            is_active=True,
        )

        self.lesson_2 = CodexLesson.objects.create(
            category=self.category,
            title="Focus Mastery",
            description="Advanced attention control",
            content="Detailed lesson content about focus...",
            required_xp=10,
            xp_reward=25,
            order=2,
            is_active=True,
        )

        # 4. Inactive Lesson for filtering tests
        self.inactive_lesson = CodexLesson.objects.create(
            category=self.category,
            title="Archived Lesson",
            content="Old content",
            is_active=False,
        )

        # 5. URLs mapping
        self.categories_url = reverse("codex-categories")
        self.detail_url = reverse("codex-lesson-detail", kwargs={"lesson_id": self.lesson_1.id})
        self.start_url = reverse("codex-lesson-start", kwargs={"lesson_id": self.lesson_1.id})
        self.complete_url = reverse("codex-lesson-complete", kwargs={"lesson_id": self.lesson_1.id})

    # =========================================================================
    # AUTHENTICATION TESTS
    # =========================================================================

    def test_unauthenticated_access_denied(self):
        """
        Ensure unauthenticated requests to codex endpoints are blocked (401 Unauthorized).
        """
        response = self.client.get(self.categories_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.post(self.start_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.post(self.complete_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # =========================================================================
    # CATEGORIES & LISTING TESTS
    # =========================================================================

    def test_get_codex_categories_success(self):
        """
        Ensure authenticated user can retrieve active categories with lessons and status.
        """
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.categories_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(len(response.data["categories"]), 1)
        
        category_data = response.data["categories"][0]
        self.assertEqual(category_data["name"], "Mental Resilience")
        self.assertEqual(len(category_data["lessons"]), 2)

    def test_codex_categories_daily_reset_evaluation(self):
        """
        Ensure completed progress from previous days is automatically reset to available.
        """
        self.client.force_authenticate(user=self.user)
        
        yesterday = timezone.now() - timezone.timedelta(days=1)
        progress = UserLessonProgress.objects.create(
            user=self.user,
            lesson=self.lesson_1,
            status="completed",
            progress=100,
            completed_at=yesterday,
        )

        response = self.client.get(self.categories_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        progress.refresh_from_db()
        self.assertEqual(progress.status, "available")
        self.assertEqual(progress.progress, 0)
        self.assertIsNone(progress.completed_at)

    # =========================================================================
    # LESSON DETAIL TESTS
    # =========================================================================

    def test_get_lesson_detail_success(self):
        """
        Ensure authenticated user can retrieve a single active lesson detail.
        """
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["lesson"]["title"], "Understanding Stress")

    def test_get_lesson_detail_not_found_or_inactive(self):
        """
        Ensure requesting non-existent or inactive lesson returns 404 Not Found.
        """
        self.client.force_authenticate(user=self.user)
        
        invalid_url = reverse("codex-lesson-detail", kwargs={"lesson_id": 9999})
        response = self.client.get(invalid_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        inactive_url = reverse("codex-lesson-detail", kwargs={"lesson_id": self.inactive_lesson.id})
        response = self.client.get(inactive_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # =========================================================================
    # LESSON START & COMPLETE LIFECYCLE TESTS
    # =========================================================================

    def test_codex_lesson_start(self):
        """
        Ensure starting a lesson updates its status to in_progress and sets progress to 50.
        """
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.start_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["status"], "in_progress")
        self.assertEqual(response.data["progress"], 50)

    def test_codex_lesson_complete_success_and_xp_award(self):
        """
        Ensure completing a lesson marks it completed, awards XP, and returns success.
        """
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.complete_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertFalse(response.data["already_completed"])
        self.assertEqual(response.data["xp_awarded"], 15)

        progress = UserLessonProgress.objects.get(user=self.user, lesson=self.lesson_1)
        self.assertEqual(progress.status, "completed")
        self.assertEqual(progress.progress, 100)

    def test_codex_lesson_complete_already_completed_today(self):
        """
        Ensure completing the same lesson twice on the same day handles already_completed flag.
        """
        self.client.force_authenticate(user=self.user)
        
        self.client.post(self.complete_url)

        response = self.client.post(self.complete_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertTrue(response.data["already_completed"])
        self.assertEqual(response.data["xp_awarded"], 15)

    # =========================================================================
    # MODEL STR REPRESENTATION TESTS
    # =========================================================================

    def test_codex_models_str_representations(self):
        """
        Ensure string representations of Codex models return expected names and titles.
        """
        self.assertEqual(str(self.category), "Mental Resilience")
        self.assertEqual(str(self.lesson_1), "Understanding Stress")

        progress = UserLessonProgress.objects.create(
            user=self.user,
            lesson=self.lesson_1,
        )
        self.assertIn("Understanding Stress", str(progress))