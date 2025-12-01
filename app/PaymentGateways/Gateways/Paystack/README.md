# Paystack Payment Gateway

## Overview
Paystack is a leading payment infrastructure for Africa, enabling businesses to accept payments from customers across the continent.

## Features
- **Cards**: Visa, Mastercard, Verve
- **Bank Transfer**: Direct bank transfers
- **USSD**: Mobile banking via USSD codes
- **Mobile Money**: MTN Mobile Money, Airtel Money
- **QR Payments**: QR code-based payments
- **Refunds**: Full and partial refund support
- **Recurring Payments**: Subscription billing
- **Multi-currency**: NGN, GHS, ZAR, KES

## Configuration
1. Create a Paystack account at https://paystack.com
2. Get your public and secret keys from the dashboard
3. Configure webhook URLs for payment notifications
4. Complete business verification for live payments

## Supported Countries
- Nigeria (NGN)
- Ghana (GHS) 
- South Africa (ZAR)
- Kenya (KES)

## Documentation
- [Paystack API Documentation](https://paystack.com/docs/api/)
- [Accept Payments](https://paystack.com/docs/payments/accept-payments/)
- [Webhooks](https://paystack.com/docs/payments/webhooks/)

## Files
- `PaystackGateway.php` - Main gateway implementation
- `icon.svg` - Paystack logo for UI display
