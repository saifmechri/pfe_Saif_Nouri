/**
 * USER / AUTHENTICATION SERVICE
 *
 * Handles profile retrieval and account actions for authenticated users.
 */

import API from './api';

/**
 * Get the current authenticated user's full profile.
 */
export const getCompleteProfile = () => {
  return API.get('/auth/profile-complet');
};

/**
 * Get another user's profile by identifier.
 * @param {number} userId
 */
export const getCompleteProfileById = (userId) => {
  return API.get(`/auth/profile-complet/${userId}`);
};

/**
 * Update the current user's profile.
 * @param {Object} userData
 */
export const updateProfile = (userData) => {
  return API.put('/auth/profile', userData);
};

/**
 * Change the current user's password.
 * @param {Object} passwords
 */
export const changePassword = (passwords) => {
  return API.put('/auth/profile/password', passwords);
};

/**
 * Permanently delete the current account.
 * @param {string} confirmPassword
 */
export const deleteAccount = (confirmPassword) => {
  return API.delete('/auth/profile', { data: { confirmPassword } });
};

