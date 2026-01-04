import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { useFetch } from '../../lib/useFetch';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import api from '../../lib/api';
import { Plus, RefreshCw, Trash2, UserCheck, MapPin, Download, ExternalLink, Unlock, User, Printer, AlertCircle, Banknote, Utensils, Armchair } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Receipt } from '../../components/Receipt';
import type { ReceiptOrder, OrderItem } from '../../components/Receipt';

interface AssignedServer {
  id: number;
  fullName: string;
}

interface Table {
  id: number;
  name: string;
  zone: string;
  capacity: number;
  code: string;
  isActive: boolean;
  isOccupied: boolean;
  activeOrdersCount: number;
  pendingCount: number;
  inProgressCount: number;
  deliveredCount: number;
  canBeFreed: boolean;
  assignedServer: AssignedServer | null;
}

interface UserData {
    id: number;
    fullName: string;
    role: string;
}

export default function TablesPage() {
  const [searchParams] = useSearchParams();
  const isMyTables = searchParams.get('filter') === 'mine';
  
  const endpoint = isMyTables ? '/staff/tables/me' : '/admin/tables';
  const { data, loading, refetch } = useFetch<{ data: Table[] }>(endpoint);
  
  const { data: usersData } = useFetch<{ data: UserData[] }>('/admin/users');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [formData, setFormData] = useState({ name: '', zone: 'Intérieur', capacity: 4 });
  const [assignServerId, setAssignServerId] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  
  const [receiptOrder, setReceiptOrder] = useState<ReceiptOrder | null>(null);
  const baseUrl = window.location.origin;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/tables', formData);
      setIsModalOpen(false);
      setFormData({ name: '', zone: 'Intérieur', capacity: 4 });
      refetch();
    } catch (error) {
      alert('Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!selectedTable || !assignServerId) return;
      try {
          await api.post(`/admin/tables/${selectedTable.id}/assign`, { userId: assignServerId });
          setIsAssignModalOpen(false);
          refetch();
          alert('Serveur assigné avec succès !');
      } catch(e) {
          alert('Erreur: Vérifiez qu\'il y a des commandes actives sur cette table.');
      }
  }

  const handleFreeTable = async (tableId: number) => {
      if (!confirm('Libérer cette table ? Les commandes livrées seront marquées comme payées.')) return;
      try {
          await api.post(`/admin/tables/${tableId}/free`);
          refetch();
          alert('Table libérée !');
      } catch(e) {
          alert('Erreur lors de la libération de la table.');
      }
  }

  const handlePrintBill = async (table: Table) => {
      if (!table.activeOrdersCount) return;
      
      try {
          const res = await api.get(`/staff/orders?table_id=${table.id}&status=pending,in_progress,delivered`);
          const orders: any[] = res.data.data;
          
          if (orders.length === 0) {
              alert('Aucune commande à imprimer pour cette table.');
              return;
          }

          let totalAmount = 0;
          const allItems: OrderItem[] = orders.flatMap(o => {
              if(o.status === 'cancelled') return [];
              totalAmount += o.totalAmount;
              return o.items.map((i: any) => ({
                  id: i.id,
                  quantity: i.quantity,
                  unitPrice: i.unitPrice || i.price || 0,
                  menuItem: i.menuItem
              }));
          });
          
          const consolidatedOrder: ReceiptOrder = {
              id: 0,
              dailyNumber: null,
              pickupCode: null,
              status: 'delivered',
              totalAmount: totalAmount,
              items: allItems,
              createdAt: new Date().toISOString(),
              table: { name: table.name },
              type: 'dine_in'
          };
          
          setReceiptOrder(consolidatedOrder);
      } catch (e) {
          alert('Erreur lors de la récupération de l\'addition');
      }
  }

  const handleCollectPayment = async (table: Table) => {
      if (!table.activeOrdersCount) return;
      
      try {
          const res = await api.get(`/staff/orders?table_id=${table.id}&status=pending,in_progress,delivered`);
          const orders: any[] = res.data.data;
          const unpaidOrders = orders.filter(o => o.status !== 'paid' && o.status !== 'cancelled');
          
          if (unpaidOrders.length === 0) {
              alert('Toutes les commandes sont déjà payées.');
              return;
          }

          const totalAmount = unpaidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
          
          if (!confirm(`Encaisser ${totalAmount} FCFA pour ${unpaidOrders.length} commande(s) ?`)) {
              return;
          }

          await Promise.all(unpaidOrders.map(o => api.patch(`/staff/orders/${o.id}/status`, { status: 'paid' })));
          refetch();
          alert('Paiement enregistré ! Vous pouvez maintenant libérer la table.');
      } catch (e) {
          alert('Erreur lors de l\'encaissement');
      }
  }

  useEffect(() => {
      if (receiptOrder) {
          const timer = setTimeout(() => {
              window.print();
          }, 100);
          return () => clearTimeout(timer);
      }
  }, [receiptOrder]);

  const openAssignModal = (table: Table) => {
      setSelectedTable(table);
      const eligibleUsers = usersData?.data?.filter(u => u.role === 'serveur') || [];
      if (table.assignedServer) {
        setAssignServerId(table.assignedServer.id);
      } else if (eligibleUsers.length > 0) {
        setAssignServerId(eligibleUsers[0].id);
      }
      setIsAssignModalOpen(true);
  }

  const openQrModal = (table: Table) => {
      setSelectedTable(table);
      setIsQrModalOpen(true);
  }

  const downloadQrCode = () => {
      if (!selectedTable) return;
      const svg = document.getElementById('qr-code-svg');
      if (!svg) return;
      
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          const pngFile = canvas.toDataURL('image/png');
          
          const downloadLink = document.createElement('a');
          downloadLink.download = `qr-${selectedTable.name || 'table'}.png`;
          downloadLink.href = pngFile;
          downloadLink.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }

  const handleRegenerateCode = async (id: number) => {
    if (!confirm('Attention: L\'ancien QR Code ne fonctionnera plus. Continuer ?')) return;
    try {
      await api.post(`/admin/tables/${id}/regenerate-code`);
      refetch();
    } catch (error) {
      alert('Erreur');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer définitivement cette table ?')) return;
    try {
      await api.delete(`/admin/tables/${id}`);
      refetch();
    } catch (error) {
        alert('Erreur');
    }
  };

  if (loading) return (
      <div className="flex items-center justify-center h-96">
          <div className="animate-bounce flex flex-col items-center text-stone-400">
              <Armchair className="w-12 h-12 mb-2" />
              <span className="font-bold">Mise en place de la salle...</span>
          </div>
      </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-3xl shadow-sm border border-stone-100">
        <div>
            <h1 className="text-2xl font-black text-stone-900 flex items-center gap-3 uppercase tracking-tight font-display">
                <div className="bg-stone-900 p-2 rounded-xl text-white">
                     <Armchair className="w-6 h-6" />
                </div>
                {isMyTables ? 'Mon Rang' : 'Salle & Tables'}
            </h1>
            <p className="text-stone-400 text-sm font-medium ml-14">Plan de salle et assignations</p>
        </div>
        {!isMyTables && (
            <Button onClick={() => setIsModalOpen(true)} className="bg-stone-900 text-white hover:bg-stone-800 gap-2 h-12 px-6 rounded-xl font-bold shadow-lg shadow-stone-900/10">
                <Plus className="w-4 h-4" />
                Ajouter Table
            </Button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
        {data?.data.map((table) => (
          <div 
            key={table.id} 
            className={`rounded-3xl border-2 overflow-hidden transition-all duration-300 relative group ${
              table.isOccupied 
                ? 'bg-red-50 border-red-200 shadow-md shadow-red-50' 
                : 'bg-white border-stone-100 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-50'
            }`}
          >
             {/* Occupied Pulse */}
             {table.isOccupied && (
                 <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full pointer-events-none animate-pulse"></div>
             )}

            {/* Card Content */}
            <div className="p-6 h-full flex flex-col">
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                   <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-2xl font-black text-stone-900 font-display">{table.name || 'Sans nom'}</h3>
                      <div className={`w-3 h-3 rounded-full ${table.isOccupied ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                   </div>
                   <div className="flex items-center gap-1.5 text-xs text-stone-500 font-bold uppercase tracking-wide">
                     <MapPin className="w-3 h-3" />
                     {table.zone}
                     <span className="text-stone-300">|</span>
                     <Armchair className="w-3 h-3" />
                     {table.capacity}p
                   </div>
                </div>
                {table.isActive && table.isOccupied && (
                    <div className="bg-white px-3 py-1.5 rounded-xl border border-red-100 shadow-sm flex flex-col items-end">
                        <span className="text-[10px] text-stone-400 font-bold uppercase">Commandes</span>
                        <span className="text-xl font-black text-red-600 leading-none">{table.activeOrdersCount}</span>
                    </div>
                )}
              </div>
              
              <div className="space-y-4 flex-1">
                {table.isActive ? (
                  <>
                    {table.isOccupied && (
                      <div className="space-y-3">
                          {/* Order Status Pillars */}
                          <div className="grid grid-cols-3 gap-2 text-center text-xs">
                               <div className={`p-2 rounded-xl transition-colors ${table.pendingCount > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-stone-50 text-stone-300'}`}>
                                   <div className="font-black text-lg mb-0.5">{table.pendingCount}</div>
                                   <div className="font-bold uppercase text-[9px]">Attente</div>
                               </div>
                               <div className={`p-2 rounded-xl transition-colors ${table.inProgressCount > 0 ? 'bg-blue-100 text-blue-800' : 'bg-stone-50 text-stone-300'}`}>
                                   <div className="font-black text-lg mb-0.5">{table.inProgressCount}</div>
                                   <div className="font-bold uppercase text-[9px]">Cuisson</div>
                               </div>
                               <div className={`p-2 rounded-xl transition-colors ${table.deliveredCount > 0 ? 'bg-green-100 text-green-800' : 'bg-stone-50 text-stone-300'}`}>
                                   <div className="font-black text-lg mb-0.5">{table.deliveredCount}</div>
                                   <div className="font-bold uppercase text-[9px]">Servi</div>
                               </div>
                          </div>
                      
                        {table.assignedServer ? (
                          <div className="flex items-center gap-2 text-xs p-3 bg-white/50 rounded-xl border border-red-100 text-stone-600">
                             <User className="w-4 h-4 text-stone-400" />
                             <span className="font-medium">Serveur: <span className="font-bold text-stone-900">{table.assignedServer.fullName}</span></span>
                          </div>
                        ) : (
                          <button onClick={() => openAssignModal(table)} className="w-full bg-yellow-50 text-yellow-700 p-2 rounded-xl text-xs font-bold border border-yellow-100 flex gap-2 items-center justify-center hover:bg-yellow-100 transition-colors">
                              <AlertCircle className="w-3 h-3" />
                              NON ASSIGNÉ • CLIQUEZ POUR ASSIGNER
                          </button>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                    <div className="text-center py-4 text-red-400 font-bold bg-red-50 rounded-2xl border border-dashed border-red-200 uppercase tracking-widest text-xs">
                        Table Désactivée
                    </div>
                )}
              </div>
              
              {/* Actions Footer */}
              <div className="grid grid-cols-4 gap-2 pt-4 mt-auto">
                 {table.isOccupied ? (
                     <>
                        <Button 
                            className="col-span-1 bg-stone-900 text-white hover:bg-black p-0 rounded-xl" 
                            onClick={() => handlePrintBill(table)}
                            title="Imprimer"
                        >
                            <Printer className="w-4 h-4" />
                        </Button>
                        <Button 
                            className="col-span-2 bg-green-600 text-white hover:bg-green-700 p-0 rounded-xl font-bold uppercase text-xs" 
                            onClick={() => handleCollectPayment(table)}
                            title="Encaisser"
                        >
                            Encaisser
                        </Button>
                        <Button 
                            className="col-span-1 bg-white text-stone-400 border border-stone-200 hover:border-red-200 hover:text-red-500 p-0 rounded-xl" 
                            onClick={() => handleFreeTable(table.id)}
                            title="Libérer"
                        >
                             <Unlock className="w-4 h-4" />
                        </Button>
                     </>
                 ) : (
                     <>
                        <Button 
                            variant="secondary"
                            className="col-span-2 rounded-xl text-stone-500 hover:text-stone-900"
                            onClick={() => openQrModal(table)}
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            QR
                        </Button>
                        <Button 
                            variant="secondary"
                            onClick={() => openAssignModal(table)}
                            className="col-span-1 p-0 rounded-xl text-stone-400 hover:text-stone-900"
                            title="Assigner Serveur"
                        >
                             <UserCheck className="w-4 h-4" />
                        </Button>
                        <Button 
                            variant="secondary"
                            className="col-span-1 text-red-400 hover:bg-red-50 hover:text-red-700 p-0 rounded-xl"
                            onClick={() => handleDelete(table.id)}
                            title="Supprimer"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                     </>
                 )}
              </div>

            </div>
          </div>
        ))}
      </div>

      {data?.data.length === 0 && (
        <div className="text-center py-24 text-stone-300">
           <Armchair className="w-16 h-16 mx-auto mb-4 opacity-50" />
           <p className="text-lg font-medium">La salle est vide.</p>
           <p>Commencez par ajouter des tables !</p>
        </div>
      )}

      {/* New Table Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouvelle Table">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input 
            label="Nom" 
            placeholder="Ex: T1, Terrasse A..." 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            required 
            className="text-lg font-bold"
          />
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Zone</label>
            <div className="grid grid-cols-2 gap-3">
                 {['Intérieur', 'Terrasse', 'Bar', 'VIP'].map(zone => (
                     <div 
                        key={zone}
                        onClick={() => setFormData({...formData, zone})}
                        className={`cursor-pointer border-2 rounded-xl p-3 text-center transition-all ${
                            formData.zone === zone 
                            ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold shadow-sm' 
                            : 'border-stone-100 bg-white text-stone-500 hover:border-stone-300'
                        }`}
                     >
                         {zone}
                     </div>
                 ))}
            </div>
          </div>
          <Input 
            label="Couverts" 
            type="number" 
            min={1}
            value={formData.capacity} 
            onChange={e => setFormData({...formData, capacity: parseInt(e.target.value) || 1})} 
            required 
          />
          <div className="flex justify-end gap-3 pt-6">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)} className="h-12 rounded-xl px-6">Annuler</Button>
            <Button type="submit" isLoading={submitting} className="bg-stone-900 text-white h-12 rounded-xl px-6 font-bold shadow-lg">Créer la table</Button>
          </div>
        </form>
      </Modal>

      {/* QR Code Modal */}
      <Modal 
        isOpen={isQrModalOpen} 
        onClose={() => setIsQrModalOpen(false)} 
        title="QR Code"
      >
        <div className="flex flex-col items-center space-y-8 py-6">
          <div className="bg-white p-8 rounded-3xl border-4 border-stone-100 shadow-xl relative group hover:border-orange-500 transition-colors">
            <div className="absolute top-0 transform -translate-y-1/2 bg-white px-4 py-1 rounded-full border border-stone-200 text-xs font-bold uppercase tracking-widest text-stone-400 group-hover:text-orange-500 group-hover:border-orange-200 transition-colors">
                Scan Me
            </div>
            <QRCodeSVG 
              id="qr-code-svg"
              value={`${baseUrl}/t/${selectedTable?.code}`} 
              size={200}
              level="H"
              includeMargin
              className="group-hover:opacity-90 transition-opacity"
            />
          </div>
          
          <div className="text-center space-y-1">
            <h2 className="text-3xl font-black text-stone-900 font-display">{selectedTable?.name}</h2>
            <p className="text-stone-500 font-medium">{selectedTable?.zone} • {selectedTable?.capacity} places</p>
          </div>

          <div className="flex gap-4 w-full">
            <Button 
              className="flex-1 h-12 rounded-xl bg-stone-900 text-white font-bold shadow-lg"
              onClick={downloadQrCode}
            >
              <Download className="w-5 h-5 mr-2" />
              Télécharger
            </Button>
            <Button 
              variant="secondary"
              className="flex-1 h-12 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50"
              onClick={() => handleRegenerateCode(selectedTable?.id || 0)}
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Régénérer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Modal */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title={`Assignation - ${selectedTable?.name}`}>
          <form onSubmit={handleAssign} className="space-y-6">
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 mb-6">
                  <p className="text-sm text-stone-500 text-center mb-2">Assigner cette table à</p>
                  <select 
                      className="w-full h-12 px-4 border-2 border-stone-200 rounded-xl bg-white text-lg font-bold text-center focus:border-stone-900 focus:ring-4 focus:ring-stone-100 transition-all outline-none"
                      value={assignServerId}
                      onChange={e => setAssignServerId(Number(e.target.value))}
                  >
                        {usersData?.data?.filter(u => u.role === 'serveur').map(u => (
                            <option key={u.id} value={u.id}>{u.fullName}</option>
                        ))}
                  </select>
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200">
                  <UserCheck className="w-5 h-5 mr-2" />
                  Valider l'assignation
              </Button>
          </form>
      </Modal>

      {createPortal(
        <div id="printable-receipt">
            <Receipt order={receiptOrder} />
        </div>,
        document.body
      )}
    </div>
  );
}
