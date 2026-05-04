import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import interventionsApi from '../../services/interventions';

const VehicleHistory = () => {
  const { vehicleId } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const data = await interventionsApi.listForVehicle(vehicleId, { page: 1, limit: 200 });
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
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
                  <div className="text-sm text-gray-600">{it.date_intervention}</div>
                </div>
                <div className="text-right">
                  <div>{it.garage_nom || '—'}</div>
                  <div className="text-sm text-gray-600">{it.kilometrage ? `${it.kilometrage} km` : ''}</div>
                </div>
              </div>
              <div className="mt-2">{it.description}</div>
              <div className="mt-3 flex gap-2 justify-end">
                <Link to={`/vehicules/${vehicleId}/interventions/${it.id}`} className="text-sm text-blue-600">Voir</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VehicleHistory;
