import { useContext, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const roleDashboardMap = {
  automobiliste: "/automobiliste",
  garage: "/garage",
  vendeur: "/vendeur",
  admin: "/admin"
};

const PlatformLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const dashboardPath = useMemo(() => {
    if (!user?.role) return "/dashboard";
    return roleDashboardMap[user.role] || "/dashboard";
  }, [user?.role]);

  const closeSidebar = () => setIsSidebarOpen(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const navItems = [
    { label: "Accueil", to: "/" },
    { label: "Mon profil", to: "/profil" },
    { label: "Tableau de bord", to: dashboardPath }
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,rgba(240,138,93,0.18),transparent_26%),radial-gradient(circle_at_85%_85%,rgba(15,23,42,0.12),transparent_32%),linear-gradient(180deg,#f7f2ea_0%,#fffdf9_100%)] text-slate-900">
      <button
        type="button"
        className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 lg:hidden"
        onClick={() => setIsSidebarOpen((prev) => !prev)}
        aria-label="Ouvrir le menu"
      >
        <span className="flex flex-col gap-1.5">
          <span className="h-0.5 w-5 rounded-full bg-white" />
          <span className="h-0.5 w-5 rounded-full bg-white" />
          <span className="h-0.5 w-5 rounded-full bg-white" />
        </span>
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[290px] flex-col gap-5 bg-[linear-gradient(170deg,#102a43_0%,#1f4e5f_100%)] px-5 py-7 text-white shadow-[8px_0_26px_rgba(0,0,0,0.18)] transition-transform duration-200 lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="border-b border-white/20 pb-5">
          <div className="text-[1.25rem] font-extrabold tracking-wide">AutoCare Platform</div>
          <div className="mt-2 text-sm text-white/80">{user?.name || "Utilisateur"}</div>
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={closeSidebar}
                className={`rounded-2xl px-4 py-3 font-semibold text-white/90 transition hover:translate-x-1 hover:bg-white/10 ${isActive ? "bg-orange-500/25 shadow-[inset_0_0_0_1px_rgba(240,138,93,0.8)]" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="mt-auto rounded-2xl bg-orange-500 px-4 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-orange-400"
          onClick={handleLogout}
        >
          Déconnexion
        </button>
      </aside>

      {isSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 border-0 bg-slate-950/45 lg:hidden"
          onClick={closeSidebar}
          aria-label="Fermer"
        />
      )}

      <main className="min-h-screen lg:ml-[290px] lg:w-[calc(100%-290px)]" onClick={closeSidebar}>
        {children}
      </main>
    </div>
  );
};

export default PlatformLayout;
