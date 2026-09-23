'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar as CalIcon } from 'lucide-react';
import { Calendar, Views } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

const locales = { fr };
const localizer = dateFnsLocalizer({
  format: (date: Date, fmt: string) => format(date, fmt, { locale: fr }),
  parse,
  startOfWeek: (date: Date) => startOfWeek(date || new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// Tout en 24 h et en français (les libellés par défaut sont en anglais 12 h)
const CAL_FORMATS = {
  timeGutterFormat: 'HH:mm',
  eventTimeRangeFormat: ({ start, end }: any) => `${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`,
  selectRangeFormat: ({ start, end }: any) => `${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`,
  dayFormat: (d: Date) => format(d, 'EEE d', { locale: fr }),
  weekdayFormat: (d: Date) => format(d, 'EEEE', { locale: fr }),
  monthHeaderFormat: (d: Date) => format(d, 'MMMM yyyy', { locale: fr }),
  dayHeaderFormat: (d: Date) => format(d, 'EEEE d MMMM', { locale: fr }),
  dayRangeHeaderFormat: ({ start, end }: any) =>
    `${format(start, 'd MMM', { locale: fr })} – ${format(end, 'd MMM yyyy', { locale: fr })}`,
  agendaTimeFormat: 'HH:mm',
};

const STATUS_COLOR: Record<string, string> = {
  VISIO_PLANIFIEE: '#8B5CF6',
  DEVIS_ENVOYE: '#F59E0B',
  DEVIS_SIGNE: '#10B981',
  INTERESSE: '#3B82F6',
};

/** Contenu d'un événement : heure + entreprise, sur deux lignes lisibles. */
function EventContent({ event }: any) {
  return (
    <div style={{ lineHeight: 1.25, overflow: 'hidden' }}>
      <div style={{ fontWeight: 700, fontSize: 10, opacity: 0.85 }}>{format(new Date(event.start), 'HH:mm')}</div>
      <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.company}</div>
    </div>
  );
}
const DnDCalendar = withDragAndDrop(Calendar as any) as any;

interface CalendarSectionProps {
  calEvents: any[];
  setCalEvents: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function CalendarSection({ calEvents, setCalEvents }: CalendarSectionProps) {
  const [calView, setCalView] = useState<'month' | 'week'>('month');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editNote, setEditNote] = useState('');
  const [savingCal, setSavingCal] = useState(false);

  function openEventEdit(e: any) {
    setSelectedEvent(e);
    const d = new Date(e.start);
    setEditDate(d.toISOString().split('T')[0]);
    setEditTime(d.toTimeString().slice(0, 5));
    setEditNote(e.note || '');
  }

  async function saveEventEdit() {
    if (!selectedEvent) return;
    setSavingCal(true);
    const newDate = new Date(`${editDate}T${editTime || '09:00'}:00`); // fuseau du navigateur
    await fetch(`/api/pilotage/prospects/${selectedEvent.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rdvDate: newDate.toISOString(), note: editNote || undefined }),
    });
    setCalEvents(prev => prev.map(ev => ev.id === selectedEvent.id ? { ...ev, start: newDate, end: new Date(newDate.getTime() + 3600000), note: editNote } : ev));
    setSelectedEvent(null);
    setSavingCal(false);
  }

  async function deleteEventRdv() {
    if (!selectedEvent || !confirm('Supprimer ce RDV ?')) return;
    setSavingCal(true);
    await fetch(`/api/pilotage/prospects/${selectedEvent.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rdvDate: null, status: 'INTERESSE' }),
    });
    setCalEvents(prev => prev.filter(ev => ev.id !== selectedEvent.id));
    setSelectedEvent(null);
    setSavingCal(false);
  }

  async function handleEventDrop({ event, start }: any) {
    const newStart = new Date(start);
    await fetch(`/api/pilotage/prospects/${event.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rdvDate: newStart.toISOString() }),
    });
    setCalEvents(prev => prev.map(ev => ev.id === event.id ? { ...ev, start: newStart, end: new Date(newStart.getTime() + 3600000) } : ev));
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#E2E8F0', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CalIcon size={16} /> Calendrier des rendez-vous
        </h2>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['month', 'week'] as const).map(v => (
            <button key={v} onClick={() => setCalView(v)} style={{
              padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 500, border: 'none', cursor: 'pointer',
              background: calView === v ? '#3B82F6' : '#1E293B', color: calView === v ? '#fff' : '#64748B',
            }}>{v === 'month' ? 'Mois' : 'Semaine'}</button>
          ))}
        </div>
      </div>
      <div style={{ background: '#1E293B', borderRadius: 10, border: '1px solid #334155', padding: 16, position: 'relative' }}>
        <style>{`
          .rbc-calendar { color: #E2E8F0; font-size: 12px; }
          .rbc-header { background: #0F172A; border-color: #334155 !important; padding: 6px; font-weight: 500; color: #94A3B8; }
          .rbc-month-view, .rbc-time-view { border-color: #334155; }
          .rbc-day-bg { background: #1E293B; }
          .rbc-off-range-bg { background: #0F172A; }
          .rbc-today { background: rgba(59,130,246,0.08) !important; }
          .rbc-event { background: #8B5CF6 !important; border: none !important; border-radius: 4px; font-size: 11px; padding: 2px 4px; }
          .rbc-event.signed { background: #10B981 !important; }
          .rbc-toolbar { margin-bottom: 12px; }
          .rbc-toolbar button { color: #94A3B8; background: #0F172A; border: 1px solid #334155; font-size: 12px; border-radius: 5px; }
          .rbc-toolbar button:hover, .rbc-toolbar button.rbc-active { background: #334155; color: #E2E8F0; }
          .rbc-month-row + .rbc-month-row { border-color: #334155; }
          .rbc-day-bg + .rbc-day-bg { border-color: #334155; }
          .rbc-date-cell { padding: 4px 6px; color: #64748B; font-size: 11px; }
          .rbc-date-cell.rbc-now { color: #3B82F6; font-weight: 700; }
          .rbc-show-more { color: #3B82F6; font-size: 11px; }
          .rbc-time-content, .rbc-time-header-content { border-color: #334155; }
          .rbc-timeslot-group { border-color: #334155; min-height: 44px; }
          .rbc-time-slot { color: #64748B; font-size: 10px; border-color: rgba(51,65,85,0.5); }
          .rbc-label { color: #94A3B8; font-size: 11px; font-variant-numeric: tabular-nums; }
          .rbc-allday-cell { display: none; }
          .rbc-time-header.rbc-overflowing { border-color: #334155; }
          /* Événements : un peu d'air, pas de superposition illisible */
          .rbc-event { box-shadow: 0 1px 3px rgba(0,0,0,0.35); }
          .rbc-event-label { display: none; }
          .rbc-day-slot .rbc-event { border: 1px solid rgba(15,23,42,0.6) !important; padding: 3px 5px; min-height: 30px; }
          .rbc-day-slot .rbc-events-container { margin-right: 6px; }
          .rbc-month-view .rbc-event { margin-bottom: 2px; }
          .rbc-row-segment { padding: 0 2px 1px; }
          /* Week-end grisé, aujourd'hui mis en avant */
          .rbc-time-header-cell .rbc-header { text-transform: capitalize; }
          .rbc-header.rbc-today { color: #3B82F6; }
          .rbc-current-time-indicator { background: #EF4444; height: 2px; }
          .rbc-overlay { background: #0F172A; border: 1px solid #334155; border-radius: 8px; padding: 8px; }
          .rbc-overlay-header { color: #94A3B8; border-color: #334155; }
        `}</style>
        {calEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748B', fontSize: 13 }}>Aucun rendez-vous planifié</div>
        ) : (
          <div style={{ height: calView === 'week' ? 560 : 'clamp(340px, 55vh, 520px)' }}>
            <DnDCalendar
              localizer={localizer}
              culture="fr"
              formats={CAL_FORMATS}
              events={calEvents}
              view={calView}
              onView={(v: any) => setCalView(v)}
              views={[Views.MONTH, Views.WEEK]}
              startAccessor="start"
              endAccessor="end"
              selectable
              popup
              step={30}
              timeslots={1}
              min={new Date(1970, 0, 1, 7, 0)}
              max={new Date(1970, 0, 1, 21, 0)}
              scrollToTime={new Date(1970, 0, 1, 8, 0)}
              dayLayoutAlgorithm="no-overlap"
              components={{ event: EventContent }}
              tooltipAccessor={(e: any) => `${format(new Date(e.start), 'HH:mm')} — ${e.company}${e.contact ? ' · ' + e.contact : ''}${e.missionName ? ' · ' + e.missionName : ''}`}
              onSelectEvent={(e: any) => openEventEdit(e)}
              onEventDrop={handleEventDrop}
              draggableAccessor={() => true}
              eventPropGetter={(e: any) => ({
                style: {
                  cursor: 'grab',
                  background: STATUS_COLOR[e.status] || '#8B5CF6',
                  borderLeft: `3px solid ${STATUS_COLOR[e.status] || '#8B5CF6'}`,
                  filter: 'brightness(1.05)',
                },
              })}
              messages={{
                next: '→', previous: '←', today: "Aujourd'hui", month: 'Mois', week: 'Semaine',
                noEventsInRange: 'Aucun rendez-vous sur cette période', showMore: (n: number) => `+${n} autre${n > 1 ? 's' : ''}`,
              }}
            />
          </div>
        )}
        {selectedEvent && (
          <div style={{ position: 'absolute', top: 60, right: 16, width: 300, maxWidth: 'calc(100vw - 48px)', background: '#0F172A', border: '1px solid #334155', borderRadius: 10, padding: 16, zIndex: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0' }}>{selectedEvent.company}</span>
              <button onClick={() => setSelectedEvent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: 16 }}>×</button>
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 12 }}>
              <span>{selectedEvent.missionName}</span>
              {selectedEvent.contact && <span> · {selectedEvent.contact}</span>}
              {selectedEvent.phone && <> · <a href={`tel:${selectedEvent.phone}`} style={{ color: '#3B82F6', textDecoration: 'none' }}>{selectedEvent.phone}</a></>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 10, color: '#94A3B8', marginBottom: 3 }}>Date</label>
                  <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
                    style={{ width: '100%', padding: '5px 6px', borderRadius: 5, border: '1px solid #334155', background: '#1E293B', color: '#E2E8F0', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ width: 90 }}>
                  <label style={{ display: 'block', fontSize: 10, color: '#94A3B8', marginBottom: 3 }}>Heure</label>
                  <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)}
                    style={{ width: '100%', padding: '5px 6px', borderRadius: 5, border: '1px solid #334155', background: '#1E293B', color: '#E2E8F0', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, color: '#94A3B8', marginBottom: 3 }}>Note</label>
                <input type="text" value={editNote} onChange={e => setEditNote(e.target.value)} placeholder="Note..."
                  style={{ width: '100%', padding: '5px 6px', borderRadius: 5, border: '1px solid #334155', background: '#1E293B', color: '#E2E8F0', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={saveEventEdit} disabled={savingCal} style={{
                flex: 1, padding: '6px 10px', borderRadius: 6, background: '#3B82F6', color: '#fff', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', opacity: savingCal ? 0.5 : 1,
              }}>{savingCal ? '...' : 'Enregistrer'}</button>
              <button onClick={deleteEventRdv} disabled={savingCal} style={{
                padding: '6px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.15)', color: '#EF4444', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
              }}>Supprimer RDV</button>
            </div>
            <Link href={`/pilotage/missions/${selectedEvent.missionId}`} style={{
              display: 'block', marginTop: 8, textAlign: 'center', padding: '5px 10px', borderRadius: 6,
              background: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontSize: 11, fontWeight: 500, textDecoration: 'none',
            }}>Voir la mission</Link>
          </div>
        )}
      </div>
    </>
  );
}
