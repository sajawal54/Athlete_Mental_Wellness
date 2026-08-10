from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate

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
    
      
