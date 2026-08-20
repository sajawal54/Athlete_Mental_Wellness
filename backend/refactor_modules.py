import os

backend_dir = r"D:\Projects\Athlete_Mental_Wellness\backend"
wellness_dir = os.path.join(backend_dir, "apps", "wellness")
modules_dir = os.path.join(wellness_dir, "modules")

with open(os.path.join(wellness_dir, "views.py"), "r", encoding="utf-8") as f:
    main_views_lines = f.readlines()

with open(os.path.join(wellness_dir, "serializers.py"), "r", encoding="utf-8") as f:
    main_serializers_lines = f.readlines()

def is_boundary(line):
    stripped = line.strip()
    if not stripped:
        return False
    if stripped.startswith("def ") or stripped.startswith("class ") or stripped.startswith("@"):
        return True
    if stripped.startswith("#"):
        return True
    return False

# Find line ranges for each function in views.py
func_ranges = {}
func_names = [
    "codex_categories_view", "codex_lesson_detail_view", "codex_lesson_start_view", "codex_lesson_complete_view",
    "mindful_monsters_steps_view", "mindful_monsters_record_view",
    "breathwork_info_view", "breathwork_record_view",
    "setback_reframe_generate_view", "setback_reframe_history_view",
    "grit_garden_save_view", "grit_garden_history_view",
    "echoes_of_empathy_scenarios_view", "echoes_of_empathy_submit_view",
    "counselor_list_view", "counselor_request_create_view", "counselor_my_requests_view",
    "transition_resources_view", "transition_resource_mark_viewed_view",
    "locker_room_scenarios_view", "locker_room_decide_view",
    "reaction_zone_prompts_view", "reaction_zone_submit_score_view", "reaction_zone_leaderboard_view",
    "integrity_scenarios_view", "integrity_submit_view",
    "self_talk_analyze_view", "self_talk_history_view",
    "career_forge_roadmap_view", "career_forge_save_view",
    "word_grid_daily_view", "word_grid_submit_view", "word_grid_leaderboard_view",
]

for i, line in enumerate(main_views_lines):
    for func_name in func_names:
        if line.strip().startswith(f"def {func_name}("):
            func_ranges[func_name] = {"start": i}

for func_name, start_info in func_ranges.items():
    start = start_info["start"]
    end = len(main_views_lines)
    for j in range(start + 1, len(main_views_lines)):
        if is_boundary(main_views_lines[j]):
            end = j
            break
    func_ranges[func_name]["end"] = end

# Find line ranges for each class in serializers.py
class_ranges = {}
class_names = [
    "CodexLessonSerializer", "CodexCategorySerializer",
    "MindfulMonsterStepSerializer",
    "BreathworkSessionSerializer",
    "ReframeSessionSerializer",
    "GritGardenSessionSerializer",
    "EmpathyScenarioSerializer",
    "CounselorSerializer", "CounselorRequestSerializer",
    "TransitionResourceSerializer",
    "LockerRoomScenarioSerializer",
    "ReactionPromptSerializer", "ReactionGameSessionSerializer",
    "IntegrityScenarioSerializer",
    "SelfTalkEntrySerializer",
    "CareerRoadmapSerializer",
    "WordGridPuzzleSerializer", "WordGridScoreSerializer",
]

for i, line in enumerate(main_serializers_lines):
    for class_name in class_names:
        if line.strip().startswith(f"class {class_name}("):
            class_ranges[class_name] = {"start": i}

for class_name, start_info in class_ranges.items():
    start = start_info["start"]
    end = len(main_serializers_lines)
    for j in range(start + 1, len(main_serializers_lines)):
        stripped = main_serializers_lines[j].strip()
        if stripped.startswith("class "):
            end = j
            break
    class_ranges[class_name]["end"] = end

# Module mapping
modules = [
    ("codex", ["codex_categories_view", "codex_lesson_detail_view", "codex_lesson_start_view", "codex_lesson_complete_view"],
     ["CodexLessonSerializer", "CodexCategorySerializer"]),
    ("mindful_monsters", ["mindful_monsters_steps_view", "mindful_monsters_record_view"],
     ["MindfulMonsterStepSerializer"]),
    ("breathwork", ["breathwork_info_view", "breathwork_record_view"],
     ["BreathworkSessionSerializer"]),
    ("setback_reframer", ["setback_reframe_generate_view", "setback_reframe_history_view"],
     ["ReframeSessionSerializer"]),
    ("grit_garden", ["grit_garden_save_view", "grit_garden_history_view"],
     ["GritGardenSessionSerializer"]),
    ("echoes_of_empathy", ["echoes_of_empathy_scenarios_view", "echoes_of_empathy_submit_view"],
     ["EmpathyScenarioSerializer"]),
    ("counselor_hub", ["counselor_list_view", "counselor_request_create_view", "counselor_my_requests_view"],
     ["CounselorSerializer", "CounselorRequestSerializer"]),
    ("transition_support", ["transition_resources_view", "transition_resource_mark_viewed_view"],
     ["TransitionResourceSerializer"]),
    ("locker_room_realities", ["locker_room_scenarios_view", "locker_room_decide_view"],
     ["LockerRoomScenarioSerializer"]),
    ("reaction_zone", ["reaction_zone_prompts_view", "reaction_zone_submit_score_view", "reaction_zone_leaderboard_view"],
     ["ReactionPromptSerializer", "ReactionGameSessionSerializer"]),
    ("integrity_crossroads", ["integrity_scenarios_view", "integrity_submit_view"],
     ["IntegrityScenarioSerializer"]),
    ("self_talk_detective", ["self_talk_analyze_view", "self_talk_history_view"],
     ["SelfTalkEntrySerializer"]),
    ("career_forge", ["career_forge_roadmap_view", "career_forge_save_view"],
     ["CareerRoadmapSerializer"]),
    ("word_grid", ["word_grid_daily_view", "word_grid_submit_view", "word_grid_leaderboard_view"],
     ["WordGridPuzzleSerializer", "WordGridScoreSerializer"]),
]

for folder, view_funcs, serializer_classes in modules:
    module_path = os.path.join(modules_dir, folder)
    
    # Build views.py content
    views_lines = []
    for func_name in view_funcs:
        if func_name in func_ranges:
            start = func_ranges[func_name]["start"]
            end = func_ranges[func_name]["end"]
            views_lines.extend(main_views_lines[start:end])
            views_lines.append("\n")
    
    views_content = "".join(views_lines)
    views_content = views_content.replace("from .models import", "from ..models import")
    views_content = views_content.replace("from .services import", "from ..services import")
    
    with open(os.path.join(module_path, "views.py"), "w", encoding="utf-8") as f:
        f.write(views_content.strip() + "\n")
    print(f"Wrote views.py for {folder}: {len(views_lines)} lines")
    
    # Build serializers.py content
    serializers_lines = []
    for class_name in serializer_classes:
        if class_name in class_ranges:
            start = class_ranges[class_name]["start"]
            end = class_ranges[class_name]["end"]
            serializers_lines.extend(main_serializers_lines[start:end])
            serializers_lines.append("\n")
    
    serializers_content = "".join(serializers_lines)
    serializers_content = serializers_content.replace("from .models import", "from ..models import")
    
    with open(os.path.join(module_path, "serializers.py"), "w", encoding="utf-8") as f:
        f.write(serializers_content.strip() + "\n")
    print(f"Wrote serializers.py for {folder}: {len(serializers_lines)} lines")

print("Done!")
