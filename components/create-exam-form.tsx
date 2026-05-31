'use client'

import { useState } from 'react'
import { createExam } from '@/app/actions/exams'
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

export function CreateExamForm() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)

    try {
      await createExam({
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        examDate: new Date(formData.get('examDate') as string),
        duration: formData.get('duration')
          ? parseInt(formData.get('duration') as string)
          : undefined,
        location: formData.get('location') as string,
        syllabus: formData.get('syllabus') as string,
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
          New Exam
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Exam</DialogTitle>
          <DialogDescription>
            Add a new exam to your schedule
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="text-sm font-medium">
              Exam Title
            </label>
            <Input
              id="title"
              name="title"
              placeholder="Enter exam title"
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
              placeholder="Enter exam description (optional)"
            />
          </div>
          <div>
            <label htmlFor="examDate" className="text-sm font-medium">
              Exam Date & Time
            </label>
            <Input
              id="examDate"
              name="examDate"
              type="datetime-local"
              required
            />
          </div>
          <div>
            <label htmlFor="duration" className="text-sm font-medium">
              Duration (minutes)
            </label>
            <Input
              id="duration"
              name="duration"
              type="number"
              placeholder="e.g., 120"
            />
          </div>
          <div>
            <label htmlFor="location" className="text-sm font-medium">
              Location
            </label>
            <Input
              id="location"
              name="location"
              placeholder="Enter exam location (optional)"
            />
          </div>
          <div>
            <label htmlFor="syllabus" className="text-sm font-medium">
              Syllabus
            </label>
            <Input
              id="syllabus"
              name="syllabus"
              placeholder="Enter syllabus details (optional)"
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Creating...' : 'Create Exam'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
