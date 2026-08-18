from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .service.groq_service import generate_wellness_ai



from .models import (
    WellnessModule,
    UserModuleProgress,
    WellnessSession,
    WellnessCompletion,
    CodexCategory,
    CodexLesson,
    UserLessonProgress,
    MindfulMonsterStep,
    MindfulMonsterSession,
    BreathworkSession,
    ReframeSession,
    GritGardenSession,
    EmpathyScenario,
    EmpathySession,
    Counselor,
    CounselorRequest,
    TransitionResource,
    ResourceView,
    LockerRoomScenario,
    LockerRoomSession,
    ReactionPrompt,
    ReactionGameSession,
    IntegrityScenario,
    IntegritySession,
    SelfTalkEntry,
    CareerRoadmap,
    WordGridPuzzle,
    WordGridScore,
)
from .serializers import (
    WellnessModuleSerializer,
    UserModuleProgressSerializer,
    WellnessSessionSerializer,
    WellnessCompletionSerializer,
    CodexCategorySerializer,
    CodexLessonSerializer,
    MindfulMonsterStepSerializer,
    BreathworkSessionSerializer,
    ReframeSessionSerializer,
    GritGardenSessionSerializer,
    EmpathyScenarioSerializer,
    CounselorSerializer,
    CounselorRequestSerializer,
    TransitionResourceSerializer,
    LockerRoomScenarioSerializer,
    ReactionPromptSerializer,
    ReactionGameSessionSerializer,
    IntegrityScenarioSerializer,
    SelfTalkEntrySerializer,
    CareerRoadmapSerializer,
    WordGridPuzzleSerializer,
    WordGridScoreSerializer,
)
from .services import (
    get_module_by_slug,
    get_user_progress,
    get_user_module_progress,
    start_module,
    update_module_progress,
    complete_module,
    generate_setback_reframe,
    analyze_self_talk,
    evaluate_empathy_response,
)
from apps.gamification.service import award_xp
import traceback

# AI ASISSTANT


class WellnessAIAssistantView(APIView):
    def post(self, request):
        module_type = request.data.get('module_type')
        user_input = request.data.get('user_input', '')
        extra_context = request.data.get('extra_context', '')

        if not module_type:
            return Response({'error': 'module_type is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            ai_result = generate_wellness_ai(module_type, user_input, extra_context)
            return Response({
                'success': True,
                'module_type': module_type,
                'data': ai_result
            }, status=status.HTTP_200_OK)
        except Exception as e:
            print("\n" + "=" * 50)
            print("❌ GROQ AI ERROR IN BACKEND:")
            print(str(e))
            traceback.print_exc()
            print("=" * 50 + "\n")

            return Response({
                'success': False, 
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
# =============================================================
# 1. CORE SHARED LIFECYCLE APIS
# =============================================================

class WellnessModuleListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        modules = WellnessModule.objects.filter(status="active").order_by("order", "name")
        serializer = WellnessModuleSerializer(modules, many=True, context={"request": request})
        return Response({
            "success": True,
            "count": modules.count(),
            "modules": serializer.data,
        })


class WellnessModuleDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        module = get_module_by_slug(slug)
        if not module:
            return Response(
                {"success": False, "message": "Wellness module not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = WellnessModuleSerializer(module, context={"request": request})
        return Response({
            "success": True,
            "module": serializer.data,
        })


class WellnessModuleStartAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        module = get_module_by_slug(slug)
        if not module:
            return Response(
                {"success": False, "message": "Wellness module not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        try:
            progress, session = start_module(request.user, module)
        except ValueError as err:
            return Response(
                {"success": False, "message": str(err)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            "success": True,
            "message": f"Started {module.name}",
            "progress": UserModuleProgressSerializer(progress).data,
            "session": WellnessSessionSerializer(session).data if session else None,
        })


class WellnessModuleProgressUpdateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, slug):
        module = get_module_by_slug(slug)
        if not module:
            return Response(
                {"success": False, "message": "Wellness module not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        progress_val = request.data.get("progress")
        current_step = request.data.get("current_step")
        session_data = request.data.get("session_data")

        try:
            progress = update_module_progress(
                user=request.user,
                module=module,
                progress_value=progress_val,
                current_step=current_step,
                session_data=session_data,
            )
        except ValueError as err:
            return Response(
                {"success": False, "message": str(err)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            "success": True,
            "message": "Progress updated successfully.",
            "progress": UserModuleProgressSerializer(progress).data,
        })


class WellnessModuleCompleteAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        module = get_module_by_slug(slug)
        if not module:
            return Response(
                {"success": False, "message": "Wellness module not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        session_id = request.data.get("session_id")
        score = request.data.get("score", 0)

        session = None
        if session_id:
            session = WellnessSession.objects.filter(
                id=session_id,
                user=request.user,
                module=module,
            ).first()

        try:
            result = complete_module(
                user=request.user,
                module=module,
                session=session,
                score=score,
            )
        except ValueError as err:
            return Response(
                {"success": False, "message": str(err)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            "success": True,
            "already_completed": result["already_completed"],
            "message": (
                "Module was already completed previously."
                if result["already_completed"]
                else f"Congratulations! You completed {module.name}."
            ),
            "xp_awarded": result["xp_awarded"],
            "progress": UserModuleProgressSerializer(result["progress"]).data,
            "completion": WellnessCompletionSerializer(result["completion"]).data if result["completion"] else None,
        })


class WellnessMyProgressAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        progress = UserModuleProgress.objects.filter(user=request.user).select_related("module").order_by("module__order")
        return Response({
            "success": True,
            "count": progress.count(),
            "progress": UserModuleProgressSerializer(progress, many=True).data,
        })


# =============================================================
# 2. DEDICATED SUBMODULE SPECIFIC APIS
# =============================================================

# 1. Codex
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def codex_categories_view(request):
    categories = CodexCategory.objects.filter(is_active=True).prefetch_related("lessons")
    serializer = CodexCategorySerializer(categories, many=True, context={"request": request})
    return Response({"success": True, "categories": serializer.data})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def codex_lesson_detail_view(request, lesson_id):
    try:
        lesson = CodexLesson.objects.get(id=lesson_id, is_active=True)
    except CodexLesson.DoesNotExist:
        return Response({"success": False, "message": "Lesson not found."}, status=status.HTTP_404_NOT_FOUND)
    serializer = CodexLessonSerializer(lesson, context={"request": request})
    return Response({"success": True, "lesson": serializer.data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def codex_lesson_start_view(request, lesson_id):
    try:
        lesson = CodexLesson.objects.get(id=lesson_id, is_active=True)
    except CodexLesson.DoesNotExist:
        return Response({"success": False, "message": "Lesson not found."}, status=status.HTTP_404_NOT_FOUND)

    progress, _ = UserLessonProgress.objects.get_or_create(
        user=request.user,
        lesson=lesson,
        defaults={"status": "in_progress", "started_at": timezone.now(), "progress": 50},
    )
    if progress.status == "available":
        progress.status = "in_progress"
        progress.started_at = timezone.now()
        progress.save()

    return Response({"success": True, "status": progress.status, "progress": progress.progress})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def codex_lesson_complete_view(request, lesson_id):
    try:
        lesson = CodexLesson.objects.get(id=lesson_id, is_active=True)
    except CodexLesson.DoesNotExist:
        return Response({"success": False, "message": "Lesson not found."}, status=status.HTTP_404_NOT_FOUND)

    progress, created = UserLessonProgress.objects.get_or_create(
        user=request.user,
        lesson=lesson,
    )
    already_completed = progress.status == "completed"
    xp_awarded = 0

    if not already_completed:
        progress.status = "completed"
        progress.progress = 100
        progress.completed_at = timezone.now()
        progress.save()
        if lesson.xp_reward > 0:
            award_xp(request.user, lesson.xp_reward, "wellness_codex", f"Completed lesson: {lesson.title}")
            xp_awarded = lesson.xp_reward

    return Response({
        "success": True,
        "already_completed": already_completed,
        "xp_awarded": xp_awarded,
        "message": "Lesson marked as completed.",
    })


# 2. Mindful Monsters
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def mindful_monsters_steps_view(request):
    steps = MindfulMonsterStep.objects.filter(is_active=True).order_by("order")
    serializer = MindfulMonsterStepSerializer(steps, many=True)
    return Response({"success": True, "steps": serializer.data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mindful_monsters_record_view(request):
    completed_steps = request.data.get("completed_steps", 4)
    session = MindfulMonsterSession.objects.create(
        user=request.user,
        completed_steps=completed_steps,
        total_steps=4,
        status="completed",
        completed_at=timezone.now(),
    )
    return Response({"success": True, "session_id": session.id})


# 3. Breathwork
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def breathwork_info_view(request):
    return Response({
        "success": True,
        "duration_options": [
            {"minutes": 1, "label": "1 Minute Reset"},
            {"minutes": 3, "label": "3 Minutes Focus"},
            {"minutes": 5, "label": "5 Minutes Decompress"},
            {"minutes": 10, "label": "10 Minutes Deep State"},
        ],
        "technique": "Box Breathing (4s Inhale, 4s Hold, 4s Exhale, 4s Hold)",
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def breathwork_record_view(request):
    duration = int(request.data.get("duration_minutes", 3))
    elapsed = int(request.data.get("elapsed_seconds", duration * 60))
    session = BreathworkSession.objects.create(
        user=request.user,
        duration_minutes=duration,
        elapsed_seconds=elapsed,
        status="completed",
        completed_at=timezone.now(),
    )
    return Response({"success": True, "session": BreathworkSessionSerializer(session).data})


# 4. Setback Reframer
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def setback_reframe_generate_view(request):
    thought = request.data.get("negative_thought", "").strip()
    category = request.data.get("category", "performance")
    if not thought:
        return Response({"success": False, "message": "Please describe the setback or thought."}, status=status.HTTP_400_BAD_REQUEST)

    result = generate_setback_reframe(thought, category)
    session = ReframeSession.objects.create(
        user=request.user,
        negative_thought=thought,
        reframe=result["reframe"],
        safety_message=result["safety_message"],
        status="completed",
        completed_at=timezone.now(),
    )
    return Response({
        "success": True,
        "reframe": result["reframe"],
        "action_step": result["action_step"],
        "safety_message": result["safety_message"],
        "session_id": session.id,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def setback_reframe_history_view(request):
    sessions = ReframeSession.objects.filter(user=request.user).order_by("-created_at")[:10]
    return Response({"success": True, "history": ReframeSessionSerializer(sessions, many=True).data})


# 5. Grit Garden
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def grit_garden_save_view(request):
    exercise_type = request.data.get("exercise_type", "reflection")
    journal_text = request.data.get("journal_text", "")
    exercise_response = request.data.get("exercise_response", "")

    session = GritGardenSession.objects.create(
        user=request.user,
        exercise_type=exercise_type,
        journal_text=journal_text,
        exercise_response=exercise_response,
        status="completed",
        completed_at=timezone.now(),
    )
    return Response({"success": True, "session_id": session.id, "message": "Reflection saved to your Grit Garden."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def grit_garden_history_view(request):
    sessions = GritGardenSession.objects.filter(user=request.user).order_by("-created_at")[:10]
    return Response({"success": True, "history": GritGardenSessionSerializer(sessions, many=True).data})


# 6. Echoes of Empathy
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def echoes_of_empathy_scenarios_view(request):
    scenarios = EmpathyScenario.objects.filter(is_active=True).order_by("order")
    return Response({"success": True, "scenarios": EmpathyScenarioSerializer(scenarios, many=True).data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def echoes_of_empathy_submit_view(request):
    scenario_id = request.data.get("scenario_id")
    response_text = request.data.get("response", "").strip()

    try:
        scenario = EmpathyScenario.objects.get(id=scenario_id)
    except EmpathyScenario.DoesNotExist:
        return Response({"success": False, "message": "Scenario not found."}, status=status.HTTP_404_NOT_FOUND)

    eval_result = evaluate_empathy_response(scenario, response_text)
    session = EmpathySession.objects.create(
        user=request.user,
        scenario=scenario,
        response=response_text,
        feedback=eval_result["feedback"],
        score=eval_result["score"],
        status="completed",
        completed_at=timezone.now(),
    )
    return Response({
        "success": True,
        "score": eval_result["score"],
        "feedback": eval_result["feedback"],
        "metrics": eval_result["metrics"],
        "session_id": session.id,
    })


# 7. Counselor Hub
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def counselor_list_view(request):
    specialization = request.query_params.get("specialization")
    counselors = Counselor.objects.filter(is_available=True)
    if specialization:
        counselors = counselors.filter(specialization=specialization)
    return Response({"success": True, "counselors": CounselorSerializer(counselors, many=True).data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def counselor_request_create_view(request):
    serializer = CounselorRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    req = serializer.save(user=request.user)
    return Response({
        "success": True,
        "message": "Counselor request submitted. The team will follow up shortly.",
        "request": CounselorRequestSerializer(req).data,
    }, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def counselor_my_requests_view(request):
    reqs = CounselorRequest.objects.filter(user=request.user).order_by("-created_at")
    return Response({"success": True, "requests": CounselorRequestSerializer(reqs, many=True).data})


# 8. Transition Support
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def transition_resources_view(request):
    category = request.query_params.get("category")
    resources = TransitionResource.objects.filter(is_active=True).order_by("order")
    if category:
        resources = resources.filter(category=category)
    return Response({
        "success": True,
        "resources": TransitionResourceSerializer(resources, many=True, context={"request": request}).data,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def transition_resource_mark_viewed_view(request, resource_id):
    try:
        resource = TransitionResource.objects.get(id=resource_id)
    except TransitionResource.DoesNotExist:
        return Response({"success": False, "message": "Resource not found."}, status=status.HTTP_404_NOT_FOUND)

    ResourceView.objects.get_or_create(user=request.user, resource=resource)
    return Response({"success": True, "message": "Resource marked as viewed."})


# 9. Locker Room Realities
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def locker_room_scenarios_view(request):
    scenarios = LockerRoomScenario.objects.filter(is_active=True).order_by("order")
    return Response({"success": True, "scenarios": LockerRoomScenarioSerializer(scenarios, many=True).data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def locker_room_decide_view(request):
    scenario_id = request.data.get("scenario_id")
    choice_index = int(request.data.get("choice_index", 0))

    try:
        scenario = LockerRoomScenario.objects.get(id=scenario_id)
    except LockerRoomScenario.DoesNotExist:
        return Response({"success": False, "message": "Scenario not found."}, status=status.HTTP_404_NOT_FOUND)

    is_optimal = choice_index == scenario.correct_choice
    score = 100 if is_optimal else 60
    evaluation = (
        f"Optimal Decision! {scenario.explanation}"
        if is_optimal
        else f"Consider the team-wide impact: {scenario.explanation}"
    )

    session = LockerRoomSession.objects.create(
        user=request.user,
        scenario=scenario,
        selected_choice=choice_index,
        score=score,
        evaluation=evaluation,
        status="completed",
        completed_at=timezone.now(),
    )
    return Response({
        "success": True,
        "is_optimal": is_optimal,
        "score": score,
        "evaluation": evaluation,
        "session_id": session.id,
    })


# 10. Reaction Zone
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reaction_zone_prompts_view(request):
    prompts = ReactionPrompt.objects.filter(is_active=True)
    return Response({"success": True, "prompts": ReactionPromptSerializer(prompts, many=True).data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reaction_zone_submit_score_view(request):
    score = int(request.data.get("score", 0))
    correct = int(request.data.get("correct_answers", 0))
    total = int(request.data.get("total_prompts", 5))
    duration = int(request.data.get("duration_seconds", 10))

    session = ReactionGameSession.objects.create(
        user=request.user,
        score=score,
        correct_answers=correct,
        total_prompts=total,
        duration_seconds=duration,
        status="completed",
        completed_at=timezone.now(),
    )
    return Response({
        "success": True,
        "message": "Reaction score submitted!",
        "score": score,
        "session_id": session.id,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reaction_zone_leaderboard_view(request):
    top_scores = ReactionGameSession.objects.select_related("user").order_by("-score")[:10]
    return Response({"success": True, "leaderboard": ReactionGameSessionSerializer(top_scores, many=True).data})


# 11. Integrity Crossroads
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def integrity_scenarios_view(request):
    scenarios = IntegrityScenario.objects.filter(is_active=True).order_by("order")
    return Response({"success": True, "scenarios": IntegrityScenarioSerializer(scenarios, many=True).data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def integrity_submit_view(request):
    scenario_id = request.data.get("scenario_id")
    choice_index = int(request.data.get("choice_index", 0))
    reflection = request.data.get("reflection", "")

    try:
        scenario = IntegrityScenario.objects.get(id=scenario_id)
    except IntegrityScenario.DoesNotExist:
        return Response({"success": False, "message": "Scenario not found."}, status=status.HTTP_404_NOT_FOUND)

    choices = scenario.choices or []
    selected_choice = choices[choice_index] if 0 <= choice_index < len(choices) else {}
    score = selected_choice.get("score", 80)
    feedback = selected_choice.get("values_reflection") or scenario.explanation

    session = IntegritySession.objects.create(
        user=request.user,
        scenario=scenario,
        selected_choice=choice_index,
        reflection=reflection,
        score=score,
        status="completed",
    )
    return Response({
        "success": True,
        "score": score,
        "feedback": feedback,
        "session_id": session.id,
    })


# 12. Self-Talk Detective
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def self_talk_analyze_view(request):
    thought = request.data.get("negative_thought", "").strip()
    if not thought:
        return Response({"success": False, "message": "Please enter a self-talk statement."}, status=status.HTTP_400_BAD_REQUEST)

    analysis_res = analyze_self_talk(thought)
    entry = SelfTalkEntry.objects.create(
        user=request.user,
        negative_thought=thought,
        distortion_type=analysis_res["distortion_type"],
        analysis=analysis_res["analysis"],
        suggested_rewrite=analysis_res["suggested_rewrite"],
        actionable_tip=analysis_res["actionable_tip"],
    )
    return Response({
        "success": True,
        "entry": SelfTalkEntrySerializer(entry).data,
        "distortion_label": analysis_res["distortion_label"],
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def self_talk_history_view(request):
    entries = SelfTalkEntry.objects.filter(user=request.user).order_by("-created_at")[:10]
    return Response({"success": True, "history": SelfTalkEntrySerializer(entries, many=True).data})


# 13. Career Forge
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def career_forge_roadmap_view(request):
    roadmap = CareerRoadmap.objects.filter(user=request.user).first()
    return Response({
        "success": True,
        "roadmap": CareerRoadmapSerializer(roadmap).data if roadmap else None,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def career_forge_save_view(request):
    target_role = request.data.get("target_role", "Sports Performance Specialist")
    industry = request.data.get("industry", "Athletics & Sports Tech")
    transferable_skills = request.data.get("transferable_skills", [])
    milestones = request.data.get("milestones", [])
    financial_goals = request.data.get("financial_goals", "")
    timeline_months = int(request.data.get("timeline_months", 12))
    notes = request.data.get("notes", "")

    roadmap, _ = CareerRoadmap.objects.update_or_create(
        user=request.user,
        defaults={
            "target_role": target_role,
            "industry": industry,
            "transferable_skills": transferable_skills,
            "milestones": milestones,
            "financial_goals": financial_goals,
            "timeline_months": timeline_months,
            "notes": notes,
        },
    )
    return Response({
        "success": True,
        "message": "Career roadmap saved successfully.",
        "roadmap": CareerRoadmapSerializer(roadmap).data,
    })


# 14. Word Grid
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def word_grid_daily_view(request):
    today = timezone.localdate()
    puzzle = WordGridPuzzle.objects.filter(is_active=True).first()
    if not puzzle:
        # Default fallback puzzle
        puzzle = WordGridPuzzle.objects.create(
            puzzle_date=today,
            title="Athlete Mental Focus",
            theme="Mindset & Resilience",
            grid=[
                ["F", "O", "C", "U", "S", "M"],
                ["R", "E", "S", "E", "T", "I"],
                ["G", "R", "I", "T", "P", "N"],
                ["C", "A", "L", "M", "E", "D"],
                ["P", "O", "W", "E", "R", "S"],
                ["Z", "O", "N", "E", "A", "T"],
            ],
            target_words=[
                {"word": "FOCUS", "hint": "Concentration on the present task"},
                {"word": "GRIT", "hint": "Passion and sustained perseverance"},
                {"word": "RESET", "hint": "Quickly clearing the mind after an error"},
                {"word": "CALM", "hint": "Maintaining physiological composure"},
                {"word": "POWER", "hint": "Internal strength and explosiveness"},
                {"word": "ZONE", "hint": "Optimal state of athletic flow"},
            ],
        )

    user_score = WordGridScore.objects.filter(user=request.user, puzzle=puzzle).first()
    return Response({
        "success": True,
        "puzzle": WordGridPuzzleSerializer(puzzle).data,
        "user_score": WordGridScoreSerializer(user_score).data if user_score else None,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def word_grid_submit_view(request):
    puzzle_id = request.data.get("puzzle_id")
    words_found = request.data.get("words_found", [])
    time_taken = int(request.data.get("time_taken_seconds", 60))
    score = int(request.data.get("score", len(words_found) * 50))

    try:
        puzzle = WordGridPuzzle.objects.get(id=puzzle_id)
    except WordGridPuzzle.DoesNotExist:
        return Response({"success": False, "message": "Puzzle not found."}, status=status.HTTP_404_NOT_FOUND)

    score_obj, created = WordGridScore.objects.update_or_create(
        user=request.user,
        puzzle=puzzle,
        defaults={
            "words_found": words_found,
            "time_taken_seconds": time_taken,
            "score": score,
        },
    )
    return Response({
        "success": True,
        "message": "Word Grid score recorded!",
        "score": score_obj.score,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def word_grid_leaderboard_view(request):
    today = timezone.localdate()
    scores = WordGridScore.objects.select_related("user", "puzzle").order_by("-score", "time_taken_seconds")[:10]
    return Response({"success": True, "leaderboard": WordGridScoreSerializer(scores, many=True).data})