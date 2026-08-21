import { useState, useEffect, useRef } from 'react';
import { wellnessService } from '../../../services/wellnessServices/wellnessService';

const getCurrentTime = () => performance.now();

export const ReactionZoneActivity = ({
  onProgress,
  onComplete,
  isSubmitting,
}) => {
  const [gameState, setGameState] = useState('idle');
  const [reactionTimes, setReactionTimes] = useState([]);
  const [round, setRound] = useState(1);
  const [falseStarts, setFalseStarts] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [scoreResult, setScoreResult] = useState(null);
  const [isClickBlocked, setIsClickBlocked] = useState(false);

  const timeoutRef = useRef(null);
  const startTimeRef = useRef(0);

  const totalRounds = 5;

  // =========================================================
  // LEADERBOARD
  // =========================================================

  const fetchLeaderboard = async () => {
    try {
      const res = await wellnessService.getReactionLeaderboard();

      if (res?.success) {
        setLeaderboard(res.leaderboard || []);
      }
    } catch (err) {
      console.error(
        'Failed to load Reaction Zone leaderboard:',
        err
      );
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadLeaderboard = async () => {
      try {
        const res =
          await wellnessService.getReactionLeaderboard();

        if (!cancelled && res?.success) {
          setLeaderboard(res.leaderboard || []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(
            'Failed to load Reaction Zone leaderboard:',
            err
          );
        }
      }
    };

    loadLeaderboard();

    return () => {
      cancelled = true;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // =========================================================
  // START ROUND
  // =========================================================

  const startRound = () => {
    if (isSubmitting) {
      return;
    }

    setGameState('waiting');
    setIsClickBlocked(false);

    // Random delay between 1.5s and 4.0s
    const delay =
      Math.floor(Math.random() * 2500) + 1500;

    timeoutRef.current = setTimeout(() => {
      setGameState('ready');
      startTimeRef.current = getCurrentTime();
    }, delay);
  };

  // =========================================================
  // HANDLE GAME BOX CLICK
  // =========================================================

  const handleBoxClick = () => {
    if (isClickBlocked || isSubmitting) {
      return;
    }

    // -------------------------------------------------------
    // Start first / next round
    // -------------------------------------------------------

    if (gameState === 'idle') {
      startRound();
      return;
    }

    // -------------------------------------------------------
    // False start
    // -------------------------------------------------------

    if (gameState === 'waiting') {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setFalseStarts((previous) => previous + 1);
      setGameState('idle');
      setIsClickBlocked(false);

      alert(
        '⚠️ Too early! Wait for the box to turn GREEN.'
      );

      return;
    }

    // -------------------------------------------------------
    // Valid reaction
    // -------------------------------------------------------

    if (gameState === 'ready') {
      const currentTime = getCurrentTime();

      const diff = Math.round(
        currentTime - startTimeRef.current
      );

      setIsClickBlocked(true);

      const updatedTimes = [
        ...reactionTimes,
        diff,
      ];

      setReactionTimes(updatedTimes);

      const progress = Math.min(
        100,
        Math.round(
          (round / totalRounds) * 100
        )
      );

      if (onProgress) {
        onProgress(progress, 3);
      }

      // -----------------------------------------------------
      // More rounds remaining
      // -----------------------------------------------------

      if (round < totalRounds) {
        setRound((previous) => previous + 1);
        setIsClickBlocked(false);
        setGameState('idle');

        return;
      }

      // -----------------------------------------------------
      // Game finished
      // -----------------------------------------------------

      finishGame(updatedTimes);
    }
  };

  // =========================================================
  // FINISH GAME
  // =========================================================

  const finishGame = async (times) => {
    setGameState('result');

    const average =
      times.length > 0
        ? Math.round(
            times.reduce(
              (sum, time) => sum + time,
              0
            ) / times.length
          )
        : 0;

    const score = Math.max(
      100,
      Math.round(
        1000 -
          average -
          falseStarts * 50
      )
    );

    try {
      // -----------------------------------------------------
      // IMPORTANT:
      //
      // This endpoint ONLY saves the Reaction Zone score.
      // It does NOT award XP.
      //
      // XP is awarded by ModuleShell through completeModule().
      // -----------------------------------------------------

      const res =
        await wellnessService.submitReactionScore(
          score,
          totalRounds,
          totalRounds,
          15
        );

      if (!res?.success) {
        throw new Error(
          res?.message ||
            'Failed to submit Reaction Zone score.'
        );
      }

      setScoreResult({
        avg: average,
        score,
      });

      await fetchLeaderboard();

      // -----------------------------------------------------
      // IMPORTANT:
      //
      // Pass SCORE here, NOT XP.
      //
      // ModuleShell receives this score and then calls
      // completeModule() to award the module XP.
      // -----------------------------------------------------

      if (onComplete) {
        onComplete(
          score,
          `Average reaction speed: ${average}ms (Score: ${score})`
        );
      }
    } catch (err) {
      console.error(
        'Reaction Zone submission failed:',
        err
      );

      // Do NOT give fake/fallback XP here.
      //
      // Previously this was:
      //
      // onComplete(25, ...)
      //
      // which incorrectly treated 25 XP as the score.
      //
      // We only report the game score if the parent wants
      // to handle the error.
    }
  };

  // =========================================================
  // RESET GAME
  // =========================================================

  const resetGame = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setGameState('idle');
    setReactionTimes([]);
    setRound(1);
    setFalseStarts(0);
    setScoreResult(null);
    setIsClickBlocked(false);

    startTimeRef.current = 0;
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto max-w-md space-y-1">
        <h3 className="text-lg font-black text-slate-800">
          Precision Reaction Test
        </h3>

        <p className="text-xs text-slate-500">
          Round {round} of {totalRounds} • Tap the
          box as quickly as possible when it turns
          GREEN.
        </p>
      </div>

      {/* =====================================================
          INTERACTIVE GAME BOX
          ===================================================== */}

      {gameState !== 'result' ? (
        <div
          onClick={handleBoxClick}
          className={`mx-auto flex h-60 w-full max-w-md cursor-pointer select-none flex-col items-center justify-center rounded-3xl p-6 shadow-md transition-colors duration-150 ${
            gameState === 'idle'
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : gameState === 'waiting'
              ? 'animate-pulse bg-rose-500 text-white'
              : 'scale-102 bg-emerald-500 text-white'
          }`}
        >
          {/* IDLE */}

          {gameState === 'idle' && (
            <div className="space-y-2">
              <div className="text-4xl">
                ⚡
              </div>

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

          {/* WAITING */}

          {gameState === 'waiting' && (
            <div className="space-y-1">
              <div className="text-4xl">
                🛑
              </div>

              <div className="text-lg font-black uppercase tracking-wider">
                WAIT FOR GREEN...
              </div>

              <div className="text-xs text-rose-100">
                Do not tap yet!
              </div>
            </div>
          )}

          {/* READY */}

          {gameState === 'ready' && (
            <div className="space-y-1">
              <div className="text-5xl">
                ⚡
              </div>

              <div className="text-2xl font-black uppercase tracking-widest">
                TAP NOW!
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ===================================================
           RESULT VIEW
           =================================================== */

        <div className="mx-auto max-w-md space-y-4 rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm animate-fadeIn">
          <div className="text-4xl">
            ⚡
          </div>

          <h4 className="text-xl font-black text-slate-800">
            Test Complete!
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-emerald-100 bg-white p-3">
              <div className="text-[10px] font-bold uppercase text-slate-500">
                Average Speed
              </div>

              <div className="font-mono text-xl font-black text-emerald-700">
                {scoreResult?.avg} ms
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-white p-3">
              <div className="text-[10px] font-bold uppercase text-slate-500">
                Total Score
              </div>

              <div className="font-mono text-xl font-black text-indigo-700">
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

      {/* =====================================================
          REACTION STATS
          ===================================================== */}

      {reactionTimes.length > 0 &&
        gameState !== 'result' && (
          <div className="flex justify-center gap-2 text-xs font-mono text-slate-600">
            {reactionTimes.map((time, index) => (
              <span
                key={`${time}-${index}`}
                className="rounded-lg bg-slate-100 px-2 py-1"
              >
                R{index + 1}: {time}ms
              </span>
            ))}
          </div>
        )}

      {/* =====================================================
          LEADERBOARD
          ===================================================== */}

      {leaderboard.length > 0 && (
        <div className="mx-auto max-w-md space-y-2 border-t border-slate-100 pt-4 text-left">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Top Reflex High Scores
          </h4>

          <div className="max-h-36 space-y-1.5 overflow-y-auto">
            {leaderboard.map((item, index) => (
              <div
                key={item.id || index}
                className="flex items-center justify-between rounded-xl bg-slate-50 p-2 text-xs"
              >
                <span className="font-semibold text-slate-700">
                  #{index + 1}{' '}
                  {item.username || 'Athlete'}
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