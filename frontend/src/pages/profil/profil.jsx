import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { updateProfile, changePassword, deleteAccount } from '../../services/user';
import PlatformLayout from '../../components/PlatformLayout';

const Profil = () => {
  const { user, updateUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // États pour les différents formulaires
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '' // optionnel pour la modification
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: ''
  });
  const [deletePassword, setDeletePassword] = useState('');

  const [loading, setLoading] = useState({
    profile: false,
    password: false,
    delete: false
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  // Initialiser le formulaire avec les données de l'utilisateur
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        password: ''
      });
    }
  }, [user]);

  // Gestionnaires de changement
  const handleProfileChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  // Soumission du formulaire de profil
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading({ ...loading, profile: true });
    setMessage({ type: '', text: '' });

    try {
      const res = await updateProfile(profileForm);
      // Mettre à jour le contexte avec les nouvelles données utilisateur
      updateUser(res.data.user); // suppose que l'API retourne l'utilisateur mis à jour
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès' });
      // Réinitialiser le champ mot de passe
      setProfileForm({ ...profileForm, password: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur lors de la mise à jour' });
    } finally {
      setLoading({ ...loading, profile: false });
    }
  };

  // Soumission du formulaire de changement de mot de passe
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading({ ...loading, password: true });
    setMessage({ type: '', text: '' });

    try {
      await changePassword(passwordForm);
      setMessage({ type: 'success', text: 'Mot de passe modifié avec succès' });
      setPasswordForm({ oldPassword: '', newPassword: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur lors du changement de mot de passe' });
    } finally {
      setLoading({ ...loading, password: false });
    }
  };

  // Suppression du compte
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setMessage({ type: 'error', text: 'Veuillez entrer votre mot de passe pour confirmer' });
      return;
    }

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
      return;
    }

    setLoading({ ...loading, delete: true });
    setMessage({ type: '', text: '' });

    try {
      await deleteAccount(deletePassword);
      // Déconnecter l'utilisateur
      logout();
      navigate('/');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Erreur lors de la suppression' });
    } finally {
      setLoading({ ...loading, delete: false });
    }
  };

  return (
    <PlatformLayout>
      <div className="min-h-screen bg-transparent py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-[#1a2b4b]">Mon profil</h1>
              <p className="mt-1 text-sm text-[#617089]">Gérez vos informations, mot de passe et sécurité du compte.</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="vb-btn-outline px-4 py-2"
            >
              Retour Dashboard
            </button>
          </div>

        {message.text && (
          <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulaire d'informations personnelles */}
        <div className="vb-card p-6">
          <h2 className="text-xl font-semibold mb-4">Informations personnelles</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
              <input
                type="text"
                name="name"
                value={profileForm.name}
                onChange={handleProfileChange}
                className="vb-input w-full p-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                className="vb-input w-full p-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                type="tel"
                name="phone"
                value={profileForm.phone}
                onChange={handleProfileChange}
                className="vb-input w-full p-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau mot de passe <span className="text-gray-500 text-xs">(optionnel)</span>
              </label>
              <input
                type="password"
                name="password"
                value={profileForm.password}
                onChange={handleProfileChange}
                placeholder="Laissez vide pour ne pas changer"
                className="vb-input w-full p-3"
              />
            </div>
            <button
              type="submit"
              disabled={loading.profile}
              className="vb-btn-primary w-full p-3 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading.profile ? 'Mise à jour...' : 'Mettre à jour'}
            </button>
          </form>
        </div>

        {/* Formulaire de changement de mot de passe (séparé) */}
        <div className="vb-card p-6">
          <h2 className="text-xl font-semibold mb-4">Changer le mot de passe</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ancien mot de passe</label>
              <input
                type="password"
                name="oldPassword"
                value={passwordForm.oldPassword}
                onChange={handlePasswordChange}
                required
                className="vb-input w-full p-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                required
                className="vb-input w-full p-3"
              />
            </div>
            <button
              type="submit"
              disabled={loading.password}
              className="w-full rounded-lg bg-green-600 p-3 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading.password ? 'Modification...' : 'Changer le mot de passe'}
            </button>
          </form>
        </div>
        </div>

        {/* Zone de suppression de compte */}
        <div className="vb-card mt-6 border border-red-200 p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-600">Zone dangereuse</h2>
          <p className="text-gray-600 mb-4">
            La suppression de votre compte est irréversible. Toutes vos données seront effacées.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="password"
              placeholder="Confirmez votre mot de passe"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="vb-input flex-1 p-3"
            />
            <button
              onClick={handleDeleteAccount}
              disabled={loading.delete}
              className="rounded-lg bg-red-600 px-6 py-3 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading.delete ? 'Suppression...' : 'Supprimer mon compte'}
            </button>
          </div>
        </div>
      </div>
      </div>
    </PlatformLayout>
  );
};

export default Profil;

