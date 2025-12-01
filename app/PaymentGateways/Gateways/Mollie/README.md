# Mollie Payment Gateway

## Overview
Mollie is a leading European payment service provider, offering a wide range of local and international payment methods.

## Features
- **Credit Cards**: Visa, Mastercard, American Express
- **Local Payment Methods**: 
  - iDEAL (Netherlands)
  - Bancontact (Belgium)
  - SOFORT Banking (Germany/Austria)
  - EPS (Austria)
  - Giropay (Germany)
- **Digital Wallets**: PayPal, Apple Pay
- **Bank Transfers**: SEPA Direct Debit
- **Refunds**: Full and partial refund support
- **Recurring Payments**: Subscription support

## Configuration
1. Create a Mollie account at https://mollie.com
2. Get your API key from the Mollie Dashboard
3. Configure webhook URLs for payment notifications
4. Select which payment methods to enable

## Supported Countries
Primarily focused on European markets, especially Netherlands, Belgium, Germany, and Austria.

## Documentation
- [Mollie API Documentation](https://docs.mollie.com/overview)
- [Payment Methods](https://docs.mollie.com/payments/overview)
- [Webhooks](https://docs.mollie.com/overview/webhooks)

## Files
- `MollieGateway.php` - Main gateway implementation
- `icon.svg` - Mollie logo for UI display
