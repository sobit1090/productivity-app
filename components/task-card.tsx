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
import { Trash2, CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { deleteTask, updateTask } from '@/app/actions/tasks'
import { cn } from '@/lib/utils'
import { EditTaskDialog } from '@/components/edit-task-dialog'

interface TaskCardProps {
  id: number
  title: string
  description?: string
  priority: string
  status: string
  dueDate?: Date
  subjectId?: number
  subjects?: { id: number; name: string; color: string | null }[]
  onDelete?: () => void
}

const priorityColors = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
}

export function TaskCard({
  id,
  title,
  description,
  priority,
  status,
  dueDate,
  subjectId,
  subjects = [],
  onDelete,
}: TaskCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const isOverdue = status !== 'completed' && dueDate && new Date(dueDate) < new Date()

  const handleToggleStatus = async () => {
    const newStatus = status === 'completed' ? 'pending' : 'completed'
    await updateTask(id, { status: newStatus })
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteTask(id)
      onDelete?.()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className={cn('p-4 border transition-colors', isOverdue && 'border-destructive bg-destructive/5')}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-1 items-start gap-3 min-w-0">
          {/* Complete toggle */}
          <button
            onClick={handleToggleStatus}
            className="mt-1 flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            title={status === 'completed' ? 'Mark as pending' : 'Mark as completed'}
          >
            {status === 'completed' ? (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <h3
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                'font-semibold cursor-pointer select-none hover:text-primary transition-colors',
                status === 'completed' && 'line-through text-muted-foreground',
                isExpanded ? 'break-words whitespace-normal' : 'truncate'
              )}
              title="Click to expand/collapse"
            >
              {title}
            </h3>
            {description && (
              <p
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                  'mt-1 text-sm text-muted-foreground cursor-pointer select-none',
                  isExpanded ? 'whitespace-pre-wrap break-words' : 'line-clamp-2 break-words'
                )}
                title="Click to expand/collapse"
              >
                {description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge className={priorityColors[priority as keyof typeof priorityColors]}>
                {priority}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Overdue
                </Badge>
              )}
              {dueDate && (
                <span
                  className={cn(
                    'text-xs',
                    isOverdue ? 'text-destructive font-semibold' : 'text-muted-foreground'
                  )}
                >
                  Due {formatDistanceToNow(new Date(dueDate), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <EditTaskDialog
            id={id}
            title={title}
            description={description}
            priority={priority}
            dueDate={dueDate}
            subjects={subjects}
            subjectId={subjectId}
          />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            title="Delete task"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
