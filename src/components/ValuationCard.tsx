import React from "react";
import { type VehicleListing } from "../types/vehicle";
import { computeVehicleValuation } from "../services/valuationEngine";
import { formatVehiclePriceEur, getPriceAnomalyBadge } from "../utils/vehicleFormatters";

export interface ValuationCardProps {
  vehicle: VehicleListing;
}

export const ValuationCard: React.FC<ValuationCardProps> = ({ vehicle }) => {
  const valuation = computeVehicleValuation(vehicle);
  const badge = getPriceAnomalyBadge(valuation.priceAnomaly);

  return (
    <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono uppercase text-slate-400">Algorithmic Valuation</span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${badge.className}`}>
          {badge.label}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
          <div className="text-xs text-slate-500 font-medium">Asking Price</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatVehiclePriceEur(vehicle.askingPriceEur)}
          </div>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/30">
          <div className="text-xs text-blue-700 dark:text-blue-300 font-medium">Fair Market Estimate</div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {formatVehiclePriceEur(valuation.calculatedFairPriceEur)}
          </div>
          <div className="text-[11px] text-blue-600/70 mt-0.5">
            Range: {formatVehiclePriceEur(valuation.fairPriceRangeMinEur)} - {formatVehiclePriceEur(valuation.fairPriceRangeMaxEur)}
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex justify-between text-slate-600 dark:text-slate-400">
          <span>Total Depreciation:</span>
          <strong className="text-slate-900 dark:text-white">{valuation.totalDepreciationPercentage}%</strong>
        </div>
        <div className="flex justify-between text-slate-600 dark:text-slate-400">
          <span>Estimated Monthly Depreciation:</span>
          <strong className="text-slate-900 dark:text-white">{formatVehiclePriceEur(valuation.estimatedMonthlyDepreciationEur)}/mo</strong>
        </div>
        <div className="flex justify-between text-slate-600 dark:text-slate-400">
          <span>Price Delta vs Market:</span>
          <strong className={valuation.priceDeltaPercentage <= 0 ? "text-emerald-600" : "text-rose-600"}>
            {valuation.priceDeltaPercentage > 0 ? `+${valuation.priceDeltaPercentage}%` : `${valuation.priceDeltaPercentage}%`}
          </strong>
        </div>
      </div>
    </div>
  );
};
