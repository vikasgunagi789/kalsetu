
const STORAGE_KEY = "ecotwin-material-records";

const VALID_STATUSES = [
  "Pending",
  "Reused",
  "Recycled",
  "Composted",
  "Disposed",
];

function readRecords() {
  try {
    const records = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
}

function writeRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function getMaterials() {
  return readRecords();
}

export function addMaterial(material) {
  const record = {
    id: crypto.randomUUID(),
    name: material.name || "Unidentified item",
    category: material.category || "reusable",
    recommendation: material.recommendation || "Inspect and sort safely.",
    status: "Pending",
    createdAt: new Date().toISOString(),
    weightKg: Math.max(0, Number(material.weightKg) || 0),
  };

  const records = readRecords();
  records.unshift(record);
  writeRecords(records);

  return record;
}

export function updateMaterialStatus(id, status) {
  if (!VALID_STATUSES.includes(status)) {
    throw new Error("Invalid material status.");
  }

  const records = readRecords().map((record) =>
    record.id === id ? { ...record, status } : record
  );

  writeRecords(records);
  return records;
}

export function deleteMaterial(id) {
  const records = readRecords().filter((record) => record.id !== id);
  writeRecords(records);
  return records;
}

export function clearMaterials() {
  writeRecords([]);
}

export function getImpactSummary() {
  const records = readRecords();

  const completed = records.filter((record) =>
    ["Reused", "Recycled", "Composted"].includes(record.status)
  );

  const recycled = records.filter((record) => record.status === "Recycled");
  const reused = records.filter((record) => record.status === "Reused");
  const composted = records.filter((record) => record.status === "Composted");

  return {
    totalScanned: records.length,
    completedActions: completed.length,
    pending: records.filter((record) => record.status === "Pending").length,
    recycledCount: recycled.length,
    reusedCount: reused.length,
    compostedCount: composted.length,
    trackedWeightKg: records.reduce(
      (total, record) => total + record.weightKg,
      0
    ),
    completedWeightKg: completed.reduce(
      (total, record) => total + record.weightKg,
      0
    ),
    // Illustrative points, not a verified environmental-impact measurement.
    ecoPoints:
      recycled.length * 10 +
      reused.length * 15 +
      composted.length * 8,
  };
}
