import { PlannerApp } from '@/components/planner-app';

export const metadata = {
  title: 'Schedule Planner - StudyFlow',
  description: 'Plan your daily study schedule with customizable timetable and alternating day templates',
};

export default function SchedulePage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-background-secondary)', paddingBottom: '3rem' }}>
      <PlannerApp />
    </main>
  );
}

