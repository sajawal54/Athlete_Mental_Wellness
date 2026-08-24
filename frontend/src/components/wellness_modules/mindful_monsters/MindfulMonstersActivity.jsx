import { useState, useEffect, useRef } from 'react';
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

  const timerRef = useRef(null);
  const sessionRef = useRef({
    stepIndex: 0,
    timer: 4,
    rounds: 0,
  });

  const onProgressRef = useRef(onProgress);

  // ---------------------------------------------------------
  // KEEP CALLBACK UPDATED
  // ---------------------------------------------------------

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  // ---------------------------------------------------------
  // LOAD API DATA
  //
  // API DATA IS ONLY USED FOR CONTENT.
  // THE FRONTEND ALWAYS FORCES:
  //
  // 1 = INHALE
  // 2 = HOLD
  // 3 = EXHALE
  // 4 = RELAX
  // ---------------------------------------------------------

  useEffect(() => {
    let mounted = true;

    const loadSteps = async () => {
      try {
        const response =
          await wellnessService.getMindfulMonsterSteps();

        if (!mounted) {
          return;
        }

        if (
          response?.success &&
          Array.isArray(response.steps) &&
          response.steps.length > 0
        ) {
          const apiSteps = response.steps;

          const getStep = (phase, fallback) => {
            const found = apiSteps.find(
              (item) =>
                String(item?.phase || '').toLowerCase() === phase ||
                (phase === 'relax' &&
                  String(item?.phase || '').toLowerCase() === 'rest')
            );

            if (!found) {
              return fallback;
            }

            return {
              ...fallback,
              ...found,
              phase: phase,
              order: fallback.order,
              duration_seconds:
                Number(found.duration_seconds) > 0
                  ? Number(found.duration_seconds)
                  : fallback.duration_seconds,
            };
          };

          // ALWAYS BUILD THE FOUR STEPS IN THIS EXACT ORDER.
          const fixedSteps = [
            getStep('inhale', DEFAULT_STEPS[0]),
            getStep('hold', DEFAULT_STEPS[1]),
            getStep('exhale', DEFAULT_STEPS[2]),
            getStep('relax', DEFAULT_STEPS[3]),
          ];

          setSteps(fixedSteps);

          sessionRef.current = {
            stepIndex: 0,
            timer: fixedSteps[0].duration_seconds,
            rounds: 0,
          };

          setCurrentStepIndex(0);
          setStepTimer(fixedSteps[0].duration_seconds);
          setCompletedRounds(0);
        } else {
          setSteps(DEFAULT_STEPS);

          sessionRef.current = {
            stepIndex: 0,
            timer: DEFAULT_STEPS[0].duration_seconds,
            rounds: 0,
          };

          setCurrentStepIndex(0);
          setStepTimer(DEFAULT_STEPS[0].duration_seconds);
          setCompletedRounds(0);
        }
      } catch (error) {
        console.warn(
          'Mindful Monsters steps could not be loaded. Using defaults.',
          error
        );

        if (!mounted) {
          return;
        }

        setSteps(DEFAULT_STEPS);

        sessionRef.current = {
          stepIndex: 0,
          timer: DEFAULT_STEPS[0].duration_seconds,
          rounds: 0,
        };

        setCurrentStepIndex(0);
        setStepTimer(DEFAULT_STEPS[0].duration_seconds);
        setCompletedRounds(0);
      }
    };

    loadSteps();

    return () => {
      mounted = false;
    };
  }, []);

  // ---------------------------------------------------------
  // THE ACTUAL BREATHING ENGINE
  //
  // IMPORTANT:
  // THIS EFFECT DOES NOT DEPEND ON currentStepIndex,
  // stepTimer, OR completedRounds.
  //
  // THEREFORE THE INTERVAL CANNOT RESTART WHEN A STEP CHANGES.
  // ---------------------------------------------------------

  useEffect(() => {
    if (!isActive || isFinishing) {
      return undefined;
    }

    timerRef.current = setInterval(() => {
      const session = sessionRef.current;

      // -----------------------------------------------------
      // COUNTDOWN
      // -----------------------------------------------------

      if (session.timer > 1) {
        session.timer -= 1;

        setStepTimer(session.timer);
        return;
      }

      // -----------------------------------------------------
      // CURRENT STEP HAS FINISHED
      // -----------------------------------------------------

      // STEP 1: INHALE -> STEP 2: HOLD
      if (session.stepIndex === 0) {
        session.stepIndex = 1;
        session.timer =
          steps[1]?.duration_seconds || 4;

        setCurrentStepIndex(1);
        setStepTimer(session.timer);

        return;
      }

      // STEP 2: HOLD -> STEP 3: EXHALE
      if (session.stepIndex === 1) {
        session.stepIndex = 2;
        session.timer =
          steps[2]?.duration_seconds || 4;

        setCurrentStepIndex(2);
        setStepTimer(session.timer);

        return;
      }

      // STEP 3: EXHALE -> STEP 4: RELAX
      if (session.stepIndex === 2) {
        session.stepIndex = 3;
        session.timer =
          steps[3]?.duration_seconds || 4;

        setCurrentStepIndex(3);
        setStepTimer(session.timer);

        return;
      }

      // STEP 4: RELAX -> ROUND COMPLETE
      if (session.stepIndex === 3) {
        session.rounds += 1;

        setCompletedRounds(session.rounds);

        // Stop after required rounds.
        if (session.rounds >= REQUIRED_ROUNDS) {
          setIsActive(false);

          session.timer =
            steps[3]?.duration_seconds || 4;

          setStepTimer(session.timer);

          return;
        }

        // If more rounds are ever required:
        // STEP 4 -> STEP 1
        session.stepIndex = 0;
        session.timer =
          steps[0]?.duration_seconds || 4;

        setCurrentStepIndex(0);
        setStepTimer(session.timer);
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, isFinishing, steps]);

  // ---------------------------------------------------------
  // PROGRESS
  // ---------------------------------------------------------

  useEffect(() => {
    if (isFinishing) {
      return;
    }

    const totalUnits = REQUIRED_ROUNDS * 4;

    const completedUnits = Math.min(
      totalUnits,
      completedRounds * 4 + currentStepIndex
    );

    const progress = Math.min(
      99,
      Math.round((completedUnits / totalUnits) * 100)
    );

    if (onProgressRef.current) {
      onProgressRef.current(progress, 3);
    }
  }, [
    currentStepIndex,
    completedRounds,
    isFinishing,
  ]);

  // ---------------------------------------------------------
  // ACTIVE STEP
  // ---------------------------------------------------------

  const activeStep =
    steps[currentStepIndex] || DEFAULT_STEPS[0];

  const phaseKey =
    String(activeStep?.phase || 'inhale').toLowerCase();

  const phaseConfig =
    PHASE_CONFIG[phaseKey] || PHASE_CONFIG.inhale;

  // ---------------------------------------------------------
  // FINISH
  // ---------------------------------------------------------

  const handleFinish = async () => {
    if (
      isFinishing ||
      isSubmitting ||
      completedRounds < REQUIRED_ROUNDS
    ) {
      return;
    }

    setIsFinishing(true);
    setIsActive(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      if (onProgress) {
        await onProgress(100, 3);
      }

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
  // RESET
  // ---------------------------------------------------------

  const handleReset = () => {
    if (isFinishing || isSubmitting) {
      return;
    }

    setIsActive(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const firstDuration =
      steps[0]?.duration_seconds || 4;

    sessionRef.current = {
      stepIndex: 0,
      timer: firstDuration,
      rounds: 0,
    };

    setCurrentStepIndex(0);
    setStepTimer(firstDuration);
    setCompletedRounds(0);
  };

  // ---------------------------------------------------------
  // START
  // ---------------------------------------------------------

  const handleStart = () => {
    if (isLoading || completedRounds >= REQUIRED_ROUNDS) {
      return;
    }

    // Make sure the session state and UI are synchronized.
    sessionRef.current = {
      stepIndex: currentStepIndex,
      timer: stepTimer,
      rounds: completedRounds,
    };

    setIsActive(true);
  };

  // ---------------------------------------------------------
  // UI HELPERS
  // ---------------------------------------------------------

  const isLoading = isSubmitting || isFinishing;
  const canFinish =
    completedRounds >= REQUIRED_ROUNDS;

  const scaleClass =
    phaseKey === 'inhale'
      ? 'scale-125'
      : phaseKey === 'hold'
        ? 'scale-110'
        : phaseKey === 'exhale'
          ? 'scale-90'
          : 'scale-95';

  // ---------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------

  return (
    <div className="mx-auto max-w-md space-y-6 text-center select-none">
      {/* HEADER */}
      <div className="space-y-1">
        <h3 className="text-lg font-black text-slate-800">
          Mindful Monsters Breathing
        </h3>

        <p className="text-xs text-slate-500">
          Complete one full breathing round to finish the activity
          and claim your XP reward.
        </p>
      </div>

      {/* MONSTER */}
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

      {/* STEP INFORMATION */}
      <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        {/* STEP DOTS */}
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

        {/* PHASE */}
        <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">
          Phase {currentStepIndex + 1} of 4:{' '}
          {phaseKey.toUpperCase()}
        </div>

        {/* TITLE */}
        <h3 className="text-base font-extrabold text-slate-800">
          {activeStep?.title}
        </h3>

        {/* INSTRUCTION */}
        <p className="text-xs leading-relaxed text-slate-600">
          {activeStep?.instruction}
        </p>

        {/* ROUND */}
        <div className="text-[10px] font-medium text-slate-400">
          Completed Rounds: {completedRounds}
        </div>

        {/* COMPLETED */}
        {canFinish && (
          <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
            ✓ Full breathing round completed
          </div>
        )}
      </div>

      {/* CONTROLS */}
      <div className="flex flex-wrap justify-center gap-3">
        {!isActive ? (
          <button
            type="button"
            disabled={isLoading || canFinish}
            onClick={handleStart}
            className="cursor-pointer rounded-2xl bg-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {currentStepIndex > 0
              ? '▶ Resume Session'
              : '▶ Begin Guided Breathing'}
          </button>
        ) : (
          <button
            type="button"
            disabled={isLoading}
            onClick={() => setIsActive(false)}
            className="cursor-pointer rounded-2xl bg-amber-500 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ⏸ Pause
          </button>
        )}

        <button
          type="button"
          disabled={!canFinish || isLoading}
          onClick={handleFinish}
          className="cursor-pointer rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading
            ? 'Processing...'
            : '✓ Finish & Claim XP'}
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={handleReset}
          className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ↻ Reset
        </button>
      </div>

      {/* REQUIREMENT */}
      {!canFinish && !isLoading && (
        <p className="text-[11px] font-medium text-slate-400">
          Complete all four phases — inhale, hold, exhale, and
          relax — before finishing the module.
        </p>
      )}
    </div>
  );
};