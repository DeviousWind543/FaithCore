// src/config/constants.ts

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

/**
 * Obtiene la URL completa para medios subidos por usuarios (imágenes/videos)
 * Estos se sirven desde el backend a través de Cloudflare Tunnel
 */
export const getMediaUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    // Limpiar dobles barras
    const cleanUrl = url.startsWith('/') ? url : '/' + url;
    return `${SOCKET_URL}${cleanUrl}`;
};

/**
 * Obtiene la URL completa para assets estáticos del frontend (imágenes locales, videos)
 * Estos se sirven desde GitHub Pages
 */
export const getStaticAssetUrl = (path: string): string => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    return `${BASE_PATH}${cleanPath}`;
};

/**
 * Calcula la edad a partir de una fecha de nacimiento
 */
export const calculateAge = (birthdateString: string | undefined): string | number => {
    if (!birthdateString) return 'N/A';
    const birthdate = new Date(birthdateString);
    const today = new Date();
    let age = today.getFullYear() - birthdate.getFullYear();
    const monthDifference = today.getMonth() - birthdate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthdate.getDate())) {
        age--;
    }
    return age >= 0 ? age : 'N/A';
};

/**
 * Obtiene headers de autenticación para peticiones API
 */
export const getAuthHeaders = () => {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('token');
    return {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
    };
};

/**
 * Maneja errores de API de forma consistente
 */
export const handleApiError = (error: any, defaultMessage: string = 'Ocurrió un error') => {
    console.error('API Error:', error);
    const message = error.response?.data?.message || error.response?.data?.error || error.message || defaultMessage;
    return message;
};

/**
 * Formatea una fecha a string local
 */
export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('es-EC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};