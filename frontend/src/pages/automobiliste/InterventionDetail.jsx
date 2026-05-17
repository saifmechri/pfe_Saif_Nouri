import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Save, X } from 'lucide-react';
import interventionsApi from '../../services/interventions';
import { getPieces } from '../../services/pieces';

const extractPieces = (response) => {
  const payload = response?.data?.data ?? response?.data ?? response ?? {};
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const InterventionDetail = () => {
  const { vehicleId, id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [availablePieces, setAvailablePieces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [piecesLoading, setPiecesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [pieceForm, setPieceForm] = useState({ pieceId: '', quantite: '1', prix_unitaire: '' });
  const [pieceActionLoading, setPieceActionLoading] = useState(false);
  const [pieceActionError, setPieceActionError] = useState(null);

  const loadIntervention = async () => {
    setLoading(true);
    setError(null);
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

  const loadAvailablePieces = async () => {
    setPiecesLoading(true);
    try {
      const response = await getPieces({ page: 1, limit: 500, sortBy: 'created_at', sortOrder: 'desc' });
      const pieces = extractPieces(response).filter((piece) => Number(piece.stock ?? 0) > 0);
      setAvailablePieces(pieces);
    } catch (err) {
      setAvailablePieces([]);
    } finally {
      setPiecesLoading(false);
    }
  };

  useEffect(() => {
    loadIntervention();
    loadAvailablePieces();
  }, [vehicleId, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const resetFormFromItem = () => {
    if (!item) return;
    setForm({
      date_intervention: item.date_intervention || '',
      type: item.type || '',
      description: item.description || '',
      garage_nom: item.garage_nom || '',
      garage_adresse: item.garage_adresse || '',
      kilometrage: item.kilometrage || '',
      cout_total: item.cout_total || ''
    });
  };

  const handleSave = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await interventionsApi.update(vehicleId, id, form);
      setEditing(false);
      await loadIntervention();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Erreur lors de la mise a jour');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    resetFormFromItem();
    setEditing(false);
  };

  const refreshIntervention = async () => {
    await loadIntervention();
  };

  const handlePieceSelectionChange = (event) => {
    const { name, value } = event.target;
    setPieceForm((current) => ({ ...current, [name]: value }));
  };

  const handleAddPiece = async () => {
    if (!pieceForm.pieceId) {
      setPieceActionError('SÃ©lectionnez une pièce.');
      return;
    }

    const quantite = Number.parseInt(pieceForm.quantite, 10);
    if (!Number.isInteger(quantite) || quantite <= 0) {
      setPieceActionError('La quantitÃ© doit être supÃ©rieure ou Ã©gale Ã  1.');
      return;
    }

    setPieceActionLoading(true);
    setPieceActionError(null);
    try {
      const payload = {
        pieceId: Number(pieceForm.pieceId),
        quantite
      };

      if (pieceForm.prix_unitaire !== '') {
        payload.prix_unitaire = Number(pieceForm.prix_unitaire);
      }

      const updated = await interventionsApi.addPiece(vehicleId, id, payload);
      setItem(updated);
      setPieceForm({ pieceId: '', quantite: '1', prix_unitaire: '' });
      await refreshIntervention();
    } catch (err) {
      setPieceActionError(err?.response?.data?.message || err.message || 'Erreur lors de lâ€™ajout de la pièce');
    } finally {
      setPieceActionLoading(false);
    }
  };

  const handleRemovePiece = async (pieceId) => {
    setPieceActionLoading(true);
    setPieceActionError(null);
    try {
      const updated = await interventionsApi.removePiece(vehicleId, id, pieceId);
      setItem(updated);
      await refreshIntervention();
    } catch (err) {
      setPieceActionError(err?.response?.data?.message || err.message || 'Erreur lors de la suppression de la pièce');
    } finally {
      setPieceActionLoading(false);
    }
  };

  const currentPieces = Array.isArray(item?.pieces) ? item.pieces : [];

  const formatDate = (value) => {
    if (!value) return 'â€”';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return value;
    return dt.toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-[#f4f7fc] p-4 md:p-8">
        <div className="mx-auto max-w-5xl animate-pulse rounded-2xl border border-[#dbe4f2] bg-white p-6 shadow-sm">
          <div className="h-7 w-56 rounded bg-slate-200" />
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="h-20 rounded bg-slate-100" />
            <div className="h-20 rounded bg-slate-100" />
            <div className="h-20 rounded bg-slate-100" />
            <div className="h-20 rounded bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-[70vh] bg-[#f4f7fc] p-4 md:p-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#f6d6d6] bg-[#fff6f6] p-6 text-[#8b1d1d] shadow-sm">
          Intervention introuvable.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-[#f4f7fc] p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <Link
          to={`/vehicules/${vehicleId}/history`}
          className="inline-flex items-center gap-2 rounded-lg border border-[#d6deeb] bg-white px-3 py-2 text-sm font-semibold text-[#153563] hover:bg-[#f3f7ff]"
        >
          <ArrowLeft size={16} />
          Retour Ã  l'historique
        </Link>

        <section className="overflow-hidden rounded-2xl border border-[#dbe4f2] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#e8eef8] bg-gradient-to-r from-[#eef4ff] to-[#f7fbff] p-5 md:flex-row md:items-center md:justify-between md:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#4f6f9c]">Fiche intervention</p>
              <h2 className="mt-1 text-2xl font-bold text-[#102848]">Intervention #{item.id}</h2>
              <p className="mt-1 text-sm text-[#5d7397]">Consultez et modifiez les détails de maintenance.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!editing && (
                <button
                  onClick={() => {
                    resetFormFromItem();
                    setEditing(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#c8d8f5] bg-[#eaf2ff] px-4 py-2 text-sm font-semibold text-[#144a9f] hover:bg-[#dfebff]"
                >
                  <Pencil size={16} />
                  Modifier
                </button>
              )}

            </div>
          </div>

          {error && (
            <div className="mx-5 mt-5 rounded-lg border border-[#f6d2d2] bg-[#fff6f6] px-4 py-3 text-sm text-[#8f1f1f] md:mx-6">
              {error}
            </div>
          )}

          {!editing ? (
            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 md:gap-5 md:p-6">
              <div className="rounded-xl border border-[#e2eaf6] bg-[#f9fbff] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#5a6f91]">Date intervention</p>
                <p className="mt-2 text-lg font-semibold text-[#102848]">{formatDate(item.date_intervention)}</p>
              </div>

              <div className="rounded-xl border border-[#e2eaf6] bg-[#f9fbff] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#5a6f91]">Type</p>
                <p className="mt-2 text-lg font-semibold capitalize text-[#102848]">{item.type || 'â€”'}</p>
              </div>

              <div className="rounded-xl border border-[#e2eaf6] bg-[#f9fbff] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#5a6f91]">Garage</p>
                <p className="mt-2 text-lg font-semibold text-[#102848]">{item.garage_nom || 'â€”'}</p>
                <p className="mt-1 text-sm text-[#5d7397]">{item.garage_adresse || 'Adresse non renseignÃ©e'}</p>
              </div>

              <div className="rounded-xl border border-[#e2eaf6] bg-[#f9fbff] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#5a6f91]">Kilométrage</p>
                <p className="mt-2 text-lg font-semibold text-[#102848]">{item.kilometrage ? `${item.kilometrage} km` : 'â€”'}</p>
              </div>

              <div className="rounded-xl border border-[#e2eaf6] bg-[#f9fbff] p-4 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#5a6f91]">CoÃ»t total</p>
                <p className="mt-2 text-lg font-semibold text-[#102848]">{item.cout_total ? `${item.cout_total} TND` : 'â€”'}</p>
              </div>

              <div className="rounded-xl border border-[#e2eaf6] bg-[#f9fbff] p-4 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#5a6f91]">Description</p>
                <p className="mt-2 whitespace-pre-wrap text-[#1f3558]">{item.description || 'Aucune description.'}</p>
              </div>

              <div className="rounded-xl border border-[#e2eaf6] bg-[#f9fbff] p-4 md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#5a6f91]">Pièces utilisées</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {currentPieces.length > 0 ? (
                    currentPieces.map((piece) => (
                      <div
                        key={piece.id || `${piece.reference || piece.nom}-${piece.quantite}`}
                        className="flex items-center gap-2 rounded-full border border-[#cfd9ea] bg-white px-3 py-1 text-sm text-[#1f3558]"
                      >
                        <span className="font-medium">{piece.nom || piece.reference || 'Pièce'}</span>
                        {piece.quantite ? <span className="text-[#5d7397]">x{piece.quantite}</span> : null}
                        {editing ? (
                          <button
                            type="button"
                            onClick={() => handleRemovePiece(piece.id)}
                            disabled={pieceActionLoading}
                            className="ml-1 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-60"
                          >
                            Retirer
                          </button>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#5d7397]">Aucune pièce associÃ©e Ã  cette intervention.</p>
                  )}
                </div>

                {editing ? (
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                    <label className="block md:col-span-2">
                      <span className="mb-1 block text-sm font-medium text-[#1a355e]">Choisir une pièce</span>
                      <select
                        name="pieceId"
                        value={pieceForm.pieceId}
                        onChange={handlePieceSelectionChange}
                        className="w-full rounded-lg border border-[#cfd9ea] bg-white px-3 py-2 text-[#0f2747] outline-none transition focus:border-[#1d4ed8] focus:ring-4 focus:ring-[#1d4ed826]"
                        disabled={piecesLoading}
                      >
                        <option value="">{piecesLoading ? 'Chargement des pièces...' : 'SÃ©lectionnez une pièce'}</option>
                        {availablePieces.map((piece) => (
                          <option key={piece.id} value={piece.id}>
                            {piece.nom || piece.reference || `Pièce #${piece.id}`} {piece.reference ? `(${piece.reference})` : ''}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-[#1a355e]">QuantitÃ©</span>
                      <input
                        name="quantite"
                        value={pieceForm.quantite}
                        onChange={handlePieceSelectionChange}
                        type="number"
                        min="1"
                        className="w-full rounded-lg border border-[#cfd9ea] bg-white px-3 py-2 text-[#0f2747] outline-none transition focus:border-[#1d4ed8] focus:ring-4 focus:ring-[#1d4ed826]"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-[#1a355e]">Prix unitaire</span>
                      <input
                        name="prix_unitaire"
                        value={pieceForm.prix_unitaire}
                        onChange={handlePieceSelectionChange}
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full rounded-lg border border-[#cfd9ea] bg-white px-3 py-2 text-[#0f2747] outline-none transition focus:border-[#1d4ed8] focus:ring-4 focus:ring-[#1d4ed826]"
                      />
                    </label>

                    <div className="md:col-span-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddPiece}
                        disabled={pieceActionLoading || piecesLoading}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115e59] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {pieceActionLoading ? 'Ajout...' : 'Ajouter la pièce'}
                      </button>
                      <span className="text-xs text-[#5d7397]">
                        Les pièces affichées sont filtrÃ©es sur le stock disponible.
                      </span>
                    </div>
                  </div>
                ) : null}

                {pieceActionError ? (
                  <div className="mt-3 rounded-lg border border-[#f6d2d2] bg-[#fff6f6] px-4 py-3 text-sm text-[#8f1f1f]">
                    {pieceActionError}
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="p-5 md:p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[#1a355e]">Date intervention</span>
                  <input
                    name="date_intervention"
                    value={form.date_intervention}
                    onChange={handleChange}
                    type="date"
                    className="w-full rounded-lg border border-[#cfd9ea] bg-white px-3 py-2 text-[#0f2747] outline-none transition focus:border-[#1d4ed8] focus:ring-4 focus:ring-[#1d4ed826]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[#1a355e]">Type</span>
                  <input
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-[#cfd9ea] bg-white px-3 py-2 text-[#0f2747] outline-none transition focus:border-[#1d4ed8] focus:ring-4 focus:ring-[#1d4ed826]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[#1a355e]">Garage</span>
                  <input
                    name="garage_nom"
                    value={form.garage_nom}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-[#cfd9ea] bg-white px-3 py-2 text-[#0f2747] outline-none transition focus:border-[#1d4ed8] focus:ring-4 focus:ring-[#1d4ed826]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[#1a355e]">Adresse garage</span>
                  <input
                    name="garage_adresse"
                    value={form.garage_adresse}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-[#cfd9ea] bg-white px-3 py-2 text-[#0f2747] outline-none transition focus:border-[#1d4ed8] focus:ring-4 focus:ring-[#1d4ed826]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[#1a355e]">Kilométrage</span>
                  <input
                    name="kilometrage"
                    value={form.kilometrage}
                    onChange={handleChange}
                    type="number"
                    className="w-full rounded-lg border border-[#cfd9ea] bg-white px-3 py-2 text-[#0f2747] outline-none transition focus:border-[#1d4ed8] focus:ring-4 focus:ring-[#1d4ed826]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[#1a355e]">CoÃ»t total</span>
                  <input
                    name="cout_total"
                    value={form.cout_total}
                    onChange={handleChange}
                    type="number"
                    step="0.01"
                    className="w-full rounded-lg border border-[#cfd9ea] bg-white px-3 py-2 text-[#0f2747] outline-none transition focus:border-[#1d4ed8] focus:ring-4 focus:ring-[#1d4ed826]"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-1 block text-sm font-medium text-[#1a355e]">Description</span>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={5}
                    className="w-full rounded-lg border border-[#cfd9ea] bg-white px-3 py-2 text-[#0f2747] outline-none transition focus:border-[#1d4ed8] focus:ring-4 focus:ring-[#1d4ed826]"
                  />
                </label>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173ea9] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Save size={16} />
                  {submitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>

                <button
                  onClick={handleCancelEdit}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#d2dceb] bg-white px-4 py-2 text-sm font-semibold text-[#16375f] hover:bg-[#f5f8fe] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <X size={16} />
                  Annuler
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default InterventionDetail;


