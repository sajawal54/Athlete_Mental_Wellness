import { useEffect, useRef, useState } from 'react';
import { wellnessService } from '../../../services/wellnessServices/wellnessService';

export const WordGridActivity = ({
  onProgress,
  onComplete,
}) => {
  const [puzzle, setPuzzle] = useState(null);
  const [selectedCells, setSelectedCells] = useState([]);
  const [foundWords, setFoundWords] = useState(new Set());
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [scoreResult, setScoreResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const timerRef = useRef(null);
  const hasFinishedRef = useRef(false);

  const onProgressRef = useRef(onProgress);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const fetchDailyPuzzle = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await wellnessService.getDailyWordGrid();

      if (res?.success && res.puzzle) {
        setPuzzle(res.puzzle);

        if (res.user_score?.words_found) {
          const initialFound = new Set(
            res.user_score.words_found
          );

          setFoundWords(initialFound);

          if (
            res.puzzle.target_words &&
            initialFound.size ===
              res.puzzle.target_words.length
          ) {
            setIsPlaying(false);
            hasFinishedRef.current = true;
          }
        }
      }

      const lbRes =
        await wellnessService.getWordGridLeaderboard();

      if (lbRes?.success) {
        setLeaderboard(lbRes.leaderboard || []);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Failed to load daily Word Grid.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadPuzzle = async () => {
      if (cancelled) return;

      await fetchDailyPuzzle();
    };

    loadPuzzle();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((previous) => previous + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => {
      clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const targetWords = puzzle?.target_words || [];

  const handleFinishPuzzle = async (
    finalWords,
    currentPuzzle,
    currentTimer
  ) => {
    if (
      hasFinishedRef.current ||
      !currentPuzzle
    ) {
      return;
    }

    hasFinishedRef.current = true;
    setIsPlaying(false);

    const wordsArr = Array.from(finalWords || foundWords);

    const score = Math.max(
      100,
      wordsArr.length * 50 -
        Math.floor(currentTimer / 5)
    );

    try {
      const res =
        await wellnessService.submitWordGridScore(
          currentPuzzle.id,
          wordsArr,
          currentTimer,
          score
        );

      if (res?.success) {
        const xpEarned =
          res?.xp_awarded ??
          res?.data?.xp_awarded ??
          25;

        setScoreResult({
          score,
          time: currentTimer,
          xpEarned,
        });

        if (onCompleteRef.current) {
          await onCompleteRef.current(
            xpEarned,
            `Solved Word Grid in ${currentTimer}s! (Score: ${score})`
          );
        }
      }
    } catch (err) {
      console.error(
        'Word Grid submission error:',
        err
      );

      if (onCompleteRef.current) {
        await onCompleteRef.current(
          25,
          `Solved Word Grid in ${currentTimer}s!`
        );
      }
    }
  };

  const handleCellClick = (row, col) => {
    if (
      !puzzle ||
      !isPlaying ||
      hasFinishedRef.current
    ) {
      return;
    }

    let newSelection;

    const alreadySelected = selectedCells.some(
      ([selectedRow, selectedCol]) =>
        selectedRow === row &&
        selectedCol === col
    );

    if (alreadySelected) {
      newSelection = selectedCells.filter(
        ([selectedRow, selectedCol]) =>
          !(
            selectedRow === row &&
            selectedCol === col
          )
      );
    } else {
      newSelection = [
        ...selectedCells,
        [row, col],
      ];
    }

    setSelectedCells(newSelection);

    const formedWord = newSelection
      .map(
        ([selectedRow, selectedCol]) =>
          puzzle.grid[selectedRow][selectedCol]
      )
      .join('')
      .toUpperCase();

    const reverseWord = formedWord
      .split('')
      .reverse()
      .join('');

    const matchedTarget = targetWords.find(
      (item) =>
        item.word.toUpperCase() === formedWord ||
        item.word.toUpperCase() === reverseWord
    );

    if (
      matchedTarget &&
      !foundWords.has(
        matchedTarget.word.toUpperCase()
      )
    ) {
      const updatedFound = new Set(
        foundWords
      );

      updatedFound.add(
        matchedTarget.word.toUpperCase()
      );

      setFoundWords(updatedFound);
      setSelectedCells([]);

      const progress =
        targetWords.length > 0
          ? Math.min(
              100,
              Math.round(
                (updatedFound.size /
                  targetWords.length) *
                  100
              )
            )
          : 0;

      if (onProgressRef.current) {
        onProgressRef.current(progress, 3);
      }

      if (
        targetWords.length > 0 &&
        updatedFound.size === targetWords.length
      ) {
        handleFinishPuzzle(
          updatedFound,
          puzzle,
          timerSeconds
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          Loading daily focus puzzle...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          <span>⚠️ {error}</span>

          <button
            type="button"
            onClick={() => setError(null)}
            className="cursor-pointer font-bold text-rose-500 hover:text-rose-700"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-extrabold text-slate-800">
            {puzzle?.title || 'Daily Word Grid'}
          </h3>

          <span className="text-xs font-semibold text-indigo-600">
            Theme: {puzzle?.theme}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-100 px-3 py-1 font-mono text-xs font-bold text-slate-700">
            ⏱ {Math.floor(timerSeconds / 60)}:
            {(timerSeconds % 60)
              .toString()
              .padStart(2, '0')}
          </div>

          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-800">
            {foundWords.size} / {targetWords.length}{' '}
            Words Found
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_260px]">
        <div className="flex justify-center p-2">
          <div className="inline-grid select-none gap-2 rounded-3xl bg-slate-100 p-4 shadow-inner">
            {puzzle?.grid?.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="flex justify-center gap-2"
              >
                {row.map((letter, columnIndex) => {
                  const isSelected =
                    selectedCells.some(
                      ([selectedRow, selectedCol]) =>
                        selectedRow === rowIndex &&
                        selectedCol === columnIndex
                    );

                  return (
                    <button
                      key={columnIndex}
                      type="button"
                      onClick={() =>
                        handleCellClick(
                          rowIndex,
                          columnIndex
                        )
                      }
                      disabled={!isPlaying}
                      className={`flex h-11 w-11 transform cursor-pointer items-center justify-center rounded-2xl font-mono text-base font-black transition active:scale-95 sm:h-12 sm:w-12 sm:text-lg ${
                        isSelected
                          ? 'scale-105 bg-indigo-600 text-white shadow-md'
                          : 'bg-white text-slate-800 shadow-xs hover:bg-indigo-50 hover:text-indigo-700'
                      }`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Target Words
            </div>

            <div className="space-y-1.5">
              {targetWords.map((item, index) => {
                const isFound = foundWords.has(
                  item.word.toUpperCase()
                );

                return (
                  <div
                    key={item.word || index}
                    className={`flex items-center justify-between rounded-xl p-2 text-xs font-semibold transition ${
                      isFound
                        ? 'bg-emerald-50 text-emerald-800 opacity-75 line-through'
                        : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{item.word}</span>

                    <span className="text-[10px] font-normal text-slate-400">
                      {item.hint}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {leaderboard.length > 0 && (
            <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Daily Leaderboard
              </div>

              <div className="max-h-32 space-y-1 overflow-y-auto">
                {leaderboard.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="flex justify-between border-b border-slate-50 py-1 text-xs"
                  >
                    <span className="font-semibold text-slate-700">
                      #{index + 1} {item.username}
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
      </div>

      {foundWords.size > 0 &&
        foundWords.size === targetWords.length && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center text-xs font-extrabold text-emerald-900">
            🎉 All words located! Score:{' '}
            {scoreResult?.score || 300} pts recorded.
          </div>
        )}
    </div>
  );
};