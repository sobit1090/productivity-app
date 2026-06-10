export type ColorName = 'purple' | 'teal' | 'amber' | 'coral' | 'gray';

export interface TimeBlock {
  id: string;
  startTime: string;       // "HH:MM" 24hr format
  endTime: string;         // "HH:MM" 24hr format
  name: string;
  description: string;
  colorName: ColorName;
}

export interface DayType {
  id: string;              // "day-a" | "day-b" | "day-c"
  name: string;            // "Day A" | "Day B"
  focusSubtitle: string;   // "Deep work + Study"
  accentColor: ColorName;
  blocks: TimeBlock[];
}

export interface WeeklyRhythmDay {
  day: string;             // "Monday" through "Sunday"
  dayTypeId: string;       // references DayType.id
  topic: string;           // "GATE: OS / Algorithms"
}

export interface WeeklyTask {
  id: string;
  title: string;
  category: string;
  done: boolean;
}

export interface SchedulePlan {
  id: string;
  title: string;
  subtitle: string;
  startTime: string;
  endTime: string;
  dayTypes: DayType[];
  weeklyRhythm: WeeklyRhythmDay[];
  weeklyTasks: WeeklyTask[];
  noteA: string;
  noteB: string;
}

export interface QuestionAnswers {
  scheduleType: string;
  mainGoal: string;
  startTime: string;
  endTime: string;
  daysPerWeek: string;
  alternatingDays: string;
  heavyDay: string;
  activities: string[];
  biggestStruggle: string;
  planName: string;
}
