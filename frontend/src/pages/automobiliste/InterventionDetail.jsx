import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import interventionsApi from '../../services/interventions';

const InterventionDetail = () => {
  const { vehicleId, id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  const fetch = async () => {
    setLoading(true);
    try {
      const data = await interventionsApi.getById(vehicleId, id);
      setItem(data);
      setForm({
        date_intervention: data.date_intervention || '',
        type: data.type || '',
        description: data.description || '',
        garage_nom: data.garage_nom || '',
        garage_adresse: data.garage_adresse || '',
        kilometrage: data.kilometrage || '',
        cout_total: data.cout_total || ''
      });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [vehicleId, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await interventionsApi.update(vehicleId, id, form);
      setEditing(false);
      await fetch();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Erreur lors de la mise a jour');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Supprimer cette intervention ?')) return;
    try {
      await interventionsApi.remove(vehicleId, id);
      navigate(`/vehicules/${vehicleId}/history`);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Erreur lors de la suppression');
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;
  if (!item) return <div>Intervention introuvable</div>;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Intervention #{item.id}</h2>
        <div className="flex gap-2">
          {!editing && (
            <button onClick={() => setEditing(true)} className="btn btn-primary">Modifier</button>
          )}
          <button onClick={handleDelete} className="btn btn-danger">Supprimer</button>
        </div>
      </div>

      {!editing ? (
        <div className="mt-4 space-y-2">
          <div><strong>Date:</strong> {item.date_intervention}</div>
          <div><strong>Type:</strong> {item.type}</div>
          <div><strong>Garage:</strong> {item.garage_nom} — {item.garage_adresse}</div>
          <div><strong>Kilométrage:</strong> {item.kilometrage ? `${item.kilometrage} km` : '—'}</div>
          <div><strong>Coût:</strong> {item.cout_total ? `${item.cout_total} ` : '—'}</div>
          <div><strong>Description:</strong><div className="mt-1 whitespace-pre-wrap">{item.description}</div></div>
        </div>
      ) : (
        <div className="mt-4 space-y-3 max-w-xl">
          <label className="block">
            <div className="text-sm">Date intervention</div>
            <input name="date_intervention" value={form.date_intervention} onChange={handleChange} type="date" className="input" />
          </label>
          <label className="block">
            <div className="text-sm">Type</div>
            <input name="type" value={form.type} onChange={handleChange} className="input" />
          </label>
          <label className="block">
            <div className="text-sm">Garage</div>
            <input name="garage_nom" value={form.garage_nom} onChange={handleChange} className="input" />
          </label>
          <label className="block">
            <div className="text-sm">Adresse garage</div>
            <input name="garage_adresse" value={form.garage_adresse} onChange={handleChange} className="input" />
          </label>
          <label className="block">
            <div className="text-sm">Kilométrage</div>
            <input name="kilometrage" value={form.kilometrage} onChange={handleChange} type="number" className="input" />
          </label>
          <label className="block">
            <div className="text-sm">Coût total</div>
            <input name="cout_total" value={form.cout_total} onChange={handleChange} type="number" step="0.01" className="input" />
          </label>
          <label className="block">
            <div className="text-sm">Description</div>
            <textarea name="description" value={form.description} onChange={handleChange} className="input" rows={6} />
          </label>

          <div className="flex gap-2">
            <button onClick={handleSave} className="btn btn-primary">Enregistrer</button>
            <button onClick={() => setEditing(false)} className="btn">Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterventionDetail;
