from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from .models import Profile

User = get_user_model()
class RegisterSerializer(serializers.ModelSerializer):
  
  password = serializers.CharField(write_only = True)
  
  class Meta:
    model = User
    fields = ("id" , "username" , "email" , "password" , "is_counselor")
    
  def create(self, validated_data):
    user = User.objects.create_user(username = validated_data["username"] , email = validated_data["email"] , password = validated_data["password"] ,is_counselor = validated_data.get('is_counselor', False))
    
    return user
  

class LoginSerializer(serializers.Serializer):
    email = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError("Invalid email or password.")
        else:
            raise serializers.ValidationError("Must include 'email' and 'password'.")

        data['user'] = user
        return data


class ProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', required=False)
    is_counselor = serializers.BooleanField(source='user.is_counselor', read_only=True)

    class Meta:
        model = Profile
        fields = [
            'avatar', 'email', 'username', 'is_counselor',
            'sport', 'team', 'position', 'personal_goals', 'preferences', 'age' , 'phone_number',
    'email_notifications', 'reminder_notifications', 'theme_preference', 'profile_visibility' , 'xp' , 'level' , 'streak'
        ]

    def update(self, instance, validated_data):
        # Update nested username on User model if provided
        user_data = validated_data.pop('user', {})
        if 'username' in user_data:
            instance.user.username = user_data['username']
            instance.user.save()

        # Update remaining profile fields
        return super().update(instance, validated_data)
      
