/**
 * USER / AUTHENTICATION SERVICE
 * 
 * Handles all user account operations:
 * - Profile management (get, update)
 * - Password changes
 * - Account deletion
 * 
 * All endpoints require JWT token (authentication).
 * Token automatically included in API headers.
 */

import API from './api';

/**
 * Get complete authenticated user profile
 * 
 * Returns full user data including:
 * - Basic info (name, email, phone)
 * - Account type (automobiliste, garage, admin)
 * - Address and location
 * - Verification status
 * 
 * USAGE:
 * const response = await getCompleteProfile();
 * console.log(response.data.data.user); // User object
 * 
 * @returns {Promise} User profile object
 */
export const getCompleteProfile = () => {
  return API.get('/auth/profile-complet');
};

/**
 * Get another user's profile by ID
 * 
 * View public profile info of another platform user.
 * Useful for garage details, user reputation, etc.
 * 
 * @param {number} userId - ID of user to fetch
 * @returns {Promise} Public profile data
 */
export const getCompleteProfileById = (userId) => {
  return API.get(`/auth/profile-complet/${userId}`);
};

/**
 * Update user profile information
 * 
 * Can update:
 * - name, email, phone
 * - address, city, postal code
 * - language preference
 * - notification settings
 * 
 * USAGE:\n * await updateProfile({\n *   telephone: '+216 98 123 456',\n *   adresse: 'New Address 123'\n * });\n * \n * @param {Object} userData - Fields to update\n * @returns {Promise} Updated profile\n */\nexport const updateProfile = (userData) => {
  return API.put('/auth/profile', userData);
};

/**
 * Change user account password
 * 
 * Must provide:
 * - old password (current password)
 * - new password (new password to set)
 * - new password confirmation
n * \n * USAGE:\n * await changePassword({\n *   old_password: 'currentPass123',\n *   new_password: 'newPass456',\n *   new_password_confirmation: 'newPass456'\n * });\n * \n * @param {Object} passwords - Old and new password fields\n * @returns {Promise} Confirmation\n */\nexport const changePassword = (passwords) => {
  return API.put('/auth/profile/password', passwords);
};

/**
 * Delete user account permanently\n * \n * Requires password confirmation for security.\n * This is irreversible - all user data will be deleted.\n * \n * USAGE:\n * await deleteAccount('userPassword123');\n * \n * @param {string} confirmPassword - Current password to confirm deletion\n * @returns {Promise} Confirmation\n */\nexport const deleteAccount = (confirmPassword) => {
  return API.delete('/auth/profile', { data: { confirmPassword } });
};