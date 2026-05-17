import { useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

dayjs.locale('fr');

const weekdayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const toDateKey = (value) => {
  if (!value) return '';
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : '';
};

const buildMonthGrid = (month) => {
  const startOfMonth = month.startOf('month');
  const mondayOffset = (startOfMonth.day() + 6) % 7;
  const gridStart = startOfMonth.subtract(mondayOffset, 'day');

  return Array.from({ length: 42 }, (_, index) => gridStart.add(index, 'day'));
};

const statusPills = {
  URGENT: 'border-rose-200 bg-rose-50 text-rose-700',
  BIENTOT: 'border-amber-200 bg-amber-50 text-amber-700',
  NORMAL: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

const statusLabels = {
  URGENT: 'Urgent',
  BIENTOT: 'BientÃ´t',
  NORMAL: 'Normal',
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  return dayjs(value).locale('fr').format('DD MMM YYYY');
};

const MaintenanceCalendar = ({ items = [], selectedDate, onSelectDate, title = 'Planning des entretiens' }) => {
  const initialDate = selectedDate || items[0]?.date || dayjs().format('YYYY-MM-DD');
  const [currentMonthKey, setCurrentMonthKey] = useState(toDateKey(initialDate) || dayjs().format('YYYY-MM-DD'));

  const currentMonth = dayjs(currentMonthKey).startOf('month');
  const monthGrid = buildMonthGrid(currentMonth);

  const itemsByDate = items.reduce((accumulator, item) => {
    const key = toDateKey(item.date);
    if (!key) return accumulator;

    if (!accumulator[key]) {
      accumulator[key] = [];
    }

    accumulator[key].push(item);
    return accumulator;
  }, {});

  const selectedKey = toDateKey(selectedDate || initialDate);
  const selectedItems = selectedKey ? itemsByDate[selectedKey] || [] : [];
  const upcomingItems = [...items]
    .filter((item) => Boolean(item.date))
    .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf())
    .slice(0, 6);

  const goToPreviousMonth = () => {
    const previousMonth = currentMonth.subtract(1, 'month');
    const nextKey = previousMonth.startOf('month').format('YYYY-MM-DD');
    setCurrentMonthKey(nextKey);
    onSelectDate?.(nextKey);
  };

  const goToNextMonth = () => {
    const nextMonth = currentMonth.add(1, 'month');
    const nextKey = nextMonth.startOf('month').format('YYYY-MM-DD');
    setCurrentMonthKey(nextKey);
    onSelectDate?.(nextKey);
  };

  return (
    <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-4 border-b border-slate-100 bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_100%)] px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-100/80">Vue mensuelle</p>
          <h3 className="mt-1 text-2xl font-black tracking-tight">{title}</h3>
          <p className="mt-1 text-sm text-blue-100/90">Suivez les entretiens planifiÃ©s et les dates importantes du véhicule.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 p-1 backdrop-blur">
          <button type="button" onClick={goToPreviousMonth} className="rounded-full px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/15">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-900">
            {currentMonth.format('MMMM YYYY')}
          </div>
          <button type="button" onClick={goToNextMonth} className="rounded-full px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/15">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1.3fr_0.9fr]">
        <div>
          <div className="grid grid-cols-7 gap-px bg-slate-100 text-center text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            {weekdayLabels.map((label) => (
              <div key={label} className="bg-white px-2 py-3">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-slate-100">
            {monthGrid.map((day) => {
              const dateKey = day.format('YYYY-MM-DD');
              const isCurrentMonth = day.month() === currentMonth.month();
              const isToday = day.isSame(dayjs(), 'day');
              const isSelected = selectedKey === dateKey;
              const dayItems = itemsByDate[dateKey] || [];
              const visibleItem = dayItems[0];

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => onSelectDate?.(dateKey)}
                  className={`min-h-[128px] bg-white p-3 text-left transition hover:bg-blue-50 ${isCurrentMonth ? 'text-slate-900' : 'text-slate-300'} ${isSelected ? 'ring-2 ring-inset ring-blue-500' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold ${isToday ? 'bg-slate-900 text-white' : isSelected ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                      {day.date()}
                    </span>
                    {dayItems.length > 0 && (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                        {dayItems.length}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-1.5">
                    {visibleItem && (
                      <div className={`rounded-xl border px-2 py-1 text-[11px] font-semibold ${statusPills[visibleItem.status] || statusPills.NORMAL}`}>
                        {visibleItem.label}
                      </div>
                    )}
                    {dayItems.length > 1 && <div className="text-[11px] font-semibold text-slate-400">+{dayItems.length - 1} autres</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-5 py-5 xl:border-l xl:border-t-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Prochains entretiens</p>
              <h4 className="text-lg font-black text-slate-900">Les 6 prochaines Ã©chÃ©ances</h4>
            </div>
            <div className="rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-700">{upcomingItems.length}</div>
          </div>

          <div className="mt-4 space-y-3">
            {upcomingItems.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-5 text-sm text-slate-500">
                Aucune Ã©chÃ©ance planifiÃ©e pour le moment.
              </div>
            ) : (
              upcomingItems.map((item) => (
                <div key={`${item.id}-${item.label}`} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-900">{item.label}</p>
                      <p className="mt-1 text-xs font-medium text-slate-500">{formatDate(item.date)}</p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${statusPills[item.status] || statusPills.planned}`}>
                      {statusLabels[item.status] || item.status || 'Normal'}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                    {item.km !== null && item.km !== undefined && <span className="rounded-full bg-slate-100 px-3 py-1">{Number(item.km).toLocaleString('fr-FR')} km</span>}
                    {item.notes && <span className="rounded-full bg-slate-100 px-3 py-1">{item.notes}</span>}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Jour sélectionné</p>
                <h5 className="mt-1 text-base font-black text-slate-900">{selectedKey || 'Aucune date sélectionnée'}</h5>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">{selectedItems.length} entretien(s)</div>
            </div>
            <div className="mt-3 space-y-2">
              {selectedItems.length === 0 ? (
                <p className="text-sm text-slate-500">Cliquez sur un jour pour voir le détail des entretiens.</p>
              ) : (
                selectedItems.map((item) => (
                  <div key={`${item.id}-selected`} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                    {item.label}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">PlanifiÃ©</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">BientÃ´t</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700">Urgent</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MaintenanceCalendar;

