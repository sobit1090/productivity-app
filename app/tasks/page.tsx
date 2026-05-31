import { DashboardHeader } from '@/components/dashboard-header'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { getTasks, createTask } from '@/app/actions/tasks'
import { getSubjects } from '@/app/actions/subjects'
import { TaskCard } from '@/components/task-card'
import { CreateTaskForm } from '@/components/create-task-form'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function TasksPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    redirect('/sign-in')
  }

  const [tasks, userSubjects] = await Promise.all([getTasks(), getSubjects()])

  const pendingTasks = tasks.filter(t => t.status !== 'completed')
  const completedTasks = tasks.filter(t => t.status === 'completed')

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="overflow-y-auto bg-background p-4 md:p-8">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Tasks</h1>
              <CreateTaskForm subjects={userSubjects} />
            </div>

            {/* Pending Tasks */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Pending Tasks</h2>
              <div className="space-y-3">
                {pendingTasks.length > 0 ? (
                  pendingTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      id={task.id}
                      title={task.title}
                      description={task.description || undefined}
                      priority={task.priority || 'medium'}
                      status={task.status || 'pending'}
                      dueDate={task.dueDate ? new Date(task.dueDate) : undefined}
                    />
                  ))
                ) : (
                  <p className="text-muted-foreground">No pending tasks</p>
                )}
              </div>
            </div>

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Completed Tasks</h2>
                <div className="space-y-3">
                  {completedTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      id={task.id}
                      title={task.title}
                      description={task.description || undefined}
                      priority={task.priority || 'medium'}
                      status={task.status || 'pending'}
                      dueDate={task.dueDate ? new Date(task.dueDate) : undefined}
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
