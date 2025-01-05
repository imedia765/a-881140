export const isOverdue = (dueDate: string | null) => {
  if (!dueDate) return false;
  const date = new Date(dueDate);
  const today = new Date();
  return today > date;
};