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
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError("Invalid credentials or inactive account.")
        else:
            raise serializers.ValidationError("Must include 'username' and 'password'.")

        data['user'] = user
        return data
    
      
