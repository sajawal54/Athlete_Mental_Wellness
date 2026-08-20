from django.conf import settings
from django.db import models


User = settings.AUTH_USER_MODEL


class EmergencyContact(models.Model):
    REGION_CHOICES = [("global", "Global"), ("pakistan", "Pakistan"),  ("other", "Other"),]

    name = models.CharField(max_length=150)
    region = models.CharField(
        max_length=30,
        choices=REGION_CHOICES,
        default="global",
    )
    phone = models.CharField(max_length=50, blank=True)
    website_url = models.URLField(blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "name"]

    def __str__(self):
        return self.name


class Counselor(models.Model):
    name = models.CharField(max_length=150)
    specialization = models.CharField(max_length=200, blank=True)
    bio = models.TextField(blank=True)
    availability = models.CharField(max_length=200, blank=True)
    contact_email = models.EmailField(blank=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "name"]

    def __str__(self):
        return self.name


class CallbackRequest(models.Model):
    URGENCY_CHOICES = [
        ("normal", "Normal"),
        ("urgent", "Urgent"),
        ("immediate", "Immediate"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("contacted", "Contacted"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="emergency_callback_requests",
    )
    name = models.CharField(max_length=150)
    contact = models.CharField(max_length=150)
    reason = models.CharField(max_length=255)
    urgency = models.CharField(
        max_length=20,
        choices=URGENCY_CHOICES,
        default="normal",
    )
    message = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} - {self.urgency}"


class CrisisInformation(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.title


class BreathingExercise(models.Model):
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    duration_seconds = models.PositiveIntegerField(default=60)
    inhale_seconds = models.PositiveIntegerField(default=4)
    hold_seconds = models.PositiveIntegerField(default=2)
    exhale_seconds = models.PositiveIntegerField(default=6)
    instructions = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title