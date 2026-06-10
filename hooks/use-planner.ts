'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { SchedulePlan, QuestionAnswers } from '@/types/planner';

const PLAN_KEY = 'planner-data';
const ANSWERS_KEY = 'planner-answers';

export function usePlanner() {
  const [plan, setPlan] = useState<SchedulePlan | null>(null);
  const [answers, setAnswers] = useState<QuestionAnswers | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const storedPlan = localStorage.getItem(PLAN_KEY);
      const storedAnswers = localStorage.getItem(ANSWERS_KEY);
      if (storedPlan) setPlan(JSON.parse(storedPlan));
      if (storedAnswers) setAnswers(JSON.parse(storedAnswers));
    } catch {}
  }, []);

  const savePlan = useCallback((newPlan: SchedulePlan) => {
    setPlan(newPlan);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(PLAN_KEY, JSON.stringify(newPlan));
      setShowSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setShowSaved(false), 1500);
    }, 500);
  }, []);

  const saveAnswers = useCallback((a: QuestionAnswers) => {
    setAnswers(a);
    localStorage.setItem(ANSWERS_KEY, JSON.stringify(a));
  }, []);

  const clearAll = useCallback(() => {
    localStorage.removeItem(PLAN_KEY);
    localStorage.removeItem(ANSWERS_KEY);
    setPlan(null);
    setAnswers(null);
  }, []);

  return { plan, answers, showSaved, savePlan, saveAnswers, clearAll };
}
