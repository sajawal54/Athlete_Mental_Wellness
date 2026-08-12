from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import SoundTrack
from .serializers import SoundTrackSerializer

User = get_user_model()


class SoundTrackAPITestCase(APITestCase):
    """
    Comprehensive test suite for SoundTrack Endpoints, Serializers, and Models.
    Covered features:
    - Authentication checks (Unauthenticated access blocked)
    - List soundtracks (Active tracks only, category filtering)
    - Detail soundtrack retrieval
    - File upload handling & Absolute Audio URL serialization
    - Inactive soundtrack visibility protection
    """

    def setUp(self):
        # 1. Primary Test User
        self.user = User.objects.create_user(
            username="sajawalkhan",
            email="sajawal@example.com",
            password="StrongPassword123!",
        )

        # 2. Fake Audio File creation for FileField testing
        self.fake_audio_file = SimpleUploadedFile(
            name="test_rain.mp3",
            content=b"file_content_audio_bytes",
            content_type="audio/mpeg",
        )

        # 3. Sample SoundTrack Records
        self.rain_track = SoundTrack.objects.create(
            title="Heavy Rain & Thunder",
            category="rain",
            audio_file=self.fake_audio_file,
            is_active=True,
        )

        self.ocean_track = SoundTrack.objects.create(
            title="Calm Ocean Waves",
            category="ocean",
            audio_file=self.fake_audio_file,
            is_active=True,
        )

        # Inactive track (Should be hidden from API responses)
        self.inactive_track = SoundTrack.objects.create(
            title="Hidden Forest Sound",
            category="forest",
            audio_file=self.fake_audio_file,
            is_active=False,
        )

        # 4. URLs
        self.list_url = reverse("sound-track-list")
        self.detail_url = reverse("sound-track-detail", kwargs={"pk": self.rain_track.pk})

    # =========================================================================
    # AUTHENTICATION TESTS
    # =========================================================================

    def test_unauthenticated_access_denied(self):
        """
        Ensure unauthenticated requests are blocked (401 Unauthorized).
        """
        # GET List
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # GET Detail
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # =========================================================================
    # LIST & FILTERING TESTS
    # =========================================================================

    def test_get_active_soundtracks_list_success(self):
        """
        Ensure authenticated user can retrieve all ACTIVE soundtracks only.
        """
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return only active tracks (2 out of 3 created)
        self.assertEqual(len(response.data), 2)

        # Ensure inactive track is omitted
        returned_ids = [track["id"] for track in response.data]
        self.assertIn(self.rain_track.id, returned_ids)
        self.assertIn(self.ocean_track.id, returned_ids)
        self.assertNotIn(self.inactive_track.id, returned_ids)

    def test_filter_soundtracks_by_category(self):
        """
        Ensure filtering by ?category= query param returns only matching category tracks.
        """
        self.client.force_authenticate(user=self.user)

        # Filter by category='rain'
        response = self.client.get(self.list_url, {"category": "rain"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.rain_track.id)
        self.assertEqual(response.data[0]["category"], "rain")

    # =========================================================================
    # DETAIL & INACTIVE PROTECTION TESTS
    # =========================================================================

    def test_get_soundtrack_detail_success(self):
        """
        Ensure user can retrieve single active soundtrack details.
        """
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.rain_track.id)
        self.assertEqual(response.data["title"], "Heavy Rain & Thunder")
        self.assertEqual(response.data["category"], "rain")

    def test_get_inactive_soundtrack_detail_returns_404(self):
        """
        Ensure requesting an inactive soundtrack detail returns 404 Not Found.
        """
        self.client.force_authenticate(user=self.user)

        inactive_url = reverse("sound-track-detail", kwargs={"pk": self.inactive_track.pk})
        response = self.client.get(inactive_url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # =========================================================================
    # SERIALIZER & AUDIO URL TESTS
    # =========================================================================

    def test_serializer_builds_absolute_audio_url(self):
        """
        Ensure SerializerMethodField `get_audio_url` generates absolute URL when request context is present.
        """
        self.client.force_authenticate(user=self.user)

        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        audio_url = response.data["audio_url"]

        # Absolute URL should start with http://testserver
        self.assertIsNotNone(audio_url)
        self.assertTrue(audio_url.startswith("http://testserver"))
        self.assertIn("test_rain", audio_url)

    def test_serializer_audio_url_without_request_context(self):
        """
        Ensure serializer fallback returns relative URL if request context is missing.
        """
        serializer = SoundTrackSerializer(self.rain_track)

        # Directly checking serializer data without passing request context
        audio_url = serializer.data["audio_url"]
        self.assertIsNotNone(audio_url)
        self.assertFalse(audio_url.startswith("http"))
        self.assertTrue(audio_url.startswith("/media/"))

    # =========================================================================
    # MODEL STR REPRESENTATION TEST
    # =========================================================================

    def test_soundtrack_str_representation(self):
        """
        Ensure string representation of SoundTrack model returns the title.
        """
        self.assertEqual(str(self.rain_track), "Heavy Rain & Thunder")