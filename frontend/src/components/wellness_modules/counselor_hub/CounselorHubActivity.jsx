import { useState, useEffect, useCallback } from 'react';
import { wellnessService } from '../../../services/wellnessServices/wellnessService';

const FALLBACK_COUNSELORS = [
  {
    id: 1, name: 'Dr. Priya Sharma', specialization: 'sports_psychology', bio: 'PhD in Sport & Performance Psychology with 12+ years working with elite athletes on mental toughness, performance anxiety, and emotional regulation.', experience_years: 12, location: 'Lahore, Pakistan', email: 'priya.sharma@wellnesshub.com', phone: '', image: null, is_available: true,
  },
  {
    id: 2, name: 'Ahmed Raza', specialization: 'mental_wellness', bio: 'Certified mental wellness counselor specializing in athlete burnout, identity crises during career transitions, and resilience-building workshops.', experience_years: 7, location: 'Karachi, Pakistan', email: 'ahmed.raza@wellnesshub.com', phone: '', image: null, is_available: true,
  },
  {
    id: 3, name: 'Sara Khan', specialization: 'career', bio: 'Career development coach for transitioning athletes. Expertise in identifying transferable skills, building professional networks, and creating post-sport career plans.', experience_years: 9, location: 'Islamabad, Pakistan', email: 'sara.khan@wellnesshub.com', phone: '', image: null, is_available: true,
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

export const CounselorHubActivity = ({ onProgress, onComplete, isSubmitting }) => {
  const [counselors, setCounselors] = useState([]);
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

  const fetchCounselors = useCallback(async () => {
    try {
      const res = await wellnessService.getCounselors();
      if (res?.success && res.counselors?.length > 0) {
        setCounselors(res.counselors);
      } else {
        setCounselors(FALLBACK_COUNSELORS);
      }
    } catch {
      setCounselors(FALLBACK_COUNSELORS);
    }
  }, []);

  const fetchMyRequests = useCallback(async () => {
    try {
      const res = await wellnessService.getMyCounselorRequests();
      if (res?.success) setMyRequests(res.requests || []);
    } catch {
      // Ignore request history fetch errors.
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchCounselors(); fetchMyRequests(); }, [fetchCounselors, fetchMyRequests]);

  const handleSelect = (counselor) => {
    setSelected(counselor);
    setActiveTab('request');
    if (onProgress) onProgress(50, 3);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!message.trim()) {
      setError('Please write a short message to the counselor.');
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
      const res = await wellnessService.submitCounselorRequest(payload);
      if (res?.success) {
        setSubmitted(true);
        fetchMyRequests();
        if (onProgress) onProgress(100, 3);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Request submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimXP = () => {
    if (onComplete) onComplete(100, `Connected with ${selected?.name || 'a counselor'} via Counselor Hub.`);
  };

  const statusColors = {
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-emerald-100 text-emerald-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-rose-100 text-rose-800',
  };

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 flex justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="font-bold text-rose-400">✕</button>
        </div>
      )}

      {/* TABS */}
      <div className="flex rounded-xl overflow-hidden border border-slate-200">
        {['browse', 'request', 'my-requests'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-xs font-bold capitalize transition ${activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            {tab === 'browse' ? '🔍 Browse Counselors' : tab === 'request' ? '📝 Send Request' : '📋 My Requests'}
          </button>
        ))}
      </div>

      {/* BROWSE COUNSELORS */}
      {activeTab === 'browse' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {counselors.map((c) => (
            <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 hover:border-indigo-300 transition">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-linear-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-2xl font-black text-indigo-600">
                  {c.name.charAt(0)}
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-800">{c.name}</div>
                  <div className="text-[10px] font-bold text-indigo-600">{SPECIALIZATION_LABELS[c.specialization] || c.specialization}</div>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{c.bio}</p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400">{c.experience_years}+ yrs · {c.location}</span>
                <button
                  onClick={() => handleSelect(c)}
                  className="rounded-xl bg-indigo-600 px-4 py-1.5 text-[10px] font-bold text-white hover:bg-indigo-700 transition"
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
            <div className="py-8 text-center text-slate-500 text-sm">
              Select a counselor from the Browse tab first.
            </div>
          ) : submitted ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center space-y-4">
              <div className="text-4xl">✅</div>
              <h3 className="font-extrabold text-emerald-800">Request Submitted!</h3>
              <p className="text-xs text-emerald-700">
                Your {requestType} request to <strong>{selected.name}</strong> has been submitted. They will follow up via email within 1–2 business days.
              </p>
              <button
                onClick={handleClaimXP}
                disabled={isSubmitting}
                className="rounded-xl bg-emerald-700 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-800 disabled:opacity-50"
              >
                ✓ Claim XP Reward
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-3 rounded-2xl bg-indigo-50 border border-indigo-100 p-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-lg font-black text-white">{selected.name.charAt(0)}</div>
                <div>
                  <div className="text-sm font-extrabold text-slate-800">{selected.name}</div>
                  <div className="text-[10px] text-indigo-600">{SPECIALIZATION_LABELS[selected.specialization]}</div>
                </div>
                <button type="button" onClick={() => setSelected(null)} className="ml-auto text-xs font-bold text-slate-400 hover:text-slate-600">Change</button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {REQUEST_TYPES.map((rt) => (
                  <button
                    key={rt.value}
                    type="button"
                    onClick={() => setRequestType(rt.value)}
                    className={`rounded-xl border-2 py-2 px-3 text-xs font-bold transition ${requestType === rt.value ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200'}`}
                  >
                    {rt.label}
                  </button>
                ))}
              </div>

              {requestType === 'appointment' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Preferred Date</label>
                    <input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 outline-none focus:border-indigo-400" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Preferred Time</label>
                    <input type="time" value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-700 outline-none focus:border-indigo-400" />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 mb-1 block">Your Message *</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Briefly describe what support you are looking for..."
                  className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {loading ? '⏳ Sending Request...' : '📨 Submit Request'}
              </button>
            </form>
          )}
        </>
      )}

      {/* MY REQUESTS */}
      {activeTab === 'my-requests' && (
        <div className="space-y-3">
          {myRequests.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">You have not submitted any counselor requests yet.</div>
          ) : (
            myRequests.map((req) => (
              <div key={req.id} className="rounded-2xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-sm font-bold text-slate-800">{req.counselor_name}</div>
                  <div className="text-[10px] text-slate-500 capitalize">{req.request_type} · {req.counselor_specialization?.replace('_', ' ')}</div>
                  <div className="text-xs text-slate-600 line-clamp-1">{req.message}</div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${statusColors[req.status] || 'bg-slate-100 text-slate-600'}`}>
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