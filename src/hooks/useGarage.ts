import { useState, useCallback, useMemo } from "react";
import { type VehicleListing, type ServiceRecord } from "../types/vehicle";
import { computeVehicleValuation } from "../services/valuationEngine";

export function useGarage(initialVehicles: VehicleListing[] = []) {
  const [vehicles, setVehicles] = useState<VehicleListing[]>(initialVehicles);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);

  const addVehicle = useCallback((vehicle: VehicleListing) => {
    setVehicles((prev) => [...prev, vehicle]);
  }, []);

  const removeVehicle = useCallback((vehicleId: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    setServiceRecords((prev) => prev.filter((s) => s.vehicleId !== vehicleId));
  }, []);

  const addServiceRecord = useCallback((record: ServiceRecord) => {
    setServiceRecords((prev) => [...prev, record]);
  }, []);

  const valuations = useMemo(() => {
    const map = new Map<string, ReturnType<typeof computeVehicleValuation>>();
    for (const v of vehicles) {
      map.set(v.id, computeVehicleValuation(v));
    }
    return map;
  }, [vehicles]);

  return {
    vehicles,
    serviceRecords,
    valuations,
    addVehicle,
    removeVehicle,
    addServiceRecord
  };
}
