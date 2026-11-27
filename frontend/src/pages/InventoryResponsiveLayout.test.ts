import { describe, expect, it } from 'vitest';
import inventory from './Inventory.tsx?raw';

describe('inventory responsive toolbar layout', () => {
  it('stacks filter and action groups until the content can fit them side by side', () => {
    expect(inventory).toMatch(/<div className="flex flex-col xl:flex-row gap-4 justify-between">\s*\n\s*<div className="flex flex-col sm:flex-row gap-3">/);
  });
});
