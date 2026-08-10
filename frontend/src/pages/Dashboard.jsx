import React, { useState, useEffect } from 'react';
import { 
  SparklesIcon, 
  CheckCircleIcon, 
  FireIcon, 
  TrophyIcon, 
  FaceSmileIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  ChartBarSquareIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { getDashboardDataAPI } from '../services/dashboardService';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await getDashboardDataAPI();
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to load dashboard from backend", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const handleGoalComplete = () => {
    toast.success("Goal completed! +50 XP Earned 🎉");
    setDashboardData(prev => ({
      ...prev,
      user_summary: { ...prev?.user_summary, xp: (prev?.user_summary?.xp || 0) + 50 },
      todays_goal: { ...prev?.todays_goal, completed: true }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[75vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-xl animate-spin shadow-md"></div>
          <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Loading Executive Workspace...</p>
        </div>
      </div>
    );
  }

  // Backend response extraction
  const { user_summary, todays_goal, mood_summary, ai_guide, quick_modules } = dashboardData || {};

  // Logged-in user's real name dynamic priority check
  const loggedInUserName = user_summary?.username || user_summary?.first_name || user_summary?.name || 'Athlete';

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* 1. WELCOME HERO BANNER (Real Logged-in User Display) */}
      <div className="relative bg-linear-to-tr from-indigo-950 via-indigo-900 to-violet-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-indigo-950/10 overflow-hidden border border-indigo-900/50">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-0 right-1/4 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-xl text-[11px] font-bold text-indigo-200 border border-white/10 shadow-inner">
              <SparklesIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Athlete Mental Performance Hub</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Welcome back, {loggedInUserName}! 👋
            </h1>
            <p className="text-xs text-indigo-200/90 font-medium max-w-xl leading-relaxed">
              Your mental edge is your core strength. Keep up your active momentum today and stay completely aligned with your milestones.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/15 self-start lg:self-auto shadow-xl">
            <div className="flex items-center gap-2.5 pr-4 border-r border-white/20">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center text-amber-400 shadow-inner">
                <FireIcon className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-300">Streak</p>
                <p className="text-sm font-extrabold text-white">{user_summary?.streak || 0} Days</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pl-1">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-amber-300 shadow-inner">
                <TrophyIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-300">Level {user_summary?.level || 1}</p>
                <p className="text-sm font-extrabold text-white">{user_summary?.xp || 0} XP</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TODAY'S GOAL & MOOD SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs font-bold border border-indigo-100/60">
                  🎯
                </div>
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Today’s Primary Goal</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Daily actionable milestone</p>
                </div>
              </div>
              <span className={`px-3 py-1 text-[10px] font-extrabold rounded-xl uppercase tracking-wider ${
                todays_goal?.completed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {todays_goal?.completed ? 'Completed' : 'Pending'}
              </span>
            </div>

            <div className="py-6 space-y-4">
              <p className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">{todays_goal?.title || 'Complete daily mental check-in'}</p>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                <div className={`h-full rounded-full transition-all duration-500 ${todays_goal?.completed ? 'bg-emerald-500 w-full' : 'bg-indigo-600 w-1/2'}`}></div>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>Reward: +{todays_goal?.points || 50} XP</span>
                <span>{todays_goal?.completed ? '100% Finished' : 'In Progress'}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Status Check</span>
            {!todays_goal?.completed ? (
              <button 
                onClick={handleGoalComplete}
                className="flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
              >
                <CheckCircleIcon className="w-4 h-4" />
                <span>Mark as Complete</span>
              </button>
            ) : (
              <span className="text-xs font-extrabold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                <CheckCircleIcon className="w-4 h-4" /> Goal Achieved Successfully!
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shadow-2xs border border-violet-100/60">
                <FaceSmileIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Mood Summary</h3>
                <p className="text-[10px] text-slate-400 font-medium">Emotional wellness state</p>
              </div>
            </div>

            <div className="py-6 text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-50 text-violet-700 text-xs font-extrabold rounded-2xl border border-violet-100 shadow-2xs">
                <span>Today:</span>
                <span className="text-violet-900 font-black">{mood_summary?.today || 'Calm'}</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium bg-slate-50 py-2.5 px-3 rounded-xl border border-slate-100">
                Recent Trend: <span className="text-slate-800 font-bold">{mood_summary?.trend?.join(' → ') || 'Focused'}</span>
              </p>
            </div>
          </div>

          <button 
            onClick={() => navigate('/mood')}
            className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Open Mood Check-in</span>
            <ArrowRightIcon className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 3. AI GUIDE & QUICK MODULES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col justify-between border border-slate-800">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="p-2.5 bg-white/10 rounded-2xl text-indigo-400 backdrop-blur-md border border-white/10">
                <SparklesIcon className="w-5 h-5" />
              </span>
              <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold rounded-lg uppercase tracking-wider border border-indigo-500/30">AI Bio Guide</span>
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">Need instant mental coaching?</h4>
              <p className="text-xs text-slate-300 mt-1.5 italic leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">
                "{ai_guide?.prompt || 'How to stay focused under pressure?'}"
              </p>
            </div>
          </div>

          <button 
            onClick={() => navigate('/ai-guide')}
            className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <span>Start AI Coaching Session</span>
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs border border-indigo-100/60">
                  <ChartBarSquareIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Quick Modules & Resources</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Frequently accessed tools</p>
                </div>
              </div>
              <button onClick={() => navigate('/modules')} className="text-xs font-extrabold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer">View All ➔</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
              {quick_modules?.map((mod) => (
                <div 
                  key={mod.id || mod.title} 
                  onClick={() => navigate(mod.path || '/modules')}
                  className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 hover:border-indigo-300 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
                >
                  <div>
                    <span className={`inline-block px-2.5 py-1 text-[9px] font-black rounded-lg uppercase tracking-wider mb-2 ${
                      mod.status === 'Unlocked' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200/60' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {mod.status || 'Unlocked'}
                    </span>
                    <h4 className="text-xs font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors">{mod.title}</h4>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-bold text-slate-500">
                    <span>Progress</span>
                    <span className="text-indigo-600 font-extrabold">{mod.progress || '0%'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Powered by Django REST Framework JWT</span>
            <span className="flex items-center gap-1 text-emerald-600 font-bold"><ShieldCheckIcon className="w-4 h-4" /> Fully Synced</span>
          </div>
        </div>
      </div>

      {/* 4. TROPHY ROOM SHORTCUT */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-5 hover:border-slate-300 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shadow-inner border border-amber-200/60">
            🏆
          </div>
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">Recent Achievements & Trophy Room</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">You've unlocked new performance badges this week. Keep up the stellar discipline!</p>
          </div>
        </div>

        <button 
          onClick={() => navigate('/trophy-room')}
          className="px-5 py-3 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-slate-900/10 whitespace-nowrap active:scale-95 cursor-pointer"
        >
          Visit Trophy Room ➔
        </button>
      </div>

    </div>
  );
}