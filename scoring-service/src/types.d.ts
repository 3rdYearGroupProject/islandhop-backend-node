// TypeScript type definitions (optional, for reference)
// Not required for JS runtime, but useful for editors

/**
 * Driver/Guide Score Table
 */
export interface ScoreRow {
  email: string;
  Rating: number;
  Active: number;
  Banned: number;
  NewDriver: number;
  First10Rides: number;
  Penalty: number;
  vehicle_type?: string;
}
