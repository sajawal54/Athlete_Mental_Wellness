import { useState, useEffect } from 'react';
import { wellnessService } from '../../../services/wellnessServices/wellnessService';

const DEFAULT_MILESTONES = [
  { id: 1, title: 'Audit and document top 5 athletic transferable competencies', completed: true },
  { id: 2, title: 'Conduct 3 informational interviews with former athletes in target field', completed: false },
  { id: 3, title: 'Complete industry credential / professional certification', completed: false },
  { id: 4, title: 'Build 12-month emergency financial cushion', completed: false },
];

export const CareerForgeActivity = ({ onProgress, onComplete, isSubmitting }) => {
  const [targetRole, setTargetRole] = useState('Sports Operations & High Performance Analytics');
  const [industry, setIndustry] = useState('Athletic Tech & Management');
  const [financialGoal, setFinancialGoal] = useState('Build 12-month post-sport financial runway');
  const [timelineMonths, setTimelineMonths] = useState(12);
  const [milestones, setMilestones] = useState(DEFAULT_MILESTONES);
  const [newMilestone, setNewMilestone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    const fetchRoadmap = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await wellnessService.getCareerRoadmap();
        
        if (ignore) return;

        const data = res?.data || res?.roadmap || res;
        if (data && typeof data === 'object') {
          if (data.target_role) setTargetRole(data.target_role);
          if (data.industry) setIndustry(data.industry);
          if (data.financial_goals) setFinancialGoal(data.financial_goals);
          if (data.timeline_months) setTimelineMonths(Number(data.timeline_months));
          if (Array.isArray(data.milestones) && data.milestones.length > 0) {
            setMilestones(data.milestones);
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error('Error fetching career roadmap:', err);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchRoadmap();

    return () => {
      ignore = true; // Cleanup function to prevent state updates if unmounted
    };
  }, []);

  const handleToggleMilestone = (id) => {
    // Calculate new state OUTSIDE the setState callback to maintain purity
    const updatedMilestones = milestones.map((m) => 
      m.id === id ? { ...m, completed: !m.completed } : m
    );
    
    setMilestones(updatedMilestones);

    // Trigger side-effects after calculating new state
    const completedCount = updatedMilestones.filter((m) => m.completed).length;
    const progressPct = Math.round((completedCount / (updatedMilestones.length || 1)) * 100);
    if (onProgress) onProgress(progressPct, 3);
  };

  const handleAddMilestone = (e) => {
    e.preventDefault();
    if (!newMilestone.trim()) return;
    
    const newId = Date.now();
    const newTitle = newMilestone.trim();

    setMilestones((prev) => [
      ...prev,
      { id: newId, title: newTitle, completed: false },
    ]);
    setNewMilestone('');
  };

  const handleDeleteMilestone = (id, e) => {
    e.stopPropagation();
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSaveRoadmap = async () => {
    try {
      setSaving(true);
      setError(null);
      setSavedSuccess(false);

      const payload = {
        target_role: targetRole,
        industry,
        financial_goals: financialGoal,
        timeline_months: timelineMonths,
        milestones,
      };

      const res = await wellnessService.saveCareerRoadmap(payload);

      if (res) {
        setSavedSuccess(true);
        if (onProgress) onProgress(100, 3);
        
        // Extract actual XP points returned by API response (or default to activity target XP)
        const xpEarned = res?.xp_awarded ?? res?.data?.xp_awarded ?? 30;

        if (onComplete) {
          onComplete(xpEarned, 'Constructed athlete career roadmap.');
        }
      }
    } catch (err) {
      console.error('Error saving career roadmap:', err);
      setError(
        err?.response?.data?.message || 
        err?.message || 
        'Failed to save career roadmap. Please try again.'
      );
      
      // Fallback XP execution in case of server save error to keep user progress unblocked
      if (onComplete) {
        onComplete(30, 'Constructed athlete career roadmap.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-slate-500 font-semibold text-sm">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          Loading career roadmap forge...
        </div>
      </div>
    );
  }

  const completedCount = milestones.filter((m) => m.completed).length;
  const completionPercentage = Math.round((completedCount / (milestones.length || 1)) * 100);

  return (
    <div className="space-y-6 text-left text-slate-800">
      {/* HEADER */}
      <div className="text-center space-y-1">
        <h3 className="text-lg font-black text-slate-800">🛠️ Career Forge & Transition Roadmap</h3>
        <p className="text-xs text-slate-500">
          Build a structured transition plan translating your elite athletic drive into long-term professional success.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          ⚠️ {error}
        </div>
      )}

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
          ✓ Career roadmap and milestones successfully saved!
        </div>
      )}

      {/* ROADMAP TARGETS FORM */}
      <div className="grid gap-4 sm:grid-cols-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Target Role / Ambition
          </label>
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g., High Performance Analytics"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Target Industry
          </label>
          <input
            type="text"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="e.g., Athletic Tech & Management"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Financial Cushion Goal
          </label>
          <input
            type="text"
            value={financialGoal}
            onChange={(e) => setFinancialGoal(e.target.value)}
            placeholder="e.g., Build 12-month post-sport runway"
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Timeline (Months)
          </label>
          <input
            type="number"
            min="1"
            max="120"
            value={timelineMonths}
            onChange={(e) => setTimelineMonths(Number(e.target.value))}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* MILESTONES CHECKLIST */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-extrabold text-slate-800">Key Milestones & Action Items</h4>
            <p className="text-xs text-slate-500">
              {completedCount} of {milestones.length} milestones accomplished
            </p>
          </div>
          <span className="rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-extrabold text-indigo-700">
            {completionPercentage}% Complete
          </span>
        </div>

        {/* PROGRESS BAR */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-linear-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        {/* MILESTONE ITEMS */}
        <div className="space-y-2">
          {milestones.map((m) => (
            <div
              key={m.id}
              onClick={() => handleToggleMilestone(m.id)}
              className={`flex items-center justify-between rounded-xl p-3 border cursor-pointer select-none transition ${
                m.completed
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 pr-2">
                <input
                  type="checkbox"
                  checked={m.completed}
                  readOnly
                  className="h-4 w-4 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className={`text-xs font-semibold ${m.completed ? 'line-through opacity-75' : ''}`}>
                  {m.title}
                </span>
              </div>
              
              <button
                type="button"
                onClick={(e) => handleDeleteMilestone(m.id, e)}
                className="text-slate-300 hover:text-rose-500 transition-colors text-xs font-bold px-1"
                title="Remove Milestone"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* ADD MILESTONE INPUT */}
        <form onSubmit={handleAddMilestone} className="flex gap-2 pt-2">
          <input
            type="text"
            value={newMilestone}
            onChange={(e) => setNewMilestone(e.target.value)}
            placeholder="Add custom career milestone..."
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!newMilestone.trim()}
            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-900 disabled:opacity-50 transition"
          >
            + Add
          </button>
        </form>
      </div>

      {/* SAVE ROADMAP BUTTON */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSaveRoadmap}
          disabled={saving || isSubmitting}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Forging Roadmap...' : '🛠️ Save Career Roadmap & Claim XP'}
        </button>
      </div>
    </div>
  );
};