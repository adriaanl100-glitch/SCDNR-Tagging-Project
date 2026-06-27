/**
 * Species definitions and tag/measurement rules.
 * Aligned with SCDNR Marine Game Fish Tagging Program target species.
 */
const TAIL = { allowCR: true, allowK: true, defaultMeasurement: 'Tail', doNotTag: false };
const FORK = { allowCR: true, allowK: true, defaultMeasurement: 'Fork', doNotTag: false };
const FLOUNDER = { allowCR: true, allowK: false, defaultMeasurement: 'Tail', doNotTag: false };
const PELAGIC = { allowCR: false, allowK: true, defaultMeasurement: 'Fork', doNotTag: false };
// Tagging is permitted (we still record the catch) but the species is flagged
// DO NOT TAG so the angler is educated at the point of entry.
const DO_NOT_TAG = { allowCR: true, allowK: true, defaultMeasurement: 'Tail', doNotTag: true };

const withRules = (name, rules) => ({ name, ...rules });

export const SPECIES_LIST = [
  withRules('Billfish', PELAGIC),
  withRules('Black Drum', TAIL),
  withRules('Black Sea Bass', FORK),
  withRules('Bluefish', FORK),
  withRules('Cobia', FORK),
  withRules('Dolphinfish (Mahi Mahi)', PELAGIC),
  withRules('Grouper (All Species)', FORK),
  withRules('King Mackerel', PELAGIC),
  withRules('Red Drum', TAIL),
  withRules('Sheepshead', FORK),
  withRules('Snapper (All Species)', FORK),
  withRules('Southern Flounder', FLOUNDER),
  withRules('Spanish Mackerel', PELAGIC),
  withRules('Spotted Seatrout', DO_NOT_TAG),
  withRules('Striped Bass', TAIL),
  withRules('Summer Flounder', FLOUNDER),
  withRules('Tarpon', FORK),
  withRules('Tuna', PELAGIC)
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
