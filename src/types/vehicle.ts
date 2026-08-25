import { z } from "zod";

export const FuelTypeSchema = z.enum(["PETROL", "DIESEL", "HYBRID", "PLUGIN_HYBRID", "ELECTRIC", "LPG"]);
export type FuelType = z.infer<typeof FuelTypeSchema>;

export const TransmissionTypeSchema = z.enum(["MANUAL", "AUTOMATIC", "DUAL_CLUTCH"]);
export type TransmissionType = z.infer<typeof TransmissionTypeSchema>;

export const VehicleBodyStyleSchema = z.enum([
  "SEDAN",
  "STATION_WAGON",
  "HATCHBACK",
  "SUV_CROSSOVER",
  "COUPE",
  "CABRIOLET",
  "VAN"
]);
export type VehicleBodyStyle = z.infer<typeof VehicleBodyStyleSchema>;

/**
 * Full vehicle listing entity
 */
export const VehicleListingSchema = z.object({
  id: z.string().uuid(),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1950).max(2030),
  odometerKm: z.number().int().min(0).max(1000000),
  powerKw: z.number().int().positive(),
  engineDisplacementCc: z.number().int().positive().optional(),
  fuelType: FuelTypeSchema,
  transmission: TransmissionTypeSchema,
  bodyStyle: VehicleBodyStyleSchema,
  askingPriceEur: z.number().min(0),
  originalMsrpEur: z.number().min(0),
  firstRegistrationDate: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
  locationCity: z.string().default("Slovenia"),
  serviceHistoryComplete: z.boolean().default(false),
  accidentFree: z.boolean().default(true),
  images: z.array(z.string().url()).default([])
});
export type VehicleListing = z.infer<typeof VehicleListingSchema>;

/**
 * Market Price Anomaly Rating
 */
export const PriceAnomalyRatingSchema = z.enum([
  "OUTSTANDING_VALUE",
  "FAIR_MARKET_PRICE",
  "SLIGHTLY_ELEVATED",
  "OVERPRICED"
]);
export type PriceAnomalyRating = z.infer<typeof PriceAnomalyRatingSchema>;

/**
 * Algorithmic Valuation Estimation
 */
export const ValuationResultSchema = z.object({
  vehicleId: z.string(),
  calculatedFairPriceEur: z.number().min(0),
  fairPriceRangeMinEur: z.number().min(0),
  fairPriceRangeMaxEur: z.number().min(0),
  totalDepreciationPercentage: z.number().min(0).max(100),
  ageYears: z.number().min(0),
  mileageDeviationFactor: z.number(), // >1 means higher than avg mileage
  priceAnomaly: PriceAnomalyRatingSchema,
  priceDeltaPercentage: z.number(), // Diff between asking price and fair price
  estimatedMonthlyDepreciationEur: z.number().min(0)
});
export type ValuationResult = z.infer<typeof ValuationResultSchema>;

/**
 * Service Maintenance Log
 */
export const ServiceRecordSchema = z.object({
  id: z.string().uuid(),
  vehicleId: z.string(),
  serviceName: z.string().min(1),
  performedAtDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  odometerKm: z.number().int().positive(),
  costEur: z.number().min(0),
  nextDueOdometerKm: z.number().int().positive(),
  notes: z.string().optional()
});
export type ServiceRecord = z.infer<typeof ServiceRecordSchema>;
