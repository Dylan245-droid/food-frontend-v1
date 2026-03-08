import { toast } from 'sonner';

export const showToast = {
    success: (message: string, options?: any) => toast.success(message, options),
    error: (message: string, options?: any) => toast.error(message, options),
    info: (message: string, options?: any) => toast.info(message, options),
    warning: (message: string, options?: any) => toast.warning(message, options),
    loading: (message: string, options?: any) => toast.loading(message, options),
};
