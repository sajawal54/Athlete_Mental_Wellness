from django.shortcuts import render
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
from django.conf import settings
User = get_user_model()


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
            message = f"Hi {user.username},\n\nYou requested a password reset. Click the link below to reset your password:\n\n{reset_link}\n\nIf you didn't request this, please ignore this email."
            
            send_mail(
                subject,
                message,
            settings.DEFAULT_FROM_EMAIL,
                [user.email],
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
