import { forwardRef } from 'react';
import { formatCurrency } from '../lib/utils';

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
    type: 'dine_in' | 'takeout' | 'delivery';
    subtotal?: number;
    tax?: number;
}

interface ReceiptProps {
    order: ReceiptOrder | null;
    branding?: {
        name: string;
        tagline: string;
        receiptFooter: string;
        logo?: string;
        address?: string;
        phone?: string;
    };
    cashierName?: string;
}

export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ order, branding, cashierName }, ref) => {
    if (!order) return null;

    const total = order.totalAmount; // en FCFA
    const date = new Date(order.createdAt).toLocaleString('fr-FR');
    
    // Default branding values
    const brandName = branding?.name || 'Mon Restaurant';
    const brandTagline = branding?.tagline || 'Saveurs authentiques';
    const brandFooter = branding?.receiptFooter || 'À bientôt !';
    const brandLogo = branding?.logo || '/logo.jpg';
    const brandAddress = branding?.address || '';
    const brandPhone = branding?.phone || '';

    // Calculate Tax if missing (Default 18% or provided)
    const taxRate = 18;
    const subtotal = order.subtotal || Math.round(total / (1 + taxRate/100));
    const calculatedTax = order.tax || (total - subtotal);

    return (
        <div ref={ref} className="hidden print:block print:w-full print:px-8 print:text-black font-mono leading-tight text-xs">
            {/* Header */}
            <div className="text-center mb-6">
                <div className="flex justify-center mb-2">
                    <img src={brandLogo} alt="Logo" className="h-12 w-auto object-contain grayscale" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
                <h1 className="text-xl font-bold uppercase mb-1">{brandName}</h1>
                <p className="text-[10px] italic font-medium mb-1">"{brandTagline}"</p>
                {brandAddress && <p className="text-[9px]">{brandAddress}</p>}
                {brandPhone && <p className="text-[9px]">Tél: {brandPhone}</p>}
                <p className="text-[10px] mt-1">{date}</p>
            </div>

            {/* Order Info */}
            <div className="mb-4 border-b border-black pb-2 border-dashed">
                <div className="flex justify-between font-bold text-sm mb-1">
                    <span>CMD #{order.dailyNumber || order.id}</span>
                    <span>{order.type === 'takeout' ? 'EMPORTER' : order.type === 'delivery' ? 'LIVRAISON' : 'SUR PLACE'}</span>
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
                {cashierName && (
                     <div className="flex justify-between mt-0.5">
                        <span>Caissier:</span>
                        <span className="font-bold">{cashierName}</span>
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
                        <span className="whitespace-nowrap font-medium">{formatCurrency(item.unitPrice * item.quantity)}</span>
                    </div>
                ))}
            </div>

            {/* Footer / Total */}
            <div className="border-t border-black pt-2 border-dashed mt-2">
                <div className="space-y-1 mb-2">
                    <div className="flex justify-between text-xs">
                        <span>Total HT</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span>TVA (18%)</span>
                        <span>{formatCurrency(calculatedTax)}</span>
                    </div>
                </div>
                <div className="flex justify-between items-center text-xl font-black mt-2">
                    <span>TOTAL TTC</span>
                    <span>{formatCurrency(total)}</span>
                </div>

                <div className="text-center text-[10px] mt-4 space-y-1">
                    <p>Merci de votre visite !</p>
                    <p>{brandFooter}</p>
                </div>
            </div>
            
             {/* Force page break after if printing multiple */}
             <div className="print:break-after-page"></div>
        </div>
    );
});

Receipt.displayName = 'Receipt';
