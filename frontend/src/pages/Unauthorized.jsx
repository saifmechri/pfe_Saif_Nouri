import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Accès interdit</h1>
        <p className="text-gray-700 mb-6">Vous n'avez pas les droits nécessaires pour accéder à cette page.</p>
        <Link to="/" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;