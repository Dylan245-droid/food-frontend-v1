import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from './ui/Button';

interface NoCashSessionAlertProps {
    show: boolean;
}

/**
 * Alert component shown when user tries to perform cash operations without an active session
 */
export function NoCashSessionAlert({ show }: NoCashSessionAlertProps) {
    if (!show) return null;

    return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-4 flex-1">
                <div className="bg-red-100 p-2 rounded-lg shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                    <h3 className="font-bold text-red-900 leading-none">Session de caisse requise</h3>
                    <p className="text-xs md:text-sm text-red-700 mt-1.5">
                        Ouvrez une session de caisse pour encaisser des commandes.
                    </p>
                </div>
            </div>
            <Link to="/admin/cash" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto shrink-0 border-red-300 text-red-700 hover:bg-red-100 font-bold py-2 h-auto text-xs md:text-sm">
                    Ouvrir une caisse <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </Link>
        </div>
    );
}
