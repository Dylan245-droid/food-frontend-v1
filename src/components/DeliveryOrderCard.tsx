import { User, MapPin, Clock, Phone, Navigation2 } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { calculateDistance, formatDistance, getConfidenceIcon, getConfidenceLabel } from '../lib/geo';

interface OrderItem {
    quantity: number;
    menuItem?: { name: string };
    name?: string;
}

interface DeliveryOrder {
    id: number;
    dailyNumber: number;
    createdAt: string;
    clientName: string;
    clientPhone: string;
    deliveryAddress: string;
    deliveryLat?: number;
    deliveryLng?: number;
    geocodeConfidence?: 'high' | 'medium' | 'low' | 'failed' | null;
    notes?: string;
    totalAmount: number;
    deliveryFee: number;
    items: OrderItem[];
}

interface DeliveryOrderCardProps {
    order: DeliveryOrder;
    actions?: React.ReactNode; // Slot for action buttons (Assign, GPS, etc.)
    onClick?: () => void;
    isSelected?: boolean;
    restaurantLat?: number;
    restaurantLng?: number;
}

export function DeliveryOrderCard({ order, actions, onClick, isSelected, restaurantLat, restaurantLng }: DeliveryOrderCardProps) {
    // Calculate distance if coordinates are available
    const distance = (order.deliveryLat && order.deliveryLng && restaurantLat && restaurantLng)
        ? calculateDistance(restaurantLat, restaurantLng, order.deliveryLat, order.deliveryLng)
        : null;

    return (
        <div 
            onClick={onClick}
            className={`bg-white p-6 rounded-xl border shadow-sm flex flex-col gap-4 transition-all ${
                onClick ? 'cursor-pointer hover:border-[var(--primary-400)]' : ''
            } ${isSelected ? 'ring-2 ring-[var(--primary-500)] border-[var(--primary-500)]' : 'border-gray-200'}`}
        >
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-lg">Commande #{order.dailyNumber}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" /> {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-xs text-gray-500 mb-0.5">
                        <span className="font-medium">{formatCurrency((order.totalAmount || 0) - (order.deliveryFee || 0)).replace(' FCFA','')}</span>
                        <span className="mx-1">+</span>
                        <span className="font-bold text-blue-600">{formatCurrency(order.deliveryFee || 0).replace(' FCFA','')} Liv.</span>
                    </div>
                    <span className="font-black text-xl text-gray-900 leading-tight block">
                        {formatCurrency(order.totalAmount)}
                    </span>
                </div>
            </div>

            {/* Client Info & Address */}
            <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-2">
                <div className="space-y-1 pb-2 border-b border-gray-100">
                    <p className="font-bold text-gray-900 flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" /> {order.clientName}
                    </p>
                    <p className="text-gray-500 pl-6 text-xs flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {order.clientPhone}
                    </p>
                </div>
                
                <p className="text-gray-600 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-red-500 mt-0.5 shrink-0" /> 
                    <span>{order.deliveryAddress || 'Adresse non spécifiée'}</span>
                </p>

                {/* Distance Indicator */}
                {distance !== null && (
                    <div className="flex items-center gap-2 mt-1 pl-6">
                        <Navigation2 className="w-3 h-3 text-blue-500" />
                        <span className="text-xs font-medium text-blue-600">
                            ~{formatDistance(distance)} du restau
                        </span>
                        <span className="text-xs text-gray-400" title={getConfidenceLabel(order.geocodeConfidence || null)}>
                            {getConfidenceIcon(order.geocodeConfidence || null)}
                        </span>
                    </div>
                )}

                {order.notes && (
                    <div className="bg-yellow-50 text-yellow-800 p-2 rounded border border-yellow-100 text-xs italic">
                        "{order.notes}"
                    </div>
                )}

                {/* Items */}
                <div className="pt-2">
                    <p className="font-bold text-xs text-gray-500 uppercase mb-1">Articles ({order.items.length})</p>
                    <ul className="text-sm space-y-1">
                        {order.items.map((item, idx) => (
                           <li key={idx} className="flex justify-between">
                               <span>{item.quantity}x {item.menuItem?.name || item.name || 'Article'}</span>
                           </li> 
                        ))}
                    </ul>
                </div>
            </div>

            {/* Actions Slot */}
            {actions && (
                <div className="mt-auto pt-4 border-t border-gray-100 flex gap-3">
                    {actions}
                </div>
            )}
        </div>
    );
}
