'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Plus, Trash2, Edit3, Check, X, Clock,
  CalendarClock, Palette, ChevronDown, RotateCcw, Copy,
  Sun, Moon, Coffee, BookOpen, Code, Brain, Dumbbell, Pencil,
  Sparkles, Settings2, Eye, EyeOff, Play, Pause,
  CalendarDays, Timer, Zap, ArrowRight, ChevronRight, LayoutGrid,
  Lock, Mail, KeyRound, ShieldAlert
} from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useSession } from '@/lib/auth-client'

// ─── Types ──────────────────────────────────────────────────────────────────────

interface TimeBlock {
  id: string
  startTime: string
  endTime: string
  sessionName: string
  description: string
  color: string
  icon: string
  isBreak: boolean
}

interface DayTemplate {
  id: string
  name: string
  subtitle: string
  color: string
  blocks: TimeBlock[]
}

interface WeekDay {
  day: string
  templateId: string
  topic: string
}

interface SchedulePlan {
  id: string
  title: string
  subtitle: string
  timeRange: string
  templates: DayTemplate[]
  weeklyRhythm: WeekDay[]
  showWeeklyRhythm: boolean
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'studyflow-schedule-plan'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const BLOCK_COLORS = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Lime', value: '#84cc16' },
  { name: 'Slate', value: '#64748b' },
]

const TEMPLATE_COLORS = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Teal', value: '#14b8a6' },
]

const BLOCK_ICONS: { label: string; value: string; icon: React.ReactNode }[] = [
  { label: 'Book', value: 'book', icon: <BookOpen className="h-4 w-4" /> },
  { label: 'Code', value: 'code', icon: <Code className="h-4 w-4" /> },
  { label: 'Brain', value: 'brain', icon: <Brain className="h-4 w-4" /> },
  { label: 'Coffee', value: 'coffee', icon: <Coffee className="h-4 w-4" /> },
  { label: 'Sun', value: 'sun', icon: <Sun className="h-4 w-4" /> },
  { label: 'Moon', value: 'moon', icon: <Moon className="h-4 w-4" /> },
  { label: 'Pencil', value: 'pencil', icon: <Pencil className="h-4 w-4" /> },
  { label: 'Fitness', value: 'fitness', icon: <Dumbbell className="h-4 w-4" /> },
  { label: 'Clock', value: 'clock', icon: <Clock className="h-4 w-4" /> },
  { label: 'Sparkles', value: 'sparkles', icon: <Sparkles className="h-4 w-4" /> },
]

function getBlockIcon(iconName: string, size = 'h-4 w-4') {
  const icons: Record<string, React.ReactNode> = {
    book: <BookOpen className={size} />,
    code: <Code className={size} />,
    brain: <Brain className={size} />,
    coffee: <Coffee className={size} />,
    sun: <Sun className={size} />,
    moon: <Moon className={size} />,
    pencil: <Pencil className={size} />,
    fitness: <Dumbbell className={size} />,
    clock: <Clock className={size} />,
    sparkles: <Sparkles className={size} />,
  }
  return icons[iconName] || <Clock className={size} />
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function formatTime12(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hr = h % 12 || 12
  return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`
}

function formatDuration(startTime: string, endTime: string): string {
  const diff = timeToMinutes(endTime) - timeToMinutes(startTime)
  if (diff <= 0) return '0m'
  const h = Math.floor(diff / 60)
  const m = diff % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// ─── Default Data (PDF Study Plan) ──────────────────────────────────────────────

function createDefaultPlan(): SchedulePlan {
  return {
    id: uid(),
    title: 'B.Tech CSE Graduate',
    subtitle: 'GATE + Software Jobs + Govt Jobs · Daily Study Plan',
    timeRange: '10:00 AM – 7:00 PM',
    showWeeklyRhythm: true,
    templates: [
      {
        id: 'day-a',
        name: 'Day A',
        subtitle: 'Focus: GATE Core + Aptitude',
        color: '#6366f1',
        blocks: [
          { id: uid(), startTime: '10:00', endTime: '10:15', sessionName: 'Warm-up Review', description: 'Revise yesterday\'s notes only — 15 min, no new topics', color: '#6366f1', icon: 'sun', isBreak: false },
          { id: uid(), startTime: '10:15', endTime: '12:15', sessionName: 'GATE Core — Deep Study', description: 'Rotate weekly: OS → DBMS → Algorithms → TOC → CN. Read concept + solve PYQs.', color: '#3b82f6', icon: 'book', isBreak: false },
          { id: uid(), startTime: '12:15', endTime: '13:00', sessionName: 'Lunch Break', description: 'Step away from screen completely. No studying.', color: '#64748b', icon: 'coffee', isBreak: true },
          { id: uid(), startTime: '13:00', endTime: '14:30', sessionName: 'GATE — Practice & PYQs', description: 'Solve 20–25 previous year questions on today\'s topic. Mark all doubts.', color: '#a855f7', icon: 'brain', isBreak: false },
          { id: uid(), startTime: '14:30', endTime: '14:45', sessionName: 'Short Break', description: 'Walk, water, rest your eyes.', color: '#64748b', icon: 'coffee', isBreak: true },
          { id: uid(), startTime: '14:45', endTime: '16:15', sessionName: 'Aptitude — Topic-wise', description: 'Quant: Number system, %, ratio, time-work. Logical: syllogisms, seating. 1 topic per day.', color: '#f59e0b', icon: 'brain', isBreak: false },
          { id: uid(), startTime: '16:15', endTime: '16:30', sessionName: 'Break', description: '', color: '#64748b', icon: 'coffee', isBreak: true },
          { id: uid(), startTime: '16:30', endTime: '18:15', sessionName: 'DSA — 1 Problem Set', description: 'Arrays / Strings / Linked Lists (Easy–Medium). Solve 2+ problems. Understand, don\'t just copy.', color: '#10b981', icon: 'code', isBreak: false },
          { id: uid(), startTime: '18:15', endTime: '19:00', sessionName: 'End-of-Day Notes', description: 'Write 5 key points from today. Mark what to revisit. Log in notebook or Notion.', color: '#ec4899', icon: 'pencil', isBreak: false },
        ],
      },
      {
        id: 'day-b',
        name: 'Day B',
        subtitle: 'Focus: DSA Deep Dive + Project',
        color: '#10b981',
        blocks: [
          { id: uid(), startTime: '10:00', endTime: '10:15', sessionName: 'Warm-up Review', description: 'Skim yesterday\'s GATE notes — 15 min only.', color: '#10b981', icon: 'sun', isBreak: false },
          { id: uid(), startTime: '10:15', endTime: '12:30', sessionName: 'DSA — Structured Practice', description: 'Roadmap: Arrays → Recursion → Sorting → Trees → Graphs. Solve 3–5 LeetCode Easy/Medium.', color: '#3b82f6', icon: 'code', isBreak: false },
          { id: uid(), startTime: '12:30', endTime: '13:15', sessionName: 'Lunch Break', description: 'Full break. Step away from screen.', color: '#64748b', icon: 'coffee', isBreak: true },
          { id: uid(), startTime: '13:15', endTime: '14:30', sessionName: 'Aptitude — Timed Mock', description: '20-question timed test (25 min). Analyse wrong answers for 30 min. Builds NQT + govt readiness.', color: '#f59e0b', icon: 'brain', isBreak: false },
          { id: uid(), startTime: '14:30', endTime: '14:45', sessionName: 'Break', description: '', color: '#64748b', icon: 'coffee', isBreak: true },
          { id: uid(), startTime: '14:45', endTime: '17:45', sessionName: 'Project Work', description: '3 hours uninterrupted. Build a real, deployable web project. Connects directly to job portfolio.', color: '#a855f7', icon: 'code', isBreak: false },
          { id: uid(), startTime: '17:45', endTime: '18:15', sessionName: 'GATE — 1 Short Topic', description: 'Read one small GATE concept (e.g. one page of OS or CN). Keep GATE warm even on B days.', color: '#6366f1', icon: 'book', isBreak: false },
          { id: uid(), startTime: '18:15', endTime: '19:00', sessionName: 'End-of-Day Log', description: 'What did I build today? What DSA pattern did I learn? Log it.', color: '#ec4899', icon: 'pencil', isBreak: false },
        ],
      },
    ],
    weeklyRhythm: [
      { day: 'Monday', templateId: 'day-a', topic: 'GATE: OS / Algorithms · Aptitude: Quantitative topic' },
      { day: 'Tuesday', templateId: 'day-b', topic: 'DSA: Arrays / Strings · Project: Start or continue feature' },
      { day: 'Wednesday', templateId: 'day-a', topic: 'GATE: DBMS / CN · Aptitude: Logical reasoning topic' },
      { day: 'Thursday', templateId: 'day-b', topic: 'DSA: Recursion / Trees · Project: Continue building' },
      { day: 'Friday', templateId: 'day-a', topic: 'GATE: TOC / Algorithms · Aptitude: Mixed practice' },
      { day: 'Saturday', templateId: 'day-b', topic: 'DSA: Graphs / DP · Project: Polish & deploy' },
      { day: 'Sunday', templateId: 'day-a', topic: 'Weekly review · Revise all notes · Plan next week' },
    ],
  }
}

function createEmptyPlan(): SchedulePlan {
  return {
    id: uid(),
    title: 'My Schedule Plan',
    subtitle: 'Customize your daily plan or use the Study Plan Wizard',
    timeRange: '09:00 AM – 5:00 PM',
    showWeeklyRhythm: true,
    templates: [
      {
        id: 'day-a',
        name: 'Day A',
        subtitle: 'Concept Study & Practice',
        color: '#6366f1',
        blocks: [
          { id: uid(), startTime: '09:00', endTime: '10:30', sessionName: 'Study Block 1', description: 'Enter description...', color: '#6366f1', icon: 'book', isBreak: false },
          { id: uid(), startTime: '10:30', endTime: '10:45', sessionName: 'Short Break', description: '', color: '#64748b', icon: 'coffee', isBreak: true },
          { id: uid(), startTime: '10:45', endTime: '12:15', sessionName: 'Study Block 2', description: 'Enter description...', color: '#3b82f6', icon: 'brain', isBreak: false },
          { id: uid(), startTime: '12:15', endTime: '13:00', sessionName: 'Lunch Break', description: '', color: '#64748b', icon: 'coffee', isBreak: true },
          { id: uid(), startTime: '13:00', endTime: '14:30', sessionName: 'Study Block 3', description: 'Enter description...', color: '#a855f7', icon: 'code', isBreak: false },
          { id: uid(), startTime: '14:30', endTime: '15:00', sessionName: 'Daily Review', description: 'Review today\'s notes.', color: '#ec4899', icon: 'pencil', isBreak: false },
        ],
      }
    ],
    weeklyRhythm: [
      { day: 'Monday', templateId: 'day-a', topic: 'Study Session 1' },
      { day: 'Tuesday', templateId: 'day-a', topic: 'Study Session 2' },
      { day: 'Wednesday', templateId: 'day-a', topic: 'Study Session 3' },
      { day: 'Thursday', templateId: 'day-a', topic: 'Study Session 4' },
      { day: 'Friday', templateId: 'day-a', topic: 'Study Session 5' },
      { day: 'Saturday', templateId: 'day-a', topic: 'Revision & Coding' },
      { day: 'Sunday', templateId: 'day-a', topic: 'Weekly Review' },
    ],
  }
}

// ─── Study Plan Setup Wizard Generator ──────────────────────────────────────────

function generateScheduleFromWizard(
  startTime: string,
  endTime: string,
  subjectsStr: string,
  goalStr: string
): SchedulePlan {
  const subjects = subjectsStr
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  const defaultSubjects = ['General Core Study', 'Practice Questions', 'Skills Development']
  const finalSubjects = subjects.length > 0 ? subjects : defaultSubjects

  const startMin = timeToMinutes(startTime)
  const endMin = timeToMinutes(endTime)
  const totalMin = endMin - startMin

  // Helper to get subjects circularly
  let subjectIdx = 0
  const getNextSubject = () => {
    const sub = finalSubjects[subjectIdx % finalSubjects.length]
    subjectIdx++
    return sub
  }

  const createBlocksForDay = (startSubjectOffset: number) => {
    subjectIdx = startSubjectOffset
    let t = startMin
    const blocks: TimeBlock[] = []

    const pushBlock = (duration: number, name: string, desc: string, icon: string, isBreak: boolean, color: string) => {
      const startStr = `${Math.floor(t / 60).toString().padStart(2, '0')}:${(t % 60).toString().padStart(2, '0')}`
      t += duration
      const endStr = `${Math.floor(t / 60).toString().padStart(2, '0')}:${(t % 60).toString().padStart(2, '0')}`
      
      blocks.push({
        id: uid(),
        startTime: startStr,
        endTime: endStr,
        sessionName: name,
        description: desc,
        color,
        icon,
        isBreak,
      })
    }

    // Allocate times:
    // Warm-up: 15 min
    pushBlock(15, 'Warm-up Review', 'Quickly revise previous day\'s notes.', '#6366f1', false, 'sun')

    // Study 1: remaining/3
    const totalRemaining = endMin - t - 30 // exclude wrap-up
    const study1Dur = Math.max(30, Math.floor((totalRemaining - 60) * 0.45)) // 45% of available study time
    if (t + study1Dur < endMin - 30) {
      pushBlock(study1Dur, getNextSubject(), `Deep study and concept learning.`, '#3b82f6', false, 'book')
    }

    // Lunch: 45 min
    if (t + 45 < endMin - 30) {
      pushBlock(45, 'Lunch Break', 'Rest, eat, and disconnect from screens.', '#64748b', true, 'coffee')
    }

    // Study 2
    const study2Dur = Math.max(30, Math.floor((totalRemaining - 60) * 0.35))
    if (t + study2Dur < endMin - 30) {
      pushBlock(study2Dur, getNextSubject(), `Practice exercises, solve questions.`, '#a855f7', false, 'brain')
    }

    // Break: 15 min
    if (t + 15 < endMin - 30) {
      pushBlock(15, 'Short Break', 'Stretch, drink water, relax.', '#64748b', true, 'coffee')
    }

    // Study 3
    const finalRemaining = endMin - t - 30
    if (finalRemaining > 15) {
      pushBlock(finalRemaining, getNextSubject(), `Review topics, watch lessons, or write code.`, '#10b981', false, 'code')
    }

    // Wrap-up: 30 min
    if (t < endMin) {
      pushBlock(endMin - t, 'End-of-Day Notes', 'Document today\'s learnings, update log.', '#ec4899', false, 'pencil')
    }

    return blocks
  }

  const dayABlocks = createBlocksForDay(0)
  const dayBBlocks = createBlocksForDay(1) // Offset subjects by 1 to rotate

  const title = goalStr ? goalStr.substring(0, 35) : 'My Personalized Plan'
  const subtitle = `Study window: ${formatTime12(startTime)} - ${formatTime12(endTime)}`

  return {
    id: uid(),
    title,
    subtitle,
    timeRange: `${formatTime12(startTime)} – ${formatTime12(endTime)}`,
    showWeeklyRhythm: true,
    templates: [
      {
        id: 'day-a',
        name: 'Day A',
        subtitle: `Focus: ${finalSubjects[0] || 'Core Study'}`,
        color: '#6366f1',
        blocks: dayABlocks,
      },
      {
        id: 'day-b',
        name: 'Day B',
        subtitle: `Focus: ${finalSubjects[1] || finalSubjects[0] || 'Core Study'}`,
        color: '#10b981',
        blocks: dayBBlocks,
      },
    ],
    weeklyRhythm: [
      { day: 'Monday', templateId: 'day-a', topic: `Focus on ${finalSubjects[0] || 'Day A topics'}` },
      { day: 'Tuesday', templateId: 'day-b', topic: `Focus on ${finalSubjects[1] || finalSubjects[0] || 'Day B topics'}` },
      { day: 'Wednesday', templateId: 'day-a', topic: `Focus on ${finalSubjects[2] || finalSubjects[0] || 'Day A topics'}` },
      { day: 'Thursday', templateId: 'day-b', topic: `Focus on ${finalSubjects[3] || finalSubjects[1] || finalSubjects[0] || 'Day B topics'}` },
      { day: 'Friday', templateId: 'day-a', topic: `Review and practice ${finalSubjects[0]}` },
      { day: 'Saturday', templateId: 'day-b', topic: `Project work and practice ${finalSubjects[1] || finalSubjects[0]}` },
      { day: 'Sunday', templateId: 'day-a', topic: 'Weekly review & plan next week' },
    ],
  }
}

// ─── Inline Editable Text ───────────────────────────────────────────────────────

function InlineEdit({
  value, onChange, className = '', tag = 'span', placeholder = 'Click to edit...',
  multiline = false,
}: {
  value: string
  onChange: (v: string) => void
  className?: string
  tag?: 'span' | 'h1' | 'h2' | 'p'
  placeholder?: string
  multiline?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => { setDraft(value) }, [value])
  useEffect(() => { if (editing) ref.current?.focus() }, [editing])

  const commit = () => {
    setEditing(false)
    if (draft.trim() !== value) onChange(draft.trim())
  }

  if (editing) {
    if (multiline) {
      return (
        <textarea
          ref={ref as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Escape') { setDraft(value); setEditing(false) } }}
          className={`bg-transparent border-b-2 border-primary/40 outline-none resize-none w-full ${className}`}
          rows={2}
        />
      )
    }
    return (
      <input
        ref={ref as React.RefObject<HTMLInputElement>}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') { setDraft(value); setEditing(false) }
        }}
        className={`bg-transparent border-b-2 border-primary/40 outline-none w-full ${className}`}
      />
    )
  }

  const Tag = tag
  return (
    <Tag
      onClick={() => setEditing(true)}
      className={`cursor-pointer hover:bg-primary/5 rounded px-1 -mx-1 transition-colors duration-200 ${!value ? 'text-muted-foreground italic' : ''} ${className}`}
      title="Click to edit"
    >
      {value || placeholder}
    </Tag>
  )
}

// ─── Time Block Edit Dialog ─────────────────────────────────────────────────────

function BlockEditDialog({
  open, onOpenChange, block, onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  block: TimeBlock | null
  onSave: (b: TimeBlock) => void
}) {
  const [draft, setDraft] = useState<TimeBlock | null>(block)
  useEffect(() => { setDraft(block) }, [block])
  if (!draft) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] schedule-dialog-content">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-primary" />
            Edit Time Block
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Start Time</Label>
              <Input type="time" value={draft.startTime} onChange={e => setDraft({ ...draft, startTime: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">End Time</Label>
              <Input type="time" value={draft.endTime} onChange={e => setDraft({ ...draft, endTime: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Session Name</Label>
            <Input value={draft.sessionName} onChange={e => setDraft({ ...draft, sessionName: e.target.value })} placeholder="e.g. GATE Core Study" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Description</Label>
            <Textarea value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} placeholder="What to do in this block..." rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Icon</Label>
              <Select value={draft.icon} onValueChange={v => setDraft({ ...draft, icon: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BLOCK_ICONS.map(ic => (
                    <SelectItem key={ic.value} value={ic.value}>
                      <span className="flex items-center gap-2">{ic.icon} {ic.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Block Type</Label>
              <Select value={draft.isBreak ? 'break' : 'study'} onValueChange={v => setDraft({ ...draft, isBreak: v === 'break' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="study">Study Block</SelectItem>
                  <SelectItem value="break">Break</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Color</Label>
            <div className="flex flex-wrap gap-2">
              {BLOCK_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setDraft({ ...draft, color: c.value })}
                  className={`w-7 h-7 rounded-full transition-all duration-200 ${draft.color === c.value ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm">Cancel</Button>
          </DialogClose>
          <Button size="sm" onClick={() => { onSave(draft); onOpenChange(false) }}>
            <Check className="h-4 w-4 mr-1" /> Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Today's Live Card ──────────────────────────────────────────────────────────

function TodayLiveCard({
  plan, now, todayTemplate, todayRhythm,
}: {
  plan: SchedulePlan
  now: Date
  todayTemplate: DayTemplate | null
  todayRhythm: WeekDay | null
}) {
  if (!todayTemplate) return null

  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const blocks = todayTemplate.blocks
  const dayName = DAY_NAMES[now.getDay()]

  // Find active block
  let activeBlockIdx = -1
  let nextBlockIdx = -1
  for (let i = 0; i < blocks.length; i++) {
    const start = timeToMinutes(blocks[i].startTime)
    const end = timeToMinutes(blocks[i].endTime)
    if (currentMinutes >= start && currentMinutes < end) {
      activeBlockIdx = i
    }
    if (currentMinutes < start && nextBlockIdx === -1) {
      nextBlockIdx = i
    }
  }

  const activeBlock = activeBlockIdx >= 0 ? blocks[activeBlockIdx] : null
  const nextBlock = nextBlockIdx >= 0 ? blocks[nextBlockIdx] : null

  // Calculate progress through active block
  let blockProgress = 0
  let timeRemaining = ''
  if (activeBlock) {
    const start = timeToMinutes(activeBlock.startTime)
    const end = timeToMinutes(activeBlock.endTime)
    const elapsed = currentMinutes - start
    const total = end - start
    blockProgress = Math.round((elapsed / total) * 100)
    const remaining = total - elapsed
    timeRemaining = remaining > 60 ? `${Math.floor(remaining / 60)}h ${remaining % 60}m left` : `${remaining}m left`
  }

  // Day progress
  const firstBlock = blocks[0]
  const lastBlock = blocks[blocks.length - 1]
  const dayStartMin = firstBlock ? timeToMinutes(firstBlock.startTime) : 0
  const dayEndMin = lastBlock ? timeToMinutes(lastBlock.endTime) : 1440
  const dayTotal = dayEndMin - dayStartMin
  let dayProgress = 0
  if (currentMinutes >= dayEndMin) dayProgress = 100
  else if (currentMinutes > dayStartMin) dayProgress = Math.round(((currentMinutes - dayStartMin) / dayTotal) * 100)

  // Completed blocks
  const completedBlocks = blocks.filter(b => currentMinutes >= timeToMinutes(b.endTime)).length
  const studyBlocks = blocks.filter(b => !b.isBreak)

  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

  return (
    <div className="schedule-section-enter space-y-4">
      {/* Live Status Card */}
      <Card className="relative overflow-hidden border-border/60">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ background: `linear-gradient(135deg, ${todayTemplate.color}, transparent)` }}
        />
        <div className="relative p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg schedule-pulse"
                style={{ background: `linear-gradient(135deg, ${todayTemplate.color}, ${todayTemplate.color}cc)` }}
              >
                <CalendarDays className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">Today — {dayName}</h2>
                  <Badge className="text-[10px] font-semibold" style={{ backgroundColor: `${todayTemplate.color}18`, color: todayTemplate.color }}>
                    {todayTemplate.name}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {todayTemplate.subtitle}
                  {todayRhythm?.topic ? ` · ${todayRhythm.topic}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-2xl font-bold font-mono tracking-tight">{timeStr}</p>
                <p className="text-[11px] text-muted-foreground">{completedBlocks}/{blocks.length} blocks done</p>
              </div>
            </div>
          </div>

          {/* Day Progress */}
          <div className="mb-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>Day Progress</span>
              <span>{dayProgress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${dayProgress}%`, background: `linear-gradient(90deg, ${todayTemplate.color}, ${todayTemplate.color}cc)` }}
              />
            </div>
          </div>

          {/* Current & Next Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Current */}
            <div
              className={`rounded-xl p-4 border transition-all duration-500 ${
                activeBlock
                  ? 'border-border/80 shadow-sm'
                  : currentMinutes >= dayEndMin
                    ? 'border-border/40 bg-muted/30'
                    : 'border-dashed border-border/50 bg-muted/20'
              }`}
              style={activeBlock ? { borderLeftWidth: '4px', borderLeftColor: activeBlock.color } : {}}
            >
              <div className="flex items-center gap-2 mb-2">
                {activeBlock ? (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: activeBlock.color }} />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: activeBlock.color }} />
                  </span>
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                )}
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {activeBlock ? 'Now' : currentMinutes >= dayEndMin ? 'Day Complete' : 'Not Started'}
                </span>
              </div>
              {activeBlock ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${activeBlock.color}18`, color: activeBlock.color }}>
                      {getBlockIcon(activeBlock.icon)}
                    </div>
                    <p className="font-semibold text-sm">{activeBlock.sessionName}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{activeBlock.description}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${blockProgress}%`, backgroundColor: activeBlock.color }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">{timeRemaining}</span>
                  </div>
                </>
              ) : currentMinutes >= dayEndMin ? (
                <p className="text-sm text-muted-foreground">Great work today! All sessions finished. 🎉</p>
              ) : (
                <p className="text-sm text-muted-foreground">Schedule starts at {firstBlock ? formatTime12(firstBlock.startTime) : '—'}</p>
              )}
            </div>

            {/* Next */}
            <div className="rounded-xl p-4 border border-dashed border-border/50 bg-muted/10">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Up Next</span>
              </div>
              {nextBlock ? (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${nextBlock.color}18`, color: nextBlock.color }}>
                      {getBlockIcon(nextBlock.icon)}
                    </div>
                    <p className="font-semibold text-sm">{nextBlock.sessionName}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatTime12(nextBlock.startTime)} – {formatTime12(nextBlock.endTime)} · {formatDuration(nextBlock.startTime, nextBlock.endTime)}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {currentMinutes >= dayEndMin ? 'No more sessions today' : 'Nothing scheduled next'}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Today's Full Timeline */}
      <Card className="overflow-hidden border-border/60">
        <div className="px-5 py-3 border-b border-border/40 bg-muted/20">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Timer className="h-4 w-4 text-muted-foreground" />
            Today&apos;s Timeline
          </h3>
        </div>
        <div className="p-3 space-y-1">
          {blocks.map((block, idx) => {
            const start = timeToMinutes(block.startTime)
            const end = timeToMinutes(block.endTime)
            const isDone = currentMinutes >= end
            const isActive = currentMinutes >= start && currentMinutes < end
            const isFuture = currentMinutes < start

            return (
              <div
                key={block.id}
                className={`schedule-block flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-500 ${
                  isActive
                    ? 'bg-card shadow-md border border-border/80 scale-[1.01]'
                    : isDone
                      ? 'opacity-50'
                      : 'hover:bg-muted/30'
                }`}
                style={{
                  animationDelay: `${idx * 50}ms`,
                  borderLeftWidth: isActive ? '4px' : '0',
                  borderLeftColor: isActive ? block.color : undefined,
                }}
              >
                {/* Status indicator */}
                <div className="flex-shrink-0 w-5 flex justify-center">
                  {isDone ? (
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-emerald-500" />
                    </div>
                  ) : isActive ? (
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: block.color }} />
                      <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: block.color }} />
                    </span>
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-border" />
                  )}
                </div>

                {/* Time */}
                <div className="flex-shrink-0 w-[100px] md:w-[130px]">
                  <span className={`text-xs font-mono ${isActive ? 'font-bold' : 'text-muted-foreground'}`} style={isActive ? { color: block.color } : {}}>
                    {formatTime12(block.startTime)}
                  </span>
                  <span className="text-[10px] text-muted-foreground mx-1">–</span>
                  <span className={`text-xs font-mono ${isActive ? 'font-bold' : 'text-muted-foreground'}`} style={isActive ? { color: block.color } : {}}>
                    {formatTime12(block.endTime)}
                  </span>
                </div>

                {/* Icon */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${block.isBreak ? 'bg-muted' : ''}`}
                  style={block.isBreak ? {} : { backgroundColor: `${block.color}15`, color: block.color }}
                >
                  {getBlockIcon(block.icon, 'h-3.5 w-3.5')}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isDone ? 'line-through' : ''} ${block.isBreak ? 'text-muted-foreground' : ''}`}>
                    {block.sessionName}
                  </p>
                </div>

                {/* Duration */}
                <span className="text-[10px] text-muted-foreground flex-shrink-0 hidden sm:block">
                  {formatDuration(block.startTime, block.endTime)}
                </span>

                {/* Active progress mini */}
                {isActive && (
                  <div className="w-12 h-1 bg-muted rounded-full overflow-hidden flex-shrink-0">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.round(((currentMinutes - start) / (end - start)) * 100)}%`,
                        backgroundColor: block.color,
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

// ─── Weekly Cards ───────────────────────────────────────────────────────────────

function WeeklyCards({
  plan, now, onEditDay,
}: {
  plan: SchedulePlan
  now: Date
  onEditDay: (idx: number) => void
}) {
  const todayIdx = now.getDay() // 0=Sun
  // Reorder to start from Monday: Mon(1) Tue(2) Wed(3) Thu(4) Fri(5) Sat(6) Sun(0)
  // weeklyRhythm is already Mon-Sun in index 0-6

  return (
    <div className="schedule-section-enter">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          Weekly Schedule
        </h2>
        <Badge variant="secondary" className="text-xs">Alternate A/B Days</Badge>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-3">
        {plan.weeklyRhythm.map((wd, idx) => {
          const tmpl = plan.templates.find(t => t.id === wd.templateId)
          // weeklyRhythm[0]=Monday=DAY_NAMES index 1, etc.
          const dayOfWeekIdx = idx === 6 ? 0 : idx + 1 // Convert Mon(0)->1, ..., Sun(6)->0
          const isToday = dayOfWeekIdx === todayIdx
          const isPast = (() => {
            // Simple: if day index is before today in the week
            const todayMon = todayIdx === 0 ? 6 : todayIdx - 1 // Mon-based index
            return idx < todayMon
          })()

          return (
            <Card
              key={wd.day}
              className={`schedule-block relative overflow-hidden p-3 md:p-4 transition-all duration-300 cursor-pointer group ${
                isToday
                  ? 'shadow-lg scale-[1.02]'
                  : isPast
                    ? 'opacity-60 hover:opacity-90'
                    : 'hover:shadow-md hover:-translate-y-0.5'
              }`}
              style={{
                animationDelay: `${idx * 60}ms`,
                borderTopWidth: '3px',
                borderTopColor: tmpl?.color || '#6366f1',
                ...(isToday ? { outline: `2px solid ${tmpl?.color || '#6366f1'}`, outlineOffset: '1px' } : {}),
              }}
              onClick={() => onEditDay(idx)}
            >
              {isToday && (
                <div className="absolute top-1.5 right-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: tmpl?.color }} />
                    <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: tmpl?.color }} />
                  </span>
                </div>
              )}
              <div className="space-y-2">
                <div>
                  <p className={`text-xs font-bold ${isToday ? '' : 'text-muted-foreground'}`}>
                    {wd.day.slice(0, 3).toUpperCase()}
                  </p>
                  <p className="text-[10px] text-muted-foreground hidden md:block">{wd.day}</p>
                </div>
                <Badge
                  className="text-[10px] font-semibold w-full justify-center"
                  style={{
                    backgroundColor: `${tmpl?.color || '#6366f1'}18`,
                    color: tmpl?.color || '#6366f1',
                    borderColor: 'transparent',
                  }}
                >
                  {tmpl?.name || 'Unset'}
                </Badge>
                <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2 hidden md:block">
                  {wd.topic}
                </p>
                {tmpl && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-2.5 w-2.5" />
                    {tmpl.blocks.length} blocks
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ─── Single Time Block Row (for Editor) ─────────────────────────────────────────

function TimeBlockRow({
  block, index, onEdit, onDelete, onDuplicate, totalBlocks,
  onMoveUp, onMoveDown,
}: {
  block: TimeBlock
  index: number
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  totalBlocks: number
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const [hovering, setHovering] = useState(false)

  return (
    <div
      className={`schedule-block group relative flex items-stretch gap-0 rounded-xl transition-all duration-300 ${
        block.isBreak
          ? 'bg-muted/40 dark:bg-muted/20 border border-dashed border-border/50'
          : 'bg-card border border-border/60 shadow-sm hover:shadow-md hover:-translate-y-0.5'
      }`}
      style={{
        animationDelay: `${index * 60}ms`,
        borderLeftColor: block.isBreak ? undefined : block.color,
        borderLeftWidth: block.isBreak ? undefined : '4px',
        borderLeftStyle: block.isBreak ? undefined : 'solid',
      }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Time Column */}
      <div className={`flex flex-col items-center justify-center px-3 md:px-5 py-3 min-w-[90px] md:min-w-[120px] ${block.isBreak ? '' : 'border-r border-border/30'}`}>
        <span className="text-xs md:text-sm font-bold" style={{ color: block.isBreak ? undefined : block.color }}>
          {formatTime12(block.startTime)}
        </span>
        <span className="text-[10px] text-muted-foreground my-0.5">to</span>
        <span className="text-xs md:text-sm font-bold" style={{ color: block.isBreak ? undefined : block.color }}>
          {formatTime12(block.endTime)}
        </span>
      </div>

      {/* Icon */}
      <div className="flex items-center justify-center px-2 md:px-3">
        <div
          className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${block.isBreak ? 'bg-muted' : ''}`}
          style={block.isBreak ? {} : { backgroundColor: `${block.color}18`, color: block.color }}
        >
          {getBlockIcon(block.icon)}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 py-3 pr-3 min-w-0">
        <p className={`font-semibold text-sm md:text-base leading-tight ${block.isBreak ? 'text-muted-foreground' : ''}`}>
          {block.sessionName}
        </p>
        {block.description && (
          <p className="text-xs md:text-sm text-muted-foreground mt-1 leading-relaxed line-clamp-2">
            {block.description}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className={`flex items-center gap-1 pr-2 transition-opacity duration-200 ${hovering ? 'opacity-100' : 'opacity-0'}`}>
        <TooltipProvider delayDuration={300}>
          {index > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={onMoveUp} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronDown className="h-3.5 w-3.5 rotate-180" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top"><p className="text-xs">Move up</p></TooltipContent>
            </Tooltip>
          )}
          {index < totalBlocks - 1 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={onMoveDown} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top"><p className="text-xs">Move down</p></TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onEdit} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                <Edit3 className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">Edit</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onDuplicate} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                <Copy className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">Duplicate</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onDelete} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top"><p className="text-xs">Delete</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function SchedulePlanner() {
  const [plan, setPlan] = useState<SchedulePlan | null>(null)
  const [activeTemplate, setActiveTemplate] = useState(0)
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null)
  const [editingBlockTemplateIdx, setEditingBlockTemplateIdx] = useState(0)
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [showAddTemplate, setShowAddTemplate] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateSubtitle, setNewTemplateSubtitle] = useState('')
  const [newTemplateColor, setNewTemplateColor] = useState('#6366f1')
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'block' | 'template'; templateIdx: number; blockId?: string } | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [now, setNow] = useState(new Date())
  const [activeTab, setActiveTab] = useState('today')
  const [editingWeekDay, setEditingWeekDay] = useState<number | null>(null)

  const { data: session, isPending: sessionPending } = useSession()
  const user = session?.user

  // Wizard state
  const [showWizard, setShowWizard] = useState(false)
  const [wizardStart, setWizardStart] = useState('09:00')
  const [wizardEnd, setWizardEnd] = useState('17:00')
  const [wizardSubjects, setWizardSubjects] = useState('')
  const [wizardGoal, setWizardGoal] = useState('')

  // Real-time clock — updates every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  // Load from localStorage
  useEffect(() => {
    if (sessionPending) return

    const userId = user?.id || 'guest'
    const userStorageKey = `studyflow-schedule-plan-${userId}`

    try {
      const raw = localStorage.getItem(userStorageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        // If this is the B.Tech CSE plan but the user is not the owner (sg902266@gmail.com), force reset it to empty
        if (
          parsed.title === 'B.Tech CSE Graduate' &&
          user?.email?.toLowerCase() !== 'sg902266@gmail.com'
        ) {
          setPlan(createEmptyPlan())
          setShowWizard(true)
        } else {
          setPlan(parsed)
        }
      } else {
        if (user?.email?.toLowerCase() === 'sg902266@gmail.com') {
          setPlan(createDefaultPlan())
        } else {
          setPlan(createEmptyPlan())
          setShowWizard(true)
        }
      }
    } catch {
      if (user?.email?.toLowerCase() === 'sg902266@gmail.com') {
        setPlan(createDefaultPlan())
      } else {
        setPlan(createEmptyPlan())
      }
    }
    setLoaded(true)
  }, [user, sessionPending])

  // Save to localStorage
  useEffect(() => {
    if (plan && loaded && !sessionPending) {
      const userId = user?.id || 'guest'
      const userStorageKey = `studyflow-schedule-plan-${userId}`
      localStorage.setItem(userStorageKey, JSON.stringify(plan))
    }
  }, [plan, loaded, user, sessionPending])

  const handleGenerateFromWizard = () => {
    try {
      const newPlan = generateScheduleFromWizard(
        wizardStart,
        wizardEnd,
        wizardSubjects,
        wizardGoal
      )
      setPlan(newPlan)
      setShowWizard(false)
      toast.success('Custom schedule generated successfully!')
    } catch (err) {
      toast.error('Failed to generate schedule. Please check inputs.')
    }
  }

  const updatePlan = useCallback((updater: (p: SchedulePlan) => SchedulePlan) => {
    setPlan(prev => prev ? updater(prev) : prev)
  }, [])

  // Derive today's template
  const getTodayTemplate = useCallback((): { template: DayTemplate | null; rhythm: WeekDay | null } => {
    if (!plan) return { template: null, rhythm: null }
    const dayIdx = now.getDay() // 0=Sun
    // weeklyRhythm: 0=Mon ... 6=Sun
    const rhythmIdx = dayIdx === 0 ? 6 : dayIdx - 1
    const rhythm = plan.weeklyRhythm[rhythmIdx]
    const template = plan.templates.find(t => t.id === rhythm?.templateId) || null
    return { template, rhythm }
  }, [plan, now])

  const { template: todayTemplate, rhythm: todayRhythm } = getTodayTemplate()

  // ─── Block Operations ──────────────────────────────────────────────

  const addBlock = (templateIdx: number) => {
    const template = plan!.templates[templateIdx]
    const lastBlock = template.blocks[template.blocks.length - 1]
    const newBlock: TimeBlock = {
      id: uid(),
      startTime: lastBlock ? lastBlock.endTime : '10:00',
      endTime: lastBlock ? `${(parseInt(lastBlock.endTime.split(':')[0]) + 1).toString().padStart(2, '0')}:${lastBlock.endTime.split(':')[1]}` : '11:00',
      sessionName: 'New Session',
      description: 'Click to edit this block...',
      color: BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)].value,
      icon: 'book',
      isBreak: false,
    }
    updatePlan(p => ({
      ...p,
      templates: p.templates.map((t, i) =>
        i === templateIdx ? { ...t, blocks: [...t.blocks, newBlock] } : t
      ),
    }))
    toast.success('Block added')
  }

  const deleteBlock = (templateIdx: number, blockId: string) => {
    updatePlan(p => ({
      ...p,
      templates: p.templates.map((t, i) =>
        i === templateIdx ? { ...t, blocks: t.blocks.filter(b => b.id !== blockId) } : t
      ),
    }))
    setDeleteConfirm(null)
    toast.success('Block deleted')
  }

  const duplicateBlock = (templateIdx: number, blockId: string) => {
    updatePlan(p => ({
      ...p,
      templates: p.templates.map((t, i) => {
        if (i !== templateIdx) return t
        const idx = t.blocks.findIndex(b => b.id === blockId)
        if (idx === -1) return t
        const dupe = { ...t.blocks[idx], id: uid() }
        const newBlocks = [...t.blocks]
        newBlocks.splice(idx + 1, 0, dupe)
        return { ...t, blocks: newBlocks }
      }),
    }))
    toast.success('Block duplicated')
  }

  const moveBlock = (templateIdx: number, blockIdx: number, direction: 'up' | 'down') => {
    updatePlan(p => ({
      ...p,
      templates: p.templates.map((t, i) => {
        if (i !== templateIdx) return t
        const newBlocks = [...t.blocks]
        const swapIdx = direction === 'up' ? blockIdx - 1 : blockIdx + 1
        if (swapIdx < 0 || swapIdx >= newBlocks.length) return t
        ;[newBlocks[blockIdx], newBlocks[swapIdx]] = [newBlocks[swapIdx], newBlocks[blockIdx]]
        return { ...t, blocks: newBlocks }
      }),
    }))
  }

  const saveBlock = (block: TimeBlock) => {
    updatePlan(p => ({
      ...p,
      templates: p.templates.map((t, i) =>
        i === editingBlockTemplateIdx
          ? { ...t, blocks: t.blocks.map(b => (b.id === block.id ? block : b)) }
          : t
      ),
    }))
    toast.success('Block updated')
  }

  // ─── Template Operations ───────────────────────────────────────────

  const addTemplate = () => {
    if (!newTemplateName.trim()) return
    const newTemplate: DayTemplate = {
      id: uid(),
      name: newTemplateName.trim(),
      subtitle: newTemplateSubtitle.trim() || 'Custom schedule',
      color: newTemplateColor,
      blocks: [],
    }
    updatePlan(p => ({ ...p, templates: [...p.templates, newTemplate] }))
    setShowAddTemplate(false)
    setNewTemplateName('')
    setNewTemplateSubtitle('')
    setActiveTemplate(plan!.templates.length)
    toast.success('Template created')
  }

  const deleteTemplate = (idx: number) => {
    if (plan!.templates.length <= 1) {
      toast.error('Must have at least one template')
      return
    }
    const templateId = plan!.templates[idx].id
    updatePlan(p => ({
      ...p,
      templates: p.templates.filter((_, i) => i !== idx),
      weeklyRhythm: p.weeklyRhythm.map(w =>
        w.templateId === templateId ? { ...w, templateId: p.templates[0].id } : w
      ),
    }))
    if (activeTemplate >= idx && activeTemplate > 0) setActiveTemplate(activeTemplate - 1)
    setDeleteConfirm(null)
    toast.success('Template deleted')
  }

  const resetPlan = () => {
    if (user?.email?.toLowerCase() === 'sg902266@gmail.com') {
      setPlan(createDefaultPlan())
    } else {
      setPlan(createEmptyPlan())
      setShowWizard(true)
    }
    setActiveTemplate(0)
    toast.success('Schedule reset to default')
  }

  if (!loaded || !plan) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="schedule-loading-spinner" />
      </div>
    )
  }

  const currentTemplate = plan.templates[activeTemplate] || plan.templates[0]

  return (
    <div className="schedule-planner space-y-6 md:space-y-8 pb-8">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="schedule-header relative overflow-hidden rounded-2xl p-5 md:p-7"
        style={{
          background: `linear-gradient(135deg, ${(todayTemplate || currentTemplate).color}12, ${(todayTemplate || currentTemplate).color}05, transparent)`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 mb-1">
                <CalendarClock className="h-5 w-5" style={{ color: (todayTemplate || currentTemplate).color }} />
                <Badge variant="secondary" className="text-xs font-medium" style={{ backgroundColor: `${(todayTemplate || currentTemplate).color}18`, color: (todayTemplate || currentTemplate).color }}>
                  Schedule Planner
                </Badge>
              </div>
              <InlineEdit
                value={plan.title}
                onChange={v => updatePlan(p => ({ ...p, title: v }))}
                className="text-2xl md:text-3xl font-bold tracking-tight"
                tag="h1"
              />
              <InlineEdit
                value={plan.subtitle}
                onChange={v => updatePlan(p => ({ ...p, subtitle: v }))}
                className="text-sm text-muted-foreground"
                tag="p"
              />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                <InlineEdit value={plan.timeRange} onChange={v => updatePlan(p => ({ ...p, timeRange: v }))} className="text-xs" />
              </Badge>
              <Button
                onClick={() => setShowWizard(true)}
                size="sm"
                variant="outline"
                className="h-8 gap-1 border-dashed border-primary/40 text-primary hover:bg-primary/5 cursor-pointer font-medium"
              >
                <Sparkles className="h-3.5 w-3.5" /> Wizard
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => updatePlan(p => ({ ...p, showWeeklyRhythm: !p.showWeeklyRhythm }))}>
                    {plan.showWeeklyRhythm ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                    {plan.showWeeklyRhythm ? 'Hide' : 'Show'} Weekly Cards
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowWizard(true)}>
                    <Sparkles className="h-4 w-4 mr-2 text-primary animate-pulse" />
                    Study Plan Wizard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={resetPlan} className="text-destructive focus:text-destructive">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Default
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Tabs ─────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full md:w-auto grid grid-cols-3 md:inline-flex">
          <TabsTrigger value="today" className="gap-1.5 text-xs md:text-sm">
            <Zap className="h-3.5 w-3.5" /> Today
          </TabsTrigger>
          <TabsTrigger value="weekly" className="gap-1.5 text-xs md:text-sm">
            <CalendarDays className="h-3.5 w-3.5" /> Weekly
          </TabsTrigger>
          <TabsTrigger value="editor" className="gap-1.5 text-xs md:text-sm">
            <LayoutGrid className="h-3.5 w-3.5" /> Editor
          </TabsTrigger>
        </TabsList>

        {/* ── Today Tab ────────────────────────────────────────────────── */}
        <TabsContent value="today" className="mt-4">
          <TodayLiveCard plan={plan} now={now} todayTemplate={todayTemplate} todayRhythm={todayRhythm} />
        </TabsContent>

        {/* ── Weekly Tab ───────────────────────────────────────────────── */}
        <TabsContent value="weekly" className="mt-4 space-y-6">
          {plan.showWeeklyRhythm && (
            <WeeklyCards
              plan={plan}
              now={now}
              onEditDay={(idx) => {
                setEditingWeekDay(idx)
              }}
            />
          )}

          {/* Weekly Day Editing */}
          {editingWeekDay !== null && (
            <Card className="schedule-section-enter p-5 border-border/60">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">{plan.weeklyRhythm[editingWeekDay].day}</h3>
                <Button variant="ghost" size="sm" onClick={() => setEditingWeekDay(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Assigned Template</Label>
                  <Select
                    value={plan.weeklyRhythm[editingWeekDay].templateId}
                    onValueChange={v => updatePlan(p => ({
                      ...p,
                      weeklyRhythm: p.weeklyRhythm.map((w, i) => i === editingWeekDay ? { ...w, templateId: v } : w),
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {plan.templates.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                            {t.name} — {t.subtitle}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Topic / Focus</Label>
                  <Input
                    value={plan.weeklyRhythm[editingWeekDay].topic}
                    onChange={e => updatePlan(p => ({
                      ...p,
                      weeklyRhythm: p.weeklyRhythm.map((w, i) => i === editingWeekDay ? { ...w, topic: e.target.value } : w),
                    }))}
                    placeholder="What to focus on this day..."
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Show each day's blocks preview */}
          {editingWeekDay !== null && (() => {
            const rhythm = plan.weeklyRhythm[editingWeekDay]
            const tmpl = plan.templates.find(t => t.id === rhythm.templateId)
            if (!tmpl) return null
            return (
              <Card className="schedule-section-enter overflow-hidden border-border/60">
                <div className="px-5 py-3 border-b border-border/40" style={{ background: `linear-gradient(135deg, ${tmpl.color}10, transparent)` }}>
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tmpl.color }} />
                    {rhythm.day} — {tmpl.name} Schedule
                  </h3>
                </div>
                <div className="p-3 space-y-1">
                  {tmpl.blocks.map((block, idx) => (
                    <div
                      key={block.id}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/30 transition-colors"
                    >
                      <div className="w-[110px] text-xs font-mono text-muted-foreground flex-shrink-0">
                        {formatTime12(block.startTime)} – {formatTime12(block.endTime)}
                      </div>
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                        style={block.isBreak ? { backgroundColor: 'var(--muted)' } : { backgroundColor: `${block.color}18`, color: block.color }}
                      >
                        {getBlockIcon(block.icon, 'h-3 w-3')}
                      </div>
                      <p className={`text-sm ${block.isBreak ? 'text-muted-foreground' : 'font-medium'}`}>{block.sessionName}</p>
                      <span className="text-[10px] text-muted-foreground ml-auto">{formatDuration(block.startTime, block.endTime)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )
          })()}
        </TabsContent>

        {/* ── Editor Tab ───────────────────────────────────────────────── */}
        <TabsContent value="editor" className="mt-4 space-y-4">
          {/* Template Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {plan.templates.map((tmpl, idx) => (
              <button
                key={tmpl.id}
                onClick={() => setActiveTemplate(idx)}
                className={`schedule-tab group relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                  activeTemplate === idx
                    ? 'text-white shadow-lg scale-[1.02]'
                    : 'bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:border-border'
                }`}
                style={activeTemplate === idx ? {
                  background: `linear-gradient(135deg, ${tmpl.color}, ${tmpl.color}cc)`,
                  boxShadow: `0 4px 15px ${tmpl.color}30`,
                } : {}}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tmpl.color }} />
                {tmpl.name}
                {plan.templates.length > 1 && activeTemplate === idx && (
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteConfirm({ type: 'template', templateIdx: idx }) }}
                    className="ml-1 p-0.5 rounded hover:bg-white/20 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </button>
            ))}
            <button
              onClick={() => setShowAddTemplate(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 border-dashed border-border/60 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all duration-300"
            >
              <Plus className="h-3.5 w-3.5" /> Add Day
            </button>
          </div>

          {/* Template Content */}
          <Card className="schedule-card overflow-hidden border-border/60">
            <div
              className="px-5 md:px-6 py-4 border-b border-border/40"
              style={{ background: `linear-gradient(135deg, ${currentTemplate.color}10, transparent)` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                    style={{ background: `linear-gradient(135deg, ${currentTemplate.color}, ${currentTemplate.color}bb)` }}
                  >
                    {currentTemplate.name.charAt(currentTemplate.name.length - 1)}
                  </div>
                  <div>
                    <InlineEdit
                      value={currentTemplate.name}
                      onChange={v => updatePlan(p => ({
                        ...p,
                        templates: p.templates.map((t, i) => i === activeTemplate ? { ...t, name: v } : t),
                      }))}
                      className="font-bold text-base md:text-lg"
                    />
                    <InlineEdit
                      value={currentTemplate.subtitle}
                      onChange={v => updatePlan(p => ({
                        ...p,
                        templates: p.templates.map((t, i) => i === activeTemplate ? { ...t, subtitle: v } : t),
                      }))}
                      className="text-xs text-muted-foreground"
                      tag="p"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 rounded-lg hover:bg-accent transition-colors" title="Change color">
                        <Palette className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="p-3">
                      <div className="flex flex-wrap gap-2 max-w-[200px]">
                        {TEMPLATE_COLORS.map(c => (
                          <button
                            key={c.value}
                            onClick={() => updatePlan(p => ({
                              ...p,
                              templates: p.templates.map((t, i) => i === activeTemplate ? { ...t, color: c.value } : t),
                            }))}
                            className={`w-7 h-7 rounded-full transition-all duration-200 ${currentTemplate.color === c.value ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-110'}`}
                            style={{ backgroundColor: c.value }}
                          />
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Badge variant="secondary" className="text-xs">
                    {currentTemplate.blocks.length} blocks
                  </Badge>
                </div>
              </div>
            </div>

            {/* Table header */}
            <div className="px-5 md:px-6 py-2 border-b border-border/30 bg-muted/30">
              <div className="flex items-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <span className="min-w-[90px] md:min-w-[120px] px-3 md:px-5">Time</span>
                <span className="px-2 md:px-3 min-w-[32px] md:min-w-[36px]"></span>
                <span className="flex-1">Session</span>
                <span className="pr-2">Actions</span>
              </div>
            </div>

            {/* Blocks */}
            <div className="p-3 md:p-4 space-y-2">
              {currentTemplate.blocks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarClock className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No time blocks yet</p>
                  <p className="text-sm mt-1">Click the button below to add your first block</p>
                </div>
              ) : (
                currentTemplate.blocks.map((block, idx) => (
                  <TimeBlockRow
                    key={block.id}
                    block={block}
                    index={idx}
                    totalBlocks={currentTemplate.blocks.length}
                    onEdit={() => {
                      setEditingBlock(block)
                      setEditingBlockTemplateIdx(activeTemplate)
                      setBlockDialogOpen(true)
                    }}
                    onDelete={() => setDeleteConfirm({ type: 'block', templateIdx: activeTemplate, blockId: block.id })}
                    onDuplicate={() => duplicateBlock(activeTemplate, block.id)}
                    onMoveUp={() => moveBlock(activeTemplate, idx, 'up')}
                    onMoveDown={() => moveBlock(activeTemplate, idx, 'down')}
                  />
                ))
              )}

              <button
                onClick={() => addBlock(activeTemplate)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border/50 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 group"
              >
                <Plus className="h-4 w-4 group-hover:scale-110 transition-transform" />
                Add Time Block
              </button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ───────────────────────────────────────────────────── */}

      <BlockEditDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen} block={editingBlock} onSave={saveBlock} />

      {/* Add Template Dialog */}
      <Dialog open={showAddTemplate} onOpenChange={setShowAddTemplate}>
        <DialogContent className="sm:max-w-[400px] schedule-dialog-content">
          <DialogHeader>
            <DialogTitle>Create New Day Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Template Name</Label>
              <Input value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} placeholder="e.g. Day C" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Focus / Subtitle</Label>
              <Input value={newTemplateSubtitle} onChange={e => setNewTemplateSubtitle(e.target.value)} placeholder="e.g. Focus: Revision + Mocks" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Color</Label>
              <div className="flex flex-wrap gap-2">
                {TEMPLATE_COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setNewTemplateColor(c.value)}
                    className={`w-7 h-7 rounded-full transition-all duration-200 ${newTemplateColor === c.value ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
            <Button size="sm" onClick={addTemplate} disabled={!newTemplateName.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Setup Wizard Dialog */}
      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="sm:max-w-[460px] schedule-dialog-content">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Study Plan Setup Wizard
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Answer a few questions to generate a customized, editable study plan.
            </p>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Start Study Time</Label>
                <Input type="time" value={wizardStart} onChange={e => setWizardStart(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">End Study Time</Label>
                <Input type="time" value={wizardEnd} onChange={e => setWizardEnd(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Study Subjects / Focus Areas</Label>
              <Input
                value={wizardSubjects}
                onChange={e => setWizardSubjects(e.target.value)}
                placeholder="e.g. Maths, Physics, Coding, Revision (comma separated)"
              />
              <p className="text-[10px] text-muted-foreground">
                We will distribute these subjects dynamically across your schedule.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Main Goal / Target Topic</Label>
              <Input
                value={wizardGoal}
                onChange={e => setWizardGoal(e.target.value)}
                placeholder="e.g. Prepare for final exams or GATE 2027"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button size="sm" onClick={handleGenerateFromWizard}>
              <Sparkles className="h-4 w-4 mr-1.5" /> Generate Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-[360px] schedule-dialog-content">
          <DialogHeader>
            <DialogTitle className="text-destructive">Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deleteConfirm?.type === 'template'
              ? 'Are you sure you want to delete this entire day template? All blocks in it will be lost.'
              : 'Are you sure you want to delete this time block?'}
          </p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (deleteConfirm?.type === 'template') {
                  deleteTemplate(deleteConfirm.templateIdx)
                } else if (deleteConfirm?.type === 'block' && deleteConfirm.blockId) {
                  deleteBlock(deleteConfirm.templateIdx, deleteConfirm.blockId)
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
