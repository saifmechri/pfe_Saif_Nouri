import dayjs from "dayjs";
import "dayjs/locale/fr";

dayjs.locale("fr");

const weekdayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const toDateKey = (value) => {
  if (!value) return "";

  const parsed = dayjs(value);
  if (!parsed.isValid()) return "";

  return parsed.format("YYYY-MM-DD");
};

const getMonthGrid = (month) => {
  const startOfMonth = month.startOf("month");
  const mondayOffset = (startOfMonth.day() + 6) % 7;
  const gridStart = startOfMonth.subtract(mondayOffset, "day");

  return Array.from({ length: 42 }, (_, index) => gridStart.add(index, "day"));
};

const AppointmentCalendar = ({
  items = [],
  selectedDate = "",
  onSelectDate,
  getItemDate,
  getItemStatus,
  getItemLabel,
  title = "Calendrier"
}) => {
  const currentMonth = selectedDate ? dayjs(selectedDate).startOf("month") : dayjs().startOf("month");
  const monthGrid = getMonthGrid(currentMonth);

  const itemsByDate = items.reduce((accumulator, item) => {
    const key = toDateKey(getItemDate(item));
    if (!key) return accumulator;

    if (!accumulator[key]) {
      accumulator[key] = [];
    }

    accumulator[key].push(item);
    return accumulator;
  }, {});

  const selectedKey = toDateKey(selectedDate);
  const selectedItems = selectedKey ? itemsByDate[selectedKey] || [] : [];

  const goToPreviousMonth = () => {
    const nextMonth = currentMonth.subtract(1, "month");
    onSelectDate?.(nextMonth.startOf("month").format("YYYY-MM-DD"));
  };

  const goToNextMonth = () => {
    const nextMonth = currentMonth.add(1, "month");
    onSelectDate?.(nextMonth.startOf("month").format("YYYY-MM-DD"));
  };

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4 border-b border-slate-100 bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_100%)] px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-100/80">Vue mensuelle</p>
          <h3 className="mt-1 text-2xl font-black tracking-tight">{title}</h3>
          <p className="mt-1 text-sm text-blue-100/90">Cliquez un jour pour filtrer les rendez-vous.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 p-1 backdrop-blur">
          <button type="button" onClick={goToPreviousMonth} className="rounded-full px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/15">
            PrÃ©c.
          </button>
          <div className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-900">
            {currentMonth.format("MMMM YYYY")}
          </div>
          <button type="button" onClick={goToNextMonth} className="rounded-full px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/15">
            Suiv.
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-slate-100 text-center text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
        {weekdayLabels.map((label) => (
          <div key={label} className="bg-white px-2 py-3">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-slate-100">
        {monthGrid.map((day) => {
          const dateKey = day.format("YYYY-MM-DD");
          const isCurrentMonth = day.month() === currentMonth.month();
          const isToday = day.isSame(dayjs(), "day");
          const isSelected = selectedKey === dateKey;
          const dayItems = itemsByDate[dateKey] || [];

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDate?.(dateKey)}
              className={`min-h-[124px] bg-white p-3 text-left transition hover:bg-blue-50 ${isCurrentMonth ? "text-slate-900" : "text-slate-300"} ${isSelected ? "ring-2 ring-inset ring-blue-500" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold ${isToday ? "bg-slate-900 text-white" : isSelected ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"}`}>
                  {day.date()}
                </span>
                {dayItems.length > 0 && (
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                    {dayItems.length}
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-1.5">
                {dayItems.slice(0, 3).map((item) => {
                  const status = String(getItemStatus?.(item) || "pending").toLowerCase();
                  const statusClasses =
                    status === "confirmed"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : status === "cancelled"
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : "border-amber-200 bg-amber-50 text-amber-700";

                  return (
                    <div key={item.id} className={`rounded-xl border px-2 py-1 text-[11px] font-semibold ${statusClasses}`}>
                      {getItemLabel?.(item) || "Rendez-vous"}
                    </div>
                  );
                })}
                {dayItems.length > 3 && (
                  <div className="text-[11px] font-semibold text-slate-400">+{dayItems.length - 3} autres</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">Confirmé</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">En attente</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700">Refusé / annulé</span>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Jour sélectionné</p>
              <h4 className="text-lg font-black text-slate-900">{selectedKey || "Aucun jour sélectionné"}</h4>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">{selectedItems.length} RDV</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppointmentCalendar;


