import dayjs from "dayjs";

const hoursRange = (start = 8, end = 18) => {
  const arr = [];
  for (let h = start; h <= end; h++) arr.push(h);
  return arr;
};

const formatHour = (h) => `${String(h).padStart(2, "0")}:00`;

const AppointmentAgenda = ({ date, items = [], onConfirm, onCancel }) => {
  const day = date ? dayjs(date) : dayjs();
  const slots = hoursRange();

  // group items by hour (floor appointment_time to hour)
  const itemsByHour = items.reduce((acc, item) => {
    const time = item.appointment_time || "";
    const hour = time ? Number(time.split(":")[0]) : null;
    const key = Number.isFinite(hour) ? hour : -1;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">Agenda journalier</p>
          <h3 className="text-lg font-black text-slate-900">{day.format("dddd D MMMM YYYY")}</h3>
        </div>
        <div className="text-sm text-slate-600">{items.length} RDV</div>
      </div>

      <div className="space-y-2">
        {slots.map((h) => (
          <div key={h} className="flex items-start gap-3">
            <div className="w-20 text-sm font-semibold text-slate-600">{formatHour(h)}</div>
            <div className="flex-1 space-y-2">
              {(itemsByHour[h] || []).length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400">Libre</div>
              ) : (
                (itemsByHour[h] || []).map((it) => (
                  <div key={it.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900">{it.appointment_time || "-"} â€” {it.description || "Rendez-vous"}</div>
                        <div className="mt-1 text-sm text-slate-600">Automobiliste: {it.automobiliste_name || it.automobiliste_user_id}</div>
                        <div className="text-sm text-slate-600">Garage: {it.garage_name || it.garage_id}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`rounded-full px-3 py-1 text-xs font-bold ${it.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : it.status === 'cancelled' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{it.status || 'pending'}</div>
                        <div className="flex gap-2">
                          <button onClick={() => onConfirm?.(it.id)} className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs">Valider</button>
                          <button onClick={() => onCancel?.(it.id)} className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs">Refuser</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppointmentAgenda;


