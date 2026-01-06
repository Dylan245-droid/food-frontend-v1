import { useState } from 'react';
import { useFetch } from '../../lib/useFetch';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import api from '../../lib/api';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  phone?: string;
  isActive: boolean;
}

export default function UsersPage() {
  const { data: usersData, loading, refetch } = useFetch<{ meta: any, data: User[] }>('/admin/users');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<User> | null>(null);
  const [formData, setFormData] = useState({ email: '', fullName: '', password: '', role: 'serveur', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const { user: authUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (currentUser?.id) {
        // Update
        const data: any = { ...formData };
        if (!data.password) delete data.password;
        await api.patch(`/admin/users/${currentUser.id}`, data);
      } else {
        // Create
        await api.post('/admin/users', formData);
      }
      setIsModalOpen(false);
      refetch();
    } catch (error) {
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      refetch();
    } catch (error) {
      alert('Erreur lors de la suppression');
    }
  };

  const openModal = (user?: User) => {
    if (user) {
      setCurrentUser(user);
      setFormData({ 
        email: user.email, 
        fullName: user.fullName, 
        role: user.role, 
        phone: user.phone || '', 
        password: '' 
      });
    } else {
      setCurrentUser(null);
      setFormData({ email: '', fullName: '', role: 'serveur', phone: '', password: '' });
    }
    setIsModalOpen(true);
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion de l'équipe</h1>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un membre
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {usersData?.data.map((user) => (
          <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4 relative group hover:shadow-md transition-all hover:border-blue-100">
             
             {/* Header with Avatar & Name */}
             <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-black shrink-0 shadow-inner
                      ${user.role === 'super_admin' ? 'bg-purple-100 text-purple-600' : 
                        user.role === 'admin' ? 'bg-blue-100 text-blue-600' :
                        user.role === 'salle' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}
                  `}>
                      {user.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 truncate text-lg leading-tight">{user.fullName}</h3>
                      <p className="text-sm text-gray-400 truncate">{user.email}</p>
                  </div>
             </div>

             {/* Role Badge - Absolute Top Right */}
             <div className="absolute top-5 right-5">
               <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest
                  ${user.role === 'super_admin' ? 'bg-purple-50 text-purple-600' : 
                    user.role === 'admin' ? 'bg-blue-50 text-blue-600' : 
                    user.role === 'salle' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}
               `}>
                  {user.role === 'super_admin' ? 'Super Admin' : user.role.replace('_', ' ')}
               </span>
             </div>
            
            {/* Contact Info */}
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50/50 p-3 rounded-lg border border-gray-50">
                <span className="text-gray-400">📱</span> 
                {user.phone ? <span className="font-medium">{user.phone}</span> : <span className="text-gray-400 italic text-xs">Aucun contact</span>}
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-auto pt-2">
                <Button variant="secondary" className="flex-1 h-9" onClick={() => openModal(user)}>
                    <Pencil className="w-3.5 h-3.5 mr-2" />
                    Modifier
                </Button>
                {user.id !== authUser?.id && (
                    <Button variant="danger" className="w-9 h-9 px-0 bg-red-50 text-red-500 hover:bg-red-100 border-red-100" onClick={() => handleDelete(user.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentUser ? 'Modifier le membre' : 'Ajouter un membre'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Nom complet" 
            value={formData.fullName} 
            onChange={e => setFormData({...formData, fullName: e.target.value})} 
            required 
          />
          <Input 
            label="Email" 
            type="email" 
            value={formData.email} 
            onChange={e => setFormData({...formData, email: e.target.value})} 
            required 
          />
          {!currentUser && (
            <Input 
              label="Mot de passe" 
              type="password" 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              required 
            />
          )}
           {currentUser && (
            <Input 
              label="Nouveau mot de passe (laisser vide pour ne pas changer)" 
              type="password" 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
            />
          )}
          <Input 
            label="Téléphone" 
            value={formData.phone} 
            onChange={e => setFormData({...formData, phone: e.target.value})} 
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
            <select
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
            >
                <option value="serveur">Serveur</option>
                <option value="salle">Chef de Salle</option>
                <option value="admin">Administrateur</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button type="submit" isLoading={submitting}>Enregistrer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
