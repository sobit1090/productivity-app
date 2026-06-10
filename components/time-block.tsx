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
}

export function TimeBlock({ block, index, onUpdate, onDelete }: TimeBlockProps) {
  const [showEditBar, setShowEditBar] = useState(false);
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

  const handleDelete = () => {
    if (confirm('Delete this block?')) {
      onDelete();
    }
  };

  const colorConfig = COLORS[block.colorName] || COLORS.gray;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative border border-solid border-[var(--color-border-tertiary)] bg-[#1e1e1c] hover:bg-[#232321] rounded-[var(--border-radius-lg)] overflow-hidden mb-3 block-enter transition-all duration-200"
    >
      <div className="flex items-stretch">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-center px-2.5 cursor-grab active:cursor-grabbing text-gray-500 hover:text-white bg-[rgba(255,255,255,0.01)] border-r border-solid border-[var(--color-border-tertiary)] transition-colors flex-shrink-0"
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
          {/* Time column */}
          <div 
            className="flex items-center justify-start sm:justify-center px-4 py-2.5 sm:py-0 bg-[rgba(255,255,255,0.005)] border-b sm:border-b-0 sm:border-r border-solid border-[var(--color-border-tertiary)] flex-shrink-0"
            style={{ minWidth: '135px' }}
          >
            <div className="flex items-center gap-1 text-[13px] font-semibold text-white">
              <input
                type="time"
                value={block.startTime}
                onChange={(e) => onUpdate({ ...block, startTime: e.target.value })}
                className="bg-transparent border-none text-center focus:outline-none cursor-pointer w-[50px] text-white font-medium"
              />
              <span className="text-gray-500 font-normal select-none">–</span>
              <input
                type="time"
                value={block.endTime}
                onChange={(e) => onUpdate({ ...block, endTime: e.target.value })}
                className="bg-transparent border-none text-center focus:outline-none cursor-pointer w-[50px] text-white font-medium"
              />
            </div>
          </div>

          {/* Body content */}
          <div className="flex-1 p-4 flex flex-col justify-center min-w-0 pr-16 sm:pr-16">
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                onUpdate({ ...block, name: e.currentTarget.innerText });
              }}
              className="font-semibold text-[14px] text-white outline-none focus:border-b focus:border-[#7F77DD] pb-0.5"
            >
              {block.name}
            </div>
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                onUpdate({ ...block, description: e.currentTarget.innerText });
              }}
              className="text-xs text-[#a1a1aa] outline-none min-h-[1.2em] mt-1"
            >
              {block.description}
            </div>
          </div>

          {/* Actions: absolute top-right on mobile, vertical centered right on desktop */}
          <div className="absolute right-3.5 top-3 sm:top-1/2 sm:-translate-y-1/2 flex items-center gap-3 text-gray-400">
            <button
              onClick={() => setShowEditBar(!showEditBar)}
              className="hover:text-white transition-colors cursor-pointer"
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 border-t border-solid border-[var(--color-border-tertiary)] bg-[#171716]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#9a9892]">Block Accent:</span>
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
            <span className="text-xs text-[#9a9892]">Duration:</span>
            <input
              type="time"
              value={block.startTime}
              onChange={(e) => onUpdate({ ...block, startTime: e.target.value })}
              className="text-xs px-2 py-1 border border-solid border-gray-700 rounded bg-[#222] text-white focus:outline-none"
            />
            <span className="text-xs text-[#9a9892]">to</span>
            <input
              type="time"
              value={block.endTime}
              onChange={(e) => onUpdate({ ...block, endTime: e.target.value })}
              className="text-xs px-2 py-1 border border-solid border-gray-700 rounded bg-[#222] text-white focus:outline-none"
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
    </div>
  );
}
