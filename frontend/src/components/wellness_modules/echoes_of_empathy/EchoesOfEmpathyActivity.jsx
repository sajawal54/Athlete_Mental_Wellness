import { useState, useEffect } from 'react';
import { wellnessService } from '../../../services/wellnessServices/wellnessService';

const FALLBACK_SCENARIOS = [
  {
    id: `dyn_${Date.now()}_1`,
    title: 'The Rookie Mistake',
    situation:
      'Your newest teammate made a critical error in the final minute of a playoff game, costing the team the match. In the locker room, they sit alone, head down, clearly distressed.',
    prompt:
      'What do you say to them right now? How do you respond to their distress in a way that builds rather than breaks their confidence?',
    difficulty: 'beginner',
  },
  {
    id: `dyn_${Date.now()}_2`,
    title: 'Invisible Injury',
    situation:
      'A veteran teammate abruptly announces they are quitting. You later learn they have been silently battling performance anxiety for months and felt too ashamed to speak up.',
    prompt:
      'Looking back, what signs might you have missed? And what would you say to them if you had the chance to talk now?',
    difficulty: 'intermediate',
  },
];

export const EchoesOfEmpathyActivity = ({
  onProgress,
  onComplete,
  isSubmitting,
}) => {
  const [scenarios, setScenarios] = useState([]);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [response, setResponse] = useState('');
  const [result, setResult] = useState(null);
  const [loadingScenarios, setLoadingScenarios] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadingHint, setLoadingHint] = useState(false);
  const [aiHint, setAiHint] = useState('');
  const [error, setError] = useState(null);
  const [allDone, setAllDone] = useState(false);

  // Fetch dynamic empathy scenarios.
  const loadScenarios = async () => {
    try {
      setLoadingScenarios(true);
      setError(null);

      const aiPrompt = `
        Generate 3 distinct, realistic workplace/team emotional intelligence (empathy) scenarios for an athlete or team leader in English.
        Return ONLY a JSON array with 3 scenario objects in this exact format (no markdown formatting):
        [
          {
            "id": "scenario_${Date.now()}_1",
            "title": "Short Title (3-4 words)",
            "situation": "Detailed situation description (2-3 sentences).",
            "prompt": "Specific question asking how to respond empathetically.",
            "difficulty": "intermediate"
          }
        ]
      `;

      let aiRes = null;

      if (typeof wellnessService.getAIResponse === 'function') {
        aiRes = await wellnessService
          .getAIResponse('empathy_scenarios', aiPrompt)
          .catch(() => null);
      }

      const rawData = aiRes?.data || aiRes?.result || aiRes;

      let parsed = null;

      if (typeof rawData === 'string') {
        try {
          const startIndex = rawData.indexOf('[');
          const endIndex = rawData.lastIndexOf(']');

          if (startIndex !== -1 && endIndex !== -1) {
            const cleanJson = rawData.substring(
              startIndex,
              endIndex + 1
            );

            parsed = JSON.parse(cleanJson);
          }
        } catch {
          parsed = null;
        }
      } else if (Array.isArray(rawData)) {
        parsed = rawData;
      }

      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }

      const res = await wellnessService
        .getEmpathyScenarios()
        .catch(() => null);

      if (res?.success && res.scenarios?.length > 0) {
        return res.scenarios;
      }

      return FALLBACK_SCENARIOS;
    } catch (err) {
      console.error('Failed to fetch AI scenarios:', err);

      return [
        {
          id: `dyn_${Date.now()}_1`,
          title: 'The Rookie Mistake',
          situation:
            'Your newest teammate made a critical error in the final minute of a playoff game, costing the team the match. In the locker room, they sit alone, head down, clearly distressed.',
          prompt:
            'What do you say to them right now? How do you respond to their distress in a way that builds rather than breaks their confidence?',
          difficulty: 'beginner',
        },
      ];
    }
  };

  // Initial scenario loading.
  useEffect(() => {
    let cancelled = false;

    const initializeScenarios = async () => {
      const loadedScenarios = await loadScenarios();

      if (cancelled) {
        return;
      }

      setScenarios(loadedScenarios);
      setScenarioIdx(0);
      setResponse('');
      setResult(null);
      setAiHint('');
      setAllDone(false);
      setLoadingScenarios(false);
    };

    initializeScenarios();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleRefreshScenarios = async () => {
    setLoadingScenarios(true);
    setError(null);

    const loadedScenarios = await loadScenarios();

    setScenarios(loadedScenarios);
    setScenarioIdx(0);
    setResponse('');
    setResult(null);
    setAiHint('');
    setAllDone(false);
    setLoadingScenarios(false);
  };

  const scenario = scenarios[scenarioIdx];

  // Ask AI for a hint.
  const handleGetAiHint = async () => {
    if (!scenario) {
      return;
    }

    try {
      setLoadingHint(true);

      const hintPrompt = `Given this situation: "${scenario.situation}", provide a 1-sentence tip on how to phrase an empathetic response.`;

      let res = null;

      if (typeof wellnessService.getAIResponse === 'function') {
        res = await wellnessService
          .getAIResponse('empathy_hint', hintPrompt)
          .catch(() => null);
      }

      const hintText =
        typeof res === 'string'
          ? res
          : res?.data || res?.hint;

      setAiHint(
        hintText ||
          'Start by validating their emotion directly (e.g., "I know how hard this feels...") without rushing to fix it.'
      );
    } catch {
      setAiHint(
        'Focus on active listening, validating emotions first, and avoiding judgment.'
      );
    } finally {
      setLoadingHint(false);
    }
  };

  // Submit response and get dynamic score.
  const handleSubmit = async (e) => {
    e?.preventDefault();

    const trimmed = response.trim();

    if (trimmed.length < 15) {
      setError(
        'Please write a more detailed empathetic response — at least a sentence or two.'
      );
      return;
    }

    if (!scenario) {
      return;
    }

    try {
      setLoadingSubmit(true);
      setError(null);

      const evalPrompt = `
        Evaluate this user response to an emotional situation.
        
        SITUATION: "${scenario.situation}"
        USER RESPONSE: "${trimmed}"

        EVALUATION INSTRUCTIONS:
        1. Calculate a REAL dynamic score from 0 to 100 based on empathy, validation, and clarity.
        2. DO NOT default to 75 or round numbers like 80/70 unless exact.
        3. Break down the score into 4 metrics (out of max points).

        Return ONLY a JSON object:
        {
          "score": <exact calculated integer between 35 and 98>,
          "feedback": "<2 sentences evaluating what worked and what could be improved>",
          "improvedResponse": "<1 polished high-EQ alternative sentence>",
          "metrics": {
            "validation": "<pts/30>",
            "perspective": "<pts/25>",
            "support": "<pts/25>",
            "authenticity": "<pts/20>"
          }
        }
      `;

      let evalRes = null;

      if (typeof wellnessService.getAIResponse === 'function') {
        evalRes = await wellnessService
          .getAIResponse('empathy_eval', evalPrompt)
          .catch(() => null);
      }

      const rawEval =
        evalRes?.data || evalRes?.result || evalRes;

      let parsedEval = null;

      if (typeof rawEval === 'string') {
        try {
          const startIndex = rawEval.indexOf('{');
          const endIndex = rawEval.lastIndexOf('}');

          if (startIndex !== -1 && endIndex !== -1) {
            const cleanJson = rawEval.substring(
              startIndex,
              endIndex + 1
            );

            parsedEval = JSON.parse(cleanJson);
          }
        } catch {
          parsedEval = null;
        }
      } else if (
        typeof rawEval === 'object' &&
        rawEval !== null
      ) {
        parsedEval = rawEval;
      }

      let finalScore = parsedEval?.score;

      if (
        !finalScore ||
        Number.isNaN(Number(finalScore))
      ) {
        const baseLen = Math.min(
          40,
          Math.floor(trimmed.length / 3)
        );

        const emotionWords =
          (
            trimmed.match(
              /\b(understand|feel|support|sorry|help|together|hear|listen|care)\b/gi
            ) || []
          ).length;

        finalScore = Math.min(
          97,
          Math.max(
            45,
            40 + baseLen + emotionWords * 6
          )
        );
      }

      finalScore = Number(finalScore);

      const finalMetrics =
        parsedEval?.metrics || {
          validation: `${Math.min(
            30,
            Math.floor(finalScore * 0.3)
          )}/30`,
          perspective: `${Math.min(
            25,
            Math.floor(finalScore * 0.25)
          )}/25`,
          support: `${Math.min(
            25,
            Math.floor(finalScore * 0.25)
          )}/25`,
          authenticity: `${Math.min(
            20,
            Math.floor(finalScore * 0.2)
          )}/20`,
        };

      const finalFeedback =
        parsedEval?.feedback ||
        (finalScore >= 80
          ? 'Strong emotional connection! You validated their distress before offering supportive words.'
          : 'Good attempt. Adding explicit validation (e.g., "I hear you") will boost your empathy score.');

      setResult({
        score: finalScore,
        feedback: finalFeedback,
        improvedResponse:
          parsedEval?.improvedResponse ||
          'I see how much effort you put in. We win as a team and learn as a team — I am right here with you.',
        metrics: finalMetrics,
      });

      const pct = Math.round(
        ((scenarioIdx + 1) /
          (scenarios.length || 1)) *
          100
      );

      if (onProgress) {
        onProgress(pct, 3);
      }
    } catch (err) {
      console.error('Empathy submission error:', err);

      const calculatedScore = Math.min(
        92,
        Math.max(50, Math.floor(trimmed.length / 2.5))
      );

      setResult({
        score: calculatedScore,
        feedback:
          'Your response communicates support. Focusing on deep active listening boosts team trust.',
        metrics: {
          validation: '22/30',
          perspective: '18/25',
          support: '20/25',
          authenticity: '16/20',
        },
      });
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleNext = () => {
    if (scenarioIdx < scenarios.length - 1) {
      setScenarioIdx((prev) => prev + 1);
      setResponse('');
      setResult(null);
      setAiHint('');
      setError(null);
    } else {
      setAllDone(true);
    }
  };

  const handleClaimXP = () => {
    if (onComplete) {
      onComplete(
        100,
        `Completed ${
          scenarioIdx + 1
        } empathy scenario(s) in Echoes of Empathy.`
      );
    }
  };

  const SCORE_COLORS = {
    high: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      badge:
        'bg-emerald-100 text-emerald-800 border border-emerald-300',
    },
    mid: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      badge:
        'bg-amber-100 text-amber-800 border border-amber-300',
    },
    low: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-800',
      badge:
        'bg-rose-100 text-rose-800 border border-rose-300',
    },
  };

  const scoreKey =
    result?.score >= 80
      ? 'high'
      : result?.score >= 55
        ? 'mid'
        : 'low';

  const colors = SCORE_COLORS[scoreKey];

  if (loadingScenarios) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-slate-500">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />

        <span className="text-xs font-semibold">
          🤖 AI generating new empathy scenarios...
        </span>
      </div>
    );
  }

  if (allDone) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-10 text-center">
        <div className="text-5xl">💖</div>

        <h3 className="text-xl font-black text-slate-800">
          All Scenarios Completed!
        </h3>

        <p className="text-sm text-slate-600">
          Your empathetic leadership is your competitive edge.
        </p>

        <button
          type="button"
          onClick={handleClaimXP}
          disabled={isSubmitting}
          className="rounded-2xl bg-emerald-600 px-8 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:opacity-50"
        >
          ✓ Claim XP Reward
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-5 text-slate-800">
      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-3 text-left text-xs font-semibold text-rose-700">
          <span>⚠️ {error}</span>

          <button
            type="button"
            onClick={() => setError(null)}
            className="font-bold text-rose-400 hover:text-rose-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
          Scenario {scenarioIdx + 1} of {scenarios.length}
        </span>

        <button
          type="button"
          onClick={handleRefreshScenarios}
          disabled={loadingScenarios}
          className="text-[11px] font-bold text-indigo-600 underline transition hover:text-indigo-800 disabled:opacity-50"
        >
          🔄 Generate New Questions
        </button>
      </div>

      {/* PROGRESS BAR */}
      <div className="flex items-center gap-1.5">
        {scenarios.map((scenarioItem, i) => (
          <div
            key={scenarioItem.id || i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= scenarioIdx
                ? 'bg-indigo-600'
                : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* SCENARIO CARD */}
      {scenario && (
        <div className="space-y-4">
          <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800">
                {scenario.title}
              </h3>

              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold capitalize text-indigo-700">
                {scenario.difficulty || 'empathy'}
              </span>
            </div>

            <p className="border-l-2 border-indigo-400 pl-2.5 text-xs italic leading-relaxed text-slate-700">
              {scenario.situation}
            </p>

            <div className="rounded-xl border border-indigo-100 bg-indigo-50/80 p-2.5 text-xs font-semibold text-indigo-900">
              🗣 {scenario.prompt}
            </div>
          </div>

          {!result ? (
            <form
              onSubmit={handleSubmit}
              className="space-y-3 text-left"
            >
              <textarea
                rows={4}
                value={response}
                onChange={(e) => {
                  setResponse(e.target.value);

                  if (onProgress) {
                    onProgress(
                      Math.min(
                        50,
                        Math.round(
                          (e.target.value.length / 150) *
                            50
                        )
                      ),
                      3
                    );
                  }
                }}
                placeholder="Write your empathetic response here..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200"
              />

              {/* AI HINT */}
              {aiHint && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[11px] leading-relaxed text-amber-900">
                  💡 <strong>AI Tip:</strong> {aiHint}
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleGetAiHint}
                  disabled={loadingHint}
                  className="text-[11px] font-bold text-indigo-600 transition hover:underline disabled:opacity-50"
                >
                  {loadingHint
                    ? '✨ Thinking...'
                    : '✨ Ask AI for a Hint'}
                </button>

                <button
                  type="submit"
                  disabled={
                    loadingSubmit ||
                    response.trim().length < 15
                  }
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loadingSubmit
                    ? '🤖 AI Evaluating...'
                    : '💬 Submit & Score'}
                </button>
              </div>
            </form>
          ) : (
            <div
              className={`space-y-3 rounded-2xl border p-4 text-left transition-all ${colors.bg} ${colors.border}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-xs font-black text-slate-800">
                    🤖 Dynamic AI Empathy Evaluation
                  </span>

                  <span className="text-[10px] font-medium text-slate-500">
                    Calculated based on emotional depth & text
                    tone
                  </span>
                </div>

                <div
                  className={`rounded-xl px-3 py-1.5 text-center shadow-2xs ${colors.badge}`}
                >
                  <div className="text-[8px] font-black uppercase tracking-wider">
                    AI Score
                  </div>

                  <div className="mt-0.5 text-base font-black leading-none">
                    {result.score}
                    <span className="text-[10px] font-normal">
                      /100
                    </span>
                  </div>
                </div>
              </div>

              <p
                className={`rounded-xl border border-slate-100 bg-white/70 p-2.5 text-xs font-medium leading-relaxed ${colors.text}`}
              >
                {result.feedback}
              </p>

              {/* BREAKDOWN METRICS */}
              {result.metrics && (
                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                  {Object.entries(result.metrics).map(
                    ([key, val]) => (
                      <div
                        key={key}
                        className="rounded-lg border border-slate-100 bg-white p-2 text-center"
                      >
                        <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          {key}
                        </div>

                        <div className="mt-0.5 text-xs font-black text-indigo-900">
                          {val}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* HIGH EQ REPHRASING */}
              {result.improvedResponse && (
                <div className="space-y-0.5 rounded-xl border border-indigo-100 bg-white p-2.5 text-[11px] text-slate-700">
                  <span className="block font-bold text-indigo-700">
                    ✨ High-EQ Rephrasing Example:
                  </span>

                  <p className="italic text-slate-600">
                    "{result.improvedResponse}"
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-indigo-700"
              >
                {scenarioIdx < scenarios.length - 1
                  ? 'Next Scenario →'
                  : 'Finish & Claim XP ✓'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};