import { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const { login, loginAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  const adminEmail = "admin123@gmail.com";

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation des champs obligatoires
    if (!form.email.trim() || !form.password.trim()) {
      setError("Tous les champs sont obligatoires.");
      return;
    }

    // Validation du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Veuillez entrer un email valide.");
      return;
    }

    setLoading(true);
    try {
      if (form.email.trim().toLowerCase() === adminEmail) {
        await loginAdmin(form);
        navigate("/admin", { replace: true });
      } else {
        await login(form);
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      const errorCode = err?.response?.data?.error?.code;
      const backendMessage = err?.response?.data?.message;
      
      if (errorCode === 'ACCOUNT_NOT_VALIDATED') {
        setError("Votre compte est en attente de validation par l'administrateur.");
      } else if (errorCode === 'USER_NOT_FOUND' || errorCode === 'INVALID_PASSWORD') {
        setError("Email ou mot de passe incorrect.");
      } else if (errorCode === 'ACCOUNT_INCOMPLETE') {
        setError("Votre compte n'est pas complet. Contactez le support.");
      } else if (backendMessage) {
        setError(backendMessage);
      } else {
        setError("Erreur de connexion. Veuillez réessayer.");
      }
      console.error('Login error:', err?.response?.data || err);
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
            <h1 className="mt-4 text-4xl font-extrabold leading-tight">Connectez-vous a votre plateforme automobile.</h1>
            <p className="mt-5 max-w-md text-sm text-blue-100/95">Pilotez vehicules, interventions et recommandations dans une interface metier moderne.</p>
          </div>
          <div className="rounded-lg border border-white/25 bg-white/10 p-5 text-sm text-blue-50">
            Design System Velocity Blue: precis, lisible, rapide.
          </div>
        </section>

        <section className="flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-md">
            <h2 className="text-3xl font-extrabold text-[#1a2b4b]">Connexion</h2>
            <p className="mt-2 text-sm text-[#617089]">Accedez a votre espace AutoBot.</p>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-semibold text-[#1a2b4b]">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="vb-input w-full px-3 py-3"
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
                  value={form.password}
                  onChange={handleChange}
                  className="vb-input w-full px-3 py-3"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="vb-btn-primary w-full px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>

            <p className="mt-5 text-sm text-[#617089]">
              Pas encore de compte ?{" "}
              <Link to="/register" className="font-semibold text-[#1d4ed8] hover:underline">
                Inscrivez-vous
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;