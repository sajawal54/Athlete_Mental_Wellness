import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { wellnessService } from '../../../services/wellnessServices/wellnessService';

export const SelfTalkDetectiveActivity = ({ onProgress, onComplete, isSubmitting }) => {
  const [negativeThought, setNegativeThought] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFinished, setIsFinished] = useState(false);

  const handleAnalyze = async (e) => {
    e?.preventDefault();
    e?.stopPropagation();

    const trimmedThought = negativeThought.trim();
    if (!trimmedThought) return;

    setLoading(true);
    setError(null);

    try {
      let res;

      // Step 1: Try primary Groq endpoint, then fallback to service call
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

      // Extract response safely
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

      // Report progress to parent without triggering page redirect
      if (onProgress) onProgress(80, 1);
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

  const handleClaimAndFinish = () => {
    setIsFinished(true);

    if (onProgress) onProgress(100, 1);

    if (onComplete) {
      onComplete(
        100,
        `Analyzed thought: "${negativeThought.substring(0, 30)}..."`
      );
    }
  };

  const handleReset = () => {
    setNegativeThought('');
    setAnalysisResult(null);
    setError(null);
    setIsFinished(false);
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header */}
      <div className="max-w-md mx-auto space-y-1 text-center">
        <h3 className="text-lg font-black text-slate-800">
          🕵️‍♂️ Self-Talk Detective
        </h3>

        <p className="text-xs text-slate-500">
          Identify cognitive distortions, reframe negative thoughts, and improve self-talk.
        </p>
      </div>

      {/* ANALYZE THOUGHT CONTENT */}
      <div className="max-w-md mx-auto space-y-4">
        {!analysisResult ? (
          <form onSubmit={handleAnalyze} className="space-y-3">
            <div className="text-left">
              <label className="block text-xs font-bold text-slate-600 mb-1">
                What unhelpful or negative thought are you having?
              </label>

              <textarea
                value={negativeThought}
                onChange={(e) => setNegativeThought(e.target.value)}
                placeholder="e.g., 'I failed this play, so I'm a terrible athlete.'"
                rows={3}
                className="w-full rounded-2xl border border-slate-200 p-3 text-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="text-xs text-rose-500 font-semibold text-left p-3 rounded-xl bg-rose-50 border border-rose-100 flex justify-between items-center">
                <span>⚠️ {error}</span>

                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-rose-400 font-bold ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || isSubmitting || !negativeThought.trim()}
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              {loading
                ? '⏳ Groq AI Analyzing Thought...'
                : '🔍 Analyze Self-Talk'}
            </button>
          </form>
        ) : (
          /* ANALYSIS RESULT VIEW */
          <div className="rounded-3xl border border-indigo-100 bg-indigo-50/50 p-5 space-y-4 text-left shadow-sm">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                Detective Report
              </span>

              <span className="text-lg">🔎</span>
            </div>

            {/* Target Thought */}
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">
                Target Thought
              </div>

              <p className="text-xs italic text-slate-700 bg-white p-2.5 rounded-xl border border-indigo-50">
                "{negativeThought}"
              </p>
            </div>

            {/* Distortion Badge */}
            {analysisResult.distortion && (
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  Detected Pattern
                </div>

                <div className="inline-block rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                  {analysisResult.distortion}
                </div>
              </div>
            )}

            {/* AI Analysis Content */}
            {analysisResult.analysis && (
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  AI Analysis
                </div>

                <div className="bg-white p-3 rounded-xl border border-indigo-50 prose prose-xs max-w-none text-slate-700 prose-headings:font-bold prose-ul:list-disc prose-ul:pl-4">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {analysisResult.analysis}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Empowered Reframe */}
            {analysisResult.reframed_thought && (
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-emerald-600">
                  Empowered Reframe
                </div>

                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-900 prose prose-xs max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {analysisResult.reframed_thought}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleClaimAndFinish}
                disabled={isSubmitting || isFinished}
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {isFinished
                  ? '✓ Completed'
                  : '✓ Accept Reframe & Complete'}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
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