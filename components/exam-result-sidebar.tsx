'use client'

import { useState } from 'react'
import { updateExamResult } from '@/app/actions/exams'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  ClipboardCheck,
  Calendar,
  Link2,
  Award,
  FileText,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExamResultSidebarProps {
  examId: number
  examTitle: string
  appearedInExam?: boolean
  resultStatus?: string
  resultDate?: Date | null
  resultLink?: string
  score?: string
  resultNotes?: string
}

const resultStatusConfig = {
  not_appeared: {
    label: 'Not Appeared',
    icon: HelpCircle,
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  awaited: {
    label: 'Result Awaited',
    icon: Clock3,
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  declared: {
    label: 'Result Declared',
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
}

export function ExamResultSidebar({
  examId,
  examTitle,
  appearedInExam = false,
  resultStatus = 'not_appeared',
  resultDate,
  resultLink,
  score,
  resultNotes,
}: ExamResultSidebarProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [appeared, setAppeared] = useState(appearedInExam)
  const [status, setStatus] = useState(resultStatus)

  const currentConfig = resultStatusConfig[status as keyof typeof resultStatusConfig] ?? resultStatusConfig.not_appeared
  const StatusIcon = currentConfig.icon

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)

    try {
      const resultDateVal = formData.get('resultDate') as string
      await updateExamResult(examId, {
        appearedInExam: appeared,
        resultStatus: status,
        resultDate: resultDateVal ? new Date(resultDateVal) : undefined,
        resultLink: (formData.get('resultLink') as string) || undefined,
        score: (formData.get('score') as string) || undefined,
        resultNotes: (formData.get('resultNotes') as string) || undefined,
      })
      setOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'gap-2 text-xs font-medium border transition-all',
            appeared
              ? 'border-primary/40 text-primary hover:bg-primary/10'
              : 'hover:border-primary/40 hover:text-primary'
          )}
        >
          <ClipboardCheck className="h-3.5 w-3.5" />
          {appeared ? 'Result Info' : 'Log Result'}
          {appeared && status !== 'not_appeared' && (
            <Badge
              className={cn(
                'ml-1 text-[9px] px-1.5 py-0 h-4',
                currentConfig.color
              )}
            >
              <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
              {currentConfig.label}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Result Tracking
          </SheetTitle>
          <SheetDescription className="text-sm font-medium text-foreground/80 line-clamp-2">
            {examTitle}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">

          {/* Did you appear? */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <p className="text-sm font-semibold">Did you appear in this exam?</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setAppeared(true)
                  if (status === 'not_appeared') setStatus('awaited')
                }}
                className={cn(
                  'flex-1 rounded-lg border-2 py-3 text-sm font-medium transition-all',
                  appeared
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50 text-muted-foreground'
                )}
              >
                ✅ Yes, I appeared
              </button>
              <button
                type="button"
                onClick={() => {
                  setAppeared(false)
                  setStatus('not_appeared')
                }}
                className={cn(
                  'flex-1 rounded-lg border-2 py-3 text-sm font-medium transition-all',
                  !appeared
                    ? 'border-destructive bg-destructive/10 text-destructive'
                    : 'border-border hover:border-destructive/50 text-muted-foreground'
                )}
              >
                ❌ No / Skipped
              </button>
            </div>
          </div>

          {/* Result Status — only if appeared */}
          {appeared && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Result Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['awaited', 'declared'] as const).map((s) => {
                  const cfg = resultStatusConfig[s]
                  const Icon = cfg.icon
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={cn(
                        'rounded-lg border-2 py-3 px-2 text-xs font-medium transition-all flex flex-col items-center gap-1.5',
                        status === s
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/40 text-muted-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Expected / Actual Result Date */}
          {appeared && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <label htmlFor="resultDate" className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                {status === 'declared' ? 'Result Declared On' : 'Expected Result Date'}
              </label>
              <Input
                id="resultDate"
                name="resultDate"
                type="datetime-local"
                defaultValue={
                  resultDate
                    ? new Date(resultDate).toISOString().slice(0, 16)
                    : ''
                }
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {status === 'awaited'
                  ? 'When do you expect the result to be announced?'
                  : 'When was the result officially declared?'}
              </p>
            </div>
          )}

          {/* Score / Rank / Grade */}
          {appeared && status === 'declared' && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <label htmlFor="score" className="text-sm font-semibold flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-500" />
                Score / Rank / Grade
              </label>
              <Input
                id="score"
                name="score"
                placeholder="e.g. 87/100, Rank 234, Grade A"
                defaultValue={score ?? ''}
                className="text-sm"
              />
            </div>
          )}

          {/* Result Link */}
          {appeared && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <label htmlFor="resultLink" className="text-sm font-semibold flex items-center gap-2">
                <Link2 className="h-4 w-4 text-indigo-500" />
                Official Result Link
              </label>
              <Input
                id="resultLink"
                name="resultLink"
                type="url"
                placeholder="https://board.gov.in/results/..."
                defaultValue={resultLink ?? ''}
                className="text-sm"
              />
            </div>
          )}

          {/* Personal Notes */}
          {appeared && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <label htmlFor="resultNotes" className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" />
                Personal Notes
              </label>
              <textarea
                id="resultNotes"
                name="resultNotes"
                rows={3}
                placeholder="How did the exam go? Any observations..."
                defaultValue={resultNotes ?? ''}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          {/* Current Summary Banner */}
          {appeared && (
            <div
              className={cn(
                'rounded-lg p-3 flex items-center gap-3 text-sm',
                currentConfig.color
              )}
            >
              <StatusIcon className="h-4 w-4 shrink-0" />
              <span className="font-medium">{currentConfig.label}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Saving...' : 'Save Result Info'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
