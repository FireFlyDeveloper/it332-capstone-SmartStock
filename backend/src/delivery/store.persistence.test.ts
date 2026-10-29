import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  isDbSyncActive: vi.fn(() => true),
  createDeliveryDb: vi.fn(),
  updateDeliveryDb: vi.fn(),
  deleteDeliveryDb: vi.fn(),
}));

vi.mock('../db/syncState.js', () => ({
  isDbSyncActive: dbMocks.isDbSyncActive,
}));

vi.mock('../db/postgresStore.js', () => ({
  createDeliveryDb: dbMocks.createDeliveryDb,
  updateDeliveryDb: dbMocks.updateDeliveryDb,
  deleteDeliveryDb: dbMocks.deleteDeliveryDb,
}));

import {
  _resetDeliveryStore,
  createDelivery,
  deleteDelivery,
  findDeliveryById,
  listDeliveries,
  updateDelivery,
  type Delivery,
} from './store.js';

const input = {
  orderId: 'ORD-DB-1',
  driver: 'Test Driver',
  truckNumber: 'Truck-Test',
  destination: 'Test destination',
};

const persisted: Delivery = {
  id: 'DEL-DB-1',
  orderId: input.orderId,
  driver: input.driver,
  truckNumber: input.truckNumber,
  destination: input.destination,
  status: 'pending',
  currentStep: 0,
  currentLocation: { x: 0, y: 0 },
  trafficLevel: 'low',
  predictedDelay: false,
  routeEfficiencyScore: 0,
};

describe('delivery store PostgreSQL write-through', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetDeliveryStore(false);
    dbMocks.isDbSyncActive.mockReturnValue(true);
    dbMocks.createDeliveryDb.mockResolvedValue(persisted);
    dbMocks.updateDeliveryDb.mockResolvedValue(persisted);
    dbMocks.deleteDeliveryDb.mockResolvedValue(true);
  });

  it('does not cache a new delivery when PostgreSQL create fails', async () => {
    dbMocks.createDeliveryDb.mockRejectedValueOnce(new Error('database unavailable'));

    await expect(createDelivery(input)).rejects.toThrow('database unavailable');
    expect(listDeliveries()).toEqual([]);
  });

  it('returns and caches the record returned by PostgreSQL', async () => {
    const saved = { ...persisted, driver: 'Persisted Driver' };
    dbMocks.createDeliveryDb.mockResolvedValueOnce(saved);

    await expect(createDelivery(input)).resolves.toEqual(saved);
    expect(listDeliveries()).toEqual([saved]);
  });

  it('does not change cached status when PostgreSQL update fails', async () => {
    await createDelivery(input);
    dbMocks.updateDeliveryDb.mockRejectedValueOnce(new Error('database unavailable'));

    await expect(updateDelivery(persisted.id, { status: 'assigned', currentStep: 1 }))
      .rejects.toThrow('database unavailable');
    expect(findDeliveryById(persisted.id)?.status).toBe('pending');
  });

  it('updates cache from the persisted PostgreSQL response', async () => {
    await createDelivery(input);
    const saved = { ...persisted, status: 'assigned' as const, currentStep: 1 };
    dbMocks.updateDeliveryDb.mockResolvedValueOnce(saved);

    await expect(updateDelivery(persisted.id, { status: 'assigned', currentStep: 1 }))
      .resolves.toEqual(saved);
    expect(findDeliveryById(persisted.id)).toEqual(saved);
  });

  it('retains cached delivery when PostgreSQL delete fails', async () => {
    await createDelivery(input);
    dbMocks.deleteDeliveryDb.mockRejectedValueOnce(new Error('database unavailable'));

    await expect(deleteDelivery(persisted.id)).rejects.toThrow('database unavailable');
    expect(findDeliveryById(persisted.id)).toEqual(persisted);
  });

  it('does not remove cached delivery if PostgreSQL reports no deleted row', async () => {
    await createDelivery(input);
    dbMocks.deleteDeliveryDb.mockResolvedValueOnce(false);

    await expect(deleteDelivery(persisted.id)).resolves.toBe(false);
    expect(findDeliveryById(persisted.id)).toEqual(persisted);
  });
});
