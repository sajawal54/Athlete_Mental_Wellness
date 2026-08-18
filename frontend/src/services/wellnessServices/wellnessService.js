import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/';

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const wellnessService = {
  // -------------------------------------------------------------
  // Core Shared Lifecycle Endpoints
  // -------------------------------------------------------------
  getModules: async () => {
    const response = await api.get('wellness/modules/');
    return response.data;
  },

  getModuleDetail: async (slug) => {
    const response = await api.get(`wellness/modules/${slug}/`);
    return response.data;
  },

  startModule: async (slug) => {
    const response = await api.post(`wellness/modules/${slug}/start/`);
    return response.data;
  },

  updateProgress: async (slug, progressPercent, currentStep = null, sessionData = null) => {
    const response = await api.patch(`wellness/modules/${slug}/progress/update/`, {
      progress: progressPercent,
      current_step: currentStep,
      session_data: sessionData,
    });
    return response.data;
  },

  completeModule: async (slug, sessionId = null, score = 0) => {
    const response = await api.post(`wellness/modules/${slug}/complete/`, {
      session_id: sessionId,
      score: score,
    });
    return response.data;
  },

  getMyProgress: async () => {
    const response = await api.get('wellness/my-progress/');
    return response.data;
  },

  // -------------------------------------------------------------
  // 1. Codex
  // -------------------------------------------------------------
  getCodexCategories: async () => {
    const response = await api.get('wellness/codex/categories/');
    return response.data;
  },

  getCodexLessonDetail: async (lessonId) => {
    const response = await api.get(`wellness/codex/lessons/${lessonId}/`);
    return response.data;
  },

  startCodexLesson: async (lessonId) => {
    const response = await api.post(`wellness/codex/lessons/${lessonId}/start/`);
    return response.data;
  },

  completeCodexLesson: async (lessonId) => {
    const response = await api.post(`wellness/codex/lessons/${lessonId}/complete/`);
    return response.data;
  },

  // -------------------------------------------------------------
  // 2. Mindful Monsters
  // -------------------------------------------------------------
  getMindfulMonsterSteps: async () => {
    const response = await api.get('wellness/mindful-monsters/steps/');
    return response.data;
  },

  recordMindfulMonsterSession: async (completedSteps = 4) => {
    const response = await api.post('wellness/mindful-monsters/record/', {
      completed_steps: completedSteps,
    });
    return response.data;
  },

  // -------------------------------------------------------------
  // 3. Breathwork
  // -------------------------------------------------------------
  getBreathworkInfo: async () => {
    const response = await api.get('wellness/breathwork/info/');
    return response.data;
  },

  recordBreathworkSession: async (durationMinutes, elapsedSeconds) => {
    const response = await api.post('wellness/breathwork/record/', {
      duration_minutes: durationMinutes,
      elapsed_seconds: elapsedSeconds,
    });
    return response.data;
  },

  // -------------------------------------------------------------
  // 4. Setback Reframer
  // -------------------------------------------------------------
  generateSetbackReframe: async (negativeThought, category = 'performance') => {
    const response = await api.post('wellness/setback-reframer/generate/', {
      negative_thought: negativeThought,
      category: category,
    });
    return response.data;
  },

  getSetbackReframeHistory: async () => {
    const response = await api.get('wellness/setback-reframer/history/');
    return response.data;
  },

  // -------------------------------------------------------------
  // 5. Grit Garden
  // -------------------------------------------------------------
  saveGritGardenEntry: async (exerciseType, journalText, exerciseResponse = '') => {
    const response = await api.post('wellness/grit-garden/save/', {
      exercise_type: exerciseType,
      journal_text: journalText,
      exercise_response: exerciseResponse,
    });
    return response.data;
  },

  getGritGardenHistory: async () => {
    const response = await api.get('wellness/grit-garden/history/');
    return response.data;
  },

  // -------------------------------------------------------------
  // 6. Echoes of Empathy
  // -------------------------------------------------------------
  getEmpathyScenarios: async () => {
    const response = await api.get('wellness/echoes-of-empathy/scenarios/');
    return response.data;
  },

  submitEmpathyResponse: async (scenarioId, responseText) => {
    const response = await api.post('wellness/echoes-of-empathy/submit/', {
      scenario_id: scenarioId,
      response: responseText,
    });
    return response.data;
  },

  // -------------------------------------------------------------
  // 7. Counselor Hub
  // -------------------------------------------------------------
  getCounselors: async (specialization = null) => {
    const params = specialization ? { specialization } : {};
    const response = await api.get('wellness/counselor-hub/counselors/', { params });
    return response.data;
  },

  submitCounselorRequest: async (payload) => {
    const response = await api.post('wellness/counselor-hub/request/', payload);
    return response.data;
  },

  getMyCounselorRequests: async () => {
    const response = await api.get('wellness/counselor-hub/my-requests/');
    return response.data;
  },

  // -------------------------------------------------------------
  // 8. Transition Support
  // -------------------------------------------------------------
  getTransitionResources: async (category = null) => {
    const params = category ? { category } : {};
    const response = await api.get('wellness/transition-support/resources/', { params });
    return response.data;
  },

  markTransitionResourceViewed: async (resourceId) => {
    const response = await api.post(`wellness/transition-support/resource/${resourceId}/view/`);
    return response.data;
  },

  // -------------------------------------------------------------
  // 9. Locker Room Realities
  // -------------------------------------------------------------
  getLockerRoomScenarios: async () => {
    const response = await api.get('wellness/locker-room-realities/scenarios/');
    return response.data;
  },

  submitLockerRoomDecision: async (scenarioId, choiceIndex) => {
    const response = await api.post('wellness/locker-room-realities/decide/', {
      scenario_id: scenarioId,
      choice_index: choiceIndex,
    });
    return response.data;
  },

  // -------------------------------------------------------------
  // 10. Reaction Zone
  // -------------------------------------------------------------
  getReactionPrompts: async () => {
    const response = await api.get('wellness/reaction-zone/prompts/');
    return response.data;
  },

  submitReactionScore: async (score, correctAnswers, totalPrompts, durationSeconds) => {
    const response = await api.post('wellness/reaction-zone/submit-score/', {
      score,
      correct_answers: correctAnswers,
      total_prompts: totalPrompts,
      duration_seconds: durationSeconds,
    });
    return response.data;
  },

  getReactionLeaderboard: async () => {
    const response = await api.get('wellness/reaction-zone/leaderboard/');
    return response.data;
  },

  // -------------------------------------------------------------
  // 11. Integrity Crossroads
  // -------------------------------------------------------------
  getIntegrityScenarios: async () => {
    const response = await api.get('wellness/integrity-crossroads/scenarios/');
    return response.data;
  },

  submitIntegrityChoice: async (scenarioId, choiceIndex, reflection = '') => {
    const response = await api.post('wellness/integrity-crossroads/submit/', {
      scenario_id: scenarioId,
      choice_index: choiceIndex,
      reflection: reflection,
    });
    return response.data;
  },

  // -------------------------------------------------------------
  // 12. Self-Talk Detective
  // -------------------------------------------------------------
  analyzeSelfTalk: async (negativeThought) => {
    const response = await api.post('wellness/self-talk-detective/analyze/', {
      negative_thought: negativeThought,
    });
    return response.data;
  },

  getSelfTalkHistory: async () => {
    const response = await api.get('wellness/self-talk-detective/history/');
    return response.data;
  },

  // -------------------------------------------------------------
  // 13. Career Forge
  // -------------------------------------------------------------
  getCareerRoadmap: async () => {
    const response = await api.get('wellness/career-forge/roadmap/');
    return response.data;
  },

  saveCareerRoadmap: async (payload) => {
    const response = await api.post('wellness/career-forge/save/', payload);
    return response.data;
  },

  // -------------------------------------------------------------
  // 14. Word Grid
  // -------------------------------------------------------------
  getDailyWordGrid: async () => {
    const response = await api.get('wellness/word-grid/daily/');
    return response.data;
  },

  submitWordGridScore: async (puzzleId, wordsFound, timeTakenSeconds, score) => {
    const response = await api.post('wellness/word-grid/submit/', {
      puzzle_id: puzzleId,
      words_found: wordsFound,
      time_taken_seconds: timeTakenSeconds,
      score: score,
    });
    return response.data;
  },

  getWordGridLeaderboard: async () => {
    const response = await api.get('wellness/word-grid/leaderboard/');
    return response.data;
  },


  // Purane methods...

  // AI ke liye single API call
  getAIResponse: async (moduleType, userInput = '', extraContext = '') => {
    const response = await api.post('wellness/ai-assistant/', {
      module_type: moduleType,
      user_input: userInput,
      extra_context: extraContext,
    });
    return response.data;
  },
};

  
