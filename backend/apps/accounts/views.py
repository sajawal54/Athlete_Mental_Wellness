from rest_framework import generics , permissions
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer , LoginSerializer
from rest_framework.views import APIView
from rest_framework import status
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from rest_framework.permissions import IsAuthenticated
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
User = get_user_model()

class UserProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "username": user.username,
            "email": user.email,
            "is_counselor": getattr(user, 'is_counselor', False)
        })
    def put(self, request):
        user = request.user
        username = request.data.get('username')
        password = request.data.get('password')

        if username:
            user.username = username

        if password:
            user.set_password(password)

        try:
            user.save()
        except Exception as e:
            # Agar database mein username unique hone ki wajah se error aaye
            return Response(
                {"detail": "This username already taken. Please choose a slightly different variation (e.g., adding a number)."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            "message": "Profile updated successfully",
            "username": user.username,
            "email": user.email,
            "is_counselor": getattr(user, 'is_counselor', False)
        }, status=status.HTTP_200_OK)

class RegisterAPIView(generics.CreateAPIView):
  queryset = User.objects.all()
  permission_classes = [permissions.AllowAny]
  serializer_class = RegisterSerializer
  
class LoginAPIView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            
            refresh = RefreshToken.for_user(user)
            
            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "message": "Login successful"
            }, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ForgotPasswordAPIView(APIView):
    def post(self, request):
        email = request.data.get('email')
      
        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            
            
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
          
            reset_link = f"http://localhost:5173/reset-password?uid={uid}&token={token}"
            
           
            subject = 'Password Reset Request - Athlete Mental Wellness'
            html_message = render_to_string(
    "emails/password-reset.html",
    {
        "username": user.username,
        "reset_link": reset_link,
    },
)
            
            plain_message = strip_tags(html_message)

            send_mail(
    subject=subject,
    message=plain_message,
    from_email=settings.DEFAULT_FROM_EMAIL,
    recipient_list=[user.email],
    html_message=html_message,
    fail_silently=False,
)
        except User.DoesNotExist:
            pass

        return Response({"detail": "If an account with this email exists, password reset instructions have been sent."}, status=status.HTTP_200_OK)


class ResetPasswordAPIView(APIView):
   def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')

        if not uid or not token or not new_password:
            return Response({"detail": "All fields (uid, token, new_password) are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_pk = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_pk)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        # Token verify karna
        if user is not None and default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return Response({"detail": "Password has been reset successfully."}, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "Invalid or expired reset link/token."}, status=status.HTTP_400_BAD_REQUEST)
