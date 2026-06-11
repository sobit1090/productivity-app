'use client';
import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SchedulePlan, DayType, TimeBlock as TimeBlockType } from '@/types/planner';
import { COLORS } from '@/lib/colors';
import { TimeBlock } from './time-block';
import { WeeklyRhythm, WeeklyTasks } from './weekly-sidebar';

interface PlannerViewProps {
  plan: SchedulePlan;
  showSaved: boolean;
  onPlanChange: (updatedPlan: SchedulePlan) => void;
  onRestart: () => void;
  onRegenerate: () => void;
}

function generateUid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function isTimeBetween(current: string, start: string, end: string): boolean {
  if (!current || !start || !end) return false;
  
  const toMins = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
  };
  
  const cVal = toMins(current);
  const sVal = toMins(start);
  const eVal = toMins(end);

  if (sVal <= eVal) {
    return cVal >= sVal && cVal < eVal;
  } else {
    // Crosses midnight, e.g. 22:00 to 02:00
    return cVal >= sVal || cVal < eVal;
  }
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

export function PlannerView({
  plan,
  showSaved,
  onPlanChange,
  onRestart,
  onRegenerate,
}: PlannerViewProps) {
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [dayToDelete, setDayToDelete] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Track current real-world time for highlighting running activity blocks
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hrs}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Set initial active tab dynamically based on today's real-world day of the week from the Weekly Rhythm
  useEffect(() => {
    if (plan.dayTypes.length > 0 && !activeTabId) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayName = days[new Date().getDay()];
      const todayRhythm = plan.weeklyRhythm.find(r => r.day.toLowerCase() === todayName.toLowerCase());
      if (todayRhythm && plan.dayTypes.some(dt => dt.id === todayRhythm.dayTypeId)) {
        setActiveTabId(todayRhythm.dayTypeId);
      } else {
        setActiveTabId(plan.dayTypes[0].id);
      }
    }
  }, [plan.dayTypes, plan.weeklyRhythm, activeTabId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeDayType = plan.dayTypes.find((dt) => dt.id === activeTabId) || plan.dayTypes[0];

  const activeBlock = activeDayType?.blocks.find((block) =>
    currentTime ? isTimeBetween(currentTime, block.startTime, block.endTime) : false
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id && activeDayType) {
      const oldIndex = activeDayType.blocks.findIndex((block) => block.id === active.id);
      const newIndex = activeDayType.blocks.findIndex((block) => block.id === over.id);

      // Keep original ordered times of the slots
      const originalTimes = activeDayType.blocks.map(b => ({
        startTime: b.startTime,
        endTime: b.endTime
      }));

      // Reorder the block objects
      const reorderedBlocks = arrayMove(activeDayType.blocks, oldIndex, newIndex);

      // Re-apply the original slot times to the reordered blocks
      const finalBlocks = reorderedBlocks.map((block, idx) => ({
        ...block,
        startTime: originalTimes[idx].startTime,
        endTime: originalTimes[idx].endTime
      }));

      const updatedDayTypes = plan.dayTypes.map((dt) =>
        dt.id === activeDayType.id ? { ...dt, blocks: finalBlocks } : dt
      );

      onPlanChange({ ...plan, dayTypes: updatedDayTypes });
    }
  };

  const insertBlock = (insertIndex: number) => {
    if (!activeDayType) return;

    const prevBlock = activeDayType.blocks[insertIndex - 1];
    let start = '09:00';
    if (prevBlock) {
      start = prevBlock.endTime;
    }

    const end = addMinutes(start, 60);

    const newBlock: TimeBlockType = {
      id: generateUid(),
      startTime: start,
      endTime: end,
      name: 'New Activity',
      description: 'Activity description',
      colorName: 'gray',
    };

    const updatedBlocks = [...activeDayType.blocks];
    updatedBlocks.splice(insertIndex, 0, newBlock);

    const updatedDayTypes = plan.dayTypes.map((dt) =>
      dt.id === activeDayType.id ? { ...dt, blocks: updatedBlocks } : dt
    );

    onPlanChange({ ...plan, dayTypes: updatedDayTypes });
  };

  const addBlockAtBottom = () => {
    if (!activeDayType) return;
    insertBlock(activeDayType.blocks.length);
  };

  const handleAddDayType = () => {
    let charCode = 65; // Start from 'A'
    let char = String.fromCharCode(charCode);
    while (plan.dayTypes.some(dt => dt.id === `day-${char.toLowerCase()}` || dt.name.toLowerCase() === `day ${char.toLowerCase()}`)) {
      charCode++;
      char = String.fromCharCode(charCode);
    }

    const newDayType: DayType = {
      id: `day-${char.toLowerCase()}`,
      name: `Day ${char}`,
      focusSubtitle: 'New Focus Structure',
      accentColor: 'gray',
      blocks: [
        {
          id: generateUid(),
          startTime: '09:00',
          endTime: '10:00',
          name: 'First session',
          description: 'Focus details',
          colorName: 'purple',
        },
      ],
    };

    onPlanChange({
      ...plan,
      dayTypes: [...plan.dayTypes, newDayType],
    });
    setActiveTabId(newDayType.id);
  };

  const handleDeleteDayType = (idToDelete: string) => {
    if (plan.dayTypes.length <= 1) return;

    const updatedDayTypes = plan.dayTypes.filter((dt) => dt.id !== idToDelete);
    const firstRemainingId = updatedDayTypes[0].id;

    // Update weekly rhythm references
    const updatedWeeklyRhythm = plan.weeklyRhythm.map((r) => {
      if (r.dayTypeId === idToDelete) {
        return { ...r, dayTypeId: firstRemainingId };
      }
      return r;
    });

    onPlanChange({
      ...plan,
      dayTypes: updatedDayTypes,
      weeklyRhythm: updatedWeeklyRhythm,
    });

    if (activeTabId === idToDelete) {
      setActiveTabId(firstRemainingId);
    }
  };

  const handleEditHeaderClick = () => {
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  };

  const isDayA = activeTabId === 'day-a';
  const isDayB = activeTabId === 'day-b';
  const noteValue = isDayA ? plan.noteA : isDayB ? plan.noteB : '';
  const noteColor = isDayA ? COLORS.purple : isDayB ? COLORS.teal : COLORS.gray;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1000, margin: '2rem auto', padding: '0 1rem' }}>
      {/* 1. Premium Header Panel */}
      <div style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderTop: `4px solid ${COLORS[activeDayType?.accentColor || 'purple']?.hex || '#7F77DD'}`,
        borderRadius: 'var(--border-radius-lg)',
        padding: '1.5rem',
      }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <input
              ref={titleInputRef}
              type="text"
              value={plan.title}
              onChange={(e) => onPlanChange({ ...plan, title: e.target.value })}
              className="text-lg md:text-xl font-bold bg-transparent text-[var(--color-text-primary)] w-full border-b border-transparent focus:border-[#7F77DD] focus:outline-none py-0.5"
              placeholder="Plan Title"
            />
            <input
              type="text"
              value={plan.subtitle}
              onChange={(e) => onPlanChange({ ...plan, subtitle: e.target.value })}
              className="text-xs md:text-sm text-[var(--color-text-secondary)] bg-transparent w-full border-b border-transparent focus:border-[#7F77DD] focus:outline-none mt-1.5 py-0.5"
              placeholder="Plan Subtitle"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
            {showSaved && (
              <span className="saved-indicator text-xs text-[#1D9E75] font-semibold mr-1.5 flex items-center gap-1">
                <i className="ti ti-cloud-check" style={{ fontSize: 15 }} />
                Saved
              </span>
            )}

            <button
              onClick={() => setPopupMessage('PDF export is coming soon!')}
              className="px-3.5 py-1.5 text-xs font-semibold border border-solid border-[var(--color-border-secondary)] hover:border-gray-500 rounded-lg bg-[var(--color-background-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-background-secondary)] cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <i className="ti ti-download" style={{ fontSize: 14 }} />
              Export PDF
            </button>

            <button
              onClick={handleEditHeaderClick}
              className="px-3.5 py-1.5 text-xs font-semibold border border-solid border-[var(--color-border-secondary)] hover:border-gray-500 rounded-lg bg-[var(--color-background-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-background-secondary)] cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <i className="ti ti-edit" style={{ fontSize: 14 }} />
              Edit header
            </button>

            <button
              onClick={onRegenerate}
              className="px-3.5 py-1.5 text-xs font-semibold border border-solid border-[var(--color-border-secondary)] hover:border-gray-500 rounded-lg bg-[var(--color-background-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-background-secondary)] cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <i className="ti ti-refresh" style={{ fontSize: 14 }} />
              Regenerate
            </button>

            <button
              onClick={() => setShowRestartConfirm(true)}
              className="px-3.5 py-1.5 text-xs font-semibold border border-solid border-red-950 rounded-lg bg-red-950/20 text-red-400 hover:bg-red-950/40 cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <i className="ti ti-power" style={{ fontSize: 14 }} />
              Restart
            </button>
          </div>
        </div>
      </div>

      {/* 2. Day Type Selection Tabs (Styled like badge colors in PDF) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {plan.dayTypes.map((dt) => {
          const isActive = dt.id === activeTabId;
          const colorConfig = COLORS[dt.accentColor || 'purple'] || COLORS.gray;

          return (
            <button
              key={dt.id}
              onClick={() => setActiveTabId(dt.id)}
              style={isActive ? {
                backgroundColor: colorConfig.hex,
                borderColor: colorConfig.hex,
                color: '#fff',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              } : {
                backgroundColor: colorConfig.light,
                borderColor: colorConfig.hex,
                color: colorConfig.dark,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              className="px-4 py-1.5 text-xs rounded-lg border border-solid transition-all cursor-pointer shadow-sm"
            >
              <span>{dt.name}</span>
              {plan.dayTypes.length > 1 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setDayToDelete(dt.id);
                  }}
                  style={{
                    cursor: 'pointer',
                    opacity: 0.7,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: '2px',
                  }}
                  className="hover:opacity-100 hover:scale-125 transition-all"
                  title={`Delete ${dt.name}`}
                >
                  <i className="ti ti-x" style={{ fontSize: 11, fontWeight: 'bold' }} />
                </span>
              )}
            </button>
          );
        })}

        <button
          onClick={handleAddDayType}
          className="px-4 py-1.5 text-xs font-semibold rounded-lg border border-dashed border-[var(--color-border-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-[var(--color-background-primary)] cursor-pointer transition-colors flex items-center gap-1 flex-shrink-0"
        >
          <i className="ti ti-plus" style={{ fontSize: 11 }} />
          Add day type
        </button>
      </div>

      {/* 3. Solid Accent-Colored Day Focus Title (Table Header Bar) */}
      {activeDayType && (
        <div 
          style={{
            backgroundColor: COLORS[activeDayType.accentColor || 'purple']?.hex || '#888780',
            color: '#fff',
            borderRadius: 'var(--border-radius-lg) var(--border-radius-lg) 0 0',
            padding: '0.65rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 750,
            fontSize: '13px'
          }}
          className="w-full select-none"
        >
          <span className="flex-shrink-0">{activeDayType.name} · Focus:</span>
          <input
            type="text"
            value={activeDayType.focusSubtitle}
            onChange={(e) => {
              const updatedDayTypes = plan.dayTypes.map((dt) =>
                dt.id === activeDayType.id ? { ...dt, focusSubtitle: e.target.value } : dt
              );
              onPlanChange({ ...plan, dayTypes: updatedDayTypes });
            }}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '1px dashed rgba(255,255,255,0.4)',
              color: '#fff',
              outline: 'none',
              fontWeight: 700,
              fontSize: '13px',
              flex: 1,
              padding: 0
            }}
            placeholder="Focus area (e.g. GATE Core + Aptitude)"
          />
        </div>
      )}

      {/* 4. Timetable Cards Container (Flush below the focus header bar) */}
      <div style={{
        background: 'var(--color-background-secondary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: '0 0 var(--border-radius-lg) var(--border-radius-lg)',
        borderTop: 'none',
        padding: '1.25rem',
        marginTop: '-1.5rem', // Pull up to meet focus header flush
      }} className="w-full">

        {/* Active Block Alert Banner */}
        {activeBlock && (
          <div 
            style={{
              border: `1px solid ${COLORS[activeBlock.colorName]?.hex || '#7F77DD'}`,
              background: COLORS[activeBlock.colorName]?.light || '#EEEDFE',
              color: COLORS[activeBlock.colorName]?.dark || '#3C3489',
              borderRadius: 'var(--border-radius-md)',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
            className="flex flex-col sm:flex-row sm:items-center justify-between shadow-sm animate-pulse"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-2.5 w-2.5 rounded-full relative flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: COLORS[activeBlock.colorName]?.hex }} />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: COLORS[activeBlock.colorName]?.hex }} />
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider flex-shrink-0">
                Active Session:
              </span>
              <span className="text-[12px] font-bold truncate">
                {activeBlock.name} ({activeBlock.startTime} – {activeBlock.endTime})
              </span>
            </div>
            {activeBlock.description && (
              <span className="text-[11px] opacity-80 truncate max-w-full sm:max-w-[300px]">
                {activeBlock.description}
              </span>
            )}
          </div>
        )}
        
        {/* Column Subheader Row (Time | Session | Actions) */}
        {activeDayType && activeDayType.blocks.length > 0 && (
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--color-background-primary)',
              borderBottom: '1.5px solid var(--color-border-tertiary)',
              padding: '8px 16px',
              marginBottom: '12px',
              borderRadius: 'var(--border-radius-md)'
            }}
            className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider hidden sm:flex"
          >
            {/* Grip handle spacer */}
            <div style={{ width: '30px' }} className="flex-shrink-0" />
            
            {/* Color Accent line spacer */}
            <div style={{ width: '5px' }} className="flex-shrink-0" />
            
            {/* Time Header */}
            <div style={{ width: '135px' }} className="text-center flex-shrink-0">
              Time
            </div>
            
            {/* Session Header */}
            <div className="flex-1 pl-4">
              Session
            </div>
            
            {/* Actions Spacer */}
            <div style={{ width: '50px' }} className="flex-shrink-0 text-right pr-2">
              Actions
            </div>
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={activeDayType?.blocks.map((b) => b.id) || []}
            strategy={verticalListSortingStrategy}
          >
            {activeDayType?.blocks.map((block, idx) => (
              <div key={block.id}>
                {idx > 0 && (
                  <div className="flex justify-center -my-1.5 relative z-10 group/btn">
                    <button
                      onClick={() => insertBlock(idx)}
                      className="px-2.5 py-0.5 text-[10px] font-semibold border border-dashed border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-md opacity-0 group-hover/btn:opacity-100 focus:opacity-100 hover:border-gray-500 transition-opacity cursor-pointer flex items-center gap-1"
                    >
                      <i className="ti ti-plus" style={{ fontSize: 9 }} />
                      Insert activity
                    </button>
                  </div>
                )}

                <TimeBlock
                  block={block}
                  index={idx}
                  currentTime={currentTime}
                  onUpdate={(updatedBlock) => {
                    const updatedBlocks = activeDayType.blocks.map((b) =>
                      b.id === block.id ? updatedBlock : b
                    );
                    const updatedDayTypes = plan.dayTypes.map((dt) =>
                      dt.id === activeDayType.id ? { ...dt, blocks: updatedBlocks } : dt
                    );
                    onPlanChange({ ...plan, dayTypes: updatedDayTypes });
                  }}
                  onDelete={() => {
                    const updatedBlocks = activeDayType.blocks.filter((b) => b.id !== block.id);
                    const updatedDayTypes = plan.dayTypes.map((dt) =>
                      dt.id === activeDayType.id ? { ...dt, blocks: updatedBlocks } : dt
                    );
                    onPlanChange({ ...plan, dayTypes: updatedDayTypes });
                  }}
                />
              </div>
            ))}
          </SortableContext>
        </DndContext>

        {/* Add Block Centered Trigger */}
        <div className="flex justify-center mt-3 mb-1">
          <button
            onClick={addBlockAtBottom}
            className="px-5 py-2 border border-dashed border-[var(--color-border-secondary)] hover:border-[#7F77DD] bg-[var(--color-background-primary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-full text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <i className="ti ti-plus" style={{ fontSize: 12 }} />
            add block
          </button>
        </div>

        {/* Pro Tip note box */}
        {noteValue && (
          <div
            style={{
              backgroundColor: noteColor.light,
              color: noteColor.dark,
              border: `0.5px solid ${noteColor.hex}`,
              borderRadius: 'var(--border-radius-md)',
              padding: '1rem',
              marginTop: '1.25rem',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              <i className="ti ti-info-circle" style={{ fontSize: 13 }} />
              <span>Pro tip</span>
            </div>
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                const text = e.currentTarget.innerText;
                if (isDayA) {
                  onPlanChange({ ...plan, noteA: text });
                } else if (isDayB) {
                  onPlanChange({ ...plan, noteB: text });
                }
              }}
              style={{ fontSize: 12, lineHeight: 1.5, outline: 'none' }}
            >
              {noteValue}
            </div>
          </div>
        )}
      </div>

      {/* 5. Weekly Rhythm Grid (Full Width at Bottom) */}
      <WeeklyRhythm plan={plan} onPlanChange={onPlanChange} />

      {/* 6. Weekly Tasks Checklist (Full Width at Bottom) */}
      <WeeklyTasks plan={plan} onPlanChange={onPlanChange} />

      {/* 7. Beautiful Custom Popup Alert Overlay */}
      {popupMessage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#1e1e1c',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '1.75rem',
            maxWidth: 340,
            width: '90%',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            animation: 'scheduleScaleIn 0.2s ease-out'
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              backgroundColor: '#EEEDFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3C3489'
            }}>
              <i className="ti ti-info-circle" style={{ fontSize: 24 }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Feature Coming Soon</h3>
              <p style={{ fontSize: 12, color: '#a1a1aa', lineHeight: 1.5 }}>
                {popupMessage}
              </p>
            </div>

            <button
              onClick={() => setPopupMessage(null)}
              style={{
                width: '100%',
                padding: '8px 16px',
                background: '#7F77DD',
                border: 'none',
                borderRadius: 'var(--border-radius-md)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '0.5rem'
              }}
              className="hover:bg-[#6860c4] transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* 8. Restart Confirmation Modal Popup */}
      {showRestartConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#1e1e1c',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '1.75rem',
            maxWidth: 340,
            width: '90%',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            animation: 'scheduleScaleIn 0.2s ease-out'
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444'
            }}>
              <i className="ti ti-alert-triangle" style={{ fontSize: 24 }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Clear and Restart?</h3>
              <p style={{ fontSize: 12, color: '#a1a1aa', lineHeight: 1.5 }}>
                Are you sure you want to start over? Your current schedule and changes will be permanently cleared.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '0.5rem' }}>
              <button
                onClick={() => setShowRestartConfirm(false)}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '0.5px solid var(--color-border-secondary)',
                  borderRadius: 'var(--border-radius-md)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                className="hover:bg-[#252523] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowRestartConfirm(false);
                  onRestart();
                }}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  background: '#ef4444',
                  border: 'none',
                  borderRadius: 'var(--border-radius-md)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                className="hover:bg-red-700 transition-colors"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Delete Day Type Confirmation Modal Popup */}
      {dayToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#1e1e1c',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '1.75rem',
            maxWidth: 340,
            width: '90%',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            animation: 'scheduleScaleIn 0.2s ease-out'
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444'
            }}>
              <i className="ti ti-trash" style={{ fontSize: 24 }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                Delete {plan.dayTypes.find(dt => dt.id === dayToDelete)?.name || 'Day Type'}?
              </h3>
              <p style={{ fontSize: 12, color: '#a1a1aa', lineHeight: 1.5 }}>
                Are you sure you want to delete this day type? Any scheduled days in your weekly rhythm using it will default to another day type.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '0.5rem' }}>
              <button
                onClick={() => setDayToDelete(null)}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '0.5px solid var(--color-border-secondary)',
                  borderRadius: 'var(--border-radius-md)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                className="hover:bg-[#252523] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeleteDayType(dayToDelete);
                  setDayToDelete(null);
                }}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  background: '#ef4444',
                  border: 'none',
                  borderRadius: 'var(--border-radius-md)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                className="hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
