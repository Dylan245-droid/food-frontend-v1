import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Phone, Plus, Trash2, CheckCircle, MapPin, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    guests: 2,
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Table Selection Modal
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ReservationType | null>(null);
  const [availableTables, setAvailableTables] = useState<TableType[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const res = await api.get('/admin/reservations');
      setReservations(res.data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/reservations', {
        ...formData,
        status: 'confirmed',
        source: 'phone'
      });
      setIsModalOpen(false);
      setFormData({
        customerName: '',
        customerPhone: '',
        guests: 2,
        date: new Date().toISOString().split('T')[0],
        time: '19:00',
        notes: ''
      });
      fetchReservations();
    } catch (error) {
      alert('Erreur lors de la création de la réservation');
    } finally {
      setSubmitting(false);
    }
  };

  // Open table selection modal
  const handleSeatClick = async (reservation: ReservationType) => {
    setSelectedReservation(reservation);
    setLoadingTables(true);
    setIsTableModalOpen(true);

    try {
      const res = await api.get(`/admin/reservations/available-tables?guests=${reservation.guests}`);
      setAvailableTables(res.data);
    } catch (error) {
      console.error('Error fetching tables:', error);
      setAvailableTables([]);
    } finally {
      setLoadingTables(false);
    }
  };

  // Assign table and seat
  const handleAssignTable = async (tableId: number) => {
    if (!selectedReservation) return;

    try {
      await api.patch(`/admin/reservations/${selectedReservation.id}/status`, {
        status: 'seated',
        tableId
      });
      setIsTableModalOpen(false);
      setSelectedReservation(null);
      fetchReservations();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de l\'installation');
    }
  };

  const updateStatus = async (id: string, status: string) => {
    if (!confirm('Changer le statut de cette réservation ?')) return;
    try {
      await api.patch(`/admin/reservations/${id}/status`, { status });
      fetchReservations();
    } catch (e) {
      alert('Erreur update status');
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20 px-4 md:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-6 md:p-8 rounded-[2rem] border border-stone-100 shadow-sm relative overflow-hidden group">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 relative z-10 w-full xs:w-auto">
          <div className="bg-stone-900 p-3 rounded-2xl text-white shadow-xl shadow-stone-100 shrink-0 self-start md:self-center">
            <Calendar className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl md:text-3xl font-black text-stone-900 flex items-center gap-2 uppercase tracking-tight font-display leading-tight">
              <span className="truncate">Réservations</span>
            </h1>
            <p className="text-stone-400 text-xs md:text-sm font-bold mt-1 md:mt-2 truncate">Gerez les réservations (Téléphone, Web, etc.)</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto shrink-0 relative z-10">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none h-11 md:h-14 px-6 md:px-8 bg-stone-900 hover:bg-black text-white shadow-xl shadow-stone-200 rounded-2xl font-bold uppercase tracking-wider text-[10px] md:text-xs active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Nouvelle Réservation</span>
            <span className="sm:hidden">Nouvelle</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {/* Incoming / Pending */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-orange-100">
            <div className="bg-orange-50 p-1.5 rounded-lg text-orange-600">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="font-black text-orange-600 text-sm uppercase tracking-wider">À Venir / En Attente</h3>
            <span className="ml-auto bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {reservations.filter((r) => ['pending', 'confirmed'].includes(r.status)).length}
            </span>
          </div>

          {reservations.filter((r) => ['pending', 'confirmed'].includes(r.status)).length === 0 && (
            <div className="py-8 text-center bg-white/50 rounded-2xl border border-dashed border-stone-200">
              <p className="text-stone-400 text-xs font-bold italic">Aucune réservation à venir.</p>
            </div>
          )}

          {reservations.filter((r) => ['pending', 'confirmed'].includes(r.status)).map((r) => (
            <div key={r.id} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 rounded-full -mr-8 -mt-8 opacity-50"></div>

              <div className="flex justify-between items-start mb-3 relative z-10">
                <div className="min-w-0">
                  <h4 className="font-black text-stone-900 text-lg leading-tight truncate">{r.customerName}</h4>
                  <div className="flex items-center text-stone-400 text-[10px] font-bold mt-0.5">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(r.date).toLocaleDateString('fr-FR')} à {r.time}
                  </div>
                </div>
                <span className={`shrink-0 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm ${r.source === 'web' ? 'bg-blue-500 text-white' : 'bg-stone-100 text-stone-600'}`}>
                  {r.source === 'web' ? 'WEB' : 'TEL'}
                </span>
              </div>

              <div className="space-y-2 mb-4 relative z-10">
                <div className="flex items-center text-stone-600 text-xs font-medium">
                  <div className="w-6 h-6 rounded-lg bg-stone-50 flex items-center justify-center mr-2">
                    <Phone className="w-3 h-3 text-stone-400" />
                  </div>
                  {r.customerPhone}
                </div>
                <div className="flex items-center text-stone-600 text-xs font-medium">
                  <div className="w-6 h-6 rounded-lg bg-stone-50 flex items-center justify-center mr-2">
                    <Users className="w-3 h-3 text-stone-400" />
                  </div>
                  <span className="font-black text-stone-800 mr-1">{r.guests}</span> personnes
                </div>
              </div>

              {r.notes && (
                <div className="bg-orange-50/50 p-2.5 rounded-xl text-[10px] text-orange-800 mb-4 border border-orange-100/50 italic leading-relaxed">
                  <span className="font-black not-italic mr-1">Note:</span> {r.notes}
                </div>
              )}

              <div className="flex gap-2 relative z-10">
                <button
                  onClick={() => handleSeatClick(r)}
                  className="flex-[2] bg-emerald-600 text-white py-2.5 rounded-xl hover:bg-emerald-700 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 active:scale-95 transition-all"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Installer
                </button>
                <button
                  onClick={() => updateStatus(r.id, 'cancelled')}
                  className="flex-1 bg-rose-50 text-rose-600 py-2.5 rounded-xl hover:bg-rose-100 text-[10px] font-black uppercase tracking-wider flex items-center justify-center active:scale-95 transition-all border border-rose-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Seated / Completed Today */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
            <div className="bg-emerald-50 p-1.5 rounded-lg text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
            <h3 className="font-black text-emerald-600 text-sm uppercase tracking-wider">Installés / Honorés</h3>
            <span className="ml-auto bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {reservations.filter((r) => r.status === 'seated').length}
            </span>
          </div>

          {reservations.filter((r) => r.status === 'seated').length === 0 && (
            <div className="py-8 text-center bg-white/50 rounded-2xl border border-dashed border-stone-200">
              <p className="text-stone-400 text-xs font-bold italic">Aucun client installé.</p>
            </div>
          )}

          {reservations.filter((r) => r.status === 'seated').map((r) => (
            <div key={r.id} className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-100 rounded-full -mr-6 -mt-6 opacity-30"></div>

              <div className="flex justify-between items-start mb-2 relative z-10">
                <h4 className="font-black text-emerald-900 text-base truncate">{r.customerName}</h4>
                <span className="text-[10px] font-black text-emerald-600 bg-white px-2 py-0.5 rounded-lg shadow-sm">{r.time}</span>
              </div>
              <p className="text-xs font-bold text-emerald-700/70 mb-3 relative z-10">{r.guests} personnes</p>

              {r.table && (
                <div className="relative z-10">
                  <div className="bg-emerald-600 px-3 py-1.5 rounded-xl text-[10px] font-black text-white inline-flex items-center gap-1.5 shadow-md shadow-emerald-100">
                    <MapPin className="w-3 h-3" />
                    {r.table.name}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Cancelled */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-rose-100">
            <div className="bg-rose-50 p-1.5 rounded-lg text-rose-600">
              <Trash2 className="w-4 h-4" />
            </div>
            <h3 className="font-black text-rose-600 text-sm uppercase tracking-wider">Annulées</h3>
            <span className="ml-auto bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {reservations.filter((r) => r.status === 'cancelled').length}
            </span>
          </div>

          {reservations.filter((r) => r.status === 'cancelled').length === 0 && (
            <div className="py-8 text-center bg-white/50 rounded-2xl border border-dashed border-stone-200">
              <p className="text-stone-400 text-xs font-bold italic">Aucune réservation annulée.</p>
            </div>
          )}

          {reservations.filter((r) => r.status === 'cancelled').map((r) => (
            <div key={r.id} className="bg-stone-50 p-4 rounded-2xl border border-stone-100 opacity-60 grayscale group">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-black text-stone-500 text-base line-through truncate">{r.customerName}</h4>
                <span className="text-[10px] font-bold text-stone-400">{r.time}</span>
              </div>
              <p className="text-xs font-bold text-stone-400 mb-1">{r.guests} personnes</p>
              <p className="text-[10px] font-medium text-stone-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(r.date).toLocaleDateString('fr-FR')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* New Reservation Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouvelle Réservation">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Nom Client"
            value={formData.customerName}
            onChange={e => setFormData({ ...formData, customerName: e.target.value })}
            required
          />
          <Input
            label="Téléphone"
            value={formData.customerPhone}
            onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              required
            />
            <Input
              label="Heure"
              type="time"
              value={formData.time}
              onChange={e => setFormData({ ...formData, time: e.target.value })}
              required
            />
          </div>
          <Input
            label="Nombre de personnes"
            type="number"
            min={1}
            value={formData.guests}
            onChange={e => setFormData({ ...formData, guests: parseInt(e.target.value) })}
            required
          />
          <Input
            label="Notes (Allergies, Préférences...)"
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
          />
          <Button type="submit" isLoading={submitting} className="w-full mt-4">
            Confirmer la Réservation
          </Button>
        </form>
      </Modal>

      {/* Table Selection Modal */}
      <Modal
        isOpen={isTableModalOpen}
        onClose={() => { setIsTableModalOpen(false); setSelectedReservation(null); }}
        title={`Installer ${selectedReservation?.customerName || ''}`}
      >
        <div className="space-y-4">
          {selectedReservation && (
            <div className="bg-stone-50 p-3 rounded-lg text-sm">
              <p><strong>{selectedReservation.guests} personnes</strong> - {selectedReservation.time}</p>
            </div>
          )}

          {loadingTables ? (
            <p className="text-center text-stone-500 py-4">Chargement des tables...</p>
          ) : availableTables.length === 0 ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="font-bold text-red-700">Aucune table disponible</p>
              <p className="text-sm text-red-600">
                Toutes les tables de {selectedReservation?.guests}+ places sont occupées.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {availableTables.map(table => (
                <button
                  key={table.id}
                  onClick={() => handleAssignTable(table.id)}
                  className="p-4 bg-white border-2 border-stone-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-left"
                >
                  <div className="font-bold text-lg">{table.name}</div>
                  <div className="text-sm text-stone-500 flex items-center gap-1">
                    <Users className="w-3 h-3" /> {table.capacity} places
                  </div>
                  {table.zone && (
                    <div className="text-xs text-stone-400 mt-1">{table.zone}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
