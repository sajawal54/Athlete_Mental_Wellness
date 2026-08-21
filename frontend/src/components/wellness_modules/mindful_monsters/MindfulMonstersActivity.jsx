import { useState, useEffect, useCallback } from 'react';
import { wellnessService } from '../../../services/wellnessServices/wellnessService';

const PHASE_CONFIG = {
  inhale: {
    emoji: '👾',
    color: 'from-indigo-500 to-purple-600',
    label: 'Inhale Deeply',
  },
  hold: {
    emoji: '🧘',
    color: 'from-purple-500 to-indigo-600',
    label: 'Hold Steady',
  },
  exhale: {
    emoji: '💨',
    color: 'from-teal-500 to-cyan-600',
    label: 'Exhale Fully',
  },
  relax: {
    emoji: '✨',
    color: 'from-emerald-500 to-teal-600',
    label: 'Rest & Settle',
  },
};

const SEQUENCE = ['inhale', 'hold', 'exhale', 'relax'];

const DEFAULT_STEPS = [
  {
    id: 1,
    title: 'Monster Inhale',
    phase: 'inhale',
    duration_seconds: 4,
    instruction:
      'Draw a deep breath through your diaphragm. Feel the monster expand with positive energy.',
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

const REQUIRED_ROUNDS = 1;

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

  // ---------------------------------------------------------
  // GUARANTEE EXACT BREATHING SEQUENCE
  // Inhale -> Hold -> Exhale -> Relax
  // ---------------------------------------------------------

  const enforceStrictSequence = useCallback((rawSteps) => {
    if (!Array.isArray(rawSteps) || rawSteps.length === 0) {
      return DEFAULT_STEPS;
    }

    return SEQUENCE.map((sequencePhase, index) => {
      const found = rawSteps.find((step) => {
        const phase = step?.phase?.toLowerCase();

        return (
          phase === sequencePhase ||
          (sequencePhase === 'relax' && phase === 'rest')
        );
      });

      if (found) {
        return {
          ...found,
          phase: sequencePhase,
          order: index + 1,
        };
      }

      return DEFAULT_STEPS[index];
    });
  }, []);

  // ---------------------------------------------------------
  // LOAD STEPS
  // ---------------------------------------------------------

  useEffect(() => {
    let isMounted = true;

    const loadSteps = async () => {
      try {
        const res = await wellnessService.getMindfulMonsterSteps();

        if (!isMounted) {
          return;
        }

        if (
          res?.success &&
          Array.isArray(res.steps) &&
          res.steps.length > 0
        ) {
          const cleanSteps = enforceStrictSequence(res.steps);

          setSteps(cleanSteps);
          setCurrentStepIndex(0);
          setStepTimer(cleanSteps[0]?.duration_seconds || 4);
        } else {
          setSteps(DEFAULT_STEPS);
          setCurrentStepIndex(0);
          setStepTimer(DEFAULT_STEPS[0]?.duration_seconds || 4);
        }
      } catch (error) {
        console.warn(
          'Mindful Monsters steps could not be loaded. Using default steps.',
          error
        );

        if (isMounted) {
          setSteps(DEFAULT_STEPS);
          setCurrentStepIndex(0);
          setStepTimer(DEFAULT_STEPS[0]?.duration_seconds || 4);
        }
      }
    };

    loadSteps();

    return () => {
      isMounted = false;
    };
  }, [enforceStrictSequence]);

  // ---------------------------------------------------------
  // COUNTDOWN TIMER
  // ---------------------------------------------------------

  useEffect(() => {
    if (!isActive || steps.length === 0 || isFinishing) {
      return undefined;
    }

    const interval = setInterval(() => {
      setStepTimer((previousTimer) => {
        if (previousTimer > 1) {
          return previousTimer - 1;
        }

        setCurrentStepIndex((previousIndex) => {
          const nextIndex = (previousIndex + 1) % steps.length;

          if (nextIndex === 0) {
            setCompletedRounds((previousRounds) => previousRounds + 1);
          }

          setStepTimer(
            steps[nextIndex]?.duration_seconds || 4
          );

          return nextIndex;
        });

        return 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, steps, isFinishing]);

  // ---------------------------------------------------------
  // REPORT PROGRESS
  // ---------------------------------------------------------

  useEffect(() => {
    if (!onProgress || steps.length === 0 || isFinishing) {
      return;
    }

    const totalUnits = REQUIRED_ROUNDS * steps.length;

    const completedUnits =
      completedRounds * steps.length + currentStepIndex;

    const progress = Math.min(
      99,
      Math.round((completedUnits / totalUnits) * 100)
    );

    onProgress(progress, 3);
  }, [
    completedRounds,
    currentStepIndex,
    steps.length,
    onProgress,
    isFinishing,
  ]);

  // ---------------------------------------------------------
  // ACTIVE STEP
  // ---------------------------------------------------------

  const activeStep = steps[currentStepIndex] || steps[0];

  const phaseKey =
    activeStep?.phase?.toLowerCase() || 'inhale';

  const phaseConfig =
    PHASE_CONFIG[phaseKey] || PHASE_CONFIG.inhale;

  // ---------------------------------------------------------
  // FINISH MODULE
  // ---------------------------------------------------------

  const handleFinish = async () => {
    if (isFinishing || isSubmitting) {
      return;
    }

    // User must complete at least one full breathing round.
    if (completedRounds < REQUIRED_ROUNDS) {
      return;
    }

    setIsFinishing(true);
    setIsActive(false);

    try {
      // -----------------------------------------------------
      // IMPORTANT:
      // Progress is marked 100 BEFORE completion.
      // -----------------------------------------------------

      if (onProgress) {
        await onProgress(100, 3);
      }

      // -----------------------------------------------------
      // IMPORTANT:
      // ModuleShell owns completion and XP.
      //
      // onComplete(score, feedback)
      // -> ModuleShell.completeModule()
      // -> backend awards XP
      // -> progress becomes completed
      //
      // DO NOT call recordMindfulMonsterSession().
      // -----------------------------------------------------

      if (onComplete) {
        await onComplete(
          100,
          `Completed ${completedRounds} full round${
            completedRounds === 1 ? '' : 's'
          } of Mindful Monster breathing.`
        );
      }
    } catch (error) {
      console.error(
        'Mindful Monsters completion error:',
        error
      );
    } finally {
      setIsFinishing(false);
    }
  };

  // ---------------------------------------------------------
  // RESET SESSION
  // ---------------------------------------------------------

  const handleReset = () => {
    if (isFinishing || isSubmitting) {
      return;
    }

    setIsActive(false);
    setCurrentStepIndex(0);
    setStepTimer(steps[0]?.duration_seconds || 4);
    setCompletedRounds(0);
  };

  // ---------------------------------------------------------
  // ANIMATION
  // ---------------------------------------------------------

  const scaleClass =
    phaseKey === 'inhale'
      ? 'scale-125'
      : phaseKey === 'hold'
      ? 'scale-110'
      : phaseKey === 'exhale'
      ? 'scale-90'
      : 'scale-95';

  const isLoading =
    isSubmitting || isFinishing;

  const canFinish =
    completedRounds >= REQUIRED_ROUNDS;

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <div className="space-y-6 text-center select-none">

      {/* -----------------------------------------------------
          HEADER
          ----------------------------------------------------- */}

      <div className="mx-auto max-w-md space-y-1">
        <h3 className="text-lg font-black text-slate-800">
          Mindful Monsters Breathing
        </h3>

        <p className="text-xs text-slate-500">
          Complete one full breathing round to finish the activity
          and claim your XP reward.
        </p>
      </div>

      {/* -----------------------------------------------------
          ANIMATED MONSTER
          ----------------------------------------------------- */}

      <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-full border-4 border-indigo-200/50 bg-indigo-50/60 shadow-inner">
        <div
          className={`flex h-52 w-52 flex-col items-center justify-center rounded-full bg-linear-to-br ${phaseConfig.color} shadow-xl transition-all duration-1000 ease-in-out ${
            isActive ? scaleClass : 'scale-100'
          }`}
        >
          <div className="text-6xl">
            {phaseConfig.emoji}
          </div>

          <div className="mt-2 font-mono text-3xl font-black text-white">
            {stepTimer}s
          </div>

          <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/80">
            {phaseConfig.label}
          </div>
        </div>
      </div>

      {/* -----------------------------------------------------
          STEP INFO
          ----------------------------------------------------- */}

      <div className="mx-auto max-w-md space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">

        <div className="flex items-center justify-center gap-2">
          {steps.map((step, index) => (
            <span
              key={step.id || index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStepIndex
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

        <p className="text-xs leading-relaxed text-slate-600">
          {activeStep?.instruction}
        </p>

        <div className="text-[10px] text-slate-400">
          Completed Rounds: {completedRounds}
        </div>

        {canFinish && (
          <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
            ✓ Full breathing round completed
          </div>
        )}
      </div>

      {/* -----------------------------------------------------
          CONTROLS
          ----------------------------------------------------- */}

      <div className="flex flex-wrap justify-center gap-3">

        {!isActive ? (
          <button
            type="button"
            disabled={isLoading}
            onClick={() => setIsActive(true)}
            className="rounded-2xl bg-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-50"
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
            className="rounded-2xl bg-amber-500 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-amber-600 disabled:opacity-50"
          >
            ⏸ Pause
          </button>
        )}

        <button
          type="button"
          onClick={handleFinish}
          disabled={!canFinish || isLoading}
          className="cursor-pointer rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading
            ? 'Processing...'
            : '✓ Finish & Claim XP'}
        </button>

        <button
          type="button"
          onClick={handleReset}
          disabled={isLoading}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          ↻ Reset
        </button>
      </div>

      {/* -----------------------------------------------------
          COMPLETION REQUIREMENT
          ----------------------------------------------------- */}

      {!canFinish && !isLoading && (
        <p className="mx-auto max-w-md text-[11px] font-medium text-slate-400">
          Complete all four phases — inhale, hold, exhale, and
          relax — before finishing the module.
        </p>
      )}
    </div>
  );
};