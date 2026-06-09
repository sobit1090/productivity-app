'use client'

import { useState } from 'react'
import { updateTask } from '@/app/actions/tasks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Pencil } from 'lucide-react'

interface EditTaskDialogProps {
  id: number
  title: string
  description?: string
  priority: string
  dueDate?: Date
  subjects?: { id: number; name: string; color: string | null }[]
  subjectId?: number
}

export function EditTaskDialog({
  id,
  title,
  description,
  priority,
  dueDate,
  subjects = [],
  subjectId,
}: EditTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)

    try {
      const subjectIdStr = formData.get('subjectId') as string
      await updateTask(id, {
        title: formData.get('title') as string,
        description: (formData.get('description') as string) || undefined,
        dueDate: formData.get('dueDate')
          ? new Date(formData.get('dueDate') as string)
          : undefined,
        priority: formData.get('priority') as string,
        subjectId: subjectIdStr ? parseInt(subjectIdStr) : undefined,
      })
      setOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  const dueDateValue = dueDate
    ? new Date(dueDate).toISOString().slice(0, 16)
    : ''

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
          title="Edit task"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>Update the task details below.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="edit-task-title" className="text-sm font-medium">
              Task Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="edit-task-title"
              name="title"
              defaultValue={title}
              placeholder="Enter task title"
              required
            />
          </div>

          {/* Description — textarea so the user can write longer notes */}
          <div className="space-y-1.5">
            <label htmlFor="edit-task-description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="edit-task-description"
              name="description"
              rows={3}
              defaultValue={description ?? ''}
              placeholder="Add details, sub-items, etc."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              Tip: remove collected items and keep only the remaining ones here.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Subject */}
            {subjects.length > 0 && (
              <div className="space-y-1.5">
                <label htmlFor="edit-task-subject" className="text-sm font-medium">
                  Subject
                </label>
                <select
                  id="edit-task-subject"
                  name="subjectId"
                  defaultValue={subjectId ?? ''}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">No Subject</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Priority */}
            <div className="space-y-1.5">
              <label htmlFor="edit-task-priority" className="text-sm font-medium">
                Priority
              </label>
              <select
                id="edit-task-priority"
                name="priority"
                defaultValue={priority}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <label htmlFor="edit-task-dueDate" className="text-sm font-medium">
              Due Date & Time
            </label>
            <Input
              id="edit-task-dueDate"
              name="dueDate"
              type="datetime-local"
              defaultValue={dueDateValue}
            />
          </div>

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
              {isLoading ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
