import API from './api';

export const getCompleteProfile = () => {
  return API.get('/auth/profile-complet');
};

export const getCompleteProfileById = (userId) => {
  return API.get(`/auth/profile-complet/${userId}`);
};

// Mettre à jour le profil
export const updateProfile = (userData) => {
  return API.put('/auth/profile', userData);
};

// Changer le mot de passe
export const changePassword = (passwords) => {
  return API.put('/auth/profile/password', passwords);
};

// Supprimer le compte
export const deleteAccount = (confirmPassword) => {
  return API.delete('/auth/profile', { data: { confirmPassword } });
};