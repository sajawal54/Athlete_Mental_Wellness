from datetime import date, timedelta
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core import mail

from rest_framework.test import APITestCase
from rest_framework import status

from .models import Profile, profile_pic_path
from .serializers import RegisterSerializer, LoginSerializer

User = get_user_model()

class UserModelTest(TestCase):
    """User Model ke basic functions ko test karne ke liye"""

    def test_create_user_successful(self):
        user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="Password123!",
            is_counselor=True
        )
        self.assertEqual(user.email, "test@example.com")
        self.assertTrue(user.is_counselor)
        self.assertEqual(str(user), "test@example.com")


class ProfileModelTest(TestCase):
    """Profile Model ki custom methods (add_xp, update_streak) test karne ke liye"""

    def setUp(self):
        self.user = User.objects.create_user(
            username="profileuser",
            email="profile@example.com",
            password="Password123!"
        )
        self.profile = Profile.objects.create(user=self.user)

    def test_add_xp_and_level_up(self):
        self.assertEqual(self.profile.xp, 0)
        self.assertEqual(self.profile.level, 1)

        
        self.profile.add_xp(200000)
        self.assertEqual(self.profile.xp, 200000)
        self.assertEqual(self.profile.level, 3)

    def test_update_streak_first_time(self):
        today = date.today()
        self.profile.update_streak(today)
        self.assertEqual(self.profile.streak, 1)
        self.assertEqual(self.profile.last_checkin_date, today)

    def test_update_streak_consecutive_days(self):
        yesterday = date.today() - timedelta(days=1)
        today = date.today()

        self.profile.last_checkin_date = yesterday
        self.profile.streak = 1
        self.profile.save()

        self.profile.update_streak(today)
        self.assertEqual(self.profile.streak, 2)
        self.assertEqual(self.profile.last_checkin_date, today)

    def test_update_streak_broken(self):
        three_days_ago = date.today() - timedelta(days=3)
        today = date.today()

        self.profile.last_checkin_date = three_days_ago
        self.profile.streak = 5
        self.profile.save()

        self.profile.update_streak(today)
        self.assertEqual(self.profile.streak, 1)

    def test_profile_pic_path_function(self):
        filename = profile_pic_path(self.profile, "my_avatar.png")
        self.assertEqual(filename, f"profile_pics/user_{self.user.id}_avatar.png")


class SerializerTests(TestCase):

    def test_register_serializer_valid(self):
        data = {
            "username": "newuser",
            "email": "new@example.com",
            "password": "SecurePassword123",
            "is_counselor": False
        }
        serializer = RegisterSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        self.assertEqual(user.username, "newuser")

    def test_login_serializer_invalid_credentials(self):
        User.objects.create_user(
            username="loginuser",
            email="login@example.com",
            password="CorrectPassword123"
        )
        data = {
            "email": "login@example.com",
            "password": "WrongPassword"
        }
        serializer = LoginSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("non_field_errors", serializer.errors)



class AuthAPITests(APITestCase):

    def setUp(self):
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.forgot_password_url = reverse('password_reset')
        self.reset_password_url = reverse('password_reset_confirm')

        self.user_data = {
            "username": "apiuser",
            "email": "api@example.com",
            "password": "Password123!",
            "is_counselor": False
        }

    def test_register_api_success(self):
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="api@example.com").exists())

    def test_login_api_success(self):
        User.objects.create_user(**self.user_data)

        login_payload = {
            "email": self.user_data["email"],
            "password": self.user_data["password"]
        }
        response = self.client.post(self.login_url, login_payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_forgot_password_api_sends_email(self):
        user = User.objects.create_user(**self.user_data)

        response = self.client.post(self.forgot_password_url, {"email": user.email})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [user.email])

    def test_reset_password_api_success(self):
        user = User.objects.create_user(**self.user_data)

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        payload = {
            "uid": uid,
            "token": token,
            "new_password": "NewSecurePassword123!"
        }
        response = self.client.post(self.reset_password_url, payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        user.refresh_from_db()
        self.assertTrue(user.check_password("NewSecurePassword123!"))


class ProfileAPITest(APITestCase):

    def setUp(self):
        # Aapki profile URL ka exact name 'user-profile' hai
        self.profile_url = reverse('user-profile')
        self.user = User.objects.create_user(
            username="profiletestuser",
            email="profiletest@example.com",
            password="Password123!"
        )
        self.profile, _ = Profile.objects.get_or_create(user=self.user)

    def test_get_profile_unauthenticated(self):
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_profile_authenticated(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.profile_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], self.user.email)
        self.assertEqual(response.data["sport"], "Football")

    def test_update_profile_and_username(self):
        self.client.force_authenticate(user=self.user)

        update_payload = {
            "username": "updated_username",
            "sport": "Cricket",
            "theme_preference": "light"
        }
        response = self.client.put(self.profile_url, update_payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.profile.refresh_from_db()
        self.user.refresh_from_db()

        self.assertEqual(self.user.username, "updated_username")
        self.assertEqual(self.profile.sport, "Cricket")
        self.assertEqual(self.profile.theme_preference, "light")