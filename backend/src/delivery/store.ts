/**
 * Delivery in-memory store — frontend-shaped delivery records.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-08
 */

import { randomUUID } from 'node:crypto';

export interface DeliveryLocation {
  x: number;
  y: number;
}

export type DeliveryStatusFlow =
  | 'pending'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'arrived'
  | 'delivered'
  | 'failed';

export type TrafficLevel = 'low' | 'medium' | 'high';

export interface Delivery {
  id: string;
  orderId: string;
  driver: string;
  truckNumber: string;
  destination: string;
  status: DeliveryStatusFlow;
  location?: string;
  currentStep: number;
  currentLocation: DeliveryLocation;
  trafficLevel: TrafficLevel;
  predictedDelay: boolean;
  routeEfficiencyScore: number;
  notes?: string;
}

export interface DeliveryCreateInput {
  orderId: string;
  driver: string;
  truckNumber: string;
  destination: string;
  status?: DeliveryStatusFlow;
  location?: string;
  currentStep?: number;
  currentLocation?: DeliveryLocation;
  trafficLevel?: TrafficLevel;
  predictedDelay?: boolean;
  routeEfficiencyScore?: number;
  notes?: string;
}

export type DeliveryUpdateInput = Partial<DeliveryCreateInput>;

const deliveries = new Map<string, Delivery>();

function makeId(): string {
  return `DEL-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function toRecord(input: DeliveryCreateInput): Delivery {
  return {
    id: makeId(),
    orderId: input.orderId.trim(),
    driver: input.driver.trim(),
    truckNumber: input.truckNumber.trim(),
    destination: input.destination.trim(),
    status: input.status ?? 'pending',
    location: input.location?.trim() || undefined,
    currentStep: input.currentStep ?? 0,
    currentLocation: input.currentLocation ?? { x: 0, y: 0 },
    trafficLevel: input.trafficLevel ?? 'low',
    predictedDelay: input.predictedDelay ?? false,
    routeEfficiencyScore: input.routeEfficiencyScore ?? 0,
    notes: input.notes?.trim() || undefined,
  };
}

export function listDeliveries(): Delivery[] {
  return [...deliveries.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function findDeliveryById(id: string): Delivery | null {
  return deliveries.get(id) ?? null;
}

export function createDelivery(input: DeliveryCreateInput): Delivery {
  const record = toRecord(input);
  deliveries.set(record.id, record);
  return record;
}

export function updateDelivery(id: string, input: DeliveryUpdateInput): Delivery | null {
  const current = deliveries.get(id);
  if (!current) return null;

  const next: Delivery = {
    ...current,
    orderId: input.orderId === undefined ? current.orderId : input.orderId.trim(),
    driver: input.driver === undefined ? current.driver : input.driver.trim(),
    truckNumber: input.truckNumber === undefined ? current.truckNumber : input.truckNumber.trim(),
    destination: input.destination === undefined ? current.destination : input.destination.trim(),
    status: input.status ?? current.status,
    location: input.location === undefined ? current.location : input.location.trim() || undefined,
    currentStep: input.currentStep ?? current.currentStep,
    currentLocation: input.currentLocation ?? current.currentLocation,
    trafficLevel: input.trafficLevel ?? current.trafficLevel,
    predictedDelay: input.predictedDelay ?? current.predictedDelay,
    routeEfficiencyScore: input.routeEfficiencyScore ?? current.routeEfficiencyScore,
    notes: input.notes === undefined ? current.notes : input.notes.trim() || undefined,
  };

  deliveries.set(id, next);
  return next;
}

export function deleteDelivery(id: string): boolean {
  return deliveries.delete(id);
}

export function _resetDeliveryStore(seed = true): void {
  deliveries.clear();
  if (!seed) return;

  const seedDeliveries: DeliveryCreateInput[] = [
    {
      orderId: 'ORD-001',
      driver: 'Carlos Mendoza',
      truckNumber: 'Truck-101',
      destination: '123 Main St, Manila',
      status: 'in_transit',
      location: 'EDSA, Quezon City',
      currentStep: 3,
      currentLocation: { x: 65, y: 40 },
      trafficLevel: 'medium',
      predictedDelay: false,
      routeEfficiencyScore: 85,
    },
    {
      orderId: 'ORD-002',
      driver: 'Roberto Santos',
      truckNumber: 'Truck-103',
      destination: '456 Commercial Ave, Quezon City',
      status: 'delivered',
      location: 'Delivered',
      currentStep: 5,
      currentLocation: { x: 100, y: 100 },
      trafficLevel: 'low',
      predictedDelay: false,
      routeEfficiencyScore: 95,
    },
    {
      orderId: 'ORD-003',
      driver: 'Pending',
      truckNumber: 'TBD',
      destination: '789 Industrial Blvd, Caloocan',
      status: 'pending',
      currentStep: 0,
      currentLocation: { x: 0, y: 0 },
      trafficLevel: 'low',
      predictedDelay: false,
      routeEfficiencyScore: 0,
    },
    {
      orderId: 'ORD-004',
      driver: 'Juan Dela Cruz',
      truckNumber: 'Truck-105',
      destination: '321 Residential Area, Pasay',
      status: 'assigned',
      currentStep: 1,
      currentLocation: { x: 20, y: 25 },
      trafficLevel: 'high',
      predictedDelay: true,
      routeEfficiencyScore: 65,
    },
    {
      orderId: 'ORD-010',
      driver: 'Danny Garcia',
      truckNumber: 'Truck-109',
      destination: '500 Main Highway, San Juan',
      status: 'arrived',
      location: 'San Juan City Hall',
      currentStep: 4,
      currentLocation: { x: 90, y: 80 },
      trafficLevel: 'high',
      predictedDelay: true,
      routeEfficiencyScore: 78,
    },
  ];

  for (const item of seedDeliveries) createDelivery(item);
}

_resetDeliveryStore();
