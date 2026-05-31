'use client'

import { Card } from '@/components/ui/card'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

interface AnalyticsContentProps {
  analytics: any
  studyStats: any
}

export default function AnalyticsContent({
  analytics,
  studyStats,
}: AnalyticsContentProps) {
  // Prepare data for completion rate chart
  const completionData = [
    {
      name: 'Completed',
      value: analytics.completedTasks,
      percentage: Number(analytics.completionRate),
    },
    {
      name: 'Pending',
      value: analytics.totalTasks - analytics.completedTasks,
      percentage: 100 - Number(analytics.completionRate),
    },
  ]

  // Prepare data for productivity logs chart
  const logData = (analytics.recentLogs || []).map((log: any) => ({
    date: log.date,
    tasksCompleted: log.tasksCompleted || 0,
    studyHours: log.studyHours ? Number(log.studyHours) : 0,
  }))

  return (
    <>
      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Completion Rate Pie Chart */}
        <Card className="p-6">
          <h3 className="mb-4 font-semibold">Task Completion Rate</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={completionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.percentage.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {completionData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Study Sessions Chart */}
        <Card className="p-6">
          <h3 className="mb-4 font-semibold">Study Sessions</h3>
          <div className="space-y-2 text-sm">
            <p>Total Sessions: {studyStats.totalSessions}</p>
            <p>Total Study Hours: {studyStats.totalHours}</p>
            <p className="text-muted-foreground">
              Average per session:{' '}
              {studyStats.totalSessions > 0
                ? (
                    Number(studyStats.totalHours) /
                    studyStats.totalSessions
                  ).toFixed(1)
                : 0}{' '}
              hours
            </p>
          </div>
        </Card>
      </div>

      {/* Productivity Log */}
      {logData.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 font-semibold">Productivity Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={logData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="tasksCompleted" fill="#3b82f6" />
              <Bar dataKey="studyHours" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </>
  )
}
