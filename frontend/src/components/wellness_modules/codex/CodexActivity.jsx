import { useState, useEffect, useCallback } from 'react';
import { wellnessService } from '../../../services/wellnessServices/wellnessService';

// EXPANDED 20+ LESSONS WITH DETAILED LONG-FORM CONTENT
const EXTENDED_CATEGORIES = [
  {
    id: 'cat-1',
    name: '🔥 Focus & Clutch Performance',
    lessons: [
      {
        id: 'codex-101',
        title: 'The Inverted-U Law & Arousal Control',
        required_xp: 0,
        xp_reward: 20,
        content: `**Core Principle:** Performance increases with physiological or mental arousal, but only up to an optimal point. When levels become too high, performance rapidly declines (choking).

**The Science of Arousal:**
1. **Under-Arousal (Boredom/Sluggishness):** Low heart rate, slow reaction time, poor focus, and lack of intensity.
2. **Optimal Zone (Flow State):** Sharp focus, automatic execution, calm mind with an energized body.
3. **Over-Arousal (Panic/Choking):** Tunnel vision, muscle tightness, racing thoughts, and inability to process spatial cues.

**Practical Playbook:**
* **To Increase Arousal (Pacing & Power):** Use brisk rhythmic breathing (2s inhale, 1s exhale), sharp vocalizations, dynamic physical movement, and music with high BPM.
* **To Decrease Arousal (Calm & Precision):** Execute physiological sighs (two quick inhales through nose, long exhale through mouth), drop your shoulders, and focus on physical touchpoints (e.g., feeling the ground under your feet).`,
      },
      {
        id: 'codex-102',
        title: 'Tactical Reset Protocols Under Pressure',
        required_xp: 15,
        xp_reward: 25,
        content: `**Core Principle:** High-level pressure destabilizes working memory. A Tactical Reset Protocol acts as a mental 'hard reboot' between plays or rounds.

**The 3-Step "P-A-R" Protocol:**
1. **Pause (Physical Trigger):** Wipe sweat, adjust gear, adjust shoe laces, or touch a specific spot on your jersey. This signals your brain that the previous action is officially over.
2. **Accept & Release (Exhale):** Take a deep 4-7-8 breath. Acknowledge mistakes without emotional commentary. Tell yourself: "It happened. Moving on."
3. **Refocus (Target Anchor):** Pick one tactical cue for the next second (e.g., "See the ball," "Fast feet," or "Low center of gravity"). Do not think about the outcome or score.`,
      },
      {
        id: 'codex-103',
        title: 'Developing Selective Attention & Narrow Focus',
        required_xp: 30,
        xp_reward: 30,
        content: `**Core Principle:** Elite athletes filter out 95% of environmental stimuli to focus strictly on actionable performance cues.

**Attentional Dimensions (Nideffer Model):**
* **Broad External:** Scanning the entire field or court to assess opponent positioning.
* **Narrow External:** Laser-focusing on a single target (the ball, the rim, the target line).
* **Broad Internal:** Analyzing game plans, overall strategies, or physical condition.
* **Narrow Internal:** Re-centering breathing, feeling muscle activation, or repeating a internal mental cue.

**Drill Routine:**
When crowd noise or opponent trash talk rises, narrow your vision to a single point on your equipment (e.g., ball seams or racket strings). Say your anchor word ("Zero") to snap back to the current frame.`,
      },
      {
        id: 'codex-104',
        title: 'Mastering Clutch Decision Making',
        required_xp: 45,
        xp_reward: 35,
        content: `**Core Principle:** Clutch situations are not time for creative experimentation; they are time for rapid pattern execution.

**Rules for Clutch Execution:**
1. **Reduce Options:** Never weigh 4 different options under 5 seconds. Default to your highest-probability, most-rehearsed skill set.
2. **Trust Motor Memory:** Explicit conscious control (trying to manually guide your body) breaks automatic motor pathways. Let subconscious muscle memory run the pattern.
3. **Embrace the Physical Sensation:** Reframe a racing heart from "I am terrified" to "My body is pumping oxygen to fuel my speed."`,
      },
      {
        id: 'codex-105',
        title: 'Overcoming The Spotlight Effect in Competitions',
        required_xp: 60,
        xp_reward: 40,
        content: `**Core Principle:** Athletes overestimate how much spectators, coaches, or opponents notice their minor errors.

**Mental Framework:**
* The crowd is not watching your micro-mistakes; they are following the momentum of the game.
* Everyone's attention is inherently selfish—they care far more about the result than how awkward a single movement looked.
* Free yourself from crowd-pleasing. Your sole objective is executing the next assignment on your checklist.`,
      },
    ],
  },
  {
    id: 'cat-2',
    name: '🧠 Mental Toughness & Resilience',
    lessons: [
      {
        id: 'codex-201',
        title: 'Reframing Failure: Post-Match Autopsy',
        required_xp: 0,
        xp_reward: 20,
        content: `**Core Principle:** Unexamined failure creates anxiety. Systematic failure processing builds competitive mastery.

**The Cold Post-Match Protocol:**
1. **The 24-Hour Rule:** Allow zero deep emotional analysis or self-criticism immediately after a loss. Let emotional cortisol clear out.
2. **Fact vs. Emotion Matrix:** Separate facts ("My first serve accuracy was 42%") from narrative ("I was terrible and froze up").
3. **The 3-1 Ratio:** Identify 3 things executed correctly before writing down 1 technical element that requires tactical training next week.`,
      },
      {
        id: 'codex-202',
        title: 'Building Unshakeable Self-Efficacy',
        required_xp: 20,
        xp_reward: 25,
        content: `**Core Principle:** Self-efficacy is your belief in your capability to execute specific tasks under specific conditions.

**Four Sources of Self-Efficacy:**
1. **Mastery Experiences:** Your log of past successful performances under pressure.
2. **Vicarious Modeling:** Watching peers with similar skill levels succeed in tough scenarios.
3. **Verbal Persuasion:** Internal self-talk that emphasizes effort, preparation, and competence over luck.
4. **Physiological State Awareness:** Interpreting sweat, fatigue, and adrenaline as readiness cues rather than signs of weakness.`,
      },
      {
        id: 'codex-203',
        title: 'Managing Internal Self-Talk & Reframing',
        required_xp: 40,
        xp_reward: 30,
        content: `**Core Principle:** Your inner monologue directly affects muscle tension, respiration rate, and motor speed.

**Reframing Matrix:**
* *Negative:* "If I miss this next shot, we lose the tournament."
* *Reframed:* "This is a high-reward opportunity to execute my training."
* *Negative:* "I am completely exhausted, I can't keep running."
* *Reframed:* "My legs are burning because I am pushing my limits. Everyone else is feeling this same wall."`,
      },
      {
        id: 'codex-204',
        title: 'Developing a Stoic Athlete Mindset',
        required_xp: 60,
        xp_reward: 35,
        content: `**Core Principle:** Divide all match conditions into what is within your control and what is outside your control.

**Dichotomy of Control:**
* **Uncontrollable:** Referees, weather, crowd noise, opponent performance, injuries, equipment glitches.
* **Controllable:** Effort, attitude, body language, tactical response, preparation, recovery routines.
* **Action:** Spending a single second complaining about external factors drains glucose and willpower needed for in-game adaptations.`,
      },
      {
        id: 'codex-205',
        title: 'Building Grit Through Deliberate Discomfort',
        required_xp: 80,
        xp_reward: 40,
        content: `**Core Principle:** Mental toughness is not an innate trait—it is a muscle forged by repeatedly volunteering for uncomfortable training conditions.

**Implementation Tactics:**
* Train in unfavorable weather conditions (cold, heat, rain) to build immunity to discomfort.
* Finish hard workouts with 2 additional minutes of mental focus drills when physically exhausted.
* Treat fatigue as a simulator for high-pressure clutch situations.`,
      },
    ],
  },
  {
    id: 'cat-3',
    name: '🎯 Goal Setting & Mindset Optimization',
    lessons: [
      {
        id: 'codex-301',
        title: 'Outcome Goals vs. Process Goals',
        required_xp: 0,
        xp_reward: 20,
        content: `**Core Principle:** Obsessing over outcome goals increases match anxiety. Focus on process goals to unlock fluid execution.

**The Goal Hierarchy:**
1. **Outcome Goals (Low Control):** Winning a medal, making the national team, getting a scholarship.
2. **Performance Goals (Medium Control):** Running a 10.8s sprint, hitting 80% free throws, completing 50 passes.
3. **Process Goals (100% Control):** Maintaining a low stance, breathing rhythm between plays, following nutritional timing. Focus 90% of your daily energy here.`,
      },
      {
        id: 'codex-302',
        title: 'Growth Mindset vs. Fixed Talent Mindset',
        required_xp: 25,
        xp_reward: 25,
        content: `**Core Principle:** Believing talent is fixed causes athletes to avoid challenges to protect their ego. Believing talent is malleable builds world-class adaptability.

**Shift Your Self-Talk:**
* Replace "I am not good at wet surface matches" with "I haven't mastered wet surface traction adjustments **yet**."
* Treat tough opponents as high-level sparring partners who highlight your tactical gaps, not threats to your self-worth.`,
      },
      {
        id: 'codex-303',
        title: 'Creating Pre-Performance Routines',
        required_xp: 50,
        xp_reward: 30,
        content: `**Core Principle:** Pre-performance routines lock your nervous system into a familiar state regardless of venue size or crowd volume.

**4-Phase Pre-Game Blueprint:**
1. **Physical Priming (60 mins out):** Dynamic warm-ups, pulse raising, mobility.
2. **Equipment Check (40 mins out):** Orderly gear preparation to quiet mental clutter.
3. **Visualization & Music (20 mins out):** Replaying successful executions at 1x speed.
4. **Final Anchor (2 mins out):** Controlled breathing, physical trigger, and simple process word.`,
      },
      {
        id: 'codex-304',
        title: 'Visualizing Success (Motor Imagery)',
        required_xp: 75,
        xp_reward: 35,
        content: `**Core Principle:** PETTLEP-guided visualization activates the same neural motor pathways as physical movement.

**PETTLEP Principles:**
* **Physical:** Wear your match uniform and hold your equipment while visualizing.
* **Environment:** Imagine the specific venue, smells, lighting, and sounds.
* **Task:** Visualize at real-time match speed, not slow motion.
* **Emotional:** Replicate the feeling of adrenaline and high heart rate during the mental practice.`,
      },
      {
        id: 'codex-305',
        title: 'Identity Diversification for High Performers',
        required_xp: 100,
        xp_reward: 40,
        content: `**Core Principle:** Tying 100% of your self-worth to athletic results leads to severe burnout, depression, and choking under pressure.

**Action Steps:**
* Cultivate interests, relationships, and skills outside your sport.
* Remember: "Athlete" is what you **do**, not the entirety of who you **are**.
* Secure self-worth outside competition allows you to play freely without fear of identity destruction.`,
      },
    ],
  },
  {
    id: 'cat-4',
    name: '⚡ Recovery, Sleep & Energy Management',
    lessons: [
      {
        id: 'codex-401',
        title: 'The Neuroscience of Athletic Sleep',
        required_xp: 0,
        xp_reward: 20,
        content: `**Core Principle:** Sleep is the single most potent legal performance enhancer available to human athletes.

**Sleep Stages & Performance Benefits:**
* **Deep Sleep (Slow-Wave):** Growth hormone release, tissue repair, physical recovery, immune restoration.
* **REM Sleep:** Tactical memory consolidation, reaction speed calibration, emotional regulation.

**Optimizing Sleep Quality:**
1. Keep the bedroom pitch dark and cool (~65°F / 18°C).
2. Avoid screen blue light 60-90 minutes before sleep to prevent melatonin suppression.
3. Aim for 8-9.5 hours during heavy training blocks.`,
      },
      {
        id: 'codex-402',
        title: 'Managing Overtraining Syndrome & Burnout',
        required_xp: 30,
        xp_reward: 25,
        content: `**Core Principle:** Overtraining occurs when cumulative stress exceeds your capacity to recover over extended periods.

**Early Warning Indicators:**
* Unexplained drop in athletic performance despite high effort.
* Elevated resting heart rate upon waking up in the morning.
* Persistent irritability, sleep disturbances, and loss of competitive drive.

**Recovery Intervention:**
Incorporate active rest, deload training weeks, proper caloric surplus, and restorative mental practices when stress signals compound.`,
      },
      {
        id: 'codex-403',
        title: 'Heart Rate Variability (HRV) & Readiness',
        required_xp: 60,
        xp_reward: 30,
        content: `**Core Principle:** HRV measures the variation in time between consecutive heartbeats and reflects parasympathetic nervous system activity.

**Interpreting HRV Metrics:**
* **High HRV:** Your autonomic nervous system is adaptable, recovered, and ready for high intensity.
* **Low HRV:** Your body is carrying heavy systemic fatigue, mental stress, or lingering inflammation. Adjust training load accordingly.`,
      },
      {
        id: 'codex-404',
        title: 'Breathwork Protocols for Instant Recovery',
        required_xp: 80,
        xp_reward: 35,
        content: `**Core Principle:** You can manually override sympathetic overdrive by altering your breathing rate and depth.

**Box Breathing Technique (4-4-4-4):**
* Inhale through nose for 4 seconds.
* Hold breath for 4 seconds.
* Exhale smoothly for 4 seconds.
* Hold empty for 4 seconds. Repeat for 3-5 minutes to drop heart rate post-competition.`,
      },
      {
        id: 'codex-405',
        title: 'Periodization of Mental Energy',
        required_xp: 100,
        xp_reward: 40,
        content: `**Core Principle:** You cannot remain at 100% emotional and cognitive intensity year-round without burning out.

**Mental Load Management:**
* **High Intensity Phase (Competition):** Laser focus, strict routines, high arousal management.
* **Maintenance Phase (Mid-Season):** Tactical reflection, balanced stress exposure.
* **Off-Season Decompression:** Complete mental detachment from sport-specific pressures to rebuild long-term competitive hunger.`,
      },
    ],
  },
];

export const CodexActivity = ({ onProgress, onComplete, isSubmitting }) => {
  const [categories, setCategories] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [userXp, setUserXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [completedLessonIds, setCompletedLessonIds] = useState(new Set());
  const [unlockedLessonIds, setUnlockedLessonIds] = useState(new Set());
  const [unlockModalLesson, setUnlockModalLesson] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, progressData] = await Promise.all([
        wellnessService.getCodexCategories().catch(() => null),
        wellnessService.getMyProgress().catch(() => null),
      ]);

      // Use backend data if available, otherwise fallback to local rich content
      const loadedCategories = data?.success && data.categories?.length > 0 ? data.categories : EXTENDED_CATEGORIES;
      setCategories(loadedCategories);

      if (loadedCategories?.[0]?.lessons?.[0]) {
        setSelectedLesson(loadedCategories[0].lessons[0]);
      }

      if (progressData?.progress) {
        const total = progressData.progress.reduce((acc, p) => acc + (p.progress >= 100 ? 25 : 0), 50);
        setUserXp(total);
      } else {
        setUserXp(120); // Default balance for testing
      }
    } catch (err) {
      setCategories(EXTENDED_CATEGORIES);
      if (EXTENDED_CATEGORIES[0]?.lessons?.[0]) {
        setSelectedLesson(EXTENDED_CATEGORIES[0].lessons[0]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSelectLesson = (lesson) => {
    const isLocked = lesson.required_xp > userXp && !unlockedLessonIds.has(lesson.id);
    if (isLocked) {
      setUnlockModalLesson(lesson);
      return;
    }
    setSelectedLesson(lesson);
  };

  const handleConfirmUnlock = (lesson) => {
    if (userXp >= lesson.required_xp) {
      setUnlockedLessonIds((prev) => new Set(prev).add(lesson.id));
      setSelectedLesson(lesson);
      setUnlockModalLesson(null);
    }
  };

  const handleCompleteLesson = async (lesson) => {
    try {
      setActionLoading(true);
      const res = await wellnessService.completeCodexLesson(lesson.id).catch(() => ({ success: true }));
      if (res?.success) {
        setCompletedLessonIds((prev) => new Set(prev).add(lesson.id));
        if (onProgress) onProgress(100, 3);
        if (onComplete) onComplete(100, `Completed lesson: ${lesson.title}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record lesson progress.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-slate-500 font-semibold text-sm">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          Loading sports psychology codex...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* HEADER: POINT BALANCE & PROGRESS */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 p-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700">Athlete Mental Codex</span>
          <h3 className="text-sm font-extrabold text-slate-800">Mastery & Playbook Library</h3>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white border border-indigo-200 px-3 py-1.5 shadow-xs">
          <span className="text-sm">🪙</span>
          <span className="text-xs font-bold text-slate-700">Point Balance:</span>
          <span className="text-xs font-extrabold text-indigo-700">{userXp} XP</span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {/* UNLOCK CONFIRMATION MODAL */}
      {unlockModalLesson && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-extrabold text-amber-900 flex items-center gap-2">
              <span>🔒</span> Unlock Lesson: {unlockModalLesson.title}
            </h4>
            <button onClick={() => setUnlockModalLesson(null)} className="text-xs font-bold text-amber-700">✕</button>
          </div>
          <p className="text-xs text-amber-800">
            This lesson requires <strong>{unlockModalLesson.required_xp} XP</strong> to unlock.
            {userXp >= unlockModalLesson.required_xp
              ? ' You have sufficient points to unlock this playbook now.'
              : ` You need ${unlockModalLesson.required_xp - userXp} more XP points.`}
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setUnlockModalLesson(null)}
              className="rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-800"
            >
              Cancel
            </button>
            {userXp >= unlockModalLesson.required_xp && (
              <button
                onClick={() => handleConfirmUnlock(unlockModalLesson)}
                className="rounded-xl bg-amber-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700"
              >
                Confirm Unlock
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        {/* CATEGORY & LESSONS LIST */}
        <div className="space-y-4 max-h-150 overflow-y-auto pr-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Categories & Lessons ({categories.reduce((acc, c) => acc + (c.lessons?.length || 0), 0)})</h3>
          <div className="space-y-3">
            {categories.map((cat) => (
              <div key={cat.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">{cat.name}</div>
                <div className="mt-2 space-y-1">
                  {cat.lessons?.map((lesson) => {
                    const isSelected = selectedLesson?.id === lesson.id;
                    const isDone = completedLessonIds.has(lesson.id) || lesson.user_status === 'completed';
                    const isLocked = lesson.required_xp > userXp && !unlockedLessonIds.has(lesson.id);

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => handleSelectLesson(lesson)}
                        className={`w-full text-left rounded-xl p-2.5 text-xs font-semibold transition flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{lesson.title}</span>
                        <span className="shrink-0 text-[10px]">
                          {isDone ? (
                            <span className="font-extrabold text-emerald-400">✓ Done</span>
                          ) : isLocked ? (
                            <span className={isSelected ? 'text-indigo-200' : 'text-slate-400'}>🔒 {lesson.required_xp} XP</span>
                          ) : (
                            <span className={isSelected ? 'text-indigo-200' : 'text-indigo-600'}>▶ Open</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LESSON READING VIEWER */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
          {selectedLesson ? (
            <>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Playbook Reading</span>
                  <h3 className="text-xl font-extrabold text-slate-800 mt-0.5">{selectedLesson.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-extrabold text-emerald-700">
                    +{selectedLesson.xp_reward || 20} XP Reward
                  </span>
                </div>
              </div>

              <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-line text-sm space-y-3">
                {selectedLesson.content}
              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end">
                <button
                  onClick={() => handleCompleteLesson(selectedLesson)}
                  disabled={actionLoading || isSubmitting || completedLessonIds.has(selectedLesson.id)}
                  className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  {completedLessonIds.has(selectedLesson.id)
                    ? '✓ Completed'
                    : actionLoading
                    ? 'Saving Progress...'
                    : '✓ Complete Lesson & Claim XP'}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <div className="text-4xl mb-2">📖</div>
              <p className="text-sm">Select a lesson from the left panel to begin reading.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};