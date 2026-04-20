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
    role: "",
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
    <div className="min-h-screen bg-[linear-gradient(145deg,#eff3fb_0%,#f7f9fd_48%,#e8eef9_100%)] p-4 md:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl overflow-hidden rounded-lg border border-[#dbe2ec] bg-white shadow-[0_26px_60px_rgba(26,43,75,0.12)] md:min-h-[calc(100vh-4rem)] md:grid-cols-2">
        <section className="hidden bg-[linear-gradient(155deg,#1a2b4b_0%,#1d4ed8_100%)] p-10 text-white md:flex md:flex-col md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-100">AutoBot</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight">Rejoignez un ecosysteme automobile intelligent.</h1>
            <p className="mt-5 max-w-md text-sm text-blue-100/95">Inscription rapide avec choix de role pour acceder a votre espace metier.</p>
          </div>
          <ul className="space-y-2 rounded-lg border border-white/25 bg-white/10 p-5 text-sm text-blue-50">
            <li>Automobiliste: suivi vehicules et recommandations</li>
            <li>Garage: planning interventions et services</li>
            <li>Vendeur: catalogue pieces et stock</li>
          </ul>
        </section>

        <section className="flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-md">
            <h2 className="text-3xl font-extrabold text-[#1a2b4b]">Créer un compte</h2>
            <p className="mt-2 text-sm text-[#617089]">Inscrivez-vous et choisissez votre role.</p>

            {error && (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="nom" className="mb-1 block text-sm font-semibold text-[#1a2b4b]">
              Nom
            </label>
            <input
              type="text"
              id="nom"
              name="nom"
              placeholder="Dupont"
              className="vb-input w-full px-3 py-3"
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="prenom" className="mb-1 block text-sm font-semibold text-[#1a2b4b]">
              Prénom
            </label>
            <input
              type="text"
              id="prenom"
              name="prenom"
              placeholder="Jean"
              className="vb-input w-full px-3 py-3"
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold text-[#1a2b4b]">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="exemple@domaine.com"
              className="vb-input w-full px-3 py-3"
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="telephone" className="mb-1 block text-sm font-semibold text-[#1a2b4b]">
              Téléphone
            </label>
            <input
              type="tel"
              id="telephone"
              name="telephone"
              placeholder="71234567"
              className="vb-input w-full px-3 py-3"
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold text-[#1a2b4b]">
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              className="vb-input w-full px-3 py-3"
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="role" className="mb-1 block text-sm font-semibold text-[#1a2b4b]">
              Rôle
            </label>
            <select
              id="role"
              name="role"
              className="vb-input w-full px-3 py-3"
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
            className="vb-btn-primary w-full px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Inscription..." : "S'inscrire"}
          </button>
        </form>

        <p className="mt-5 text-sm text-[#617089]">
          Déjà inscrit ?{" "}
          <Link to="/login" className="font-semibold text-[#1d4ed8] hover:underline">
            Se connecter
          </Link>
        </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Register;