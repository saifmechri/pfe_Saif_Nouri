import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isAuthenticated = Boolean(user);

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleLogout = () => {
    logout();
    closeSidebar();
    navigate("/login", { replace: true });
  };

  const menuItems = user
    ? [
        { label: "Mon profil", to: "/profil" },
        { label: "Tableau de bord", to: "/dashboard" }
      ]
    : [
        { label: "Connexion", to: "/login" },
        { label: "Inscription", to: "/register" }
      ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(244,158,95,0.22),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.12),_transparent_30%),linear-gradient(180deg,_#f7f2ea_0%,_#fffdf9_100%)]">
      <nav className="border-b border-slate-200/70 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openSidebar}
              className="group inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              aria-label="Ouvrir le menu"
            >
              <span className="flex flex-col gap-1.5">
                <span className="h-0.5 w-5 rounded-full bg-slate-800 transition group-hover:w-6" />
                <span className="h-0.5 w-5 rounded-full bg-slate-800 transition group-hover:w-6" />
                <span className="h-0.5 w-5 rounded-full bg-slate-800 transition group-hover:w-6" />
              </span>
            </button>

            <Link to="/" className="flex items-center gap-3 text-xl font-black tracking-[0.08em] text-slate-900">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm text-white shadow-lg shadow-slate-900/20">
                AB
              </span>
              <span>AutoBot</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 text-sm font-semibold text-slate-600 md:flex">
              {isAuthenticated && (
                <span className="rounded-full bg-slate-100 px-4 py-2">Bonjour, {user.prenom || user.name}</span>
              )}
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">Plateforme de gestion automobile</span>
              {!isAuthenticated && (
                <>
                  <Link
                    to="/register"
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400"
                  >
                    Créer un compte
                  </Link>
                  <Link
                    to="/login"
                    className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800"
                  >
                    Se connecter
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {isSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 border-0 bg-slate-950/45"
          onClick={closeSidebar}
          aria-label="Fermer le menu"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[290px] flex-col gap-5 bg-[linear-gradient(170deg,#102a43_0%,#1f4e5f_100%)] px-5 py-7 text-white shadow-[8px_0_26px_rgba(0,0,0,0.18)] transition-transform duration-200 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="border-b border-white/20 pb-5">
          <div className="text-[1.25rem] font-extrabold tracking-wide">AutoCare Platform</div>
          <div className="mt-2 text-sm text-white/80">{user?.name || "Visiteur"}</div>
        </div>

        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={closeSidebar}
              className="rounded-2xl px-4 py-3 font-semibold text-white/90 transition hover:translate-x-1 hover:bg-white/10"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {user ? (
          <button
            type="button"
            className="mt-auto rounded-2xl bg-orange-500 px-4 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-orange-400"
            onClick={handleLogout}
          >
            Déconnexion
          </button>
        ) : (
          <div className="mt-auto rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-white/80">
            Connectez-vous pour accéder au profil et aux espaces dédiés.
          </div>
        )}
      </aside>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <section className="overflow-hidden rounded-[0.85rem] border border-blue-500/35 shadow-[0_24px_50px_rgba(30,64,175,0.28)]">
          <div className="h-5 bg-blue-900" />
          <div className="bg-[linear-gradient(135deg,#1e3a8a_0%,#2563eb_52%,#1d4ed8_100%)] px-6 py-14 text-center sm:px-10 sm:py-16">
            <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
              Plateforme Intelligente de Gestion Automobile
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-sm font-medium text-blue-100 sm:text-base lg:text-lg">
              Gerez vos vehicules, trouvez des pieces, reservez des garages facilement.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              {!isAuthenticated ? (
                <>
                  <Link to="/register" className="vb-btn-primary px-6 py-3">
                    S'inscrire
                  </Link>
                  <Link to="/login" className="vb-btn-outline px-6 py-3 text-white/95 border-white/50 bg-white/10 hover:bg-white/20">
                    Voir la demo
                  </Link>
                </>
              ) : (
                <Link to="/dashboard" className="vb-btn-primary px-6 py-3">
                  Aller au tableau de bord
                </Link>
              )}
            </div>
          </div>
        </section>

        {!isAuthenticated ? (
          <section className="grid gap-4 sm:grid-cols-2">
            <Link
              to="/register"
              className="rounded-2xl border border-blue-200 bg-white px-6 py-4 text-center font-semibold text-blue-800 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
            >
              Créer un compte
            </Link>
            <Link
              to="/login"
              className="rounded-2xl border border-slate-300 bg-white px-6 py-4 text-center font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md"
            >
              Se connecter
            </Link>
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2">
            <Link
              to="/dashboard"
              className="rounded-2xl border border-blue-200 bg-white px-6 py-4 text-center font-semibold text-blue-800 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
            >
              Tableau de bord
            </Link>
            <Link
              to="/dashboard"
              className="rounded-2xl border border-slate-300 bg-white px-6 py-4 text-center font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md"
            >
              Accéder à l’espace
            </Link>
          </section>
        )}

        <section className="vb-card p-6 sm:p-8">
          <h2 className="text-2xl font-extrabold text-[#1a2b4b]">Ecosysteme AutoBot</h2>
          <p className="mt-2 text-sm text-[#617089]">Des parcours adaptes a chaque acteur automobile.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <article className="rounded-lg border border-blue-100 bg-blue-50/60 p-4">
              <h3 className="text-lg font-bold text-[#1a2b4b]">Automobiliste</h3>
              <p className="mt-2 text-sm text-[#476184]">Suivez vos interventions et recevez des recommandations dynamiques.</p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-white p-4">
              <h3 className="text-lg font-bold text-[#1a2b4b]">Garage</h3>
              <p className="mt-2 text-sm text-[#476184]">Pilotez le planning atelier, les services et la relation client.</p>
            </article>
            <article className="rounded-lg border border-green-100 bg-green-50/70 p-4">
              <h3 className="text-lg font-bold text-[#1a2b4b]">Vendeur</h3>
              <p className="mt-2 text-sm text-[#476184]">Gerez catalogue, prix et stocks de pieces en temps reel.</p>
            </article>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="vb-card p-5">
            <p className="text-sm text-[#617089]">Utilisateurs actifs</p>
            <p className="mt-2 text-3xl font-extrabold text-[#1a2b4b]">120+</p>
          </div>
          <div className="vb-card p-5">
            <p className="text-sm text-[#617089]">Garages partenaires</p>
            <p className="mt-2 text-3xl font-extrabold text-[#1a2b4b]">15</p>
          </div>
          <div className="vb-card p-5">
            <p className="text-sm text-[#617089]">Pieces catalogue</p>
            <p className="mt-2 text-3xl font-extrabold text-[#1a2b4b]">1000+</p>
          </div>
          <div className="vb-card p-5">
            <p className="text-sm text-[#617089]">Interventions suivies</p>
            <p className="mt-2 text-3xl font-extrabold text-[#1a2b4b]">230+</p>
          </div>
        </section>

        <section className="vb-card bg-[linear-gradient(135deg,#1a2b4b_0%,#1d4ed8_100%)] p-8 text-center text-white">
          <h2 className="text-3xl font-extrabold">Prêt a accelerer votre gestion automobile ?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-blue-100">Centralisez vehicules, interventions, stocks et recommandations dans une seule plateforme.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {!isAuthenticated ? (
              <>
                <Link to="/register" className="vb-btn-primary px-6 py-3 bg-white text-[#1d4ed8] hover:bg-blue-50">
                  Commencer maintenant
                </Link>
                <Link to="/login" className="vb-btn-outline px-6 py-3 border-white/40 bg-white/10 text-white hover:bg-white/20">
                  Se connecter
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="vb-btn-primary px-6 py-3 bg-white text-[#1d4ed8] hover:bg-blue-50">
                  Aller au tableau de bord
                </Link>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Navbar;
