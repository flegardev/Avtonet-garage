# 🎓 AvtoNet Garage & Valuation — Beginner's Learning Guide

## What This Project Does
**avtonet-garage** is an automotive marketplace aggregator, vehicle depreciation curve calculator, and digital garage maintenance tracker built with TypeScript and Zod schema validation.

---

## 🗺️ Architecture Map

```
VEHICLE DOMAIN & SCHEMAS
  │  (src/types/vehicle.ts - Vehicle Attributes, Condition Grades, Listing Schemas)
  ▼
VALUATION & DEPRECIATION ENGINE
  │  ├── Depreciation Curves (src/services/valuationEngine.ts)
  │  ├── Condition & Mileage Adjusters
  │  └── Deal Rating Classifier (GREAT_DEAL, FAIR_PRICE, OVERPRICED)
  ▼
GARAGE & MAINTENANCE HOOKS
  │  ├── useGarage (src/hooks/useGarage.ts)
  │  └── vehicleFormatters (src/utils/vehicleFormatters.ts)
  ▼
UNIT TEST & INVARIANT SUITE
     (tests/valuationEngine.test.ts - Vitest Mathematical Precision & Pricing Invariants)
```

---

## 🎯 Core Files to Study First (Recommended Learning Order)

1. [`src/services/valuationEngine.ts`](file:///C:/Users/tinif/repos/avtonet-garage/src/services/valuationEngine.ts)
   - **Why study first**: Teaches multi-factor automotive valuation mathematics, depreciation curve compounding, and deal rating classification.
2. [`src/types/vehicle.ts`](file:///C:/Users/tinif/repos/avtonet-garage/src/types/vehicle.ts)
   - **Why study next**: Shows how Zod defines strict validation rules for automotive listings, fuel types, transmission types, and mileage ranges.
3. [`tests/valuationEngine.test.ts`](file:///C:/Users/tinif/repos/avtonet-garage/tests/valuationEngine.test.ts)
   - **Why study third**: Demonstrates comprehensive test coverage for financial valuation engines.

---

## 🛠️ How to Run & Verify

```bash
npm test
npm run typecheck
npm run build
```
