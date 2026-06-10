import { PlannerApp } from '@/components/planner-app';
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardSidebar } from '@/components/dashboard-sidebar';

export const metadata = {
  title: 'Schedule Planner - StudyFlow',
  description: 'Plan your daily study schedule with customizable timetable and alternating day templates',
};

export default function SchedulePage() {
  return (
    <div className="flex h-screen flex-col md:flex-row">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
          <div className="mx-auto max-w-6xl">
            <PlannerApp />
          </div>
        </main>
      </div>
    </div>
  );
}

