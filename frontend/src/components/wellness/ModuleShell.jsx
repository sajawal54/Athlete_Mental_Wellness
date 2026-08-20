/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect, useCallback } from 'react'; 
import { useNavigate } from 'react-router-dom'; 
import { wellnessService } from '../../services/wellnessServices/wellnessService'; 
 
export const STEPS = { 
  INTRO: 'intro', 
  INSTRUCTIONS: 'instructions', 
  ACTIVITY: 'activity', 
  RESULT: 'result', 
  COMPLETION: 'completion', 
}; 
 
export const ModuleShell = ({ slug, children, onRefreshUserData }) => { 
  const navigate = useNavigate(); 
 
  const [currentStep, setCurrentStep] = useState(STEPS.INTRO); 
  const [module, setModule] = useState(null); 
  const [session, setSession] = useState(null); 
  const [progressPercent, setProgressPercent] = useState(0); 
  const [loading, setLoading] = useState(true); 
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [error, setError] = useState(null); 
  const [completionResult, setCompletionResult] = useState(null); 
 
  // Fetch module detail and restore user progress state 
  const loadModuleData = useCallback(async () => { 
    if (!slug) return; 
    try { 
      setLoading(true); 
      setError(null); 
 
      const res = await wellnessService.getModuleDetail(slug); 
      if (res?.success && res.module) { 
        const mod = res.module; 
        setModule(mod); 
 
        const savedProgress = mod.user_progress?.progress || 0; 
        setProgressPercent(savedProgress); 
 
        // Restore step state 
        if (mod.user_status === 'completed') { 
          setCurrentStep(STEPS.COMPLETION); 
          setProgressPercent(100); 
        } else if (mod.user_status === 'in_progress') { 
          // If already in progress, navigate directly to activity or instructions 
          const stepNum = mod.user_progress?.current_step || 1; 
          setCurrentStep(stepNum >= 2 ? STEPS.ACTIVITY : STEPS.INSTRUCTIONS); 
        } else { 
          setCurrentStep(STEPS.INTRO); 
        } 
      } else { 
        setError('Module not found or currently unavailable.'); 
      } 
    } catch (err) { 
      console.error('Module load error:', err); 
      setError(err.response?.data?.message || 'Failed to connect to the wellness service. Please check your network.'); 
    } finally { 
      setLoading(false); 
    } 
  }, [slug]); 
 
  useEffect(() => { 
    const timer = setTimeout(() => { 
      loadModuleData(); 
    }, 0); 
 
    return () => clearTimeout(timer); 
  }, [loadModuleData]); 
 
  // Start activity session 
  const handleStartActivity = async () => { 
    try { 
      setIsSubmitting(true); 
      setError(null); 
      const res = await wellnessService.startModule(slug); 
      if (res?.success) { 
        if (res.session) setSession(res.session); 
        setCurrentStep(STEPS.ACTIVITY); 
        setProgressPercent(Math.max(25, progressPercent)); 
        await wellnessService.updateProgress(slug, Math.max(25, progressPercent), 2); 
        if (onRefreshUserData) onRefreshUserData(); 
      } 
    } catch (err) { 
      setError(err.response?.data?.message || 'Could not initialize module session. Please retry.'); 
    } finally { 
      setIsSubmitting(false); 
    } 
  }; 
 
  // Real-time progress updates from child activity 
  const handleStepProgress = async (percent, stepNumber = 2, sessionData = null) => { 
    const clamped = Math.max(0, Math.min(100, Math.round(percent))); 
    setProgressPercent(clamped); 
    try { 
      await wellnessService.updateProgress(slug, clamped, stepNumber, sessionData); 
      if (onRefreshUserData) onRefreshUserData(); 
    } catch (err) { 
      console.error('Progress sync error:', err); 
    } 
  }; 
 
  // Complete activity and claim reward 
  const handleActivityComplete = async (score = 0, customFeedback = null) => { 
    try { 
      setIsSubmitting(true); 
      setError(null); 
 
      const res = await wellnessService.completeModule(slug, session?.id, score); 
      if (res?.success) { 
        setCompletionResult({ 
          ...res, 
          customFeedback, 
          score, 
        }); 
        setProgressPercent(100); 
        setCurrentStep(STEPS.COMPLETION); 
        if (onRefreshUserData) onRefreshUserData(); 
      } 
    } catch (err) { 
      setError(err.response?.data?.message || 'Failed to record completion. Please retry.'); 
    } finally { 
      setIsSubmitting(false); 
    } 
  }; 
 
  // Loading State Skeleton 
  if (loading) { 
    return ( 
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm"> 
        <div className="flex flex-col items-center justify-center gap-4"> 
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" /> 
          <p className="text-sm font-semibold text-slate-600">Loading module workspace...</p> 
        </div> 
      </div> 
    ); 
  } 
 
  // Error State with Retry 
  if (error && !module) { 
    return ( 
      <div className="mx-auto max-w-xl rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center shadow-sm"> 
        <div className="text-4xl mb-3">⚠️</div> 
        <h3 className="text-lg font-bold text-rose-800">Unable to load module</h3> 
        <p className="mt-2 text-sm text-rose-600">{error}</p> 
        <div className="mt-6 flex justify-center gap-3"> 
          <button 
            onClick={() => navigate('/wellness')} 
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" 
          > 
            Back to Catalog 
          </button> 
          <button 
            onClick={loadModuleData} 
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 shadow-sm" 
          > 
            Retry 
          </button> 
        </div> 
      </div> 
    ); 
  } 
 
  // Locked Module Guard 
  if (module?.user_status === 'locked') { 
    return ( 
      <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-md"> 
        <div className="text-6xl mb-4">🔒</div> 
        <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800"> 
          Module Locked 
        </span> 
        <h2 className="mt-3 text-2xl font-black text-slate-800">{module.name}</h2> 
        <p className="mt-2 text-sm text-slate-600"> 
          This mental wellness module requires at least <strong className="text-indigo-700 font-bold">{module.required_xp} XP</strong> to unlock. 
        </p> 
        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500"> 
          Complete earlier modules, daily goals, or mood check-ins to increase your XP and unlock advanced mental training. 
        </div> 
        <button 
          onClick={() => navigate('/wellness')} 
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 shadow-sm transition" 
        > 
          Explore Available Modules 
        </button> 
      </div> 
    ); 
  } 
 
  return ( 
    <div className="space-y-6"> 
      {/* MODULE SHELL HEADER */} 
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg"> 
        <div className="p-6 md:p-8"> 
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"> 
            <div className="flex items-center gap-4"> 
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-3xl backdrop-blur-md shadow-inner"> 
                {module?.icon || '🧩'} 
              </div> 
              <div> 
                <div className="flex items-center gap-2"> 
                  <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-300 border border-indigo-400/20"> 
                    {module?.module_type?.replace(/_/g, ' ') || 'Wellness'} 
                  </span> 
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${ 
                    module?.user_status === 'completed' 
                      ? 'border-emerald-400/30 bg-emerald-500/20 text-emerald-300' 
                      : 'border-indigo-400/30 bg-indigo-500/20 text-indigo-200' 
                  }`}> 
                    {module?.user_status || 'Available'} 
                  </span> 
                </div> 
                <h1 className="mt-1 text-2xl md:text-3xl font-black tracking-tight text-white">{module?.name}</h1> 
              </div> 
            </div> 
 
            <div className="flex items-center gap-3"> 
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur-sm"> 
                <span className="text-lg">🏆</span> 
                <div> 
                  <div className="text-[10px] uppercase tracking-wider text-indigo-200">Completion Reward</div> 
                  <div className="text-sm font-extrabold text-emerald-400">+{module?.xp_reward || 25} XP</div> 
                </div> 
              </div> 
            </div> 
          </div> 
 
          {/* SHARED FLOW STEP TABS */} 
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4"> 
            <button 
              onClick={() => setCurrentStep(STEPS.INTRO)} 
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${ 
                currentStep === STEPS.INTRO 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'bg-white/5 text-slate-300 hover:bg-white/10' 
              }`} 
            > 
              1. Introduction 
            </button> 
            <button 
              onClick={() => setCurrentStep(STEPS.INSTRUCTIONS)} 
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${ 
                currentStep === STEPS.INSTRUCTIONS 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'bg-white/5 text-slate-300 hover:bg-white/10' 
              }`} 
            > 
              2. Instructions 
            </button> 
            <button 
              onClick={() => setCurrentStep(STEPS.ACTIVITY)} 
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${ 
                currentStep === STEPS.ACTIVITY 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'bg-white/5 text-slate-300 hover:bg-white/10' 
              }`} 
            > 
              3. Interactive Activity 
            </button> 
            {module?.user_status === 'completed' || completionResult ? ( 
              <button 
                onClick={() => setCurrentStep(STEPS.COMPLETION)} 
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${ 
                  currentStep === STEPS.COMPLETION 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'bg-white/5 text-emerald-300 hover:bg-white/10' 
                }`} 
              > 
                ✓ 4. Completion & Reward 
              </button> 
            ) : null} 
          </div> 
        </div> 
      </div> 
 
      {/* ERROR BANNER IF ANY */} 
      {error && ( 
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center justify-between"> 
          <span>⚠️ {error}</span> 
          <button onClick={() => setError(null)} className="text-xs font-bold text-rose-800 underline">Dismiss</button> 
        </div> 
      )} 
 
      {/* MAIN SHELL LAYOUT: CONTENT + SIDEBAR */} 
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]"> 
        {/* LEFT COLUMN: ACTIVE STEP COMPONENT */} 
        <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm"> 
          {/* 1. INTRO STEP */} 
          {currentStep === STEPS.INTRO && ( 
            <div className="space-y-6"> 
              <div> 
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">Step 1 of 3</div> 
                <h2 className="mt-1 text-2xl font-black text-slate-800">Module Overview</h2> 
              </div> 
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-6"> 
                <p className="text-base leading-relaxed text-slate-700"> 
                  {module?.description || 'Explore this mental training module to build resilience and peak athletic focus.'} 
                </p> 
              </div> 
              <div className="flex flex-wrap gap-4 pt-2"> 
                <button 
                  onClick={() => setCurrentStep(STEPS.INSTRUCTIONS)} 
                  className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition" 
                > 
                  View Step-by-Step Instructions → 
                </button> 
              </div> 
            </div> 
          )} 
 
          {/* 2. INSTRUCTIONS STEP */} 
          {currentStep === STEPS.INSTRUCTIONS && ( 
            <div className="space-y-6"> 
              <div> 
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">Step 2 of 3</div> 
                <h2 className="mt-1 text-2xl font-black text-slate-800">Activity Instructions</h2> 
              </div> 
              <div className="rounded-2xl bg-indigo-50/60 border border-indigo-100 p-6 text-slate-700"> 
                <p className="text-base leading-relaxed whitespace-pre-line"> 
                  {module?.instructions || 'Follow the interactive prompts inside the workspace and complete all steps to claim your reward.'} 
                </p> 
              </div> 
              <div className="flex flex-wrap items-center gap-3 pt-2"> 
                <button 
                  onClick={() => setCurrentStep(STEPS.INTRO)} 
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50" 
                > 
                  ← Back to Overview 
                </button> 
                <button 
                  onClick={handleStartActivity} 
                  disabled={isSubmitting} 
                  className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-60 transition" 
                > 
                  {isSubmitting ? 'Preparing Activity...' : 'Start Activity Now →'} 
                </button> 
              </div> 
            </div> 
          )} 
 
          {/* 3. INTERACTIVE ACTIVITY STEP */} 
          {currentStep === STEPS.ACTIVITY && ( 
            <div> 
              {React.isValidElement(children) 
                ? React.cloneElement(children, { 
                    module, 
                    session, 
                    onProgress: handleStepProgress, 
                    onComplete: handleActivityComplete, 
                    isSubmitting, 
                    onRefreshUserData, 
                  }) 
                : children} 
            </div> 
          )} 
 
          {/* 4. COMPLETION STEP */} 
          {currentStep === STEPS.COMPLETION && ( 
            <div className="py-8 text-center space-y-6"> 
              <div className="text-6xl animate-bounce">🎉</div> 
              <div> 
                <h2 className="text-3xl font-black text-slate-800">Module Completed!</h2> 
                <p className="mt-2 max-w-md mx-auto text-sm text-slate-600"> 
                  {completionResult?.already_completed 
                    ? 'You have already recorded this completion and claimed the reward.' 
                    : `Excellent work! You earned +${completionResult?.xp_awarded ?? module?.xp_reward ?? 25} XP towards your athlete level.`} 
                </p> 
              </div> 
 
              <div className="inline-flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-3 text-emerald-800"> 
                <span className="text-xl">🏆</span> 
                <span className="font-extrabold text-sm"> 
                  +{completionResult?.xp_awarded ?? module?.xp_reward ?? 25} XP Credited to Profile 
                </span> 
              </div> 
 
              <div className="flex flex-wrap justify-center gap-4 pt-4"> 
                <button 
                  onClick={() => setCurrentStep(STEPS.ACTIVITY)} 
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50" 
                > 
                  Practice Again 
                </button> 
                <button 
                  onClick={() => navigate('/wellness')} 
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700" 
                > 
                  Explore More Wellness Modules 
                </button> 
              </div> 
            </div> 
          )} 
        </div> 
 
        {/* RIGHT COLUMN: MODULE METRICS & PERSISTENCE SIDEBAR */} 
        <aside className="space-y-5"> 
          {/* PROGRESS CARD */} 
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"> 
            <div className="flex items-center justify-between text-sm font-bold"> 
              <span className="text-slate-500 uppercase text-xs tracking-wider">Overall Progress</span> 
              <span className="text-indigo-600 font-extrabold">{progressPercent}%</span> 
            </div> 
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100"> 
              <div 
                className="h-full rounded-full bg-linear-to-r from-indigo-500 to-indigo-600 transition-all duration-500" 
                style={{ width: `${progressPercent}%` }} 
              /> 
            </div> 
            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500"> 
              {module?.user_status === 'completed' 
                ? '✓ Completed and reward claimed.' 
                : 'Your progress is automatically saved.'} 
            </div> 
          </div> 
 
          {/* FLOW INFO */} 
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"> 
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Module Flow</div> 
            <ul className="space-y-2.5 text-xs text-slate-600"> 
              <li className="flex items-center gap-2"> 
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px]">1</span> 
                <span>Introduction & Context</span> 
              </li> 
              <li className="flex items-center gap-2"> 
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px]">2</span> 
                <span>Exercise Instructions</span> 
              </li> 
              <li className="flex items-center gap-2"> 
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px]">3</span> 
                <span>Interactive Performance Activity</span> 
              </li> 
              <li className="flex items-center gap-2"> 
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px]">4</span> 
                <span>Real-Time Feedback & Scoring</span> 
              </li> 
              <li className="flex items-center gap-2"> 
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px]">5</span> 
                <span>Completion & XP Reward</span> 
              </li> 
            </ul> 
          </div> 
        </aside> 
      </div> 
    </div> 
  ); 
}; 