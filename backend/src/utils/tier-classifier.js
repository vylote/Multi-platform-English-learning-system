// utils/tier-classifier.js
const DIFFICULTY_ORDER = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

function classifyTier(placementScore, thresholds = {}) {
  if (placementScore === null || placementScore === undefined) return null;
  const beginnerMax = thresholds.beginnerMax ?? 5.0;
  const intermediateMax = thresholds.intermediateMax ?? 8.0;

  if (placementScore < beginnerMax) return "BEGINNER";
  if (placementScore < intermediateMax) return "INTERMEDIATE";
  return "ADVANCED";
}

module.exports = { classifyTier, DIFFICULTY_ORDER };