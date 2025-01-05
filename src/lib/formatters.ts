export const formatCurrency = (amount: number | null) => {
  if (!amount) return 'Not recorded';
  return `£${amount.toFixed(2)}`;
};

export const formatDate = (date: string | null) => {
  if (!date) return 'No payment date recorded';
  try {
    const formattedDate = new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    return formattedDate;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};