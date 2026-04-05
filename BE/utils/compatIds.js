function toRawId(value) {
  if (!value) return null;
  if (typeof value === "object" && value._id) return value._id.toString();
  if (typeof value === "object" && value.id) return value.id.toString();
  return value.toString();
}

function toLegacyNumericId(value) {
  const rawId = toRawId(value);
  if (!rawId) return null;

  const normalized = rawId.replace(/[^a-fA-F0-9]/g, "").toLowerCase();
  if (!normalized) return null;

  const tail = normalized.slice(-12);
  const parsed = Number.parseInt(tail, 16);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

function legacyIdMatches(value, legacyId) {
  const parsed = Number(legacyId);
  if (!Number.isFinite(parsed)) return false;
  return toLegacyNumericId(value) === parsed;
}

module.exports = {
  toRawId,
  toLegacyNumericId,
  legacyIdMatches,
};