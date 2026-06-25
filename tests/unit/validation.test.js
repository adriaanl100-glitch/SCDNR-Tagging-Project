import { describe, it, expect } from 'vitest';
import { validateTagNumber, validateLength, validateCatchRecord } from '../../src/js/validation.js';

describe('validateTagNumber', () => {
  it('requires 5 digits for CR', () => {
    expect(validateTagNumber('CR', '12345')).toBeNull();
    expect(validateTagNumber('CR', '1234')).toMatch(/5 digits/);
  });

  it('requires 6 digits for K', () => {
    expect(validateTagNumber('K', '123456')).toBeNull();
    expect(validateTagNumber('K', '12345')).toMatch(/6 digits/);
  });
});

describe('validateLength', () => {
  it('enforces minimum length by tag type', () => {
    expect(validateLength('CR', 10)).toBeNull();
    expect(validateLength('CR', 9)).toMatch(/minimum 10/);
    expect(validateLength('K', 18)).toBeNull();
    expect(validateLength('K', 17)).toMatch(/minimum 18/);
  });
});

describe('validateCatchRecord', () => {
  const valid = {
    tagType: 'CR',
    tagNumber: '12345',
    species: 'Red Drum',
    lengthInches: 24,
    measurementType: 'Tail',
    measurementAccuracy: 'Measured',
    locationName: 'Wando River',
    latitude: 32.7,
    longitude: -79.8,
    condition: 'Good',
    photoBase64: 'data:image/jpeg;base64,abc'
  };

  it('passes valid record', () => {
    const { valid: ok, errors } = validateCatchRecord(valid);
    expect(ok).toBe(true);
    expect(errors).toEqual({});
  });

  it('blocks K tag for flounder', () => {
    const { valid: ok, errors } = validateCatchRecord({
      ...valid,
      tagType: 'K',
      tagNumber: '123456',
      species: 'Southern Flounder',
      lengthInches: 18
    });
    expect(ok).toBe(false);
    expect(errors.tagType).toMatch(/not allowed/);
  });

  it('blocks CR tag for pelagic species', () => {
    const { valid: ok, errors } = validateCatchRecord({
      ...valid,
      species: 'King Mackerel',
      tagType: 'CR'
    });
    expect(ok).toBe(false);
    expect(errors.tagType).toMatch(/not allowed/);
  });
});
