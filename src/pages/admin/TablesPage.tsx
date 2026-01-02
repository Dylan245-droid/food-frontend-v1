import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { useFetch } from '../../lib/useFetch';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import api from '../../lib/api';
import { Plus, RefreshCw, Trash2, UserCheck, MapPin, Download, ExternalLink, Unlock, User, Printer, AlertCircle, Banknote } from 'lucide-react';
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
  
  // Printing State
  const [receiptOrder, setReceiptOrder] = useState<ReceiptOrder | null>(null);

  // Base URL for QR codes
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

  // Print bill WITHOUT changing order status (just show the bill to customer)
  const handlePrintBill = async (table: Table) => {
      if (!table.activeOrdersCount) return;
      
      try {
          const res = await api.get(`/staff/orders?table_id=${table.id}&status=pending,in_progress,delivered`);
          const orders: any[] = res.data.data;
          
          if (orders.length === 0) {
              alert('Aucune commande à imprimer pour cette table.');
              return;
          }

          // Consolidated Items (don't change status, just print)
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
              status: 'delivered', // Not paid yet - just showing the bill
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

  // Collect payment: Mark all orders as PAID
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

          // Calculate total for confirmation
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

  // Trigger print when receiptOrder is updated
  useEffect(() => {
      if (receiptOrder) {
          // Small delay to ensure DOM update
          const timer = setTimeout(() => {
              window.print();
              // Optional: Clear receipt after print to allow re-printing same receipt if needed? 
              // Better reset it on closing or handle duplicates. 
              // For now, let's keep it simple.
          }, 100);
          return () => clearTimeout(timer);
      }
  }, [receiptOrder]);

  const openAssignModal = (table: Table) => {
      setSelectedTable(table);
      const eligibleUsers = usersData?.data?.filter(u => u.role === 'serveur') || [];
      // Pre-select current assigned server if exists
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

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Chargement des tables...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-gray-900">
            {isMyTables ? 'Mes Tables' : 'Gestion des Tables'}
        </h1>
        {!isMyTables && (
            <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Table
            </Button>
        )}
      </div>

      {/* Grid - 2 on md, 3 on lg/xl, 4 on 2xl */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
        {data?.data.map((table) => (
          <div 
            key={table.id} 
            className={`rounded-xl border-2 overflow-hidden transition-all hover:shadow-lg ${
              table.isOccupied 
                ? 'bg-red-50 border-red-300' 
                : 'bg-white border-gray-200 hover:border-green-300'
            }`}
          >
            {/* Card Header */}
            <div className={`p-4 ${table.isOccupied ? 'bg-red-100' : 'bg-gray-50'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black text-gray-900">{table.name || 'Sans nom'}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                    <MapPin className="w-3 h-3" />
                    {table.zone}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                  table.isOccupied ? 'bg-red-200 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {table.isOccupied ? 'Occupé' : 'Libre'}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Capacité</span>
                <span className="font-medium text-gray-900">{table.capacity} places</span>
              </div>
              
              {table.isActive ? (
                <>
                  {table.isOccupied ? (
                    <div className="space-y-3">
                        <div className="flex justify-between items-start text-sm p-3 bg-white rounded-lg border border-red-100 flex-col gap-2">
                            <div className="flex justify-between w-full">
                                <span className="text-gray-500 text-xs">Commandes</span>
                                <span className="font-bold text-red-600 text-xs">{table.activeOrdersCount} total</span>
                            </div>
                            <div className="w-full space-y-1 pt-1 border-t border-gray-50">
                                {table.pendingCount > 0 && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-yellow-600 font-medium">En attente</span>
                                        <span className="font-bold text-yellow-700 bg-yellow-100 px-1.5 rounded-full">{table.pendingCount}</span>
                                    </div>
                                )}
                                {table.inProgressCount > 0 && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-blue-600 font-medium">En préparation</span>
                                        <span className="font-bold text-blue-700 bg-blue-100 px-1.5 rounded-full">{table.inProgressCount}</span>
                                    </div>
                                )}
                                {table.deliveredCount > 0 && (
                                    <div className="flex justify-between text-xs">
                                        <span className="text-green-600 font-medium">Servi (Non payé)</span>
                                        <span className="font-bold text-green-700 bg-green-100 px-1.5 rounded-full">{table.deliveredCount}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                      
                      {table.assignedServer ? (
                        <div className="flex items-center gap-2 text-sm p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
                           <User className="w-4 h-4" />
                           <span className="font-medium">{table.assignedServer.fullName}</span>
                        </div>
                      ) : (
                        <div className="bg-yellow-50 text-yellow-700 p-2 rounded-lg text-sm border border-yellow-100 flex gap-2 items-center">
                            <AlertCircle className="w-4 h-4" />
                            <span>Non assigné</span>
                        </div>
                      )}

                      <div className="space-y-2 pt-2">
                        <div className="grid grid-cols-3 gap-2">
                          <Button 
                              className="bg-blue-600 text-white hover:bg-blue-700 h-10 px-0 flex items-center justify-center" 
                              onClick={() => openAssignModal(table)}
                              title="Assigner un serveur"
                          >
                              <UserCheck className="w-4 h-4" />
                          </Button>
                          <Button 
                              className="bg-gray-800 text-white hover:bg-black h-10 px-0 flex items-center justify-center" 
                              onClick={() => handlePrintBill(table)}
                              title="Imprimer l'addition"
                          >
                              <Printer className="w-4 h-4" />
                          </Button>
                          <Button 
                              className="bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 h-10 px-0 flex items-center justify-center" 
                              onClick={() => openQrModal(table)}
                              title="Voir QR Code"
                          >
                              <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                              className="bg-green-600 text-white hover:bg-green-700 h-10 px-2 flex items-center justify-center gap-1" 
                              onClick={() => handleCollectPayment(table)}
                              title="Encaisser le paiement"
                          >
                              <Banknote className="w-4 h-4" />
                              <span className="text-xs font-medium">Encaisser</span>
                          </Button>
                          <Button 
                              className="bg-red-100 text-red-600 hover:bg-red-200 border border-red-200 h-10 px-2 flex items-center justify-center gap-1" 
                              onClick={() => handleFreeTable(table.id)}
                              title="Libérer la table"
                          >
                               <Unlock className="w-4 h-4" />
                               <span className="text-xs font-medium">Libérer</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg">
                            <span className="text-gray-500">Statut</span>
                            <span className="font-medium text-gray-900">Disponible</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2">
                            <Button 
                                variant="secondary"
                                onClick={() => openQrModal(table)}
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                QR Code
                            </Button>
                            <Button 
                                variant="secondary"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => handleDelete(table.id)}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer
                            </Button>
                        </div>
                    </div>
                  )}
                </>
              ) : (
                  <div className="text-center py-2 text-red-500 font-medium bg-red-50 rounded-lg">
                      Table Inactive
                  </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {data?.data.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          Aucune table créée. Commencez par en ajouter une !
        </div>
      )}

      {/* New Table Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Créer une nouvelle table">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Nom de la table" 
            placeholder="Ex: Table 1, Terrasse A..." 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            required 
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
            <select 
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500" 
              value={formData.zone} 
              onChange={e => setFormData({...formData, zone: e.target.value})}
            >
              <option value="Intérieur">Intérieur</option>
              <option value="Terrasse">Terrasse</option>
              <option value="Bar">Bar</option>
              <option value="VIP">VIP</option>
            </select>
          </div>
          <Input 
            label="Capacité (nombre de places)" 
            type="number" 
            min={1}
            value={formData.capacity} 
            onChange={e => setFormData({...formData, capacity: parseInt(e.target.value) || 1})} 
            required 
          />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Annuler</Button>
            <Button type="submit" isLoading={submitting}>Créer la table</Button>
          </div>
        </form>
      </Modal>

      {/* QR Code Modal */}
      <Modal 
        isOpen={isQrModalOpen} 
        onClose={() => setIsQrModalOpen(false)} 
        title={`QR Code - ${selectedTable?.name || 'Table'}`}
      >
        <div className="flex flex-col items-center space-y-6 py-4">
          {/* QR Code */}
          <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm">
            <QRCodeSVG 
              id="qr-code-svg"
              value={`${baseUrl}/t/${selectedTable?.code}`} 
              size={200}
              level="H"
              includeMargin
            />
          </div>
          
          {/* Table Info */}
          <div className="text-center space-y-1">
            <p className="text-lg font-bold text-gray-900">{selectedTable?.name}</p>
            <p className="text-sm text-gray-500">{selectedTable?.zone} • {selectedTable?.capacity} places</p>
            <p className="font-mono text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded mt-2">
              {baseUrl}/t/{selectedTable?.code}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 w-full">
            <Button 
              variant="secondary" 
              className="flex-1"
              onClick={downloadQrCode}
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger PNG
            </Button>
            <Button 
              variant="secondary"
              className="flex-1"
              onClick={() => handleRegenerateCode(selectedTable?.id || 0)}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Régénérer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Modal */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title={`Assigner ${selectedTable?.name}`}>
          <form onSubmit={handleAssign} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serveur</label>
                  <select 
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white"
                      value={assignServerId}
                      onChange={e => setAssignServerId(Number(e.target.value))}
                  >
                        {usersData?.data?.filter(u => u.role === 'serveur').map(u => (
                            <option key={u.id} value={u.id}>{u.fullName}</option>
                        ))}
                  </select>
              </div>
              <Button type="submit" className="w-full">Valider l'assignation</Button>
          </form>
      </Modal>

      {/* Hidden Receipt for Printing */}
      {createPortal(
        <div id="printable-receipt">
            <Receipt order={receiptOrder} />
        </div>,
        document.body
      )}
    </div>
  );
}
