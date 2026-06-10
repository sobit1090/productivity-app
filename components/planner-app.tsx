'use client';
import { useState, useEffect } from 'react';
import { usePlanner } from '@/hooks/use-planner';
import { QuestionFlow } from './question-flow';
import { GeneratingScreen } from './generating-screen';
import { PlannerView } from './planner-view';
import { generateSchedulePlan } from '@/lib/defaults';
import { QuestionAnswers } from '@/types/planner';

type Screen = 'welcome' | 'questions' | 'generating' | 'planner';

export function PlannerApp() {
  const { plan, answers, showSaved, savePlan, saveAnswers, clearAll } = usePlanner();
  const [screen, setScreen] = useState<Screen>('welcome');

  useEffect(() => {
    if (plan) setScreen('planner');
  }, [plan]);

  function handleAnswersComplete(a: QuestionAnswers) {
    saveAnswers(a);
    setScreen('generating');
  }

  function handleGeneratingComplete(a: QuestionAnswers) {
    const newPlan = generateSchedulePlan(a);
    savePlan(newPlan);
    setScreen('planner');
  }

  function handleRestart() {
    if (confirm('Start over? Your current plan will be cleared.')) {
      clearAll();
      setScreen('welcome');
    }
  }

  function handleRegenerate() {
    if (answers) {
      setScreen('generating');
    }
  }

  if (screen === 'welcome') return (
    <WelcomeScreen onStart={() => setScreen('questions')} />
  );

  if (screen === 'questions') return (
    <QuestionFlow
      initialAnswers={answers}
      onComplete={handleAnswersComplete}
      onBack={() => setScreen('welcome')}
    />
  );

  if (screen === 'generating') return (
    <GeneratingScreen
      answers={answers!}
      onComplete={handleGeneratingComplete}
    />
  );

  if (screen === 'planner' && plan) return (
    <PlannerView
      plan={plan}
      showSaved={showSaved}
      onPlanChange={savePlan}
      onRestart={handleRestart}
      onRegenerate={handleRegenerate}
    />
  );

  return null;
}

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ maxWidth: 520, margin: '6rem auto', padding: '0 1rem' }}>
      <div style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="ti ti-calendar-time" style={{ fontSize: 24, color: '#7F77DD' }} />
          <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)' }}>Schedule Planner</span>
        </div>
        
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          Answer 10 quick questions and get a fully personalized, editable daily schedule — no account, no API, instant.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '0.5rem 0' }}>
          {[
            { icon: 'ti-message-dots', text: '10 questions about your goals and routine' },
            { icon: 'ti-layout', text: 'Your custom schedule is built instantly' },
            { icon: 'ti-edit', text: 'Edit every block, time, color, and task inline' },
          ].map(s => (
            <div key={s.icon} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              <i className={`ti ${s.icon}`} style={{ fontSize: 16, color: '#7F77DD' }} />
              {s.text}
            </div>
          ))}
        </div>

        <button
          onClick={onStart}
          style={{
            padding: '10px 20px',
            background: '#7F77DD',
            border: 'none',
            borderRadius: 'var(--border-radius-md)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            alignSelf: 'flex-start',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
          className="hover:bg-[#6860c4] transition-colors"
        >
          <span>Build my schedule</span>
          <i className="ti ti-arrow-right" style={{ fontSize: 14 }} />
        </button>
      </div>
    </div>
  );
}
