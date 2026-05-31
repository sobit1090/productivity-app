'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, Calendar, Clock, MapPin, AlertCircle, FileDown } from 'lucide-react'
import { format } from 'date-fns'
import { deleteExam } from '@/app/actions/exams'
import { cn } from '@/lib/utils'

interface ExamCardProps {
  id: number
  title: string
  description?: string
  examDate: Date
  duration?: number
  location?: string
  status: string
  formDeadline?: Date
  admitCardLink?: string
  admitCardStatus?: string
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
  status,
  formDeadline,
  admitCardLink,
  admitCardStatus,
  onDelete,
}: ExamCardProps) {
  const isFormExpired = formDeadline && new Date(formDeadline) < new Date()

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this exam?')) {
      await deleteExam(id)
      onDelete?.()
    }
  }

  return (
    <Card className="p-4 border transition-colors">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold">{title}</h3>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <Badge
            className={statusColors[status as keyof typeof statusColors]}
          >
            {status}
          </Badge>
        </div>

        <div className="space-y-2 text-sm border-t pt-2 mt-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {format(new Date(examDate), 'MMM dd, yyyy h:mm a')}
          </div>
          {duration && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {duration} minutes
            </div>
          )}
          {location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {location}
            </div>
          )}
          
          {/* Government Exam trackers */}
          {formDeadline && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className={cn('h-4 w-4', isFormExpired ? 'text-destructive' : 'text-amber-500')} />
              <span className={cn(isFormExpired ? 'text-destructive font-semibold' : 'text-foreground/80')}>
                {isFormExpired ? 'Apply closed: ' : 'Apply by: '} 
                {format(new Date(formDeadline), 'MMM dd, yyyy')}
              </span>
            </div>
          )}

          {admitCardStatus && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileDown className="h-4 w-4" />
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
                <Badge className={cn('text-[10px] px-1.5 py-0', admitStatusColors[admitCardStatus as keyof typeof admitStatusColors])}>
                  {admitCardStatus}
                </Badge>
              )}
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Exam
        </Button>
      </div>
    </Card>
  )
}

