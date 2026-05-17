/**
 * RECOMMENDATION SERVICE
 * 
 * Interfaces with AUTO BOT recommendation engine backend API.
 * Fetches AI-generated maintenance recommendations for vehicles.
 */

import API from "./api";

/**
 * Get classified recommendations for user's vehicles
 * 
 * Fetches ranked recommendations from AI engine based on:
 * - Vehicle mileage and type
 * - Maintenance history
 * - Garage proximity and ratings
 * 
 * @param {Object} params - Query parameters:
 *   - sortBy: 'urgence' | 'score' | 'distance' | 'type' (default: urgence)
 *   - order: 'asc' | 'desc' (default: desc)
 *   - page: int (default: 1)
 *   - limit: 1-50 (default: 10)
 *   - minInterventionScore: 0-100 (filter by urgency)
 *   - urgency: 'URGENT' | 'RECOMMANDÃ‰' | 'FUTUR' (optional)
 * 
 * @returns {Promise} Response with recommendations array:
 *   Each recommendation includes:
 *   - decision: Maintenance type
 *   - vehicle: Vehicle info
 *   - intervention: Scoring details
 *   - garages: Top 3 matching garages
 *   - finalScore: Confidence score 0-100
 *   - risk: Urgency level
 */
export const getDynamicRecommendations = (params = {}) => {
  return API.get("/recommendations/classees", { params });
};

/**
 * Get services offered by a specific garage
 * 
 * Lists all maintenance services available at a garage.
 * Used when user wants to see what services garage specializes in.
 * 
 * @param {number} garageId - ID of the garage
 * @param {Object} params - Query parameters (optional)
 * @returns {Promise} Response with services array
 */
export const getGarageServicesById = (garageId, params = {}) => {
  return API.get(`/garages/${garageId}/services`, { params });
};


