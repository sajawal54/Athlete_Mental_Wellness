from django.db import models
from django.conf import settings


User = settings.AUTH_USER_MODEL


class Counselor(models.Model):

    SPECIALIZATION_CHOICES = [
        ("mental_wellness", "Mental Wellness"),
        ("sports_psychology", "Sports Psychology"),
        ("career", "Career"),
        ("stress", "Stress Management"),
        ("general", "General Support"),
    ]

    name = models.CharField(
        max_length=200
    )

    specialization = models.CharField(
        max_length=50,
        choices=SPECIALIZATION_CHOICES,
        default="general",
    )

    bio = models.TextField(
        blank=True
    )

    experience_years = models.PositiveIntegerField(
        default=0
    )

    location = models.CharField(
        max_length=150,
        blank=True
    )

    email = models.EmailField(
        blank=True
    )

    phone = models.CharField(
        max_length=30,
        blank=True
    )

    image = models.ImageField(
        upload_to="counselors/",
        blank=True,
        null=True,
    )

    is_available = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class CounselorRequest(models.Model):

    REQUEST_TYPES = [
        ("appointment", "Appointment"),
        ("callback", "Callback"),
        ("contact", "Contact"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="counselor_requests",
    )

    counselor = models.ForeignKey(
        Counselor,
        on_delete=models.CASCADE,
        related_name="requests",
    )

    request_type = models.CharField(
        max_length=30,
        choices=REQUEST_TYPES,
        default="appointment",
    )

    message = models.TextField(
        blank=True
    )

    preferred_date = models.DateField(
        null=True,
        blank=True,
    )

    preferred_time = models.TimeField(
        null=True,
        blank=True,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"{self.user} - "
            f"{self.counselor} - "
            f"{self.request_type}"
        )