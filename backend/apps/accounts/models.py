import os
from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    email = models.EmailField(unique=True)
    is_counselor = models.BooleanField(default=False)
    
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]
    
    def __str__(self):
        return self.email


def profile_pic_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"user_{instance.user.id}_avatar.{ext}"
    return os.path.join('profile_pics/', filename)

class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    
    avatar = models.ImageField(upload_to=profile_pic_path, null=True, blank=True)
    
    sport = models.CharField(max_length=100, default='Football', blank=True)
    team = models.CharField(max_length=100, default='University Varsity', blank=True)
    position = models.CharField(max_length=100, default='Midfielder', blank=True)
    personal_goals = models.TextField(blank=True, default='Improve mental resilience and maintain daily focus targets.')
    preferences = models.CharField(max_length=255, blank=True, default='Morning Workouts, Mindful Breathing')
    
    age = models.PositiveIntegerField(null=True, blank=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    

    xp = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    streak = models.IntegerField(default=0)
    last_checkin_date = models.DateField(null=True, blank=True)

    email_notifications = models.BooleanField(default=True)
    reminder_notifications = models.BooleanField(default=True)
    theme_preference = models.CharField(max_length=10, choices=[('light', 'Light'), ('dark', 'Dark')], default='dark')
    profile_visibility = models.CharField(max_length=20, choices=[('public', 'Public'), ('private', 'Private')], default='private')
    
    updated_at = models.DateTimeField(auto_now=True)

    def add_xp(self, amount):
        """XP add karta hai aur level auto update karta hai (Every 100 XP = +1 Level)"""
        self.xp += amount
        self.level = (self.xp // 100000) + 1
        self.save()

    def update_streak(self, today_date):
        """Daily check-in par streak badhata hai"""
        if self.last_checkin_date is None:
            self.streak = 1
        elif self.last_checkin_date == today_date:
            pass  # Aaj pehle hi check-in ho chuka hai
        elif (today_date - self.last_checkin_date).days == 1:
            self.streak += 1
        else:
            self.streak = 1  # Streak reset agar day break hua
        
        self.last_checkin_date = today_date
        self.save()

    def __str__(self):
        return f"{self.user.username}'s Profile (Level {self.level} - {self.xp} XP)"