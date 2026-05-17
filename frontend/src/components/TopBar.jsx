import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import NotificationCenter from "./NotificationCenter";
import useNotifications from "../hooks/useNotifications";
import { LogOut } from "lucide-react";

const TopBar = ({ onLogout }) => {
  const { user } = useContext(AuthContext);
  const { notifications, loading, markAsRead, delete: deleteNotif } = useNotifications(15000); // Poll all 15s

  return (
    <div className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        {/* Left: User Info */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-900">{user?.name || "Utilisateur"}</p>
            <p className="text-xs text-slate-500 capitalize">
              {user?.role === "automobiliste" ? "ðŸš— Automobiliste" :
               user?.role === "garage" ? "ðŸ”§ Garage" :
               user?.role === "vendeur" ? "ðŸ“¦ Vendeur" :
               user?.role}
            </p>
          </div>
        </div>

        {/* Right: Notifications & Logout */}
        <div className="flex items-center gap-2">
          <NotificationCenter
            notifications={notifications}
            isLoading={loading}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotif}
          />

          {onLogout && (
            <button
              onClick={onLogout}
              className="hidden sm:flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              title="Déconnexion"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Déconnexion</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;


