import { ArrowRight, Clock, MapPin, Sparkles, Star } from 'lucide-react';

const availabilityTone = (isOpen) => (isOpen ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200');

const formatDistance = (value) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 'N/A';
  return `${parsed.toFixed(1)} km`;
};

const GarageChip = ({ children, tone = 'slate' }) => {
  const toneClass =
    tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : tone === 'amber'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : tone === 'blue'
          ? 'bg-blue-50 text-blue-700 border-blue-200'
          : 'bg-slate-100 text-slate-600 border-slate-200';

  return <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${toneClass}`}>{children}</span>;
};

const RecommendedGarages = ({ garages = [], onReserve }) => {
  return (
    <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#0f172a_0%,#0f766e_100%)] px-5 py-5 text-white">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-100/80">Recommandation intelligente</p>
        <h3 className="mt-1 text-2xl font-black tracking-tight">Garages recommandés</h3>
        <p className="mt-1 text-sm text-teal-50/90">Classement par distance GPS, rating, disponibilité et adéquation maintenance.</p>
      </div>

      <div className="space-y-4 bg-slate-50 px-5 py-5">
        {garages.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-6 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-3 text-base font-bold text-slate-900">Aucun garage ne correspond Ã  cette session</p>
            <p className="mt-1 text-sm text-slate-500">Essayez d’élargir la zone de distance ou vérifiez les garages actifs.</p>
          </div>
        ) : (
          garages.map((garage, index) => (
            <article key={garage.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-lg font-black text-slate-950">{garage.name}</h4>
                    {index === 0 && <GarageChip tone="emerald">Top 1</GarageChip>}
                    {garage.bestMatch && <GarageChip tone="blue">Best match</GarageChip>}
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                    <MapPin className="h-4 w-4" />
                    <span>{garage.address || 'Adresse non renseignée'}</span>
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-black text-slate-900">{Number(garage.score || 0).toFixed(0)}</p>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">/100</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <Star className="h-4 w-4 text-amber-500" />
                    Rating
                  </div>
                  <p className="mt-2 text-xl font-black text-slate-950">{Number(garage.rating || 0).toFixed(1)} / 5</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <Clock className="h-4 w-4 text-slate-700" />
                    Disponibilité
                  </div>
                  <p className={`mt-2 inline-flex rounded-full border px-3 py-1 text-sm font-black ${availabilityTone(garage.isOpen)}`}>
                    {garage.isOpen ? 'Ouvert' : 'Fermé'}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <GarageChip tone="amber">{formatDistance(garage.distance)}</GarageChip>
                {garage.specialties?.slice?.(0, 2)?.map((item) => (
                  <GarageChip key={`${garage.id}-${item}`} tone="emerald">{item}</GarageChip>
                ))}
                {garage.maintenanceLabels?.slice?.(0, 2)?.map((item) => (
                  <GarageChip key={`${garage.id}-m-${item}`} tone="blue">{item}</GarageChip>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Réservation recommandée</p>
                <button
                  type="button"
                  onClick={() => onReserve?.(garage)}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Réserver
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
};

export default RecommendedGarages;

