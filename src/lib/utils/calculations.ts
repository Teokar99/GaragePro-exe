import type { ServiceLine } from '../../types';

export const calculateSubtotal = (services: ServiceLine[]): number => {
  return services.reduce(
    (sum, s) => sum + (s.quantity || 1) * (s.unit_price || 0),
    0
  );
};

export const calculateVAT = (_subtotal: number, _rate: number = 0): number => {
  return 0;
};

export const calculateTotal = (subtotal: number, _vat: number): number => {
  return subtotal;
};
