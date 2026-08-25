import { describe, it, expect } from "vitest";
import {
  computeVehicleValuation,
  compareVehicleListings
} from "../src/services/valuationEngine";
import {
  type VehicleListing,
  VehicleListingSchema,
  ValuationResultSchema
} from "../src/types/vehicle";

describe("AvtoNet Garage Valuation Calculation Engine", () => {
  const createCar = (overrides: Partial<VehicleListing> = {}): VehicleListing => ({
    id: "00000000-0000-0000-0000-000000000001",
    make: "Volkswagen",
    model: "Golf",
    year: 2022,
    odometerKm: 60000,
    powerKw: 110,
    engineDisplacementCc: 1968,
    fuelType: "DIESEL",
    transmission: "AUTOMATIC",
    bodyStyle: "HATCHBACK",
    askingPriceEur: 18000,
    originalMsrpEur: 32000,
    firstRegistrationDate: "2022-03",
    locationCity: "Ljubljana",
    serviceHistoryComplete: true,
    accidentFree: true,
    images: [],
    ...overrides
  });

  describe("Depreciation and Valuation Algorithms", () => {
    it("should compute age depreciation and fair market price", () => {
      const car = createCar({ year: 2022, odometerKm: 60000 }); // 4 years old in 2026
      const val = computeVehicleValuation(car, { currentYear: 2026, annualAverageKm: 15000 });

      expect(val.ageYears).toBe(4);
      expect(val.calculatedFairPriceEur).toBeLessThan(car.originalMsrpEur);
      expect(val.fairPriceRangeMinEur).toBeLessThan(val.calculatedFairPriceEur);
      expect(val.fairPriceRangeMaxEur).toBeGreaterThan(val.calculatedFairPriceEur);
      expect(() => ValuationResultSchema.parse(val)).not.toThrow();
    });

    it("should apply mileage penalty when odometer exceeds normal expected average", () => {
      const normalCar = createCar({ year: 2023, odometerKm: 45000 }); // 3 years, 45k km
      const highMileageCar = createCar({ year: 2023, odometerKm: 120000 }); // 3 years, 120k km

      const valNormal = computeVehicleValuation(normalCar, { currentYear: 2026 });
      const valHigh = computeVehicleValuation(highMileageCar, { currentYear: 2026 });

      expect(valHigh.calculatedFairPriceEur).toBeLessThan(valNormal.calculatedFairPriceEur);
      expect(valHigh.mileageDeviationFactor).toBeGreaterThan(valNormal.mileageDeviationFactor);
    });

    it("should award premium for complete service history and discount for accidents", () => {
      const pristineCar = createCar({ serviceHistoryComplete: true, accidentFree: true });
      const damagedCar = createCar({ serviceHistoryComplete: false, accidentFree: false });

      const valPristine = computeVehicleValuation(pristineCar);
      const valDamaged = computeVehicleValuation(damagedCar);

      expect(valPristine.calculatedFairPriceEur).toBeGreaterThan(valDamaged.calculatedFairPriceEur);
    });

    it("should identify OUTSTANDING_VALUE when asking price is substantially below market", () => {
      const underpricedCar = createCar({
        askingPriceEur: 10000, // Significantly below ~18k fair price
        originalMsrpEur: 35000,
        year: 2023,
        odometerKm: 30000
      });

      const val = computeVehicleValuation(underpricedCar, { currentYear: 2026 });
      expect(val.priceAnomaly).toBe("OUTSTANDING_VALUE");
    });

    it("should identify OVERPRICED when asking price exceeds fair market range", () => {
      const overpricedCar = createCar({
        askingPriceEur: 30000, // Near new price for 4yo car
        originalMsrpEur: 32000,
        year: 2022,
        odometerKm: 100000
      });

      const val = computeVehicleValuation(overpricedCar, { currentYear: 2026 });
      expect(val.priceAnomaly).toBe("OVERPRICED");
    });
  });

  describe("Vehicle Comparison Matrix", () => {
    it("should compare two vehicles and recommend the superior deal", () => {
      const dealCar = createCar({ id: "car-deal", askingPriceEur: 14000, originalMsrpEur: 30000, powerKw: 110 });
      const expensiveCar = createCar({ id: "car-expensive", askingPriceEur: 22000, originalMsrpEur: 30000, powerKw: 110 });

      const comp = compareVehicleListings(dealCar, expensiveCar);
      expect(comp.cheaperByEur).toBe(8000);
      expect(comp.recommendedPickId).toBe("car-deal");
    });
  });

  describe("Zod VehicleListing Ingestion Validation", () => {
    it("should validate a complete valid vehicle listing", () => {
      const car = createCar();
      expect(() => VehicleListingSchema.parse(car)).not.toThrow();
    });

    it("should reject invalid year outside reasonable automotive bounds", () => {
      const invalidCar = createCar({ year: 1850 });
      expect(() => VehicleListingSchema.parse(invalidCar)).toThrow();
    });
  });
});
