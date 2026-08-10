from django.db import models
from django.conf import settings

class MoodLog(models.Model):
    MOOD_CHOICES = [
        ('great', 'Energized / Great'),
        ('good', 'Calm / Focused'),
        ('neutral', 'Neutral / Okay'),
        ('anxious', 'Stressed / Anxious'),
        ('exhausted', 'Exhausted / Low'),
    ]

    # User ke sath link (logged-in user)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    mood = models.CharField(max_length=20, choices=MOOD_CHOICES)
    emoji = models.CharField(max_length=10, default='😌')
    energy_level = models.IntegerField(default=3) # 1 to 5
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.mood}"
# Create your models here.
