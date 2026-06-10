'use client';
import { useEffect, useRef, useState } from 'react';
import { QuestionAnswers } from '@/types/planner';

const STEPS = [
  'Reading your answers',
  'Mapping your day structure',
  'Creating your time blocks',
  'Finalising your plan',
];

interface GeneratingScreenProps {
  answers: QuestionAnswers;
  onComplete: (answers: QuestionAnswers) => void;
}

export function GeneratingScreen({ answers, onComplete }: GeneratingScreenProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const called = useRef(false);

  useEffect(() => {
    // Increment step index every 800ms
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < STEPS.length) {
          return prev + 1;
        }
        return prev;
      });
    }, 800);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    
    // Total duration: 4 steps * 800ms = 3200ms
    const timer = setTimeout(() => {
      onComplete(answers);
    }, 3200);

    return () => clearTimeout(timer);
  }, [answers, onComplete]);

  return (
    <div style={{ maxWidth: 520, margin: '6rem auto', padding: '0 1rem' }}>
      <div style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '2.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
          <i className="ti ti-loader schedule-loading-spinner" style={{ fontSize: 32, color: '#7F77DD', animation: 'scheduleSpin 1s linear infinite' }} />
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)', marginTop: '0.5rem' }}>
            Generating your plan...
          </h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
            We're building a schedule tailored to your routine and goals.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: '320px', textAlign: 'left' }}>
          {STEPS.map((step, index) => {
            const isDone = currentStepIndex > index;
            const isActive = currentStepIndex === index;
            const isPending = currentStepIndex < index;

            return (
              <div 
                key={step} 
                className="block-enter"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  fontSize: 13, 
                  color: isPending ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
                  opacity: isPending ? 0.4 : 1,
                  animationDelay: `${index * 800}ms`,
                  transition: 'opacity 0.3s ease, color 0.3s ease'
                }}
              >
                <div style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isDone ? (
                    <i className="ti ti-circle-check" style={{ color: '#1D9E75', fontSize: 18 }} />
                  ) : isActive ? (
                    <i className="ti ti-loader" style={{ color: '#7F77DD', fontSize: 16, animation: 'scheduleSpin 1s linear infinite', display: 'inline-block' }} />
                  ) : (
                    <i className="ti ti-circle" style={{ color: 'var(--color-text-secondary)', fontSize: 16 }} />
                  )}
                </div>
                <span style={{ fontWeight: isActive ? 500 : 400 }}>{step}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
