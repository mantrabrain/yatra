<?php

declare(strict_types=1);

namespace Yatra\Models;

/**
 * Checkout Model
 * 
 * Encapsulates all checkout/booking data and provides clean getter methods
 * for templates to access pricing, trip, traveler, and discount information.
 * 
 * @package Yatra\Models
 * @since 3.0.0
 */
class Checkout
{
    private \stdClass $trip;
    private array $session;
    private array $pricingCalculation;
    private array $taxCalculation;
    
    public function __construct(\stdClass $trip, array $session, array $pricingCalculation)
    {
        $this->trip = $trip;
        $this->session = $session;
        $this->pricingCalculation = $pricingCalculation;
        $this->taxCalculation = $pricingCalculation['tax_calculation'] ?? [
            'enable_tax' => false,
            'tax_breakdown' => [],
            'total_tax_amount' => 0,
            'tax_inclusive' => false,
        ];
    }
    
    // ========== Trip Information ==========
    
    public function getTrip(): \stdClass
    {
        return $this->trip;
    }
    
    public function getTripId(): int
    {
        return (int) $this->trip->id;
    }
    
    public function getTripName(): string
    {
        return $this->trip->name ?? '';
    }
    
    public function getTravelDate(): string
    {
        return $this->session['travel_date'] ?? '';
    }
    
    public function getDepartureTime(): string
    {
        return $this->session['departure_time'] ?? '';
    }
    
    // ========== Pricing Type & Travelers ==========
    
    public function getPricingType(): string
    {
        return $this->session['pricing_type'] ?? 'regular';
    }
    
    public function isTravelerBased(): bool
    {
        return $this->getPricingType() === 'traveler_based';
    }
    
    public function getTotalTravelers(): int
    {
        return (int) ($this->session['travelers'] ?? 1);
    }
    
    public function getTravelerCounts(): array
    {
        return $this->session['traveler_counts'] ?? [];
    }
    
    public function getPriceTypes(): array
    {
        return $this->session['price_types'] ?? [];
    }
    
    public function getCategoryBreakdown(): array
    {
        if (!$this->isTravelerBased() || empty($this->getPriceTypes())) {
            return [];
        }
        
        $breakdown = [];
        $priceTypes = $this->getPriceTypes();
        $travelerCounts = $this->getTravelerCounts();
        
        foreach ($priceTypes as $index => $pt) {
            $pt = (object) $pt;
            $categoryId = $pt->category_id ?? $index;
            $categoryLabel = $pt->category_label ?? __('Traveler', 'yatra');
            $categoryPrice = isset($pt->effective_price) 
                ? (float) $pt->effective_price 
                : ($pt->sale_price ?? $pt->discounted_price ?? $pt->original_price ?? 0);
            $count = isset($travelerCounts[$categoryId]) 
                ? (int) $travelerCounts[$categoryId] 
                : ($index === 0 ? 1 : 0);
            
            if ($count > 0) {
                $breakdown[] = [
                    'category_id' => $categoryId,
                    'label' => $categoryLabel,
                    'count' => $count,
                    'price' => $categoryPrice,
                    'subtotal' => $categoryPrice * $count,
                ];
            }
        }
        
        return $breakdown;
    }
    
    // ========== Pricing Amounts ==========
    
    public function getPricePerPerson(): float
    {
        // Use unit_price from pricing calculation, or fallback to trip's discounted/original price
        if (isset($this->pricingCalculation['unit_price']) && $this->pricingCalculation['unit_price'] > 0) {
            return (float) $this->pricingCalculation['unit_price'];
        }
        
        // Fallback to trip pricing
        return (float) ($this->trip->discounted_price ?? $this->trip->original_price ?? 0);
    }
    
    public function getBaseAmount(): float
    {
        return (float) ($this->pricingCalculation['base_amount'] ?? 0);
    }
    
    public function getGrossTotal(): float
    {
        return (float) ($this->pricingCalculation['gross_total'] ?? $this->getBaseAmount());
    }
    
    public function getSubtotal(): float
    {
        return $this->getGrossTotal();
    }
    
    public function getNetTotal(): float
    {
        return (float) ($this->pricingCalculation['final_total'] ?? 0);
    }
    
    public function getFinalTotal(): float
    {
        return $this->getNetTotal();
    }
    
    public function getAmountDue(): float
    {
        return (float) ($this->pricingCalculation['amount_due'] ?? $this->getNetTotal());
    }
    
    // ========== Discounts ==========
    
    public function getGroupDiscount(): ?array
    {
        $discount = $this->pricingCalculation['group_discount'] ?? null;
        if (empty($discount) || empty($discount['amount'])) {
            return null;
        }
        return $discount;
    }
    
    public function getGroupDiscountAmount(): float
    {
        $discount = $this->getGroupDiscount();
        return $discount ? (float) ($discount['amount'] ?? 0) : 0.0;
    }
    
    public function getGroupDiscountLabel(): string
    {
        $discount = $this->getGroupDiscount();
        return $discount ? ($discount['label'] ?? __('Group Discount', 'yatra')) : '';
    }
    
    public function getCouponDiscount(): ?array
    {
        $discount = $this->pricingCalculation['coupon_discount'] ?? null;
        if (empty($discount) || empty($discount['calculated_amount'])) {
            return null;
        }
        return $discount;
    }
    
    public function getCouponDiscountAmount(): float
    {
        $discount = $this->getCouponDiscount();
        return $discount ? (float) ($discount['calculated_amount'] ?? 0) : 0.0;
    }
    
    public function getCouponDiscountLabel(): string
    {
        $discount = $this->getCouponDiscount();
        return $discount ? ($discount['label'] ?? __('Coupon Discount', 'yatra')) : '';
    }
    
    public function getCouponCode(): string
    {
        $discount = $this->getCouponDiscount();
        return $discount ? ($discount['code'] ?? '') : '';
    }
    
    public function hasCoupon(): bool
    {
        return !empty($this->getCouponCode());
    }
    
    public function getTotalDiscountAmount(): float
    {
        return $this->getGroupDiscountAmount() + $this->getCouponDiscountAmount();
    }
    
    // ========== Tax Information ==========
    
    public function isTaxEnabled(): bool
    {
        return !empty($this->taxCalculation['enable_tax']);
    }
    
    public function getTaxBreakdown(): array
    {
        return $this->taxCalculation['tax_breakdown'] ?? [];
    }
    
    public function getTotalTaxAmount(): float
    {
        return (float) ($this->taxCalculation['total_tax_amount'] ?? 0);
    }
    
    public function isTaxInclusive(): bool
    {
        return !empty($this->taxCalculation['tax_inclusive']);
    }
    
    public function hasTaxes(): bool
    {
        return $this->isTaxEnabled() && !empty($this->getTaxBreakdown());
    }
    
    public function getTaxableAmount(): float
    {
        return (float) ($this->pricingCalculation['taxable_amount'] ?? 0);
    }
    
    // ========== Payment Methods ==========
    
    public function getPaymentMethod(): string
    {
        return $this->session['payment_method'] ?? 'full';
    }
    
    public function isDepositPayment(): bool
    {
        return $this->getPaymentMethod() === 'deposit';
    }
    
    public function isPartialPayment(): bool
    {
        return $this->getPaymentMethod() === 'partial';
    }
    
    public function getDepositPercentage(): int
    {
        return (int) ($this->session['deposit_percentage'] ?? 20);
    }
    
    public function getPartialPercentage(): int
    {
        return (int) ($this->session['partial_payment_percentage'] ?? 30);
    }
    
    // ========== Additional Services ==========
    
    public function getAdditionalServices(): array
    {
        return $this->pricingCalculation['additional_services'] ?? [];
    }
    
    public function getServicesTotal(): float
    {
        return (float) ($this->pricingCalculation['services_total'] ?? 0);
    }
    
    public function hasAdditionalServices(): bool
    {
        return !empty($this->getAdditionalServices());
    }
    
    // ========== Itinerary Costs ==========
    
    public function getItineraryCosts(): array
    {
        return $this->pricingCalculation['itinerary_costs'] ?? [];
    }
    
    public function getItineraryCostsTotal(): float
    {
        return (float) ($this->pricingCalculation['itinerary_costs_total'] ?? 0);
    }
    
    public function hasItineraryCosts(): bool
    {
        return !empty($this->getItineraryCosts());
    }
    
    // ========== Currency ==========
    
    public function getCurrency(): ?string
    {
        return $this->pricingCalculation['currency'] ?? null;
    }
    
    public function getCurrencySymbol(): string
    {
        return yatra_get_currency_symbol($this->getCurrency());
    }
    
    // ========== Formatted Prices ==========
    
    public function formatPrice(float $amount): string
    {
        return yatra_format_price($amount, $this->getCurrency());
    }
    
    public function getFormattedPricePerPerson(): string
    {
        return $this->formatPrice($this->getPricePerPerson());
    }
    
    public function getFormattedGrossTotal(): string
    {
        return $this->formatPrice($this->getGrossTotal());
    }
    
    public function getFormattedNetTotal(): string
    {
        return $this->formatPrice($this->getNetTotal());
    }
    
    public function getFormattedAmountDue(): string
    {
        return $this->formatPrice($this->getAmountDue());
    }
    
    public function getFormattedCouponDiscount(): string
    {
        return $this->formatPrice($this->getCouponDiscountAmount());
    }
    
    public function getFormattedGroupDiscount(): string
    {
        return $this->formatPrice($this->getGroupDiscountAmount());
    }
    
    // ========== Raw Data Access (for advanced use) ==========
    
    public function getSession(): array
    {
        return $this->session;
    }
    
    public function getPricingCalculation(): array
    {
        return $this->pricingCalculation;
    }
    
    public function getTaxCalculation(): array
    {
        return $this->taxCalculation;
    }
}
