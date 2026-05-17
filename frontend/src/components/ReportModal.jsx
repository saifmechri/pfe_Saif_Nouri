import React, { useState } from "react";
import { submitReport } from "../services/reports";

/**
 * ReportModal Component
 * Allows users to submit reports for garages, reviews, or other entities
 * 
 * Props:
 * - isOpen (bool): Whether the modal is visible
 * - onClose (func): Callback to close the modal
 * - entityType (string): Type of entity being reported ('garage', 'review', 'user', etc.)
 * - entityId (number): ID of the entity being reported
 * - entityName (string): Name/description of the entity (for display)
 * - onSuccess (func): Optional callback after successful submission
 */
const ReportModal = ({ isOpen, onClose, entityType, entityId, entityName, onSuccess }) => {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!reason.trim()) {
        setError("Veuillez sélectionner une raison");
        setLoading(false);
        return;
      }

      await submitReport(entityType, entityId, reason, details);
      setSuccess(true);
      setReason("");
      setDetails("");
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Erreur lors de l'envoi du signalement";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setReason("");
      setDetails("");
      setError("");
      setSuccess(false);
      onClose();
    }
  };

  const reasonOptions = [
    { value: "spam", label: "Spam ou contenu répétitif" },
    { value: "insulte", label: "Insulte ou contenu offensant" },
    { value: "fraude", label: "Fraude ou arnaque" },
    { value: "faux", label: "Information fausse" },
    { value: "inapproprie", label: "Contenu inapproprié" },
    { value: "autre", label: "Autre raison" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
        >
          ❌
        </button>

        {/* Success State */}
        {success ? (
          <div className="text-center">
            <div className="mb-4 text-5xl">✅</div>
            <h3 className="mb-2 text-xl font-bold text-green-600">Merci!</h3>
            <p className="text-gray-600">
              Votre signalement a été envoyé à nos modérateurs.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <h2 className="mb-2 text-2xl font-bold text-[#1a2b4b]">
              Signaler un problème
            </h2>
            <p className="mb-4 text-sm text-gray-600">
              Aidez-nous à maintenir une communauté saine
              {entityName && <span>: <strong>{entityName}</strong></span>}
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Reason Selection */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Raison du signalement *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                >
                  <option value="">-- Sélectionnez une raison --</option>
                  {reasonOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Details */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Détails supplémentaires (optionnel)
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  disabled={loading}
                  placeholder="Décrivez le problème en détail..."
                  rows={4}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Envoi..." : "Envoyer le signalement"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportModal;


