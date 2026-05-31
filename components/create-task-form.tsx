'use client'

import { useState } from 'react'
import { createTask } from '@/app/actions/tasks'
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

export function CreateTaskForm() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)

    try {
      await createTask({
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        dueDate: formData.get('dueDate')
          ? new Date(formData.get('dueDate') as string)
          : undefined,
        priority: formData.get('priority') as string,
      })
      setOpen(false)
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
          <div>
            <label htmlFor="priority" className="text-sm font-medium">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="low">Low</option>
              <option value="medium" selected>
                Medium
              </option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label htmlFor="dueDate" className="text-sm font-medium">
              Due Date
            </label>
            <Input id="dueDate" name="dueDate" type="datetime-local" />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Creating...' : 'Create Task'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
