import axios from "axios";

const resolvedApiBaseUrl = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/$/, "");

const API = axios.create({
  baseURL: resolvedApiBaseUrl,
});

// Interceptor pour ajouter JWT automatiquement
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Soumet un nouveau signalement (report)
 * @param {string} reported_entity_type - Type d'entité signalÃ©e ('garage', 'review', 'user', etc.)
 * @param {number} reported_entity_id - ID de l'entité signalÃ©e
 * @param {string} reason - Raison du signalement (ex: "spam", "insulte", "fraude")
 * @param {string} details - Détails additionnels du signalement
 * @returns {Promise<object>} Réponse du serveur avec le report créé
 */
export const submitReport = async (reported_entity_type, reported_entity_id, reason, details = "") => {
  try {
    const response = await API.post("/reports", {
      reported_entity_type,
      reported_entity_id,
      reason,
      details
    });
    return response.data;
  } catch (error) {
    console.error("Error submitting report:", error.response?.data || error.message);
    throw error;
  }
};

export default {
  submitReport
};


