import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-100">

      <header className="bg-blue-900 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between">
          <h1 className="text-2xl font-bold">AutoBot</h1>
          <div className="space-x-4">
            <Link to="/login" className="hover:underline">Login</Link>
            <Link to="/register" className="bg-yellow-400 text-black px-4 py-2 rounded-lg">
              Signup
            </Link>
          </div>
        </div>
      </header>

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

    </div>
  );
};

export default Home;