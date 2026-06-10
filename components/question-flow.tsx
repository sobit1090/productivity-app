'use client';
import { useState } from 'react';
import { QuestionAnswers } from '@/types/planner';

const QUESTIONS = [
  {
    id: 'scheduleType',
    text: 'What kind of schedule do you need?',
    sub: 'This shapes the overall structure of your plan.',
    type: 'single',
    options: [
      { icon: 'ti-book', label: 'Daily study plan' },
      { icon: 'ti-briefcase', label: 'Work and productivity plan' },
      { icon: 'ti-heart', label: 'Fitness and wellness plan' },
      { icon: 'ti-layout-grid', label: 'Mixed personal plan' },
    ],
  },
  {
    id: 'mainGoal',
    text: 'What is your main goal this month?',
    sub: 'Be specific — this gets woven into your schedule descriptions.',
    type: 'text',
    placeholder: 'e.g. Clear GATE 2026, finish my portfolio, lose 5kg',
  },
  {
    id: 'startTime',
    text: 'What time do you want to start your day?',
    sub: 'Your first block begins at this time.',
    type: 'single',
    options: [
      { icon: 'ti-sun', label: '6am' },
      { icon: 'ti-sun', label: '7am' },
      { icon: 'ti-clock', label: '8am' },
      { icon: 'ti-clock', label: '9am' },
      { icon: 'ti-coffee', label: '10am' },
      { icon: 'ti-coffee', label: '11am' },
    ],
  },
  {
    id: 'endTime',
    text: 'What time do you want to end your day?',
    sub: 'Your last block ends at this time.',
    type: 'single',
    options: [
      { icon: 'ti-clock', label: '5pm' },
      { icon: 'ti-clock', label: '6pm' },
      { icon: 'ti-moon', label: '7pm' },
      { icon: 'ti-moon', label: '8pm' },
      { icon: 'ti-moon', label: '9pm' },
      { icon: 'ti-moon', label: '10pm' },
    ],
  },
  {
    id: 'daysPerWeek',
    text: 'How many days per week will you follow this schedule?',
    sub: '',
    type: 'single',
    options: [
      { icon: 'ti-calendar', label: '5 days' },
      { icon: 'ti-calendar', label: '6 days' },
      { icon: 'ti-calendar', label: '7 days' },
    ],
  },
  {
    id: 'alternatingDays',
    text: 'Do you want alternating day types — Day A and Day B?',
    sub: 'Day A is heavy focus. Day B is lighter — creative, recovery, admin.',
    type: 'single',
    options: [
      { icon: 'ti-arrows-exchange', label: 'Yes — give me two different day structures' },
      { icon: 'ti-minus', label: 'No — same structure every day' },
    ],
  },
  {
    id: 'heavyDay',
    text: 'Which day of the week is your heaviest workload day?',
    sub: 'That day gets an extra deep work block automatically.',
    type: 'single',
    options: [
      { icon: 'ti-calendar-event', label: 'Monday' },
      { icon: 'ti-calendar-event', label: 'Wednesday' },
      { icon: 'ti-calendar-event', label: 'Friday' },
      { icon: 'ti-calendar-event', label: 'Saturday' },
      { icon: 'ti-x', label: 'No specific heavy day' },
    ],
  },
  {
    id: 'activities',
    text: 'Which activities do you want included in your schedule?',
    sub: 'Select all that apply.',
    type: 'multi',
    options: [
      { icon: 'ti-brain', label: 'Deep work or study' },
      { icon: 'ti-run', label: 'Exercise or fitness' },
      { icon: 'ti-palette', label: 'Creative work' },
      { icon: 'ti-checklist', label: 'Admin and planning' },
      { icon: 'ti-coffee', label: 'Breaks and recovery' },
      { icon: 'ti-soup', label: 'Meal prep' },
      { icon: 'ti-school', label: 'Learning a new skill' },
      { icon: 'ti-code', label: 'Side project' },
    ],
  },
  {
    id: 'biggestStruggle',
    text: 'What is your biggest struggle with schedules?',
    sub: 'Your plan gets specific strategies built in to counter this.',
    type: 'single',
    options: [
      { icon: 'ti-clock-pause', label: 'I keep procrastinating' },
      { icon: 'ti-battery-low', label: 'I run out of energy mid-day' },
      { icon: 'ti-alert-circle', label: 'I forget what I planned' },
      { icon: 'ti-flame-off', label: 'I overplan and burn out' },
      { icon: 'ti-device-mobile', label: 'I get distracted easily' },
    ],
  },
  {
    id: 'planName',
    text: 'What should I call your plan?',
    sub: 'This appears as the title of your schedule.',
    type: 'text',
    placeholder: 'e.g. My GATE 2026 Study Plan',
  },
];

interface QuestionFlowProps {
  initialAnswers: QuestionAnswers | null;
  onComplete: (answers: QuestionAnswers) => void;
  onBack: () => void;
}

export function QuestionFlow({ initialAnswers, onComplete, onBack }: QuestionFlowProps) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuestionAnswers>>(() => {
    return initialAnswers || {
      scheduleType: '',
      mainGoal: '',
      startTime: '',
      endTime: '',
      daysPerWeek: '',
      alternatingDays: '',
      heavyDay: '',
      activities: [],
      biggestStruggle: '',
      planName: '',
    };
  });

  const question = QUESTIONS[index];

  function handleOptionSelect(label: string) {
    if (question.type === 'single') {
      setAnswers(prev => ({ ...prev, [question.id]: label }));
    } else if (question.type === 'multi') {
      const current = (answers.activities || []) as string[];
      const next = current.includes(label)
        ? current.filter(x => x !== label)
        : [...current, label];
      setAnswers(prev => ({ ...prev, activities: next }));
    }
  }

  function handleTextChange(value: string) {
    setAnswers(prev => ({ ...prev, [question.id]: value }));
  }

  const value = answers[question.id as keyof QuestionAnswers];
  const isMulti = question.type === 'multi';
  const isText = question.type === 'text';

  const isAnswered = isText
    ? typeof value === 'string' && value.trim().length > 0
    : isMulti
    ? Array.isArray(answers.activities) && answers.activities.length > 0
    : typeof value === 'string' && value.length > 0;

  function handleNext() {
    if (!isAnswered) return;
    if (index === QUESTIONS.length - 1) {
      onComplete(answers as QuestionAnswers);
    } else {
      setIndex(prev => prev + 1);
    }
  }

  function handlePrevious() {
    if (index === 0) {
      onBack();
    } else {
      setIndex(prev => prev - 1);
    }
  }

  const progress = Math.round((index / QUESTIONS.length) * 100);

  return (
    <div style={{ maxWidth: 520, margin: '2rem auto', padding: '0 1rem' }}>
      <div
        style={{
          background: 'var(--color-background-primary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 'var(--border-radius-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Progress Bar */}
        <div style={{ height: 4, background: 'var(--color-background-secondary)' }}>
          <div
            style={{
              height: '100%',
              background: '#7F77DD',
              width: `${progress}%`,
              transition: 'width 0.2s ease',
            }}
          />
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Question Meta */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Question {index + 1} of {QUESTIONS.length}
            </span>
            <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
              {progress}% complete
            </span>
          </div>

          {/* Question Text */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h2 style={{ fontSize: 17, fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
              {question.text}
            </h2>
            {question.sub && (
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                {question.sub}
              </p>
            )}
          </div>

          {/* Inputs Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {isText ? (
              <input
                type="text"
                placeholder={question.placeholder}
                value={(value as string) || ''}
                onChange={e => handleTextChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleNext(); }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--border-radius-md)',
                  border: '0.5px solid var(--color-border-secondary)',
                  background: 'var(--color-background-primary)',
                  color: 'var(--color-text-primary)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {question.options?.map(opt => {
                  const selected = isMulti
                    ? ((answers.activities || []) as string[]).includes(opt.label)
                    : value === opt.label;

                  return (
                    <button
                      key={opt.label}
                      onClick={() => handleOptionSelect(opt.label)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--border-radius-md)',
                        border: selected
                          ? '0.5px solid #7F77DD'
                          : '0.5px solid var(--color-border-tertiary)',
                        background: selected
                          ? '#EEEDFE'
                          : 'var(--color-background-secondary)',
                        color: selected ? '#3C3489' : 'var(--color-text-primary)',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <i className={`ti ${opt.icon}`} style={{ fontSize: 16 }} />
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: '0.5rem' }}>
            <button
              onClick={handlePrevious}
              style={{
                padding: '9px 16px',
                borderRadius: 'var(--border-radius-md)',
                border: '0.5px solid var(--color-border-tertiary)',
                background: 'var(--color-background-primary)',
                color: 'var(--color-text-primary)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!isAnswered}
              style={{
                padding: '9px 20px',
                borderRadius: 'var(--border-radius-md)',
                border: 'none',
                background: isAnswered ? '#7F77DD' : 'var(--color-background-secondary)',
                color: isAnswered ? '#fff' : 'var(--color-text-secondary)',
                fontSize: 13,
                fontWeight: 500,
                cursor: isAnswered ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease',
              }}
            >
              {index === QUESTIONS.length - 1 ? 'Finish' : 'Next'}
              <i className="ti ti-chevron-right" style={{ fontSize: 14 }} />
            </button>
          </div>
        </div>
      </div>

      {/* Answer Chips */}
      {index > 0 && (
        <div
          style={{
            marginTop: '1rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            justifyContent: 'center',
          }}
        >
          {QUESTIONS.slice(0, index).map((q, idx) => {
            const ans = answers[q.id as keyof QuestionAnswers];
            const displayVal = Array.isArray(ans) ? ans.join(', ') : ans;
            if (!displayVal) return null;

            return (
              <div
                key={q.id}
                onClick={() => setIndex(idx)}
                style={{
                  fontSize: 11,
                  background: '#EEEDFE',
                  color: '#3C3489',
                  border: '0.5px solid rgba(127, 119, 221, 0.3)',
                  borderRadius: 16,
                  padding: '4px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                title={`Click to jump back to question ${idx + 1}`}
              >
                <span style={{ opacity: 0.6 }}>{q.text.split(' ')[0]}...:</span>
                <span style={{ fontWeight: 500 }}>
                  {displayVal.length > 20 ? `${displayVal.substring(0, 20)}...` : displayVal}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
