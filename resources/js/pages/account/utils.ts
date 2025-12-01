import { __ } from '../../lib/i18n';

export const formatDate = (value: string | undefined | null) => {
  if (!value) {
    return __('N/A', 'N/A');
  }
  
  try {
    const date = new Date(value);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return __('Invalid date', 'Invalid date');
    }
    
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (error) {
    return __('Invalid date', 'Invalid date');
  }
};

export const getBadge = (status: string | undefined | null) => {
  const base = 'px-2.5 py-0.5 rounded-full text-xs font-medium';
  
  // Handle undefined/null/empty status
  if (!status || typeof status !== 'string') {
    return `${base} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300`;
  }
  
  switch (status.toLowerCase()) {
    case 'paid':
    case 'confirmed':
    case 'resolved':
      return `${base} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`;
    case 'pending':
    case 'partial':
    case 'awaiting_response':
      return `${base} bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300`;
    case 'failed':
    case 'cancelled':
      return `${base} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300`;
    default:
      return `${base} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`;
  }
};

export const formatPrice = (price: number) => {
  const globalCurrency = (window as any).yatraAdmin?.currency || 'USD';
  const currencyPosition = (window as any).yatraAdmin?.currencyPosition || 'before';
  const decimalPlaces = (window as any).yatraAdmin?.decimalPlaces || 2;
  const thousandSeparator = (window as any).yatraAdmin?.thousandSeparator || ',';
  const decimalSeparator = (window as any).yatraAdmin?.decimalSeparator || '.';
  
  if (!price || price === 0) {
    return __('Contact for pricing', 'Contact for pricing');
  }
  
  const formattedAmount = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(price).replace(/,/g, 'TEMP_THOUSAND').replace(/\./g, decimalSeparator).replace(/TEMP_THOUSAND/g, thousandSeparator);
  
  const currencySymbol = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: globalCurrency,
  }).format(0).replace(/[\d\s.,]/g, '').trim();
  
  if (currencyPosition === 'right' || currencyPosition === 'after') {
    return `${formattedAmount} ${currencySymbol}`;
  }
  
  return `${currencySymbol} ${formattedAmount}`;
};

export const formatPriceForBooking = (price: number, currency?: string) => {
  const globalCurrency = (window as any).yatraAdmin?.currency || 'USD';
  const currencyPosition = (window as any).yatraAdmin?.currencyPosition || 'before';
  const decimalPlaces = (window as any).yatraAdmin?.decimalPlaces || 2;
  const thousandSeparator = (window as any).yatraAdmin?.thousandSeparator || ',';
  const decimalSeparator = (window as any).yatraAdmin?.decimalSeparator || '.';
  
  const currencyToUse = currency || globalCurrency;
  
  // Always format the price, even if 0 - don't show "Contact for pricing" for bookings
  const numPrice = Number(price) || 0;
  
  const formattedAmount = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(numPrice).replace(/,/g, 'TEMP_THOUSAND').replace(/\./g, decimalSeparator).replace(/TEMP_THOUSAND/g, thousandSeparator);
  
  const currencySymbol = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyToUse,
  }).format(0).replace(/[\d\s.,]/g, '').trim();
  
  if (currencyPosition === 'right' || currencyPosition === 'after') {
    return `${formattedAmount} ${currencySymbol}`;
  }
  
  return `${currencySymbol} ${formattedAmount}`;
};

export const currency = (value: number) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value);

