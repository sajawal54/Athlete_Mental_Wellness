import { useState, useCallback, useEffect } from 'react';
import { wellnessService } from '../../../services/wellnessServices/wellnessService';

const EXERCISE_TYPES = [
  {
    value: 'reflection',
    label: '🌱 Resilience Reflection',
    prompt:
      'Describe a moment when you overcame adversity. What strength or skill did you discover in yourself that you want to carry forward?',
    placeholder:
      'When I faced my worst match result, what I discovered about myself was...',
  },
  {
    value: 'stress_release',
    label: '💨 Stress Release',
    prompt:
      'Write freely about current pressures in your athletic journey. Let it all out without self-judgment.',
    placeholder:
      'Right now the biggest pressure I feel is...',
  },
  {
    value: 'gratitude',
    label: '🌟 Gratitude Garden',
    prompt:
      'List 3 things — big or small — that your athletic journey has given you that you are genuinely grateful for right now.',
    placeholder:
      '1. I am grateful for... 2. I appreciate... 3. What I rarely thank myself for is...',
  },
];

export const GritGardenActivity = ({
  onProgress,
  onComplete,
  isSubmitting = false,
}) => {
  const [exerciseType, setExerciseType] = useState('reflection');
  const [journalText, setJournalText] = useState('');
  const [exerciseResponse, setExerciseResponse] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [aiFeedback, setAiFeedback] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  const selectedExercise =
    EXERCISE_TYPES.find(
      (exercise) => exercise.value === exerciseType
    ) || EXERCISE_TYPES[0];

  // ---------------------------------------------------------
  // LOAD HISTORY
  // ---------------------------------------------------------

  const fetchHistory = useCallback(async () => {
    try {
      const res = await wellnessService.getGritGardenHistory();

      if (res?.success) {
        setHistory(res.history || res.data || []);
      }
    } catch (err) {
      console.warn('Grit Garden history could not be loaded.', err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      try {
        const res = await wellnessService.getGritGardenHistory();

        if (!isMounted) {
          return;
        }

        if (res?.success) {
          setHistory(res.history || res.data || []);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Grit Garden history could not be loaded.', err);
        }
      }
    };

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [fetchHistory]);

  // ---------------------------------------------------------
  // SUBMIT REFLECTION
  // ---------------------------------------------------------

  const handleSubmit = async (event) => {
    event?.preventDefault();

    if (loading || isSubmitting) {
      return;
    }

    const text = journalText.trim() || exerciseResponse.trim();

    if (text.length < 15) {
      setError(
        'Please write at least a sentence or two to grow your Grit Garden.'
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await wellnessService.saveGritGardenEntry(
        exerciseType,
        journalText.trim(),
        exerciseResponse.trim()
      );

      if (
        !res?.success &&
        res?.status !== 200 &&
        !res?.aiFeedback
      ) {
        throw new Error(
          res?.message || 'Could not save your reflection.'
        );
      }

      const feedback =
        res?.aiFeedback ||
        res?.feedback ||
        res?.data?.aiFeedback ||
        res?.data?.feedback ||
        null;

      setAiFeedback(feedback);
      setSubmitted(true);

      // Refresh history after successful save.
      await fetchHistory();

      if (onProgress) {
        await onProgress(100, 3);
      }
    } catch (err) {
      console.error('Grit Garden submission error:', err);

      setError(
        err.response?.data?.message ||
          err.message ||
          'Could not save your reflection. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // COMPLETE MODULE / CLAIM XP
  // ---------------------------------------------------------

  const handleClaimXP = async () => {
    if (loading || isSubmitting || !submitted) {
      return;
    }

    try {
      setError(null);

      if (onProgress) {
        await onProgress(100, 3);
      }

      if (onComplete) {
        await onComplete(
          100,
          `Completed ${exerciseType.replace(
            '_',
            ' '
          )} entry in your Grit Garden.`
        );
      }
    } catch (err) {
      console.error('Grit Garden completion error:', err);

      setError(
        err.response?.data?.message ||
          err.message ||
          'Could not complete the Grit Garden module. Please try again.'
      );
    }
  };

  // ---------------------------------------------------------
  // START ANOTHER REFLECTION
  // ---------------------------------------------------------

  const handleNewReflection = () => {
    if (loading || isSubmitting) {
      return;
    }

    setSubmitted(false);
    setJournalText('');
    setExerciseResponse('');
    setAiFeedback(null);
    setError(null);
  };

  // ---------------------------------------------------------
  // EXERCISE CHANGE
  // ---------------------------------------------------------

  const handleExerciseChange = (value) => {
    if (submitted || loading || isSubmitting) {
      return;
    }

    setExerciseType(value);
    setJournalText('');
    setExerciseResponse('');
    setAiFeedback(null);
    setError(null);
  };

  // ---------------------------------------------------------
  // PROGRESS HANDLER
  // ---------------------------------------------------------

  const handleTextChange = (value) => {
    setJournalText(value);

    if (!onProgress) {
      return;
    }

    const length = value.trim().length;
    const progress = Math.min(
      80,
      Math.round((length / 200) * 80)
    );

    onProgress(progress, 3);
  };

  const wordCount = (`${journalText} ${exerciseResponse}`)
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const isBusy = loading || isSubmitting;

  // ---------------------------------------------------------
  // UI RENDER
  // ---------------------------------------------------------

  return (
    <div className="space-y-6 text-left select-none">
      {/* ERROR */}
      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
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

      {/* EXERCISE TYPE SELECTOR */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {EXERCISE_TYPES.map((exercise) => (
          <button
            key={exercise.value}
            type="button"
            disabled={submitted || isBusy}
            onClick={() => handleExerciseChange(exercise.value)}
            className={`rounded-2xl border-2 px-3 py-2.5 text-left text-xs font-bold transition ${
              exerciseType === exercise.value
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/50'
            } disabled:cursor-default disabled:opacity-60`}
          >
            {exercise.label}
          </button>
        ))}
      </div>

      {/* WRITING AREA */}
      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
              Today's Prompt:
            </div>
            <p className="text-sm leading-relaxed text-slate-700">
              {selectedExercise.prompt}
            </p>
          </div>

          <textarea
            rows={7}
            disabled={isBusy}
            value={journalText}
            onChange={(event) => handleTextChange(event.target.value)}
            placeholder={selectedExercise.placeholder}
            className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100"
          />

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400">
              {wordCount} words
            </span>

            <button
              type="submit"
              disabled={isBusy || wordCount < 3}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  🌱 AI Analyzing & Saving...
                </>
              ) : (
                '🌱 Save & Get AI Feedback'
              )}
            </button>
          </div>
        </form>
      ) : (
        /* SUBMITTED / FEEDBACK */
        <div className="space-y-4">
          <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <div className="text-5xl">🌿</div>
            <div>
              <h3 className="text-base font-black text-emerald-800">
                Reflection Planted in Your Grit Garden!
              </h3>
              <p className="mt-1 text-xs text-emerald-700">
                Your words are your seeds. Keep growing.
              </p>
            </div>

            {aiFeedback && (
              <div className="space-y-2 rounded-2xl border border-emerald-200 bg-white p-4 text-left shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
                  <span>🤖 AI Mental Coach Feedback:</span>
                </div>
                <p className="whitespace-pre-line text-xs italic leading-relaxed text-slate-700">
                  {aiFeedback}
                </p>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                type="button"
                disabled={isBusy}
                onClick={handleNewReflection}
                className="cursor-pointer rounded-xl border border-emerald-300 bg-white px-4 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add Another Reflection
              </button>

              <button
                type="button"
                onClick={handleClaimXP}
                disabled={isBusy}
                className="cursor-pointer rounded-xl bg-emerald-700 px-6 py-2 text-xs font-bold text-white shadow-md transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Processing Reward...' : '✓ Complete & Claim XP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY */}
      {history.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Your Garden Entries
          </h3>

          <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {history.map((item, index) => (
              <div
                key={item.id || index}
                className="space-y-1 rounded-2xl border border-slate-200 bg-white p-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold capitalize text-emerald-700">
                    {item.exercise_type?.replace(/_/g, ' ') || exerciseType}
                  </span>

                  {(item.createdAt || item.created_at) && (
                    <span className="text-[9px] text-slate-400">
                      {new Date(
                        item.createdAt || item.created_at
                      ).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <p className="line-clamp-2 text-slate-600">
                  {item.journal_text ||
                    item.exercise_response ||
                    item.entry}
                </p>

                {item.ai_feedback && (
                  <p className="mt-1 border-l-2 border-emerald-300 pl-2 text-[10px] italic text-emerald-700">
                    🤖 {item.ai_feedback}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};