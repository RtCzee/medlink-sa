export type UserRole =
  | "patient"
  | "doctor"
  | "hospital"
  | "pharmacy"
  | "admin";

export type RoleMeta = {
  id: UserRole;
  label: string;
  tagline: string;
  description: string;
  accent: string;
  glow: string;
  icon: string;
};

export type Feature = {
  id: string;
  title: string;
  description: string;
  icon: string;
  metric?: string;
  metricLabel?: string;
};

export type Stat = {
  id: string;
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  sublabel: string;
  decimals?: number;
};

export type NavItem = {
  label: string;
  href: string;
  icon: string;
  badge?: string;
};

export type DirectoryEntry = {
  id: string;
  name: string;
  category: "hospital" | "doctor" | "pharmacy" | "medication";
  location: string;
  distanceKm: number;
  rating: number;
  priceLevel?: 1 | 2 | 3;
  open: boolean;
  nextAvailable?: string;
  tags: string[];
};

export type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  target: string;
  time: string;
  kind: "auth" | "edit" | "create" | "delete" | "system" | "verify";
};

export type Competitor = {
  id: string;
  name: string;
  region: string;
  feature: string;
  status: "integrated" | "planned" | "live";
};
