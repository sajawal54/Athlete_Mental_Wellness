import React, { useState, useEffect } from 'react';
import { goalService } from '../services/goalService';

const CATEGORY_COLORS = {
  Mindfulness: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Recovery: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Physical: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Reflection: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Custom Goal Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Mindfulness');
  const [newPoints, setNewPoints] = useState(15);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Goals from Backend
  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await goalService.getDailyGoals();
      setGoals(data);
    } catch (err) {
      setError('Failed to load goals from server. Make sure your Django backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Completion
  const handleToggle = async (goalId) => {
    const originalGoals = [...goals];
    setGoals(goals.map((g) => g.id === goalId ? { ...g, is_completed: !g.is_completed } : g));

    try {
      await goalService.toggleGoalComplete(goalId);
    } catch (err) {
      setGoals(originalGoals);
      alert('Unable to update goal status on server.');
    }
  };

  // Create Goal
  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSubmitting(true);
    try {
      const payload = {
        title: newTitle.trim(),
        category: newCategory,
        points: Number(newPoints),
      };

      const savedGoal = await goalService.addGoal(payload);
      setGoals([savedGoal, ...goals]);
      
      setNewTitle('');
      setShowAddForm(false);
    } catch (err) {
      alert('Failed to save goal.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Goal
  const handleDelete = async (goalId) => {
    const originalGoals = [...goals];
    setGoals(goals.filter((g) => g.id !== goalId));

    try {
      await goalService.deleteGoal(goalId);
    } catch (err) {
      setGoals(originalGoals);
      alert('Failed to delete goal.');
    }
  };

  // Stats Calculations
  const completedCount = goals.filter((g) => g.is_completed).length;
  const totalGoals = goals.length;
  const progressPercent = totalGoals > 0 ? Math.round((completedCount / totalGoals) * 100) : 0;
  const totalEarnedXP = goals
    .filter((g) => g.is_completed)
    .reduce((acc, curr) => acc + curr.points, 0);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-linear-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-200">Daily Target System</span>
            <h1 className="text-2xl font-black mt-1">Daily Wellness Goals</h1>
            <p className="text-xs text-indigo-100 mt-1">Complete targets to build streak and earn XP points.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-xl border border-white/20 text-center sm:text-right">
            <span className="text-3xl font-black block leading-none">{totalEarnedXP}</span>
            <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">Earned XP Today</span>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs font-bold">
            <span>Progress ({completedCount}/{totalGoals} Completed)</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full h-3 bg-indigo-950/40 rounded-full overflow-hidden p-0.5 border border-indigo-400/30">
            <div
              className="h-full bg-white rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Action Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
          Today's Active Targets ({totalGoals})
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
        >
          {showAddForm ? 'Cancel' : '+ Add Custom Goal'}
        </button>
      </div>

      {/* Add Custom Goal Form */}
      {showAddForm && (
        <form onSubmit={handleAddGoal} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Create Custom Daily Goal</h3>
          <div>
            <input
              type="text"
              required
              placeholder="Goal title (e.g., 10 min Mindful Breathing)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
              >
                <option value="Mindfulness">Mindfulness</option>
                <option value="Recovery">Recovery</option>
                <option value="Physical">Physical</option>
                <option value="Reflection">Reflection</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">XP Points Reward</label>
              <input
                type="number"
                min="5"
                max="100"
                value={newPoints}
                onChange={(e) => setNewPoints(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Saving...' : 'Save New Target'}
          </button>
        </form>
      )}

      {/* Goal List */}
      {loading ? (
        <div className="text-center py-12 text-xs font-bold text-slate-500">Loading daily goals...</div>
      ) : goals.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-500">
          No goals created for today yet. Click "+ Add Custom Goal" to start!
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const isDone = goal.is_completed;
            return (
              <div
                key={goal.id}
                className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                  isDone
                    ? 'bg-slate-900/50 border-slate-800/60 opacity-65'
                    : 'bg-slate-900 border-slate-800 hover:border-indigo-500/50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <button
                    type="button"
                    onClick={() => handleToggle(goal.id)}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                      isDone
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-700 hover:border-indigo-500'
                    }`}
                  >
                    {isDone && <span className="text-xs font-bold">✓</span>}
                  </button>

                  <div>
                    <p className={`text-xs font-bold ${isDone ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                      {goal.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${CATEGORY_COLORS[goal.category] || 'bg-slate-800 text-slate-400'}`}>
                        {goal.category}
                      </span>
                      <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                        +{goal.points} XP
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(goal.id)}
                  className="text-slate-500 hover:text-red-400 text-xs font-bold transition-colors p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}