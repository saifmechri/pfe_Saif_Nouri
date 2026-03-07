import { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    password: "",
    role: "", // Initialisé vide pour forcer la sélection
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation des champs obligatoires
    if (!form.nom.trim() || !form.prenom.trim() || !form.email.trim() || !form.telephone.trim() || !form.password.trim()) {
      setError("Tous les champs sont obligatoires.");
      return;
    }

    // Validation du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Veuillez entrer un email valide.");
      return;
    }

    // Validation du téléphone : 8 chiffres, commence par 2, 5 ou 9
    const telephoneRegex = /^[259][0-9]{7}$/;
    if (!telephoneRegex.test(form.telephone)) {
      setError("Le numéro de téléphone doit contenir 8 chiffres et commencer par 2, 5 ou 9.");
      return;
    }

    // Validation du mot de passe : au moins 8 caractères, une majuscule, un chiffre, un symbole
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(form.password)) {
      setError("Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un symbole.");
      return;
    }

    // Validation du rôle : doit être une valeur valide
    const validRoles = ["automobiliste", "garage", "vendeur"];
    if (!form.role || !validRoles.includes(form.role)) {
      setError("Veuillez sélectionner un rôle valide.");
      return;
    }

    setLoading(true);
    try {
      await register(form);
      navigate("/login");
    } catch (err) {
      setError("Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Créer un compte
        </h2>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-1">
              Nom
            </label>
            <input
              type="text"
              id="nom"
              name="nom"
              placeholder="Dupont"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-1">
              Prénom
            </label>
            <input
              type="text"
              id="prenom"
              name="prenom"
              placeholder="Jean"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="exemple@domaine.com"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              type="tel"
              id="telephone"
              name="telephone"
              placeholder="71234567"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Rôle
            </label>
            <select
              id="role"
              name="role"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              onChange={handleChange}
              value={form.role}
              required
            >
              <option value="" disabled>Sélectionnez votre rôle</option>
              <option value="automobiliste">Automobiliste</option>
              <option value="garage">Garage</option>
              <option value="vendeur">Vendeur</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Chargement..." : "S'inscrire"}
          </button>
        </form>

        <p className="text-center mt-5 text-gray-600">
          Déjà inscrit ?{" "}
          <Link to="/login" className="text-blue-600 font-semibold hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;