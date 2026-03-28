'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { API_BASE_URL, getStaticAssetUrl } from '@/config/constants';

interface LoginFormState {
    email: string;
    password: string;
}

export default function LoginPage() {
    const router = useRouter();
    const [form, setForm] = useState<LoginFormState>({ email: '', password: '' });
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [passwordVisible, setPasswordVisible] = useState<boolean>(false);

    const videoUrl = getStaticAssetUrl('/1.mp4');

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const togglePasswordVisibility = () => {
        setPasswordVisible(prev => !prev);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await axios.post<{ token: string; user: any }>(`${API_BASE_URL}/auth/login`, form);

            const { token, user } = res.data;

            if (typeof window !== 'undefined') {
                localStorage.setItem('token', token);
                localStorage.setItem('userId', user.id);
                localStorage.setItem('userName', user.name);
                localStorage.setItem('userEmail', user.email);
                localStorage.setItem('role', String(user.role_id));

                let roleString: string;
                switch (user.role_id) {
                    case 1: roleString = 'admin'; break;
                    case 2: roleString = 'teacher'; break;
                    case 3: roleString = 'manager'; break;
                    default: roleString = 'user';
                }
                localStorage.setItem('userRole', roleString);

                if (user.class_group_id) {
                    localStorage.setItem('userClassGroupId', user.class_group_id);
                }
            }

            router.push('/dashboard');

        } catch (err: any) {
            console.error('Login error:', err.response?.data || err.message);
            setError(err.response?.data?.message || 'Error al iniciar sesión. Por favor, revisa tus credenciales.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden p-4">
            <video
                className="absolute top-0 left-0 w-full h-full object-cover opacity-40"
                src={videoUrl}
                autoPlay
                loop
                muted
                playsInline
            />

            <div className="absolute inset-0 z-0">
                <div className="absolute w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-[150px] animate-pulse top-[-150px] left-[-150px]" />
                <div className="absolute w-[400px] h-[400px] bg-blue-500/30 rounded-full blur-[150px] animate-ping bottom-[-100px] right-[-100px]" />
            </div>

            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1 }}
                className="relative z-10 w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl mx-auto"
            >
                <h2 className="text-3xl sm:text-4xl font-extrabold text-center bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    Iniciar Sesión
                </h2>
                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-400 text-sm sm:text-base text-center mt-4"
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                    <div className="relative group">
                        <input
                            type="email"
                            name="email"
                            placeholder="Correo electrónico"
                            value={form.email}
                            onChange={handleChange}
                            required
                            className="w-full p-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400 transition text-base sm:text-lg"
                        />
                    </div>

                    <div className="relative group">
                        <input
                            type={passwordVisible ? 'text' : 'password'}
                            name="password"
                            placeholder="Contraseña"
                            value={form.password}
                            onChange={handleChange}
                            required
                            className="w-full p-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400 transition pr-10 text-base sm:text-lg"
                        />
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-300 hover:text-white"
                            aria-label={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                            {passwordVisible ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.577 3.01 9.964 7.173a1.012 1.012 0 0 1 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.577-3.01-9.964-7.173Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.577 3.01 9.964 7.173a1.012 1.012 0 0 1 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.577-3.01-9.964-7.173Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                                </svg>
                            )}
                        </button>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0,255,255,0.8)' }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold transition disabled:opacity-50 text-base sm:text-lg"
                    >
                        {loading ? 'Ingresando...' : 'Ingresar'}
                    </motion.button>
                </form>

                <p className="mt-6 text-center text-sm sm:text-base text-gray-300">
                    ¿No tienes cuenta?{' '}
                    <a href="/register" className="text-purple-400 hover:underline">
                        Regístrate
                    </a>
                </p>
            </motion.div>
        </div>
    );
}