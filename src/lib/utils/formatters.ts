export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('el-GR');
};

export const formatCurrency = (amount: number): string => {
  return `${amount.toFixed(2)}€`;
};

export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};
