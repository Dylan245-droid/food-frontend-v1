import React, { useState } from 'react';
import { Calendar, Clock, Users, CheckCircle, ChefHat } from 'lucide-react';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function BookingPage() {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    guests: 2,
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/reservations/public', formData);
      setSuccess(true);
    } catch (error) {
      alert("Une erreur est survenue lors de la réservation. Veuillez réessayer ou nous appeler.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-2xl shadow-xl text-center border border-green-100">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Demande reçue !</h2>
        <p className="text-stone-500 mb-6">
          Merci {formData.customerName}, nous avons bien reçu votre demande de réservation pour {formData.guests} personnes.
          <br/>
          Vous recevrez une confirmation par SMS/Appel très bientôt.
        </p>
        <Button onClick={() => window.location.href = '/'} variant="secondary">
          Retour à l'accueil
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-100 text-orange-600 mb-4">
           <ChefHat className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-black text-stone-900 mb-2">Réserver une table</h1>
        <p className="text-stone-500">Remplissez ce formulaire pour effectuer une demande de réservation.</p>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-stone-100">
        <form onSubmit={handleSubmit} className="space-y-5">
           <Input 
              label="Votre Nom"
              value={formData.customerName}
              onChange={e => setFormData({...formData, customerName: e.target.value})}
              required
              placeholder="Ex: Jean Dupont"
           />
           <Input 
              label="Téléphone"
              type="tel"
              value={formData.customerPhone}
              onChange={e => setFormData({...formData, customerPhone: e.target.value})}
              required
              placeholder="Ex: 06 12 34 56 78"
           />
           
           <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Date
                  </label>
                  <input 
                    type="date"
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Heure
                  </label>
                  <input 
                    type="time"
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    value={formData.time}
                    onChange={e => setFormData({...formData, time: e.target.value})}
                    required
                  />
               </div>
           </div>

           <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5 flex items-center gap-2">
                <Users className="w-4 h-4" /> Nombre de personnes
              </label>
              <input 
                type="number"
                min={1}
                max={20}
                className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                value={formData.guests}
                onChange={e => setFormData({...formData, guests: parseInt(e.target.value) || 1})}
                required
              />
           </div>

           <Input 
              label="Notes (Optionnel)"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="Allergies, Chaise haute, Terrasse..."
           />

           <Button 
            type="submit" 
            isLoading={submitting} 
            className="w-full py-4 text-lg font-black shadow-orange-500/20 shadow-lg"
            style={{ background: 'var(--primary-gradient)' }}
           >
              Confirmer la demande
           </Button>
        </form>
      </div>
    </div>
  );
}
