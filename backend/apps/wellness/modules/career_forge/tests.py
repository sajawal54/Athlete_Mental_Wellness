from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.wellness.models import WellnessModule
from apps.wellness.modules.career_forge.models import CareerRoadmap

User = get_user_model()


class CareerForgeAPITestCase(APITestCase):
    """
    Comprehensive test suite for Career Forge Module Endpoints,
    Serializers, and Models.

    Covered features:
    - Authentication checks for roadmap and save endpoints
    - Roadmap retrieval for authenticated users
    - Roadmap creation and update via save endpoint
    - Timeline months validation
    - Transferable skills validation
    - Milestones validation
    - Module completion & XP reward allocation
    - Model string representation
    """

    def setUp(self):
        # 1. Primary Test User
        self.user = User.objects.create_user(
            username="sajawalkhan",
            email="sajawal@example.com",
            password="StrongPassword123!",
        )

        # 2. Sample Career Forge Wellness Module
        # for XP reward integration
        self.career_module = WellnessModule.objects.create(
            name="Career Forge",
            slug="career-forge",
            description="Career roadmap building for athletes",
            module_type="career_forge",
            required_xp=0,
            xp_reward=50,
            order=1,
            status="active",
        )

        # 3. URLs mapping
        self.roadmap_url = reverse("career-forge-roadmap")
        self.save_url = reverse("career-forge-save")

    # =========================================================================
    # AUTHENTICATION TESTS
    # =========================================================================

    def test_unauthenticated_access_denied(self):
        """
        Ensure unauthenticated requests to Career Forge endpoints
        are blocked with 401 Unauthorized.
        """
        response = self.client.get(self.roadmap_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

        response = self.client.post(
            self.save_url,
            {},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    # =========================================================================
    # ROADMAP GET VIEW TESTS
    # =========================================================================

    def test_get_roadmap_empty(self):
        """
        Ensure retrieving roadmap when none exists
        returns success with null roadmap.
        """
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.roadmap_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertTrue(
            response.data["success"]
        )

        self.assertIsNone(
            response.data["roadmap"]
        )

    def test_get_roadmap_success(self):
        """
        Ensure user can successfully retrieve
        their created career roadmap.
        """
        self.client.force_authenticate(user=self.user)

        CareerRoadmap.objects.create(
            user=self.user,
            target_role="Software Engineer",
            industry="Tech",
            timeline_months=12,
        )

        response = self.client.get(
            self.roadmap_url
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertTrue(
            response.data["success"]
        )

        self.assertEqual(
            response.data["roadmap"]["target_role"],
            "Software Engineer",
        )

    # =========================================================================
    # SAVE & UPDATE VIEW & VALIDATION TESTS
    # =========================================================================

    def test_career_forge_save_success(self):
        """
        Ensure saving a career roadmap creates/updates it,
        awards XP, and returns success.

        JSON format is explicitly used because milestones
        contains nested dictionary data.
        """
        self.client.force_authenticate(user=self.user)

        payload = {
            "target_role": "Lead Sports Tech Product Manager",
            "industry": "Sports & AI",
            "transferable_skills": [
                "Leadership",
                "Strategy",
            ],
            "milestones": [
                {
                    "title": "MVP Launch",
                    "deadline": "2026-12-31",
                    "status": "pending",
                }
            ],
            "financial_goals": "$100k+ annually",
            "timeline_months": 24,
            "notes": "Focus on high-performance tech.",
        }

        response = self.client.post(
            self.save_url,
            payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertTrue(
            response.data["success"]
        )

        self.assertTrue(
            response.data["created"]
        )

        self.assertEqual(
            response.data["xp_awarded"],
            50,
        )

        self.assertEqual(
            response.data["roadmap"]["target_role"],
            "Lead Sports Tech Product Manager",
        )

        # Verify database record
        self.assertEqual(
            CareerRoadmap.objects.filter(
                user=self.user
            ).count(),
            1,
        )

    def test_career_forge_save_invalid_timeline(self):
        """
        Ensure invalid timeline_months format
        returns 400 Bad Request.
        """
        self.client.force_authenticate(user=self.user)

        payload = {
            "timeline_months": "not-an-integer",
        }

        response = self.client.post(
            self.save_url,
            payload,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertFalse(
            response.data["success"]
        )

    def test_career_forge_save_invalid_transferable_skills_type(self):
        """
        Ensure non-list transferable_skills
        returns 400 Bad Request.
        """
        self.client.force_authenticate(user=self.user)

        payload = {
            "transferable_skills": "Leadership, Strategy",
        }

        response = self.client.post(
            self.save_url,
            payload,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertFalse(
            response.data["success"]
        )

    def test_career_forge_save_invalid_milestones_type(self):
        """
        Ensure non-list milestones returns
        400 Bad Request.
        """
        self.client.force_authenticate(user=self.user)

        payload = {
            "milestones": "Invalid milestone string",
        }

        response = self.client.post(
            self.save_url,
            payload,
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertFalse(
            response.data["success"]
        )

    # =========================================================================
    # MODEL STR REPRESENTATION TEST
    # =========================================================================

    def test_career_roadmap_str_representation(self):
        """
        Ensure string representation of CareerRoadmap
        follows user and target role format.
        """
        roadmap = CareerRoadmap.objects.create(
            user=self.user,
            target_role="Data Scientist",
        )

        expected_str = (
            f"{self.user} - Data Scientist"
        )

        self.assertEqual(
            str(roadmap),
            expected_str,
        )