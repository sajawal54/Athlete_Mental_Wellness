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
  isSubmitting,
}) => {
  const [scenarios, setScenarios] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState(null);
  const [reflection, setReflection] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchScenarios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Prompt AI to generate dynamic ethical scenarios
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
        const cleanJson = rawData.substring(
          rawData.indexOf('['),
          rawData.lastIndexOf(']') + 1
        );
        parsed = JSON.parse(cleanJson);
      } else if (Array.isArray(rawData)) {
        parsed = rawData;
      }

      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        setScenarios(parsed);
      } else {
        // Fallback to service API or hardcoded scenario
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
    const timer = setTimeout(() => {
      fetchScenarios();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchScenarios]);

  const activeScenario = scenarios[currentIndex] || DEFAULT_SCENARIO;

  const handleSubmitChoice = async () => {
    if (selectedChoiceIndex === null || !activeScenario) {
      setError('Please select a stance on this ethical dilemma.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const chosenOption =
        activeScenario.choices[selectedChoiceIndex]?.text;

      // Ask AI to evaluate choice and user reflection
      const evalPrompt = `
        Scenario: "${activeScenario.dilemma}"
        Selected Choice: "${chosenOption}"
        Correct Integrity Choice Index: ${activeScenario.correct_choice_index ?? 0}
        User Choice Index: ${selectedChoiceIndex}
        User Reflection: "${reflection || 'No reflection provided'}"

        Evaluate this decision regarding integrity, sportsmanship, and character in concise English.
        Return ONLY a JSON object:
        {
          "score": ${
            selectedChoiceIndex ===
            (activeScenario.correct_choice_index ?? 0)
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
          const cleanJson = rawEval.substring(
            rawEval.indexOf('{'),
            rawEval.lastIndexOf('}') + 1
          );

          parsedEval = JSON.parse(cleanJson);
        } catch {
          parsedEval = {
            score: selectedChoiceIndex === 0 ? 95 : 70,
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
          (selectedChoiceIndex === 0 ? 95 : 70),
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
        onProgress(prog, 3);
      }
    } catch (err) {
      console.error('Integrity submission error:', err);

      setResult({
        score: selectedChoiceIndex === 0 ? 95 : 70,
        feedback:
          'Demonstrating honesty under pressure strengthens team culture and personal integrity.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < scenarios.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedChoiceIndex(null);
      setReflection('');
      setResult(null);
    }
  };

  const handleFinish = () => {
    if (onProgress) {
      onProgress(100, 3);
    }

    if (onComplete) {
      onComplete(
        result?.score || 90,
        result?.feedback || 'Ethical crossroads completed.'
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-slate-500 font-semibold text-xs">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          Generating ethical dilemma scenarios...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 text-slate-800 max-w-md mx-auto">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 text-left">
          ⚠️ {error}
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
          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline transition"
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
              idx === currentIndex
                ? 'bg-indigo-600'
                : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* DILEMMA CARD */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-1.5 text-left">
        <h3 className="text-sm font-black text-slate-800">
          {activeScenario.title}
        </h3>

        <p className="text-xs leading-relaxed text-slate-700 font-medium">
          {activeScenario.dilemma}
        </p>
      </div>

      {/* CHOICES */}
      <div className="space-y-2 text-left">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          What would you do?
        </div>

        {activeScenario.choices?.map((choice, idx) => {
          const isSelected = selectedChoiceIndex === idx;
          const text =
            typeof choice === 'string' ? choice : choice.text;

          const isCorrect =
            result &&
            idx === (activeScenario.correct_choice_index ?? 0);

          const isUserChoice = result && isSelected;

          let borderBgStyles =
            'border-slate-200 bg-white hover:border-slate-300';

          if (result) {
            if (isCorrect) {
              borderBgStyles =
                'border-emerald-500 bg-emerald-50/80 shadow-2xs';
            } else if (isUserChoice && !isCorrect) {
              borderBgStyles =
                'border-rose-400 bg-rose-50/80 shadow-2xs';
            }
          } else if (isSelected) {
            borderBgStyles =
              'border-indigo-600 bg-indigo-50/80 shadow-2xs';
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={!!result}
              onClick={() => setSelectedChoiceIndex(idx)}
              className={`w-full text-left rounded-xl p-3 transition border flex items-start gap-2.5 ${borderBgStyles}`}
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
                <span className="text-xs font-medium text-slate-800 leading-snug">
                  {text}
                </span>

                {result && isCorrect && (
                  <span className="block text-[10px] font-bold text-emerald-700 mt-0.5">
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
        <div className="text-left">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Personal Reflection (Optional)
          </label>

          <textarea
            rows={2}
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Why does this choice align with your personal values?"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 outline-none focus:border-indigo-500"
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
              submitting ||
              isSubmitting ||
              selectedChoiceIndex === null
            }
            className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {submitting
              ? 'Analyzing Ethical Stance...'
              : 'Submit Decision & Evaluate'}
          </button>
        </div>
      )}

      {/* FEEDBACK RESULT PANEL */}
      {result && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 space-y-3 text-left">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-800">
              Values & Integrity Feedback
            </h4>

            <span className="text-sm font-black text-indigo-700 font-mono">
              Score: {result.score}%
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-xl border border-indigo-100">
            {result.feedback}
          </p>

          {currentIndex < scenarios.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition"
            >
              Next Scenario →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition"
            >
              ✓ Complete Activity & Claim XP
            </button>
          )}
        </div>
      )}
    </div>
  );
};