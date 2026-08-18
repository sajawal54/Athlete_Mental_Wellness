from django.core.management.base import BaseCommand

from apps.wellness.modules.codex.models import (
    CodexCategory,
    CodexLesson,
)


CATEGORIES = [
    {
        "name": "Mental Strength",
        "description": "Build resilience, clarity, and control under pressure.",
        "order": 1,
        "lessons": [
            {
                "title": "Understanding Mental Resilience",
                "description": "Learn what mental resilience means for athletes and how it influences performance.",
                "content": (
                    "Mental resilience is the ability to absorb pressure, recover from setbacks, and keep moving toward key goals. "
                    "For athletes, resilience is not about ignoring stress; it is about responding with perspective, discipline, and self-control. "
                    "When you build resilience, you can stay focused in training, recover faster from mistakes, and maintain confidence during competition."
                ),
                "required_xp": 0,
                "xp_reward": 10,
                "order": 1,
            },
            {
                "title": "Handling Pressure",
                "description": "Use a simple process to manage pressure and stay grounded in performance moments.",
                "content": (
                    "Pressure becomes manageable when you stop trying to solve everything at once. "
                    "Break the moment into smaller actions: breathe, identify one objective, and focus on the next best action. "
                    "Athletes perform better when they shift attention away from outcome anxiety and toward controllable effort, execution, and timing."
                ),
                "required_xp": 10,
                "xp_reward": 15,
                "order": 2,
            },
            {
                "title": "Controlling Your Inner Narrative",
                "description": "Recognize how self-talk shapes confidence, effort, and recovery.",
                "content": (
                    "The stories you tell yourself influence your energy before a session, during a difficult moment, and after a loss. "
                    "If your inner narrative is harsh or extreme, your mind can become tense and reactive. "
                    "Instead, aim for honest, balanced self-talk that acknowledges effort, progress, and next steps without judgment."
                ),
                "required_xp": 25,
                "xp_reward": 15,
                "order": 3,
            },
        ],
    },
    {
        "name": "Recovery",
        "description": "Learn how rest supports both physical performance and mental health.",
        "order": 2,
        "lessons": [
            {
                "title": "Why Recovery Matters",
                "description": "See recovery as a performance tool rather than a break from progress.",
                "content": (
                    "Recovery is not inactivity; it is active adaptation. "
                    "Your body and mind need time to process stress, restore energy, and strengthen resilience. "
                    "Without recovery, performance can decline, irritability can rise, and focus can become inconsistent."
                ),
                "required_xp": 20,
                "xp_reward": 15,
                "order": 1,
            },
            {
                "title": "Rest and Reset",
                "description": "Identify practical habits that help you mentally reset after training or competition.",
                "content": (
                    "Use rest, breathing, reflection, and healthy routines to recover from effort. "
                    "After a demanding session, take a few minutes to lower your heart rate, reflect on what went well, and create a calm transition into the next task. "
                    "Recovery is most effective when it is intentional and consistent."
                ),
                "required_xp": 30,
                "xp_reward": 20,
                "order": 2,
            },
            {
                "title": "Sleep and Emotional Regulation",
                "description": "Understand how sleep quality affects mood, focus, and emotional control.",
                "content": (
                    "Sleep is one of the most powerful tools for emotional regulation. "
                    "When sleep is poor, athletes are more likely to feel reactive, overwhelmed, or impatient. "
                    "Even small improvements to sleep habits can increase patience, recovery, and decision quality the next day."
                ),
                "required_xp": 35,
                "xp_reward": 20,
                "order": 3,
            },
        ],
    },
    {
        "name": "Focus & Performance",
        "description": "Improve attention control, decision quality, and execution under challenge.",
        "order": 3,
        "lessons": [
            {
                "title": "Attention Is Trainable",
                "description": "Learn why focus is a skill athletes can deliberately build.",
                "content": (
                    "Attention is not just a trait; it is a practice. "
                    "When you train your attention, you become more aware of what is helpful and less distracted by noise, criticism, or fear. "
                    "High-performing athletes repeatedly return to their cues, process one moment at a time, and avoid getting trapped in distractions."
                ),
                "required_xp": 40,
                "xp_reward": 20,
                "order": 1,
            },
            {
                "title": "The Process Over Outcome Mindset",
                "description": "Use process-based thinking to stay calm and effective during competition.",
                "content": (
                    "Outcome-focused thinking can create pressure and narrow attention. "
                    "A process mindset keeps you grounded in the action that matters right now: stance, timing, effort, communication, and execution. "
                    "When your process stays clear, confidence becomes more stable and performance becomes more repeatable."
                ),
                "required_xp": 45,
                "xp_reward": 20,
                "order": 2,
            },
            {
                "title": "Decision-Making Under Stress",
                "description": "Create a better decision rhythm when the pace or pressure rises.",
                "content": (
                    "Stress slows decision-making when you are overloaded with information. "
                    "A useful tactic is to reduce the decision to one or two essential options, then choose the simplest high-quality action. "
                    "Athletes who manage stress effectively are more disciplined, calmer, and easier to trust in critical moments."
                ),
                "required_xp": 50,
                "xp_reward": 25,
                "order": 3,
            },
        ],
    },
    {
        "name": "Healthy Habits",
        "description": "Use daily routines to support confidence, stability, and long-term athlete wellbeing.",
        "order": 4,
        "lessons": [
            {
                "title": "Small Habits, Big Stability",
                "description": "See how daily rituals support mental consistency over time.",
                "content": (
                    "Strong athlete routines are built from small things repeated consistently, not dramatic efforts that cannot be sustained. "
                    "Habits like sleep hygiene, reflection, nutrition, breath resets, and honest check-ins reinforce emotional stability and physical readiness. "
                    "The goal is not perfection; it is consistency that creates trust in your process."
                ),
                "required_xp": 55,
                "xp_reward": 25,
                "order": 1,
            },
            {
                "title": "Reframing Setbacks",
                "description": "Turn errors into useful feedback instead of personal failure.",
                "content": (
                    "Setbacks are part of athletic life. The key is not to avoid them but to interpret them well. "
                    "Instead of asking, 'Why did I fail?', ask, 'What does this moment reveal, and what is one adjustment I can make next?' "
                    "This turns disappointment into direction and protects self-belief."
                ),
                "required_xp": 60,
                "xp_reward": 25,
                "order": 2,
            },
            {
                "title": "Building Emotional Awareness",
                "description": "Notice your emotional state before it becomes a decision problem.",
                "content": (
                    "Emotional awareness means recognizing what you are feeling before it takes over. "
                    "When you can name stress, frustration, disappointment, or excitement, you gain choice. "
                    "This awareness helps athletes respond with clarity instead of reacting impulsively."
                ),
                "required_xp": 65,
                "xp_reward": 30,
                "order": 3,
            },
        ],
    },
]


class Command(BaseCommand):

    help = "Seed Codex categories and lessons"

    def handle(self, *args, **options):

        category_count = 0
        lesson_count = 0

        for category_data in CATEGORIES:

            category, _ = (
                CodexCategory.objects.update_or_create(
                    name=category_data["name"],
                    defaults={
                        "description": category_data[
                            "description"
                        ],
                        "order": category_data["order"],
                        "is_active": True,
                    },
                )
            )

            category_count += 1

            for lesson_data in category_data["lessons"]:

                CodexLesson.objects.update_or_create(
                    category=category,
                    title=lesson_data["title"],
                    defaults={
                        "description": lesson_data[
                            "description"
                        ],
                        "content": lesson_data[
                            "content"
                        ],
                        "required_xp": lesson_data[
                            "required_xp"
                        ],
                        "xp_reward": lesson_data[
                            "xp_reward"
                        ],
                        "order": lesson_data[
                            "order"
                        ],
                        "is_active": True,
                    },
                )

                lesson_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Codex seeded successfully. "
                f"Categories: {category_count}, "
                f"Lessons: {lesson_count}"
            )
        )