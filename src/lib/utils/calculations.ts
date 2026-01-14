import type { ServiceLine } from '../../types';

export const calculateSubtotal = (services: ServiceLine[]): number => {
  return services.reduce(
    (sum, s) => sum + (s.quantity || 1) * (s.unit_price || 0),
    0
  );
};

export const calculateVAT = (subtotal: number, rate: number = 0.24): number => {
  return subtotal * rate;
};

export const calculateTotal = (subtotal: number, vat: number): number => {
  return subtotal + vat;
};
