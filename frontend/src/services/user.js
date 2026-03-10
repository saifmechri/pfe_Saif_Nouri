import API from './api';

// Mettre à jour le profil
export const updateProfile = (userData) => {
  return API.put('/users/profile', userData);
};

// Changer le mot de passe
export const changePassword = (passwords) => {
  return API.post('/users/change-password', passwords);
};

// Supprimer le compte
export const deleteAccount = (confirmPassword) => {
  return API.delete('/users/profile', { data: { confirmPassword } });
};