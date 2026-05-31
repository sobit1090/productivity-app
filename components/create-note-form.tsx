'use client'

import { useState } from 'react'
import { createNote } from '@/app/actions/notes'
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

interface CreateNoteFormProps {
  subjects: {
    id: number
    name: string
    color: string | null
  }[]
}

export function CreateNoteForm({ subjects }: CreateNoteFormProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)

    try {
      const subjectIdStr = formData.get('subjectId') as string
      await createNote({
        title: formData.get('title') as string,
        content: formData.get('content') as string,
        imageUrl: formData.get('imageUrl') as string || undefined,
        subjectId: subjectIdStr ? parseInt(subjectIdStr) : undefined,
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
          New Note
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Note</DialogTitle>
          <DialogDescription>
            Add a study note or topic outline
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="text-sm font-medium">
              Note Title
            </label>
            <Input
              id="title"
              name="title"
              placeholder="Enter note title"
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
          <div>
            <label htmlFor="content" className="text-sm font-medium">
              Content
            </label>
            <Textarea
              id="content"
              name="content"
              placeholder="Enter note content/markdown..."
              rows={4}
            />
          </div>
          <div>
            <label htmlFor="imageUrl" className="text-sm font-medium">
              Image URL (optional)
            </label>
            <Input
              id="imageUrl"
              name="imageUrl"
              placeholder="https://..."
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Creating...' : 'Create Note'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
