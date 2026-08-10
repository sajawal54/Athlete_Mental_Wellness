from django.db import models



class SoundTrack(models.Model):
  CATEGORY_CHOICES = [
    ("rain" , "Rain"),
    ("ocean" , "Ocean"),
    ("forest" , "Forest"),
    ("wind" , "Wind"),
    ("meditation" , "Meditation")
  ]
  
  
  title = models.CharField(max_length=180)
  
  category = models.CharField(max_length=30 , choices=CATEGORY_CHOICES)
  
  audio_file = models.FileField(upload_to="sound_therapy/")
  
  is_active = models.BooleanField(default=True)
  
  created_at = models.DateTimeField(auto_now_add=True)
  
  updated_at = models.DateTimeField(auto_now=True)
  
  
  def __str__(self):
    return self.title
# Create your models here.
