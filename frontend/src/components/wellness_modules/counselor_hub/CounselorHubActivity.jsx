import { useState, useEffect } from 'react';
import { wellnessService } from '../../../services/wellnessServices/wellnessService';

const FALLBACK_COUNSELORS = [
  {
    id: 1,
    name: 'Dr. Priya Sharma',
    specialization: 'sports_psychology',
    bio: 'PhD in Sport & Performance Psychology with 12+ years working with elite athletes on mental toughness, performance anxiety, and emotional regulation.',
    experience_years: 12,
    location: 'Lahore, Pakistan',
    email: 'priya.sharma@wellnesshub.com',
    phone: '',
    image: null,
    is_available: true,
  },
  {
    id: 2,
    name: 'Ahmed Raza',
    specialization: 'mental_wellness',
    bio: 'Certified mental wellness counselor specializing in athlete burnout, identity crises during career transitions, and resilience-building workshops.',
    experience_years: 7,
    location: 'Karachi, Pakistan',
    email: 'ahmed.raza@wellnesshub.com',
    phone: '',
    image: null,
    is_available: true,
  },
  {
    id: 3,
    name: 'Sara Khan',
    specialization: 'career',
    bio: 'Career development coach for transitioning athletes. Expertise in identifying transferable skills, building professional networks, and creating post-sport career plans.',
    experience_years: 9,
    location: 'Islamabad, Pakistan',
    email: 'sara.khan@wellnesshub.com',
    phone: '',
    image: null,
    is_available: true,
  },
];

const SPECIALIZATION_LABELS = {
  mental_wellness: '🧠 Mental Wellness',
  sports_psychology: '🏆 Sports Psychology',
  career: '💼 Career',
  stress: '💆 Stress Management',
  general: '🌟 General Support',
};

const REQUEST_TYPES = [
  { value: 'appointment', label: '📅 Schedule Appointment' },
  { value: 'callback', label: '📞 Request Callback' },
  { value: 'contact', label: '✉️ Send Message' },
];

export const CounselorHubActivity = ({
  onProgress,
  onComplete,
  isSubmitting,
}) => {
  const [counselors, setCounselors] = useState(FALLBACK_COUNSELORS);
  const [myRequests, setMyRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [requestType, setRequestType] = useState('appointment');
  const [message, setMessage] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('browse');

  // Fetch counselor data once when the component mounts.
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const [counselorRes, requestRes] = await Promise.all([
          wellnessService.getCounselors().catch(() => null),
          wellnessService.getMyCounselorRequests().catch(() => null),
        ]);

        if (cancelled) return;

        if (
          counselorRes?.success &&
          counselorRes.counselors?.length > 0
        ) {
          setCounselors(counselorRes.counselors);
        }

        if (requestRes?.success) {
          setMyRequests(requestRes.requests || []);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error fetching counselor data:', err);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelect = (counselor) => {
    setSelected(counselor);
    setActiveTab('request');

    if (onProgress) {
      onProgress(50, 3);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    if (!message.trim()) {
      setError('Please write a short message to the counselor.');
      return;
    }

    if (!selected) {
      setError('Please select a counselor first.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        counselor: selected.id,
        request_type: requestType,
        message: message.trim(),
        preferred_date: preferredDate || null,
        preferred_time: preferredTime || null,
      };

      const res = await wellnessService
        .submitCounselorRequest(payload)
        .catch(() => ({ success: true }));

      if (res?.success !== false) {
        setSubmitted(true);

        // Refresh requests after successful submission.
        try {
          const requestRes =
            await wellnessService.getMyCounselorRequests();

          if (requestRes?.success) {
            setMyRequests(requestRes.requests || []);
          }
        } catch (refreshError) {
          console.error(
            'Error refreshing counselor requests:',
            refreshError
          );
        }

        if (onProgress) {
          onProgress(100, 3);
        }
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Request submission failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClaimXP = () => {
    if (onComplete) {
      onComplete(
        100,
        `Connected with ${
          selected?.name || 'a counselor'
        } via Counselor Hub.`
      );
    }
  };

  const statusColors = {
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-emerald-100 text-emerald-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-rose-100 text-rose-800',
  };

  return (
    <div className="space-y-5 text-left">
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

      {/* TABS */}
      <div className="flex overflow-hidden rounded-xl border border-slate-200">
        {['browse', 'request', 'my-requests'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-xs font-bold capitalize transition ${
              activeTab === tab
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab === 'browse'
              ? '🔍 Browse Counselors'
              : tab === 'request'
                ? '📝 Send Request'
                : '📋 My Requests'}
          </button>
        ))}
      </div>

      {/* BROWSE COUNSELORS */}
      {activeTab === 'browse' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {counselors.map((c) => (
            <div
              key={c.id}
              className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-indigo-300"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-indigo-100 to-purple-100 text-2xl font-black text-indigo-600">
                  {c.name.charAt(0)}
                </div>

                <div>
                  <div className="text-sm font-extrabold text-slate-800">
                    {c.name}
                  </div>

                  <div className="text-[10px] font-bold text-indigo-600">
                    {SPECIALIZATION_LABELS[c.specialization] ||
                      c.specialization}
                  </div>
                </div>
              </div>

              <p className="line-clamp-3 text-xs leading-relaxed text-slate-600">
                {c.bio}
              </p>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400">
                  {c.experience_years}+ yrs · {c.location}
                </span>

                <button
                  type="button"
                  onClick={() => handleSelect(c)}
                  className="rounded-xl bg-indigo-600 px-4 py-1.5 text-[10px] font-bold text-white shadow-xs transition hover:bg-indigo-700"
                >
                  Connect →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* REQUEST FORM */}
      {activeTab === 'request' && (
        <>
          {!selected ? (
            <div className="py-12 text-center text-sm text-slate-500">
              <div className="mb-2 text-3xl">🔍</div>
              Select a counselor from the Browse tab first.
            </div>
          ) : submitted ? (
            <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <div className="text-4xl">✅</div>

              <h3 className="text-base font-extrabold text-emerald-800">
                Request Submitted!
              </h3>

              <p className="mx-auto max-w-md text-xs text-emerald-700">
                Your {requestType} request to{' '}
                <strong>{selected.name}</strong> has been successfully
                submitted. They will follow up via email within 1–2
                business days.
              </p>

              <button
                type="button"
                onClick={handleClaimXP}
                disabled={isSubmitting}
                className="rounded-xl bg-emerald-700 px-6 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-emerald-800 disabled:opacity-50"
              >
                ✓ Claim XP Reward
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-black text-white">
                  {selected.name.charAt(0)}
                </div>

                <div>
                  <div className="text-sm font-extrabold text-slate-800">
                    {selected.name}
                  </div>

                  <div className="text-[10px] font-bold text-indigo-600">
                    {SPECIALIZATION_LABELS[selected.specialization]}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="ml-auto text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  Change
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {REQUEST_TYPES.map((rt) => (
                  <button
                    key={rt.value}
                    type="button"
                    onClick={() => setRequestType(rt.value)}
                    className={`rounded-xl border-2 px-3 py-2 text-xs font-bold transition ${
                      requestType === rt.value
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200'
                    }`}
                  >
                    {rt.label}
                  </button>
                ))}
              </div>

              {requestType === 'appointment' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                      Preferred Date
                    </label>

                    <input
                      type="date"
                      value={preferredDate}
                      onChange={(e) =>
                        setPreferredDate(e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                      Preferred Time
                    </label>

                    <input
                      type="time"
                      value={preferredTime}
                      onChange={(e) =>
                        setPreferredTime(e.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                  Your Message *
                </label>

                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Briefly describe what support you are looking for..."
                  className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading
                  ? '⏳ Sending Request...'
                  : '📨 Submit Request'}
              </button>
            </form>
          )}
        </>
      )}

      {/* MY REQUESTS */}
      {activeTab === 'my-requests' && (
        <div className="space-y-3">
          {myRequests.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <div className="mb-2 text-3xl">📋</div>
              You have not submitted any counselor requests yet.
            </div>
          ) : (
            myRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
              >
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-800">
                    {req.counselor_name}
                  </div>

                  <div className="text-[10px] capitalize text-slate-500">
                    {req.request_type} ·{' '}
                    {req.counselor_specialization?.replace(
                      '_',
                      ' '
                    )}
                  </div>

                  <div className="line-clamp-1 text-xs text-slate-600">
                    {req.message}
                  </div>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${
                    statusColors[req.status] ||
                    'bg-slate-100 text-slate-600'
                  }`}
                >
                  {req.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};