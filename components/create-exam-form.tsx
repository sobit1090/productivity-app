'use client'

import { useState } from 'react'
import { createExam } from '@/app/actions/exams'
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

interface CreateExamFormProps {
  subjects: {
    id: number
    name: string
    color: string | null
  }[]
}

export function CreateExamForm({ subjects }: CreateExamFormProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [setReminder, setSetReminder] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)

    try {
      const subjectIdStr = formData.get('subjectId') as string
      const exam = await createExam({
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        examDate: new Date(formData.get('examDate') as string),
        duration: formData.get('duration')
          ? parseInt(formData.get('duration') as string)
          : undefined,
        location: formData.get('location') as string,
        syllabus: formData.get('syllabus') as string,
        subjectId: subjectIdStr ? parseInt(subjectIdStr) : undefined,
        formDeadline: formData.get('formDeadline')
          ? new Date(formData.get('formDeadline') as string)
          : undefined,
        admitCardLink: formData.get('admitCardLink') as string,
        admitCardStatus: formData.get('admitCardStatus') as string || 'pending',
      })

      if (setReminder && formData.get('reminderDate')) {
        await createReminder({
          title: `Exam: ${exam.title}`,
          reminderDate: new Date(formData.get('reminderDate') as string),
          type: 'exam',
          examId: exam.id,
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
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                placeholder="e.g. Center A (optional)"
              />
            </div>
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

          <div className="border-t pt-4 space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground">Government Exam Trackers</h4>
            
            <div>
              <label htmlFor="formDeadline" className="text-sm font-medium">
                Application Form Deadline
              </label>
              <Input id="formDeadline" name="formDeadline" type="datetime-local" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="admitCardLink" className="text-sm font-medium">
                  Admit Card Download Link
                </label>
                <Input
                  id="admitCardLink"
                  name="admitCardLink"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label htmlFor="admitCardStatus" className="text-sm font-medium">
                  Admit Card Status
                </label>
                <select
                  id="admitCardStatus"
                  name="admitCardStatus"
                  defaultValue="pending"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="released">Released</option>
                  <option value="downloaded">Downloaded</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 py-1 border-t pt-4">
            <input
              type="checkbox"
              id="setReminder"
              checked={setReminder}
              onChange={(e) => setSetReminder(e.target.checked)}
              className="h-4 w-4 rounded border-input bg-background text-primary focus:ring-ring"
            />
            <label htmlFor="setReminder" className="text-sm font-medium">
              Set reminder for this exam
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
            {isLoading ? 'Creating...' : 'Create Exam'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

