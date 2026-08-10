from django.db import models
from django.conf import settings

class DailyGoal(models.Model):
  CATEGORY_CHOICES = [("Mindfulness" , "Mindfulness") , ("Recovery" , "Recovery") , ("Physical" , "Physical") , ("Reflection" , "Reflection")]
  
  user = models.ForeignKey(settings.AUTH_USER_MODEL , on_delete=models.CASCADE , related_query_name="goals")
  title = models.CharField(max_length=255)
  category = models.CharField(max_length=20 , choices=CATEGORY_CHOICES , default="Mindfulness")
  points = models.IntegerField(default=15)
  is_completed = models.BooleanField(default=False)
  created_at = models.DateField(auto_now_add=True)

  class Meta:
        ordering = ["is_completed" , "-id"]
        
  def __str__(self):
      return f"{self.user.username} - {self.title} ({"Done" if self.is_completed else "Pending"})"
# Create your models here.
