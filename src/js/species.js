/**
 * Species definitions and tag/measurement rules.
 */
export const SPECIES_LIST = [
  { name: 'Red Drum', allowCR: true, allowK: true, defaultMeasurement: 'Tail', doNotTag: false },
  { name: 'Black Drum', allowCR: true, allowK: true, defaultMeasurement: 'Tail', doNotTag: false },
  { name: 'Spotted Seatrout', allowCR: true, allowK: true, defaultMeasurement: 'Tail', doNotTag: true },
  { name: 'Southern Flounder', allowCR: true, allowK: false, defaultMeasurement: 'Tail', doNotTag: false },
  { name: 'Summer Flounder', allowCR: true, allowK: false, defaultMeasurement: 'Tail', doNotTag: false },
  { name: 'Sheepshead', allowCR: true, allowK: true, defaultMeasurement: 'Fork', doNotTag: false },
  { name: 'Black Sea Bass', allowCR: true, allowK: true, defaultMeasurement: 'Fork', doNotTag: false },
  { name: 'Cobia', allowCR: true, allowK: true, defaultMeasurement: 'Fork', doNotTag: false },
  { name: 'Bluefish', allowCR: true, allowK: true, defaultMeasurement: 'Fork', doNotTag: false },
  { name: 'Tarpon', allowCR: true, allowK: true, defaultMeasurement: 'Fork', doNotTag: false },
  { name: 'King Mackerel', allowCR: false, allowK: true, defaultMeasurement: 'Fork', doNotTag: false },
  { name: 'Spanish Mackerel', allowCR: false, allowK: true, defaultMeasurement: 'Fork', doNotTag: false },
  { name: 'Billfish', allowCR: false, allowK: true, defaultMeasurement: 'Fork', doNotTag: false },
  { name: 'Tuna', allowCR: false, allowK: true, defaultMeasurement: 'Fork', doNotTag: false }
];

export function getSpecies(name) {
  return SPECIES_LIST.find((s) => s.name === name) || null;
}

export function getAllowedTagTypes(speciesName) {
  const sp = getSpecies(speciesName);
  if (!sp) return { CR: true, K: true };
  return { CR: sp.allowCR, K: sp.allowK };
}

export function getDefaultMeasurement(speciesName) {
  const sp = getSpecies(speciesName);
  return sp ? sp.defaultMeasurement : 'Tail';
}

export function isDoNotTagSpecies(speciesName) {
  const sp = getSpecies(speciesName);
  return sp ? sp.doNotTag : false;
}
