'use client';
import { useState } from 'react';
import { SchedulePlan, WeeklyTask } from '@/types/planner';
import { COLORS } from '@/lib/colors';

interface RhythmSectionProps {
  plan: SchedulePlan;
  onPlanChange: (updatedPlan: SchedulePlan) => void;
}

interface TasksSectionProps {
  plan: SchedulePlan;
  onPlanChange: (updatedPlan: SchedulePlan) => void;
}

function generateUid(): string {
  return Math.random().toString(36).slice(2, 9);
}

// 1. Separate WeeklyRhythm Component
export function WeeklyRhythm({ plan, onPlanChange }: RhythmSectionProps) {
  const [editingDayTopic, setEditingDayTopic] = useState<string | null>(null);
  const [editingDayBadge, setEditingDayBadge] = useState<string | null>(null);

  const handleRhythmTopicChange = (dayName: string, value: string) => {
    const updatedRhythm = plan.weeklyRhythm.map((r) =>
      r.day === dayName ? { ...r, topic: value } : r
    );
    onPlanChange({ ...plan, weeklyRhythm: updatedRhythm });
  };

  const handleRhythmDayTypeChange = (dayName: string, dayTypeId: string) => {
    const updatedRhythm = plan.weeklyRhythm.map((r) =>
      r.day === dayName ? { ...r, dayTypeId } : r
    );
    onPlanChange({ ...plan, weeklyRhythm: updatedRhythm });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', marginTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Weekly Rhythm
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 w-full">
        {plan.weeklyRhythm.map((day) => {
          const dayType = plan.dayTypes.find((dt) => dt.id === day.dayTypeId) || plan.dayTypes[0];
          const dtAccentColor = dayType?.accentColor || 'gray';
          const colorConfig = COLORS[dtAccentColor] || COLORS.gray;

          return (
            <div
              key={day.day}
              className="border border-solid border-[var(--color-border-tertiary)] bg-[#1e1e1c] rounded-xl p-3 flex flex-col items-center justify-between text-center min-h-[96px] transition-all hover:border-gray-700"
            >
              {/* Day name (Mon, Tue, etc.) */}
              <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                {day.day.substring(0, 3)}
              </span>

              {/* Day type badge picker */}
              {editingDayBadge === day.day ? (
                <select
                  value={day.dayTypeId}
                  onChange={(e) => {
                    handleRhythmDayTypeChange(day.day, e.target.value);
                    setEditingDayBadge(null);
                  }}
                  onBlur={() => setEditingDayBadge(null)}
                  autoFocus
                  className="text-[10px] px-1 py-0.5 border border-solid border-gray-700 rounded bg-[#252523] text-white focus:outline-none w-full"
                >
                  {plan.dayTypes.map((dt) => (
                    <option key={dt.id} value={dt.id}>
                      {dt.name}
                    </option>
                  ))}
                </select>
              ) : (
                <button
                  onClick={() => setEditingDayBadge(day.day)}
                  className="px-2.5 py-0.5 text-[9px] font-bold rounded-full cursor-pointer transition-colors max-w-full truncate text-center"
                  style={{
                    backgroundColor: colorConfig.light,
                    color: colorConfig.dark,
                    border: `0.5px solid ${colorConfig.hex}`,
                  }}
                >
                  {dayType?.name || 'Day'}
                </button>
              )}

              {/* Topic display and input */}
              {editingDayTopic === day.day ? (
                <input
                  type="text"
                  defaultValue={day.topic}
                  onBlur={(e) => {
                    handleRhythmTopicChange(day.day, e.target.value);
                    setEditingDayTopic(null);
                  }}
                  autoFocus
                  className="text-[10px] text-center p-0.5 border border-solid border-gray-700 rounded bg-[#252523] text-white focus:outline-none w-full mt-2"
                />
              ) : (
                <div
                  onClick={() => setEditingDayTopic(day.day)}
                  className="text-[11px] text-white font-medium mt-2 cursor-pointer hover:text-[#7F77DD] truncate w-full min-h-[14px]"
                  title={day.topic}
                >
                  {day.topic || 'edit...'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 2. Separate WeeklyTasks Component
export function WeeklyTasks({ plan, onPlanChange }: TasksSectionProps) {
  const handleTaskToggle = (taskId: string, done: boolean) => {
    const updatedTasks = plan.weeklyTasks.map((t) =>
      t.id === taskId ? { ...t, done } : t
    );
    onPlanChange({ ...plan, weeklyTasks: updatedTasks });
  };

  const handleTaskTitleBlur = (taskId: string, title: string) => {
    const updatedTasks = plan.weeklyTasks.map((t) =>
      t.id === taskId ? { ...t, title } : t
    );
    onPlanChange({ ...plan, weeklyTasks: updatedTasks });
  };

  const handleAddTask = () => {
    const newId = generateUid();
    const newTask: WeeklyTask = {
      id: newId,
      title: 'New task',
      category: 'General',
      done: false,
    };
    onPlanChange({
      ...plan,
      weeklyTasks: [...plan.weeklyTasks, newTask],
    });

    setTimeout(() => {
      const el = document.getElementById(`task-title-${newId}`);
      if (el) {
        el.focus();
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }, 50);
  };

  const remainingCount = plan.weeklyTasks.filter((t) => !t.done).length;

  const sortedTasks = [...plan.weeklyTasks].sort((a, b) => {
    if (a.done === b.done) return 0;
    return a.done ? 1 : -1;
  });

  const getCategoryColor = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('goal')) return COLORS.purple;
    if (cat.includes('habit')) return COLORS.amber;
    if (cat.includes('wellness')) return COLORS.teal;
    if (cat.includes('mindset') || cat.includes('creative')) return COLORS.coral;
    return COLORS.gray;
  };

  return (
    <div style={{
      background: 'var(--color-background-primary)',
      border: '0.5px solid var(--color-border-tertiary)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '1.25rem',
      marginTop: '1.5rem',
      width: '100%',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="ti ti-checklist" style={{ fontSize: 18, color: '#7F77DD' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
            Weekly Tasks ({remainingCount} remaining)
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
        {sortedTasks.map((task) => {
          const catColor = getCategoryColor(task.category);
          return (
            <div
              key={task.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                opacity: task.done ? 0.5 : 1,
                transition: 'opacity 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={(e) => handleTaskToggle(task.id, e.target.checked)}
                  className="w-4 h-4 accent-[#7F77DD] cursor-pointer rounded"
                />
                <span
                  id={`task-title-${task.id}`}
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleTaskTitleBlur(task.id, e.currentTarget.innerText)}
                  style={{
                    fontSize: '12px',
                    color: '#fff',
                    textDecoration: task.done ? 'line-through' : 'none',
                    outline: 'none',
                  }}
                  className="flex-1 min-w-0"
                >
                  {task.title}
                </span>
              </div>

              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '9999px',
                  backgroundColor: catColor.light,
                  color: catColor.dark,
                  border: `0.5px solid ${catColor.hex}`,
                }}
                className="flex-shrink-0"
              >
                {task.category || 'General'}
              </span>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleAddTask}
        className="w-full text-center py-1.5 mt-3 border border-dashed border-[#7F77DD] rounded-md text-xs text-[#7F77DD] hover:bg-[#EEEDFE] cursor-pointer transition-colors font-semibold"
      >
        <i className="ti ti-plus" style={{ fontSize: 11, verticalAlign: -1, marginRight: 4 }} />
        Add task
      </button>
    </div>
  );
}
