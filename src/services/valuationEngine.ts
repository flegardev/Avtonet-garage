import {
  type PriceAnomalyRating,
  type ValuationResult,
  type VehicleListing
} from "../types/vehicle";

export interface ValuationEngineOptions {
  currentYear?: number;
  annualAverageKm?: number; // default 15,000 km/year
  firstYearDepreciationRate?: number; // default 20%
  subsequentDepreciationRate?: number; // default 12%
}

/**
 * Calculates fair market value and depreciation curve for a vehicle listing
 */
export function computeVehicleValuation(
  vehicle: VehicleListing,
  options: ValuationEngineOptions = {}
): ValuationResult {
  const currentYear = options.currentYear ?? 2026;
  const annualAvgKm = options.annualAverageKm ?? 15000;
  const firstYearRate = options.firstYearDepreciationRate ?? 0.20;
  const subYearRate = options.subsequentDepreciationRate ?? 0.12;

  const ageYears = Math.max(0, currentYear - vehicle.year);
  const expectedMileage = Math.max(annualAvgKm, ageYears * annualAvgKm);

  // 1. Base Age Depreciation
  let remainingValueRatio = 1.0;
  if (ageYears >= 1) {
    remainingValueRatio *= 1 - firstYearRate;
    if (ageYears > 1) {
      remainingValueRatio *= Math.pow(1 - subYearRate, ageYears - 1);
    }
  } else {
    // Brand new within current year (prorated)
    remainingValueRatio = 0.95;
  }

  // Cap minimum salvage floor at 10% of MSRP
  remainingValueRatio = Math.max(0.10, remainingValueRatio);

  let fairPrice = vehicle.originalMsrpEur * remainingValueRatio;

  // 2. Mileage Deviation Multiplier
  const mileageDeltaKm = vehicle.odometerKm - expectedMileage;
  const mileageDeviationFactor = Number((vehicle.odometerKm / Math.max(expectedMileage, 1)).toFixed(2));

  // -3% penalty per 10,000 km above expectation, +2% bonus per 10,000 km below expectation
  const mileageAdjustmentRatio = 1 - (mileageDeltaKm / 10000) * 0.03;
  const clampedMileageRatio = Math.max(0.70, Math.min(1.25, mileageAdjustmentRatio));
  fairPrice *= clampedMileageRatio;

  // 3. Service History and Condition Modifiers
  if (vehicle.serviceHistoryComplete) {
    fairPrice *= 1.05; // +5% value for complete book
  }
  if (!vehicle.accidentFree) {
    fairPrice *= 0.85; // -15% penalty for previous structural repairs
  }

  // Ensure reasonable minimum bounds
  const calculatedFairPriceEur = Math.round(Math.max(500, fairPrice));
  const fairPriceRangeMinEur = Math.round(calculatedFairPriceEur * 0.93);
  const fairPriceRangeMaxEur = Math.round(calculatedFairPriceEur * 1.07);

  const totalDepreciationPercentage = Number(
    (
      ((vehicle.originalMsrpEur - calculatedFairPriceEur) / Math.max(vehicle.originalMsrpEur, 1)) *
      100
    ).toFixed(1)
  );

  // 4. Price Anomaly Rating vs Asking Price
  const priceDeltaEur = vehicle.askingPriceEur - calculatedFairPriceEur;
  const priceDeltaPercentage = Number(
    ((priceDeltaEur / Math.max(calculatedFairPriceEur, 1)) * 100).toFixed(1)
  );

  let priceAnomaly: PriceAnomalyRating = "FAIR_MARKET_PRICE";
  if (priceDeltaPercentage < -12) {
    priceAnomaly = "OUTSTANDING_VALUE";
  } else if (priceDeltaPercentage > 15) {
    priceAnomaly = "OVERPRICED";
  } else if (priceDeltaPercentage > 6) {
    priceAnomaly = "SLIGHTLY_ELEVATED";
  } else {
    priceAnomaly = "FAIR_MARKET_PRICE";
  }

  const estimatedMonthlyDepreciationEur = Math.round((calculatedFairPriceEur * subYearRate) / 12);

  return {
    vehicleId: vehicle.id,
    calculatedFairPriceEur,
    fairPriceRangeMinEur,
    fairPriceRangeMaxEur,
    totalDepreciationPercentage: Math.max(0, totalDepreciationPercentage),
    ageYears,
    mileageDeviationFactor,
    priceAnomaly,
    priceDeltaPercentage,
    estimatedMonthlyDepreciationEur
  };
}

/**
 * Compares two vehicle listings across value, power-to-weight, and efficiency metrics
 */
export function compareVehicleListings(
  carA: VehicleListing,
  carB: VehicleListing
): {
  cheaperByEur: number;
  powerDifferenceKw: number;
  mileageDifferenceKm: number;
  recommendedPickId: string;
} {
  const valA = computeVehicleValuation(carA);
  const valB = computeVehicleValuation(carB);

  const cheaperByEur = Math.abs(carA.askingPriceEur - carB.askingPriceEur);
  const powerDifferenceKw = Math.abs(carA.powerKw - carB.powerKw);
  const mileageDifferenceKm = Math.abs(carA.odometerKm - carB.odometerKm);

  // Pick whichever has better price anomaly (lower priceDeltaPercentage)
  const recommendedPickId = valA.priceDeltaPercentage <= valB.priceDeltaPercentage ? carA.id : carB.id;

  return {
    cheaperByEur,
    powerDifferenceKw,
    mileageDifferenceKm,
    recommendedPickId
  };
}
