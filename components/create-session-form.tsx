'use client'

import { useState } from 'react'
import { createStudySession } from '@/app/actions/study-sessions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface CreateSessionFormProps {
  subjects: {
    id: number
    name: string
    color: string | null
  }[]
}

export function CreateSessionForm({ subjects }: CreateSessionFormProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)

    try {
      const subjectIdStr = formData.get('subjectId') as string
      await createStudySession({
        title: formData.get('title') as string,
        subjectId: subjectIdStr ? parseInt(subjectIdStr) : undefined,
        startTime: new Date(formData.get('startTime') as string),
        endTime: formData.get('endTime')
          ? new Date(formData.get('endTime') as string)
          : undefined,
        notes: formData.get('notes') as string || undefined,
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
          New Session
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Study Session</DialogTitle>
          <DialogDescription>
            Record your study duration and topics covered
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="text-sm font-medium">
              Session Title
            </label>
            <Input
              id="title"
              name="title"
              placeholder="e.g. Focus on Organic Chemistry"
              required
            />
          </div>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="text-sm font-medium">
                Start Time
              </label>
              <Input
                id="startTime"
                name="startTime"
                type="datetime-local"
                required
              />
            </div>
            <div>
              <label htmlFor="endTime" className="text-sm font-medium">
                End Time
              </label>
              <Input
                id="endTime"
                name="endTime"
                type="datetime-local"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="notes" className="text-sm font-medium">
              Notes
            </label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="What did you learn? Add subtopics or difficulties..."
              rows={3}
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Saving...' : 'Log Session'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
