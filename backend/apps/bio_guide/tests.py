from unittest.mock import patch
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model

from rest_framework.test import APITestCase
from rest_framework import status

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer

User = get_user_model()


# 1. MODEL TESTS
class BioGuideModelTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="bioguidetestuser",
            email="bioguide@example.com",
            password="Password123!"
        )

    def test_create_conversation_and_string_representation(self):
        conversation = Conversation.objects.create(
            user=self.user,
            title="Hydration Strategy Chat"
        )
        self.assertEqual(conversation.user, self.user)
        self.assertEqual(
            str(conversation), f"{self.user.email} - Hydration Strategy Chat"
        )

    def test_create_message_and_string_representation(self):
        conversation = Conversation.objects.create(user=self.user)
        message = Message.objects.create(
            conversation=conversation,
            role="user",
            content="How much water should I drink before a marathon?"
        )
        self.assertEqual(message.conversation, conversation)
        self.assertEqual(message.role, "user")
        self.assertEqual(
            str(message), "user: How much water should I drink before a marathon?"
        )


# 2. SERIALIZER TESTS
class BioGuideSerializerTests(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="serializeruser",
            email="seruser@example.com",
            password="Password123!"
        )
        self.conversation = Conversation.objects.create(
            user=self.user,
            title="Recovery Protocol"
        )
        self.msg_user = Message.objects.create(
            conversation=self.conversation,
            role="user",
            content="What is ice bath recovery?"
        )
        self.msg_assistant = Message.objects.create(
            conversation=self.conversation,
            role="assistant",
            content="Ice baths reduce inflammation and muscle soreness post-workout."
        )

    def test_message_serializer_output(self):
        serializer = MessageSerializer(instance=self.msg_user)
        data = serializer.data

        self.assertEqual(data["id"], self.msg_user.id)
        self.assertEqual(data["role"], "user")
        self.assertEqual(data["content"], "What is ice bath recovery?")
        self.assertIn("created_at", data)

    def test_conversation_serializer_with_nested_messages(self):
        serializer = ConversationSerializer(instance=self.conversation)
        data = serializer.data

        self.assertEqual(data["id"], self.conversation.id)
        self.assertEqual(data["title"], "Recovery Protocol")
        self.assertEqual(len(data["messages"]), 2)
        self.assertEqual(data["messages"][0]["role"], "user")
        self.assertEqual(data["messages"][1]["role"], "assistant")


# 3. API VIEW TESTS
class BioGuideAPITests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username="athlete",
            email="athlete@example.com",
            password="Password123!"
        )
        self.other_user = User.objects.create_user(
            username="other_athlete",
            email="other@example.com",
            password="Password123!"
        )

        # Exact URL Names from urls.py
        self.list_create_url = reverse("conversation-list-create")

    # List & Create Conversations
    def test_get_conversations_authenticated(self):
        """User ko sirf apni conversations milni chahiye"""
        self.client.force_authenticate(user=self.user)

        Conversation.objects.create(user=self.user, title="Chat 1")
        Conversation.objects.create(user=self.user, title="Chat 2")
        Conversation.objects.create(user=self.other_user, title="Other's Chat")

        response = self.client.get(self.list_create_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_conversations_unauthenticated(self):
        response = self.client.get(self.list_create_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch("apps.bio_guide.views.get_bio_guide_response")
    def test_create_conversation_success(self, mock_get_bio_response):
        """Nayi conversation create hone par user & AI messages save hone chahiye"""
        self.client.force_authenticate(user=self.user)
        mock_get_bio_response.return_value = "AI: Ensure you eat complex carbs 3 hours prior."

        payload = {"message": "What should I eat before my football match?"}
        response = self.client.post(self.list_create_url, payload)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "What should I eat before my football match?")
        self.assertEqual(len(response.data["messages"]), 2)
        self.assertEqual(response.data["messages"][0]["role"], "user")
        self.assertEqual(response.data["messages"][1]["role"], "assistant")
        self.assertEqual(
            response.data["messages"][1]["content"],
            "AI: Ensure you eat complex carbs 3 hours prior."
        )

    def test_create_conversation_missing_message_error(self):
        """Message payload nahi bhejne par 400 Bad Request milna chahiye"""
        self.client.force_authenticate(user=self.user)

        response = self.client.post(self.list_create_url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    @patch("apps.bio_guide.views.get_bio_guide_response")
    def test_create_conversation_title_truncation(self, mock_get_bio_response):
        """60 characters se zayada ka message ho to title truncate (... appended) hona chahiye"""
        self.client.force_authenticate(user=self.user)
        mock_get_bio_response.return_value = "Sample AI response"

        long_message = "A" * 70
        response = self.client.post(self.list_create_url, {"message": long_message})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["title"].endswith("..."))
        self.assertEqual(len(response.data["title"]), 63)  # 60 chars + "..."

    # Send Message to Existing Conversation
    @patch("apps.bio_guide.views.get_bio_guide_response")
    def test_send_message_to_existing_conversation(self, mock_get_bio_response):
        """Existing conversation me message add hona chahiye aur history pas honi chahiye"""
        self.client.force_authenticate(user=self.user)
        mock_get_bio_response.return_value = "AI: Sleep 8 hours minimum."

        conversation = Conversation.objects.create(user=self.user, title="Sleep Optimization")
        Message.objects.create(conversation=conversation, role="user", content="Initial msg")

        message_url = reverse("conversation-message", kwargs={"pk": conversation.id})
        payload = {"message": "How many hours of sleep is optimal?"}

        response = self.client.post(message_url, payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check initial message + new user message + new AI response = 3 total messages
        self.assertEqual(len(response.data["messages"]), 3)
        self.assertEqual(
            response.data["messages"][2]["content"], "AI: Sleep 8 hours minimum."
        )

    def test_send_message_to_non_existing_or_other_users_conversation(self):
        """Kisi dusre user ki ya non-existent conversation par message bhejne se 404 aana chahiye"""
        self.client.force_authenticate(user=self.user)

        other_conversation = Conversation.objects.create(
            user=self.other_user, title="Other's Private Chat"
        )
        message_url = reverse("conversation-message", kwargs={"pk": other_conversation.id})

        response = self.client.post(message_url, {"message": "Attempting intrusion"})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # Delete Conversation
    def test_delete_conversation_success(self):
        """User apni conversation successfully delete kar sake"""
        self.client.force_authenticate(user=self.user)

        conversation = Conversation.objects.create(user=self.user, title="To Be Deleted")
        delete_url = reverse("conversation-delete", kwargs={"pk": conversation.id})

        response = self.client.delete(delete_url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Conversation.objects.filter(id=conversation.id).exists())

    def test_delete_other_user_conversation_not_allowed(self):
        """Dusre user ki conversation delete karne par 404 aana chahiye"""
        self.client.force_authenticate(user=self.user)

        other_conversation = Conversation.objects.create(
            user=self.other_user, title="Protected Chat"
        )
        delete_url = reverse("conversation-delete", kwargs={"pk": other_conversation.id})

        response = self.client.delete(delete_url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Conversation.objects.filter(id=other_conversation.id).exists())