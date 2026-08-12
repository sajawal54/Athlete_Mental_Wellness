import { useCallback, useEffect, useState } from "react";

import {
  SparklesIcon,
  HeartIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ClockIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

import {
  generateAffirmation,
  getAffirmationHistory,
  toggleFavorite,
  clearAffirmationHistory,
} from "../services/affirmationsService";

const ITEMS_PER_PAGE = 2;

const CATEGORIES = [
  {
    value: "confidence",
    label: "Confidence",
    description: "Build self-belief and inner confidence",
  },
  {
    value: "focus",
    label: "Focus",
    description: "Improve concentration and mental clarity",
  },
  {
    value: "motivation",
    label: "Motivation",
    description: "Stay driven and committed",
  },
  {
    value: "recovery",
    label: "Recovery",
    description: "Support patience and recovery",
  },
  {
    value: "stress",
    label: "Stress",
    description: "Stay calm under pressure",
  },
  {
    value: "performance",
    label: "Performance",
    description: "Prepare your mind for peak performance",
  },
];

export default function Affirmations() {
  const [selectedCategory, setSelectedCategory] = useState("confidence");
  const [currentAffirmation, setCurrentAffirmation] = useState(null);

  // Current backend page only
  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [clearLoading, setClearLoading] = useState(false);

  const [favoriteLoading, setFavoriteLoading] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Backend pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");

  // --------------------------------------------------
  // LOAD PAGINATED HISTORY
  // --------------------------------------------------

  const loadHistory = useCallback(async (pageNumber = 1) => {
    try {
      setHistoryLoading(true);
      setHistoryError("");

      const data = await getAffirmationHistory(pageNumber);

      /*
       * Expected Django REST Framework pagination response:
       *
       * {
       *   count: 7,
       *   next: "...?page=2",
       *   previous: null,
       *   results: [...]
       * }
       */

      if (Array.isArray(data)) {
        // Fallback in case backend returns a plain array
        setHistory(data);
        setPage(pageNumber);
        setTotalCount(data.length);
        setTotalPages(1);
        return;
      }

      const results = Array.isArray(data?.results)
        ? data.results
        : [];

      setHistory(results);
      setPage(pageNumber);

      const count =
        typeof data?.count === "number"
          ? data.count
          : results.length;

      setTotalCount(count);

      /*
       * DRF count / page size se total pages calculate
       */
      const calculatedPages = Math.max(
        1,
        Math.ceil(count / ITEMS_PER_PAGE),
      );

      setTotalPages(calculatedPages);
    } catch (err) {
      console.error(
        "Failed to load affirmation history:",
        err,
      );

      if (err?.response?.status === 401) {
        setHistoryError(
          "Your session has expired. Please login again.",
        );
      } else {
        setHistoryError(
          "Unable to load affirmation history. Please try again.",
        );
      }
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  /*
   * Initial history load.
   *
   * The eslint rule complains because loadHistory()
   * internally updates React state from inside an effect.
   *
   * The API call itself is still required when this
   * page is mounted, so we explicitly suppress this
   * single rule for this effect.
   */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory(1);
  }, [loadHistory]);

  // --------------------------------------------------
  // GENERATE AFFIRMATION
  // --------------------------------------------------

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await generateAffirmation(selectedCategory);

      setCurrentAffirmation(data);

      /*
       * New affirmation backend mein save ho chuki hai.
       *
       * Isliye current paginated history ko manually modify
       * nahi karenge.
       *
       * Page 1 dobara fetch karenge taake backend pagination
       * aur count properly update ho jaye.
       */
      await loadHistory(1);
    } catch (err) {
      console.error(
        "Failed to generate affirmation:",
        err,
      );

      if (err?.response?.status === 401) {
        setError(
          "Your session has expired. Please login again.",
        );
        return;
      }

      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          "Unable to generate affirmation. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // FAVORITE
  // --------------------------------------------------

  const handleFavorite = async (affirmation) => {
    if (
      !affirmation?.id ||
      favoriteLoading === affirmation.id
    ) {
      return;
    }

    const targetId = affirmation.id;
    const oldValue = Boolean(affirmation.is_favorite);
    const newValue = !oldValue;

    // Optimistic update
    setHistory((previous) =>
      previous.map((item) =>
        item.id === targetId
          ? {
              ...item,
              is_favorite: newValue,
            }
          : item,
      ),
    );

    if (currentAffirmation?.id === targetId) {
      setCurrentAffirmation((previous) =>
        previous
          ? {
              ...previous,
              is_favorite: newValue,
            }
          : null,
      );
    }

    try {
      setFavoriteLoading(targetId);

      const data = await toggleFavorite(targetId);

      const backendIsFavorite =
        data?.is_favorite ?? newValue;

      setHistory((previous) =>
        previous.map((item) =>
          item.id === targetId
            ? {
                ...item,
                is_favorite: backendIsFavorite,
              }
            : item,
        ),
      );

      if (currentAffirmation?.id === targetId) {
        setCurrentAffirmation((previous) =>
          previous
            ? {
                ...previous,
                is_favorite: backendIsFavorite,
              }
            : null,
        );
      }
    } catch (err) {
      console.error(
        "Failed to update favorite:",
        err,
      );

      // Rollback
      setHistory((previous) =>
        previous.map((item) =>
          item.id === targetId
            ? {
                ...item,
                is_favorite: oldValue,
              }
            : item,
        ),
      );

      if (currentAffirmation?.id === targetId) {
        setCurrentAffirmation((previous) =>
          previous
            ? {
                ...previous,
                is_favorite: oldValue,
              }
            : null,
        );
      }
    } finally {
      setFavoriteLoading(null);
    }
  };

  // --------------------------------------------------
  // COPY
  // --------------------------------------------------

  const handleCopy = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);

      setCopiedId(id);

      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (err) {
      console.error(
        "Failed to copy affirmation:",
        err,
      );
    }
  };

  // --------------------------------------------------
  // CLEAR ALL HISTORY
  // --------------------------------------------------

  const handleClearHistory = async () => {
    if (totalCount === 0 || clearLoading) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete all affirmation history? This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setClearLoading(true);
      setHistoryError("");

      await clearAffirmationHistory();

      setHistory([]);
      setPage(1);
      setTotalPages(1);
      setTotalCount(0);
      setCurrentAffirmation(null);
    } catch (err) {
      console.error(
        "Failed to clear affirmation history:",
        err,
      );

      setHistoryError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          "Unable to clear affirmation history. Please try again.",
      );
    } finally {
      setClearLoading(false);
    }
  };

  // --------------------------------------------------
  // PAGINATION
  // --------------------------------------------------

  const handlePreviousPage = () => {
    if (historyLoading || page <= 1) {
      return;
    }

    loadHistory(page - 1);
  };

  const handleNextPage = () => {
    if (
      historyLoading ||
      page >= totalPages
    ) {
      return;
    }

    loadHistory(page + 1);
  };

  const selectedCategoryData = CATEGORIES.find(
    (category) =>
      category.value === selectedCategory,
  );

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* HEADER */}
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-600/20">
              <SparklesIcon className="h-6 w-6 text-indigo-400" />
            </div>

            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                AI Affirmations
              </h1>

              <p className="mt-1 text-sm text-slate-400">
                Train your mind with personalized
                athlete-focused affirmations.
              </p>
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* GENERATOR */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl sm:p-7 lg:col-span-2">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                Generate
              </p>

              <h2 className="mt-2 text-xl font-bold">
                What do you need today?
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                Select a mental-performance category and
                generate a new affirmation.
              </p>
            </div>

            {/* CATEGORY SELECT */}
            <div className="relative">
              <label
                htmlFor="affirmation-category"
                className="mb-2 block text-sm font-semibold text-slate-300"
              >
                Affirmation Category
              </label>

              <div className="relative">
                <select
                  id="affirmation-category"
                  value={selectedCategory}
                  onChange={(event) =>
                    setSelectedCategory(
                      event.target.value,
                    )
                  }
                  className="w-full appearance-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3.5 pr-10 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {CATEGORIES.map((category) => (
                    <option
                      key={category.value}
                      value={category.value}
                    >
                      {category.label}
                    </option>
                  ))}
                </select>

                <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              </div>

              <p className="mt-2 text-xs text-slate-500">
                {selectedCategoryData?.description}
              </p>
            </div>

            {/* ERROR */}
            {error && (
              <div
                role="alert"
                className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              >
                {error}
              </div>
            )}

            {/* GENERATE BUTTON */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5" />
                  Generate Affirmation
                </>
              )}
            </button>

            {/* LOADING SKELETON */}
            {loading && (
              <div
                className="mt-6 animate-pulse rounded-3xl border border-slate-800 bg-slate-950 p-6"
                aria-label="Generating affirmation"
                aria-live="polite"
              >
                <div className="h-4 w-24 rounded bg-slate-800" />

                <div className="mt-5 space-y-3">
                  <div className="h-5 w-full rounded bg-slate-800" />
                  <div className="h-5 w-5/6 rounded bg-slate-800" />
                  <div className="h-5 w-2/3 rounded bg-slate-800" />
                </div>
              </div>
            )}

            {/* CURRENT AFFIRMATION */}
            {!loading && currentAffirmation && (
              <div className="mt-6 rounded-3xl border border-indigo-500/20 bg-linear-to-br from-indigo-500/10 via-slate-950 to-violet-500/10 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                      Your affirmation
                    </p>

                    <p className="mt-5 text-xl font-semibold leading-relaxed text-slate-100 sm:text-2xl">
                      {currentAffirmation.text}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleFavorite(
                        currentAffirmation,
                      )
                    }
                    disabled={
                      favoriteLoading ===
                      currentAffirmation.id
                    }
                    aria-label={
                      currentAffirmation.is_favorite
                        ? "Remove affirmation from favorites"
                        : "Add affirmation to favorites"
                    }
                    className="shrink-0 rounded-xl p-2.5 transition hover:bg-white/5 disabled:opacity-50"
                  >
                    <HeartIcon
                      className={`h-6 w-6 ${
                        currentAffirmation.is_favorite
                          ? "fill-red-500 text-red-500"
                          : "text-slate-400"
                      }`}
                    />
                  </button>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        currentAffirmation.text,
                        currentAffirmation.id,
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                  >
                    {copiedId ===
                    currentAffirmation.id ? (
                      <>
                        <CheckIcon className="h-4 w-4 text-emerald-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </button>

                  <span className="inline-flex items-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-2.5 text-xs font-semibold capitalize text-indigo-300">
                    {currentAffirmation.category ||
                      selectedCategory}
                  </span>
                </div>

                <div
                  className="sr-only"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {copiedId ===
                  currentAffirmation.id
                    ? "Affirmation copied to clipboard."
                    : ""}
                </div>
              </div>
            )}
          </section>

          {/* CATEGORY SIDEBAR */}
          <aside className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              Categories
            </p>

            <h2 className="mt-2 text-lg font-bold">
              Train different mental skills
            </h2>

            <div className="mt-5 space-y-2">
              {CATEGORIES.map((category) => {
                const active =
                  selectedCategory ===
                  category.value;

                return (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() =>
                      setSelectedCategory(
                        category.value,
                      )
                    }
                    className={`w-full rounded-2xl border p-3 text-left transition ${
                      active
                        ? "border-indigo-500/40 bg-indigo-500/10"
                        : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                    }`}
                  >
                    <p
                      className={`text-sm font-bold ${
                        active
                          ? "text-indigo-300"
                          : "text-slate-200"
                      }`}
                    >
                      {category.label}
                    </p>

                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      {category.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>
        </div>

        {/* HISTORY */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-7">
          {/* HISTORY HEADER */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                History
              </p>

              <h2 className="mt-2 text-xl font-bold">
                Your previous affirmations
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Showing {ITEMS_PER_PAGE} affirmations
                per page
                {totalCount > 0 &&
                  ` • ${totalCount} total`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ClockIcon className="h-4 w-4" />
                Recently generated
              </div>

              {totalCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  disabled={clearLoading}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {clearLoading ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    <>
                      <TrashIcon className="h-4 w-4" />
                      Clear History
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* HISTORY ERROR */}
          {historyError && (
            <div
              role="alert"
              className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {historyError}
            </div>
          )}

          {/* HISTORY LOADING */}
          {historyLoading && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-2xl border border-slate-800 bg-slate-950 p-5"
                >
                  <div className="h-4 w-24 rounded bg-slate-800" />

                  <div className="mt-4 h-4 w-full rounded bg-slate-800" />

                  <div className="mt-2 h-4 w-5/6 rounded bg-slate-800" />

                  <div className="mt-5 h-8 w-20 rounded bg-slate-800" />
                </div>
              ))}
            </div>
          )}

          {/* EMPTY */}
          {!historyLoading &&
            history.length === 0 &&
            !historyError && (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/50 px-6 py-12 text-center">
                <SparklesIcon className="mx-auto h-10 w-10 text-slate-700" />

                <h3 className="mt-4 text-sm font-bold text-slate-300">
                  No affirmations yet
                </h3>

                <p className="mt-2 text-xs text-slate-500">
                  Generate your first affirmation
                  above.
                </p>
              </div>
            )}

          {/* HISTORY LIST */}
          {!historyLoading &&
            history.length > 0 && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {history.map((affirmation) => (
                  <article
                    key={affirmation.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 transition hover:border-slate-700"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm font-medium leading-7 text-slate-200">
                        {affirmation.text}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          handleFavorite(
                            affirmation,
                          )
                        }
                        disabled={
                          favoriteLoading ===
                          affirmation.id
                        }
                        aria-label={
                          affirmation.is_favorite
                            ? "Remove from favorites"
                            : "Add to favorites"
                        }
                        className="shrink-0 rounded-xl p-2 hover:bg-slate-900 disabled:opacity-50"
                      >
                        <HeartIcon
                          className={`h-5 w-5 ${
                            affirmation.is_favorite
                              ? "fill-red-500 text-red-500"
                              : "text-slate-500"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {affirmation.category && (
                          <span className="rounded-lg bg-indigo-500/10 px-2.5 py-1 text-[10px] font-bold capitalize text-indigo-300">
                            {affirmation.category}
                          </span>
                        )}

                        {affirmation.created_at && (
                          <span className="text-[10px] text-slate-600">
                            {new Date(
                              affirmation.created_at,
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            affirmation.text,
                            affirmation.id,
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold text-slate-500 transition hover:bg-slate-900 hover:text-white"
                      >
                        {copiedId ===
                        affirmation.id ? (
                          <>
                            <CheckIcon className="h-3.5 w-3.5 text-emerald-400" />
                            Copied
                          </>
                        ) : (
                          <>
                            <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

          {/* PAGINATION */}
          {!historyLoading &&
            history.length > 0 &&
            totalPages > 1 && (
              <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-5 sm:flex-row">
                <p className="text-xs text-slate-500">
                  Page {page} of {totalPages}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePreviousPage}
                    disabled={
                      page <= 1 ||
                      historyLoading
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:border-indigo-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Previous
                  </button>

                  <div className="flex h-9 min-w-9 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 text-xs font-bold text-indigo-300">
                    {page}
                  </div>

                  <button
                    type="button"
                    onClick={handleNextPage}
                    disabled={
                      page >= totalPages ||
                      historyLoading
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:border-indigo-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
        </section>
      </div>
    </div>
  );
}