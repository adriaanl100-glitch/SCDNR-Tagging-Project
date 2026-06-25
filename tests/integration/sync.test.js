import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncRecord } from '../../src/js/sync.js';

describe('syncRecord', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns data on HTTP 200 with success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, rowId: 1, imageUrl: 'https://drive.google.com/x' })
    });

    const result = await syncRecord('https://example.com/webhook', { id: 'test' });
    expect(result.success).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/webhook',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('throws on HTTP error', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    await expect(syncRecord('https://example.com/webhook', { id: 'test' }))
      .rejects.toThrow(/HTTP 500/);
  });
});
