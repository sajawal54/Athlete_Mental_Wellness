import { useState, useEffect, useCallback } from 'react';
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
  const defaultScenario = {
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
  };

  const fetchScenarios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Step 1: Prompt AI to dynamically generate a new random sports leadership scenario in English
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
        const cleanJson = rawData.substring(rawData.indexOf('{'), rawData.lastIndexOf('}') + 1);
        parsed = JSON.parse(cleanJson);
      } else if (typeof rawData === 'object' && rawData !== null) {
        parsed = rawData;
      }

      if (parsed && parsed.situation && Array.isArray(parsed.choices)) {
        setScenarios([parsed]);
        setSelectedScenario(parsed);
      } else {
        // Fall back to server service or default scenario
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
  }, []);

  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  const handleSelectScenario = (sc) => {
    setSelectedScenario(sc);
    setSelectedChoiceIndex(null);
    setEvalResult(null);
  };

  const handleDecisionSubmit = async () => {
    if (selectedChoiceIndex === null || !selectedScenario) {
      setError('Please select an action path.');
      return;
    }

    try {
      setSubmittingChoice(true);
      setError(null);

      const chosenOption = selectedScenario.choices[selectedChoiceIndex]?.text;

      // Ask AI to evaluate the specific decision made by the athlete
      const evalPrompt = `
        Scenario: "${selectedScenario.situation}"
        User Selected Option: "${chosenOption}"
        Correct Option Index: ${selectedScenario.correct_choice_index ?? 0}
        User Selected Index: ${selectedChoiceIndex}

        Evaluate this decision in clear, concise English.
        Provide a concise evaluation (2 sentences max) explaining why this choice is effective or how it impacts the locker room environment.
        Return ONLY a JSON object:
        {
          "score": ${selectedChoiceIndex === (selectedScenario.correct_choice_index ?? 0) ? 95 : 65},
          "is_optimal": ${selectedChoiceIndex === (selectedScenario.correct_choice_index ?? 0)},
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
          const cleanJson = rawEval.substring(rawEval.indexOf('{'), rawEval.lastIndexOf('}') + 1);
          parsedEval = JSON.parse(cleanJson);
        } catch (_) {
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
        is_optimal: parsedEval.is_optimal !== undefined ? parsedEval.is_optimal : (selectedChoiceIndex === 0),
        evaluation: parsedEval.evaluation || 'A thoughtful leadership response that prioritizes team cohesion and mental focus.',
        correctIndex: selectedScenario.correct_choice_index ?? 0
      };

      setEvalResult(finalResult);
      if (onProgress) onProgress(80, 3);
    } catch (err) {
      console.error('Decision submission error:', err);
      setEvalResult({
        score: selectedChoiceIndex === 0 ? 95 : 70,
        is_optimal: selectedChoiceIndex === 0,
        evaluation: 'This choice actively influences team dynamics and locker room atmosphere.',
        correctIndex: selectedScenario.correct_choice_index ?? 0
      });
    } finally {
      setSubmittingChoice(false);
    }
  };

  const handleFinish = () => {
    if (onProgress) onProgress(100, 3);
    if (onComplete) {
      onComplete(evalResult?.score || 90, evalResult?.evaluation || 'Locker room scenario completed.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-slate-500 font-semibold text-xs">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          Generating dynamic locker room dilemma...
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

      {/* SCENARIO SELECTOR TABS & REFRESH */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {selectedScenario?.title || 'Locker Room Activity'}
        </span>
        <button
          type="button"
          onClick={fetchScenarios}
          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline transition"
        >
          🔄 New AI Scenario
        </button>
      </div>

      {selectedScenario && (
        <div className="space-y-4 text-left">
          {/* SITUATION BRIEF */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                Locker Room Situation
              </span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                {selectedScenario.difficulty || 'Medium'}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-800 font-medium">
              {selectedScenario.situation}
            </p>
            <div className="text-xs font-extrabold text-indigo-950 pt-1">
              ❓ {selectedScenario.question}
            </div>
          </div>

          {/* CHOICE OPTIONS */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Select Your Action Path:
            </div>
            {selectedScenario.choices?.map((choice, idx) => {
              const isSelected = selectedChoiceIndex === idx;
              const text = typeof choice === 'string' ? choice : choice.text;
              const isCorrect = evalResult && idx === (selectedScenario.correct_choice_index ?? 0);
              const isUserChoice = evalResult && isSelected;

              let borderBgStyles = 'border-slate-200 bg-white hover:border-slate-300';
              if (evalResult) {
                if (isCorrect) {
                  borderBgStyles = 'border-emerald-500 bg-emerald-50/80 shadow-2xs';
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
                  disabled={!!evalResult}
                  onClick={() => setSelectedChoiceIndex(idx)}
                  className={`w-full text-left rounded-xl p-3 transition border flex items-start gap-2.5 ${borderBgStyles}`}
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
                    <span className="text-xs font-medium text-slate-800 leading-snug">
                      {text}
                    </span>
                    {evalResult && isCorrect && (
                      <span className="block text-[10px] font-bold text-emerald-700 mt-0.5">
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
                disabled={submittingChoice || isSubmitting || selectedChoiceIndex === null}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {submittingChoice ? 'Analyzing Decision Impact...' : 'Evaluate Decision & Claim XP →'}
              </button>
            </div>
          )}

          {/* EVALUATION & FEEDBACK PANEL */}
          {evalResult && (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-800">
                  {evalResult.is_optimal ? '🎯 Optimal Leadership Choice' : '💡 Leadership Reflection'}
                </h3>
                <span className="text-sm font-black text-indigo-700 font-mono">
                  Score: {evalResult.score}/100
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-xl border border-indigo-100">
                {evalResult.evaluation}
              </p>

              <button
                type="button"
                onClick={handleFinish}
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition"
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