'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, Calendar, Clock, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { deleteExam } from '@/app/actions/exams'

interface ExamCardProps {
  id: number
  title: string
  description?: string
  examDate: Date
  duration?: number
  location?: string
  status: string
  onDelete?: () => void
}

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export function ExamCard({
  id,
  title,
  description,
  examDate,
  duration,
  location,
  status,
  onDelete,
}: ExamCardProps) {
  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this exam?')) {
      await deleteExam(id)
      onDelete?.()
    }
  }

  return (
    <Card className="p-4">
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

        <div className="space-y-2 text-sm">
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
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="w-full text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </Card>
  )
}
