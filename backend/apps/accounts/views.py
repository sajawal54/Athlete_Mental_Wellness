from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes, force_str
from django.utils.html import strip_tags
from django.utils.http import (
    urlsafe_base64_decode,
    urlsafe_base64_encode,
)

from rest_framework import generics, permissions, status
from rest_framework.parsers import (
    FormParser,
    JSONParser,
    MultiPartParser,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Profile
from .serializers import (
    LoginSerializer,
    ProfileSerializer,
    RegisterSerializer,
)

from apps.notifications.services import (
    create_security_notification,
)


User = get_user_model()


class UserProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    def get(self, request):
        profile, _ = Profile.objects.get_or_create(
            user=request.user
        )

        serializer = ProfileSerializer(
            profile,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def put(self, request):
        profile, _ = Profile.objects.get_or_create(
            user=request.user
        )

        # =====================================================
        # PASSWORD CHANGE
        # =====================================================

        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if new_password:

            # Current password is mandatory.
            if not old_password:
                return Response(
                    {
                        "detail": (
                            "Current password is required."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Verify current password.
            if not request.user.check_password(
                old_password
            ):
                return Response(
                    {
                        "detail": (
                            "Current password is incorrect."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Prevent same password.
            if old_password == new_password:
                return Response(
                    {
                        "detail": (
                            "New password must be different "
                            "from your current password."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Change password.
            request.user.set_password(new_password)
            request.user.save()

            # Security notification.
            create_security_notification(
                user=request.user,
                title="Security Alert: Password Updated",
                message=(
                    "Your account password was updated "
                    "successfully via profile settings."
                ),
            )

        # =====================================================
        # PROFILE UPDATE
        # =====================================================

        serializer = ProfileSerializer(
            profile,
            data=request.data,
            partial=True,
            context={"request": request},
        )

        if serializer.is_valid():
            serializer.save()

            return Response(
                serializer.data,
                status=status.HTTP_200_OK,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class RegisterAPIView(generics.CreateAPIView):
    queryset = User.objects.all()

    permission_classes = [
        permissions.AllowAny
    ]

    serializer_class = RegisterSerializer


class LoginAPIView(APIView):

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data
        )

        if serializer.is_valid():
            user = serializer.validated_data["user"]

            refresh = RefreshToken.for_user(user)

            # Security notification on login.
            create_security_notification(
                user=user,
                title="New Login Detected",
                message=(
                    "Your account was logged in successfully."
                ),
            )

            return Response(
                {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "message": "Login successful",
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "is_counselor": user.is_counselor,
                    },
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class ForgotPasswordAPIView(APIView):

    def post(self, request):
        email = request.data.get("email")

        if not email:
            return Response(
                {
                    "detail": "Email is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(
                email=email
            )

            token = default_token_generator.make_token(
                user
            )

            uid = urlsafe_base64_encode(
                force_bytes(user.pk)
            )

            reset_link = (
                "http://localhost:5173/"
                "reset-password"
                f"?uid={uid}&token={token}"
            )

            subject = (
                "Password Reset Request - "
                "Athlete Mental Wellness"
            )

            html_message = render_to_string(
                "emails/password-reset.html",
                {
                    "username": user.username,
                    "reset_link": reset_link,
                },
            )

            plain_message = strip_tags(
                html_message
            )

            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )

        except User.DoesNotExist:
            # Do not reveal whether an account exists.
            pass

        return Response(
            {
                "detail": (
                    "If an account with this email exists, "
                    "password reset instructions have been sent."
                )
            },
            status=status.HTTP_200_OK,
        )


class ResetPasswordAPIView(APIView):

    def post(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get(
            "new_password"
        )

        if not uid or not token or not new_password:
            return Response(
                {
                    "detail": (
                        "All fields "
                        "(uid, token, new_password) "
                        "are required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user_pk = force_str(
                urlsafe_base64_decode(uid)
            )

            user = User.objects.get(
                pk=user_pk
            )

        except (
            TypeError,
            ValueError,
            OverflowError,
            User.DoesNotExist,
        ):
            user = None

        if (
            user is not None
            and default_token_generator.check_token(
                user,
                token,
            )
        ):
            user.set_password(
                new_password
            )

            user.save()

            # Security notification.
            create_security_notification(
                user=user,
                title=(
                    "Security Alert: "
                    "Password Reset Successful"
                ),
                message=(
                    "Your account password was successfully "
                    "reset via email request."
                ),
            )

            return Response(
                {
                    "detail": (
                        "Password has been reset successfully."
                    )
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "detail": (
                    "Invalid or expired "
                    "reset link/token."
                )
            },
            status=status.HTTP_400_BAD_REQUEST,
        )