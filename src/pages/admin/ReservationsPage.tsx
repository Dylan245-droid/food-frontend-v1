// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Phone, Plus, Trash2, CheckCircle, MapPin, AlertTriangle, ChevronRight, Loader2, MessageSquare, History } from 'lucide-react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface TableType {
  id: number;
  name: string;
  capacity: number;
  zone: string | null;
}

interface ReservationType {
  id: string;
  customerName: string;
  customerPhone: string;
  guests: number;
  date: string;
  time: string;
  status: string;
  source: string;
  notes: string | null;
  tableId: number | null;
  table?: TableType;
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<ReservationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '', customerPhone: '', guests: 2,
    date: new Date().toISOString().split('T')[0],
    time: '19:00', notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationType | null>(null);
  const [availableTables, setAvailableTables] = useState<TableType[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);

  useEffect(() => { fetchReservations(); }, []);

  const fetchReservations = async () => {
    try {
      const res = await api.get('/admin/reservations');
      setReservations(res.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/reservations', { ...formData, status: 'confirmed', source: 'phone' });
      setIsModalOpen(false);
      setFormData({ customerName: '', customerPhone: '', guests: 2, date: new Date().toISOString().split('T')[0], time: '19:00', notes: '' });
      fetchReservations();
      toast.success("Réservation confirmée");
    } catch { toast.error('Erreur lors de la création'); }
    finally { setSubmitting(false); }
  };

  const handleSeatClick = async (reservation: ReservationType) => {
    setSelectedReservation(reservation);
    setLoadingTables(true);
    setIsTableModalOpen(true);
    try {
      const res = await api.get(`/admin/reservations/available-tables?guests=${reservation.guests}`);
      setAvailableTables(res.data);
    } catch { setAvailableTables([]); }
    finally { setLoadingTables(false); }
  };

  const handleAssignTable = async (tableId: number) => {
    if (!selectedReservation) return;
    try {
      await api.patch(`/admin/reservations/${selectedReservation.id}/status`, { status: 'seated', tableId });
      setIsTableModalOpen(false);
      setSelectedReservation(null);
      fetchReservations();
      toast.success("Client installé !");
    } catch (error: any) { toast.error(error.response?.data?.message || 'Erreur'); }
  };

  const updateStatus = async (id: string, status: string) => {
    if (!confirm('Changer le statut ?')) return;
    try {
      await api.patch(`/admin/reservations/${id}/status`, { status });
      fetchReservations();
      toast.success("Statut mis à jour");
    } catch { toast.error('Erreur'); }
  };

  if (loading && reservations.length === 0) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="w-10 h-10 text-stone-200 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-6 bg-white p-5 md:p-8 rounded-[2.5rem] border border-stone-100 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-30 pointer-events-none"></div>

        <div className="flex items-center gap-4 md:gap-6 relative z-10 text-left">
          <div className="bg-stone-900 p-3 md:p-4 rounded-2xl text-white shadow-2xl shadow-stone-200 shrink-0">
            <Calendar className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-2xl md:text-3xl font-black text-stone-900 tracking-tight leading-none uppercase">Réservations</h1>
            <p className="text-stone-400 text-xs md:text-sm font-bold mt-2 truncate tracking-wide uppercase">
              {reservations.filter(r => r.status !== 'cancelled').length} actives • Planning de salle
            </p>
          </div>
        </div>

        <div className="flex gap-2 relative z-10 shrink-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="h-14 px-8 bg-stone-900 hover:bg-black text-white shadow-xl shadow-stone-100 rounded-2xl font-black uppercase tracking-widest text-[10px] items-center justify-center gap-3 transition-all active:scale-95 flex flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Réservation</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Main Column - Active Reservations */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Flux en attente / À installer
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reservations.filter(r => ['pending', 'confirmed'].includes(r.status)).length === 0 ? (
              <div className="md:col-span-2 py-20 text-center bg-stone-50/50 rounded-[2.5rem] border-2 border-dashed border-stone-100">
                <Calendar className="w-12 h-12 text-stone-200 mx-auto mb-4 opacity-50" />
                <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest italic">Aucune réservation pour le moment</p>
              </div>
            ) : (
              reservations.filter(r => ['pending', 'confirmed'].includes(r.status)).map((r, idx) => (
                <div
                  key={r.id}
                  className="group bg-white rounded-[2rem] p-6 border border-stone-100 shadow-sm hover:shadow-2xl hover:shadow-stone-200/50 hover:-translate-y-1 transition-all duration-500 relative flex flex-col animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-stone-50 rounded-full -mr-12 -mt-12 transition-colors group-hover:bg-stone-100"></div>

                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="min-w-0">
                      <h4 className="font-black text-stone-900 text-lg uppercase tracking-tight truncate leading-tight">{r.customerName}</h4>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="bg-stone-900 text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{r.time}</div>
                        <div className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">{new Date(r.date).toLocaleDateString('fr-FR')}</div>
                      </div>
                    </div>
                    <div className={cn(
                      "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm",
                      r.source === 'web' ? "bg-orange-500 text-white" : "bg-stone-100 text-stone-500"
                    )}>
                      {r.source === 'web' ? 'Online' : 'Phone'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                    <div className="bg-stone-50 rounded-2xl p-3 border border-stone-100/50 flex flex-col items-center justify-center text-center gap-1">
                      <Users className="w-3 h-3 text-stone-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-stone-900">{r.guests} Pers</span>
                    </div>
                    <div className="bg-stone-50 rounded-2xl p-3 border border-stone-100/50 flex flex-col items-center justify-center text-center gap-1">
                      <Phone className="w-3 h-3 text-stone-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-stone-900 truncate w-full">{r.customerPhone}</span>
                    </div>
                  </div>

                  {r.notes && (
                    <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50 mb-6 relative z-10 flex gap-3">
                      <MessageSquare className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-900 font-bold leading-relaxed">{r.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2 relative z-10 mt-auto pt-2">
                    <button
                      onClick={() => handleSeatClick(r)}
                      className="flex-1 bg-stone-900 text-white h-12 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-stone-100"
                    >
                      <MapPin className="w-3 h-3 text-orange-400" />
                      Installer
                    </button>
                    <button
                      onClick={() => updateStatus(r.id, 'cancelled')}
                      className="w-12 h-12 bg-stone-50 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-xl flex items-center justify-center active:scale-95 transition-all transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar - Seated & History */}
        <div className="lg:col-span-4 space-y-8">

          {/* Seated Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-2">
              <CheckCircle className="w-4 h-4 text-stone-900" />
              Clients Installés
            </h3>
            <div className="space-y-4">
              {reservations.filter(r => r.status === 'seated').length === 0 ? (
                <div className="py-10 text-center bg-stone-50/30 rounded-3xl border border-stone-100 border-dashed">
                  <p className="text-[9px] font-black text-stone-300 uppercase tracking-widest">En attente des premières arrivées</p>
                </div>
              ) : (
                reservations.filter(r => r.status === 'seated').map(r => (
                  <div key={r.id} className="bg-white p-5 rounded-[2rem] border border-stone-100 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-all">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-full -mr-8 -mt-8 opacity-40"></div>
                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <h4 className="font-black text-stone-900 text-sm uppercase tracking-tight">{r.customerName}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-black text-stone-300 uppercase tracking-widest">{r.guests} Pers</span>
                          <span className="text-[9px] font-black text-stone-300 uppercase tracking-widest">•</span>
                          <span className="text-[9px] font-black text-stone-300 uppercase tracking-widest">{r.time}</span>
                        </div>
                      </div>
                      <div className="bg-emerald-600 px-3 py-1.5 rounded-xl text-[10px] font-black text-white flex items-center gap-2 shadow-lg shadow-emerald-100">
                        <MapPin className="w-3 h-3" />
                        {r.table?.name || 'T?'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* History Link / Compact Section */}
          <div className="bg-stone-900 p-6 md:p-8 rounded-[2.5rem] shadow-2xl shadow-stone-200 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-stone-800 to-transparent opacity-50"></div>
            <div className="relative z-10">
              <History className="w-8 h-8 text-stone-500 mb-6 group-hover:text-white transition-colors" />
              <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 leading-none">Historique</h3>
              <p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest leading-loose mb-6">Voir les réservations passées et les annulations.</p>
              <button className="w-full h-12 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[9px] font-black uppercase tracking-widest backdrop-blur-md transition-all">
                Consulter les Archives
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* New Reservation Modal - Premium Style */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouvelle Réservation">
        <form onSubmit={handleCreate} className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="NOM DU CLIENT"
              value={formData.customerName}
              onChange={e => setFormData({ ...formData, customerName: e.target.value })}
              required
              className="h-14 font-black uppercase tracking-widest text-xs"
            />
            <Input
              label="TÉLÉPHONE / CONTACT"
              value={formData.customerPhone}
              onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
              required
              className="h-14 font-black uppercase tracking-widest text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="DATE"
              type="date"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              required
              className="h-14 font-black uppercase tracking-widest text-xs"
            />
            <Input
              label="HEURE"
              type="time"
              value={formData.time}
              onChange={e => setFormData({ ...formData, time: e.target.value })}
              required
              className="h-14 font-black uppercase tracking-widest text-xs"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">NOMBRE DE COUVERTS</label>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 4, 6, 8].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setFormData({ ...formData, guests: n })}
                  className={cn(
                    "h-12 rounded-xl text-xs font-black transition-all",
                    formData.guests === n ? "bg-stone-900 text-white shadow-lg" : "bg-stone-50 text-stone-400 hover:bg-stone-100"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">NOTES PARTICULIÈRES</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full bg-stone-50 rounded-2xl border-none focus:ring-4 focus:ring-stone-100 font-bold text-xs p-5 transition-all resize-none"
              placeholder="Allergies, anniversaire, table préférée..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 h-16 bg-stone-50 text-stone-400 rounded-px-2xl rounded-2xl font-black uppercase tracking-widest text-[100x] text-[10px]">
              Annuler
            </button>
            <button type="submit" disabled={submitting} className="flex-1 h-16 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-stone-200 flex items-center justify-center gap-3">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              Confirmer
            </button>
          </div>
        </form>
      </Modal>

      {/* Table Selection Modal - Premium Grid */}
      <Modal
        isOpen={isTableModalOpen}
        onClose={() => { setIsTableModalOpen(false); setSelectedReservation(null); }}
        title={`Placement Client`}
      >
        <div className="space-y-6 pt-4">
          {selectedReservation && (
            <div className="bg-stone-900 p-6 rounded-[2rem] text-white flex justify-between items-center shadow-2xl shadow-stone-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 backdrop-blur-xl"></div>
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-1">Cibles Disponibles</p>
                <h4 className="text-lg font-black uppercase tracking-tight">{selectedReservation.customerName}</h4>
              </div>
              <div className="relative z-10 text-right">
                <div className="text-xl font-black text-orange-400 leading-none">{selectedReservation.guests}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-stone-500 mt-1">Personnes</div>
              </div>
            </div>
          )}

          {loadingTables ? (
            <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-stone-200" /></div>
          ) : availableTables.length === 0 ? (
            <div className="bg-red-50/50 border border-red-100 rounded-[2rem] p-10 text-center animate-in zoom-in-95">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="font-black text-red-900 uppercase tracking-tight text-lg mb-2">Complet ou Incompatible</p>
              <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest leading-loose">
                Aucune table de {selectedReservation?.guests}+ places n'est libre pour le moment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {availableTables.map((table, idx) => (
                <button
                  key={table.id}
                  onClick={() => handleAssignTable(table.id)}
                  className="group p-6 bg-white border border-stone-100 rounded-[2rem] hover:border-stone-900 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left relative overflow-hidden animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-stone-50 rounded-full -mr-8 -mt-8 transition-colors group-hover:bg-stone-100"></div>
                  <div className="relative z-10">
                    <div className="text-2xl font-black text-stone-900 font-display mb-1">{table.name}</div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-stone-300" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">{table.capacity} places</span>
                    </div>
                    {table.zone && (
                      <div className="mt-4 inline-block bg-stone-50 px-2 py-1 rounded-lg text-[9px] font-black text-stone-400 uppercase tracking-widest group-hover:bg-stone-900 group-hover:text-white transition-colors">{table.zone}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
