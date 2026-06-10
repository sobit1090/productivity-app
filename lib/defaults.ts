import { QuestionAnswers, SchedulePlan, DayType, TimeBlock, WeeklyTask, ColorName } from '@/types/planner';

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function parseStartTime(answer: string): string {
  const map: Record<string, string> = {
    '6am': '06:00', '7am': '07:00', '8am': '08:00',
    '9am': '09:00', '10am': '10:00', '11am': '11:00',
  };
  return map[answer] ?? answer ?? '09:00';
}

function parseEndTime(answer: string): string {
  const map: Record<string, string> = {
    '5pm': '17:00', '6pm': '18:00', '7pm': '19:00',
    '8pm': '20:00', '9pm': '21:00', '10pm': '22:00',
  };
  return map[answer] ?? answer ?? '19:00';
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

function activityColor(activity: string): ColorName {
  if (activity.toLowerCase().includes('study') || activity.toLowerCase().includes('deep')) return 'purple';
  if (activity.toLowerCase().includes('exercise') || activity.toLowerCase().includes('fitness')) return 'teal';
  if (activity.toLowerCase().includes('creative')) return 'coral';
  if (activity.toLowerCase().includes('admin') || activity.toLowerCase().includes('planning')) return 'amber';
  return 'gray';
}

function buildDayABlocks(answers: QuestionAnswers, start: string): TimeBlock[] {
  const blocks: TimeBlock[] = [];
  let cursor = start;

  // Warm-up
  blocks.push({ id: uid(), startTime: cursor, endTime: addMinutes(cursor, 15), name: 'Warm-up review', description: 'Skim yesterday\'s notes — 15 min, no new topics.', colorName: 'gray' });
  cursor = addMinutes(cursor, 15);

  // First heavy focus block — 2 hours
  const primaryActivity = answers.activities.find(a => a.toLowerCase().includes('study') || a.toLowerCase().includes('deep')) ?? 'Deep work';
  blocks.push({ id: uid(), startTime: cursor, endTime: addMinutes(cursor, 120), name: `${primaryActivity} — deep session`, description: `Work on your main goal: ${answers.mainGoal}. No distractions.`, colorName: 'purple' });
  cursor = addMinutes(cursor, 120);

  // Lunch or midday break
  blocks.push({ id: uid(), startTime: cursor, endTime: addMinutes(cursor, 45), name: 'Lunch break', description: 'Step away from screen. Full break.', colorName: 'gray' });
  cursor = addMinutes(cursor, 45);

  // Second focus block — 90 min
  blocks.push({ id: uid(), startTime: cursor, endTime: addMinutes(cursor, 90), name: `${primaryActivity} — practice`, description: 'Apply what you studied. Solve problems or complete exercises.', colorName: 'purple' });
  cursor = addMinutes(cursor, 90);

  // Short break
  blocks.push({ id: uid(), startTime: cursor, endTime: addMinutes(cursor, 15), name: 'Short break', description: 'Walk, water, rest your eyes.', colorName: 'gray' });
  cursor = addMinutes(cursor, 15);

  // Secondary activity — 90 min
  const secondActivity = answers.activities.find(a => !a.toLowerCase().includes('study') && !a.toLowerCase().includes('deep')) ?? 'Planning';
  blocks.push({ id: uid(), startTime: cursor, endTime: addMinutes(cursor, 90), name: secondActivity, description: `Dedicated time for ${secondActivity.toLowerCase()}.`, colorName: activityColor(secondActivity) });
  cursor = addMinutes(cursor, 90);

  // Short break
  blocks.push({ id: uid(), startTime: cursor, endTime: addMinutes(cursor, 15), name: 'Short break', description: '', colorName: 'gray' });
  cursor = addMinutes(cursor, 15);

  // End-of-day review
  blocks.push({ id: uid(), startTime: cursor, endTime: addMinutes(cursor, 45), name: 'End-of-day review', description: 'Write 5 key points from today. Plan tomorrow.', colorName: 'gray' });

  return blocks;
}

function buildDayBBlocks(answers: QuestionAnswers, start: string): TimeBlock[] {
  const blocks: TimeBlock[] = [];
  let cursor = start;

  // Light warm-up
  blocks.push({ id: uid(), startTime: cursor, endTime: addMinutes(cursor, 15), name: 'Warm-up', description: 'Light review of yesterday. No heavy lifting.', colorName: 'gray' });
  cursor = addMinutes(cursor, 15);

  // Creative or skill block — 2 hours
  const creative = answers.activities.find(a => a.toLowerCase().includes('creative') || a.toLowerCase().includes('skill') || a.toLowerCase().includes('project')) ?? 'Skill building';
  blocks.push({ id: uid(), startTime: cursor, endTime: addMinutes(cursor, 120), name: creative, description: `Explore and build. Less structure, more flow.`, colorName: activityColor(creative) });
  cursor = addMinutes(cursor, 120);

  // Lunch
  blocks.push({ id: uid(), startTime: cursor, endTime: addMinutes(cursor, 45), name: 'Lunch break', description: 'Full break away from screen.', colorName: 'gray' });
  cursor = addMinutes(cursor, 45);

  // Exercise or fitness — 60 min
  const fitness = answers.activities.find(a => a.toLowerCase().includes('exercise') || a.toLowerCase().includes('fitness')) ?? 'Exercise';
  blocks.push({ id: uid(), startTime: cursor, endTime: addMinutes(cursor, 60), name: fitness, description: 'Physical activity — walk, gym, yoga, or stretching.', colorName: 'teal' });
  cursor = addMinutes(cursor, 60);

  // Short break
  blocks.push({ id: uid(), startTime: cursor, endTime: addMinutes(cursor, 15), name: 'Short break', description: '', colorName: 'gray' });
  cursor = addMinutes(cursor, 15);

  // Admin and planning — 60 min
  blocks.push({ id: uid(), startTime: cursor, endTime: addMinutes(cursor, 60), name: 'Admin and planning', description: 'Emails, job applications (30 min max), weekly review.', colorName: 'amber' });
  cursor = addMinutes(cursor, 60);

  // Light review to close
  blocks.push({ id: uid(), startTime: cursor, endTime: addMinutes(cursor, 45), name: 'Light study review', description: 'Keep main subject warm. Read one short topic only.', colorName: 'purple' });
  cursor = addMinutes(cursor, 45);

  // Log
  blocks.push({ id: uid(), startTime: cursor, endTime: addMinutes(cursor, 30), name: 'Daily log', description: 'What did I build or learn today? Write it down.', colorName: 'gray' });

  return blocks;
}

function buildWeeklyTasks(answers: QuestionAnswers): WeeklyTask[] {
  const tasks: WeeklyTask[] = [];

  if (answers.mainGoal) tasks.push({ id: uid(), title: `Start working on: ${answers.mainGoal}`, category: 'Goal', done: false });

  const activityTasks: Record<string, string> = {
    'deep work': 'Complete 3 deep work sessions this week',
    'study': 'Finish one full subject topic with PYQ practice',
    'exercise': 'Exercise at least 3 times this week',
    'creative': 'Finish one creative piece or project feature',
    'admin': 'Clear all pending emails and admin tasks',
    'planning': 'Plan next week\'s schedule by Sunday evening',
    'skill': 'Complete one skill-building module or tutorial',
    'project': 'Make measurable progress on your project',
    'meal': 'Prep meals for at least 3 days',
  };

  answers.activities.forEach(a => {
    const key = Object.keys(activityTasks).find(k => a.toLowerCase().includes(k));
    if (key) tasks.push({ id: uid(), title: activityTasks[key], category: a, done: false });
  });

  if (answers.biggestStruggle.toLowerCase().includes('procrastinat')) tasks.push({ id: uid(), title: 'Use the 2-minute rule — if it takes under 2 min, do it now', category: 'Habit', done: false });
  if (answers.biggestStruggle.toLowerCase().includes('distract')) tasks.push({ id: uid(), title: 'Phone in another room during every focus block this week', category: 'Habit', done: false });
  if (answers.biggestStruggle.toLowerCase().includes('energy')) tasks.push({ id: uid(), title: 'Sleep before midnight every night this week', category: 'Wellness', done: false });
  if (answers.biggestStruggle.toLowerCase().includes('overplan')) tasks.push({ id: uid(), title: 'Pick only 3 priorities per day — nothing else counts', category: 'Mindset', done: false });

  tasks.push({ id: uid(), title: 'Review and edit this planner at the end of the week', category: 'Planning', done: false });

  return tasks.slice(0, 8);
}

function buildWeeklyRhythm(answers: QuestionAnswers, dayTypes: DayType[]): import('@/types/planner').WeeklyRhythmDay[] {
  const hasAlternating = answers.alternatingDays.toLowerCase().includes('yes');
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayAId = dayTypes[0]?.id ?? 'day-a';
  const dayBId = dayTypes[1]?.id ?? dayAId;

  const topicsA = ['Main focus — deep work block', 'Core subject study + practice', 'Heavy cognitive session', 'Skill development + PYQs', 'Deep work + mock test'];
  const topicsB = ['Creative work + project', 'Exercise + light review', 'Admin + skill building', 'Project progress + planning', 'Recovery + weekly review'];

  return daysOfWeek.map((day, i) => {
    const isHeavy = day === answers.heavyDay;
    const isAlternateB = hasAlternating && i % 2 === 1;
    const isSunday = day === 'Sunday';
    const isSaturday = day === 'Saturday';

    if (isSunday) return { day, dayTypeId: dayBId, topic: 'Rest + plan next week + 30 min job applications' };
    if (isSaturday) return { day, dayTypeId: hasAlternating ? dayBId : dayAId, topic: 'Full mock test + weak area review' };
    if (isHeavy) return { day, dayTypeId: dayAId, topic: `Heavy day — extra focus block + ${answers.mainGoal.slice(0, 30)}` };
    if (isAlternateB) return { day, dayTypeId: dayBId, topic: topicsB[Math.floor(i / 2) % topicsB.length] };
    return { day, dayTypeId: dayAId, topic: topicsA[Math.floor(i / 2) % topicsA.length] };
  });
}

export function generateSchedulePlan(answers: QuestionAnswers): SchedulePlan {
  const start = parseStartTime(answers.startTime);
  const end = parseEndTime(answers.endTime);
  const hasAlternating = answers.alternatingDays.toLowerCase().includes('yes');

  const dayA: DayType = {
    id: 'day-a',
    name: 'Day A',
    focusSubtitle: 'Deep work + Heavy focus',
    accentColor: 'purple',
    blocks: buildDayABlocks(answers, start),
  };

  const dayB: DayType = hasAlternating ? {
    id: 'day-b',
    name: 'Day B',
    focusSubtitle: 'Creative + Recovery',
    accentColor: 'teal',
    blocks: buildDayBBlocks(answers, start),
  } : { ...dayA, id: 'day-b' };

  const dayTypes = hasAlternating ? [dayA, dayB] : [dayA];
  const weeklyRhythm = buildWeeklyRhythm(answers, dayTypes);
  const weeklyTasks = buildWeeklyTasks(answers);

  const struggle = answers.biggestStruggle.toLowerCase();
  const noteA = struggle.includes('energy')
    ? 'Schedule your hardest task in the first 2 hours — energy is highest then.'
    : struggle.includes('distract')
    ? 'Phone in another room during every purple block. Non-negotiable.'
    : 'One focused hour beats ten scattered hours. Show up to every block.';

  const noteB = hasAlternating
    ? 'Day B is not a rest day — it is a different kind of productive. Build and recover.'
    : 'Consistency over intensity. Same structure every day builds unstoppable momentum.';

  return {
    id: uid(),
    title: answers.planName || 'My Weekly Plan',
    subtitle: `${answers.startTime} – ${answers.endTime} · ${hasAlternating ? 'Alternate Day Structure' : 'Consistent Daily Structure'}`,
    startTime: start,
    endTime: end,
    dayTypes,
    weeklyRhythm,
    weeklyTasks,
    noteA,
    noteB,
  };
}

// ---------------------------------------------------------------------------
// Pre-seeded plan from sobit.pdf
// B.Tech CSE Graduate · GATE + Software Jobs + Govt Jobs
// 10:00 AM – 7:00 PM · Alternate Day Structure
// ---------------------------------------------------------------------------
export function getSobitPlan(): SchedulePlan {
  const dayA: DayType = {
    id: 'day-a',
    name: 'Day A',
    focusSubtitle: 'GATE Core + Aptitude',
    accentColor: 'purple',
    blocks: [
      { id: uid(), startTime: '10:00', endTime: '10:15', name: 'Warm-up Review',       description: "Revise yesterday's notes only — 15 min, no new topics.",                                        colorName: 'gray'   },
      { id: uid(), startTime: '10:15', endTime: '12:15', name: 'GATE Core — Deep Study', description: 'Rotate weekly: OS → DBMS → Algorithms → TOC → CN. Read concept + solve PYQs.',               colorName: 'purple' },
      { id: uid(), startTime: '12:15', endTime: '13:00', name: 'Lunch Break',            description: 'Step away from screen completely. No studying.',                                                colorName: 'gray'   },
      { id: uid(), startTime: '13:00', endTime: '14:30', name: 'GATE — Practice & PYQs', description: 'Solve 20–25 previous year questions on today\'s topic. Mark all doubts.',                      colorName: 'purple' },
      { id: uid(), startTime: '14:30', endTime: '14:45', name: 'Short Break',            description: 'Walk, water, rest your eyes.',                                                                  colorName: 'gray'   },
      { id: uid(), startTime: '14:45', endTime: '16:15', name: 'Aptitude — Topic-wise',  description: 'Quant: Number system, %, ratio, time-work. Logical: syllogisms, seating. 1 topic per day.',  colorName: 'amber'  },
      { id: uid(), startTime: '16:15', endTime: '16:30', name: 'Break',                  description: '',                                                                                               colorName: 'gray'   },
      { id: uid(), startTime: '16:30', endTime: '18:15', name: 'DSA — 1 Problem Set',    description: 'Arrays / Strings / Linked Lists (Easy–Medium). Solve 2+ problems. Understand, don\'t just copy.', colorName: 'coral' },
      { id: uid(), startTime: '18:15', endTime: '19:00', name: 'End-of-Day Notes',       description: 'Write 5 key points from today. Mark what to revisit. Log in notebook or Notion.',             colorName: 'gray'   },
    ],
  };

  const dayB: DayType = {
    id: 'day-b',
    name: 'Day B',
    focusSubtitle: 'DSA Deep Dive + Project',
    accentColor: 'teal',
    blocks: [
      { id: uid(), startTime: '10:00', endTime: '10:15', name: 'Warm-up Review',          description: "Skim yesterday's GATE notes — 15 min only.",                                                                  colorName: 'gray'   },
      { id: uid(), startTime: '10:15', endTime: '12:30', name: 'DSA — Structured Practice', description: 'Roadmap: Arrays → Recursion → Sorting → Trees → Graphs. Solve 3–5 LeetCode Easy/Medium.',              colorName: 'teal'   },
      { id: uid(), startTime: '12:30', endTime: '13:15', name: 'Lunch Break',               description: 'Full break. Step away from screen.',                                                                       colorName: 'gray'   },
      { id: uid(), startTime: '13:15', endTime: '14:30', name: 'Aptitude — Timed Mock',     description: '20-question timed test (25 min). Analyse wrong answers for 30 min. Builds NQT + govt readiness.',       colorName: 'amber'  },
      { id: uid(), startTime: '14:30', endTime: '14:45', name: 'Break',                     description: '',                                                                                                          colorName: 'gray'   },
      { id: uid(), startTime: '14:45', endTime: '17:45', name: 'Project Work',              description: '3 hours uninterrupted. Build a real, deployable web project. Connects directly to job portfolio.',       colorName: 'coral'  },
      { id: uid(), startTime: '17:45', endTime: '18:15', name: 'GATE — 1 Short Topic',      description: 'Read one small GATE concept (e.g. one page of OS or CN). Keep GATE warm even on B days.',               colorName: 'purple' },
      { id: uid(), startTime: '18:15', endTime: '19:00', name: 'End-of-Day Log',            description: 'What did I build today? What DSA pattern did I learn? Log it.',                                          colorName: 'gray'   },
    ],
  };

  const weeklyRhythm: import('@/types/planner').WeeklyRhythmDay[] = [
    { day: 'Monday',    dayTypeId: 'day-a', topic: 'GATE: OS / Algorithms · Aptitude: Quantitative topic' },
    { day: 'Tuesday',   dayTypeId: 'day-b', topic: 'DSA: Arrays / Strings · Project: Start or continue feature' },
    { day: 'Wednesday', dayTypeId: 'day-a', topic: 'GATE: DBMS · Aptitude: Logical Reasoning' },
    { day: 'Thursday',  dayTypeId: 'day-b', topic: 'DSA: Recursion / Sorting · Project: Continue building' },
    { day: 'Friday',    dayTypeId: 'day-a', topic: 'GATE: TOC / CN · Aptitude: Full mock test' },
    { day: 'Saturday',  dayTypeId: 'day-b', topic: 'Morning: GATE mock (2 hr). Afternoon: DSA contest. Evening: weak area fix.' },
    { day: 'Sunday',    dayTypeId: 'day-b', topic: 'Revise week\'s notes (1.5 hr). Plan next week. 30 min job applications.' },
  ];

  const weeklyTasks: WeeklyTask[] = [
    { id: uid(), title: 'Complete GATE topic of the week with PYQs',              category: 'GATE',    done: false },
    { id: uid(), title: 'Solve 3–5 LeetCode Easy/Medium problems per DSA session', category: 'DSA',     done: false },
    { id: uid(), title: 'Make measurable progress on web project',                 category: 'Project', done: false },
    { id: uid(), title: 'Complete all aptitude topic-wise + 1 mock test',          category: 'Aptitude',done: false },
    { id: uid(), title: 'Apply to 3–5 companies (Sunday evening)',                 category: 'Jobs',    done: false },
    { id: uid(), title: 'Get a notebook and log what you study each day',          category: 'Habit',   done: false },
    { id: uid(), title: 'Pick OS as your first GATE subject',                      category: 'GATE',    done: false },
    { id: uid(), title: 'Do 2 LeetCode Easy problems tonight to build DSA habit',  category: 'DSA',     done: false },
  ];

  return {
    id: uid(),
    title: 'Daily Study Plan',
    subtitle: '10:00 AM – 7:00 PM · Alternate Day Structure',
    startTime: '10:00',
    endTime:   '19:00',
    dayTypes:      [dayA, dayB],
    weeklyRhythm,
    weeklyTasks,
    noteA: 'Every GATE topic (OS, DBMS, Algorithms) also helps in software jobs and govt exams — study is never wasted.',
    noteB: 'Your 3-hour project block on Day B means you are always ready for take-home dev assignments.',
  };
}
