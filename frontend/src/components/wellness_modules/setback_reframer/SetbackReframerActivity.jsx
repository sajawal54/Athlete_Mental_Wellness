import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { wellnessService } from '../../../services/wellnessServices/wellnessService';

const CATEGORIES = [
  { value: 'performance', label: '🏆 Competition Performance' },
  { value: 'injury', label: '🩹 Injury & Recovery' },
  { value: 'team', label: '🤝 Team / Coaching Dynamics' },
  { value: 'training', label: '💪 Training & Burnout' },
];

export const SetbackReframerActivity = ({
  onProgress,
  onComplete,
  isSubmitting = false,
}) => {
  const [thought, setThought] = useState('');
  const [category, setCategory] = useState('performance');
  const [reframeResult, setReframeResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDone, setIsDone] = useState(false);

  const onProgressRef = useRef(onProgress);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const handleGenerate = async (e) => {
    e?.preventDefault();

    const trimmed = thought.trim();

    if (!trimmed || loading) {
      setError('Please describe a setback or negative thought.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const categoryLabel =
        CATEGORIES.find((c) => c.value === category)?.label || category;

      const extraContext = `
Category: ${categoryLabel}

LANGUAGE REQUIREMENT:
Respond strictly in English only.

Do not use:
- Urdu
- Roman Urdu
- Hindi
- Roman Hindi
- Any other language
- Mixed-language responses

The entire response must be written in clear, natural English.

RESPONSE STYLE:
- Be supportive and constructive.
- Use an athlete-focused psychological perspective.
- Help the athlete reframe the setback in a realistic and positive way.
- Avoid unrealistic motivational statements.
- Give practical and actionable advice.
- Keep the tone professional, empathetic, and encouraging.
`;

      const res = await wellnessService.getAIResponse(
        'setback_reframer',
        trimmed,
        extraContext
      );

      if (res?.success) {
        const aiText = res.data;
        let parsedData = {};

        try {
          if (
            typeof aiText === 'string' &&
            aiText.trim().startsWith('{')
          ) {
            parsedData = JSON.parse(aiText);
          } else if (
            typeof aiText === 'object' &&
            aiText !== null
          ) {
            parsedData = aiText;
          } else {
            parsedData = {
              reframe: aiText,
            };
          }
        } catch {
          parsedData = {
            reframe: aiText,
          };
        }

        const finalResult = {
          reframe:
            parsedData.reframe ||
            parsedData.positive_reframe ||
            aiText,

          action_step:
            parsedData.action_step ||
            parsedData.action ||
            null,

          safety_message: parsedData.safety_message || null,
        };

        setReframeResult(finalResult);

        if (onProgressRef.current) {
          onProgressRef.current(100, 3);
        }
      } else {
        throw new Error(
          res?.error || 'Failed to generate reframe.'
        );
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Reframe generation failed. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClaimXP = async () => {
    if (isDone || isSubmitting || !reframeResult) return;

    setIsDone(true);

    try {
      if (onProgressRef.current) {
        await onProgressRef.current(100, 3);
      }

      if (onCompleteRef.current) {
        await onCompleteRef.current(
          100,
          reframeResult?.reframe || 'Completed setback reframe.'
        );
      }
    } catch (err) {
      console.error('Setback Reframer completion error:', err);
      setIsDone(false);
    }
  };

  const handleTryAnother = () => {
    if (loading || isSubmitting) return;

    setReframeResult(null);
    setThought('');
    setError(null);
    setIsDone(false);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-start justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          <span>⚠️ {error}</span>

          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-2 cursor-pointer font-bold text-rose-500 hover:text-rose-700"
          >
            ✕
          </button>
        </div>
      )}

      {!isDone && (
        <form
          onSubmit={handleGenerate}
          className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Describe your setback or negative thought:
            </label>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-400 disabled:opacity-50"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <textarea
            rows={4}
            value={thought}
            onChange={(e) => setThought(e.target.value)}
            disabled={loading}
            placeholder="e.g. 'I made a critical mistake in the last play and I think everyone blames me. I feel like I always fail under pressure...'"
            className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={
                loading ||
                isSubmitting ||
                !thought.trim()
              }
              className="cursor-pointer rounded-2xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? '⏳ Groq AI Reframing...'
                : '✨ Generate Constructive Reframe'}
            </button>
          </div>
        </form>
      )}

      {reframeResult && !isDone && (
        <div className="space-y-4 rounded-2xl border border-indigo-200 bg-linear-to-br from-indigo-50 to-purple-50 p-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">
              ✓ Groq AI Cognitive Reframe
            </span>

            <h3 className="mt-1 text-lg font-black text-slate-800">
              Growth Perspective
            </h3>
          </div>

          <div className="prose prose-sm max-w-none text-slate-800 dark:prose-invert prose-headings:font-bold prose-headings:text-indigo-950 prose-table:border-collapse prose-th:border prose-th:border-slate-300 prose-th:bg-indigo-100/60 prose-th:p-2 prose-td:border prose-td:border-slate-300 prose-td:p-2 prose-ul:list-disc prose-ul:pl-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {reframeResult.reframe}
            </ReactMarkdown>
          </div>

          {reframeResult.action_step && (
            <div className="space-y-1 rounded-2xl border border-indigo-100 bg-white p-4">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700">
                🎯 Immediate Action Step
              </div>

              <p className="text-xs leading-relaxed text-slate-700">
                {reframeResult.action_step}
              </p>
            </div>
          )}

          {reframeResult.safety_message && (
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
              ℹ️ {reframeResult.safety_message}
            </div>
          )}

          <div className="flex flex-wrap justify-between gap-2 pt-2">
            <button
              type="button"
              disabled={loading || isSubmitting}
              onClick={handleTryAnother}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Try Another Thought
            </button>

            <button
              type="button"
              onClick={handleClaimXP}
              disabled={isSubmitting}
              className="cursor-pointer rounded-xl bg-emerald-600 px-6 py-2 text-xs font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ✓ Accept Reframe & Claim XP
            </button>
          </div>
        </div>
      )}
    </div>
  );
};