# Currency Settings Documentation

**Location:** WordPress Admin → Yatra → Settings → Currency

---

## 💱 Currency System Overview

Currency settings control how prices are displayed and processed throughout your travel business. Think of this as setting up your financial display system to match your customers' expectations and local conventions.

---

## 🌍 Default Currency

### Default Currency
- **Field Type:** Searchable Select
- **Required:** Yes ✅
- **Description:** Primary currency for all transactions
- **What it does:** Sets the main currency used for pricing and payments
- **Where it affects:**
  - Trip pricing display
  - Payment processing
  - Financial reporting
  - Invoice generation
- **How it works:**
  - All trip prices are set in this currency
  - Payment gateways process in this currency
  - Financial reports use this currency as base
- **Popular currencies:**
  - **USD ($):** US Dollar - International standard
  - **EUR (€):** Euro - European standard
  - **GBP (£):** British Pound - UK standard
  - **JPY (¥):** Japanese Yen - Asian standard
  - **AUD ($):** Australian Dollar - Pacific standard
- **Selection tips:**
  - **Choose your local currency:** Most businesses use their home currency
  - **Consider customer base:** Use currency most customers understand
  - **Payment gateway compatibility:** Ensure your payment processors support it
- **⚠️ Important:** Changing this affects all existing pricing
- **⭐ Pro Tip:** Use your primary business currency for consistency

---

## 💰 Currency Display Settings

### Currency Position
- **Field Type:** Dropdown Select
- **Default:** left
- **Description:** Where to display currency symbol relative to amount
- **What it does:** Controls how currency symbols appear with prices
- **Options explained:**
  - **Left ($100):** Symbol before amount (most common)
  - **Right (100$):** Symbol after amount
  - **Left with space ($ 100):** Symbol before with space
  - **Right with space (100 $):** Symbol after with space
- **Regional conventions:**
  - **US/UK:** $100 (left)
  - **Europe:** €100 (left)
  - **Some countries:** 100$ (right)
- **Best practices:**
  - **Match local conventions:** Use what your customers expect
  - **Be consistent:** Use same format throughout your site
  - **Test readability:** Ensure prices are easy to read
- **⭐ Pro Tip:** Use left position for most international audiences

### Thousand Separator
- **Field Type:** Text Input
- **Default:** , (comma)
- **Description:** Character used to separate thousands (e.g., comma for 1,000)
- **What it does:** Separates thousands in large numbers
- **Common separators:**
  - **, (comma):** 1,000 (US, UK, many countries)
  - **. (period):** 1.000 (Europe, South America)
  - ** (space):** 1 000 (France, some European countries)
- **Examples:**
  - **Comma:** $1,000.50
  - **Period:** €1.000,50
  - **Space:** 1 000,50 €
- **Why it matters:** Affects price readability and customer understanding
- **⭐ Pro Tip:** Match your target audience's local conventions

### Decimal Places
- **Field Type:** Number Input
- **Default:** 2
- **Description:** Number of decimal places to show in prices
- **What it does:** Controls how many decimal digits appear in prices
- **Common settings:**
  - **0:** Whole numbers only ($100)
  - **1:** One decimal ($100.5)
  - **2:** Two decimals ($100.50) - most common
  - **3:** Three decimals ($100.500) - rare
- **When to use different settings:**
  - **0 decimals:** Whole number pricing (common in some Asian countries)
  - **1 decimal:** Low-value currencies where decimals matter less
  - **2 decimals:** Standard for most currencies
  - **3 decimals:** High-precision pricing (rare)
- **Business impact:**
  - **Fewer decimals:** Cleaner pricing, but less precise
  - **More decimals:** More precise, but may look cluttered
- **⭐ Pro Tip:** Use 2 decimals for most international business

### Decimal Separator
- **Field Type:** Text Input
- **Default:** . (period)
- **Description:** Character used to separate decimal part (e.g., period for 99.99)
- **What it does:** Separates whole numbers from decimal fractions
- **Common separators:**
  - **. (period):** 100.50 (US, UK, international standard)
  - **, (comma):** 100,50 (Europe, South America)
- **Important note:** Must be different from thousand separator
- **Regional examples:**
  - **US:** $1,000.50 (comma thousand, period decimal)
  - **Germany:** €1.000,50 (period thousand, comma decimal)
  - **France:** 1 000,50 € (space thousand, comma decimal)
- **⚠️ Critical:** Thousand and decimal separators must be different
- **⭐ Pro Tip:** Use period for decimal separator for international audiences

---

## 🎯 Currency Display Examples

### US Format (Most International)
- **Currency:** USD
- **Position:** Left
- **Thousand Separator:** Comma
- **Decimal Separator:** Period
- **Decimal Places:** 2
- **Result:** $1,234.56

### European Format
- **Currency:** EUR
- **Position:** Left
- **Thousand Separator:** Period
- **Decimal Separator:** Comma
- **Decimal Places:** 2
- **Result:** €1.234,56

### Asian Format
- **Currency:** JPY
- **Position:** Left
- **Thousand Separator:** Comma
- **Decimal Separator:** Period
- **Decimal Places:** 0
- **Result:** ¥1,235

---

## 🌐 Multi-Currency Considerations

### Single Currency vs Multi-Currency
- **Single Currency (current):** All prices in one currency
- **Multi-Currency (future):** Prices shown in customer's local currency
- **Current limitation:** Yatra currently supports single currency only
- **Future considerations:**
  - **Customer location detection**
  - **Real-time exchange rates**
  - **Currency conversion**
  - **Multi-currency payment processing**

### International Customer Strategy
- **Choose universal currency:** USD or EUR for international customers
- **Clear communication:** Explain currency to international customers
- **Payment processing:** Ensure payment gateways support your currency
- **Price psychology:** Consider how currency affects perceived value

---

## 🎨 Currency Display Best Practices

### 1. Readability
- **Clear formatting:** Use standard, recognizable formats
- **Consistent display:** Same format throughout your website
- **Appropriate precision:** Right number of decimal places
- **Visual hierarchy:** Make prices stand out appropriately

### 2. Customer Expectations
- **Local conventions:** Match what customers expect
- **International standards:** Use familiar formats for global audience
- **Price clarity:** Avoid confusion about currency
- **Trust building:** Professional, consistent currency display

### 3. Technical Considerations
- **Payment compatibility:** Ensure payment gateways support your currency
- **Reporting accuracy:** Financial reports use these settings
- **Calculation precision:** Ensure calculations remain accurate
- **Data consistency:** Maintain consistent currency throughout system

---

## 📊 Currency Impact on Business

### Pricing Strategy
- **Currency choice affects perceived value:** Same price feels different in different currencies
- **Psychological pricing:** Some currencies have different pricing psychology
- **Market positioning:** Currency choice affects market perception
- **Competitive analysis:** Consider competitors' currency choices

### Customer Experience
- **Familiarity:** Customers prefer familiar currency formats
- **Trust:** Professional currency display builds trust
- **Clarity:** Clear pricing reduces confusion and support requests
- **Conversion:** Easy-to-understand pricing improves conversion

### Financial Management
- **Accounting:** All financial records use this currency
- **Reporting:** Business reports in this currency
- **Tax calculations:** Taxes calculated in this currency
- **Payment processing:** All transactions in this currency

---

## ⚠️ Common Currency Issues and Solutions

### 1. Wrong Currency Format
- **Problem:** Prices don't display correctly for local audience
- **Causes:** Using wrong separators or position
- **Solutions:** Research local conventions, test with target audience

### 2. Payment Gateway Compatibility
- **Problem:** Payment processors don't support your currency
- **Causes:** Using uncommon currency or gateway limitations
- **Solutions:** Choose compatible currency, find different payment gateway

### 3. Customer Confusion
- **Problem:** International customers don't understand pricing
- **Causes:** Unfamiliar currency or format
- **Solutions:** Use international currency (USD/EUR), provide currency converter

### 4. Calculation Errors
- **Problem:** Tax or discount calculations incorrect
- **Causes:** Wrong decimal settings, rounding issues
- **Solutions:** Test calculations thoroughly, use standard settings

---

## 🔗 Related Settings

- **Tax Settings:** Tax calculations use currency formatting
- **Payment Settings:** Payment processing in this currency
- **General Settings:** Company information may include currency details
- **Email Settings:** Currency appears in email confirmations

---

## 📋 Quick Setup Checklist

### Essential (Must Configure)
- [ ] Set Default Currency (your primary business currency)
- [ ] Configure Currency Position (left for most businesses)
- [ ] Set Thousand Separator (comma for international)
- [ ] Set Decimal Separator (period for international)
- [ ] Set Decimal Places (2 for most currencies)

### Recommended (Should Configure)
- [ ] Test currency display with sample prices
- [ ] Verify payment gateway compatibility
- [ ] Check financial reporting accuracy
- [ ] Test with target audience if possible

### Optional (Consider Later)
- [ ] Monitor currency conversion needs
- [ ] Consider multi-currency expansion
- [ ] Analyze currency impact on pricing strategy
- [ ] Adjust pricing for different currency perceptions

---

## 🚨 Critical Currency Reminders

### Before Setting Currency
- [ ] Research your target market's currency preferences
- [ ] Verify payment gateway supports your chosen currency
- [ ] Consider international customer needs
- [ ] Plan pricing strategy around currency choice

### After Setting Currency
- [ ] Test all price displays throughout website
- [ ] Verify payment processing works correctly
- [ ] Check financial reporting accuracy
- [ ] Monitor customer feedback on pricing

### Ongoing Management
- [ ] Monitor exchange rate impact (if applicable)
- [ ] Consider currency changes for market expansion
- [ ] Maintain consistent currency display
- [ ] Update pricing strategy as needed
