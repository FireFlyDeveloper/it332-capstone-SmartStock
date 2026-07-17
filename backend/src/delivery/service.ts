/**
 * Delivery service — validation and business logic.
 *
 * Author: Luraine Villaranda
 * Last touched: 2026-07-08
 */

import { sendNotificationEvent } from '../notifications/webhook.js';
import {
  createDelivery,
  deleteDelivery,
  findDeliveryById,
  listDeliveries,
  updateDelivery,
  type Delivery,
  type DeliveryCreateInput,
  type DeliveryLocation,
  type DeliveryStatusFlow,
  type DeliveryUpdateInput,
  type TrafficLevel,
} from './store.js';

type ServiceResult<T> = { ok: true; data: T } | { ok: false; status: 400 | 404 | 409; error: string };

interface DeliveryFilters {
  q?: string;
  status?: DeliveryStatusFlow;
  trafficLevel?: TrafficLevel;
}

const DELIVERY_FLOW: DeliveryStatusFlow[] = ['pending', 'assigned', 'picked_up', 'in_transit', 'arrived', 'delivered'];
const STEP_BY_STATUS: Record<DeliveryStatusFlow, number> = {
  pending: 0,
  assigned: 1,
  picked_up: 2,
  in_transit: 3,
  arrived: 4,
  delivered: 5,
  failed: -1,
};

function readString(value: unknown, field: string, required = true): ServiceResult<string | undefined> {
  if (value === undefined || value === null) {
    return required ? { ok: false, status: 400, error: `${field} is required` } : { ok: true, data: undefined };
  }
  if (typeof value !== 'string' || value.trim().length === 0) {
    return { ok: false, status: 400, error: `${field} must be a non-empty string` };
  }
  return { ok: true, data: value.trim() };
}

function readNumber(value: unknown, field: string, required = true): ServiceResult<number | undefined> {
  if (value === undefined || value === null) {
    return required ? { ok: false, status: 400, error: `${field} is required` } : { ok: true, data: undefined };
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return { ok: false, status: 400, error: `${field} must be a finite number` };
  }
  return { ok: true, data: value };
}

function readBoolean(value: unknown, field: string, required = true): ServiceResult<boolean | undefined> {
  if (value === undefined || value === null) {
    return required ? { ok: false, status: 400, error: `${field} is required` } : { ok: true, data: undefined };
  }
  if (typeof value !== 'boolean') return { ok: false, status: 400, error: `${field} must be a boolean` };
  return { ok: true, data: value };
}

export function parseDeliveryStatus(value: unknown, required = true): ServiceResult<DeliveryStatusFlow | undefined> {
  const parsed = readString(value, 'status', required);
  if (!parsed.ok || parsed.data === undefined) return parsed as ServiceResult<DeliveryStatusFlow | undefined>;
  if (!['pending', 'assigned', 'picked_up', 'in_transit', 'arrived', 'delivered', 'failed'].includes(parsed.data)) {
    return { ok: false, status: 400, error: 'status must be a valid delivery status' };
  }
  return { ok: true, data: parsed.data as DeliveryStatusFlow };
}

export function parseTrafficLevel(value: unknown, required = true): ServiceResult<TrafficLevel | undefined> {
  const parsed = readString(value, 'trafficLevel', required);
  if (!parsed.ok || parsed.data === undefined) return parsed as ServiceResult<TrafficLevel | undefined>;
  if (parsed.data !== 'low' && parsed.data !== 'medium' && parsed.data !== 'high') {
    return { ok: false, status: 400, error: 'trafficLevel must be low, medium, or high' };
  }
  return { ok: true, data: parsed.data };
}

function readLocation(value: unknown, required = true): ServiceResult<DeliveryLocation | undefined> {
  if (value === undefined || value === null) {
    return required ? { ok: false, status: 400, error: 'currentLocation is required' } : { ok: true, data: undefined };
  }
  if (typeof value !== 'object') return { ok: false, status: 400, error: 'currentLocation must be an object' };
  const input = value as Record<string, unknown>;
  const x = readNumber(input.x, 'currentLocation.x');
  if (!x.ok) return x as ServiceResult<DeliveryLocation | undefined>;
  const y = readNumber(input.y, 'currentLocation.y');
  if (!y.ok) return y as ServiceResult<DeliveryLocation | undefined>;
  if (x.data === undefined || y.data === undefined) return { ok: false, status: 400, error: 'currentLocation requires x and y' };
  if (x.data < 0 || x.data > 100 || y.data < 0 || y.data > 100) {
    return { ok: false, status: 400, error: 'currentLocation values must be between 0 and 100' };
  }
  return { ok: true, data: { x: x.data, y: y.data } };
}

function readStep(value: unknown, required = true): ServiceResult<number | undefined> {
  const parsed = readNumber(value, 'currentStep', required);
  if (!parsed.ok || parsed.data === undefined) return parsed;
  if (!Number.isInteger(parsed.data) || parsed.data < -1 || parsed.data > 5) {
    return { ok: false, status: 400, error: 'currentStep must be an integer from -1 to 5' };
  }
  return parsed;
}

function readEfficiency(value: unknown, required = true): ServiceResult<number | undefined> {
  const parsed = readNumber(value, 'routeEfficiencyScore', required);
  if (!parsed.ok || parsed.data === undefined) return parsed;
  if (parsed.data < 0 || parsed.data > 100) {
    return { ok: false, status: 400, error: 'routeEfficiencyScore must be between 0 and 100' };
  }
  return parsed;
}

function expectedStep(status: DeliveryStatusFlow): number {
  return STEP_BY_STATUS[status];
}

function normalizeStatusStep(status: DeliveryStatusFlow | undefined, step: number | undefined): ServiceResult<number | undefined> {
  if (status === undefined && step === undefined) return { ok: true, data: undefined };
  const nextStatus = status ?? DELIVERY_FLOW[step ?? 0] ?? 'pending';
  const expected = expectedStep(nextStatus);
  if (step !== undefined && step !== expected) {
    return { ok: false, status: 400, error: `currentStep must be ${expected} for ${nextStatus}` };
  }
  return { ok: true, data: expected };
}

function parseCreate(body: unknown): ServiceResult<DeliveryCreateInput> {
  if (typeof body !== 'object' || body === null) return { ok: false, status: 400, error: 'invalid body' };
  const input = body as Record<string, unknown>;

  const orderId = readString(input.orderId, 'orderId');
  if (!orderId.ok) return orderId;
  const driver = readString(input.driver, 'driver');
  if (!driver.ok) return driver;
  const truckNumber = readString(input.truckNumber, 'truckNumber');
  if (!truckNumber.ok) return truckNumber;
  const destination = readString(input.destination, 'destination');
  if (!destination.ok) return destination;
  const status = parseDeliveryStatus(input.status, false);
  if (!status.ok) return status;
  const step = readStep(input.currentStep, false);
  if (!step.ok) return step;
  const normalizedStep = normalizeStatusStep(status.data, step.data);
  if (!normalizedStep.ok) return normalizedStep;
  const currentLocation = readLocation(input.currentLocation, false);
  if (!currentLocation.ok) return currentLocation;
  const trafficLevel = parseTrafficLevel(input.trafficLevel, false);
  if (!trafficLevel.ok) return trafficLevel;
  const predictedDelay = readBoolean(input.predictedDelay, 'predictedDelay', false);
  if (!predictedDelay.ok) return predictedDelay;
  const routeEfficiencyScore = readEfficiency(input.routeEfficiencyScore, false);
  if (!routeEfficiencyScore.ok) return routeEfficiencyScore;
  const location = readString(input.location, 'location', false);
  if (!location.ok) return location;
  const notes = readString(input.notes, 'notes', false);
  if (!notes.ok) return notes;

  if (orderId.data === undefined || driver.data === undefined || truckNumber.data === undefined || destination.data === undefined) {
    return { ok: false, status: 400, error: 'missing required delivery fields' };
  }

  return {
    ok: true,
    data: {
      orderId: orderId.data,
      driver: driver.data,
      truckNumber: truckNumber.data,
      destination: destination.data,
      status: status.data,
      currentStep: normalizedStep.data,
      currentLocation: currentLocation.data,
      trafficLevel: trafficLevel.data,
      predictedDelay: predictedDelay.data,
      routeEfficiencyScore: routeEfficiencyScore.data,
      location: location.data,
      notes: notes.data,
    },
  };
}

function parseUpdate(body: unknown): ServiceResult<DeliveryUpdateInput> {
  if (typeof body !== 'object' || body === null) return { ok: false, status: 400, error: 'invalid body' };
  const input = body as Record<string, unknown>;
  const data: DeliveryUpdateInput = {};

  for (const field of ['orderId', 'driver', 'truckNumber', 'destination', 'location', 'notes'] as const) {
    if (field in input) {
      const parsed = readString(input[field], field, false);
      if (!parsed.ok) return parsed;
      data[field] = parsed.data;
    }
  }

  if ('status' in input) {
    const parsed = parseDeliveryStatus(input.status, false);
    if (!parsed.ok) return parsed;
    data.status = parsed.data;
  }
  if ('currentStep' in input) {
    const parsed = readStep(input.currentStep, false);
    if (!parsed.ok) return parsed;
    data.currentStep = parsed.data;
  }
  const normalizedStep = normalizeStatusStep(data.status, data.currentStep);
  if (!normalizedStep.ok) return normalizedStep;
  if (data.status !== undefined) data.currentStep = normalizedStep.data;

  if ('currentLocation' in input) {
    const parsed = readLocation(input.currentLocation, false);
    if (!parsed.ok) return parsed;
    data.currentLocation = parsed.data;
  }
  if ('trafficLevel' in input) {
    const parsed = parseTrafficLevel(input.trafficLevel, false);
    if (!parsed.ok) return parsed;
    data.trafficLevel = parsed.data;
  }
  if ('predictedDelay' in input) {
    const parsed = readBoolean(input.predictedDelay, 'predictedDelay', false);
    if (!parsed.ok) return parsed;
    data.predictedDelay = parsed.data;
  }
  if ('routeEfficiencyScore' in input) {
    const parsed = readEfficiency(input.routeEfficiencyScore, false);
    if (!parsed.ok) return parsed;
    data.routeEfficiencyScore = parsed.data;
  }

  if (Object.keys(data).length === 0) return { ok: false, status: 400, error: 'no fields to update' };
  return { ok: true, data };
}

function assertLegalTransition(current: Delivery, next: DeliveryUpdateInput): ServiceResult<DeliveryUpdateInput> {
  if (!next.status) return { ok: true, data: next };
  if (current.status === 'failed' || current.status === 'delivered') {
    return { ok: false, status: 409, error: `delivery is already ${current.status}` };
  }
  if (next.status === 'failed') return { ok: true, data: { ...next, currentStep: -1 } };

  const currentIndex = DELIVERY_FLOW.indexOf(current.status);
  const nextIndex = DELIVERY_FLOW.indexOf(next.status);
  if (nextIndex === -1 || currentIndex === -1 || nextIndex !== currentIndex + 1) {
    return { ok: false, status: 409, error: `invalid transition from ${current.status} to ${next.status}` };
  }
  return { ok: true, data: { ...next, currentStep: expectedStep(next.status) } };
}

export function listDeliveryRecords(filters: DeliveryFilters = {}): Delivery[] {
  const q = filters.q?.trim().toLowerCase();
  return listDeliveries().filter((delivery) => {
    if (filters.status && delivery.status !== filters.status) return false;
    if (filters.trafficLevel && delivery.trafficLevel !== filters.trafficLevel) return false;
    if (!q) return true;
    return [delivery.id, delivery.orderId, delivery.driver, delivery.truckNumber, delivery.destination, delivery.location, delivery.notes]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(q));
  });
}

export function getDeliveryRecord(id: string): ServiceResult<Delivery> {
  const item = findDeliveryById(id);
  return item ? { ok: true, data: item } : { ok: false, status: 404, error: 'delivery not found' };
}

export function addDeliveryRecord(body: unknown): ServiceResult<Delivery> {
  const parsed = parseCreate(body);
  if (!parsed.ok) return parsed;
  return { ok: true, data: createDelivery(parsed.data) };
}

export function editDeliveryRecord(id: string, body: unknown): ServiceResult<Delivery> {
  const current = findDeliveryById(id);
  if (!current) return { ok: false, status: 404, error: 'delivery not found' };
  const parsed = parseUpdate(body);
  if (!parsed.ok) return parsed;
  const checked = assertLegalTransition(current, parsed.data);
  if (!checked.ok) return checked;
  const item = updateDelivery(id, checked.data);
  if (item && checked.data.status !== undefined && current.status !== item.status) {
    void sendNotificationEvent({
      type: 'delivery.status_changed',
      occurredAt: new Date().toISOString(),
      data: {
        deliveryId: item.id,
        orderId: item.orderId,
        previousStatus: current.status,
        status: item.status,
      },
    }).catch((error) => {
      const message = error instanceof Error ? error.message : 'unknown notification error';
      console.warn(`[notifications] delivery status event failed: ${message}`);
    });
  }
  return item ? { ok: true, data: item } : { ok: false, status: 404, error: 'delivery not found' };
}

export function removeDeliveryRecord(id: string): ServiceResult<{ ok: true }> {
  return deleteDelivery(id)
    ? { ok: true, data: { ok: true } }
    : { ok: false, status: 404, error: 'delivery not found' };
}
