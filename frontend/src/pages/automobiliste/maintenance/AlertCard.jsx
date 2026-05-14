import { AlertTriangle, CheckCircle2, CalendarClock, Gauge, Wrench } from 'lucide-react';

const urgencyVariants = {
  urgent: {
    border: 'border-rose-200',
    bg: 'bg-[linear-gradient(135deg,rgba(255,241,242,0.96),rgba(255,255,255,0.98))]',
    badge: 'bg-rose-600 text-white',
    accent: 'text-rose-700',
    icon: AlertTriangle,
  },
  soon: {
    border: 'border-amber-200',
    bg: 'bg-[linear-gradient(135deg,rgba(255,251,235,0.96),rgba(255,255,255,0.98))]',
    badge: 'bg-amber-500 text-white',
    accent: 'text-amber-700',
    icon: AlertTriangle,
  },
  ok: {
    border: 'border-emerald-200',
    bg: 'bg-[linear-gradient(135deg,rgba(236,253,245,0.96),rgba(255,255,255,0.98))]',
    badge: 'bg-emerald-600 text-white',
    accent: 'text-emerald-700',
    icon: CheckCircle2,
  },
  future: {
    border: 'border-slate-200',
    bg: 'bg-[linear-gradient(135deg,rgba(248,250,252,0.96),rgba(255,255,255,0.98))]',
    badge: 'bg-slate-700 text-white',
    accent: 'text-slate-700',
    icon: Wrench,
  },
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const formatKm = (value) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  return `${Number(value).toLocaleString('fr-FR')} km`;
};

const StatCard = ({ icon: Icon, label, value, helper, tone = 'slate' }) => {
  const toneClass =
    tone === 'rose'
      ? 'bg-rose-50 text-rose-700 border-rose-100'
      : tone === 'amber'
        ? 'bg-amber-50 text-amber-700 border-amber-100'
        : tone === 'emerald'
          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
          : 'bg-slate-50 text-slate-700 border-slate-100';

  return (
    <div className={`rounded-3xl border p-4 ${toneClass}`}>
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-white/90 p-2 shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-70">{label}</p>
          <p className="mt-1 text-lg font-black text-slate-900">{value}</p>
        </div>
      </div>
      {helper && <p className="mt-2 text-xs font-medium text-slate-600">{helper}</p>}
    </div>
  );
};

const ProgressBar = ({ value, tone }) => {
  const width = Math.min(100, Math.max(0, Number(value) || 0));
  const progressClass =
    tone === 'rose'
      ? 'bg-rose-500'
      : tone === 'amber'
        ? 'bg-amber-500'
        : tone === 'emerald'
          ? 'bg-emerald-500'
          : 'bg-slate-500';

  return (
    <div className="mt-3 h-2 rounded-full bg-white/80">
      <div className={`h-2 rounded-full ${progressClass}`} style={{ width: `${width}%` }} />
    </div>
  );
};

const AlertCard = ({ vehicle, urgency, mileage, temporal, lastIntervention }) => {
  const variant = urgencyVariants[urgency?.level] || urgencyVariants.future;
  const Icon = variant.icon;

  return (
    <section className={`overflow-hidden rounded-[32px] border ${variant.border} ${variant.bg} shadow-[0_24px_60px_rgba(15,23,42,0.08)]`}>
      <div className="border-b border-white/70 px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.22em] ${variant.badge}`}>
                <Icon className="h-4 w-4" />
                Urgence maintenance: {urgency?.label || 'PLANIFIÉ'}
              </span>
              {vehicle?.modele_voiture && (
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-sm font-semibold text-slate-700">
                  {vehicle.modele_voiture}
                </span>
              )}
              {vehicle?.matricule_voiture && (
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-sm font-semibold text-slate-700">
                  {vehicle.matricule_voiture}
                </span>
              )}
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {urgency?.label || 'PLANIFIÉ'} - {urgency?.message || 'Suivi intelligent de votre véhicule'}
            </h2>
            <p className={`mt-3 max-w-2xl text-sm font-medium leading-7 ${variant.accent}`}>
              {urgency?.message || 'Le système analyse le kilométrage, la dernière intervention et les échéances pour anticiper la prochaine maintenance.'}
            </p>
          </div>

          <div className="rounded-[28px] border border-white/80 bg-white/75 p-5 shadow-sm backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Dernière intervention</p>
            <p className="mt-2 text-xl font-black text-slate-900">{lastIntervention?.type || 'Aucune intervention enregistrée'}</p>
            <p className="mt-1 text-sm font-medium text-slate-600">{formatDate(lastIntervention?.date)}</p>
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
              <div className="rounded-2xl bg-white p-2 shadow-sm">
                <CalendarClock className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Garage</p>
                <p className="text-sm font-semibold text-slate-800">{lastIntervention?.garageName || 'Non renseigné'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 px-5 py-5 sm:px-7 lg:grid-cols-3">
        <div className="rounded-[28px] border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur lg:col-span-2">
          <div className="grid gap-4 md:grid-cols-2">
            <StatCard
              icon={Gauge}
              label="État kilométrique"
              value={formatKm(mileage?.currentKm)}
              helper={`Prochain seuil: ${formatKm(mileage?.nextRevisionKm)}`}
              tone={urgency?.level === 'urgent' ? 'rose' : urgency?.level === 'soon' ? 'amber' : 'emerald'}
            />
            <StatCard
              icon={CalendarClock}
              label="État temporel"
              value={formatDate(temporal?.nextRevisionDate)}
              helper={`Dernière révision: ${formatDate(temporal?.lastInterventionDate)}`}
              tone={urgency?.level === 'urgent' ? 'rose' : urgency?.level === 'soon' ? 'amber' : 'emerald'}
            />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <div className="flex items-center justify-between text-sm font-medium text-slate-600">
                <span>Progression kilométrique</span>
                <span className="font-bold text-slate-900">{Number(mileage?.progressPercent || 0).toFixed(1)}%</span>
              </div>
              <ProgressBar value={mileage?.progressPercent} tone={urgency?.level === 'urgent' ? 'rose' : urgency?.level === 'soon' ? 'amber' : 'emerald'} />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm font-medium text-slate-600">
                <span>Progression temporelle</span>
                <span className="font-bold text-slate-900">{Number(temporal?.progressPercent || 0).toFixed(1)}%</span>
              </div>
              <ProgressBar value={temporal?.progressPercent} tone={urgency?.level === 'urgent' ? 'rose' : urgency?.level === 'soon' ? 'amber' : 'emerald'} />
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Prochaine révision</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{formatDate(temporal?.nextRevisionDate)}</p>
            </div>
            <div className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${variant.badge}`}>
              {urgency?.label || 'PLANIFIÉ'}
            </div>
          </div>
          <div className="mt-4 space-y-3 rounded-3xl bg-slate-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Km recommandés</span>
              <span className="font-bold text-slate-900">{formatKm(mileage?.kmRecommended)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Km restants</span>
              <span className="font-bold text-slate-900">{formatKm(mileage?.remainingKm)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Type véhicule</span>
              <span className="font-bold text-slate-900">{vehicle?.type_vehicule || 'Essence'}</span>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            {urgency?.message || 'Les calculs s’appuient sur la dernière intervention et la progression actuelle du véhicule.'}
          </p>
        </div>
      </div>
    </section>
  );
};

export default AlertCard;