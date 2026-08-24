import { useState, useEffect, useCallback, useMemo } from 'react';
import { wellnessService } from '../../../services/wellnessServices/wellnessService';

export const LockerRoomActivity = ({ onProgress, onComplete, isSubmitting }) => {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState(null);
  const [evalResult, setEvalResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingChoice, setSubmittingChoice] = useState(false);
  const [error, setError] = useState(null);

  // Fallback Scenario (English) in case backend or AI API is unreachable
  const defaultScenario = useMemo(() => ({
    id: 'ai_generated_1',
    title: 'Match-Day Tension',
    difficulty: 'High-Stakes',
    situation: 'A key player is breaking focus right before a crucial game by arguing with teammates in the locker room.',
    question: 'As a team leader, what is your best course of action?',
    choices: [
      { text: 'Pull the player aside privately to calm them down and refocus on game strategy.' },
      { text: 'Confront the player publicly in front of everyone to assert authority.' },
      { text: 'Ignore the conflict entirely and hope they settle down on the field.' }
    ],
    correct_choice_index: 0
  }), []);

  const fetchScenarios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const aiPrompt = `
        Generate a fresh, realistic sports locker room dilemma for a team captain/athlete in English.
        Return ONLY a JSON object with this exact structure:
        {
          "id": "groq_dilemma_${Date.now()}",
          "title": "Short Title (3-4 words)",
          "difficulty": "Medium",
          "situation": "A realistic locker room scenario involving team dynamics, high pressure, or sportsmanship (2-3 sentences).",
          "question": "What is the best leadership decision in this situation?",
          "choices": [
            {"text": "Option A - Optimal/constructive leadership approach"},
            {"text": "Option B - Reactionary/aggressive approach"},
            {"text": "Option C - Avoidant/passive approach"}
          ],
          "correct_choice_index": 0
        }
      `;

      let groqRes = null;

      if (typeof wellnessService.getAIResponse === 'function') {
        groqRes = await wellnessService.getAIResponse('locker_room', aiPrompt);
      }

      const rawData = groqRes?.data || groqRes?.result || groqRes;
      let parsed = null;

      if (typeof rawData === 'string') {
        try {
          const startIndex = rawData.indexOf('{');
          const endIndex = rawData.lastIndexOf('}');
          if (startIndex !== -1 && endIndex !== -1) {
            const cleanJson = rawData.substring(startIndex, endIndex + 1);
            parsed = JSON.parse(cleanJson);
          }
        } catch (parseErr) {
          console.warn('Could not parse AI locker room scenario JSON:', parseErr);
        }
      } else if (typeof rawData === 'object' && rawData !== null) {
        parsed = rawData;
      }

      if (parsed && parsed.situation && Array.isArray(parsed.choices)) {
        setScenarios([parsed]);
        setSelectedScenario(parsed);
      } else {
        const res = await wellnessService.getLockerRoomScenarios();

        if (res?.success && res?.scenarios?.length > 0) {
          setScenarios(res.scenarios);
          setSelectedScenario(res.scenarios[0]);
        } else {
          setScenarios([defaultScenario]);
          setSelectedScenario(defaultScenario);
        }
      }
    } catch (err) {
      console.error('Failed to load dynamic locker room scenario:', err);
      setScenarios([defaultScenario]);
      setSelectedScenario(defaultScenario);
    } finally {
      setLoading(false);
    }
  }, [defaultScenario]);

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

  const handleSelectScenario = (sc) => {
    setSelectedScenario(sc);
    setSelectedChoiceIndex(null);
    setEvalResult(null);
    setError(null);
  };

  const activeScenario =
    scenarios.find((scenario) => scenario.id === selectedScenario?.id) ||
    selectedScenario ||
    defaultScenario;

  const handleDecisionSubmit = async () => {
    if (selectedChoiceIndex === null || !activeScenario) {
      setError('Please select an action path.');
      return;
    }

    try {
      setSubmittingChoice(true);
      setError(null);

      const chosenOption = activeScenario.choices[selectedChoiceIndex]?.text;

      const evalPrompt = `
        Scenario: "${activeScenario.situation}"
        User Selected Option: "${chosenOption}"
        Correct Option Index: ${activeScenario.correct_choice_index ?? 0}
        User Selected Index: ${selectedChoiceIndex}

        Evaluate this decision in clear, concise English.
        Provide a concise evaluation (2 sentences max) explaining why this choice is effective or how it impacts the locker room environment.
        Return ONLY a JSON object:
        {
          "score": ${selectedChoiceIndex === (activeScenario.correct_choice_index ?? 0) ? 95 : 65},
          "is_optimal": ${selectedChoiceIndex === (activeScenario.correct_choice_index ?? 0)},
          "evaluation": "Clear short feedback explaining the leadership impact."
        }
      `;

      let evalRes = null;

      if (typeof wellnessService.getAIResponse === 'function') {
        evalRes = await wellnessService.getAIResponse('locker_room', evalPrompt);
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
            score: selectedChoiceIndex === 0 ? 95 : 65,
            is_optimal: selectedChoiceIndex === 0,
            evaluation: 'Your choice impacts overall team morale and focus before the game.'
          };
        }
      } else if (typeof rawEval === 'object' && rawEval !== null) {
        parsedEval = rawEval;
      }

      const finalResult = {
        score: parsedEval.score || (selectedChoiceIndex === 0 ? 95 : 65),
        is_optimal:
          parsedEval.is_optimal !== undefined
            ? parsedEval.is_optimal
            : selectedChoiceIndex === 0,
        evaluation:
          parsedEval.evaluation ||
          'A thoughtful leadership response that prioritizes team cohesion and mental focus.',
        correctIndex: activeScenario.correct_choice_index ?? 0
      };

      setEvalResult(finalResult);

      if (onProgress) {
        await onProgress(80, 3);
      }
    } catch (err) {
      console.error('Decision submission error:', err);

      setEvalResult({
        score: selectedChoiceIndex === 0 ? 95 : 70,
        is_optimal: selectedChoiceIndex === 0,
        evaluation: 'This choice actively influences team dynamics and locker room atmosphere.',
        correctIndex: activeScenario.correct_choice_index ?? 0
      });
    } finally {
      setSubmittingChoice(false);
    }
  };

  const handleFinish = async () => {
    try {
      if (onProgress) {
        await onProgress(100, 3);
      }

      if (onComplete) {
        await onComplete(
          evalResult?.score || 90,
          evalResult?.evaluation || 'Locker room scenario completed.'
        );
      }
    } catch (err) {
      console.error('Finish activity error:', err);
      setError('Could not complete activity. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 select-none">
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          Generating dynamic locker room dilemma...
        </div>
      </div>
    );
  }

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

      {/* SCENARIO SELECTOR TABS & REFRESH */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {activeScenario?.title || 'Locker Room Activity'}
        </span>

        <button
          type="button"
          onClick={fetchScenarios}
          className="cursor-pointer text-[11px] font-bold text-indigo-600 underline transition hover:text-indigo-800"
        >
          🔄 New AI Scenario
        </button>
      </div>

      {/* SCENARIO SELECTOR */}
      {scenarios.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              onClick={() => handleSelectScenario(scenario)}
              className={`cursor-pointer rounded-xl border px-3 py-1.5 text-[10px] font-bold transition ${
                activeScenario?.id === scenario.id
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200'
              }`}
            >
              {scenario.title}
            </button>
          ))}
        </div>
      )}

      {activeScenario && (
        <div className="space-y-4">
          {/* SITUATION BRIEF */}
          <div className="space-y-2 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                Locker Room Situation
              </span>

              <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600">
                {activeScenario.difficulty || 'Medium'}
              </span>
            </div>

            <p className="text-xs font-medium leading-relaxed text-slate-800">
              {activeScenario.situation}
            </p>

            <div className="pt-1 text-xs font-extrabold text-indigo-950">
              ❓ {activeScenario.question}
            </div>
          </div>

          {/* CHOICE OPTIONS */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Select Your Action Path:
            </div>

            {activeScenario.choices?.map((choice, idx) => {
              const isSelected = selectedChoiceIndex === idx;
              const text = typeof choice === 'string' ? choice : choice.text;
              const isCorrect =
                evalResult && idx === (activeScenario.correct_choice_index ?? 0);
              const isUserChoice = evalResult && isSelected;

              let borderBgStyles =
                'border-slate-200 bg-white hover:border-slate-300';

              if (evalResult) {
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
                  disabled={!!evalResult}
                  onClick={() => setSelectedChoiceIndex(idx)}
                  className={`flex w-full cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-left transition ${borderBgStyles}`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      evalResult && isCorrect
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

                    {evalResult && isCorrect && (
                      <span className="mt-0.5 block text-[10px] font-bold text-emerald-700">
                        ✓ Optimal Choice
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* SUBMIT BUTTON */}
          {!evalResult && (
            <div className="pt-1">
              <button
                type="button"
                onClick={handleDecisionSubmit}
                disabled={
                  submittingChoice ||
                  isSubmitting ||
                  selectedChoiceIndex === null
                }
                className="w-full cursor-pointer rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submittingChoice
                  ? 'Analyzing Decision Impact...'
                  : 'Evaluate Decision & Claim XP →'}
              </button>
            </div>
          )}

          {/* EVALUATION & FEEDBACK PANEL */}
          {evalResult && (
            <div className="space-y-3 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-800">
                  {evalResult.is_optimal
                    ? '🎯 Optimal Leadership Choice'
                    : '💡 Leadership Reflection'}
                </h3>

                <span className="font-mono text-sm font-black text-indigo-700">
                  Score: {evalResult.score}/100
                </span>
              </div>

              <p className="rounded-xl border border-indigo-100 bg-white p-3 text-xs font-medium leading-relaxed text-slate-700">
                {evalResult.evaluation}
              </p>

              <button
                type="button"
                onClick={handleFinish}
                className="w-full cursor-pointer rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-emerald-700"
              >
                ✓ Claim XP & Finish Activity
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};