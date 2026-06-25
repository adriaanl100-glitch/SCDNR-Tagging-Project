import { getAllowedTagTypes, getSpecies } from './species.js';

const TAG_RULES = {
  CR: { digits: 5, minLength: 10 },
  K: { digits: 6, minLength: 18 }
};

export function validateTagNumber(tagType, tagNumber) {
  const rules = TAG_RULES[tagType];
  if (!rules) return 'Invalid tag type';
  const digits = String(tagNumber).replace(/\D/g, '');
  if (digits.length !== rules.digits) {
    return `${tagType} tags require exactly ${rules.digits} digits`;
  }
  return null;
}

export function validateLength(tagType, lengthInches) {
  const rules = TAG_RULES[tagType];
  if (!rules) return 'Invalid tag type';
  const len = Number(lengthInches);
  if (Number.isNaN(len) || len <= 0) return 'Length is required';
  if (len < rules.minLength) {
    return `${tagType} tags require minimum ${rules.minLength}" length`;
  }
  return null;
}

export function validateCatchRecord(record) {
  const errors = {};

  if (!record.tagType || !['CR', 'K'].includes(record.tagType)) {
    errors.tagType = 'Select CR or K tag type';
  }

  const tagErr = validateTagNumber(record.tagType, record.tagNumber);
  if (tagErr) errors.tagNumber = tagErr;

  if (!record.species) {
    errors.species = 'Species is required';
  } else {
    const allowed = getAllowedTagTypes(record.species);
    if (record.tagType === 'CR' && !allowed.CR) {
      errors.tagType = `CR tags not allowed for ${record.species}`;
    }
    if (record.tagType === 'K' && !allowed.K) {
      errors.tagType = `K tags not allowed for ${record.species}`;
    }
  }

  const lenErr = validateLength(record.tagType, record.lengthInches);
  if (lenErr) errors.lengthInches = lenErr;

  if (!record.measurementType) errors.measurementType = 'Select measurement type';
  if (!record.measurementAccuracy) errors.measurementAccuracy = 'Select accuracy';
  if (!record.locationName?.trim()) errors.locationName = 'Location name is required';

  if (record.latitude == null || record.longitude == null) {
    errors.coordinates = 'GPS or map location required';
  } else {
    const lat = Number(record.latitude);
    const lon = Number(record.longitude);
    if (Number.isNaN(lat) || lat < -90 || lat > 90) errors.latitude = 'Invalid latitude';
    if (Number.isNaN(lon) || lon < -180 || lon > 180) errors.longitude = 'Invalid longitude';
  }

  if (!record.condition) errors.condition = 'Select fish condition';
  if (!record.photoBase64) errors.photoBase64 = 'Catch photo is required';

  return { valid: Object.keys(errors).length === 0, errors };
}

export { TAG_RULES };
