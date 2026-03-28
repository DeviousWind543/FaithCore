'use client';

import Link from 'next/link';
import { getStaticAssetUrl } from '@/config/constants';

export default function NotFound() {
    const basePath = getStaticAssetUrl('');

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
            <div className="text-center p-8">
                <h1 className="text-8xl font-bold mb-4 text-purple-500">404</h1>
                <h2 className="text-3xl font-semibold mb-4">Página no encontrada</h2>
                <p className="text-gray-400 mb-8">
                    Lo sentimos, la página que buscas no existe o ha sido movida.
                </p>
                <Link
                    href={`${basePath}/`}
                    className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:scale-105 transition-transform shadow-lg"
                >
                    Volver al inicio
                </Link>
            </div>
        </div>
    );
}