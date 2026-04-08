import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
            {user ? (
              <div className="hidden items-center gap-3 text-sm font-semibold text-slate-600 md:flex">
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">Plateforme de gestion automobile</span>
                <span className="rounded-full bg-slate-100 px-4 py-2">Bonjour, {user.prenom || user.name}</span>
              </div>
            ) : (
              <div className="hidden items-center gap-3 md:flex">
                <Link
                  to="/login"
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400"
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  Inscription
                </Link>
              </div>
            )}
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
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <Link
            to="/register"
            className="rounded-2xl border border-blue-200 bg-white px-6 py-4 text-center font-semibold text-blue-800 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
          >
            Creer un compte
          </Link>
          <Link
            to="/login"
            className="rounded-2xl border border-slate-300 bg-white px-6 py-4 text-center font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md"
          >
            Se connecter
          </Link>
        </section>
      </main>
    </div>
  );
};

export default Navbar;
