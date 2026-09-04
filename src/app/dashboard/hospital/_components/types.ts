export type TabId =
  | "overview"
  | "beds"
  | "queue"
  | "staff"
  | "approvals"
  | "departments"
  | "settings";

export type BedStatus = "occupied" | "available" | "cleaning" | "reserved";

export type BedRow = {
  id: string;
  ward: string;
  status: BedStatus;
  bedNumber: number;
};

export type BedPatientDetail = {
  patient: string;
  age: number;
  admitted: string;
  attending: string;
  diagnosis: string;
  expectedDischarge: string;
  insurance: string;
};
