import { useState, useEffect, useCallback } from 'react';
import { wellnessService } from '../../../services/wellnessServices/wellnessService';

const DEFAULT_SCENARIO = {
  id: 'ai_integrity_1',
  category: 'Sportsmanship & Ethics',
  title: 'Unnoticed Out-of-Bounds',
  dilemma:
    'During a crucial championship point, the ball skims your fingertips before going out. The referee awards the point to your team. Do you speak up?',
  choices: [
    {
      text: 'Inform the referee immediately that you touched the ball, risking the point for sportsmanship.',
    },
    {
      text: 'Stay quiet and accept the point since the official made the call.',
    },
    {
      text: 'Wait to see if opponents complain before making any admission.',
    },
  ],
  correct_choice_index: 0,
};

export const IntegrityCrossroadsActivity = ({
  onProgress,
  onComplete,
  isSubmitting = false,
}) => {
  const [scenarios, setScenarios] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState(null);
  const [reflection, setReflection] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // ---------------------------------------------------------
  // FETCH SCENARIOS
  // ---------------------------------------------------------

  const fetchScenarios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const aiPrompt = `
        Generate 2 realistic sports ethics/integrity dilemmas for a competitive athlete in English.
        Return ONLY a JSON array with 2 scenario objects in this exact format:
        [
          {
            "id": "integrity_${Date.now()}_1",
            "category": "Fair Play",
            "title": "Short Title (3-4 words)",
            "dilemma": "Clear ethical dilemma description (2-3 sentences).",
            "choices": [
              {"text": "Option A - High integrity / honest choice"},
              {"text": "Option B - Compromised integrity / self-serving choice"},
              {"text": "Option C - Passive / bystander choice"}
            ],
            "correct_choice_index": 0
          }
        ]
      `;

      let groqRes = null;

      if (typeof wellnessService.getAIResponse === 'function') {
        groqRes = await wellnessService.getAIResponse(
          'integrity_crossroads',
          aiPrompt
        );
      }

      const rawData = groqRes?.data || groqRes?.result || groqRes;
      let parsed = null;

      if (typeof rawData === 'string') {
        try {
          const startIndex = rawData.indexOf('[');
          const endIndex = rawData.lastIndexOf(']');
          if (startIndex !== -1 && endIndex !== -1) {
            const cleanJson = rawData.substring(startIndex, endIndex + 1);
            parsed = JSON.parse(cleanJson);
          }
        } catch (parseErr) {
          console.warn('Could not parse AI scenario JSON array:', parseErr);
        }
      } else if (Array.isArray(rawData)) {
        parsed = rawData;
      }

      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        setScenarios(parsed);
      } else {
        const res = await wellnessService.getIntegrityScenarios();

        if (res?.success && res?.scenarios?.length > 0) {
          setScenarios(res.scenarios);
        } else {
          setScenarios([DEFAULT_SCENARIO]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch AI integrity scenarios:', err);
      setScenarios([DEFAULT_SCENARIO]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (isMounted) {
        await fetchScenarios();
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [fetchScenarios]);

  const activeScenario = scenarios[currentIndex] || DEFAULT_SCENARIO;

  // ---------------------------------------------------------
  // SUBMIT CHOICE & EVALUATE
  // ---------------------------------------------------------

  const handleSubmitChoice = async () => {
    if (selectedChoiceIndex === null || !activeScenario) {
      setError('Please select a stance on this ethical dilemma.');
      return;
    }

    if (submitting || isSubmitting) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const chosenOption =
        activeScenario.choices[selectedChoiceIndex]?.text || '';

      const evalPrompt = `
        Scenario: "${activeScenario.dilemma}"
        Selected Choice: "${chosenOption}"
        Correct Integrity Choice Index: ${activeScenario.correct_choice_index ?? 0}
        User Choice Index: ${selectedChoiceIndex}
        User Reflection: "${reflection.trim() || 'No reflection provided'}"

        Evaluate this decision regarding integrity, sportsmanship, and character in concise English.
        Return ONLY a JSON object:
        {
          "score": ${
            selectedChoiceIndex === (activeScenario.correct_choice_index ?? 0)
              ? 95
              : 70
          },
          "feedback": "Concise 2-sentence feedback evaluating their integrity stance and reflection."
        }
      `;

      let evalRes = null;

      if (typeof wellnessService.getAIResponse === 'function') {
        evalRes = await wellnessService.getAIResponse(
          'integrity_crossroads',
          evalPrompt
        );
      }

      const rawEval = evalRes?.data || evalRes?.result || evalRes;
      let parsedEval = {};

      if (typeof rawEval === 'string') {
        try {
          const startIndex = rawEval.indexOf('{');
          const endIndex = rawEval.lastIndexOf('}');
          if (startIndex !== -1 && endIndex !== -1) {
            const cleanJson = rawEval.substring(startIndex, endIndex + 1);
            parsedEval = JSON.parse(cleanJson);
          }
        } catch {
          parsedEval = {
            score:
              selectedChoiceIndex ===
              (activeScenario.correct_choice_index ?? 0)
                ? 95
                : 70,
            feedback:
              'Upholding honesty and fair play builds long-term athletic respect and personal character.',
          };
        }
      } else if (typeof rawEval === 'object' && rawEval !== null) {
        parsedEval = rawEval;
      }

      const finalResult = {
        score:
          parsedEval.score ||
          (selectedChoiceIndex === (activeScenario.correct_choice_index ?? 0)
            ? 95
            : 70),
        feedback:
          parsedEval.feedback ||
          'Your decision reflects how you navigate high-pressure ethical situations in sports.',
      };

      setResult(finalResult);

      const prog = Math.min(
        100,
        Math.round(((currentIndex + 1) / scenarios.length) * 100)
      );

      if (onProgress) {
        await onProgress(prog, 3);
      }
    } catch (err) {
      console.error('Integrity submission error:', err);

      setResult({
        score:
          selectedChoiceIndex === (activeScenario.correct_choice_index ?? 0)
            ? 95
            : 70,
        feedback:
          'Demonstrating honesty under pressure strengthens team culture and personal integrity.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------
  // NAVIGATION HANDLERS
  // ---------------------------------------------------------

  const handleNext = () => {
    if (currentIndex < scenarios.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedChoiceIndex(null);
      setReflection('');
      setResult(null);
      setError(null);
    }
  };

  const handleFinish = async () => {
    try {
      if (onProgress) {
        await onProgress(100, 3);
      }

      if (onComplete) {
        await onComplete(
          result?.score || 90,
          result?.feedback || 'Ethical crossroads completed.'
        );
      }
    } catch (err) {
      console.error('Finish activity error:', err);
      setError('Could not complete activity. Please try again.');
    }
  };

  // ---------------------------------------------------------
  // LOADING VIEW
  // ---------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 select-none">
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          Generating ethical dilemma scenarios...
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // MAIN UI RENDER
  // ---------------------------------------------------------

  return (
    <div className="mx-auto max-w-md space-y-5 text-left text-slate-800 select-none">
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
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

      {/* HEADER TABS & AI REFRESH */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
          Scenario {currentIndex + 1} of {scenarios.length} •{' '}
          {activeScenario.category || 'Ethics'}
        </span>

        <button
          type="button"
          onClick={fetchScenarios}
          className="cursor-pointer text-[11px] font-bold text-indigo-600 underline transition hover:text-indigo-800"
        >
          🔄 Refresh Dilemmas
        </button>
      </div>

      {/* PROGRESS BARS */}
      <div className="flex gap-1.5">
        {scenarios.map((scenarioItem, idx) => (
          <span
            key={scenarioItem.id || idx}
            className={`h-1.5 flex-1 rounded-full transition ${
              idx === currentIndex ? 'bg-indigo-600' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* DILEMMA CARD */}
      <div className="space-y-1.5 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
        <h3 className="text-sm font-black text-slate-800">
          {activeScenario.title}
        </h3>

        <p className="text-xs font-medium leading-relaxed text-slate-700">
          {activeScenario.dilemma}
        </p>
      </div>

      {/* CHOICES */}
      <div className="space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          What would you do?
        </div>

        {activeScenario.choices?.map((choice, idx) => {
          const isSelected = selectedChoiceIndex === idx;
          const text = typeof choice === 'string' ? choice : choice.text;

          const isCorrect =
            result && idx === (activeScenario.correct_choice_index ?? 0);

          const isUserChoice = result && isSelected;

          let borderBgStyles =
            'border-slate-200 bg-white hover:border-slate-300';

          if (result) {
            if (isCorrect) {
              borderBgStyles =
                'border-emerald-500 bg-emerald-50/80 shadow-2xs';
            } else if (isUserChoice && !isCorrect) {
              borderBgStyles = 'border-rose-400 bg-rose-50/80 shadow-2xs';
            }
          } else if (isSelected) {
            borderBgStyles = 'border-indigo-600 bg-indigo-50/80 shadow-2xs';
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={!!result}
              onClick={() => setSelectedChoiceIndex(idx)}
              className={`flex w-full cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-left transition ${borderBgStyles}`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  result && isCorrect
                    ? 'bg-emerald-600 text-white'
                    : isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {String.fromCharCode(65 + idx)}
              </span>

              <div className="flex-1">
                <span className="text-xs font-medium leading-snug text-slate-800">
                  {text}
                </span>

                {result && isCorrect && (
                  <span className="mt-0.5 block text-[10px] font-bold text-emerald-700">
                    ✓ Highest Integrity Stance
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* REFLECTION NOTE */}
      {!result && (
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Personal Reflection (Optional)
          </label>

          <textarea
            rows={2}
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Why does this choice align with your personal values?"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none transition focus:border-indigo-500"
          />
        </div>
      )}

      {/* SUBMIT BUTTON */}
      {!result && (
        <div className="pt-1">
          <button
            type="button"
            onClick={handleSubmitChoice}
            disabled={
              submitting || isSubmitting || selectedChoiceIndex === null
            }
            className="w-full cursor-pointer rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Analyzing Ethical Stance...' : 'Submit Decision & Evaluate'}
          </button>
        </div>
      )}

      {/* FEEDBACK RESULT PANEL */}
      {result && (
        <div className="space-y-3 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-800">
              Values & Integrity Feedback
            </h4>

            <span className="font-mono text-sm font-black text-indigo-700">
              Score: {result.score}%
            </span>
          </div>

          <p className="rounded-xl border border-indigo-100 bg-white p-3 text-xs font-medium leading-relaxed text-slate-700">
            {result.feedback}
          </p>

          {currentIndex < scenarios.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="w-full cursor-pointer rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-indigo-700"
            >
              Next Scenario →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="w-full cursor-pointer rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-emerald-700"
            >
              ✓ Complete Activity & Claim XP
            </button>
          )}
        </div>
      )}
    </div>
  );
};