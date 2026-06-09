'use client'

import { useState } from 'react'
import { updateExam } from '@/app/actions/exams'
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

interface EditExamDialogProps {
  id: number
  title: string
  description?: string
  examDate: Date
  duration?: number
  location?: string
  syllabus?: string
  status: string
  formDeadline?: Date
  admitCardLink?: string
  admitCardStatus?: string
  subjects?: { id: number; name: string; color: string | null }[]
  subjectId?: number
}

export function EditExamDialog({
  id,
  title,
  description,
  examDate,
  duration,
  location,
  syllabus,
  status,
  formDeadline,
  admitCardLink,
  admitCardStatus,
  subjects = [],
  subjectId,
}: EditExamDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const toDatetimeLocal = (d?: Date) =>
    d ? new Date(d).toISOString().slice(0, 16) : ''

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)

    try {
      const subjectIdStr = formData.get('subjectId') as string
      await updateExam(id, {
        title: formData.get('title') as string,
        description: (formData.get('description') as string) || undefined,
        examDate: new Date(formData.get('examDate') as string),
        duration: formData.get('duration')
          ? parseInt(formData.get('duration') as string)
          : undefined,
        location: (formData.get('location') as string) || undefined,
        syllabus: (formData.get('syllabus') as string) || undefined,
        status: formData.get('status') as string,
        subjectId: subjectIdStr ? parseInt(subjectIdStr) : undefined,
        formDeadline: formData.get('formDeadline')
          ? new Date(formData.get('formDeadline') as string)
          : undefined,
        admitCardLink: (formData.get('admitCardLink') as string) || undefined,
        admitCardStatus: (formData.get('admitCardStatus') as string) || undefined,
      })
      setOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
          title="Edit exam"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Exam</DialogTitle>
          <DialogDescription>Update exam details below.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="edit-exam-title" className="text-sm font-medium">
              Exam Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="edit-exam-title"
              name="title"
              defaultValue={title}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="edit-exam-desc" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="edit-exam-desc"
              name="description"
              rows={2}
              defaultValue={description ?? ''}
              placeholder="Short description (optional)"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Subject */}
            {subjects.length > 0 && (
              <div className="space-y-1.5">
                <label htmlFor="edit-exam-subject" className="text-sm font-medium">
                  Subject
                </label>
                <select
                  id="edit-exam-subject"
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

            {/* Status */}
            <div className="space-y-1.5">
              <label htmlFor="edit-exam-status" className="text-sm font-medium">
                Status
              </label>
              <select
                id="edit-exam-status"
                name="status"
                defaultValue={status}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Exam Date */}
          <div className="space-y-1.5">
            <label htmlFor="edit-exam-date" className="text-sm font-medium">
              Exam Date & Time <span className="text-destructive">*</span>
            </label>
            <Input
              id="edit-exam-date"
              name="examDate"
              type="datetime-local"
              defaultValue={toDatetimeLocal(examDate)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Duration */}
            <div className="space-y-1.5">
              <label htmlFor="edit-exam-duration" className="text-sm font-medium">
                Duration (minutes)
              </label>
              <Input
                id="edit-exam-duration"
                name="duration"
                type="number"
                defaultValue={duration ?? ''}
                placeholder="e.g. 120"
              />
            </div>
            {/* Location */}
            <div className="space-y-1.5">
              <label htmlFor="edit-exam-location" className="text-sm font-medium">
                Location
              </label>
              <Input
                id="edit-exam-location"
                name="location"
                defaultValue={location ?? ''}
                placeholder="e.g. Center A"
              />
            </div>
          </div>

          {/* Syllabus */}
          <div className="space-y-1.5">
            <label htmlFor="edit-exam-syllabus" className="text-sm font-medium">
              Syllabus
            </label>
            <Input
              id="edit-exam-syllabus"
              name="syllabus"
              defaultValue={syllabus ?? ''}
              placeholder="Syllabus details (optional)"
            />
          </div>

          {/* Gov Exam Trackers */}
          <div className="border-t pt-4 space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Government Exam Trackers
            </h4>

            <div className="space-y-1.5">
              <label htmlFor="edit-exam-formDeadline" className="text-sm font-medium">
                Application Form Deadline
              </label>
              <Input
                id="edit-exam-formDeadline"
                name="formDeadline"
                type="datetime-local"
                defaultValue={toDatetimeLocal(formDeadline)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="edit-exam-admitLink" className="text-sm font-medium">
                  Admit Card Link
                </label>
                <Input
                  id="edit-exam-admitLink"
                  name="admitCardLink"
                  defaultValue={admitCardLink ?? ''}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="edit-exam-admitStatus" className="text-sm font-medium">
                  Admit Card Status
                </label>
                <select
                  id="edit-exam-admitStatus"
                  name="admitCardStatus"
                  defaultValue={admitCardStatus ?? 'pending'}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="released">Released</option>
                  <option value="downloaded">Downloaded</option>
                </select>
              </div>
            </div>
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
