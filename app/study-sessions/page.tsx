import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Trash2 } from 'lucide-react'
import { getStudySessions, deleteStudySession } from '@/app/actions/study-sessions'
import { getSubjects } from '@/app/actions/subjects'
import { CreateSessionForm } from '@/components/create-session-form'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

export default async function StudySessionsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/sign-in')
  }

  const [sessions, userSubjects] = await Promise.all([getStudySessions(), getSubjects()])

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="overflow-y-auto bg-background p-4 md:p-8">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Study Sessions</h1>
              <CreateSessionForm subjects={userSubjects} />
            </div>

            {sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.map(sess => (
                  <Card key={sess.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold">{sess.title}</h3>
                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                          <p>
                            {format(
                              new Date(sess.startTime),
                              'MMM dd, yyyy h:mm a'
                            )}
                          </p>
                          {sess.duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {Math.round(sess.duration / 60)} hours{' '}
                              {sess.duration % 60} minutes
                            </div>
                          )}
                        </div>
                        {sess.notes && (
                          <p className="mt-2 text-sm">{sess.notes}</p>
                        )}
                      </div>
                      <form action={deleteStudySession.bind(null, sess.id)}>
                        <Button type="submit" variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6">
                <p className="text-muted-foreground">
                  No study sessions yet. Start tracking your study sessions to
                  monitor your productivity.
                </p>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

