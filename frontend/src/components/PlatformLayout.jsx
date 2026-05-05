import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import ChatModal from "./ChatModal";
import { MessageCircle } from "lucide-react";

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
  const [isChatOpen, setIsChatOpen] = useState(false);

  const dashboardPath = useMemo(() => {
    if (!user?.role) return "/dashboard";
    return roleDashboardMap[user.role] || "/dashboard";
  }, [user?.role]);

  useEffect(() => {
    closeSidebar();
  }, [location.pathname]);

  useEffect(() => {
    const isMobileViewport = window.matchMedia("(max-width: 1023px)").matches;
    if (isSidebarOpen && isMobileViewport) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  const closeSidebar = () => setIsSidebarOpen(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const navItems = [
    { label: "Accueil", to: "/" },
    { label: "Mon profil", to: "/profil" },
    { label: "Tableau de bord", to: dashboardPath },
    { label: "Catalogue pièces", to: "/vendeur/catalogue" }
  ];

  if (user?.role === "automobiliste" || user?.role === "vendeur") {
    navItems.push({ label: "Recommandations", to: "/automobiliste/recommandations" });
    navItems.push({ label: "Garages", to: "/automobiliste/garages" });
  }

  if (user?.role === "garage") {
    navItems.push({ label: "Gestion garage", to: "/garage" });
  }

  if (user?.role === "vendeur") {
    // Messagerie accessible via navbar/chat modal — removed from sidebar
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[linear-gradient(145deg,#eef3fb_0%,#f7f9fe_50%,#edf2fb_100%)] text-[#12223d]">
      <button
        type="button"
        className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-lg bg-[#1a2b4b] text-white shadow-[0_8px_24px_rgba(26,43,75,0.28)] transition hover:bg-[#13243f] lg:hidden"
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
        className={`fixed inset-y-0 left-0 z-40 flex w-[86vw] max-w-[300px] flex-col gap-5 bg-[linear-gradient(170deg,#1a2b4b_0%,#16315c_100%)] px-5 py-7 text-white shadow-[8px_0_26px_rgba(0,0,0,0.18)] transition-transform duration-200 lg:w-[300px] lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="rounded-lg border border-white/20 bg-white/5 px-4 py-4">
          <div className="text-[1.25rem] font-extrabold tracking-wide">AutoBot</div>
          <div className="mt-2 text-sm text-white/80">{user?.name || "Utilisateur"}</div>
          <div className="mt-1 text-xs uppercase tracking-[0.12em] text-blue-200/80">{user?.role || "compte"}</div>
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={`${item.to}-${item.label}`}
                to={item.to}
                onClick={closeSidebar}
                className={`rounded-lg px-4 py-3 font-semibold text-white/90 transition hover:translate-x-1 hover:bg-white/10 ${isActive ? "bg-blue-500/30 shadow-[inset_0_0_0_1px_rgba(147,197,253,0.9)]" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="mt-auto rounded-lg bg-red-500 px-4 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-red-400"
          onClick={handleLogout}
        >
          Déconnexion
        </button>
      </aside>

      {isSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 border-0 bg-[#0f1d35]/45 lg:hidden"
          onClick={closeSidebar}
          aria-label="Fermer"
        />
      )}

      <main className="min-h-screen overflow-x-hidden lg:ml-[300px] lg:w-[calc(100%-300px)]" onClick={closeSidebar}>
        {children}
      </main>
    </div>
  );
};

export default PlatformLayout;
