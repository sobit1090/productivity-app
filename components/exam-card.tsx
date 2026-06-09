'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2, Calendar, Clock, MapPin, AlertCircle, FileDown } from 'lucide-react'
import { format } from 'date-fns'
import { deleteExam } from '@/app/actions/exams'
import { cn } from '@/lib/utils'
import { EditExamDialog } from '@/components/edit-exam-dialog'
import { ExamResultSidebar } from '@/components/exam-result-sidebar'

interface ExamCardProps {
  id: number
  title: string
  description?: string
  examDate: Date
  duration?: number
  location?: string
  syllabus?: string
  status: string
  formDeadline?: Date
  admitCardLink?: string
  admitCardStatus?: string
  subjectId?: number
  subjects?: { id: number; name: string; color: string | null }[]
  // Result tracking
  appearedInExam?: boolean
  resultStatus?: string
  resultDate?: Date | null
  resultLink?: string
  score?: string
  resultNotes?: string
  onDelete?: () => void
}

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const admitStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  released: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  downloaded: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
}

export function ExamCard({
  id,
  title,
  description,
  examDate,
  duration,
  location,
  syllabus,
  status,
  formDeadline,
  admitCardLink,
  admitCardStatus,
  subjectId,
  subjects = [],
  appearedInExam,
  resultStatus,
  resultDate,
  resultLink,
  score,
  resultNotes,
  onDelete,
}: ExamCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const isFormExpired = formDeadline && new Date(formDeadline) < new Date()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteExam(id)
      onDelete?.()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="p-4 border transition-colors">
      <div className="space-y-3">
        {/* Header: title + status badge */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold">{title}</h3>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap break-words">
                {description}
              </p>
            )}
          </div>
          <Badge className={statusColors[status as keyof typeof statusColors]}>
            {status}
          </Badge>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm border-t pt-2 mt-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            {format(new Date(examDate), 'MMM dd, yyyy h:mm a')}
          </div>
          {duration && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" />
              {duration} minutes
            </div>
          )}
          {location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              {location}
            </div>
          )}

          {/* Government Exam trackers */}
          {formDeadline && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle
                className={cn('h-4 w-4 shrink-0', isFormExpired ? 'text-destructive' : 'text-amber-500')}
              />
              <span className={cn(isFormExpired ? 'text-destructive font-semibold' : 'text-foreground/80')}>
                {isFormExpired ? 'Apply closed: ' : 'Apply by: '}
                {format(new Date(formDeadline), 'MMM dd, yyyy')}
              </span>
            </div>
          )}

          {admitCardStatus && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileDown className="h-4 w-4 shrink-0" />
              <span>Admit Card:</span>
              {admitCardLink ? (
                <a
                  href={admitCardLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-semibold"
                >
                  Download ({admitCardStatus})
                </a>
              ) : (
                <Badge
                  className={cn(
                    'text-[10px] px-1.5 py-0',
                    admitStatusColors[admitCardStatus as keyof typeof admitStatusColors]
                  )}
                >
                  {admitCardStatus}
                </Badge>
              )}
            </div>
          )}

          {/* Result quick-info (if already logged) */}
          {appearedInExam && resultStatus && resultStatus !== 'not_appeared' && (
            <div className="mt-2 rounded-md bg-muted/40 px-3 py-2 text-xs space-y-0.5">
              {resultStatus === 'declared' && score && (
                <p className="font-semibold text-foreground">Score: {score}</p>
              )}
              {resultDate && (
                <p className="text-muted-foreground">
                  {resultStatus === 'declared' ? 'Declared' : 'Expected'}:{' '}
                  {format(new Date(resultDate), 'MMM dd, yyyy')}
                </p>
              )}
              {resultLink && (
                <a
                  href={resultLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline block"
                >
                  View Result →
                </a>
              )}
            </div>
          )}
        </div>

        {/* Action row */}
        <div className="flex items-center justify-between gap-2 border-t pt-3">
          {/* Result sidebar trigger */}
          <ExamResultSidebar
            examId={id}
            examTitle={title}
            appearedInExam={appearedInExam}
            resultStatus={resultStatus}
            resultDate={resultDate}
            resultLink={resultLink}
            score={score}
            resultNotes={resultNotes}
          />

          <div className="flex items-center gap-1">
            <EditExamDialog
              id={id}
              title={title}
              description={description}
              examDate={examDate}
              duration={duration}
              location={location}
              syllabus={syllabus}
              status={status}
              formDeadline={formDeadline}
              admitCardLink={admitCardLink}
              admitCardStatus={admitCardStatus}
              subjects={subjects}
              subjectId={subjectId}
            />

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Delete exam"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
