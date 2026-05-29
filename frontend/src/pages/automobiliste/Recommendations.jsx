import { Sparkles } from 'lucide-react';
import PlatformLayout from '../../components/PlatformLayout';

const Recommendations = () => {
  return (
    <PlatformLayout>
      <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(219,234,254,0.75),transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eef4fb_100%)] text-slate-900">
        <div className="absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="absolute right-[-5rem] top-[8rem] h-64 w-64 rounded-full bg-teal-300/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-blue-700 shadow-sm backdrop-blur">
                <Sparkles className="h-4 w-4" />
                Recommandations intelligentes
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Recommandations indisponibles
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Cette section a été désactivée. Utilisez la page garages pour consulter les ateliers disponibles.
              </p>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white/80 p-8 text-center shadow-sm backdrop-blur">
            <p className="text-sm text-slate-600">Les recommandations de garages ne sont plus affichées ici.</p>
          </div>
        </div>
      </div>
    </PlatformLayout>
  );
};

export default Recommendations;
