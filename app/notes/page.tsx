'use server'

import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { getNotes, deleteNote } from '@/app/actions/notes'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

export default async function NotesPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/sign-in')
  }

  const userNotes = await getNotes()

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="overflow-y-auto bg-background p-4 md:p-8">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Notes</h1>
              <Button>
                <Plus className="h-4 w-4" />
                New Note
              </Button>
            </div>

            {userNotes.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {userNotes.map(note => (
                  <Card key={note.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold">{note.title}</h3>
                      </div>
                      {note.content && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {note.content}
                        </p>
                      )}
                      {note.imageUrl && (
                        <img
                          src={note.imageUrl}
                          alt={note.title}
                          className="h-32 w-full rounded object-cover"
                        />
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(note.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6">
                <p className="text-muted-foreground">
                  No notes yet. Start creating notes to organize your study
                  materials by subject.
                </p>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
