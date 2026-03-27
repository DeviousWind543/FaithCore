import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/config/constants';

export const useSocket = (userId: string | number | null) => {
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!userId) return;

        if (socketRef.current?.connected) {
            socketRef.current.disconnect();
        }

        socketRef.current = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['polling', 'websocket'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('🔌 Conectado al servidor Socket.IO:', socket.id);
            setIsConnected(true);
            socket.emit('set-user-online', userId);
        });

        socket.on('disconnect', () => {
            console.log('🔌 Desconectado del servidor Socket.IO');
            setIsConnected(false);
        });

        socket.on('connect_error', (err) => {
            console.error('Socket.IO connection error:', err.message);
            setIsConnected(false);
        });

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [userId]);

    return { socket: socketRef.current, isConnected };
};