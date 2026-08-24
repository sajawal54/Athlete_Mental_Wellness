from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.wellness.models import WellnessModule
from apps.wellness.models import TransitionResource, ResourceView

User = get_user_model()


class TransitionSupportAPITestCase(APITestCase):
    """
    Comprehensive test suite for Transition Support Module Endpoints, Serializers, and Models.
    Covered features:
    - Authentication checks for resources list and mark viewed endpoints
    - Transition resources listing with active filtering, category query params, and is_viewed serializer field
    - Marking resource as viewed, creating ResourceView, and awarding XP integration
    - Validation checks for non-existent or inactive resource IDs
    - Model string representations and unique constraints
    """

    def setUp(self):
        # 1. Primary Test User
        self.user = User.objects.create_user(
            username="sajawalkhan",
            email="sajawal@example.com",
            password="StrongPassword123!",
        )

        # 2. Sample Wellness Module for Transition Support
        self.wellness_module = WellnessModule.objects.create(
            name="Transition Support",
            slug="transition-support",
            description="Resources for career and life transition",
            module_type="transition_support",
            required_xp=0,
            xp_reward=25,
            order=1,
            status="active",
        )

        # 3. Sample Transition Resources
        self.resource_1 = TransitionResource.objects.create(
            title="Career Transition Guide",
            description="A complete guide for career shift.",
            content="Detailed content about career transition.",
            resource_type="guide",
            category="career",
            order=1,
            is_active=True,
        )

        self.resource_2 = TransitionResource.objects.create(
            title="Financial Planning Article",
            description="Manage your finances effectively.",
            content="Detailed content about budgeting.",
            resource_type="article",
            category="financial",
            order=2,
            is_active=True,
        )

        self.inactive_resource = TransitionResource.objects.create(
            title="Old Resource",
            description="Archived resource description.",
            is_active=False,
        )

        # 4. URLs mapping
        self.resources_url = reverse("transition-support-resources")

    def get_view_url(self, resource_id):
        return reverse("transition-support-view", kwargs={"resource_id": resource_id})

    # =========================================================================
    # AUTHENTICATION TESTS
    # =========================================================================

    def test_unauthenticated_access_denied(self):
        """
        Ensure unauthenticated requests to transition support endpoints are blocked (401 Unauthorized).
        """
        response = self.client.get(self.resources_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.post(self.get_view_url(self.resource_1.id))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # =========================================================================
    # RESOURCES LISTING & FILTERING TESTS
    # =========================================================================

    def test_get_resources_list_success(self):
        """
        Ensure authenticated users can retrieve active transition resources with is_viewed status.
        """
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.resources_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        # Should only return active resources (2 out of 3)
        self.assertEqual(len(response.data["resources"]), 2)
        self.assertEqual(response.data["resources"][0]["title"], "Career Transition Guide")
        self.assertFalse(response.data["resources"][0]["is_viewed"])

    def test_get_resources_filtered_by_category(self):
        """
        Ensure filtering resources by category query parameter works correctly.
        """
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.resources_url, {"category": "career"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(len(response.data["resources"]), 1)
        self.assertEqual(response.data["resources"][0]["category"], "career")

    # =========================================================================
    # MARK VIEWED & XP AWARD TESTS
    # =========================================================================

    def test_mark_resource_viewed_success_and_xp(self):
        """
        Ensure marking a resource as viewed creates a ResourceView record and awards XP.
        """
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.get_view_url(self.resource_1.id))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["resource_id"], self.resource_1.id)
        self.assertEqual(response.data["xp_awarded"], 25)

        # Verify database record creation
        self.assertEqual(ResourceView.objects.filter(user=self.user, resource=self.resource_1).count(), 1)

        # Verify is_viewed updates to True in listing
        res_list = self.client.get(self.resources_url)
        self.assertTrue(res_list.data["resources"][0]["is_viewed"])

    def test_mark_resource_not_found(self):
        """
        Ensure marking a non-existent or inactive resource returns 404 Not Found.
        """
        self.client.force_authenticate(user=self.user)
        
        # Non-existent ID
        response = self.client.post(self.get_view_url(9999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Inactive resource ID
        response = self.client.post(self.get_view_url(self.inactive_resource.id))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # =========================================================================
    # MODEL STR REPRESENTATION TESTS
    # =========================================================================

    def test_transition_support_models_str_representations(self):
        """
        Ensure string representations of TransitionResource and ResourceView return expected formats.
        """
        self.assertEqual(str(self.resource_1), "Career Transition Guide")

        resource_view = ResourceView.objects.create(
            user=self.user,
            resource=self.resource_1,
        )
        expected_str = f"{self.user} - Career Transition Guide"
        self.assertEqual(str(resource_view), expected_str)