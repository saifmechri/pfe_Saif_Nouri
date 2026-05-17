import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import interventionsApi from '../../services/interventions';

const formatDate = (value) => {
  if (!value) return 'â€”';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleDateString('fr-FR');
};

const VehicleHistory = () => {
  const { vehicleId } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await interventionsApi.listForVehicle(vehicleId, { page: 1, limit: 200 });
      const normalizedItems = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.data)
            ? data.data
            : [];
      setItems(normalizedItems);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [vehicleId]);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Historique interventions</h2>
      {items.length === 0 ? (
        <div>Aucune intervention enregistrée pour ce véhicule.</div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.id} className="border rounded p-3 bg-white shadow-sm">
              <div className="flex justify-between">
                <div>
                  <div className="font-medium">{it.type}</div>
                  <div className="text-sm text-gray-600">{formatDate(it.date_intervention)}</div>
                </div>
                <div className="text-right">
                  <div>{it.garage_nom || 'â€”'}</div>
                  <div className="text-sm text-gray-600">{it.kilometrage ? `${it.kilometrage} km` : ''}</div>
                </div>
              </div>
              <div className="mt-2">{it.description}</div>
              <div className="mt-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pièces utilisées</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Array.isArray(it.pieces) && it.pieces.length > 0 ? (
                    it.pieces.map((piece) => (
                      <span
                        key={piece.id || `${piece.reference || piece.nom}-${piece.quantite}`}
                        className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                      >
                        {piece.nom || piece.reference || 'Pièce'}{piece.quantite ? ` x${piece.quantite}` : ''}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">Aucune pièce associée</span>
                  )}
                </div>
              </div>
              <div className="mt-3 flex gap-2 justify-end">
                <Link to={`/vehicules/${vehicleId}/interventions/${it.id}`} className="text-sm text-blue-600">Gérer les pièces</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VehicleHistory;


