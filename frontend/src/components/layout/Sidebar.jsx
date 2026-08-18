import { Link, useLocation } from "react-router-dom";
import {
  HomeIcon,
  FaceSmileIcon,
  MusicalNoteIcon,
  SparklesIcon,
  BookOpenIcon,
  TrophyIcon,
  CheckBadgeIcon,
  StarIcon,
  ShieldExclamationIcon,
  Cog6ToothIcon,
  XMarkIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const location = useLocation();

  const navigationItems = [
    { name: "Dashboard", path: "/dashboard", icon: HomeIcon },
    { name: "Mood Tracker", path: "/mood-checkin", icon: FaceSmileIcon },
    { name: "Daily Goals", path: "/goals", icon: CheckBadgeIcon },
    { name: "Sound Therapy", path: "/sound-therapy", icon: MusicalNoteIcon },
    { name: "AI Affirmations", path: "/affirmations", icon: SparklesIcon },
    { name: "AI Bio Guide", path: "/bio-guide", icon: SparklesIcon },
    { name: "Gamification", path: "/gamification", icon: TrophyIcon },
    { name: "Wellness Modules", path: "/modules", icon: BookOpenIcon },
    { name: "Trophy Room", path: "/trophy-room", icon: StarIcon },
    { name: "Emergency Support", path: "/support", icon: ShieldExclamationIcon },
    { name: "Settings", path: "/settings", icon: Cog6ToothIcon },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      <aside
        className={`
        fixed top-0 left-0 bottom-0 z-50 w-64 bg-slate-950 text-slate-300 border-r border-slate-800/80
        transform transition-transform duration-300 ease-in-out flex flex-col justify-between shadow-2xl lg:shadow-none
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div>
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-600/30 text-sm">
                AW
              </div>
              <div>
                <span className="text-xs font-extrabold text-white tracking-wider uppercase block">
                  Athlete Wellness
                </span>
                <span className="text-[9px] text-indigo-400 font-semibold tracking-wide uppercase">
                  Portal System
                </span>
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <nav
            className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-140px)]"
            style={{
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            }}
          >
            <style>{`
              nav::-webkit-scrollbar {
                display: none;
              }
            `}</style>

            <p className="px-3 pb-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
              Main Modules
            </p>

            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    group flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold  transition-all duration-200 relative  
                    ${
                      active
                        ? "bg-indigo-600 text-white  shadow-lg shadow-indigo-600/30 font-bold translate-x-1"
                        : "hover:bg-slate-900 text-slate-400 hover:text-white hover:translate-x-1 border border-transparent hover:border-slate-800"
                    }
                  `}
                >
                  <Icon
                    className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                      active
                        ? "text-white"
                        : "text-slate-400 group-hover:text-indigo-400"
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                  {active && (
                    <span className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full shadow-sm"></span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-3.5 border-t border-slate-800/80 m-3 bg-slate-900/60 rounded-2xl border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <ShieldCheckIcon className="w-4 h-4" />
            </div>

            <div>
              <p className="text-[11px] font-bold text-white flex items-center gap-1.5">
                Role: Member
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              </p>
              <p className="text-[9px] text-slate-400">
                Secure Encrypted Session
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}