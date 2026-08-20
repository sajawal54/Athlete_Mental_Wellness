import { useState, useEffect, useRef } from 'react';
import { wellnessService } from '../../../services/wellnessServices/wellnessService';

const getCurrentTime = () => performance.now();

export const ReactionZoneActivity = ({
  onProgress,
  onComplete,
  isSubmitting,
}) => {
  const [gameState, setGameState] = useState('idle'); // idle | waiting | ready | result
  const [reactionTimes, setReactionTimes] = useState([]);
  const [round, setRound] = useState(1);
  const [falseStarts, setFalseStarts] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [scoreResult, setScoreResult] = useState(null);
  const [isClickBlocked, setIsClickBlocked] = useState(false);

  const timeoutRef = useRef(null);
  const startTimeRef = useRef(0);
  const totalRounds = 5;

  const fetchLeaderboard = async () => {
    try {
      const res = await wellnessService.getReactionLeaderboard();

      if (res?.success) {
        setLeaderboard(res.leaderboard || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadLeaderboard = async () => {
      try {
        const res = await wellnessService.getReactionLeaderboard();

        if (!cancelled && res?.success) {
          setLeaderboard(res.leaderboard || []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
        }
      }
    };

    loadLeaderboard();

    return () => {
      cancelled = true;
      clearTimeout(timeoutRef.current);
    };
  }, []);

  const startRound = () => {
    setGameState('waiting');
    setIsClickBlocked(false);

    // Random delay between 1.5s and 4.0s
    const delay = Math.floor(Math.random() * 2500) + 1500;

    timeoutRef.current = setTimeout(() => {
      setGameState('ready');
      startTimeRef.current = getCurrentTime();
    }, delay);
  };

  const handleBoxClick = () => {
    if (isClickBlocked) return;

    if (gameState === 'idle') {
      startRound();
      return;
    }

    if (gameState === 'waiting') {
      // False start!
      clearTimeout(timeoutRef.current);
      setFalseStarts((f) => f + 1);
      setGameState('idle');
      setIsClickBlocked(false);
      alert('⚠️ Too early! Wait for the box to turn GREEN.');
      return;
    }

    if (gameState === 'ready') {
      const currentTime = getCurrentTime();
      const diff = Math.round(currentTime - startTimeRef.current);

      setIsClickBlocked(true);

      const updatedTimes = [...reactionTimes, diff];
      setReactionTimes(updatedTimes);

      const prog = Math.min(
        100,
        Math.round((round / totalRounds) * 100)
      );

      if (onProgress) {
        onProgress(prog, 3);
      }

      if (round < totalRounds) {
        setRound((r) => r + 1);

        // Allow the next round to be started
        setIsClickBlocked(false);
        setGameState('idle');
      } else {
        // Game Finished
        finishGame(updatedTimes);
      }
    }
  };

  const finishGame = async (times) => {
    setGameState('result');

    const avg = Math.round(
      times.reduce((a, b) => a + b, 0) / times.length
    );

    const score = Math.max(
      100,
      Math.round(1000 - avg - falseStarts * 50)
    );

    try {
      const res = await wellnessService.submitReactionScore(
        score,
        totalRounds,
        totalRounds,
        15
      );

      if (res?.success) {
        // FIX: Extract actual XP awarded from backend response or default to 25 XP
        const xpEarned = res?.xp_awarded ?? 25;

        setScoreResult({ avg, score, xpEarned });

        fetchLeaderboard();

        if (onComplete) {
          // FIX: Passing xpEarned as the first parameter so parent receives actual XP
          onComplete(
            xpEarned,
            `Average reaction speed: ${avg}ms (Score: ${score})`
          );
        }
      }
    } catch (err) {
      console.error(err);

      if (onComplete) {
        // Fallback XP in case of error
        onComplete(25, `Average reaction speed: ${avg}ms (Score: ${score})`);
      }
    }
  };

  const resetGame = () => {
    clearTimeout(timeoutRef.current);

    setGameState('idle');
    setReactionTimes([]);
    setRound(1);
    setFalseStarts(0);
    setScoreResult(null);
    setIsClickBlocked(false);
    startTimeRef.current = 0;
  };

  return (
    <div className="space-y-6 text-center">
      <div className="max-w-md mx-auto space-y-1">
        <h3 className="text-lg font-black text-slate-800">
          Precision Reaction Test
        </h3>

        <p className="text-xs text-slate-500">
          Round {round} of {totalRounds} • Tap the box as quickly as possible
          when it turns GREEN.
        </p>
      </div>

      {/* INTERACTIVE GAME BOX */}
      {gameState !== 'result' ? (
        <div
          onClick={handleBoxClick}
          className={`mx-auto flex h-60 w-full max-w-md cursor-pointer select-none flex-col items-center justify-center rounded-3xl p-6 transition-colors duration-150 shadow-md ${
            gameState === 'idle'
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : gameState === 'waiting'
              ? 'bg-rose-500 text-white animate-pulse'
              : 'bg-emerald-500 text-white scale-102'
          }`}
        >
          {gameState === 'idle' && (
            <div className="space-y-2">
              <div className="text-4xl">⚡</div>

              <div className="text-lg font-black">
                {round === 1
                  ? 'Tap to Start Test'
                  : 'Tap for Next Round'}
              </div>

              <div className="text-xs text-indigo-200">
                Prepare your reflexes
              </div>
            </div>
          )}

          {gameState === 'waiting' && (
            <div className="space-y-1">
              <div className="text-4xl">🛑</div>

              <div className="text-lg font-black uppercase tracking-wider">
                WAIT FOR GREEN...
              </div>

              <div className="text-xs text-rose-100">
                Do not tap yet!
              </div>
            </div>
          )}

          {gameState === 'ready' && (
            <div className="space-y-1">
              <div className="text-5xl">⚡</div>

              <div className="text-2xl font-black uppercase tracking-widest">
                TAP NOW!
              </div>
            </div>
          )}
        </div>
      ) : (
        /* RESULT VIEW */
        <div className="mx-auto max-w-md rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6 space-y-4 shadow-sm animate-fadeIn">
          <div className="text-4xl">⚡</div>

          <h4 className="text-xl font-black text-slate-800">
            Test Complete!
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white p-3 border border-emerald-100">
              <div className="text-[10px] uppercase font-bold text-slate-500">
                Average Speed
              </div>

              <div className="text-xl font-black text-emerald-700 font-mono">
                {scoreResult?.avg} ms
              </div>
            </div>

            <div className="rounded-2xl bg-white p-3 border border-emerald-100">
              <div className="text-[10px] uppercase font-bold text-slate-500">
                Total Score
              </div>

              <div className="text-xl font-black text-indigo-700 font-mono">
                {scoreResult?.score} pts
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={resetGame}
            disabled={isSubmitting}
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
          >
            Try Again
          </button>
        </div>
      )}

      {/* REACTION STATS */}
      {reactionTimes.length > 0 && gameState !== 'result' && (
        <div className="flex justify-center gap-2 text-xs font-mono text-slate-600">
          {reactionTimes.map((t, idx) => (
            <span
              key={idx}
              className="rounded-lg bg-slate-100 px-2 py-1"
            >
              R{idx + 1}: {t}ms
            </span>
          ))}
        </div>
      )}

      {/* LEADERBOARD */}
      {leaderboard.length > 0 && (
        <div className="max-w-md mx-auto space-y-2 pt-4 border-t border-slate-100 text-left">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Top Reflex High Scores
          </h4>

          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {leaderboard.map((item, idx) => (
              <div
                key={item.id || idx}
                className="flex items-center justify-between rounded-xl bg-slate-50 p-2 text-xs"
              >
                <span className="font-semibold text-slate-700">
                  #{idx + 1} {item.username || 'Athlete'}
                </span>

                <span className="font-mono font-bold text-indigo-700">
                  {item.score} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};