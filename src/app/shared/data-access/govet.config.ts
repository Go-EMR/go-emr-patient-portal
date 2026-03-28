/**
 * GoVet API integration configuration.
 *
 * Toggle GOVET_ENABLED to switch between GoVet live data and local mock data.
 * In production, GOVET_API_URL would come from environment-specific config.
 */

/** Base URL of the GoVet mock API server. */
export const GOVET_API_URL = 'http://localhost:8000';

/** Feature flag — set to false to fall back to local hardcoded mock data. */
export const GOVET_ENABLED = true;

/**
 * Maps the portal's demo user to a GoVet owner UUID.
 * In a real system this mapping would come from the auth/session layer.
 */
export const GOVET_DEMO_OWNER_ID = 'o1000000-0000-0000-0000-000000000001';

/** GoVet demo clinic name (used as fallback for clinic display). */
export const GOVET_DEMO_CLINIC_NAME = 'GoVet Demo Clinic';
