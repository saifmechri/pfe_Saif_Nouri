import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, RefreshCcw, ShieldAlert, Store, TriangleAlert, Trash2, BarChart3, Users, CalendarRange, Award } from "lucide-react";
import PlatformLayout from "../../components/PlatformLayout";
import {
  dismissReport,
  getGarages,
  getPendingReports,
  getModerationUsers,
  resolveReport,
  rejectUser,
  toggleUserBlock,
  getDashboardStats,
  getAuditLogs
} from "../../services/admin";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const INITIAL_COUNTS = {
  totalGarages: 0,
  pendingUsers: 0,
  pendingReports: 0,
  resolvedReports: 0,
  totalUsers: 0,
  totalAppointments: 0,
  pendingAppointments: 0
};

const CHART_COLORS = ["#2563eb", "#7c3aed", "#f59e0b", "#10b981", "#ef4444", "#14b8a6"];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("stats");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({ type: null, id: null });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);
  const [reportNoteById, setReportNoteById] = useState({});
  const [counts, setCounts] = useState(INITIAL_COUNTS);
  const [dashboardStats, setDashboardStats] = useState(null);
  // Audit log state
  const [auditItems, setAuditItems] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPages, setAuditPages] = useState(1);
  const [auditLimit] = useState(25);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [adminEmailFilter, setAdminEmailFilter] = useState("");

  const loadAudit = async ({ page = 1, limit = auditLimit, action = null, entity = null, adminEmail = null } = {}) => {
    setLoadingAudit(true);
    try {
      const params = { page, limit };
      if (action) params.action = action;
      if (entity) params.entity = entity;
      if (adminEmail) params.adminEmail = adminEmail;
      const res = await getAuditLogs(params);
      const data = res?.data?.data || res?.data || {};
      setAuditItems(Array.isArray(data.items) ? data.items : []);
      setAuditPage(data.meta?.page || page);
      setAuditPages(data.meta?.pages || 1);
    } catch (err) {
      console.error('loadAudit error', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  const AuditTable = () => (
    <div className="mt-6 overflow-hidden rounded-2xl border border-[#e6edf6] bg-gradient-to-br from-white to-sky-50 p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-sky-900">Journal d'audit</h3>
          <p className="text-sm text-slate-500">Historique des actions administrateur (approbations, suppressions, etc.).</p>
        </div>
        <div className="text-sm text-slate-600">Page <span className="font-medium">{auditPage}</span> / <span className="font-medium">{auditPages}</span></div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white">
        <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
          <thead className="bg-gradient-to-r from-sky-50 to-white text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide">Horodatage</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide">Admin</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide">Action</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide">Entité</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide">ID</th>
              <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide">Détails</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loadingAudit && (
              <tr><td className="px-4 py-6 text-slate-500" colSpan={6}>Chargement...</td></tr>
            )}
            {!loadingAudit && auditItems.length === 0 && (
              <tr><td className="px-4 py-6 text-slate-500" colSpan={6}>Aucun journal disponible.</td></tr>
            )}
            {auditItems.map((row, idx) => (
              <tr key={row.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} align-top hover:bg-sky-100`}>
                <td className="px-4 py-3 text-xs text-slate-500 font-mono">{new Date(row.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-xs text-slate-700">{row.admin_email || '-'}</td>
                <td className="px-4 py-3">
                  <span className="inline-block rounded-full bg-blue-50 text-blue-700 px-2 py-1 text-xs font-semibold">{row.action}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-block rounded-full bg-purple-50 text-purple-700 px-2 py-1 text-xs font-semibold">{row.entity || '-'}</span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">{row.entity_id || '-'}</td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {row.details ? (
                    <pre className="max-h-20 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-700">{JSON.stringify(row.details)}</pre>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between px-2">
        <div className="text-sm text-slate-600">Total: <span className="font-medium">{auditItems.length}</span></div>
        <div className="flex items-center gap-2">
          <button onClick={() => { if (auditPage > 1) { loadAudit({ page: auditPage - 1, limit: auditLimit, action: actionFilter || null, entity: entityFilter || null, adminEmail: adminEmailFilter || null }); } }} className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 hover:bg-slate-50">Préc</button>
          <button onClick={() => { if (auditPage < auditPages) { loadAudit({ page: auditPage + 1, limit: auditLimit, action: actionFilter || null, entity: entityFilter || null, adminEmail: adminEmailFilter || null }); } }} className="rounded-lg bg-sky-600 px-3 py-1 text-sm font-semibold text-white hover:bg-sky-700">Suiv</button>
        </div>
      </div>
    </div>
  );

  const loadDashboard = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const [statsResponse, garagesResponse, usersResponse, reportsResponse] = await Promise.all([
        getDashboardStats(),
        getGarages(),
        getModerationUsers(),
        getPendingReports()
      ]);

      const statsData = statsResponse?.data?.data || statsResponse?.data || null;
      setDashboardStats(statsData);

      const garagesList = garagesResponse?.data?.data?.items || garagesResponse?.data?.items || garagesResponse?.data || [];
      const usersList = usersResponse?.data?.data?.items || usersResponse?.data?.items || usersResponse?.data || [];
      const normalizedUsers = Array.isArray(usersList)
        ? usersList.map((user) => ({
            ...user,
            is_validated: Boolean(user?.is_validated),
            role: String(user?.role || "").toLowerCase()
          }))
        : [];
      const reportsList = reportsResponse?.data?.data || reportsResponse?.data || [];

      setPendingUsers(normalizedUsers);
      setPendingReports(Array.isArray(reportsList) ? reportsList : []);
      setCounts({
        totalGarages: Array.isArray(garagesList) ? garagesList.length : 0,
        pendingUsers: normalizedUsers.length,
        pendingReports: Array.isArray(reportsList) ? reportsList.length : 0,
        resolvedReports: Array.isArray(reportsList) ? reportsList.filter((item) => item.status === "resolved").length : 0,
        totalUsers: Number(statsData?.users?.totalUsers || 0),
        totalAppointments: Number(statsData?.appointments?.totalAppointments || 0),
        pendingAppointments: Number(statsData?.appointments?.pendingAppointments || 0)
      });
    } catch (fetchError) {
      setError(fetchError?.response?.data?.message || "Impossible de charger le tableau de bord admin.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Auto-clear error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') {
      loadAudit({ page: auditPage, limit: auditLimit, action: actionFilter || null, entity: entityFilter || null, adminEmail: adminEmailFilter || null });
    }
  }, [activeTab]);

  const overviewCards = useMemo(() => ([
    { label: "Garages", value: counts.totalGarages, icon: Store, tone: "from-blue-500 to-cyan-500" },
    { label: "Comptes à modérer", value: counts.pendingUsers, icon: Users, tone: "from-violet-500 to-fuchsia-500" },
    { label: "Signalements ouverts", value: counts.pendingReports, icon: TriangleAlert, tone: "from-amber-500 to-orange-500" },
    { label: "Signalements résolus", value: counts.resolvedReports, icon: CheckCircle2, tone: "from-emerald-500 to-teal-500" }
  ]), [counts]);

  const kpiCards = useMemo(() => ([
    { label: "Utilisateurs", value: counts.totalUsers, icon: Users, note: `${dashboardStats?.users?.pendingUsers || 0} en attente de validation`, tone: "from-sky-500 to-blue-600" },
    { label: "RDV total", value: counts.totalAppointments, icon: CalendarRange, note: `${dashboardStats?.appointments?.appointmentsLast30Days || 0} ces 30 derniers jours`, tone: "from-violet-500 to-fuchsia-600" },
    { label: "RDV en attente", value: counts.pendingAppointments, icon: TriangleAlert, note: `${dashboardStats?.appointments?.confirmedAppointments || 0} confirmés`, tone: "from-amber-500 to-orange-600" },
    { label: "Top garage", value: dashboardStats?.garages?.topGarages?.[0]?.appointmentsCount || 0, icon: Award, note: dashboardStats?.garages?.topGarages?.[0]?.name || "Aucun garage", tone: "from-emerald-500 to-teal-600" }
  ]), [counts, dashboardStats]);

  const pendingAutomobilistes = useMemo(
    () => pendingUsers.filter((user) => String(user.role || "").toLowerCase() === "automobiliste"),
    [pendingUsers]
  );

  const pendingVendeurs = useMemo(
    () => pendingUsers.filter((user) => String(user.role || "").toLowerCase() === "vendeur"),
    [pendingUsers]
  );

  const pendingGarages = useMemo(
    () => pendingUsers.filter((user) => String(user.role || "").toLowerCase() === "garage"),
    [pendingUsers]
  );

  const userRoleChartData = useMemo(() => {
    const roles = dashboardStats?.users?.byRole || [];
    return roles.map((item) => ({ name: item.role, value: item.total }));
  }, [dashboardStats]);

  const appointmentStatusChartData = useMemo(() => {
    const statuses = dashboardStats?.appointments?.byStatus || [];
    return statuses.map((item) => ({ name: item.status, value: item.total }));
  }, [dashboardStats]);

  const topGaragesChartData = useMemo(() => {
    const topGarages = dashboardStats?.garages?.topGarages || [];
    return topGarages.map((garage) => ({
      name: garage.name,
      RDV: garage.appointmentsCount,
      Note: garage.averageRating
    }));
  }, [dashboardStats]);

  const renderPendingUsersTable = (title, items, emptyMessage) => (
    <div className="rounded-3xl border border-[#e7edf6] bg-[#fbfdff] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-[#13243f]">{title}</h3>
          <p className="mt-1 text-sm text-[#66758d]">Gestion et modération des comptes {title.toLowerCase()}.</p>
        </div>
        <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-sky-700 ring-1 ring-sky-200">
          {items.length}
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#e6edf6]">
        <table className="min-w-full divide-y divide-[#e6edf6] text-left text-sm">
          <thead className="bg-gradient-to-r from-[#f8fbff] to-white text-[#5f6f87]">
            <tr>
              <th className="px-4 py-3 font-semibold">Nom</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Téléphone</th>
              <th className="px-4 py-3 font-semibold">Créé le</th>
              <th className="px-4 py-3 font-semibold">Statut</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eef3f8] bg-white">
            {!loading && items.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-[#6b7a90]" colSpan={6}>
                  <div className="flex flex-col items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-[#cbd5e1]" />
                    <span>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            )}
            {items.map((user) => (
              <tr key={user.id} className="align-top transition hover:bg-[#f8fbff]">
                <td className="px-4 py-4">
                  <div className="font-semibold text-[#13243f]">{user.name || "-"}</div>
                </td>
                <td className="px-4 py-4 text-[#5f6f87] text-xs font-mono">{user.email || "-"}</td>
                <td className="px-4 py-4 text-[#5f6f87] text-xs">{user.phone || "-"}</td>
                <td className="px-4 py-4 text-[#5f6f87] text-xs">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' }) : "-"}
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] shadow-sm ${user.is_validated ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200" : "bg-red-100 text-red-800 ring-1 ring-red-200"}`}>
                    <span className={`inline-block h-2 w-2 rounded-full ${user.is_validated ? "bg-emerald-600" : "bg-red-600"}`} />
                    {user.is_validated ? "Actif" : "Bloqué"}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleUserAction(user.id, user.is_validated ? "block" : "unblock")}
                      disabled={actionLoading.type === "user" && actionLoading.id === user.id}
                      className={`inline-flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${user.is_validated ? "bg-amber-600 hover:bg-amber-500" : "bg-emerald-600 hover:bg-emerald-500"}`}
                      title={user.is_validated ? "Bloquer ce compte" : "Débloquer ce compte"}
                    >
                      {actionLoading.type === "user" && actionLoading.id === user.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldAlert className="h-3 w-3" />}
                      {user.is_validated ? "Bloquer" : "Débloquer"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUserAction(user.id, "delete")}
                      disabled={actionLoading.type === "user" && actionLoading.id === user.id}
                      className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Supprimer ce compte"
                    >
                      {actionLoading.type === "user" && actionLoading.id === user.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const handleUserAction = async (userId, action) => {
    setActionLoading({ type: "user", id: userId });
    setError("");
    setSuccess("");

    try {
      if (action === "delete") {
        await rejectUser(userId);
        setPendingUsers((current) => current.filter((user) => user.id !== userId));
        setCounts((current) => ({ ...current, pendingUsers: Math.max(0, current.pendingUsers - 1) }));
        setSuccess("Compte supprimé avec succès");
      } else if (action === "block" || action === "unblock" || action === "toggleBlock") {
        const response = await toggleUserBlock(userId);
        const updatedUser = response?.data?.data?.user || response?.data?.user || null;
        const user = pendingUsers.find((u) => u.id === userId);
        const wasValidated = user?.is_validated;

        if (updatedUser) {
          setPendingUsers((current) => current.map((u) => (
            u.id === userId ? { ...u, is_validated: Boolean(updatedUser.is_validated) } : u
          )));
        } else {
          setPendingUsers((current) => current.map((u) => (
            u.id === userId ? { ...u, is_validated: !u.is_validated } : u
          )));
        }
        
        const newStatus = updatedUser?.is_validated ?? !wasValidated;
        setSuccess(newStatus ? "Compte débloqué avec succès" : "Compte bloqué avec succès");
      }
    } catch (actionError) {
      const errorMsg = actionError?.response?.data?.message || "Action sur le compte impossible.";
      setError(errorMsg);
      console.error("handleUserAction error:", actionError);
    } finally {
      setActionLoading({ type: null, id: null });
    }
  };

  const handleReportDecision = async (reportId, decision) => {
    setActionLoading({ type: "report", id: reportId });
    setError("");

    try {
      const note = reportNoteById[reportId] || "";

      if (decision === "resolve") {
        await resolveReport(reportId, note);
      } else {
        await dismissReport(reportId, note);
      }

      setPendingReports((current) => current.filter((report) => Number(report.id) !== Number(reportId)));
      setCounts((current) => ({ ...current, pendingReports: Math.max(0, current.pendingReports - 1) }));
    } catch (decisionError) {
      setError(decisionError?.response?.data?.message || "Action signalement impossible.");
    } finally {
      setActionLoading({ type: null, id: null });
    }
  };

  return (
    <PlatformLayout>
      <div className="min-h-screen bg-transparent">
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-white/70 bg-white/75 p-6 shadow-[0_18px_50px_rgba(26,43,75,0.08)] backdrop-blur">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#64748b]">Centre de supervision</p>
                <h1 className="mt-2 text-3xl font-black text-[#13243f] md:text-4xl">Pilotage des contenus et de la conformité</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5f6f87]">
                  Vue consolidée des indicateurs, validation des contenus, traitement des signalements et suivi des actions administrateur.
                </p>
              </div>

              <button
                type="button"
                onClick={loadDashboard}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#13243f] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(19,36,63,0.18)] transition hover:-translate-y-0.5 hover:bg-[#0f1d35]"
              >
                <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Actualiser
              </button>
            </div>

            {error && (
              <div className="animate-in rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="animate-in rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
                ✓ {success}
              </div>
            )}
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {overviewCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_40px_rgba(26,43,75,0.08)] backdrop-blur">
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.tone} text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium text-[#6b7a90]">{card.label}</p>
                  <p className="mt-2 text-3xl font-black text-[#13243f]">{loading ? "..." : card.value}</p>
                </div>
              );
            })}
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_40px_rgba(26,43,75,0.08)] backdrop-blur">
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.tone} text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-medium text-[#6b7a90]">{card.label}</p>
                  <p className="mt-2 text-3xl font-black text-[#13243f]">{loading ? "..." : card.value}</p>
                  <p className="mt-2 text-xs font-medium text-[#8090a8]">{card.note}</p>
                </div>
              );
            })}
          </div>

          <div className="mb-6 flex flex-wrap gap-3 rounded-2xl border border-[#dbe5f1] bg-white/70 p-2 shadow-[0_10px_24px_rgba(26,43,75,0.05)] backdrop-blur">
            {[
              { key: "stats", label: "Statistiques" },
              { key: "users", label: "Modération comptes" },
              { key: "reports", label: "Signalements" },
              { key: "audit", label: "Journal d'audit" },
              { key: "overview", label: "Synthèse" }
            ].map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${isActive ? "bg-[#13243f] text-white shadow-lg" : "text-[#5b6981] hover:bg-[#edf3fb] hover:text-[#13243f]"}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === "overview" && (
            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_18px_40px_rgba(26,43,75,0.08)] backdrop-blur">
                <h2 className="text-xl font-black text-[#13243f]">Priorités opérationnelles</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[#f3f7fd] p-4">
                    <p className="text-sm text-[#607089]">Garages à gérer</p>
                    <p className="mt-2 text-2xl font-black text-[#13243f]">{loading ? "..." : counts.totalGarages}</p>
                  </div>
                  <div className="rounded-2xl bg-[#fef6e8] p-4">
                    <p className="text-sm text-[#7a6330]">Signalements à traiter</p>
                    <p className="mt-2 text-2xl font-black text-[#13243f]">{loading ? "..." : pendingReports.length}</p>
                  </div>
                  <div className="rounded-2xl bg-[#f5f3ff] p-4">
                    <p className="text-sm text-[#6b5b95]">Comptes à valider</p>
                    <p className="mt-2 text-2xl font-black text-[#13243f]">{loading ? "..." : pendingUsers.length}</p>
                  </div>
                  <div className="rounded-2xl bg-[#f0fdf4] p-4">
                    <p className="text-sm text-[#347a34]">Actions rapides</p>
                    <p className="mt-2 text-sm text-[#5f6f87]">Valider les comptes, suivre les garages et traiter les signalements</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_18px_40px_rgba(26,43,75,0.08)] backdrop-blur">
                <h2 className="text-xl font-black text-[#13243f]">Repères d'utilisation</h2>
                <div className="mt-5 space-y-3 text-sm text-[#5f6f87]">
                  <p>• Traiter d'abord les comptes en attente avant les autres actions.</p>
                  <p>• Consulter les statistiques pour suivre la charge d'activité.</p>
                  <p>• Examiner le journal d'audit pour tracer les actions sensibles.</p>
                  <p>• Actualiser les données après chaque décision de modération.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_18px_40px_rgba(26,43,75,0.08)] backdrop-blur">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#64748b]">Modération des comptes</p>
                    <h2 className="mt-2 text-2xl font-black text-[#13243f]">Modération des comptes automobilistes, vendeurs et garages</h2>
                    <p className="mt-2 text-sm text-[#5f6f87]">Basculer un compte entre actif et bloqué, ou le supprimer si nécessaire.</p>
                  </div>
                  <div className="rounded-2xl bg-[#f8fbff] px-4 py-3 text-sm text-[#5f6f87]">
                    <span className="font-bold text-[#13243f]">{pendingAutomobilistes.length}</span> automobilistes, <span className="font-bold text-[#13243f]">{pendingVendeurs.length}</span> vendeurs et <span className="font-bold text-[#13243f]">{pendingGarages.length}</span> garages
                  </div>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                {renderPendingUsersTable("Automobilistes", pendingAutomobilistes, "Aucun compte automobiliste disponible.")}
                {renderPendingUsersTable("Vendeurs", pendingVendeurs, "Aucun compte vendeur disponible.")}
              </div>

              <div className="grid gap-6">
                {renderPendingUsersTable("Garages", pendingGarages, "Aucun compte garage disponible.")}
              </div>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_18px_40px_rgba(26,43,75,0.08)] backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-[#13243f]">Journal d'audit</h2>
                  <p className="mt-1 text-sm text-[#66758d]">Historique des actions administrateur (approbations, suppressions, etc.).</p>
                </div>
                <div className="flex items-center gap-2">
                  <input value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} placeholder="Action (approve_user, delete_garage...)" className="rounded-xl border px-3 py-2 text-sm" />
                  <input value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} placeholder="Entité (user, garage, piece)" className="rounded-xl border px-3 py-2 text-sm" />
                  <input value={adminEmailFilter} onChange={(e) => setAdminEmailFilter(e.target.value)} placeholder="Admin email" className="rounded-xl border px-3 py-2 text-sm" />
                  <button onClick={() => { setAuditPage(1); loadAudit({ page: 1, action: actionFilter || null, entity: entityFilter || null, adminEmail: adminEmailFilter || null }); }} className="rounded-xl bg-[#13243f] px-3 py-2 text-sm font-semibold text-white">Filtrer</button>
                  <button onClick={() => { setActionFilter(''); setEntityFilter(''); setAdminEmailFilter(''); setAuditPage(1); loadAudit({ page: 1 }); }} className="rounded-xl bg-slate-100 px-3 py-2 text-sm">Réinitialiser</button>
                </div>
              </div>

              <AuditTable />
            </div>
          )}

          {activeTab === "stats" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_18px_40px_rgba(26,43,75,0.08)] backdrop-blur">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#64748b]">Statistiques & KPI</p>
                    <h2 className="mt-2 text-2xl font-black text-[#13243f]">Vue analytique du dashboard admin</h2>
                    <p className="mt-2 text-sm text-[#5f6f87]">Synthèse des utilisateurs, RDV et garages les plus actifs.</p>
                  </div>
                  <div className="rounded-2xl bg-[#f8fbff] px-4 py-3 text-sm text-[#5f6f87]">
                    <span className="font-bold text-[#13243f]">{dashboardStats?.garages?.newGaragesLast30Days || 0}</span> nouveaux garages sur 30 jours
                  </div>
                </div>

                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  <div className="min-w-0 rounded-3xl border border-[#e7edf6] bg-[#fbfdff] p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-[#13243f]">Utilisateurs par rôle</h3>
                      <BarChart3 className="h-5 w-5 text-[#5b6b84]" />
                    </div>
                    <div className="h-[320px] min-h-[320px] w-full min-w-0">
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={userRoleChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e6edf6" />
                          <XAxis dataKey="name" tick={{ fill: '#5f6f87', fontSize: 12 }} />
                          <YAxis tick={{ fill: '#5f6f87', fontSize: 12 }} allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                            {userRoleChartData.map((entry, index) => (
                              <Cell key={`user-role-cell-${entry.name}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="min-w-0 rounded-3xl border border-[#e7edf6] bg-[#fbfdff] p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-[#13243f]">RDV par statut</h3>
                      <CalendarRange className="h-5 w-5 text-[#5b6b84]" />
                    </div>
                    <div className="h-[320px] min-h-[320px] w-full min-w-0">
                      <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                          <Pie
                            data={appointmentStatusChartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={110}
                            label
                          >
                            {appointmentStatusChartData.map((entry, index) => (
                              <Cell key={`appointment-status-cell-${entry.name}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="min-w-0 rounded-3xl border border-[#e7edf6] bg-[#fbfdff] p-5 xl:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-[#13243f]">Top garages par nombre de RDV</h3>
                      <Award className="h-5 w-5 text-[#5b6b84]" />
                    </div>
                    <div className="h-[320px] min-h-[320px] w-full min-w-0">
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={topGaragesChartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e6edf6" />
                          <XAxis type="number" tick={{ fill: '#5f6f87', fontSize: 12 }} allowDecimals={false} />
                          <YAxis type="category" dataKey="name" width={160} tick={{ fill: '#5f6f87', fontSize: 12 }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="RDV" fill="#2563eb" radius={[0, 8, 8, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "reports" && (
            <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_18px_40px_rgba(26,43,75,0.08)] backdrop-blur">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-black text-[#13243f]">Gestion des signalements</h2>
                  <p className="mt-1 text-sm text-[#66758d]">Liste des signalements en attente de traitement.</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
                  {pendingReports.length} ouverts
                </span>
              </div>

              <div className="mt-6 grid gap-4">
                {!loading && pendingReports.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-[#d9e4f1] bg-[#fbfdff] px-5 py-8 text-sm text-[#6b7a90]">
                    Aucun signalement à traiter.
                  </div>
                )}

                {pendingReports.map((report) => (
                  <div key={report.id} className="rounded-2xl border border-[#e6edf6] bg-[#fbfdff] p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-[#13243f]">Signalement #{report.id}</h3>
                          <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#315ea8]">
                            {report.status || "pending"}
                          </span>
                        </div>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5f6f87]">
                          {report.description || report.message || report.reason || "Aucun détail fourni."}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleReportDecision(report.id, "resolve")}
                          disabled={actionLoading.type === "report" && actionLoading.id === report.id}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {actionLoading.type === "report" && actionLoading.id === report.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          Résoudre
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReportDecision(report.id, "dismiss")}
                          disabled={actionLoading.type === "report" && actionLoading.id === report.id}
                          className="inline-flex items-center gap-2 rounded-xl bg-slate-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {actionLoading.type === "report" && actionLoading.id === report.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
                          Ignorer
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                      <label className="block">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-[#6b7a90]">Note d'action</span>
                        <textarea
                          rows={3}
                          value={reportNoteById[report.id] || ""}
                          onChange={(event) => setReportNoteById((current) => ({ ...current, [report.id]: event.target.value }))}
                          className="w-full rounded-2xl border border-[#dce6f1] bg-white px-4 py-3 text-sm text-[#13243f] outline-none transition placeholder:text-[#a0afc1] focus:border-[#3b82f6]"
                          placeholder="Décris l'action prise ou le motif du rejet"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PlatformLayout>
  );
};

export default AdminDashboard;
