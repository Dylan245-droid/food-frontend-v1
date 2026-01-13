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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Réservations</h1>
          <p className="text-stone-500">Gérez les réservations (Téléphone, Web, etc.)</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Réservation
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Incoming / Pending */}
          <div className="space-y-4">
              <h3 className="font-bold text-orange-600 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  À Venir / En Attente
              </h3>
              {reservations.filter((r) => ['pending', 'confirmed'].includes(r.status)).length === 0 && (
                 <p className="text-stone-400 text-sm italic">Aucune réservation à venir.</p>
              )}
              {reservations.filter((r) => ['pending', 'confirmed'].includes(r.status)).map((r) => (
                  <div key={r.id} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-lg">{r.customerName}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${r.source === 'web' ? 'bg-blue-100 text-blue-700' : 'bg-stone-100 text-stone-700'}`}>
                              {r.source === 'web' ? 'WEB' : 'TEL'}
                          </span>
                      </div>
                      <div className="flex items-center text-stone-600 mb-1">
                          <Phone className="w-3 h-3 mr-2" /> {r.customerPhone}
                      </div>
                      <div className="flex items-center text-stone-600 mb-1">
                          <Users className="w-3 h-3 mr-2" /> {r.guests} pers.
                      </div>
                      <div className="flex items-center text-stone-800 font-medium mb-3">
                          <Calendar className="w-3 h-3 mr-2" /> 
                          {new Date(r.date).toLocaleDateString('fr-FR')} à {r.time}
                      </div>
                      {r.notes && (
                          <div className="bg-yellow-50 p-2 rounded text-xs text-yellow-800 mb-3 border border-yellow-100">
                              Note: {r.notes}
                          </div>
                      )}
                      
                      <div className="flex gap-2 pt-2 border-t border-stone-50">
                          <button 
                            onClick={() => handleSeatClick(r)}
                            className="flex-1 bg-green-50 text-green-700 py-1.5 rounded hover:bg-green-100 text-xs font-bold flex items-center justify-center gap-1"
                          >
                              <MapPin className="w-3 h-3" />
                              Installer
                          </button>
                          <button 
                            onClick={() => updateStatus(r.id, 'cancelled')}
                            className="bg-red-50 text-red-700 py-1 px-3 rounded hover:bg-red-100"
                          >
                              <Trash2 className="w-4 h-4" />
                          </button>
                      </div>
                  </div>
              ))}
          </div>

          {/* Seated / Completed Today */}
           <div className="space-y-4">
              <h3 className="font-bold text-green-600 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Installés / Honorés
              </h3>
              {reservations.filter((r) => r.status === 'seated').length === 0 && (
                 <p className="text-stone-400 text-sm italic">Aucun client installé.</p>
              )}
              {reservations.filter((r) => r.status === 'seated').map((r) => (
                  <div key={r.id} className="bg-green-50 p-4 rounded-xl border border-green-200">
                      <div className="flex justify-between">
                          <h4 className="font-bold">{r.customerName}</h4>
                          <span className="text-xs text-green-700">{r.time}</span>
                      </div>
                      <p className="text-sm text-stone-600">{r.guests} personnes</p>
                      {r.table && (
                        <div className="mt-2 bg-green-100 px-2 py-1 rounded text-xs font-bold text-green-800 inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {r.table.name}
                        </div>
                      )}
                  </div>
              ))}
           </div>

           {/* Cancelled */}
           <div className="space-y-4">
              <h3 className="font-bold text-red-600 flex items-center">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Annulées
              </h3>
              {reservations.filter((r) => r.status === 'cancelled').length === 0 && (
                 <p className="text-stone-400 text-sm italic">Aucune réservation annulée.</p>
              )}
              {reservations.filter((r) => r.status === 'cancelled').map((r) => (
                  <div key={r.id} className="bg-red-50 p-4 rounded-xl border border-red-200 opacity-60">
                      <div className="flex justify-between">
                          <h4 className="font-bold line-through">{r.customerName}</h4>
                          <span className="text-xs">{r.time}</span>
                      </div>
                      <p className="text-sm text-stone-500">{r.guests} personnes</p>
                      <p className="text-xs text-stone-400 mt-1">
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
                onChange={e => setFormData({...formData, customerName: e.target.value})}
                required
            />
             <Input 
                label="Téléphone"
                value={formData.customerPhone}
                onChange={e => setFormData({...formData, customerPhone: e.target.value})}
                required
            />
            <div className="grid grid-cols-2 gap-4">
                <Input 
                    label="Date"
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    required
                />
                <Input 
                    label="Heure"
                    type="time"
                    value={formData.time}
                    onChange={e => setFormData({...formData, time: e.target.value})}
                    required
                />
            </div>
             <Input 
                label="Nombre de personnes"
                type="number"
                min={1}
                value={formData.guests}
                onChange={e => setFormData({...formData, guests: parseInt(e.target.value)})}
                required
            />
             <Input 
                label="Notes (Allergies, Préférences...)"
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
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
