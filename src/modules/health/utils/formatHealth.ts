export const formatHealthGreeting = (name?: string | null) => {
  if (!name?.trim()) return "Your health dashboard";

  const [firstName] = name.trim().split(/\s+/);
  return `${firstName}'s health dashboard`;
};
