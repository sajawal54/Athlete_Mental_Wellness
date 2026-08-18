from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.wellness.models import (
    WellnessModule,
    CodexCategory,
    CodexLesson,
    MindfulMonsterStep,
    Counselor,
    TransitionResource,
    EmpathyScenario,
    LockerRoomScenario,
    ReactionPrompt,
    IntegrityScenario,
    WordGridPuzzle,
)

MODULES = [
    {
        "name": "Codex",
        "slug": "codex",
        "module_type": "codex",
        "icon": "📖",
        "description": "Categories, lessons, locked content, and point-based unlocking.",
        "required_xp": 0,
        "xp_reward": 25,
        "order": 1,
        "instructions": "Explore mental performance categories, unlock premium lessons with your XP points, and test your understanding to earn rewards.",
    },
    {
        "name": "Mindful Monsters",
        "slug": "mindful-monsters",
        "module_type": "mindful_monsters",
        "icon": "👾",
        "description": "Guided breathing with interactive steps.",
        "required_xp": 0,
        "xp_reward": 25,
        "order": 2,
        "instructions": "Follow the monster breathing guide through 4 rhythmic phases: Inhale, Hold, Exhale, and Relax.",
    },
    {
        "name": "Breathwork",
        "slug": "breathwork",
        "module_type": "breathwork",
        "icon": "🫁",
        "description": "Animated breathing circle, timer, and session summary.",
        "required_xp": 0,
        "xp_reward": 30,
        "order": 3,
        "instructions": "Select your target session duration (1, 3, 5, or 10 min), follow the animated breathing circle, and complete your session.",
    },
    {
        "name": "Setback Reframer",
        "slug": "setback-reframer",
        "module_type": "setback_reframer",
        "icon": "🧠",
        "description": "Turn a negative thought into a positive reframe.",
        "required_xp": 0,
        "xp_reward": 35,
        "order": 4,
        "instructions": "Type in a frustrating thought or setback. Our cognitive reframing engine will provide an empowering reframe, actionable steps, and safety messaging.",
    },
    {
        "name": "Grit Garden",
        "slug": "grit-garden",
        "module_type": "grit_garden",
        "icon": "🌱",
        "description": "Reflection journal and stress-release exercises.",
        "required_xp": 0,
        "xp_reward": 30,
        "order": 5,
        "instructions": "Select a reflection prompt (Toughness, Gratitude, Growth), write your journal entry (with autosave), and complete the 3-step grounding release.",
    },
    {
        "name": "Echoes of Empathy",
        "slug": "echoes-of-empathy",
        "module_type": "echoes_of_empathy",
        "icon": "🗣️",
        "description": "Conversation practice with AI feedback and score.",
        "required_xp": 0,
        "xp_reward": 40,
        "order": 6,
        "instructions": "Read the dialogue situation between teammates or coaches, craft your response, and review your empathy score breakdown.",
    },
    {
        "name": "Counselor Hub",
        "slug": "counselor-hub",
        "module_type": "counselor_hub",
        "icon": "👨‍⚕️",
        "description": "Browse counselors and request support.",
        "required_xp": 0,
        "xp_reward": 20,
        "order": 7,
        "instructions": "Browse certified mental performance counselors, filter by specialty, and submit an appointment or callback request.",
    },
    {
        "name": "Transition Support",
        "slug": "transition-support",
        "module_type": "transition_support",
        "icon": "🎓",
        "description": "Career resources, educational articles, downloads.",
        "required_xp": 0,
        "xp_reward": 25,
        "order": 8,
        "instructions": "Explore comprehensive career & identity transition resources, read in-depth articles, and track viewed guides.",
    },
    {
        "name": "Locker Room Realities",
        "slug": "locker-room-realities",
        "module_type": "locker_room_realities",
        "icon": "🏆",
        "description": "Scenario cards, decisions, and AI evaluation.",
        "required_xp": 0,
        "xp_reward": 35,
        "order": 9,
        "instructions": "Review the locker room crisis, choose your decision path, and evaluate the leadership impact and team culture outcome.",
    },
    {
        "name": "Reaction Zone",
        "slug": "reaction-zone",
        "module_type": "reaction_zone",
        "icon": "⚡",
        "description": "Reaction game, timer, and high scores.",
        "required_xp": 0,
        "xp_reward": 30,
        "order": 10,
        "instructions": "React as fast as possible when the stimulus turns GREEN. Avoid false starts and climb the high score leaderboard.",
    },
    {
        "name": "Integrity Crossroads",
        "slug": "integrity-crossroads",
        "module_type": "integrity_crossroads",
        "icon": "⚖️",
        "description": "Ethical scenarios and decision feedback.",
        "required_xp": 20,
        "xp_reward": 35,
        "order": 11,
        "instructions": "Navigate ethical crossroads in competitive athletics, choose your stance, and see how your decisions align with core integrity values.",
    },
    {
        "name": "Self-Talk Detective",
        "slug": "self-talk-detective",
        "module_type": "self_talk_detective",
        "icon": "🔎",
        "description": "Thought entry, AI analysis, and improvements.",
        "required_xp": 25,
        "xp_reward": 30,
        "order": 12,
        "instructions": "Enter an unhelpful internal thought. The detective will identify the cognitive distortion and generate an elite rewrite.",
    },
    {
        "name": "Career Forge",
        "slug": "career-forge",
        "module_type": "career_forge",
        "icon": "🛠️",
        "description": "Career planner, financial goals, and roadmap.",
        "required_xp": 30,
        "xp_reward": 40,
        "order": 13,
        "instructions": "Build your career roadmap step-by-step: translate sports skills to industry, set quarterly milestones, and export your plan.",
    },
    {
        "name": "Word Grid",
        "slug": "word-grid",
        "module_type": "word_grid",
        "icon": "🧩",
        "description": "Daily puzzle, score, and leaderboard.",
        "required_xp": 15,
        "xp_reward": 25,
        "order": 14,
        "instructions": "Find all hidden mental toughness words in the daily puzzle grid against the clock to earn focus bonus points.",
    },
]


class Command(BaseCommand):
    help = "Seed all 14 Wellness Modules and clean up legacy duplicates"

    def handle(self, *args, **options):
        self.stdout.write("Cleaning and Seeding Wellness Modules...")

        valid_slugs = [m["slug"] for m in MODULES]

        # 1. Remove duplicate or obsolete module rows not in valid slugs
        deleted_count, _ = WellnessModule.objects.exclude(slug__in=valid_slugs).delete()
        if deleted_count > 0:
            self.stdout.write(f"Removed {deleted_count} obsolete/duplicate module entries.")

        # 2. Seed / Update the 14 clean modules
        for mod_data in MODULES:
            WellnessModule.objects.update_or_create(
                slug=mod_data["slug"],
                defaults=mod_data,
            )

        # 3. Seed Codex Content with point-based unlocking
        cat_performance, _ = CodexCategory.objects.update_or_create(
            name="Performance Psychology",
            defaults={"description": "Techniques to perform at your absolute best when pressure peaks.", "order": 1},
        )
        cat_recovery, _ = CodexCategory.objects.update_or_create(
            name="Mental Recovery & Rest",
            defaults={"description": "Neuroplasticity, sleep hygiene, and active psychological decompression.", "order": 2},
        )
        cat_team, _ = CodexCategory.objects.update_or_create(
            name="Team Culture & Cohesion",
            defaults={"description": "Effective communication, constructive feedback, and locker room dynamics.", "order": 3},
        )

        CodexLesson.objects.update_or_create(
            title="The 4-Second Flush: Resetting After Errors",
            category=cat_performance,
            defaults={
                "description": "How elite athletes let go of mistakes within seconds rather than spiraling.",
                "content": (
                    "When an error occurs on the field or court, the brain's amygdala immediately triggers a surge of cortisol and adrenaline. "
                    "If you dwell on the mistake, this stress response narrows your peripheral vision and degrades motor coordination.\n\n"
                    "**The 4-Second Flush Technique:**\n"
                    "1. **Physical Trigger (1 sec):** Perform a brief physical action (e.g., tap your cleats, adjust your wristband) to signal a hard reset.\n"
                    "2. **Diaphragmatic Breath (2 sec):** Inhale deeply through the nose, release with a forceful exhale to drop muscle tension.\n"
                    "3. **Process Cue (1 sec):** Recite a 2-word present-moment cue: 'Next Play' or 'Eyes Up'.\n\n"
                    "Elite athletes don't make fewer mistakes—they recover from them 10 times faster."
                ),
                "required_xp": 0,
                "xp_reward": 15,
                "order": 1,
            },
        )

        CodexLesson.objects.update_or_create(
            title="Pre-Competition Arousal Management",
            category=cat_performance,
            defaults={
                "description": "Find your Individual Zone of Optimal Functioning (IZOF).",
                "content": (
                    "Every athlete has a distinct level of physiological arousal where they perform best. "
                    "Some need high energy and music; others require calm, deliberate stillness.\n\n"
                    "**How to calibrate your state:**\n"
                    "- **If Too Anxious (Over-aroused):** Lengthen your exhales to activate the parasympathetic nervous system (e.g., 4s Inhale, 7s Exhale).\n"
                    "- **If Sluggish (Under-aroused):** Use rapid breathing (bellows breath) and dynamic explosive warmups to engage neural firing.\n\n"
                    "Track your state before each competition to discover your personal peak baseline."
                ),
                "required_xp": 0,
                "xp_reward": 15,
                "order": 2,
            },
        )

        CodexLesson.objects.update_or_create(
            title="Psychological Decompression Post-Game",
            category=cat_recovery,
            defaults={
                "description": "Switch off high-alert nervous system states after competition.",
                "content": (
                    "Remaining in a heightened sympathetic state hours after a match damages REM sleep, immune response, and tissue repair.\n\n"
                    "**The 30-Minute Cool Down Rule:**\n"
                    "1. Disconnect from social media and performance comment sections.\n"
                    "2. Take a warm shower with conscious sensory grounding.\n"
                    "3. Write down 3 raw thoughts on paper to empty mental bandwidth before bed."
                ),
                "required_xp": 10,
                "xp_reward": 20,
                "order": 1,
            },
        )

        CodexLesson.objects.update_or_create(
            title="Advanced Neuro-Priming & Mental Imagery",
            category=cat_performance,
            defaults={
                "description": "Unlock internal motor-cortex visualization routines used by world champions.",
                "content": (
                    "PETTLEP Imagery Protocol:\n"
                    "1. **Physical:** Stand in your actual athletic stance wearing your gear.\n"
                    "2. **Environment:** Visualize the sounds, arena lighting, and crowd atmosphere.\n"
                    "3. **Task:** Rehearse the exact timing and sensory feedback of optimal execution.\n"
                    "4. **Emotion:** Feel the controlled adrenaline and laser-sharp confidence in your chest."
                ),
                "required_xp": 25,
                "xp_reward": 30,
                "order": 3,
            },
        )

        # 4. Seed Mindful Monsters Steps
        steps_data = [
            {"title": "Monster Inhale", "phase": "inhale", "duration_seconds": 4, "instruction": "Draw deep breath through your diaphragm. Feel the monster expand with positive energy.", "order": 1},
            {"title": "Hold & Lock", "phase": "hold", "duration_seconds": 4, "instruction": "Hold gently at the top. Let stillness settle into every muscle.", "order": 2},
            {"title": "Monster Roar Exhale", "phase": "exhale", "duration_seconds": 4, "instruction": "Breathe out slowly and evenly. Blow away all doubt and tension.", "order": 3},
            {"title": "Centered & Grounded", "phase": "relax", "duration_seconds": 4, "instruction": "Rest quietly in the space between breaths. You are balanced, ready, and locked in.", "order": 4},
        ]
        for s in steps_data:
            MindfulMonsterStep.objects.update_or_create(title=s["title"], defaults=s)

        # 5. Seed Counselors
        counselors_data = [
            {
                "name": "Dr. Elena Vasquez, PsyD",
                "specialization": "sports_psychology",
                "experience_years": 12,
                "location": "High Performance Center (Virtual & In-Person)",
                "bio": "Former collegiate track athlete specializing in pre-game choking, performance anxiety, and Olympic athlete preparation.",
                "email": "elena.vasquez@athletewellness.org",
                "phone": "+1 (555) 234-5678",
                "is_available": True,
            },
            {
                "name": "Marcus Sterling, LMFT",
                "specialization": "stress",
                "experience_years": 9,
                "location": "West Coast Wellness Clinic",
                "bio": "Specializes in athlete burnout, relationship stress, and navigating high-stakes team contract pressures.",
                "email": "marcus.sterling@athletewellness.org",
                "phone": "+1 (555) 876-5432",
                "is_available": True,
            },
            {
                "name": "Dr. Maya Lin, PhD",
                "specialization": "career",
                "experience_years": 15,
                "location": "Athlete Transition Institute",
                "bio": "Expert in athletic identity transition, retirement planning, post-injury career pivoting, and executive mentorship.",
                "email": "maya.lin@athletewellness.org",
                "phone": "+1 (555) 345-6789",
                "is_available": True,
            },
        ]
        for c in counselors_data:
            Counselor.objects.update_or_create(name=c["name"], defaults=c)

        # 6. Seed Transition Resources
        resources_data = [
            {
                "title": "Translating Athletic Leadership to Tech & Business",
                "category": "career",
                "resource_type": "article",
                "description": "How to convert captains' grit, rapid decision-making, and coachability into high-impact corporate roles.",
                "content": (
                    "Athletes frequently undervalue their skill set when entering the corporate world. "
                    "However, companies actively search for candidates who thrive in high-accountability environments.\n\n"
                    "### Key Transferable Competencies:\n"
                    "1. **Rapid Feedback Integration:** Athletes take direct critique, adjust within minutes, and execute without bruised egos.\n"
                    "2. **Resilience Under Pressure:** When a product launch slips or targets miss, athletes remain calm and solution-oriented.\n"
                    "3. **Team-First Mental Models:** Athletes understand cross-functional sacrifice to achieve a shared North Star goal."
                ),
                "order": 1,
            },
            {
                "title": "Financial Playbook: Managing Contracts & Post-Sport Wealth",
                "category": "financial",
                "resource_type": "guide",
                "description": "Essential strategies for tax planning, non-liquid investments, and creating multi-decade financial stability.",
                "content": (
                    "An athletic career has an atypical earning curve: high compression in your 20s followed by decades of transition. "
                    "Protecting capital requires proactive defense.\n\n"
                    "### The 3 Core Rules:\n"
                    "- Live on a fixed monthly stipend regardless of bonus swings.\n"
                    "- Build a 12-month emergency runway before speculative investing.\n"
                    "- Work only with fee-only fiduciary financial planners who do not take product commissions."
                ),
                "order": 2,
            },
            {
                "title": "Navigating Identity Loss When the Jersey Comes Off",
                "category": "life_after_sport",
                "resource_type": "article",
                "description": "Overcoming the psychological void of leaving competitive athletics and building your next life mission.",
                "content": (
                    "When your entire life has been organized around training schedules, travel, and competition, stopping can feel like losing your self-definition.\n\n"
                    "**Reframing Identity:**\n"
                    "You are not simply 'a basketball player' or 'a swimmer'. You are a disciplined, driven individual who utilized sport as their primary vehicle for growth. "
                    "The vehicle changes, but your internal engine remains."
                ),
                "order": 3,
            },
        ]
        for r in resources_data:
            TransitionResource.objects.update_or_create(title=r["title"], defaults=r)

        # 7. Seed Echoes of Empathy Scenarios
        empathy_scenarios = [
            {
                "title": "A Benched Teammate Expressing Frustration",
                "situation": "Your star teammate was suddenly benched by the head coach during the 4th quarter and is visibly angry in the locker room, threatening to skip tomorrow's training.",
                "prompt": "How do you respond to acknowledge their pain while keeping them aligned with the team's bigger goal?",
                "difficulty": "Intermediate",
                "order": 1,
            },
            {
                "title": "A Rookie Paralyzed by Fear of Making Mistakes",
                "situation": "A younger rookie player approaches you after practice with tears in their eyes, saying they feel out of their league and are terrified of disappointing the squad.",
                "prompt": "What do you say to validate their vulnerability and rebuild their confidence?",
                "difficulty": "Beginner",
                "order": 2,
            },
            {
                "title": "Disagreement Over Captain's Feedback",
                "situation": "During a film review session, a teammate accuses you in front of the team of being overly harsh and picking on their defensive mistakes.",
                "prompt": "How do you respond in the moment to de-escalate tension and maintain mutual trust?",
                "difficulty": "Advanced",
                "order": 3,
            },
        ]
        for e in empathy_scenarios:
            EmpathyScenario.objects.update_or_create(title=e["title"], defaults=e)

        # 8. Seed Locker Room Scenarios
        locker_scenarios = [
            {
                "title": "The Rumor Mill Before Championship Week",
                "situation": "Two days before your conference championship, rumors leak that the head coach might leave for a rival school next season. The locker room is distracted and arguing.",
                "question": "What is your immediate leadership action as a senior player?",
                "choices": [
                    {"text": "Call a closed-door player-only meeting to refocus everyone on the game plan and park rumors until Monday.", "is_optimal": True},
                    {"text": "Confront the coach aggressively in front of everyone to demand answers right away.", "is_optimal": False},
                    {"text": "Stay quiet in your corner and let the team figure it out on their own.", "is_optimal": False},
                    {"text": "Post on social media about team loyalty to pressure the coaching staff.", "is_optimal": False},
                ],
                "correct_choice": 0,
                "explanation": "Calling a player-only huddle creates an emotional container that shields the team from external distractions and refocuses collective energy on execution.",
                "difficulty": "Intermediate",
                "order": 1,
            },
            {
                "title": "Teammate Concealing a Severe Concussion",
                "situation": "Your starting point guard took a heavy blow to the head in the first half. During halftime, they whisper to you that they have double vision, but beg you not to tell the trainer so they can play.",
                "question": "What is the responsible ethical and team decision?",
                "choices": [
                    {"text": "Immediately alert the medical staff and team trainer, prioritizing their brain health and long-term safety over the single game.", "is_optimal": True},
                    {"text": "Agree to stay quiet and hope they don't take another hit.", "is_optimal": False},
                    {"text": "Tell them to play 5 minutes and see how they feel.", "is_optimal": False},
                    {"text": "Advise them to drink an energy drink to stay sharp.", "is_optimal": False},
                ],
                "correct_choice": 0,
                "explanation": "Player safety is non-negotiable. Concealing a concussion can lead to Second-Impact Syndrome and catastrophic brain trauma. True teammates protect each other's futures.",
                "difficulty": "High",
                "order": 2,
            },
        ]
        for ls in locker_scenarios:
            LockerRoomScenario.objects.update_or_create(title=ls["title"], defaults=ls)

        # 9. Seed Reaction Prompts
        prompts_data = [
            {"prompt": "GREEN LIGHT - TAP NOW!", "correct_answer": "tap", "difficulty": "easy"},
            {"prompt": "RED LIGHT - DO NOT TAP!", "correct_answer": "wait", "difficulty": "easy"},
            {"prompt": "FAST BREAK: TAP LEFT!", "correct_answer": "left", "difficulty": "medium"},
            {"prompt": "STEAL: TAP RIGHT!", "correct_answer": "right", "difficulty": "medium"},
        ]
        for p in prompts_data:
            ReactionPrompt.objects.update_or_create(prompt=p["prompt"], defaults=p)

        # 10. Seed Integrity Scenarios
        integrity_data = [
            {
                "title": "The Unreported Scorekeeper Error",
                "category": "Fair Play",
                "dilemma": "In the closing minutes of a tight semifinal, the official score table mistakenly awards your team an extra point on a foul shot. The referees don't notice.",
                "choices": [
                    {
                        "text": "Inform the referee immediately so the score is corrected honestly.",
                        "score": 100,
                        "values_reflection": "High Integrity: You chose pure sportsmanship over unearned advantage. Winning with honor builds lasting character.",
                    },
                    {
                        "text": "Say nothing and celebrate the win quietly if nobody notices.",
                        "score": 25,
                        "values_reflection": "Compromised Integrity: Relying on official oversight compromises the core spirit of fair competition.",
                    },
                    {
                        "text": "Tell your coach after the match so they can decide how to handle it.",
                        "score": 75,
                        "values_reflection": "Moderate Integrity: You acknowledged the truth, but delayed taking immediate on-court ownership.",
                    },
                ],
                "explanation": "True champions win on merit. Reporting errors reinforces a culture of undeniable integrity.",
                "order": 1,
            },
            {
                "title": "Sponsorship vs Personal Values",
                "category": "Ethics",
                "dilemma": "You are offered a lucrative NIL / sponsorship deal by an energy supplement company, but you discover their product contains undisclosed fillers banned by athletic leagues.",
                "choices": [
                    {
                        "text": "Decline the sponsorship contract and prioritize your health and compliance.",
                        "score": 100,
                        "values_reflection": "High Moral Ground: Protecting your reputation and clean athletic standard is worth far more than short-term money.",
                    },
                    {
                        "text": "Sign the deal but don't personally consume the product.",
                        "score": 35,
                        "values_reflection": "Deceptive Endorsement: Promoting a questionable product to fans compromises trust and transparency.",
                    },
                    {
                        "text": "Ask the company to provide certified third-party testing (NSF for Sport) before signing.",
                        "score": 95,
                        "values_reflection": "Constructive Due Diligence: You used your leverage to demand accountability and high standards.",
                    },
                ],
                "explanation": "Endorsements reflect your personal brand and values. Clean athletes protect their integrity.",
                "order": 2,
            },
        ]
        for idata in integrity_data:
            IntegrityScenario.objects.update_or_create(title=idata["title"], defaults=idata)

        # 11. Seed Word Grid Puzzle
        today = timezone.localdate()
        WordGridPuzzle.objects.update_or_create(
            puzzle_date=today,
            defaults={
                "title": "Athlete Mental Focus",
                "theme": "Resilience & Focus",
                "grid": [
                    ["F", "O", "C", "U", "S", "M"],
                    ["R", "E", "S", "E", "T", "I"],
                    ["G", "R", "I", "T", "P", "N"],
                    ["C", "A", "L", "M", "E", "D"],
                    ["P", "O", "W", "E", "R", "S"],
                    ["Z", "O", "N", "E", "A", "T"],
                ],
                "target_words": [
                    {"word": "FOCUS", "hint": "Concentration on the present task"},
                    {"word": "GRIT", "hint": "Passion and sustained perseverance"},
                    {"word": "RESET", "hint": "Quickly clearing the mind after an error"},
                    {"word": "CALM", "hint": "Maintaining physiological composure"},
                    {"word": "POWER", "hint": "Internal strength and explosiveness"},
                    {"word": "ZONE", "hint": "Optimal state of athletic flow"},
                ],
            },
        )

        self.stdout.write(self.style.SUCCESS("All 14 Wellness Modules and seed data cleaned and synced successfully!"))