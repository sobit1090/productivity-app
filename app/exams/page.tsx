import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { getExams } from '@/app/actions/exams'
import { getSubjects } from '@/app/actions/subjects'
import { ExamCard } from '@/components/exam-card'
import { CreateExamForm } from '@/components/create-exam-form'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function ExamsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/sign-in')
  }

  const [exams, userSubjects] = await Promise.all([getExams(), getSubjects()])

  const upcomingExams = exams
    .filter(e => e.status !== 'completed')
    .sort(
      (a, b) =>
        new Date(a.examDate).getTime() - new Date(b.examDate).getTime()
    )

  const completedExams = exams.filter(e => e.status === 'completed')

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="overflow-y-auto bg-background p-4 md:p-8">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Exams</h1>
              <CreateExamForm subjects={userSubjects} />
            </div>

            {/* Upcoming Exams */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Upcoming Exams</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {upcomingExams.length > 0 ? (
                  upcomingExams.map(exam => (
                    <ExamCard
                      key={exam.id}
                      id={exam.id}
                      title={exam.title}
                      description={exam.description || undefined}
                      examDate={new Date(exam.examDate)}
                      duration={exam.duration || undefined}
                      location={exam.location || undefined}
                      status={exam.status || 'scheduled'}
                      formDeadline={exam.formDeadline ? new Date(exam.formDeadline) : undefined}
                      admitCardLink={exam.admitCardLink || undefined}
                      admitCardStatus={exam.admitCardStatus || undefined}
                    />
                  ))
                ) : (
                  <p className="text-muted-foreground">No upcoming exams</p>
                )}
              </div>
            </div>

            {/* Completed Exams */}
            {completedExams.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Completed Exams</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {completedExams.map(exam => (
                    <ExamCard
                      key={exam.id}
                      id={exam.id}
                      title={exam.title}
                      description={exam.description || undefined}
                      examDate={new Date(exam.examDate)}
                      duration={exam.duration || undefined}
                      location={exam.location || undefined}
                      status={exam.status || 'scheduled'}
                      formDeadline={exam.formDeadline ? new Date(exam.formDeadline) : undefined}
                      admitCardLink={exam.admitCardLink || undefined}
                      admitCardStatus={exam.admitCardStatus || undefined}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
