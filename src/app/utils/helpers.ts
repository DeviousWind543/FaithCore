import { toast } from 'react-toastify';

export const handleApiError = (error: any, defaultMessage: string = 'Ocurrió un error') => {
    console.error('API Error:', error);
    const message = error.response?.data?.message || error.response?.data?.error || error.message || defaultMessage;
    toast.error(message);
    return message;
};

export const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
    };
};

export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('es-EC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const truncateText = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
};