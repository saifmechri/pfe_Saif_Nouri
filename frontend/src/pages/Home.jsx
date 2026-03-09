import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  const getDashboardLink = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "automobiliste": return "/automobiliste";
      case "garage": return "/garage";
      case "vendeur": return "/vendeur";
      case "admin": return "/admin";
      default: return "/";
    }
  };

  return (
    <>
      <nav className="bg-blue-900 text-white p-4">
        <div className="max-w-7xl mx-auto flex justify-between">
          <Link to="/" className="font-bold text-xl">AutoBot</Link>
          <div className="space-x-4">
            {user ? (
              <>
                <span>Bonjour, {user.prenom}</span>
                <Link to={getDashboardLink()}>Tableau de bord</Link>
                <button onClick={logout} className="bg-red-500 px-3 py-1 rounded">Déconnexion</button>
              </>
            ) : (
              <>
                <Link to="/login">Connexion</Link>
                <Link to="/register" className="bg-yellow-400 text-black px-3 py-1 rounded">Inscription</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="text-center py-20 bg-gradient-to-r from-blue-700 to-blue-500 text-white">
        <h2 className="text-4xl font-bold mb-4">
          Plateforme Intelligente de Gestion Automobile
        </h2>
        <p className="mb-6 text-lg">
          Gérez vos véhicules, trouvez des pièces, réservez des garages facilement.
        </p>
        <Link
          to="/register"
          className="bg-white text-blue-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200"
        >
          Commencer maintenant
        </Link>
      </section>
    </>
  );
};

export default Navbar;
