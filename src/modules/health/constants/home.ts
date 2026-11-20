import type { HealthFocusCard, HealthMetric, HealthQuickAction } from "../types";

export const HEALTH_METRICS: HealthMetric[] = [
  {
    id: "score",
    label: "Wellness Score",
    value: "86",
    helper: "Strong recovery this week",
    tone: "mint",
  },
  {
    id: "steps",
    label: "Daily Activity",
    value: "7.4k",
    helper: "600 steps away from goal",
    tone: "sky",
  },
  {
    id: "sleep",
    label: "Sleep Window",
    value: "7h 45m",
    helper: "Consistency improved",
    tone: "rose",
  },
];

export const HEALTH_QUICK_ACTIONS: HealthQuickAction[] = [
  {
    id: "book-checkup",
    title: "Book checkup",
    subtitle: "Find routine health packages",
    icon: "calendar-heart",
  },
  {
    id: "track-vitals",
    title: "Track vitals",
    subtitle: "Log BP, sugar and oxygen",
    icon: "heart-pulse",
  },
  {
    id: "nutrition",
    title: "Nutrition plan",
    subtitle: "Balanced food suggestions",
    icon: "food-apple",
  },
];

export const HEALTH_FOCUS_CARDS: HealthFocusCard[] = [
  {
    id: "prevention",
    title: "Preventive care",
    description: "Keep annual screening, dental and eye checks in one place.",
    accent: "#14B8A6",
  },
  {
    id: "family",
    title: "Family health",
    description: "Save medical notes, prescriptions and reminders for loved ones.",
    accent: "#F97316",
  },
  {
    id: "goals",
    title: "Fitness goals",
    description: "Turn your daily walk, hydration and sleep targets into routines.",
    accent: "#8B5CF6",
  },
];
