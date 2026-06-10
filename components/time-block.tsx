'use client';
import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TimeBlock as TimeBlockType } from '@/types/planner';
import { COLORS, COLOR_LIST } from '@/lib/colors';

interface TimeBlockProps {
  block: TimeBlockType;
  index: number;
  onUpdate: (updatedBlock: TimeBlockType) => void;
  onDelete: () => void;
  currentTime?: string;
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

export function TimeBlock({ block, index, onUpdate, onDelete, currentTime }: TimeBlockProps) {
  const [showEditBar, setShowEditBar] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
    zIndex: isDragging ? 10 : undefined,
    animationDelay: `${index * 60}ms`,
  };

  const isActive = currentTime ? isTimeBetween(currentTime, block.startTime, block.endTime) : false;

  const colorConfig = COLORS[block.colorName] || COLORS.gray;

  const containerStyle: React.CSSProperties = {
    ...style,
    border: isActive ? '1.5px solid #ff7a00' : undefined,
    boxShadow: isActive ? '0 0 16px rgba(255, 122, 0, 0.45)' : undefined,
    backgroundColor: isActive ? 'var(--color-background-secondary)' : undefined,
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
    setShowEditBar(false); // Hide edit bar if delete confirm is triggered
  };

  // Format time display cleanly (e.g. 09:00 to 9:00 if needed, or display as is)
  const displayTimeRange = `${block.startTime}–${block.endTime}`;

  return (
    <div
      ref={setNodeRef}
      style={containerStyle}
      className={`group relative border border-solid rounded-[var(--border-radius-lg)] overflow-hidden mb-3 block-enter transition-all duration-200 ${
        isActive 
          ? 'border-transparent' 
          : 'border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)] hover:bg-[var(--color-background-secondary)]'
      }`}
    >
      <div className="flex items-stretch">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-center px-2.5 cursor-grab active:cursor-grabbing text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-[rgba(255,255,255,0.01)] border-r border-solid border-[var(--color-border-tertiary)] transition-colors flex-shrink-0 touch-none"
          title="Drag to reorder"
        >
          <i className="ti ti-grip-vertical" style={{ fontSize: 15 }} />
        </div>

        {/* Color Accent strip */}
        <div
          style={{
            width: 5,
            backgroundColor: colorConfig.hex,
          }}
          className="flex-shrink-0"
        />

        {/* Main layout container (stacked on mobile, row on desktop) */}
        <div className="flex flex-col sm:flex-row flex-1 min-w-0 relative">
          {/* Time column (text display that toggles edit bar on click) */}
          <div 
            onClick={() => {
              setShowEditBar(!showEditBar);
              setShowDeleteConfirm(false);
            }}
            className="flex items-center justify-start sm:justify-center px-5 py-3 sm:py-0 bg-[rgba(255,255,255,0.005)] border-b sm:border-b-0 sm:border-r border-solid border-[var(--color-border-tertiary)] flex-shrink-0 cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors"
            style={{ minWidth: '135px' }}
            title="Click to edit timings"
          >
            <span className="text-[13px] font-semibold text-[var(--color-text-primary)] tracking-wide select-none">
              {displayTimeRange}
            </span>
          </div>

          {/* Body content */}
          <div className="flex-1 p-4 flex flex-col justify-center min-w-0 pr-16 sm:pr-16">
            <div className="flex items-center flex-wrap gap-2">
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                  onUpdate({ ...block, name: e.currentTarget.innerText });
                }}
                className="font-semibold text-[14px] text-[var(--color-text-primary)] outline-none focus:border-b focus:border-[#7F77DD] pb-0.5"
                style={{ display: 'inline-block' }}
              >
                {block.name}
              </div>
              {isActive && (
                <span 
                  style={{
                    backgroundColor: colorConfig.light,
                    color: colorConfig.dark,
                    border: `0.5px solid ${colorConfig.hex}`,
                    borderRadius: '4px',
                    padding: '1px 6px',
                    fontSize: '9px',
                    fontWeight: 750,
                    textTransform: 'uppercase',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    letterSpacing: '0.05em',
                  }}
                  className="animate-pulse flex-shrink-0"
                >
                  <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: colorConfig.hex }} />
                  Active Now
                </span>
              )}
            </div>
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                onUpdate({ ...block, description: e.currentTarget.innerText });
              }}
              className="text-xs text-[var(--color-text-secondary)] outline-none min-h-[1.2em] mt-1"
            >
              {block.description}
            </div>
          </div>

          {/* Actions: absolute top-right on mobile, vertical centered right on desktop */}
          <div className="absolute right-3.5 top-3 sm:top-1/2 sm:-translate-y-1/2 flex items-center gap-3 text-[var(--color-text-secondary)]">
            <button
              onClick={() => {
                setShowEditBar(!showEditBar);
                setShowDeleteConfirm(false);
              }}
              className="hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              title="Edit block properties & color"
            >
              <i className="ti ti-edit" style={{ fontSize: 16 }} />
            </button>
            <button
              onClick={handleDelete}
              className="hover:text-red-400 transition-colors cursor-pointer"
              title="Delete block"
            >
              <i className="ti ti-trash" style={{ fontSize: 16 }} />
            </button>
          </div>
        </div>
      </div>

      {/* Inline Edit Bar */}
      {showEditBar && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 border-t border-solid border-[var(--color-border-tertiary)] bg-[var(--color-background-secondary)]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-text-secondary)]">Block Accent:</span>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_LIST.map((color) => {
                const isSelected = block.colorName === color.name;
                return (
                  <button
                    key={color.name}
                    onClick={() => onUpdate({ ...block, colorName: color.name })}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      backgroundColor: color.hex,
                      border: isSelected ? '2px solid white' : '1px solid rgba(255,255,255,0.2)',
                      cursor: 'pointer',
                    }}
                    title={color.label}
                  />
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-text-secondary)]">Duration:</span>
            <input
              type="time"
              value={block.startTime}
              onChange={(e) => onUpdate({ ...block, startTime: e.target.value })}
              className="text-xs px-2.5 py-1 border border-solid border-[var(--color-border-secondary)] rounded bg-[var(--color-background-primary)] text-[var(--color-text-primary)] focus:outline-none w-[90px] cursor-pointer"
            />
            <span className="text-xs text-[var(--color-text-secondary)]">to</span>
            <input
              type="time"
              value={block.endTime}
              onChange={(e) => onUpdate({ ...block, endTime: e.target.value })}
              className="text-xs px-2.5 py-1 border border-solid border-[var(--color-border-secondary)] rounded bg-[var(--color-background-primary)] text-[var(--color-text-primary)] focus:outline-none w-[90px] cursor-pointer"
            />
          </div>

          <button
            onClick={() => setShowEditBar(false)}
            className="px-3 py-1 text-xs font-semibold bg-[#7F77DD] hover:bg-[#6860c4] text-white rounded cursor-pointer transition-colors sm:self-auto self-start"
          >
            Done
          </button>
        </div>
      )}

      {/* Inline Delete Confirmation Bar */}
      {showDeleteConfirm && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 border-t border-solid border-red-950 bg-red-950/10">
          <span className="text-xs text-red-400 font-semibold">
            Delete this activity? This cannot be undone.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1 text-xs font-semibold border border-solid border-gray-700 bg-[#1e1e1c] hover:bg-[#252523] text-white rounded cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowDeleteConfirm(false);
                onDelete();
              }}
              className="px-3 py-1 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded cursor-pointer transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
