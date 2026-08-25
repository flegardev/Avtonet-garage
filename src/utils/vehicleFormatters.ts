import { type PriceAnomalyRating } from "../types/vehicle";

/**
 * Formats EUR price with thousands separators
 */
export function formatVehiclePriceEur(priceEur: number): string {
  return new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(priceEur);
}

/**
 * Formats odometer mileage in kilometers
 */
export function formatOdometerKm(km: number): string {
  return `${new Intl.NumberFormat("sl-SI").format(km)} km`;
}

/**
 * Returns badge styling and human readable label for price anomalies
 */
export function getPriceAnomalyBadge(rating: PriceAnomalyRating): {
  label: string;
  className: string;
} {
  switch (rating) {
    case "OUTSTANDING_VALUE":
      return {
        label: "Great Deal",
        className: "bg-emerald-100 text-emerald-800 border-emerald-300"
      };
    case "FAIR_MARKET_PRICE":
      return {
        label: "Fair Price",
        className: "bg-blue-100 text-blue-800 border-blue-300"
      };
    case "SLIGHTLY_ELEVATED":
      return {
        label: "Slightly High",
        className: "bg-amber-100 text-amber-800 border-amber-300"
      };
    case "OVERPRICED":
      return {
        label: "Overpriced",
        className: "bg-rose-100 text-rose-800 border-rose-300"
      };
  }
}
