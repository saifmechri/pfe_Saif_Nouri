import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Mail, AlertCircle, Loader2 } from "lucide-react";
import { AuthContext } from "../../context/AuthContext";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { loginAdmin } = useContext(AuthContext);
  
  const [email, setEmail] = useState("admin123@gmail.com");
  const [password, setPassword] = useState("Admin@admin0");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginAdmin({ email, password });
      navigate("/admin");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        "Erreur d'authentification. Vérifiez vos identifiants."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/20 mb-4">
            <Lock className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-3xl font-black text-white">Authentification Admin</h1>
          <p className="text-slate-400 mt-2">Accès réservé aux administrateurs</p>
        </div>

        {/* Form Card */}
        <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-900/30 border border-red-700/50 p-4">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-200">Erreur d'authentification</p>
                <p className="text-xs text-red-300 mt-1">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Email Admin
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="admin123@gmail.com"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Entrez votre mot de passe"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authentification...
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 rounded-xl bg-blue-900/20 border border-blue-700/50">
            <p className="text-xs text-blue-300">
              <strong>Identifiants démo:</strong> utilisez les credentials fournis pour accéder au tableau de bord administrateur.
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-sm text-slate-400 hover:text-slate-200 transition"
          >
            â† Retour Ã  l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;


