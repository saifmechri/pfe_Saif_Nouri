import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, ChevronLeft, ChevronRight, Eye, Download } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filtres
  const [filters, setFilters] = useState({
    action: '',
    entity: '',
    adminEmail: '',
    searchTerm: ''
  });
  
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Actions disponibles pour filtrage
  const actions = [
    'approve_user',
    'reject_user',
    'approve_garage',
    'reject_garage',
    'deactivate_garage',
    'delete_garage',
    'approve_piece',
    'reject_piece',
    'delete_piece'
  ];

  const entities = ['user', 'garage', 'piece'];

  // Format action name pour affichage
  const formatActionName = (action) => {
    const mapping = {
      'approve_user': '✅ Approuver Utilisateur',
      'reject_user': '❌ Rejeter Utilisateur',
      'approve_garage': '✅ Approuver Garage',
      'reject_garage': '❌ Rejeter Garage',
      'deactivate_garage': '⏸️ Désactiver Garage',
      'delete_garage': '🗑️ Supprimer Garage',
      'approve_piece': '✅ Approuver Pièce',
      'reject_piece': '❌ Rejeter Pièce',
      'delete_piece': '🗑️ Supprimer Pièce'
    };
    return mapping[action] || action;
  };

  // Format entity name
  const formatEntityName = (entity) => {
    const mapping = {
      'user': '👤 Utilisateur',
      'garage': '🏢 Garage',
      'piece': '🔧 Pièce'
    };
    return mapping[entity] || entity;
  };

  // Récupérer les logs
  useEffect(() => {
    fetchLogs();
  }, [page, limit, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      
      if (filters.action) params.append('action', filters.action);
      if (filters.entity) params.append('entity', filters.entity);
      if (filters.adminEmail) params.append('adminEmail', filters.adminEmail);

      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_BASE_URL}/admin/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success !== false) {
        setLogs(response.data.data?.items || []);
        setTotal(response.data.data?.meta?.total || 0);
        setTotalPages(response.data.data?.meta?.pages || 0);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({ action: '', entity: '', adminEmail: '', searchTerm: '' });
    setPage(1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Admin', 'Action', 'Entité', 'ID Entité', 'IP', 'Détails'];
    const rows = logs.map(log => [
      formatDate(log.created_at),
      log.admin_email || 'N/A',
      log.action,
      log.entity || 'N/A',
      log.entity_id || 'N/A',
      log.ip || 'N/A',
      log.details ? JSON.stringify(log.details) : 'N/A'
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">📋 Journal d'Audit</h1>
          <p className="text-slate-600">Suivi complèt des actions administratives critiques</p>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Filtres</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filter Action */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Action</label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Toutes les actions</option>
                {actions.map(action => (
                  <option key={action} value={action}>
                    {formatActionName(action)}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Entity */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Entité</label>
              <select
                value={filters.entity}
                onChange={(e) => handleFilterChange('entity', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Toutes les entités</option>
                {entities.map(entity => (
                  <option key={entity} value={entity}>
                    {formatEntityName(entity)}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Admin Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Admin Email</label>
              <input
                type="email"
                value={filters.adminEmail}
                onChange={(e) => handleFilterChange('adminEmail', e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Limit */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Résultats par page</label>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition font-medium"
            >
              Réinitialiser filtres
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Télécharger CSV
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <p className="text-slate-600 text-sm">Total des actions</p>
            <p className="text-2xl font-bold text-slate-900">{total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-emerald-500">
            <p className="text-slate-600 text-sm">Résultats affichés</p>
            <p className="text-2xl font-bold text-slate-900">{logs.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-amber-500">
            <p className="text-slate-600 text-sm">Page actuelle</p>
            <p className="text-2xl font-bold text-slate-900">{page} / {totalPages}</p>
          </div>
        </div>

        {/* Tableau des logs */}
        <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-slate-600 mt-2">Chargement des logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-600">Aucun log trouvé selon les critères de recherche</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Admin</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Entité</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">IP</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Détails</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {logs.map((log, idx) => (
                    <tr key={log.id || idx} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {log.admin_email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                          {formatActionName(log.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {log.entity ? (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
                            {formatEntityName(log.entity)}
                          </span>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                        {log.entity_id || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <code className="bg-slate-100 px-2 py-1 rounded text-xs">{log.ip || 'N/A'}</code>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {log.details && (
                          <button
                            onClick={() => {
                              setSelectedLog(log);
                              setShowDetails(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            Voir
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-6 py-4 bg-white rounded-lg shadow-md border border-slate-200">
            <div className="text-sm text-slate-600">
              Affichage de {(page - 1) * limit + 1} à {Math.min(page * limit, total)} sur {total} résultats
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => Math.abs(p - page) <= 1 || p === 1 || p === totalPages)
                  .map((p, i, arr) => (
                    <div key={p}>
                      {i > 0 && arr[i - 1] !== p - 1 && (
                        <span className="px-2 text-slate-400">...</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={`px-3 py-1 rounded-lg transition ${
                          page === p
                            ? 'bg-blue-600 text-white'
                            : 'border border-slate-300 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {p}
                      </button>
                    </div>
                  ))}
              </div>

              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Détails */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="sticky top-0 bg-slate-50 border-b border-slate-200 p-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Détails du Log</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-slate-500 hover:text-slate-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase">Action</p>
                  <p className="text-sm text-slate-900 font-medium">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase">Date</p>
                  <p className="text-sm text-slate-900 font-medium">{formatDate(selectedLog.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase">Admin Email</p>
                  <p className="text-sm text-slate-900 font-medium">{selectedLog.admin_email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase">Entité</p>
                  <p className="text-sm text-slate-900 font-medium">{selectedLog.entity || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase">ID Entité</p>
                  <p className="text-sm text-slate-900 font-mono">{selectedLog.entity_id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase">IP</p>
                  <p className="text-sm text-slate-900 font-mono">{selectedLog.ip || 'N/A'}</p>
                </div>
              </div>

              {selectedLog.user_agent && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-2">User Agent</p>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded break-all">
                    {selectedLog.user_agent}
                  </p>
                </div>
              )}

              {selectedLog.details && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-2">Détails</p>
                  <pre className="text-xs text-slate-700 bg-slate-50 p-3 rounded overflow-auto max-h-48">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
