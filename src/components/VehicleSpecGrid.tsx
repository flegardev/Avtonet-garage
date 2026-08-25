import React from "react";
import { type VehicleListing } from "../types/vehicle";
import { formatOdometerKm } from "../utils/vehicleFormatters";

export interface VehicleSpecGridProps {
  vehicle: VehicleListing;
}

export const VehicleSpecGrid: React.FC<VehicleSpecGridProps> = ({ vehicle }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
        <span className="text-[11px] text-slate-400 font-medium">Mileage</span>
        <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
          {formatOdometerKm(vehicle.odometerKm)}
        </div>
      </div>

      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
        <span className="text-[11px] text-slate-400 font-medium">Power</span>
        <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
          {vehicle.powerKw} kW ({Math.round(vehicle.powerKw * 1.35962)} HP)
        </div>
      </div>

      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
        <span className="text-[11px] text-slate-400 font-medium">Fuel / Trans</span>
        <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
          {vehicle.fuelType} • {vehicle.transmission}
        </div>
      </div>

      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
        <span className="text-[11px] text-slate-400 font-medium">Condition</span>
        <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
          {vehicle.accidentFree ? "Accident Free" : "Repaired"}
        </div>
      </div>
    </div>
  );
};
