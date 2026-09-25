// utils/tier-classifier.js
const DIFFICULTY_ORDER = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

function classifyTier(placementScore) {
  if (placementScore === null || placementScore === undefined) return null;
  if (placementScore < 5) return "BEGINNER";
  if (placementScore < 8) return "INTERMEDIATE";
  return "ADVANCED";
}

module.exports = { classifyTier, DIFFICULTY_ORDER };