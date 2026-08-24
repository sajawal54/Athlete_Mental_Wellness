import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { wellnessService } from '../../../services/wellnessServices/wellnessService';

export const SelfTalkDetectiveActivity = ({
  onProgress,
  onComplete,
  isSubmitting = false,
}) => {
  const [negativeThought, setNegativeThought] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFinished, setIsFinished] = useState(false);

  const onProgressRef = useRef(onProgress);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const handleAnalyze = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();

    const trimmedThought = negativeThought.trim();

    if (!trimmedThought || loading) return;

    setLoading(true);
    setError(null);

    try {
      let res;

      if (typeof wellnessService.getAIResponse === 'function') {
        res = await wellnessService.getAIResponse(
          'self_talk_detective',
          trimmedThought
        );
      } else if (typeof wellnessService.analyzeSelfTalk === 'function') {
        res = await wellnessService.analyzeSelfTalk(trimmedThought);
      } else {
        throw new Error('AI Service Method not found.');
      }

      const rawData = res?.data || res?.result || res;
      let parsedResult = {};

      if (typeof rawData === 'string') {
        try {
          if (rawData.trim().startsWith('{')) {
            parsedResult = JSON.parse(rawData);
          } else {
            parsedResult = { analysis: rawData };
          }
        } catch {
          parsedResult = { analysis: rawData };
        }
      } else if (typeof rawData === 'object' && rawData !== null) {
        parsedResult = rawData;
      }

      const finalAnalysis = {
        distortion:
          parsedResult.distortion ||
          parsedResult.category ||
          parsedResult.pattern ||
          'Self-Talk Pattern Identified',

        analysis:
          parsedResult.analysis ||
          parsedResult.details ||
          parsedResult.explanation ||
          (typeof rawData === 'string'
            ? rawData
            : 'Analysis generated.'),

        reframed_thought:
          parsedResult.reframed_thought ||
          parsedResult.improvement ||
          parsedResult.reframe ||
          parsedResult.positive_reframe ||
          null,
      };

      setAnalysisResult(finalAnalysis);

      if (onProgressRef.current) {
        onProgressRef.current(80, 1);
      }
    } catch (err) {
      console.error('Analysis error:', err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          'AI Response load nahi ho paya. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClaimAndFinish = async () => {
    if (isFinished || isSubmitting || !analysisResult) return;

    setIsFinished(true);

    try {
      if (onProgressRef.current) {
        await onProgressRef.current(100, 1);
      }

      if (onCompleteRef.current) {
        await onCompleteRef.current(
          100,
          `Analyzed thought: "${negativeThought.substring(0, 30)}${
            negativeThought.length > 30 ? '...' : ''
          }"`
        );
      }
    } catch (err) {
      console.error('Self-Talk completion error:', err);
      setIsFinished(false);
    }
  };

  const handleReset = () => {
    if (loading || isSubmitting) return;

    setNegativeThought('');
    setAnalysisResult(null);
    setError(null);
    setIsFinished(false);
  };

  return (
    <div className="mx-auto max-w-md space-y-6 text-slate-800">
      <div className="space-y-1 text-center">
        <h3 className="text-lg font-black text-slate-800">
          🕵️‍♂️ Self-Talk Detective
        </h3>

        <p className="text-xs text-slate-500">
          Identify cognitive distortions, reframe negative thoughts, and
          improve self-talk.
        </p>
      </div>

      <div className="space-y-4">
        {!analysisResult ? (
          <form onSubmit={handleAnalyze} className="space-y-3">
            <div className="text-left">
              <label className="mb-1 block text-xs font-bold text-slate-600">
                What unhelpful or negative thought are you having?
              </label>

              <textarea
                value={negativeThought}
                onChange={(e) => setNegativeThought(e.target.value)}
                placeholder="e.g., 'I failed this play, so I'm a terrible athlete.'"
                rows={3}
                className="w-full rounded-2xl border border-slate-200 p-3 text-xs transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50 p-3 text-left text-xs font-semibold text-rose-500">
                <span>⚠️ {error}</span>

                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="ml-2 cursor-pointer font-bold text-rose-400 hover:text-rose-600"
                >
                  ✕
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || isSubmitting || !negativeThought.trim()}
              className="w-full cursor-pointer rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? '⏳ Groq AI Analyzing Thought...'
                : '🔍 Analyze Self-Talk'}
            </button>
          </form>
        ) : (
          <div className="space-y-4 rounded-3xl border border-indigo-100 bg-indigo-50/50 p-5 text-left shadow-sm">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                Detective Report
              </span>

              <span className="text-lg">🔎</span>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase text-slate-400">
                Target Thought
              </div>

              <p className="rounded-xl border border-indigo-50 bg-white p-2.5 text-xs italic text-slate-700">
                "{negativeThought}"
              </p>
            </div>

            {analysisResult.distortion && (
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  Detected Pattern
                </div>

                <div className="inline-block rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                  {analysisResult.distortion}
                </div>
              </div>
            )}

            {analysisResult.analysis && (
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  AI Analysis
                </div>

                <div className="prose prose-xs max-w-none rounded-xl border border-indigo-50 bg-white p-3 text-slate-700 prose-headings:font-bold prose-ul:list-disc prose-ul:pl-4">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {analysisResult.analysis}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {analysisResult.reframed_thought && (
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase text-emerald-600">
                  Empowered Reframe
                </div>

                <div className="prose prose-xs max-w-none rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-900">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {analysisResult.reframed_thought}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleClaimAndFinish}
                disabled={isSubmitting || isFinished}
                className="w-full cursor-pointer rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isFinished
                  ? '✓ Completed'
                  : '✓ Accept Reframe & Complete'}
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={loading || isSubmitting}
                className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Investigate Another Thought
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};