import { useState, useEffect, useCallback } from 'react';
import { wellnessService } from '../../../services/wellnessServices/wellnessService';

const PHASE_CONFIG = {
  inhale: { emoji: '👾', color: 'from-indigo-500 to-purple-600', label: 'Inhale Deeply' },
  hold: { emoji: '🧘', color: 'from-purple-500 to-indigo-600', label: 'Hold Steady' },
  exhale: { emoji: '💨', color: 'from-teal-500 to-cyan-600', label: 'Exhale Fully' },
  relax: { emoji: '✨', color: 'from-emerald-500 to-teal-600', label: 'Rest & Settle' },
};

const SEQUENCE = ['inhale', 'hold', 'exhale', 'relax'];

const DEFAULT_STEPS = [
  {
    id: 1,
    title: 'Monster Inhale',
    phase: 'inhale',
    duration_seconds: 4,
    instruction:
      'Draw deep breath through your diaphragm. Feel the monster expand with positive energy.',
    order: 1,
  },
  {
    id: 2,
    title: 'Hold & Lock',
    phase: 'hold',
    duration_seconds: 4,
    instruction:
      'Hold gently at the top. Let stillness settle into every muscle.',
    order: 2,
  },
  {
    id: 3,
    title: 'Monster Roar Exhale',
    phase: 'exhale',
    duration_seconds: 4,
    instruction:
      'Breathe out slowly and evenly. Blow away all doubt and tension.',
    order: 3,
  },
  {
    id: 4,
    title: 'Centered & Grounded',
    phase: 'relax',
    duration_seconds: 4,
    instruction:
      'Rest quietly in the space between breaths. You are balanced, ready, and locked in.',
    order: 4,
  },
];

export const MindfulMonstersActivity = ({
  onProgress,
  onComplete,
  isSubmitting = false,
}) => {
  const [steps, setSteps] = useState(DEFAULT_STEPS);
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepTimer, setStepTimer] = useState(4);
  const [completedRounds, setCompletedRounds] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);

  // Guarantees EXACTLY Inhale -> Hold -> Exhale -> Relax sequence
  const enforceStrictSequence = useCallback((rawSteps) => {
    if (!Array.isArray(rawSteps) || rawSteps.length === 0) {
      return DEFAULT_STEPS;
    }

    const ordered = SEQUENCE.map((seqPhase, index) => {
      const found = rawSteps.find(
        (s) =>
          s.phase?.toLowerCase() === seqPhase ||
          (seqPhase === 'relax' && s.phase?.toLowerCase() === 'rest')
      );

      if (found) {
        return {
          ...found,
          phase: seqPhase,
          order: index + 1,
        };
      }

      return DEFAULT_STEPS[index];
    });

    return ordered;
  }, []);

  // Fetch API steps and normalize sequence
  useEffect(() => {
    let isMounted = true;
    wellnessService
      .getMindfulMonsterSteps()
      .then((res) => {
        if (!isMounted) return;
        if (
          res?.success &&
          Array.isArray(res.steps) &&
          res.steps.length > 0
        ) {
          const cleanSteps = enforceStrictSequence(res.steps);
          setSteps(cleanSteps);
          setStepTimer(cleanSteps[0]?.duration_seconds || 4);
        }
      })
      .catch(() => {
        if (isMounted) setSteps(DEFAULT_STEPS);
      });

    return () => {
      isMounted = false;
    };
  }, [enforceStrictSequence]);

  // Handle countdown timer safely
  useEffect(() => {
    let interval = null;

    if (isActive) {
      interval = setInterval(() => {
        setStepTimer((prevTimer) => {
          if (prevTimer > 1) {
            return prevTimer - 1;
          }

          setCurrentStepIndex((prevIdx) => {
            const nextIdx = (prevIdx + 1) % steps.length;

            if (nextIdx === 0) {
              setCompletedRounds((r) => r + 1);
            }

            setStepTimer(steps[nextIdx]?.duration_seconds || 4);

            return nextIdx;
          });

          return 0;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isActive, steps]);

  // Report progress to parent component
  useEffect(() => {
    const totalSteps = steps.length;

    const progress = Math.min(
      100,
      Math.round(
        ((completedRounds * totalSteps + currentStepIndex) /
          (totalSteps * 2)) *
          100
      )
    );

    if (onProgress) {
      onProgress(progress, 3);
    }
  }, [completedRounds, currentStepIndex, steps.length, onProgress]);

  const activeStep = steps[currentStepIndex] || steps[0];
  const phaseKey = activeStep?.phase?.toLowerCase() || 'inhale';
  const phaseConfig = PHASE_CONFIG[phaseKey] || PHASE_CONFIG.inhale;

  const handleFinish = async () => {
    if (isFinishing || isSubmitting) return;

    setIsActive(false);
    setIsFinishing(true);

    const totalStepsCompleted =
      completedRounds * steps.length + currentStepIndex;

    try {
      await wellnessService.recordMindfulMonsterSession(
        totalStepsCompleted
      );
    } catch (err) {
      console.warn("Session record fallback:", err);
    }

    try {
      if (onComplete) {
        // Parent container (View/Page) logic sync
        await onComplete(
          100,
          `Completed ${completedRounds} full rounds of Mindful Monster breathing.`
        );
      }
    } finally {
      setIsFinishing(false);
    }
  };

  const scaleClass =
    phaseKey === 'inhale'
      ? 'scale-125'
      : phaseKey === 'hold'
      ? 'scale-110'
      : phaseKey === 'exhale'
      ? 'scale-90'
      : 'scale-95';

  const isLoading = isSubmitting || isFinishing;

  return (
    <div className="space-y-6 text-center select-none">
      {/* ANIMATED MONSTER CIRCLE */}
      <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-full bg-indigo-50/60 border-4 border-indigo-200/50 shadow-inner">
        <div
          className={`flex h-52 w-52 flex-col items-center justify-center rounded-full bg-linear-to-br ${phaseConfig.color} shadow-xl transition-all duration-1000 ease-in-out ${
            isActive ? scaleClass : 'scale-100'
          }`}
        >
          <div className="text-6xl">{phaseConfig.emoji}</div>

          <div className="mt-2 text-3xl font-black text-white font-mono">
            {stepTimer}s
          </div>

          <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/80">
            {phaseConfig.label}
          </div>
        </div>
      </div>

      {/* STEP INFO CARD */}
      <div className="max-w-md mx-auto space-y-2 rounded-2xl bg-slate-50 border border-slate-200 p-4">
        <div className="flex items-center justify-center gap-2">
          {steps.map((s, idx) => (
            <span
              key={s.id || idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentStepIndex
                  ? 'w-8 bg-indigo-600'
                  : 'w-2 bg-slate-300'
              }`}
            />
          ))}
        </div>

        <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">
          Phase {currentStepIndex + 1} of {steps.length}:{' '}
          {phaseKey.toUpperCase()}
        </div>

        <h3 className="text-base font-extrabold text-slate-800">
          {activeStep?.title}
        </h3>

        <p className="text-xs text-slate-600 leading-relaxed">
          {activeStep?.instruction}
        </p>

        <div className="text-[10px] text-slate-400">
          Completed Rounds: {completedRounds}
        </div>
      </div>

      {/* CONTROLS */}
      <div className="flex flex-wrap justify-center gap-3">
        {!isActive ? (
          <button
            type="button"
            disabled={isLoading}
            onClick={() => setIsActive(true)}
            className="rounded-2xl bg-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {completedRounds > 0 || currentStepIndex > 0
              ? '▶ Resume Session'
              : '▶ Begin Guided Breathing'}
          </button>
        ) : (
          <button
            type="button"
            disabled={isLoading}
            onClick={() => setIsActive(false)}
            className="rounded-2xl bg-amber-500 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-amber-600 disabled:opacity-50 transition"
          >
            ⏸ Pause
          </button>
        )}

        <button
          type="button"
          onClick={handleFinish}
          disabled={isLoading}
          className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer"
        >
          {isLoading ? 'Processing...' : '✓ Finish & Claim XP'}
        </button>
      </div>
    </div>
  );
};