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
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Set initial active tab
  useEffect(() => {
    if (plan.dayTypes.length > 0 && !activeTabId) {
      setActiveTabId(plan.dayTypes[0].id);
    }
  }, [plan.dayTypes, activeTabId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms hold delay to prevent drag triggering on touch scroll
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeDayType = plan.dayTypes.find((dt) => dt.id === activeTabId) || plan.dayTypes[0];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id && activeDayType) {
      const oldIndex = activeDayType.blocks.findIndex((block) => block.id === active.id);
      const newIndex = activeDayType.blocks.findIndex((block) => block.id === over.id);

      const reorderedBlocks = arrayMove(activeDayType.blocks, oldIndex, newIndex);
      const updatedDayTypes = plan.dayTypes.map((dt) =>
        dt.id === activeDayType.id ? { ...dt, blocks: reorderedBlocks } : dt
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
    const char = String.fromCharCode(65 + plan.dayTypes.length); // C, D, E etc.
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
        background: '#1e1e1c',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '1.5rem',
      }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Title and Subtitle inputs */}
          <div className="flex-1 min-w-0">
            <input
              ref={titleInputRef}
              type="text"
              value={plan.title}
              onChange={(e) => onPlanChange({ ...plan, title: e.target.value })}
              className="text-lg md:text-xl font-bold bg-transparent text-white w-full border-b border-transparent focus:border-[#7F77DD] focus:outline-none py-0.5"
              placeholder="Plan Title"
            />
            <input
              type="text"
              value={plan.subtitle}
              onChange={(e) => onPlanChange({ ...plan, subtitle: e.target.value })}
              className="text-xs md:text-sm text-gray-400 bg-transparent w-full border-b border-transparent focus:border-[#7F77DD] focus:outline-none mt-1.5 py-0.5"
              placeholder="Plan Subtitle"
            />
          </div>

          {/* Action Button Row */}
          <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
            {showSaved && (
              <span className="saved-indicator text-xs text-[#1D9E75] font-semibold mr-1.5 flex items-center gap-1">
                <i className="ti ti-cloud-check" style={{ fontSize: 15 }} />
                Saved
              </span>
            )}

            <button
              onClick={() => setPopupMessage('PDF export is coming soon!')}
              className="px-3.5 py-1.5 text-xs font-semibold border border-solid border-gray-700 hover:border-gray-500 rounded-lg bg-[#1e1e1c] text-white hover:bg-[#252523] cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <i className="ti ti-download" style={{ fontSize: 14 }} />
              Export PDF
            </button>

            <button
              onClick={handleEditHeaderClick}
              className="px-3.5 py-1.5 text-xs font-semibold border border-solid border-gray-700 hover:border-gray-500 rounded-lg bg-[#1e1e1c] text-white hover:bg-[#252523] cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <i className="ti ti-edit" style={{ fontSize: 14 }} />
              Edit header
            </button>

            <button
              onClick={onRegenerate}
              className="px-3.5 py-1.5 text-xs font-semibold border border-solid border-gray-700 hover:border-gray-500 rounded-lg bg-[#1e1e1c] text-white hover:bg-[#252523] cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <i className="ti ti-refresh" style={{ fontSize: 14 }} />
              Regenerate
            </button>

            <button
              onClick={onRestart}
              className="px-3.5 py-1.5 text-xs font-semibold border border-solid border-red-900 rounded-lg bg-red-950/20 text-red-400 hover:bg-red-950/40 cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <i className="ti ti-power" style={{ fontSize: 14 }} />
              Restart
            </button>
          </div>
        </div>
      </div>

      {/* 2. Day Type Selection Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {plan.dayTypes.map((dt) => {
          const isActive = dt.id === activeTabId;
          return (
            <button
              key={dt.id}
              onClick={() => setActiveTabId(dt.id)}
              style={isActive ? {
                backgroundColor: '#7F77DD',
                borderColor: '#7F77DD',
                color: '#fff',
              } : {}}
              className={`px-4 py-2 text-xs font-bold rounded-lg border border-solid transition-all cursor-pointer ${
                isActive
                  ? 'text-white'
                  : 'border-gray-800 bg-[#1e1e1c] text-gray-400 hover:text-white hover:bg-[#252523]'
              }`}
            >
              {dt.name}
            </button>
          );
        })}

        <button
          onClick={handleAddDayType}
          className="px-4 py-2 text-xs font-bold rounded-lg border border-dashed border-gray-750 text-gray-400 hover:text-white hover:border-gray-600 bg-transparent cursor-pointer transition-colors flex items-center gap-1 flex-shrink-0"
        >
          <i className="ti ti-plus" style={{ fontSize: 12 }} />
          Add day type
        </button>
      </div>

      {/* 3. Day Subtitle Focus Text */}
      {activeDayType && (
        <div className="flex items-center px-1 mb-1">
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f0efe8' }} className="mr-2">
            {activeDayType.name} — Focus:
          </span>
          <input
            type="text"
            value={activeDayType.focusSubtitle}
            onChange={(e) => {
              const updatedDayTypes = plan.dayTypes.map((dt) =>
                dt.id === activeDayType.id ? { ...dt, focusSubtitle: e.target.value } : dt
              );
              onPlanChange({ ...plan, dayTypes: updatedDayTypes });
            }}
            className="text-[13px] font-semibold text-gray-400 bg-transparent border-b border-transparent focus:border-[#7F77DD] focus:outline-none flex-1 py-0.5"
            placeholder="Focus area (e.g. GATE Core + Aptitude)"
          />
        </div>
      )}

      {/* 4. Timetable Cards Container */}
      <div style={{
        background: '#151514',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '1.25rem',
      }} className="w-full">
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
                      className="px-2.5 py-0.5 text-[10px] font-semibold border border-dashed border-gray-700 bg-[#1e1e1c] text-gray-400 hover:text-white rounded-md opacity-0 group-hover/btn:opacity-100 focus:opacity-100 hover:border-gray-500 transition-opacity cursor-pointer flex items-center gap-1"
                    >
                      <i className="ti ti-plus" style={{ fontSize: 9 }} />
                      Insert activity
                    </button>
                  </div>
                )}

                <TimeBlock
                  block={block}
                  index={idx}
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
            className="px-5 py-2 border border-dashed border-gray-700 hover:border-[#7F77DD] bg-[#1e1e1c] text-[#a1a1aa] hover:text-white rounded-full text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
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
    </div>
  );
}
