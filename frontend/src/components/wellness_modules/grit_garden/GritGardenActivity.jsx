import { useState, useCallback, useEffect } from 'react';
import { wellnessService } from '../../../services/wellnessServices/wellnessService';

const EXERCISE_TYPES = [
  {
    value: 'reflection',
    label: '🌱 Resilience Reflection',
    prompt: 'Describe a moment when you overcame adversity. What strength or skill did you discover in yourself that you want to carry forward?',
    placeholder: 'When I faced my worst match result, what I discovered about myself was...',
  },
  {
    value: 'stress_release',
    label: '💨 Stress Release',
    prompt: 'Write freely about current pressures in your athletic journey. Let it all out without self-judgment.',
    placeholder: 'Right now the biggest pressure I feel is...',
  },
  {
    value: 'gratitude',
    label: '🌟 Gratitude Garden',
    prompt: 'List 3 things — big or small — that your athletic journey has given you that you are genuinely grateful for right now.',
    placeholder: '1. I am grateful for... 2. I appreciate... 3. What I rarely thank myself for is...',
  },
];

export const GritGardenActivity = ({ onProgress, onComplete, isSubmitting }) => {
  const [exerciseType, setExerciseType] = useState('reflection');
  const [journalText, setJournalText] = useState('');
  const [exerciseResponse, setExerciseResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  const selectedExercise = EXERCISE_TYPES.find((e) => e.value === exerciseType) || EXERCISE_TYPES[0];

  const fetchHistory = useCallback(async () => {
    try {
      const res = await wellnessService.getGritGardenHistory();
      if (res?.success) setHistory(res.history || res.data || []);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const text = journalText.trim() || exerciseResponse.trim();
    if (text.length < 15) {
      setError('Please write at least a sentence or two to grow your Grit Garden.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Backend API call: Backend Python script 'grit_garden' prompt run karega
      const res = await wellnessService.saveGritGardenEntry(exerciseType, journalText, exerciseResponse);

      if (res?.success || res?.status === 200 || res?.aiFeedback) {
        setSubmitted(true);
        // AI Feedback from backend
        setAiFeedback(res?.aiFeedback || res?.feedback || res?.data?.aiFeedback || null);
        fetchHistory();
        if (onProgress) onProgress(100, 3);
      } else {
        throw new Error(res?.message || 'Could not save your reflection.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not save your reflection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimXP = () => {
    if (onComplete) onComplete(100, `Completed ${exerciseType} entry in your Grit Garden.`);
  };

  const wordCount = (journalText + exerciseResponse).trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-6 text-left">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 flex justify-between items-center">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 font-bold">✕</button>
        </div>
      )}

      {/* EXERCISE TYPE SELECTOR */}
      <div className="grid gap-2 grid-cols-1 sm:grid-cols-3">
        {EXERCISE_TYPES.map((ex) => (
          <button
            key={ex.value}
            disabled={submitted}
            onClick={() => {
              setExerciseType(ex.value);
              setJournalText('');
              setExerciseResponse('');
              setAiFeedback(null);
            }}
            className={`rounded-2xl border-2 px-3 py-2.5 text-left text-xs font-bold transition ${
              exerciseType === ex.value
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/50'
            } disabled:cursor-default`}
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* WRITING AREA */}
      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
            <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">Today's Prompt:</div>
            <p className="text-sm text-slate-700 leading-relaxed">{selectedExercise.prompt}</p>
          </div>

          <textarea
            rows={7}
            value={journalText}
            onChange={(e) => {
              setJournalText(e.target.value);
              if (onProgress) onProgress(Math.min(80, Math.round((e.target.value.length / 200) * 80)), 3);
            }}
            placeholder={selectedExercise.placeholder}
            className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
          />

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400">{wordCount} words</span>
            <button
              type="submit"
              disabled={loading || wordCount < 3}
              className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 transition flex items-center gap-2"
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
        /* SUBMITTED & BACKEND AI FEEDBACK CARD */
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center space-y-4">
            <div className="text-5xl">🌿</div>
            <div>
              <h3 className="text-base font-black text-emerald-800">Reflection Planted in Your Grit Garden!</h3>
              <p className="mt-1 text-xs text-emerald-700">Your words are your seeds. Keep growing.</p>
            </div>

            {/* BACKEND AI FEEDBACK DISPLAY */}
            {aiFeedback && (
              <div className="rounded-2xl bg-white p-4 text-left border border-emerald-200 space-y-2 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
                  <span>🤖 AI Mental Coach Feedback:</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed italic whitespace-pre-line">
                  {aiFeedback}
                </p>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setJournalText('');
                  setExerciseResponse('');
                  setAiFeedback(null);
                }}
                className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 transition"
              >
                Add Another Reflection
              </button>
              <button
                onClick={handleClaimXP}
                disabled={isSubmitting}
                className="rounded-xl bg-emerald-700 px-6 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-800 disabled:opacity-50 transition"
              >
                ✓ Claim My XP Reward
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY */}
      {history.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Your Garden Entries</h3>
          <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {history.map((item, idx) => (
              <div key={item.id || idx} className="rounded-2xl border border-slate-200 bg-white p-3 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 capitalize">
                    {item.exercise_type?.replace('_', ' ') || exerciseType}
                  </span>
                  {item.createdAt && (
                    <span className="text-[9px] text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-slate-600 line-clamp-2">{item.journal_text || item.exercise_response || item.entry}</p>
                {item.ai_feedback && (
                  <p className="text-[10px] text-emerald-700 italic border-l-2 border-emerald-300 pl-2 mt-1">
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