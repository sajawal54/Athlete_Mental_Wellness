from django.urls import path
from .views import RegisterAPIView , ForgotPasswordAPIView , ResetPasswordAPIView , LoginAPIView , UserProfileAPIView

urlpatterns = [
   path("register/" , RegisterAPIView.as_view() , name = "register"),
   path("login/" , LoginAPIView.as_view() , name = "login"),
   path('password-reset/', ForgotPasswordAPIView.as_view(), name='password_reset'),
   path('password-reset-confirm/', ResetPasswordAPIView.as_view(), name='password_reset_confirm'),
   path("profile/" , UserProfileAPIView.as_view() , name="user-profile"),
]

