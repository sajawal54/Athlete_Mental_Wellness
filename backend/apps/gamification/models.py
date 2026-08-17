from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL


class XPHistory(models.Model):
  
  user = models.ForeignKey(User , on_delete=models.CASCADE , related_name="xp_history")
  amount = models.IntegerField()
  source = models.CharField(max_length=100)
  description = models.TextField(blank=True)
  created_at = models.DateTimeField(auto_now_add=True)
  class Meta:
    ordering = ["-created_at"]
    
  def __str__(self):
    return f"{self.user.username} - {self.amount} XP - {self.source}"


class Badge(models.Model):

    CATEGORY_CHOICES = [
        ("xp", "XP"),
        ("streak", "Streak"),
        ("goals", "Goals"),
        ("mood", "Mood"),
        ("activity", "Activity"),
    ]

    name = models.CharField(max_length=250, unique=True)
    description = models.TextField()
    category = models.CharField(
        max_length=100,
        choices=CATEGORY_CHOICES
    )
    requirement_value = models.PositiveIntegerField(default=0)
    icon = models.CharField(max_length=100, blank=True)
  
    class Meta:
        ordering = ["name"]
    
    def __str__(self):
     return self.name
  
class UserBadge(models.Model):
  user = models.ForeignKey(User , on_delete=models.CASCADE , related_name="user_badges")
  badge = models.ForeignKey(Badge , on_delete=models.CASCADE ,  related_name="user_badges")
  earned_at = models.DateTimeField(auto_now_add=True)
  
  class Meta:
    constraints = [
    models.UniqueConstraint(
        fields=["user", "badge"],
        name="unique_user_badge",
    )
]
    ordering = ["-earned_at"]
  def __str__(self):
    return f"{self.user.username} , {self.badge.name}"
  
class Reward(models.Model):
    name = models.CharField(max_length=250)
    description = models.TextField()
    xp_cost = models.PositiveIntegerField()
    is_active = models.BooleanField(default=False)
    
    class Meta:
      ordering = ["xp_cost" , "name"]
    def __str__(self):
      return f"{self.name} , {self.xp_cost}"
    
class UserReward(models.Model):
  Category_Choices = [("available" , "Available"),("claimed" , "Claimed") , ("locked" , "Locked") , ("redeemed" , "Redeemed")]
  user = models.ForeignKey(User , on_delete=models.CASCADE , related_name="user_rewards")
  reward = models.ForeignKey(Reward , on_delete=models.CASCADE , related_name="user_rewards")
  status = models.CharField(max_length=20 , choices=Category_Choices , default="locked")
  claimed_at = models.DateTimeField(null=True , blank=True)
  redeemed_at = models.DateTimeField(null=True , blank=True)
  
  class Meta:
    constraints = [
    models.UniqueConstraint(
        fields=["user", "reward"],
        name="unique_user_reward",
    )
]
    ordering = ["-claimed_at"]
  def __str__(self):
    return f"{self.user.username} - {self.reward.name} - {self.status}"