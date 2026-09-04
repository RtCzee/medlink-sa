/**
 * PTV (Pharmacotherapeutic Review) service.
 * Handles drug interaction checks, dosage validation, and schedule compliance.
 */

// Known drug interactions (simplified for demo)
const DRUG_INTERACTIONS: Array<{
  drugs: string[];
  severity: "mild" | "moderate" | "severe" | "contraindicated";
  description: string;
}> = [
  {
    drugs: ["Ibuprofen", "Glucophage"],
    severity: "moderate",
    description:
      "NSAIDs may reduce the effectiveness of metformin and increase risk of lactic acidosis.",
  },
  {
    drugs: ["Ibuprofen", "Augmentin"],
    severity: "mild",
    description:
      "Concurrent use may increase risk of gastrointestinal side effects.",
  },
  {
    drugs: ["Glucophage", "Augmentin"],
    severity: "mild",
    description:
      "Antibiotics may slightly alter gut flora affecting metformin absorption.",
  },
  {
    drugs: ["Ventolin", "Allergex"],
    severity: "mild",
    description:
      "No significant interaction, but monitor for increased heart rate.",
  },
];

// Dosage ranges by medicine (min/max daily dose in standard units)
const DOSAGE_RANGES: Record<
  string,
  { min: number; max: number; unit: string; frequency: string[] }
> = {
  Panado: { min: 500, max: 4000, unit: "mg", frequency: ["once daily", "twice daily", "three times daily", "four times daily"] },
  Augmentin: { min: 875, max: 1750, unit: "mg", frequency: ["twice daily"] },
  Glucophage: { min: 500, max: 2550, unit: "mg", frequency: ["once daily", "twice daily", "three times daily"] },
  Ventolin: { min: 100, max: 800, unit: "mcg", frequency: ["as needed", "every 4-6 hours"] },
  Allergex: { min: 4, max: 12, unit: "mg", frequency: ["once daily", "twice daily", "three times daily"] },
  Brufen: { min: 200, max: 1200, unit: "mg", frequency: ["once daily", "twice daily", "three times daily"] },
};

export type PTVResult = {
  approved: boolean;
  drugInteractions: Array<{
    severity: "mild" | "moderate" | "severe" | "contraindicated";
    drugs: string[];
    description: string;
  }>;
  dosageWarnings: string[];
  scheduleIssues: string[];
  notes: string[];
};

/**
 * Run PTV (Pharmacotherapeutic Review) on a prescription.
 */
export function runPTVReview(prescription: {
  medicineName: string;
  generic: string;
  dosage: string;
  frequency: string;
  quantity: number;
  schedule: number;
  currentMedications?: string[];
}): PTVResult {
  const result: PTVResult = {
    approved: true,
    drugInteractions: [],
    dosageWarnings: [],
    scheduleIssues: [],
    notes: [],
  };

  // Check drug interactions
  if (prescription.currentMedications?.length) {
    for (const interaction of DRUG_INTERACTIONS) {
      const allDrugs = [prescription.medicineName, prescription.generic, ...prescription.currentMedications];
      const matches = interaction.drugs.filter((drug) =>
        allDrugs.some((d) => d.toLowerCase().includes(drug.toLowerCase()))
      );
      if (matches.length >= 2) {
        result.drugInteractions.push({
          severity: interaction.severity,
          drugs: matches,
          description: interaction.description,
        });
        if (interaction.severity === "severe" || interaction.severity === "contraindicated") {
          result.approved = false;
        }
      }
    }
  }

  // Check dosage
  const dosageInfo = DOSAGE_RANGES[prescription.medicineName];
  if (dosageInfo) {
    const dosageNum = parseInt(prescription.dosage, 10);
    if (!isNaN(dosageNum)) {
      if (dosageNum < dosageInfo.min) {
        result.dosageWarnings.push(
          `Dosage ${dosageNum}${dosageInfo.unit} is below minimum effective dose (${dosageInfo.min}${dosageInfo.unit})`
        );
      }
      if (dosageNum > dosageInfo.max) {
        result.dosageWarnings.push(
          `Dosage ${dosageNum}${dosageInfo.unit} exceeds maximum safe dose (${dosageInfo.max}${dosageInfo.unit})`
        );
        result.approved = false;
      }
    }
  }

  // Check schedule compliance
  if (prescription.schedule >= 4 && !prescription.currentMedications?.length) {
    result.scheduleIssues.push(
      `Schedule ${prescription.schedule} medicine requires prescription verification`
    );
  }

  // Add notes
  if (result.drugInteractions.length === 0 && result.dosageWarnings.length === 0 && result.scheduleIssues.length === 0) {
    result.notes.push("No issues found. Prescription is safe to dispense.");
  }

  return result;
}

/**
 * Get all known drug interactions for a medicine.
 */
export function getDrugInteractions(medicineName: string) {
  return DRUG_INTERACTIONS.filter((interaction) =>
    interaction.drugs.some((drug) =>
      medicineName.toLowerCase().includes(drug.toLowerCase())
    )
  );
}

/**
 * Get dosage range for a medicine.
 */
export function getDosageRange(medicineName: string) {
  return DOSAGE_RANGES[medicineName] || null;
}
