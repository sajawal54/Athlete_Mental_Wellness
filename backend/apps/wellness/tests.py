from django.contrib.auth import get_user_model
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase

from apps.wellness.models import (
    WellnessModule,
    UserModuleProgress,
    WellnessSession,
    WellnessCompletion,
)
from apps.wellness.services import (
    start_module,
    complete_module,
    get_module_by_slug,
    generate_setback_reframe,
    analyze_self_talk,
    evaluate_empathy_response,
)


User = get_user_model()


class WellnessAppAPITestCase(APITestCase):
    """
    Comprehensive test suite for Wellness App Core Modules,
    Services, and API Views.

    Covered:
    - Authentication
    - Module listing
    - Module detail
    - Slug normalization
    - Module lifecycle
    - Progress update
    - Module completion
    - User progress
    - AI evaluation engines
    - Model string representations
    """

    def setUp(self):
        # =========================================================
        # USER
        # =========================================================

        self.user = User.objects.create_user(
            username="sajawalkhan",
            email="sajawal@example.com",
            password="StrongPassword123!",
        )

        # =========================================================
        # ACTIVE MODULE
        # =========================================================

        self.module = WellnessModule.objects.create(
            name="Word Grid",
            slug="word-grid",
            description="Daily focus puzzle and vocabulary builder",
            module_type="word_grid",
            required_xp=0,
            xp_reward=25,
            order=1,
            status="active",
        )

        # =========================================================
        # LOCKED MODULE
        # =========================================================

        self.locked_module = WellnessModule.objects.create(
            name="Career Forge",
            slug="career-forge",
            description="Career roadmap building for athletes",
            module_type="career_forge",
            required_xp=100,
            xp_reward=50,
            order=2,
            status="active",
        )

        # =========================================================
        # URLS
        # =========================================================

        self.list_url = reverse(
            "wellness-modules"
        )

        self.detail_url = reverse(
            "wellness-module-detail",
            kwargs={
                "slug": self.module.slug,
            },
        )

        self.start_url = reverse(
            "wellness-module-start",
            kwargs={
                "slug": self.module.slug,
            },
        )

        self.progress_update_url = reverse(
            "wellness-module-progress-update",
            kwargs={
                "slug": self.module.slug,
            },
        )

        self.complete_url = reverse(
            "wellness-module-complete",
            kwargs={
                "slug": self.module.slug,
            },
        )

        self.my_progress_url = reverse(
            "wellness-my-progress"
        )

        self.ai_assistant_url = reverse(
            "wellness-ai-assistant"
        )

    # =============================================================
    # AUTHENTICATION
    # =============================================================

    def test_unauthenticated_access_denied(self):
        """
        Unauthenticated users cannot access protected endpoints.
        """

        response = self.client.get(
            self.list_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

        response = self.client.get(
            self.my_progress_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

        response = self.client.post(
            self.ai_assistant_url,
            {},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    # =============================================================
    # MODULE LIST
    # =============================================================

    def test_get_active_wellness_modules_list_success(self):
        """
        Authenticated users can retrieve active wellness modules.
        """

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.get(
            self.list_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertTrue(
            response.data["success"]
        )

        self.assertEqual(
            response.data["count"],
            2,
        )

        returned_slugs = [
            module["slug"]
            for module in response.data["modules"]
        ]

        self.assertIn(
            "word-grid",
            returned_slugs,
        )

        self.assertIn(
            "career-forge",
            returned_slugs,
        )

    # =============================================================
    # MODULE DETAIL
    # =============================================================

    def test_get_wellness_module_detail_success(self):
        """
        Authenticated users can retrieve module details.
        """

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.get(
            self.detail_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertTrue(
            response.data["success"]
        )

        self.assertEqual(
            response.data["module"]["name"],
            "Word Grid",
        )

    def test_get_nonexistent_module_detail_returns_404(self):
        """
        Invalid module slug returns 404.
        """

        self.client.force_authenticate(
            user=self.user
        )

        invalid_url = reverse(
            "wellness-module-detail",
            kwargs={
                "slug": "non-existent-module",
            },
        )

        response = self.client.get(
            invalid_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    # =============================================================
    # SLUG NORMALIZATION
    # =============================================================

    def test_get_module_by_slug_normalization(self):
        """
        get_module_by_slug supports:
        - word-grid
        - word_grid
        - WORD-GRID
        """

        mod_hyphen = get_module_by_slug(
            "word-grid"
        )

        mod_underscore = get_module_by_slug(
            "word_grid"
        )

        mod_caps = get_module_by_slug(
            "WORD-GRID"
        )

        self.assertEqual(
            mod_hyphen,
            self.module,
        )

        self.assertEqual(
            mod_underscore,
            self.module,
        )

        self.assertEqual(
            mod_caps,
            self.module,
        )

    # =============================================================
    # SERVICE LIFECYCLE
    # =============================================================

    def test_start_and_complete_module_service(self):
        """
        Core service should start and complete a module.
        """

        progress, session = start_module(
            self.user,
            self.module,
        )

        self.assertEqual(
            progress.status,
            "in_progress",
        )

        self.assertIsNotNone(
            session,
        )

        result = complete_module(
            self.user,
            self.module,
            session=session,
            score=300,
        )

        self.assertFalse(
            result["already_completed"]
        )

        self.assertEqual(
            result["xp_awarded"],
            25,
        )

        self.assertEqual(
            result["progress"].status,
            "completed",
        )

    # =============================================================
    # MODULE LIFECYCLE API
    # =============================================================

    def test_wellness_module_lifecycle_apis(self):
        """
        Test complete API lifecycle:

        Start
            ↓
        Update progress
            ↓
        Complete
        """

        self.client.force_authenticate(
            user=self.user
        )

        # ---------------------------------------------------------
        # 1. START
        # ---------------------------------------------------------

        start_res = self.client.post(
            self.start_url
        )

        self.assertEqual(
            start_res.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            start_res.data["progress"]["status"],
            "in_progress",
        )

        session_id = start_res.data["session"]["id"]

        # ---------------------------------------------------------
        # 2. UPDATE PROGRESS
        # ---------------------------------------------------------

        patch_res = self.client.patch(
            self.progress_update_url,
            {
                "progress": 75,
                "current_step": 3,
                "session_data": {
                    "score_checkpoint": 150,
                },
            },
            format="json",
        )

        self.assertEqual(
            patch_res.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            patch_res.data["progress"]["progress"],
            75,
        )

        # ---------------------------------------------------------
        # 3. COMPLETE
        # ---------------------------------------------------------

        complete_res = self.client.post(
            self.complete_url,
            {
                "session_id": session_id,
                "score": 250,
            },
            format="json",
        )

        self.assertEqual(
            complete_res.status_code,
            status.HTTP_200_OK,
        )

        self.assertTrue(
            complete_res.data["success"]
        )

        self.assertEqual(
            complete_res.data["xp_awarded"],
            25,
        )

    # =============================================================
    # MY PROGRESS API
    # =============================================================

    def test_wellness_my_progress_api(self):
        """
        User can retrieve progress across active modules.

        Explicit progress records are created for both modules
        because the API's progress queryset depends on existing
        UserModuleProgress records.
        """

        UserModuleProgress.objects.create(
            user=self.user,
            module=self.module,
            status="available",
            progress=0,
            current_step=0,
        )

        UserModuleProgress.objects.create(
            user=self.user,
            module=self.locked_module,
            status="locked",
            progress=0,
            current_step=0,
        )

        self.client.force_authenticate(
            user=self.user
        )

        response = self.client.get(
            self.my_progress_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertTrue(
            response.data["success"]
        )

        self.assertGreaterEqual(
            response.data["count"],
            2,
        )

    # =============================================================
    # AI ENGINE - SETBACK REFRAME
    # =============================================================

    def test_ai_engine_setback_reframe(self):
        """
        Setback reframe engine returns expected fields.
        """

        result = generate_setback_reframe(
            "My athletic career is completely ruined after this loss."
        )

        self.assertIn(
            "reframe",
            result,
        )

        self.assertIn(
            "action_step",
            result,
        )

        self.assertIn(
            "safety_message",
            result,
        )

    # =============================================================
    # AI ENGINE - SELF TALK
    # =============================================================

    def test_ai_engine_analyze_self_talk(self):
        """
        Self-talk engine detects all-or-nothing thinking.
        """

        result = analyze_self_talk(
            "I always fail every single match."
        )

        self.assertEqual(
            result["distortion_type"],
            "all_or_nothing",
        )

        self.assertIn(
            "analysis",
            result,
        )

        self.assertIn(
            "suggested_rewrite",
            result,
        )

    # =============================================================
    # AI ENGINE - EMPATHY
    # =============================================================

    def test_ai_engine_evaluate_empathy_response(self):
        """
        Empathy engine evaluates validation and curiosity.
        """

        result = evaluate_empathy_response(
            scenario=None,
            user_response=(
                "I hear you, that must be tough. "
                "How can I help you right now?"
            ),
        )

        self.assertGreaterEqual(
            result["score"],
            80,
        )

        self.assertIn(
            "feedback",
            result,
        )

        self.assertIn(
            "metrics",
            result,
        )

    # =============================================================
    # MODEL STRING REPRESENTATIONS
    # =============================================================

    def test_models_str_representations(self):
        """
        Wellness models return meaningful string representations.
        """

        self.assertEqual(
            str(self.module),
            "Word Grid",
        )

        progress = UserModuleProgress.objects.create(
            user=self.user,
            module=self.module,
            status="available",
        )

        self.assertIn(
            "Word Grid",
            str(progress),
        )

        session = WellnessSession.objects.create(
            user=self.user,
            module=self.module,
        )

        self.assertIn(
            "Word Grid",
            str(session),
        )

        completion = WellnessCompletion.objects.create(
            user=self.user,
            module=self.module,
            xp_awarded=25,
        )

        self.assertIn(
            "Word Grid",
            str(completion),
        )