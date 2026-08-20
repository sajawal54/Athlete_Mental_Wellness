import { useState, useEffect, useCallback } from 'react';
import { wellnessService } from '../../../services/wellnessServices/wellnessService';

const CATEGORIES = [
  { id: 'all', label: 'All Resources' },
  { id: 'career', label: 'Career Exploration' },
  { id: 'financial', label: 'Financial Management' },
  { id: 'life_after_sport', label: 'Identity & Transition' },
];

export const TransitionSupportActivity = ({ onProgress, onComplete, isSubmitting }) => {
  const [resources, setResources] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedResource, setSelectedResource] = useState(null);
  const [viewedIds, setViewedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchResources = useCallback(async () => {
    try {
      const cat = selectedCategory === 'all' ? null : selectedCategory;
      const res = await wellnessService.getTransitionResources(cat);

      if (res?.success) {
        setResources(res.resources || []);

        if (res.resources?.length > 0) {
          setSelectedResource(res.resources[0]);
        } else {
          setSelectedResource(null);
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to load transition resources.'
      );
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    let isMounted = true;

    const loadResources = async () => {
      setLoading(true);
      setError(null);

      if (!isMounted) return;

      await fetchResources();
    };

    loadResources();

    return () => {
      isMounted = false;
    };
  }, [fetchResources]);

  const handleSelectResource = async (res) => {
    setSelectedResource(res);

    try {
      await wellnessService.markTransitionResourceViewed(res.id);

      setViewedIds((prev) => new Set(prev).add(res.id));

      if (onProgress) {
        onProgress(100, 3);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFinish = () => {
    if (onComplete) {
      onComplete(
        100,
        'Explored life transition and career support playbooks.'
      );
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* CATEGORIES */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-slate-500 font-semibold text-sm">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
            Loading transition guides...
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          {/* RESOURCE LIST */}
          <div className="space-y-2 max-h-115 overflow-y-auto pr-1">
            {resources.map((item) => {
              const isSelected = selectedResource?.id === item.id;
              const isViewed =
                viewedIds.has(item.id) || item.is_viewed;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectResource(item)}
                  className={`w-full text-left rounded-2xl p-4 transition border flex flex-col gap-1.5 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                      {item.category?.replace(/_/g, ' ')}
                    </span>

                    {isViewed && (
                      <span className="text-[10px] font-extrabold text-emerald-600">
                        ✓ Read
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-slate-800 line-clamp-2">
                    {item.title}
                  </h4>
                </button>
              );
            })}
          </div>

          {/* DETAIL ARTICLE VIEWER */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
            {selectedResource ? (
              <>
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                    {selectedResource.resource_type?.toUpperCase()}
                  </span>

                  <h3 className="text-xl font-extrabold text-slate-800 mt-1">
                    {selectedResource.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1">
                    {selectedResource.description}
                  </p>
                </div>

                <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-line text-sm">
                  {selectedResource.content}
                </div>

                <div className="border-t border-slate-100 pt-4 flex justify-end">
                  <button
                    onClick={handleFinish}
                    disabled={isSubmitting}
                    className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 transition"
                  >
                    ✓ Finish Reading & Claim XP
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <div className="text-4xl mb-2">🎓</div>
                <p className="text-sm">Select a guide to view.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};