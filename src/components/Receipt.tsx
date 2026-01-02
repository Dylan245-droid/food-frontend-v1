import { forwardRef } from 'react';

// Using a reusable format for standard A6 Thermal/Receipt printers
// A6 dimensions: 105mm x 148mm
// Thermal paper often 80mm width. We will target generic receipt style that fits both.

export interface OrderItem {
    id: number;
    quantity: number;
    unitPrice: number;
    menuItem: {
        name: string;
    };
}

export interface ReceiptOrder {
    id: number;
    dailyNumber: number | null;
    pickupCode: string | null;
    status: string;
    totalAmount: number;
    items: OrderItem[];
    createdAt: string;
    table?: { name: string };
    clientName?: string;
    type: 'dine_in' | 'takeout';
}

interface ReceiptProps {
    order: ReceiptOrder | null;
}

export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ order }, ref) => {
    if (!order) return null;

    const total = order.totalAmount; // en FCFA
    const date = new Date(order.createdAt).toLocaleString('fr-FR');

    return (
        <div ref={ref} className="hidden print:block print:w-full print:px-8 print:text-black font-mono leading-tight text-xs">
            {/* Header */}
            <div className="text-center mb-6">
                <div className="flex justify-center mb-2">
                    <img src="/logo.jpg" alt="Logo" className="h-12 w-auto object-contain grayscale" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
                <h1 className="text-xl font-bold uppercase mb-1">Sauce Créole</h1>
                <p className="text-[10px] italic font-medium mb-1">"Le plaisir de manger"</p>
                <p className="text-[10px]">{date}</p>
            </div>

            {/* Order Info */}
            <div className="mb-4 border-b border-black pb-2 border-dashed">
                <div className="flex justify-between font-bold text-sm mb-1">
                    <span>CMD #{order.dailyNumber || order.id}</span>
                    <span>{order.type === 'takeout' ? 'EMPORTER' : 'SUR PLACE'}</span>
                </div>
                {order.pickupCode && (
                     <div className="flex justify-between">
                        <span>Code Retrait:</span>
                        <span className="font-bold">{order.pickupCode}</span>
                    </div>
                )}
                 {order.table && (
                     <div className="flex justify-between">
                        <span>Table:</span>
                        <span className="font-bold">{order.table.name}</span>
                    </div>
                )}
                {order.clientName && (
                     <div className="truncate mt-0.5">
                        Client: {order.clientName}
                    </div>
                )}
            </div>

            {/* Items */}
            <div className="space-y-2 mb-4">
                {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start">
                        <div className="flex gap-2 overflow-hidden">
                            <span className="font-bold shrink-0">{item.quantity}x</span>
                            <span className="max-w-[200px] leading-tight">{item.menuItem?.name || 'Article inconnu'}</span>
                        </div>
                        <span className="whitespace-nowrap font-medium">{item.unitPrice * item.quantity} FCFA</span>
                    </div>
                ))}
            </div>

            {/* Footer / Total */}
            <div className="border-t border-black pt-2 border-dashed mt-2">
                <div className="flex justify-between items-center text-xl font-black mt-2">
                    <span>TOTAL</span>
                    <span>{total} FCFA</span>
                </div>
                <div className="text-center text-[10px] mt-6 space-y-1">
                    <p>Merci de votre visite !</p>
                    <p>À bientôt chez Sauce Créole</p>
                </div>
            </div>
            
             {/* Force page break after if printing multiple */}
             <div className="print:break-after-page"></div>
        </div>
    );
});

Receipt.displayName = 'Receipt';
