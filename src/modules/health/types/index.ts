export type HealthMetric = {
  id: string;
  label: string;
  value: string;
  helper: string;
  tone: "mint" | "rose" | "sky";
};

export type HealthQuickAction = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
};

export type HealthFocusCard = {
  id: string;
  title: string;
  description: string;
  accent: string;
};
