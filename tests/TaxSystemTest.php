<?php

namespace Yatra\Tests;

/**
 * Tax System Integration Test
 * 
 * Comprehensive test suite for the complete tax system integration
 * 
 * @package Yatra\Tests
 * @since 3.0.0
 */
class TaxSystemTest
{
    /**
     * Test single tax calculation
     */
    public function testSingleTaxCalculation()
    {
        echo "Testing Single Tax Calculation...\n";
        
        // Test with 10% tax on $100
        $taxService = new \Yatra\Services\TaxService();
        $result = $taxService->calculateTax(100.00, 'US');
        
        // Expected: $100 subtotal + $10 tax = $110 total
        $this->assertEquals(100.00, $result['subtotal']);
        $this->assertEquals(10.00, $result['tax_amount']);
        $this->assertEquals(110.00, $result['total_amount']);
        $this->assertEquals(10.00, $result['tax_rate']);
        
        echo "✅ Single tax calculation passed\n";
    }
    
    /**
     * Test multiple tax calculation
     */
    public function testMultipleTaxCalculation()
    {
        echo "Testing Multiple Tax Calculation...\n";
        
        // Test with multiple taxes: 10% + 5% on $100
        $taxService = new \Yatra\Services\TaxService();
        
        // Set up multiple tax configuration
        $settings = \Yatra\Services\SettingsService::getSettings();
        $settings['tax']['enable_tax'] = true;
        $settings['tax']['tax_type'] = 'multiple';
        $settings['tax']['multiple_taxes'] = [
            ['name' => 'VAT', 'rate' => 10],
            ['name' => 'Service Tax', 'rate' => 5]
        ];
        
        $result = $taxService->calculateTax(100.00, 'US');
        
        // Expected: $100 subtotal + $10 VAT + $5 Service Tax = $115 total
        $this->assertEquals(100.00, $result['subtotal']);
        $this->assertEquals(15.00, $result['tax_amount']);
        $this->assertEquals(115.00, $result['total_amount']);
        $this->assertEquals(15.00, $result['tax_rate']);
        $this->assertCount(2, $result['taxes']);
        
        echo "✅ Multiple tax calculation passed\n";
    }
    
    /**
     * Test country-specific tax
     */
    public function testCountrySpecificTax()
    {
        echo "Testing Country-Specific Tax...\n";
        
        $taxService = new \Yatra\Services\TaxService();
        
        // Test with country-specific tax for UK (20% VAT)
        $result = $taxService->calculateTax(100.00, 'GB');
        
        // Should apply UK-specific rate if configured
        $this->assertGreaterThan(0, $result['tax_amount']);
        $this->assertGreaterThan(100.00, $result['total_amount']);
        
        echo "✅ Country-specific tax passed\n";
    }
    
    /**
     * Test tax-inclusive pricing
     */
    public function testTaxInclusivePricing()
    {
        echo "Testing Tax-Inclusive Pricing...\n";
        
        $settings = \Yatra\Services\SettingsService::getSettings();
        $settings['tax']['enable_tax'] = true;
        $settings['tax']['tax_inclusive'] = true;
        $settings['tax']['tax_type'] = 'single';
        $settings['tax']['single_tax'] = ['name' => 'VAT', 'rate' => 20];
        
        $taxService = new \Yatra\Services\TaxService();
        $result = $taxService->calculateTax(120.00, 'GB');
        
        // For tax-inclusive: $120 total includes tax
        // Subtotal should be $120 / 1.20 = $100, tax = $20
        $this->assertEquals(120.00, $result['total_amount']);
        $this->assertEquals(100.00, $result['subtotal']);
        $this->assertEquals(20.00, $result['tax_amount']);
        $this->assertTrue($result['tax_inclusive']);
        
        echo "✅ Tax-inclusive pricing passed\n";
    }
    
    /**
     * Test booking tax service integration
     */
    public function testBookingTaxServiceIntegration()
    {
        echo "Testing Booking Tax Service Integration...\n";
        
        $bookingTaxService = new \Yatra\Services\BookingTaxService();
        
        $bookingData = [
            'trip_price' => 100.00,
            'travelers_count' => 2,
            'contact_country' => 'US'
        ];
        
        $taxData = $bookingTaxService->calculateBookingTax($bookingData);
        
        // Should calculate tax for 2 travelers: $200 subtotal + tax
        $this->assertEquals(200.00, $taxData['subtotal']);
        $this->assertGreaterThan(0, $taxData['tax_amount']);
        $this->assertGreaterThan(200.00, $taxData['total_amount']);
        
        echo "✅ Booking tax service integration passed\n";
    }
    
    /**
     * Test booking creation with tax
     */
    public function testBookingCreationWithTax()
    {
        echo "Testing Booking Creation with Tax...\n";
        
        $bookingService = new \Yatra\Services\BookingService();
        
        $bookingData = [
            'trip_id' => 1,
            'customer_name' => 'Test Customer',
            'customer_email' => 'test@example.com',
            'customer_phone' => '+1234567890',
            'travel_date' => '2024-12-31',
            'travelers_count' => 2,
            'contact_country' => 'US'
        ];
        
        // Mock trip data
        $trip = (object) [
            'id' => 1,
            'price' => 100.00,
            'currency' => 'USD'
        ];
        
        $booking = $bookingService->createBooking($bookingData);
        
        // Verify tax fields are populated
        $this->assertObjectHasProperty('tax_amount', $booking);
        $this->assertObjectHasProperty('subtotal', $booking);
        $this->assertObjectHasProperty('tax_rate', $booking);
        $this->assertObjectHasProperty('tax_inclusive', $booking);
        
        echo "✅ Booking creation with tax passed\n";
    }
    
    /**
     * Test tax validation
     */
    public function testTaxValidation()
    {
        echo "Testing Tax Validation...\n";
        
        $validationService = new \Yatra\Services\TaxValidationService();
        
        // Test valid single tax
        $validTax = ['name' => 'VAT', 'rate' => 10];
        $result = $validationService->validateSingleTax($validTax);
        $this->assertTrue($result['valid']);
        
        // Test invalid tax (rate > 100)
        $invalidTax = ['name' => 'Invalid Tax', 'rate' => 150];
        $result = $validationService->validateSingleTax($invalidTax);
        $this->assertFalse($result['valid']);
        
        // Test multiple taxes validation
        $multipleTaxes = [
            ['name' => 'VAT', 'rate' => 10],
            ['name' => 'Service Tax', 'rate' => 5]
        ];
        $result = $validationService->validateMultipleTaxes($multipleTaxes);
        $this->assertTrue($result['valid']);
        $this->assertEquals(15.0, $result['total_rate']);
        
        echo "✅ Tax validation passed\n";
    }
    
    /**
     * Test tax reporting
     */
    public function testTaxReporting()
    {
        echo "Testing Tax Reporting...\n";
        
        $bookingTaxService = new \Yatra\Services\BookingTaxService();
        
        // Create mock booking data
        $bookings = [
            (object) [
                'id' => 1,
                'total_amount' => 110.00,
                'tax_amount' => 10.00,
                'tax_rate' => 10.00,
                'contact_country' => 'US',
                'created_at' => '2024-01-01'
            ],
            (object) [
                'id' => 2,
                'total_amount' => 115.00,
                'tax_amount' => 15.00,
                'tax_rate' => 15.00,
                'contact_country' => 'GB',
                'created_at' => '2024-01-02'
            ]
        ];
        
        $report = $bookingTaxService->generateTaxReport($bookings);
        
        $this->assertEquals(25.00, $report['total_tax_collected']);
        $this->assertEquals(2, $report['total_bookings_with_tax']);
        $this->assertEquals(12.5, $report['average_tax_rate']);
        
        echo "✅ Tax reporting passed\n";
    }
    
    /**
     * Run all tests
     */
    public function runAllTests()
    {
        echo "🚀 Starting Tax System Integration Tests...\n\n";
        
        try {
            $this->testSingleTaxCalculation();
            $this->testMultipleTaxCalculation();
            $this->testCountrySpecificTax();
            $this->testTaxInclusivePricing();
            $this->testBookingTaxServiceIntegration();
            $this->testBookingCreationWithTax();
            $this->testTaxValidation();
            $this->testTaxReporting();
            
            echo "\n✅ All tax system tests passed successfully!\n";
            echo "🎉 Tax system is ready for production use!\n";
            
        } catch (\Exception $e) {
            echo "\n❌ Test failed: " . $e->getMessage() . "\n";
            echo "📍 File: " . $e->getFile() . " Line: " . $e->getLine() . "\n";
        }
    }
    
    /**
     * Simple assertion helper
     */
    private function assertEquals($expected, $actual)
    {
        if ($expected !== $actual) {
            throw new \Exception("Expected " . var_export($expected, true) . " but got " . var_export($actual, true));
        }
    }
    
    /**
     * Simple assertion helper for greater than
     */
    private function assertGreaterThan($expected, $actual)
    {
        if ($actual <= $expected) {
            throw new \Exception("Expected value greater than " . var_export($expected, true) . " but got " . var_export($actual, true));
        }
    }
    
    /**
     * Simple assertion helper for object property
     */
    private function assertObjectHasProperty($property, $object)
    {
        if (!property_exists($object, $property)) {
            throw new \Exception("Object does not have property: " . $property);
        }
    }
    
    /**
     * Simple assertion helper for true
     */
    private function assertTrue($value)
    {
        if (!$value) {
            throw new \Exception("Expected true but got false");
        }
    }
    
    /**
     * Simple assertion helper for false
     */
    private function assertFalse($value)
    {
        if ($value) {
            throw new \Exception("Expected false but got true");
        }
    }
    
    /**
     * Simple assertion helper for count
     */
    private function assertCount($expected, $array)
    {
        if (count($array) !== $expected) {
            throw new \Exception("Expected count " . $expected . " but got " . count($array));
        }
    }
}

// Run tests if this file is executed directly
if (basename(__FILE__) === basename($_SERVER['SCRIPT_NAME'])) {
    $test = new TaxSystemTest();
    $test->runAllTests();
}
