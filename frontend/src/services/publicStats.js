/**
 * PUBLIC STATS SERVICE
 * 
 * Service for fetching public platform statistics.
 * These stats are displayed on the homepage (landing page) to show platform ecosystem status.
 * 
 * No authentication required - can be called by anyone.
 */

import API from './api';

/**
 * Fetch public platform statistics
 * 
 * @returns {Promise} Response with data object containing:
 *   - users: number of validated user accounts
 *   - garages: number of partner garages
 *   - pieces: number of pieces in catalog
 *   - interventions: number of tracked interventions
 * 
 * Usage:
 * import { getPublicStats } from './services/publicStats';
 * 
 * try {
 *   const response = await getPublicStats();
 *   const { users, garages, pieces, interventions } = response.data.data;
 *   console.log(`Platform has ${users} active users`);
 * } catch (error) {
 *   console.error('Failed to fetch stats:', error);
 * }
 */
export const getPublicStats = () => {
  return API.get('/public/stats');
};
