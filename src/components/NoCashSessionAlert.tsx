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
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="bg-red-100 p-2 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-red-900">Session de caisse requise</h3>
                <p className="text-sm text-red-700 mt-1">
                    Vous devez ouvrir une session de caisse avant de pouvoir encaisser des commandes sur place ou à emporter.
                </p>
            </div>
            <Link to="/admin/cash">
                <Button variant="outline" className="shrink-0 border-red-300 text-red-700 hover:bg-red-100">
                    Ouvrir une caisse <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </Link>
        </div>
    );
}
