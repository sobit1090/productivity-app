'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, Edit2, CheckCircle2, Circle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { deleteTask, updateTask } from '@/app/actions/tasks'

interface TaskCardProps {
  id: number
  title: string
  description?: string
  priority: string
  status: string
  dueDate?: Date
  onDelete?: () => void
}

const priorityColors = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
}

export function TaskCard({
  id,
  title,
  description,
  priority,
  status,
  dueDate,
  onDelete,
}: TaskCardProps) {
  const handleToggleStatus = async () => {
    const newStatus = status === 'completed' ? 'pending' : 'completed'
    await updateTask(id, { status: newStatus })
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask(id)
      onDelete?.()
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-1 items-start gap-3">
          <button
            onClick={handleToggleStatus}
            className="mt-1 flex-shrink-0 text-muted-foreground hover:text-foreground"
          >
            {status === 'completed' ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </button>
          <div className="flex-1">
            <h3
              className={cn(
                'font-semibold',
                status === 'completed' && 'line-through text-muted-foreground'
              )}
            >
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
            <div className="mt-3 flex items-center gap-2">
              <Badge
                className={priorityColors[priority as keyof typeof priorityColors]}
              >
                {priority}
              </Badge>
              {dueDate && (
                <span className="text-xs text-muted-foreground">
                  Due {formatDistanceToNow(new Date(dueDate), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
