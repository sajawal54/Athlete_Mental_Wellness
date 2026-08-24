import { useState, useEffect, useCallback, useRef } from 'react';
import { wellnessService } from '../../../services/wellnessServices/wellnessService';

const CATEGORIES = [
  { id: 'all', label: 'All Resources' },
  { id: 'career', label: 'Career Exploration' },
  { id: 'financial', label: 'Financial Management' },
  { id: 'life_after_sport', label: 'Identity & Transition' },
];

export const TransitionSupportActivity = ({
  onProgress,
  onComplete,
  isSubmitting,
}) => {
  const [resources, setResources] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedResource, setSelectedResource] = useState(null);
  const [viewedIds, setViewedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Keep the latest callback without updating the ref during render.
  const onProgressRef = useRef(onProgress);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  const fetchResources = useCallback(async () => {
    try {
      const category =
        selectedCategory === 'all' ? null : selectedCategory;

      const response =
        await wellnessService.getTransitionResources(category);

      if (response?.success) {
        const fetchedResources = response.resources || [];

        setResources(fetchedResources);

        if (fetchedResources.length > 0) {
          setSelectedResource(fetchedResources[0]);
        } else {
          setSelectedResource(null);
        }
      } else {
        setResources([]);
        setSelectedResource(null);
      }
    } catch (err) {
      console.error(
        'Failed to load transition resources:',
        err
      );

      setError(
        err?.response?.data?.message ||
          'Failed to load transition resources.'
      );
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    let isMounted = true;

    const loadResources = async () => {
      if (!isMounted) return;

      setLoading(true);
      setError(null);

      await fetchResources();
    };

    loadResources();

    return () => {
      isMounted = false;
    };
  }, [fetchResources]);

  const handleSelectResource = async (resource) => {
    setSelectedResource(resource);

    try {
      await wellnessService.markTransitionResourceViewed(
        resource.id
      );

      setViewedIds((previous) => {
        const next = new Set(previous);
        next.add(resource.id);
        return next;
      });

      if (onProgressRef.current) {
        onProgressRef.current(100, 3);
      }
    } catch (err) {
      console.error(
        'Failed to mark transition resource as viewed:',
        err
      );
    }
  };

  const handleFinish = () => {
    if (isSubmitting) return;

    if (onComplete) {
      onComplete(
        100,
        'Explored life transition and career support playbooks.'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* ERROR */}
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

      {/* CATEGORIES */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() =>
              setSelectedCategory(category.id)
            }
            className={`cursor-pointer rounded-xl px-4 py-2 text-xs font-bold transition ${
              selectedCategory === category.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
            Loading transition guides...
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          {/* RESOURCE LIST */}
          <div className="max-h-115 space-y-2 overflow-y-auto pr-1">
            {resources.length > 0 ? (
              resources.map((item) => {
                const isSelected =
                  selectedResource?.id === item.id;

                const isViewed =
                  viewedIds.has(item.id) || item.is_viewed;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      handleSelectResource(item)
                    }
                    className={`flex w-full cursor-pointer flex-col gap-1.5 rounded-2xl border p-4 text-left transition ${
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

                    <h4 className="line-clamp-2 text-xs font-bold text-slate-800">
                      {item.title}
                    </h4>
                  </button>
                );
              })
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
                <div className="text-3xl">🎓</div>

                <p className="mt-2 text-xs font-semibold text-slate-500">
                  No transition resources found for this
                  category.
                </p>
              </div>
            )}
          </div>

          {/* DETAIL ARTICLE VIEWER */}
          <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
            {selectedResource ? (
              <>
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                    {selectedResource.resource_type?.toUpperCase()}
                  </span>

                  <h3 className="mt-1 text-xl font-extrabold text-slate-800">
                    {selectedResource.title}
                  </h3>

                  {selectedResource.description && (
                    <p className="mt-1 text-xs text-slate-500">
                      {selectedResource.description}
                    </p>
                  )}
                </div>

                <div className="prose prose-sm max-w-none whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {selectedResource.content}
                </div>

                <div className="flex justify-end border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={handleFinish}
                    disabled={isSubmitting}
                    className="cursor-pointer rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting
                      ? 'Submitting...'
                      : '✓ Finish Reading & Claim XP'}
                  </button>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <div className="mb-2 text-4xl">🎓</div>

                <p className="text-sm">
                  Select a guide to view.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};