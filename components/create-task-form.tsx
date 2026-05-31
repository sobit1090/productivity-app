'use client'

import { useState } from 'react'
import { createTask } from '@/app/actions/tasks'
import { createReminder } from '@/app/actions/reminders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface CreateTaskFormProps {
  subjects: {
    id: number
    name: string
    color: string | null
  }[]
}

export function CreateTaskForm({ subjects }: CreateTaskFormProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [setReminder, setSetReminder] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)

    try {
      const subjectIdStr = formData.get('subjectId') as string
      const task = await createTask({
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        dueDate: formData.get('dueDate')
          ? new Date(formData.get('dueDate') as string)
          : undefined,
        priority: formData.get('priority') as string,
        subjectId: subjectIdStr ? parseInt(subjectIdStr) : undefined,
      })

      if (setReminder && formData.get('reminderDate')) {
        await createReminder({
          title: `Task: ${task.title}`,
          reminderDate: new Date(formData.get('reminderDate') as string),
          type: 'task',
          taskId: task.id,
        })
      }

      setOpen(false)
      setSetReminder(false)
      ;(e.target as HTMLFormElement).reset()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to your task list
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="text-sm font-medium">
              Task Title
            </label>
            <Input
              id="title"
              name="title"
              placeholder="Enter task title"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Input
              id="description"
              name="description"
              placeholder="Enter task description (optional)"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="subjectId" className="text-sm font-medium">
                Subject
              </label>
              <select
                id="subjectId"
                name="subjectId"
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
            <div>
              <label htmlFor="priority" className="text-sm font-medium">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                defaultValue="medium"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="dueDate" className="text-sm font-medium">
              Due Date
            </label>
            <Input id="dueDate" name="dueDate" type="datetime-local" />
          </div>

          <div className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              id="setReminder"
              checked={setReminder}
              onChange={(e) => setSetReminder(e.target.checked)}
              className="h-4 w-4 rounded border-input bg-background text-primary focus:ring-ring"
            />
            <label htmlFor="setReminder" className="text-sm font-medium">
              Set reminder for this task
            </label>
          </div>

          {setReminder && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label htmlFor="reminderDate" className="text-sm font-medium text-destructive">
                Reminder Date & Time
              </label>
              <Input
                id="reminderDate"
                name="reminderDate"
                type="datetime-local"
                required
              />
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Creating...' : 'Create Task'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

