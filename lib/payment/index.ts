/**
 * Centralized Payment Architecture & Provider Abstraction
 * Separates Customer Payment Methods from Backend Gateways/Providers.
 */

export type CustomerPaymentMethod = 'CASH' | 'TELEBIRR' | 'CBE_BIRR' | 'EBIRR';
export type PaymentProvider = 'NONE' | 'CHAPA';

export interface PaymentMethodOption {
  id: CustomerPaymentMethod;
  name: string;
  badge?: string;
  description: string;
  provider: PaymentProvider;
  iconName: 'cash' | 'telebirr' | 'cbe' | 'ebirr';
  logoSrc: string;
}

export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  {
    id: 'CASH',
    name: 'Cash',
    badge: 'Pay at Doorstep',
    description: 'Pay the delivery person in cash when your order is delivered.',
    provider: 'NONE',
    iconName: 'cash',
    logoSrc: '/images/payments/cash.png',
  },
  {
    id: 'TELEBIRR',
    name: 'Telebirr',
    description: 'Pay seamlessly using your Telebirr account / mobile money.',
    provider: 'CHAPA',
    iconName: 'telebirr',
    logoSrc: '/images/payments/telebirr.png',
  },
  {
    id: 'CBE_BIRR',
    name: 'CBE Birr',
    description: 'Pay directly using Commercial Bank of Ethiopia (CBE Birr).',
    provider: 'CHAPA',
    iconName: 'cbe',
    logoSrc: '/images/payments/cbe-birr.png',
  },
  {
    id: 'EBIRR',
    name: 'E-Birr',
    description: 'Pay quickly and securely using your E-Birr mobile wallet.',
    provider: 'CHAPA',
    iconName: 'ebirr',
    logoSrc: '/images/payments/ebirr.png',
  },
];

/**
 * Resolves internal gateway provider for a given payment method
 */
export function resolvePaymentProvider(method?: string | null): PaymentProvider {
  if (!method) return 'NONE';
  const norm = method.trim().toUpperCase();
  if (norm === 'CASH' || norm === 'CASH_ON_DELIVERY' || norm === 'COD') {
    return 'NONE';
  }
  if (norm === 'TELEBIRR' || norm === 'CBE_BIRR' || norm === 'EBIRR' || norm === 'CHAPA') {
    return 'CHAPA';
  }
  return 'NONE';
}

/**
 * Maps KicksLab payment method to Chapa payment channel identifier
 */
export function mapToChapaChannel(method?: string | null): string {
  if (!method) return 'telebirr';
  const norm = method.trim().toUpperCase();
  switch (norm) {
    case 'TELEBIRR':
      return 'telebirr';
    case 'CBE_BIRR':
    case 'CBE':
      return 'cbebirr';
    case 'EBIRR':
      return 'ebirr';
    default:
      return 'telebirr';
  }
}

/**
 * Formats internal/historical payment method to clean customer-facing title
 */
export function formatPaymentMethodName(method?: string | null): string {
  if (!method) return 'Cash on Delivery';
  const norm = method.trim().toUpperCase();
  switch (norm) {
    case 'CASH':
      return 'Cash';
    case 'CASH_ON_DELIVERY':
    case 'COD':
      return 'Cash on Delivery';
    case 'TELEBIRR':
      return 'Telebirr';
    case 'CBE_BIRR':
    case 'CBE':
      return 'CBE Birr';
    case 'EBIRR':
      return 'E-Birr';
    case 'CHAPA':
      return 'Online Payment';
    default:
      return method;
  }
}

/**
 * Checks if a payment method represents Cash on Delivery
 */
export function isCashPayment(method?: string | null): boolean {
  if (!method) return false;
  const norm = method.trim().toUpperCase();
  return (
    norm === 'CASH' ||
    norm === 'CASH_ON_DELIVERY' ||
    norm === 'COD' ||
    norm.includes('CASH')
  );
}

/**
 * Determines if an order was processed digitally through a payment gateway (e.g. Chapa)
 */
export function isDigitalPayment(order?: {
  paymentMethod?: string | null;
  paymentProvider?: string | null;
  paymentReference?: string | null;
} | null): boolean {
  if (!order) return false;
  if (order.paymentProvider === 'CHAPA') return true;
  if (order.paymentReference && order.paymentReference.trim().length > 0) return true;
  const pm = (order.paymentMethod || '').trim().toUpperCase();
  return pm === 'TELEBIRR' || pm === 'CBE_BIRR' || pm === 'EBIRR' || pm === 'CHAPA';
}
