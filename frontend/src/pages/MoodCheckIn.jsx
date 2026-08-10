import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Added for module navigation
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'; // Added for Trend Chart
import { moodService } from '../services/moodService';

const MOOD_OPTIONS = [
  { id: 'great', label: 'Energized', emoji: '🔥' },
  { id: 'good', label: 'Focused', emoji: '😌' },
  { id: 'neutral', label: 'Neutral', emoji: '😐' },
  { id: 'anxious', label: 'Stressed', emoji: '😰' },
  { id: 'exhausted', label: 'Exhausted', emoji: '😫' },
];

// Activity Recommendations based on logged mood
const RECOMMENDED_ACTIVITIES = {
  anxious: { title: 'Deep Breathing Exercise', path: '/breathing', icon: '🫁' },
  exhausted: { title: 'Rest & Recovery Protocol', path: '/breathing', icon: '🌬️' },
  neutral: { title: 'Focus & Mindfulness', path: '/mindfulness', icon: '🧘' },
  good: { title: 'Gratitude Reflection', path: '/journal', icon: '📝' },
  great: { title: 'Performance Visualization', path: '/visualization', icon: '⚡' },
};

// Numeric scores for Y-Axis rendering in Recharts
const MOOD_SCORE_MAP = {
  exhausted: 1,
  anxious: 2,
  neutral: 3,
  good: 4,
  great: 5,
};

export default function MoodCheckIn() {
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState(null);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [notes, setNotes] = useState('');

  const [history, setHistory] = useState([]);
  const [aiMessage, setAiMessage] = useState('');
  const [lastSubmittedMood, setLastSubmittedMood] = useState(null); // Track last submitted mood for activity link
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Load mood history on initial page render
  useEffect(() => {
    fetchMoodHistory();
  }, []);

  const fetchMoodHistory = async () => {
    try {
      const data = await moodService.getMoods();
      setHistory(data);
    } catch (err) {
      setError('Failed to load mood history. Please try refreshing.');
    }
  };

  // 2. Handle Check-In Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setAiMessage('');

    if (!selectedMood) {
      setError('Please select a mood option first!');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        mood: selectedMood.id,
        emoji: selectedMood.emoji,
        energy_level: parseInt(energyLevel, 10),
        notes: notes.trim()
      };

      const newEntry = await moodService.addMood(payload);

      // Prepend newly saved entry and set AI feedback
      setHistory([newEntry, ...history]);
      if (newEntry.ai_message) {
        setAiMessage(newEntry.ai_message);
      }

      setLastSubmittedMood(selectedMood.id);

      // Reset Input Form State
      setSelectedMood(null);
      setNotes('');
      setEnergyLevel(3);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to save your check-in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Delete Entry Handler
  const handleDelete = async (id) => {
    try {
      await moodService.deleteMood(id);
      setHistory(history.filter((item) => item.id !== id));
    } catch (err) {
      alert('Unable to delete this record. Please try again.');
    }
  };

  // Prepare chart data (Chronological order - last 7 entries)
  const chartData = [...history]
    .reverse()
    .slice(-7)
    .map((item) => ({
      date: new Date(item.created_at || item.date || Date.now()).toLocaleDateString('en-US', { weekday: 'short' }),
      score: MOOD_SCORE_MAP[item.mood] || 3,
      moodLabel: item.mood,
    }));

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      
      {/* Primary Check-In Form */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
        <h2 className="text-lg font-bold text-slate-800">Daily Mood Check-In</h2>

        {/* Dynamic English Error Alert */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Step 1: Mood Choice */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">
              1. Select Your Current Mood
            </label>
            <div className="grid grid-cols-5 gap-2">
              {MOOD_OPTIONS.map((m) => {
                const isSelected = selectedMood?.id === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMood(m)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1 text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-600 ring-2 ring-indigo-600'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Energy Level Slider */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">
              2. Energy Level ({energyLevel} / 5)
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={energyLevel}
              onChange={(e) => setEnergyLevel(e.target.value)}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* Step 3: Optional Notes */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">
              <span>3. Optional Journal Notes</span>
              <span className="text-slate-400 font-normal">{notes.length}/300</span>
            </div>
            <textarea
              maxLength={300}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How are you feeling today? (Optional)"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Action Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving Entry...' : 'Save Check-In'}
          </button>
        </form>
      </div>

      {/* AI Insight Response Box with Deep Breath / Recommended Activity Button */}
      {aiMessage && (
        <div className="bg-indigo-900 text-white p-5 rounded-2xl shadow-sm space-y-3">
          <div>
            <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">🤖 AI Insight</p>
            <p className="text-sm font-medium leading-relaxed mt-1">{aiMessage}</p>
          </div>

          {/* Recommended Exercise Button */}
          {lastSubmittedMood && RECOMMENDED_ACTIVITIES[lastSubmittedMood] && (
            <div className="pt-3 border-t border-indigo-800/80 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-indigo-200">
                {RECOMMENDED_ACTIVITIES[lastSubmittedMood].icon} Recommended: {RECOMMENDED_ACTIVITIES[lastSubmittedMood].title}
              </span>
              <button
                onClick={() => navigate(RECOMMENDED_ACTIVITIES[lastSubmittedMood].path)}
                className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Start Activity ➔
              </button>
            </div>
          )}
        </div>
      )}

      {/* Weekly Mood Trend Chart */}
      {history.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            📈 Mood Trend (Last 7 Entries)
          </h3>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip formatter={(value, name, props) => [`Score: ${value} (${props.payload.moodLabel})`, 'Mood']} />
                <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 4, fill: '#4f46e5' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Historical Logs Listing */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Previous Records ({history.length})
        </h3>

        {history.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No check-in entries logged yet.</p>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.emoji}</span>
                  <div>
                    <p className="font-bold text-slate-800 capitalize">
                      {item.mood} <span className="text-slate-400 font-normal">(Energy: {item.energy_level}/5)</span>
                    </p>
                    {item.notes && <p className="text-slate-600 mt-0.5">{item.notes}</p>}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-red-500 font-semibold hover:underline"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}