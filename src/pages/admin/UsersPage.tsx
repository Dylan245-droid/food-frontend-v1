import { useState } from 'react';
import { useFetch } from '../../lib/useFetch';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import api from '../../lib/api';
import { Plus, Pencil, Trash2, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  phone?: string;
  isActive: boolean;
  avatar?: string;
}

export default function UsersPage() {
  const { data: usersData, loading, refetch } = useFetch<{ meta: any, data: User[] }>('/admin/users');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<User> | null>(null);
  
  const [formData, setFormData] = useState({ email: '', fullName: '', password: '', role: 'serveur', phone: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const { user: authUser } = useAuth();

  // Helper to get image URL
  const getImageUrl = (path?: string) => {
      if (!path) return null;
      if (path.startsWith('http')) return path;
      // Strip /api from VITE_API_URL to get base URL
      const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:9015';
      return `${baseUrl}${path}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setAvatarFile(file);
          setPreviewUrl(URL.createObjectURL(file));
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Use FormData for file upload
    const data = new FormData();
    data.append('email', formData.email);
    data.append('fullName', formData.fullName);
    data.append('role', formData.role);
    if (formData.phone) data.append('phone', formData.phone);
    if (formData.password) data.append('password', formData.password);
    
    if (avatarFile) {
        data.append('avatar', avatarFile);
    }

    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      
      if (currentUser?.id) {
        // Update
        if (!formData.password) data.delete('password'); 
        await api.patch(`/admin/users/${currentUser.id}`, data, config);
      } else {
        // Create
        await api.post('/admin/users', data, config);
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
          password: '', 
          role: user.role, 
          phone: user.phone || '' 
      });
      setPreviewUrl(getImageUrl(user.avatar));
      setAvatarFile(null);
    } else {
      setCurrentUser(null);
      setFormData({ email: '', fullName: '', password: '', role: 'serveur', phone: '' });
      setPreviewUrl(null);
      setAvatarFile(null);
    }
    setIsModalOpen(true);
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            Gestion de l'équipe
          </h1>
          <p className="text-gray-500">Gérez les membres du personnel et leurs accès.</p>
        </div>
        <Button onClick={() => openModal()} className="shadow-lg shadow-purple-200">
          <Plus className="w-5 h-5 mr-2" />
          Ajouter un membre
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {usersData?.data.map(user => (
          <div key={user.id} className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all relative flex flex-col h-full">
             
             {/* User Header */}
             <div className="flex items-center gap-4 mb-4">
                  <div className={`
                        w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner overflow-hidden flex-shrink-0
                        ${user.avatar ? 'bg-white' : user.role === 'admin' || user.role === 'super_admin' ? 'bg-purple-100 text-purple-600' :
                        user.role === 'livreur' ? 'bg-yellow-100 text-yellow-600' :
                        user.role === 'comptable' ? 'bg-slate-100 text-slate-600' : 'bg-gray-100 text-gray-600'}
                  `}>
                      {user.avatar ? (
                          <img src={getImageUrl(user.avatar)!} alt={user.fullName} className="w-full h-full object-cover" />
                      ) : (
                          user.fullName.charAt(0)
                      )}
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
                    user.role === 'salle' ? 'bg-green-50 text-green-600' : 
                    user.role === 'caissier' ? 'bg-orange-50 text-orange-600' :
                    user.role === 'livreur' ? 'bg-yellow-50 text-yellow-600' :
                    user.role === 'comptable' ? 'bg-slate-50 text-slate-600' : 'bg-gray-100 text-gray-500'}
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
           {/* Avatar Upload */}
           <div className="flex justify-center mb-6">
                <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-input')?.click()}>
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors">
                        {previewUrl ? (
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <Upload className="w-8 h-8 text-gray-400" />
                        )}
                    </div>
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-white text-xs font-bold">Modifier</span>
                    </div>
                </div>
                <input 
                    id="avatar-input" 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                />
           </div>

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
                <option value="caissier">Caissier</option>
                <option value="salle">Chef de Salle</option>
                <option value="livreur">Livreur</option>
                <option value="comptable">Comptable</option>
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
