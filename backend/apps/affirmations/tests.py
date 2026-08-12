from unittest.mock import patch
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model

from rest_framework.test import APITestCase
from rest_framework import status

from .models import Affirmation
from .serializers import AffirmationSerializer

User = get_user_model()


# 1. MODEL TESTS (Affirmation Model Verification)
class AffirmationModelTest(TestCase):
    """Affirmation model basic fields aur __str__ test karne ke liye"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="aff_user",
            email="aff@example.com",
            password="Password123!"
        )

    def test_create_affirmation_success(self):
        affirmation = Affirmation.objects.create(
            user=self.user,
            text="I am strong and focused on my targets.",
            is_favorite=False
        )
        self.assertEqual(affirmation.user, self.user)
        self.assertFalse(affirmation.is_favorite)
        # __str__ method check (Pehle 80 characters return karta hai)
        self.assertEqual(str(affirmation), "I am strong and focused on my targets.")

    def test_str_truncation_for_long_text(self):
        """Agar text 80 chars se lamba ho to __str__ 80 chars tak cut karta hai"""
        long_text = "A" * 100
        affirmation = Affirmation.objects.create(user=self.user, text=long_text)
        self.assertEqual(len(str(affirmation)), 80)


# 2. SERIALIZER TESTS
class AffirmationSerializerTest(TestCase):
    """AffirmationSerializer fields verification"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="serializer_user",
            email="ser@example.com",
            password="Password123!"
        )
        self.affirmation = Affirmation.objects.create(
            user=self.user,
            text="I trust my preparation.",
            is_favorite=True
        )

    def test_serializer_output_data(self):
        serializer = AffirmationSerializer(instance=self.affirmation)
        data = serializer.data

        self.assertEqual(data["id"], self.affirmation.id)
        self.assertEqual(data["text"], "I trust my preparation.")
        self.assertTrue(data["is_favorite"])
        self.assertIn("created_at", data)


# 3. API VIEW & ENDPOINT TESTS
class AffirmationAPITests(APITestCase):
    """Affirmations App ki tamaam APIs test karne ke liye class"""

    def setUp(self):
        # User 1 (Primary Test User)
        self.user = User.objects.create_user(
            username="athlete_user",
            email="athlete@example.com",
            password="Password123!"
        )

        # User 2 (Unrelated User for isolation tests)
        self.other_user = User.objects.create_user(
            username="other_athlete",
            email="other@example.com",
            password="Password123!"
        )

        # Exact URL Names from urls.py
        self.generate_url = reverse("generate-affirmation")
        self.history_url = reverse("affirmation-history")
        self.clear_history_url = reverse("delete-affirmaton")

    # Generate Affirmation API Tests
    @patch("apps.affirmations.views.ask_groq")
    def test_generate_affirmation_success(self, mock_ask_groq):
        """Valid category ke sath AI affirmation successfully generate hona chahiye"""
        self.client.force_authenticate(user=self.user)

        # Mock Groq response taake actual network call na ho
        mock_ask_groq.return_value = "I execute under pressure with complete poise."

        payload = {"category": "confidence"}
        response = self.client.post(self.generate_url, payload)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["text"], "I execute under pressure with complete poise.")
        self.assertFalse(response.data["is_favorite"])
        self.assertTrue(Affirmation.objects.filter(user=self.user).exists())

    def test_generate_affirmation_invalid_category(self):
        """Invalid category par 400 Bad Request error aana chahiye"""
        self.client.force_authenticate(user=self.user)

        payload = {"category": "invalid_cat"}
        response = self.client.post(self.generate_url, payload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)
        self.assertIn("allowed_categories", response.data)

    @patch("apps.affirmations.views.ask_groq")
    def test_generate_affirmation_ai_empty_response(self, mock_ask_groq):
        """AI agar empty text return kare to 503 Service Unavailable aana chahiye"""
        self.client.force_authenticate(user=self.user)
        mock_ask_groq.return_value = ""

        payload = {"category": "focus"}
        response = self.client.post(self.generate_url, payload)

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data["error"], "AI returned an empty string")

    # History & Pagination API Tests
    def test_get_history_authenticated_user_only(self):
        """User ko sirf apni affirmations history milni chahiye (Pagination page_size=2)"""
        self.client.force_authenticate(user=self.user)

        # User 1 ke liye 3 affirmations
        Affirmation.objects.create(user=self.user, text="Affirmation 1")
        Affirmation.objects.create(user=self.user, text="Affirmation 2")
        Affirmation.objects.create(user=self.user, text="Affirmation 3")

        # User 2 ke liye 1 affirmation
        Affirmation.objects.create(user=self.other_user, text="Other User Affirmation")

        response = self.client.get(self.history_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 3)  # Sirf self.user ki total items count = 3
        self.assertEqual(len(response.data["results"]), 2)  # Page size is 2

    def test_get_history_unauthenticated(self):
        """Bina login key history GET karne par 401 Unauthorized aana chahiye"""
        response = self.client.get(self.history_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # Favorite Update API Tests
    def test_toggle_favorite_status(self):
        """Favorite status toggle (False -> True -> False) test"""
        self.client.force_authenticate(user=self.user)

        affirmation = Affirmation.objects.create(user=self.user, text="Daily focus text", is_favorite=False)
        update_url = reverse("update-affirmation", kwargs={"pk": affirmation.id})

        # Pehla toggle: False -> True
        res1 = self.client.patch(update_url)
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertTrue(res1.data["is_favorite"])

        # Doosra toggle: True -> False
        res2 = self.client.patch(update_url)
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertFalse(res2.data["is_favorite"])

    def test_toggle_favorite_other_user_affirmation(self):
        """Kisi doosre user ki affirmation ko favorite karne par 404 aana chahiye"""
        self.client.force_authenticate(user=self.user)

        # User 2 ki affirmation
        other_affirmation = Affirmation.objects.create(
            user=self.other_user, text="Other's secret text"
        )
        update_url = reverse("update-affirmation", kwargs={"pk": other_affirmation.id})

        response = self.client.patch(update_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # Clear History API Tests
    def test_clear_affirmation_history(self):
        """User ki tamaam history delete honi chahiye par doosre user ki intact rahe"""
        self.client.force_authenticate(user=self.user)

        Affirmation.objects.create(user=self.user, text="User Affirmation 1")
        Affirmation.objects.create(user=self.user, text="User Affirmation 2")
        Affirmation.objects.create(user=self.other_user, text="Other User Affirmation")

        response = self.client.delete(self.clear_history_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check User 1 ki sari affirmations delete ho gayi hain
        self.assertEqual(Affirmation.objects.filter(user=self.user).count(), 0)
        # Check User 2 ki affirmation abhi bhi safe hai
        self.assertEqual(Affirmation.objects.filter(user=self.other_user).count(), 1)