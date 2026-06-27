// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncRecord, pingWebhook, isWebhookConfigured, prepareRecordForSync, normalizeCaptureDate, getSyncConfig, saveWebhookUrl, readStoredWebhookUrl, saveWebhookToken, readStoredWebhookToken } from '../../src/js/sync.js';

const TEST_CONFIG = {
  webhookUrl: 'https://script.google.com/macros/s/abc123/exec',
  authToken: '',
  sheetId: 'sheet123',
  folderId: 'folder456',
  sheetName: 'Catches'
};

describe('getSyncConfig', () => {
  beforeEach(() => {
    localStorage.clear();
    window.SCDNR_CONFIG = {
      WEBHOOK_URL: TEST_CONFIG.webhookUrl,
      SHEET_ID: TEST_CONFIG.sheetId,
      FOLDER_ID: TEST_CONFIG.folderId,
      SHEET_NAME: TEST_CONFIG.sheetName
    };
  });

  it('reads google ids from config', () => {
    expect(getSyncConfig()).toEqual(TEST_CONFIG);
  });

  it('prefers ids saved on the Sync tab', () => {
    localStorage.setItem('scdnr-google-ids', JSON.stringify({
      sheetId: 'stored-sheet',
      folderId: 'stored-folder',
      sheetName: 'Log'
    }));
    expect(getSyncConfig()).toEqual({
      ...TEST_CONFIG,
      sheetId: 'stored-sheet',
      folderId: 'stored-folder',
      sheetName: 'Log'
    });
  });

  it('prefers a webhook URL saved on the Sync tab over config.js', () => {
    saveWebhookUrl('https://script.google.com/macros/s/stored-hook/exec');
    expect(readStoredWebhookUrl()).toBe('https://script.google.com/macros/s/stored-hook/exec');
    expect(getSyncConfig().webhookUrl).toBe('https://script.google.com/macros/s/stored-hook/exec');
  });

  it('prefers a webhook token saved on the Sync tab over config.js', () => {
    saveWebhookToken('s3cr3t-token');
    expect(getSyncConfig().authToken).toBe('s3cr3t-token');
  });
});

describe('saveWebhookUrl', () => {
  beforeEach(() => localStorage.clear());

  it('persists and clears the webhook URL', () => {
    saveWebhookUrl('  https://script.google.com/macros/s/abc/exec  ');
    expect(readStoredWebhookUrl()).toBe('https://script.google.com/macros/s/abc/exec');
    saveWebhookUrl('');
    expect(readStoredWebhookUrl()).toBe('');
  });
});

describe('saveWebhookToken', () => {
  beforeEach(() => localStorage.clear());

  it('persists and clears the webhook token', () => {
    saveWebhookToken('  abc-token  ');
    expect(readStoredWebhookToken()).toBe('abc-token');
    saveWebhookToken('');
    expect(readStoredWebhookToken()).toBe('');
  });
});

describe('isWebhookConfigured', () => {
  it('rejects placeholder URLs', () => {
    expect(isWebhookConfigured('https://script.google.com/macros/s/YOUR_ID/exec')).toBe(false);
  });

  it('accepts real-looking URLs', () => {
    expect(isWebhookConfigured('https://script.google.com/macros/s/abc123/exec')).toBe(true);
  });
});

describe('prepareRecordForSync', () => {
  beforeEach(() => {
    localStorage.clear();
    window.SCDNR_CONFIG = {
      WEBHOOK_URL: TEST_CONFIG.webhookUrl,
      SHEET_ID: TEST_CONFIG.sheetId,
      FOLDER_ID: TEST_CONFIG.folderId,
      SHEET_NAME: TEST_CONFIG.sheetName
    };
  });

  it('strips client-only fields', () => {
    const out = prepareRecordForSync({
      id: '1',
      tagType: 'CR',
      syncStatus: 'pending',
      createdAt: '2026-01-01',
      photoBase64: 'data:image/jpeg;base64,abc'
    });
    expect(out.syncStatus).toBeUndefined();
    expect(out.createdAt).toBeUndefined();
    expect(out.id).toBe('1');
    expect(out.photoBase64).toBe('data:image/jpeg;base64,abc');
    expect(out.sheetId).toBe('sheet123');
    expect(out.folderId).toBe('folder456');
  });

  it('includes the configured webhook token in the payload', () => {
    saveWebhookToken('shared-secret');
    const out = prepareRecordForSync({ id: '1', tagType: 'CR', photoBase64: '' });
    expect(out.authToken).toBe('shared-secret');
  });

  it('normalizes capture date to YYYY-MM-DD', () => {
    expect(normalizeCaptureDate('2026-06-27T07:32:45.167Z')).toBe('2026-06-27');
    expect(normalizeCaptureDate('2026-06-27')).toBe('2026-06-27');
    const out = prepareRecordForSync({
      id: '1',
      tagType: 'CR',
      capturedAt: '2026-06-27T07:32:45.167Z',
      photoBase64: ''
    });
    expect(out.capturedAt).toBe('2026-06-27');
  });
});

describe('syncRecord', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    document.body.innerHTML = '';
    window.SCDNR_CONFIG = {
      WEBHOOK_URL: TEST_CONFIG.webhookUrl,
      SHEET_ID: TEST_CONFIG.sheetId,
      FOLDER_ID: TEST_CONFIG.folderId,
      SHEET_NAME: TEST_CONFIG.sheetName
    };
  });

  it('POSTs metadata with sheet ids via fetch when available', async () => {
    let capturedPayload = '';
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    }).mockImplementation((_url, opts) => {
      capturedPayload = opts?.body || '';
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true })
      });
    });

    await syncRecord('https://example.com/webhook', {
      id: 'test',
      tagType: 'CR',
      tagNumber: '12345',
      capturedAt: '2026-06-27',
      species: 'Red Drum',
      lengthInches: 24,
      measurementType: 'Tail',
      measurementAccuracy: 'Measured',
      locationName: 'Test',
      latitude: 32.7,
      longitude: -79.8,
      condition: 'Good',
      photoBase64: ''
    });

    expect(capturedPayload).toContain('"id":"test"');
    expect(capturedPayload).toContain('"sheetId":"sheet123"');
    expect(capturedPayload).toContain('"photoBase64":""');
  });
});

describe('pingWebhook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns not configured for placeholder', async () => {
    const r = await pingWebhook('');
    expect(r.ok).toBe(false);
  });

  it('detects outdated webhook without scriptVersion', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok', service: 'SCDNR Tag Logging Webhook' })
    });
    const r = await pingWebhook('https://script.google.com/macros/s/abc123/exec');
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/outdated/i);
  });

  it('detects missing sheet id in config', async () => {
    localStorage.clear();
    window.SCDNR_CONFIG = { WEBHOOK_URL: 'https://script.google.com/macros/s/abc123/exec' };
    const r = await pingWebhook('');
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/Sheet ID/i);
  });

  it('accepts webhook with formatted sample date', async () => {
    window.SCDNR_CONFIG = {
      WEBHOOK_URL: 'https://script.google.com/macros/s/abc123/exec',
      SHEET_ID: 'sheet123',
      FOLDER_ID: 'folder456'
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        scriptVersion: '2026-06-27g',
        sampleSyncDate: '06/27/2026'
      })
    });
    const r = await pingWebhook('https://script.google.com/macros/s/abc123/exec');
    expect(r.ok).toBe(true);
    expect(r.message).toMatch(/06\/27\/2026|MM\/DD\/YYYY/i);
  });
});
