from django.core.management.base import BaseCommand

from apps.wellness.modules.mindful_monsters.models import (
    MindfulMonsterStep,
)


STEPS = [
    {
        "title": "Get Ready",
        "instruction": (
            "Sit comfortably, relax your shoulders, "
            "and prepare to begin."
        ),
        "phase": "prepare",
        "duration_seconds": 5,
        "order": 1,
    },
    {
        "title": "Breathe In",
        "instruction": (
            "Slowly breathe in through your nose."
        ),
        "phase": "inhale",
        "duration_seconds": 5,
        "order": 2,
    },
    {
        "title": "Hold",
        "instruction": (
            "Hold your breath gently."
        ),
        "phase": "hold",
        "duration_seconds": 4,
        "order": 3,
    },
    {
        "title": "Breathe Out",
        "instruction": (
            "Slowly breathe out and release tension."
        ),
        "phase": "exhale",
        "duration_seconds": 6,
        "order": 4,
    },
    {
        "title": "Relax",
        "instruction": (
            "Notice your body and allow yourself "
            "to relax."
        ),
        "phase": "relax",
        "duration_seconds": 5,
        "order": 5,
    },
]


class Command(BaseCommand):

    help = "Seed Mindful Monsters steps"

    def handle(self, *args, **options):

        created = 0
        updated = 0

        for step_data in STEPS:

            step, was_created = (
                MindfulMonsterStep.objects.update_or_create(
                    order=step_data["order"],
                    defaults=step_data,
                )
            )

            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Mindful Monsters seeded. "
                f"Created: {created}, "
                f"Updated: {updated}"
            )
        )