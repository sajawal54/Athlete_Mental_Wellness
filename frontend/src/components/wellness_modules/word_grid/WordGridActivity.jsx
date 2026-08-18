import { useState, useEffect, useCallback, useRef } from 'react';
import { wellnessService } from '../../../services/wellnessServices/wellnessService';

export const WordGridActivity = ({ onProgress, onComplete, isSubmitting }) => {
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

  const fetchDailyPuzzle = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await wellnessService.getDailyWordGrid();
      if (res?.success && res.puzzle) {
        setPuzzle(res.puzzle);
        if (res.user_score?.words_found) {
          setFoundWords(new Set(res.user_score.words_found));
        }
      }
      const lbRes = await wellnessService.getWordGridLeaderboard();
      if (lbRes?.success) {
        setLeaderboard(lbRes.leaderboard || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load daily Word Grid.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDailyPuzzle();
  }, [fetchDailyPuzzle]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((t) => t + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying]);

  const targetWords = puzzle?.target_words || [];

  const handleCellClick = (r, c) => {
    if (!puzzle || !isPlaying) return;

    const cellKey = `${r}-${c}`;
    let newSelection;

    if (selectedCells.some(([row, col]) => row === r && col === c)) {
      newSelection = selectedCells.filter(([row, col]) => !(row === r && col === c));
    } else {
      newSelection = [...selectedCells, [r, c]];
    }

    setSelectedCells(newSelection);

    // Check if current letters form any target word
    const formedWord = newSelection
      .map(([row, col]) => puzzle.grid[row][col])
      .join('')
      .toUpperCase();

    const reverseWord = formedWord.split('').reverse().join('');

    const matchedTarget = targetWords.find(
      (w) => w.word.toUpperCase() === formedWord || w.word.toUpperCase() === reverseWord
    );

    if (matchedTarget && !foundWords.has(matchedTarget.word.toUpperCase())) {
      const updatedFound = new Set(foundWords).add(matchedTarget.word.toUpperCase());
      setFoundWords(updatedFound);
      setSelectedCells([]);

      const prog = Math.min(100, Math.round((updatedFound.size / targetWords.length) * 100));
      if (onProgress) onProgress(prog, 3);

      if (updatedFound.size === targetWords.length) {
        handleFinishPuzzle(updatedFound);
      }
    }
  };

  const handleFinishPuzzle = async (finalWords) => {
    setIsPlaying(false);
    const wordsArr = Array.from(finalWords || foundWords);
    const score = Math.max(100, wordsArr.length * 50 - Math.floor(timerSeconds / 5));

    try {
      const res = await wellnessService.submitWordGridScore(
        puzzle.id,
        wordsArr,
        timerSeconds,
        score
      );
      if (res?.success) {
        setScoreResult({ score, time: timerSeconds });
        if (onComplete) onComplete(score, `Solved Word Grid in ${timerSeconds}s!`);
      }
    } catch (err) {
      console.error(err);
      if (onComplete) onComplete(score);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-slate-500 font-semibold text-sm">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          Loading daily focus puzzle...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* PUZZLE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-extrabold text-slate-800">{puzzle?.title || 'Daily Word Grid'}</h3>
          <span className="text-xs text-indigo-600 font-semibold">Theme: {puzzle?.theme}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-mono font-bold text-slate-700">
            ⏱ {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
          </div>
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-extrabold text-emerald-800">
            {foundWords.size} / {targetWords.length} Words Found
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_260px]">
        {/* INTERACTIVE 2D LETTER GRID */}
        <div className="flex justify-center p-2">
          <div className="inline-grid gap-2 select-none bg-slate-100 p-4 rounded-3xl shadow-inner">
            {puzzle?.grid?.map((row, rIdx) => (
              <div key={rIdx} className="flex gap-2 justify-center">
                {row.map((letter, cIdx) => {
                  const isSelected = selectedCells.some(([r, c]) => r === rIdx && c === cIdx);
                  return (
                    <button
                      key={cIdx}
                      type="button"
                      onClick={() => handleCellClick(rIdx, cIdx)}
                      className={`h-11 w-11 sm:h-12 sm:w-12 rounded-2xl text-base sm:text-lg font-black transition transform active:scale-95 flex items-center justify-center font-mono ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md scale-105'
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

        {/* TARGET WORDS CHECKLIST & LEADERBOARD */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Words</div>
            <div className="space-y-1.5">
              {targetWords.map((item, idx) => {
                const isFound = foundWords.has(item.word.toUpperCase());
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between rounded-xl p-2 text-xs font-semibold transition ${
                      isFound
                        ? 'bg-emerald-50 text-emerald-800 line-through opacity-75'
                        : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{item.word}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{item.hint}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {leaderboard.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Daily Leaderboard</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {leaderboard.map((item, idx) => (
                  <div key={item.id} className="flex justify-between text-xs py-1 border-b border-slate-50">
                    <span className="font-semibold text-slate-700">#{idx + 1} {item.username}</span>
                    <span className="font-mono text-indigo-700 font-bold">{item.score} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FINISH BUTTON OR RESULTS */}
      {foundWords.size > 0 && foundWords.size === targetWords.length && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center text-xs font-extrabold text-emerald-900">
          🎉 All words located! Score: {scoreResult?.score || 300} pts recorded.
        </div>
      )}
    </div>
  );
};
