export const isOverdue = (dueDate: string | null) => {
  if (!dueDate) return false;
  const date = new Date(dueDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 28;
};