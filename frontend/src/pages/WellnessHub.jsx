import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ModuleShell } from '../components/wellness/ModuleShell';
import { wellnessService } from '../services/wellnessServices/wellnessService';

// Activity Components for all 14 Modules
import { CodexActivity } from '../components/wellness_modules/codex/CodexActivity';
import { MindfulMonstersActivity } from '../components/wellness_modules/mindful_monsters/MindfulMonstersActivity';
import { BreathworkActivity } from  '../components/wellness_modules/breathwork/BreathworkActivity';
import { SetbackReframerActivity } from '../components/wellness_modules/setback_reframer/SetbackReframerActivity';
import { GritGardenActivity } from '../components/wellness_modules/grit_garden/GritGardenActivity';
import { EchoesOfEmpathyActivity } from '../components/wellness_modules/echoes_of_empathy/EchoesOfEmpathyActivity';
import { CounselorHubActivity } from '../components/wellness_modules/counselor_hub/CounselorHubActivity';
import { TransitionSupportActivity } from '../components/wellness_modules/transition_support/TransitionSupportActivity';
import { LockerRoomActivity } from '../components/wellness_modules/locker_room/LockerRoomActivity';
import { ReactionZoneActivity } from '../components/wellness_modules/reaction_zone/ReactionZoneActivity';
import { IntegrityCrossroadsActivity } from '../components/wellness_modules/integrity_crossroads/IntegrityCrossroadsActivity';
import { SelfTalkDetectiveActivity } from '../components/wellness_modules/self_talk_detective/SelfTalkDetectiveActivity';
import { CareerForgeActivity } from '../components/wellness_modules/career_forge/CareerForgeActivity';
import { WordGridActivity } from '../components/wellness_modules/word_grid/WordGridActivity';

const normalizeSlug = (value) => String(value || '').toLowerCase().replace(/_/g, '-');

const moduleCatalog = [
  { id: 1, slug: 'codex', title: 'Codex', description: 'Categories, lessons, locked content, and point-based unlocking.', icon: '📖', required_xp: 0, xp_reward: 25 },
  { id: 2, slug: 'mindful-monsters', title: 'Mindful Monsters', description: 'Guided breathing with interactive steps.', icon: '👾', required_xp: 0, xp_reward: 25 },
  { id: 3, slug: 'breathwork', title: 'Breathwork', description: 'Animated breathing circle, timer, and session summary.', icon: '🫁', required_xp: 0, xp_reward: 30 },
  { id: 4, slug: 'setback-reframer', title: 'Setback Reframer', description: 'Turn a negative thought into a positive reframe.', icon: '🧠', required_xp: 0, xp_reward: 35 },
  { id: 5, slug: 'grit-garden', title: 'Grit Garden', description: 'Reflection journal and stress-release exercises.', icon: '🌱', required_xp: 0, xp_reward: 30 },
  { id: 6, slug: 'echoes-of-empathy', title: 'Echoes of Empathy', description: 'Conversation practice with AI feedback and score.', icon: '🗣️', required_xp: 0, xp_reward: 40 },
  { id: 7, slug: 'counselor-hub', title: 'Counselor Hub', description: 'Browse counselors and request support.', icon: '👨‍⚕️', required_xp: 0, xp_reward: 20 },
  { id: 8, slug: 'transition-support', title: 'Transition Support', description: 'Career resources, educational articles, downloads.', icon: '🎓', required_xp: 0, xp_reward: 25 },
  { id: 9, slug: 'locker-room-realities', title: 'Locker Room Realities', description: 'Scenario cards, decisions, and AI evaluation.', icon: '🏆', required_xp: 0, xp_reward: 35 },
  { id: 10, slug: 'reaction-zone', title: 'Reaction Zone', description: 'Reaction game, timer, and high scores.', icon: '⚡', required_xp: 0, xp_reward: 30 },
  { id: 11, slug: 'integrity-crossroads', title: 'Integrity Crossroads', description: 'Ethical scenarios and decision feedback.', icon: '⚖️', required_xp: 20, xp_reward: 35 },
  { id: 12, slug: 'self-talk-detective', title: 'Self-Talk Detective', description: 'Thought entry, AI analysis, and improvements.', icon: '🔎', required_xp: 25, xp_reward: 30 },
  { id: 13, slug: 'career-forge', title: 'Career Forge', description: 'Career planner, financial goals, and roadmap.', icon: '🛠️', required_xp: 30, xp_reward: 40 },
  { id: 14, slug: 'word-grid', title: 'Word Grid', description: 'Daily puzzle, score, and leaderboard.', icon: '🧩', required_xp: 15, xp_reward: 25 },
];

const moduleComponentMap = {
  codex: CodexActivity,
  'mindful-monsters': MindfulMonstersActivity,
  breathwork: BreathworkActivity,
  'setback-reframer': SetbackReframerActivity,
  'grit-garden': GritGardenActivity,
  'echoes-of-empathy': EchoesOfEmpathyActivity,
  'counselor-hub': CounselorHubActivity,
  'transition-support': TransitionSupportActivity,
  'locker-room-realities': LockerRoomActivity,
  'reaction-zone': ReactionZoneActivity,
  'integrity-crossroads': IntegrityCrossroadsActivity,
  'self-talk-detective': SelfTalkDetectiveActivity,
  'career-forge': CareerForgeActivity,
  'word-grid': WordGridActivity,
};

export const WellnessHub = () => {
  const navigate = useNavigate();
  const { moduleSlug } = useParams();
  const [modules, setModules] = useState(moduleCatalog);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const resolvedSlug = moduleSlug ? normalizeSlug(moduleSlug) : null;

  const fetchHubData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await wellnessService.getModules().catch(() => null);

      const rawModules = res?.success && res.modules?.length > 0 ? res.modules : moduleCatalog;

      // Deduplicate strictly by normalized slug
      const uniqueList = [];
      const seenSlugs = new Set();

      for (const m of rawModules) {
        const norm = normalizeSlug(m.slug || m.module_type || m.name);
        if (!seenSlugs.has(norm)) {
          seenSlugs.add(norm);
          const catMeta = moduleCatalog.find((c) => normalizeSlug(c.slug) === norm);
          uniqueList.push({
            ...catMeta,
            ...m,
            slug: norm,
            title: m.name || catMeta?.title || 'Wellness Module',
            icon: m.icon || catMeta?.icon || '🧩',
          });
        }
      }

      setModules(uniqueList.length > 0 ? uniqueList : moduleCatalog);
    } catch {
      setModules(moduleCatalog);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHubData();
  }, [fetchHubData]);

  const filteredModules = modules.filter((mod) => {
    const titleMatch = (mod.title || mod.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const status = mod.user_status || 'available';
    const statusMatch = statusFilter === 'all' || status === statusFilter;
    return titleMatch && statusMatch;
  });

  const activeModule = modules.find((m) => normalizeSlug(m.slug) === resolvedSlug);

  // If viewing a specific module in the URL
  if (resolvedSlug && activeModule) {
    const ActivityComponent = moduleComponentMap[resolvedSlug];

    return (
      <div className="mx-auto max-w-6xl p-4 md:p-6 space-y-4">
        <button
          onClick={() => navigate('/wellness')}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
        >
          ← Back to Wellness Catalog
        </button>

        <ModuleShell slug={activeModule.slug} onRefreshUserData={fetchHubData}>
          {ActivityComponent ? (
            <ActivityComponent onRefreshUserData={fetchHubData} />
          ) : (
            <div className="py-12 text-center text-slate-400">Activity workspace is loading...</div>
          )}
        </ModuleShell>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      {/* HUB HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <span className="inline-block rounded-full bg-indigo-500/20 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-indigo-300 border border-indigo-400/20">
              High Performance Mental Wellness
            </span>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight">Athlete Wellness Hub</h1>
            <p className="max-w-2xl text-xs md:text-sm leading-relaxed text-indigo-100/80">
              Train resilience, emotional regulation, high-pressure communication, and post-athletic roadmap strategies with 14 interactive sports psychology modules.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md text-center">
              <div className="text-[10px] uppercase font-bold text-indigo-200">Modules Available</div>
              <div className="text-xl font-black text-emerald-400">{modules.length}</div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* STATUS FILTER PILLS */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: 'All Modules' },
            { id: 'available', label: 'Available' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'completed', label: 'Completed' },
            { id: 'locked', label: 'Locked' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                statusFilter === f.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* SEARCH INPUT */}
        <div className="w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search mental modules..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* MODULES GRID */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-slate-500 font-semibold text-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-200 border-t-indigo-600" />
            Loading athlete wellness modules...
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredModules.map((mod) => {
            const status = mod.user_status || 'available';
            const isLocked = status === 'locked';

            return (
              <div
                key={mod.slug}
                className={`flex flex-col justify-between rounded-3xl border p-6 transition-all duration-200 shadow-xs ${
                  isLocked
                    ? 'border-slate-200 bg-slate-50/70 opacity-85'
                    : 'border-slate-200 bg-white hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50/80 text-3xl shadow-inner">
                      {mod.icon || '🧩'}
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border ${
                        status === 'completed'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : status === 'in_progress'
                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                          : status === 'locked'
                          ? 'border-slate-200 bg-slate-200 text-slate-600'
                          : 'border-indigo-200 bg-indigo-50 text-indigo-700'
                      }`}
                    >
                      {status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-800">{mod.title || mod.name}</h3>
                    <p className="mt-1.5 text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {mod.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-xs font-extrabold text-indigo-700">
                    +{mod.xp_reward || 25} XP
                  </span>

                  <button
                    onClick={() => navigate(`/wellness/${mod.slug}`)}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs ${
                      status === 'completed'
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : isLocked
                        ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {status === 'completed'
                      ? 'Review Module'
                      : isLocked
                      ? `Locked (${mod.required_xp} XP)`
                      : 'Launch Module →'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default WellnessHub;