import { useState, useEffect, useRef, useCallback } from 'react';
import { wellnessService } from '../../../services/wellnessServices/wellnessService';

const DURATIONS = [
  { minutes: 1, label: '1 min Reset' },
  { minutes: 3, label: '3 min Focus' },
  { minutes: 5, label: '5 min Decompress' },
  { minutes: 10, label: '10 min Deep State' },
];

// Box breathing: 4s Inhale → 4s Hold → 4s Exhale → 4s Hold
const getPhaseFromCycleSec = (cycleSec) => {
  if (cycleSec < 4) return { text: 'Inhale Deeply', countdown: 4 - cycleSec, scale: 'scale-125' };
  if (cycleSec < 8) return { text: 'Hold Breath', countdown: 8 - cycleSec, scale: 'scale-110' };
  if (cycleSec < 12) return { text: 'Exhale Slowly', countdown: 12 - cycleSec, scale: 'scale-90' };
  return { text: 'Rest & Settle', countdown: 16 - cycleSec, scale: 'scale-95' };
};

export const BreathworkActivity = ({ onProgress, onComplete, isSubmitting }) => {
  const [selectedDuration, setSelectedDuration] = useState(3);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [phase, setPhase] = useState({ text: 'Inhale Deeply', countdown: 4, scale: 'scale-100' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const timerRef = useRef(null);
  const totalSeconds = selectedDuration * 60;
  const progressPct = Math.min(100, Math.round((elapsedSeconds / totalSeconds) * 100));

  const submitSession = useCallback(async (secondsCompleted) => {
    setLoading(true);
    setError(null);

    const minsCompleted = Math.max(1, Math.round(secondsCompleted / 60));
    try {
      if (wellnessService.recordBreathworkSession) {
        await wellnessService.recordBreathworkSession(selectedDuration, secondsCompleted);
      }
      
      if (onComplete) {
        onComplete(100, `Completed ${minsCompleted} min box breathwork session.`);
      }
    } catch (err) {
      console.error('Failed to save breathwork session:', err);
      setError('Progress local calculate ho gaya hai par server par save nahi ho saka.');
      
      if (onComplete) {
        onComplete(100, `Completed ${minsCompleted} min box breathwork session (Offline).`);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedDuration, onComplete]);

  const handleAutoFinish = useCallback(async (finalSeconds) => {
    setIsActive(false);
    await submitSession(finalSeconds);
  }, [submitSession]);

  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          setPhase(getPhaseFromCycleSec(next % 16));
          
          const currentProgress = Math.min(100, Math.round((next / totalSeconds) * 100));
          if (onProgress) onProgress(currentProgress, 3);

          // Auto-finish when duration is reached
          if (next >= totalSeconds) {
            clearInterval(timerRef.current);
            handleAutoFinish(next);
            return totalSeconds;
          }

          return next;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, isPaused, totalSeconds, onProgress, handleAutoFinish]);

  const handleStart = () => {
    setIsActive(true);
    setIsPaused(false);
    setError(null);
  };

  const handlePause = () => {
    setIsPaused((p) => !p);
  };

  const handleFinish = async () => {
    if (elapsedSeconds < 10) return;
    setIsActive(false);
    clearInterval(timerRef.current);
    await submitSession(elapsedSeconds);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 text-center">
      {/* DURATION SELECTOR */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Select Session Duration</div>
        <div className="flex flex-wrap justify-center gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.minutes}
              type="button"
              disabled={isActive}
              onClick={() => { setSelectedDuration(d.minutes); setElapsedSeconds(0); setIsActive(false); setIsPaused(false); }}
              className={`rounded-2xl px-4 py-2.5 text-xs font-extrabold transition ${
                selectedDuration === d.minutes
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-teal-50 hover:text-teal-800'
              } disabled:cursor-not-allowed disabled:opacity-70`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* BREATHING CIRCLE ANIMATION */}
      <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-full bg-teal-50/60 border-4 border-teal-200/50">
        <div className={`flex h-52 w-52 flex-col items-center justify-center rounded-full bg-linear-to-br from-teal-500 to-emerald-600 text-white shadow-xl transition-all duration-1000 ease-in-out ${isActive && !isPaused ? phase.scale : 'scale-100'}`}>
          <div className="text-[10px] font-bold uppercase tracking-widest text-teal-100">{phase.text}</div>
          <div className="mt-1 text-5xl font-black font-mono">{phase.countdown}</div>
          <div className="mt-2 text-xs font-semibold text-teal-100">
            {formatTime(elapsedSeconds)} / {formatTime(totalSeconds)}
          </div>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="mx-auto max-w-xs space-y-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-linear-to-r from-teal-500 to-emerald-500 transition-all duration-1000" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="text-[10px] font-semibold text-slate-400">{progressPct}% Complete</div>
      </div>

      {error && (
        <div className="text-xs text-rose-500 font-semibold max-w-xs mx-auto">
          ⚠️ {error}
        </div>
      )}

      {/* CONTROLS */}
      <div className="flex flex-wrap justify-center gap-3">
        {!isActive ? (
          <button
            type="button"
            onClick={handleStart}
            disabled={loading || isSubmitting}
            className="rounded-2xl bg-teal-600 px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-teal-700 transition disabled:opacity-50"
          >
            {elapsedSeconds > 0 ? '▶ Resume' : '▶ Begin Breathwork'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePause}
            className={`rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-md transition ${isPaused ? 'bg-teal-600 hover:bg-teal-700' : 'bg-amber-500 hover:bg-amber-600'}`}
          >
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
        )}
        <button
          type="button"
          onClick={handleFinish}
          disabled={loading || isSubmitting || elapsedSeconds < 10}
          className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 transition"
        >
          {loading ? 'Submitting...' : '✓ Complete & Claim XP'}
        </button>
      </div>

      {elapsedSeconds < 10 && isActive && (
        <p className="text-[10px] text-slate-400">Complete at least 10 seconds to claim your reward.</p>
      )}
    </div>
  );
};