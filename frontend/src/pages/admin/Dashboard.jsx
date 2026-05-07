import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, RefreshCcw, ShieldAlert, Store, Package, TriangleAlert, Trash2, BarChart3, Users, CalendarRange, Award } from "lucide-react";
import PlatformLayout from "../../components/PlatformLayout";
import {
  dismissReport,
  getGarages,
  getPendingReports,
  getPieces,
  deleteGarage,
  deactivateGarage,
  deletePiece,
  resolveReport,
  approveGarage,
  rejectGarage,
  approvePiece,
  rejectPiece,
  getDashboardStats,
  getAuditLogs,
  getReportStats
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
  totalPieces: 0,
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
  const [garages, setGarages] = useState([]);
  const [pieces, setPieces] = useState([]);
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

    try {
      const [statsResponse, garagesResponse, piecesResponse, reportsResponse, reportStatsResponse] = await Promise.all([
        getDashboardStats(),
        getGarages(),
        getPieces(),
        getPendingReports(),
        getReportStats()
      ]);

      const statsData = statsResponse?.data?.data || statsResponse?.data || null;
      setDashboardStats(statsData);

      const garagesList = garagesResponse?.data?.data?.items || garagesResponse?.data?.items || garagesResponse?.data || [];
      const piecesList = piecesResponse?.data?.data?.items || piecesResponse?.data?.items || piecesResponse?.data || [];
      const reportsList = reportsResponse?.data?.data || reportsResponse?.data || [];
      const reportStats = reportStatsResponse?.data?.data || reportStatsResponse?.data || {};

      setGarages(Array.isArray(garagesList) ? garagesList : []);
      setPieces(Array.isArray(piecesList) ? piecesList : []);
      setPendingReports(Array.isArray(reportsList) ? reportsList : []);
      setCounts({
        totalGarages: Array.isArray(garagesList) ? garagesList.length : 0,
        totalPieces: Array.isArray(piecesList) ? piecesList.length : 0,
        pendingReports: Array.isArray(reportsList) ? reportsList.length : 0,
        resolvedReports: Number(reportStats.resolved || 0),
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
    { label: "Pièces", value: counts.totalPieces, icon: Package, tone: "from-purple-500 to-pink-500" },
    { label: "Signalements ouverts", value: counts.pendingReports, icon: TriangleAlert, tone: "from-amber-500 to-orange-500" },
    { label: "Signalements résolus", value: counts.resolvedReports, icon: CheckCircle2, tone: "from-emerald-500 to-teal-500" }
  ]), [counts]);

  const kpiCards = useMemo(() => ([
    { label: "Utilisateurs", value: counts.totalUsers, icon: Users, note: `${dashboardStats?.users?.pendingUsers || 0} en attente de profil`, tone: "from-sky-500 to-blue-600" },
    { label: "RDV total", value: counts.totalAppointments, icon: CalendarRange, note: `${dashboardStats?.appointments?.appointmentsLast30Days || 0} ces 30 derniers jours`, tone: "from-violet-500 to-fuchsia-600" },
    { label: "RDV en attente", value: counts.pendingAppointments, icon: TriangleAlert, note: `${dashboardStats?.appointments?.confirmedAppointments || 0} confirmés`, tone: "from-amber-500 to-orange-600" },
    { label: "Top garage", value: dashboardStats?.garages?.topGarages?.[0]?.appointmentsCount || 0, icon: Award, note: dashboardStats?.garages?.topGarages?.[0]?.name || "Aucun garage", tone: "from-emerald-500 to-teal-600" }
  ]), [counts, dashboardStats]);

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

  const handleGarageAction = async (garageId, action) => {
    setActionLoading({ type: "garage", id: garageId });
    setError("");

    try {
      if (action === "deactivate") {
        await deactivateGarage(garageId);
      } else if (action === "delete") {
        await deleteGarage(garageId);
      } else if (action === "approve") {
        await approveGarage(garageId);
      } else if (action === "reject") {
        await rejectGarage(garageId);
      }

      setGarages((current) => current.filter((garage) => garage.id !== garageId));
      setCounts((current) => ({ ...current, totalGarages: Math.max(0, current.totalGarages - 1) }));
    } catch (actionError) {
      setError(actionError?.response?.data?.message || "Action sur le garage impossible.");
    } finally {
      setActionLoading({ type: null, id: null });
    }
  };

  const handlePieceAction = async (pieceId, action) => {
    setActionLoading({ type: "piece", id: pieceId });
    setError("");

    try {
      if (action === "delete") {
        await deletePiece(pieceId);
      } else if (action === "approve") {
        await approvePiece(pieceId);
      } else if (action === "reject") {
        await rejectPiece(pieceId);
      }

      setPieces((current) => current.filter((piece) => piece.id !== pieceId));
      setCounts((current) => ({ ...current, totalPieces: Math.max(0, current.totalPieces - 1) }));
    } catch (actionError) {
      setError(actionError?.response?.data?.message || "Action sur la pièce impossible.");
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
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#64748b]">Dashboard admin</p>
                <h1 className="mt-2 text-3xl font-black text-[#13243f] md:text-4xl">Gestion du contenu et modération</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5f6f87]">
                  Consulter le dashboard global • Valider ou refuser les garages ajoutés • Valider ou refuser les pièces ajoutées • Supprimer ou désactiver du contenu • Gérer les signalements utilisateurs
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
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
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
              { key: "garages", label: "Garages" },
              { key: "pieces", label: "Pièces" },
              { key: "reports", label: "Signalements" },
              { key: "audit", label: "Journal (Audit)" },
              { key: "overview", label: "Vue globale" }
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
                <h2 className="text-xl font-black text-[#13243f]">Priorités du jour</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[#f3f7fd] p-4">
                    <p className="text-sm text-[#607089]">Garages à gérer</p>
                    <p className="mt-2 text-2xl font-black text-[#13243f]">{loading ? "..." : garages.length}</p>
                  </div>
                  <div className="rounded-2xl bg-[#fef6e8] p-4">
                    <p className="text-sm text-[#7a6330]">Signalements à traiter</p>
                    <p className="mt-2 text-2xl font-black text-[#13243f]">{loading ? "..." : pendingReports.length}</p>
                  </div>
                  <div className="rounded-2xl bg-[#f5f3ff] p-4">
                    <p className="text-sm text-[#6b5b95]">Pièces à gérer</p>
                    <p className="mt-2 text-2xl font-black text-[#13243f]">{loading ? "..." : pieces.length}</p>
                  </div>
                  <div className="rounded-2xl bg-[#f0fdf4] p-4">
                    <p className="text-sm text-[#347a34]">Actions rapides</p>
                    <p className="mt-2 text-sm text-[#5f6f87]">Gérer garages, pièces et signalements</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_18px_40px_rgba(26,43,75,0.08)] backdrop-blur">
                <h2 className="text-xl font-black text-[#13243f]">Guide rapide</h2>
                <div className="mt-5 space-y-3 text-sm text-[#5f6f87]">
                  <p>• Gérer les garages depuis l'onglet garages.</p>
                  <p>• Gérer les pièces depuis l'onglet pièces.</p>
                  <p>• Traiter les signalements via le tab signalements.</p>
                  <p>• Rafraîchir les données après chaque décision.</p>
                </div>
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
                  <div className="rounded-3xl border border-[#e7edf6] bg-[#fbfdff] p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-[#13243f]">Utilisateurs par rôle</h3>
                      <BarChart3 className="h-5 w-5 text-[#5b6b84]" />
                    </div>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
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

                  <div className="rounded-3xl border border-[#e7edf6] bg-[#fbfdff] p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-[#13243f]">RDV par statut</h3>
                      <CalendarRange className="h-5 w-5 text-[#5b6b84]" />
                    </div>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
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

                  <div className="rounded-3xl border border-[#e7edf6] bg-[#fbfdff] p-5 xl:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-bold text-[#13243f]">Top garages par nombre de RDV</h3>
                      <Award className="h-5 w-5 text-[#5b6b84]" />
                    </div>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
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

          {activeTab === "garages" && (
            <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_18px_40px_rgba(26,43,75,0.08)] backdrop-blur">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-black text-[#13243f]">Gestion des garages</h2>
                  <p className="mt-1 text-sm text-[#66758d]">Tous les garages ajoutés par les utilisateurs.</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                  {garages.length} garages
                </span>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-[#e6edf6]">
                <table className="min-w-full divide-y divide-[#e6edf6] text-left text-sm">
                  <thead className="bg-[#f8fbff] text-[#5f6f87]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Nom</th>
                      <th className="px-4 py-3 font-semibold">Adresse</th>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">Propriétaire</th>
                      <th className="px-4 py-3 font-semibold">Statut</th>
                      <th className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eef3f8] bg-white">
                    {!loading && garages.length === 0 && (
                      <tr>
                        <td className="px-4 py-6 text-[#6b7a90]" colSpan={6}>
                          Aucun garage pour le moment.
                        </td>
                      </tr>
                    )}
                    {garages.map((garage) => (
                      <tr key={garage.id} className="align-top hover:bg-[#f8fbff]">
                        <td className="px-4 py-4 font-semibold text-[#13243f]">{garage.name || "-"}</td>
                        <td className="px-4 py-4 text-[#5f6f87] text-xs">{garage.adresse || "-"}</td>
                        <td className="px-4 py-4 text-[#5f6f87] text-xs">{garage.email || "-"}</td>
                        <td className="px-4 py-4 text-[#5f6f87] text-xs">{garage.user_name || "-"}</td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${garage.is_open ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                            {garage.is_open ? "Actif" : "Inactif"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {garage.is_validated === false && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleGarageAction(garage.id, "approve")}
                                  disabled={actionLoading.type === "garage" && actionLoading.id === garage.id}
                                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                  {actionLoading.type === "garage" && actionLoading.id === garage.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                  Valider
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleGarageAction(garage.id, "reject")}
                                  disabled={actionLoading.type === "garage" && actionLoading.id === garage.id}
                                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                  {actionLoading.type === "garage" && actionLoading.id === garage.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                  Refuser
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => handleGarageAction(garage.id, "deactivate")}
                              disabled={actionLoading.type === "garage" && actionLoading.id === garage.id}
                              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {actionLoading.type === "garage" && actionLoading.id === garage.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
                              Désactiver
                            </button>
                            <button
                              type="button"
                              onClick={() => handleGarageAction(garage.id, "delete")}
                              disabled={actionLoading.type === "garage" && actionLoading.id === garage.id}
                              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {actionLoading.type === "garage" && actionLoading.id === garage.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
          )}

          {activeTab === "pieces" && (
            <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_18px_40px_rgba(26,43,75,0.08)] backdrop-blur">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-black text-[#13243f]">Gestion des pièces</h2>
                  <p className="mt-1 text-sm text-[#66758d]">Toutes les pièces ajoutées par les vendeurs.</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-purple-700">
                  {pieces.length} pièces
                </span>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-[#e6edf6]">
                <table className="min-w-full divide-y divide-[#e6edf6] text-left text-sm">
                  <thead className="bg-[#f8fbff] text-[#5f6f87]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Nom</th>
                      <th className="px-4 py-3 font-semibold">Référence</th>
                      <th className="px-4 py-3 font-semibold">Prix</th>
                      <th className="px-4 py-3 font-semibold">Stock</th>
                      <th className="px-4 py-3 font-semibold">Vendeur</th>
                      <th className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eef3f8] bg-white">
                    {!loading && pieces.length === 0 && (
                      <tr>
                        <td className="px-4 py-6 text-[#6b7a90]" colSpan={6}>
                          Aucune pièce pour le moment.
                        </td>
                      </tr>
                    )}
                    {pieces.map((piece) => (
                      <tr key={piece.id} className="align-top hover:bg-[#f8fbff]">
                        <td className="px-4 py-4 font-semibold text-[#13243f]">{piece.nom || "-"}</td>
                        <td className="px-4 py-4 text-[#5f6f87] text-xs">{piece.reference || "-"}</td>
                        <td className="px-4 py-4 text-[#5f6f87]">{piece.prix_unitaire ? `${piece.prix_unitaire} DT` : "-"}</td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${piece.stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                            {piece.stock || 0}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-[#5f6f87] text-xs">{piece.user_name || "-"}</td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => handlePieceAction(piece.id, "delete")}
                            disabled={actionLoading.type === "piece" && actionLoading.id === piece.id}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {actionLoading.type === "piece" && actionLoading.id === piece.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            Supprimer
                          </button>
                          {piece.is_validated === false && (
                            <div className="mt-2">
                              <button
                                type="button"
                                onClick={() => handlePieceAction(piece.id, "approve")}
                                disabled={actionLoading.type === "piece" && actionLoading.id === piece.id}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
                              >
                                {actionLoading.type === "piece" && actionLoading.id === piece.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                Valider
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePieceAction(piece.id, "reject")}
                                disabled={actionLoading.type === "piece" && actionLoading.id === piece.id}
                                className="inline-flex items-center gap-2 ml-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
                              >
                                {actionLoading.type === "piece" && actionLoading.id === piece.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                Refuser
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
