'use client'
import { useEffect, useState, useRef, ReactNode, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { jwtDecode } from 'jwt-decode'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiUser, FiUsers, FiFileText, FiCalendar, FiBookOpen, 
  FiWifi, FiCheckCircle, FiEdit, FiBell, 
  FiBarChart2, FiPieChart, FiBook, FiGlobe, 
  FiHome, FiPlusCircle, FiClipboard, FiHeart, 
  FiMenu, FiChevronLeft, FiChevronRight, FiSettings, 
  FiList, FiActivity, FiLogOut, FiSun, FiMoon
} from 'react-icons/fi';
import { RiAdminFill } from 'react-icons/ri'
import { FaChalkboardTeacher } from 'react-icons/fa'
import { IoMdNotificationsOutline } from 'react-icons/io'
import { io, Socket } from 'socket.io-client'
import AdminPanel from '../components/AdminPanel'
import ManagerPanel from '../components/ManagerPanel'
import TeacherPanel from '../components/TeacherPanel'
import UserPanel from '../components/UserPanel'
import axios from 'axios'
import { API_BASE_URL, SOCKET_URL, getStaticAssetUrl } from '@/config/constants'

type Role = '1' | '2' | '3' | '4' | string | null

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'system_crud';
  actor_id: number;
  actor_name: string;
  post_title?: string;
  content: string;
  read_status: boolean;
  created_at: string;
}

interface SidebarButton {
  label: string
  icon: ReactNode
  tab: string
  onClick: () => void
  extra?: ReactNode
}

export default function DashboardPage() {
  const router = useRouter()
  const [role, setRole] = useState<Role>(null)
  const [userId, setUserId] = useState<string | number | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<string>('')
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0)
  const [unreadSystemActivityCount, setUnreadSystemActivityCount] = useState<number>(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(true)
  const [adminPanelSection, setAdminPanelSection] = useState<string>('')
  const socketRef = useRef<Socket | null>(null)
  const [connectedUsers, setConnectedUsers] = useState<any[]>([])
  const [connectedUsersCount, setConnectedUsersCount] = useState<number>(0)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const getThemeClass = (lightClass: string, darkClass: string) => {
    return theme === 'light' ? lightClass : darkClass;
  };

  // Admin tabs
  const adminPanelButtons: SidebarButton[] = [
    { tab: 'users', label: 'Usuarios', icon: <FiUsers className="text-lg flex-shrink-0" />, onClick: () => {} },
    { tab: 'posts', label: 'Publicaciones', icon: <FiFileText className="text-lg flex-shrink-0" />, onClick: () => {} },
    { tab: 'attendance', label: 'Asistencia', icon: <FaChalkboardTeacher className="text-lg flex-shrink-0" />, onClick: () => {} },
    { tab: 'list', label: 'Alumnos', icon: <FiBookOpen className="text-lg flex-shrink-0" />, onClick: () => {} },
    { tab: 'connected', label: 'Conectados', icon: <FiWifi className="text-lg flex-shrink-0" />, onClick: () => {} },
    { tab: 'activity-log', label: 'Registro Actividad', icon: <FiList className="text-lg flex-shrink-0" />, onClick: () => {} },
    { tab: 'settings', label: 'Configuración', icon: <FiSettings className="text-lg flex-shrink-0" />, onClick: () => {} }
  ]
  
  const teacherPanelButtons: SidebarButton[] = [
    { tab: 'alumnos', label: 'Alumnos', icon: <FiUsers className="text-lg flex-shrink-0" />, onClick: () => {} },
    { tab: 'asistencia', label: 'Asistencia', icon: <FiCheckCircle className="text-lg flex-shrink-0" />, onClick: () => {} },
    { tab: 'posts', label: 'Publicaciones', icon: <FiEdit className="text-lg flex-shrink-0" />, onClick: () => {} },
    { tab: 'profile', label: 'Perfil', icon: <FiUser className="text-lg flex-shrink-0" />, onClick: () => {} },
    { tab: 'notifications', label: 'Notificaciones', icon: <IoMdNotificationsOutline className="text-lg flex-shrink-0" />, onClick: () => {} },
    { tab: 'settings', label: 'Configuración', icon: <FiSettings className="text-lg flex-shrink-0" />, onClick: () => {} }
  ];
  
  const managerPanelButtons: SidebarButton[] = [
    { tab: 'posts', label: 'Publicaciones', icon: <FiEdit className="text-lg flex-shrink-0" />, onClick: () => {} },
    { tab: 'attendance-reports', label: 'Reportes de Asistencia', icon: <FiPieChart className="text-lg flex-shrink-0" />, onClick: () => {} },
    { tab: 'student-list', label: 'Lista de Estudiantes', icon: <FiBook className="text-lg flex-shrink-0" />, onClick: () => {} },
    { tab: 'connected-users', label: 'Usuarios Conectados', icon: <FiUsers className="text-lg flex-shrink-0" />, onClick: () => {} },
    { tab: 'settings', label: 'Configuración', icon: <FiSettings className="text-lg flex-shrink-0" />, onClick: () => {} }
  ]
  
  const userPanelButtons: SidebarButton[] = [
    { tab: 'feed', label: 'Feed de Publicaciones', icon: <FiHome className="text-lg flex-shrink-0" />, onClick: () => {} },
    { tab: 'createPost', label: 'Crear Publicación', icon: <FiPlusCircle className="text-lg flex-shrink-0" />, onClick: () => {} },
    { tab: 'profile', label: 'Mi Perfil', icon: <FiUser className="text-lg flex-shrink-0" />, onClick: () => {} },
    { tab: 'asistencias', label: 'Asistencias', icon: <FiClipboard className="text-lg flex-shrink-0" />, onClick: () => {} },
    { tab: 'donations', label: 'Donaciones', icon: <FiHeart className="text-lg flex-shrink-0" />, onClick: () => {} },
    { tab: 'settings', label: 'Configuración', icon: <FiSettings className="text-lg flex-shrink-0" />, onClick: () => {} }
  ]

  const allPanelButtonsByRole: Record<string, SidebarButton[]> = {
    '1': adminPanelButtons,
    '2': teacherPanelButtons,
    '3': managerPanelButtons,
    '4': userPanelButtons,
  };

  const panelTabNamesByRole: Record<string, string[]> = {
    '1': ['users', 'posts', 'attendance', 'list', 'connected', 'activity-log', 'settings'],
    '2': ['alumnos', 'asistencia', 'posts', 'profile', 'notifications', 'settings'],
    '3': ['posts', 'attendance-reports', 'student-list', 'connected-users', 'settings'],
    '4': ['feed', 'createPost', 'profile', 'asistencias', 'donations', 'settings']
  }

  const fetchUnreadNotificationsCount = useCallback(async (currentUserId: string | number) => {
    const token = localStorage.getItem('token');
    if (!currentUserId || !token) return;

    try {
      const res = await axios.get<Notification[]>(`${API_BASE_URL}/notifications/${currentUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const unreadCount = res.data.filter(n => !n.read_status && (n.type === 'like' || n.type === 'comment')).length;
      setUnreadNotifications(unreadCount);
    } catch (error) {
      console.error('Error loading unread social notifications:', error);
      setUnreadNotifications(0);
    }
  }, []);

  const fetchUnreadSystemActivityCount = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await axios.get<{ unread_count: number }>(`${API_BASE_URL}/notifications/system-crud/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadSystemActivityCount(res.data.unread_count);
    } catch (error) {
      console.error('Error loading unread system activity notifications:', error);
      setUnreadSystemActivityCount(0);
    }
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else if (systemPrefersDark) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const getSidebarButtons = (): SidebarButton[] => {
    const allButtonsForRole = allPanelButtonsByRole[role || '4'] || allPanelButtonsByRole['4'];
    const allowedTabNames = panelTabNamesByRole[role || '4'] || panelTabNamesByRole['4'];

    return allButtonsForRole
        .filter(tabInfo => allowedTabNames.includes(tabInfo.tab))
        .map(tabInfo => {
            let extraContent: ReactNode = undefined;
            if (tabInfo.tab === 'connected' && role === '1' && connectedUsersCount > 0) {
                extraContent = (
                    <span className={`
                        ${isSidebarCollapsed ? 'absolute -top-1 -right-1 w-6 h-6 text-xs' : 'ml-auto px-2 py-1'}
                        bg-green-500 text-white rounded-full flex items-center justify-center animate-pulse
                    `}>
                        {connectedUsersCount}
                    </span>
                );
            } else if (tabInfo.tab === 'activity-log' && role === '1' && unreadSystemActivityCount > 0) {
                extraContent = (
                    <span className={`
                        ${isSidebarCollapsed ? 'absolute -top-1 -right-1 w-6 h-6 text-xs' : 'ml-auto px-2 py-1'}
                        bg-blue-500 text-white rounded-full flex items-center justify-center animate-bounce
                    `}>
                        {unreadSystemActivityCount}
                    </span>
                );
            } else if (tabInfo.tab === 'connected-users' && role === '3' && connectedUsersCount > 0) {
                extraContent = (
                    <span className={`
                        ${isSidebarCollapsed ? 'absolute -top-1 -right-1 w-6 h-6 text-xs' : 'ml-auto px-2 py-1'}
                        bg-green-500 text-white rounded-full flex items-center justify-center animate-pulse
                    `}>
                        {connectedUsersCount}
                    </span>
                );
            } else if (tabInfo.tab === 'notifications' && (role === '2' || role === '4') && unreadNotifications > 0) {
                extraContent = (
                    <span className={`
                        ${isSidebarCollapsed ? 'absolute -top-1 -right-1 w-6 h-6 text-xs' : 'ml-auto px-2 py-1'}
                        bg-red-500 text-white rounded-full flex items-center justify-center animate-bounce
                    `}>
                        {unreadNotifications}
                    </span>
                );
            }

            return {
                ...tabInfo,
                onClick: () => { setActiveTab(tabInfo.tab); setIsMenuOpen(false); },
                extra: extraContent
            };
        });
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    try {
      const decoded: any = jwtDecode(token)
      if (decoded.exp < Date.now() / 1000) {
        clearUserData()
        router.push('/login')
        return
      }
      const userRole = decoded.role_id?.toString();
      setRole(userRole);
      setUserId(decoded.id);
      setUserName(decoded.name || '');

      if (userRole === '1') {
        setActiveTab('users');
        setAdminPanelSection('users');
      } else if (userRole === '2') {
        setActiveTab('alumnos');
      } else if (userRole === '3') {
        setActiveTab('posts');
      } else {
        setActiveTab('feed');
      }

      setLoading(false);
      localStorage.setItem('userId', decoded.id);
      fetchUnreadNotificationsCount(decoded.id);
      if (userRole === '1') {
        fetchUnreadSystemActivityCount();
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      clearUserData();
      router.push('/login');
    }
  }, [router, fetchUnreadNotificationsCount, fetchUnreadSystemActivityCount]);

  useEffect(() => {
    if (!userId) return
    if (socketRef.current) {
      socketRef.current.disconnect()
    }
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
    const socket = socketRef.current
    socket.on('connect', () => {
      socket.emit('set-user-online', userId)
    })
    socket.on('online-users-updated', (users: any[]) => {
      setConnectedUsers(users)
      setConnectedUsersCount(users.length)
    })
    socket.on('new-personal-notification', (notification: Notification) => {
      if (!notification.read_status && (notification.type === 'like' || notification.type === 'comment')) {
        setUnreadNotifications(prev => prev + 1);
      }
    })
    socket.on('new-system-crud-notification', (notification: Notification) => {
      if (!notification.read_status) {
        setUnreadSystemActivityCount(prev => prev + 1);
      }
    });
    socket.on('system-notification-read-status-changed', () => {
      fetchUnreadSystemActivityCount();
    });
    socket.on('all-system-notifications-read', () => {
      setUnreadSystemActivityCount(0);
    });
    socket.on('personal-notification-read-status-changed', () => {
      if (userId) fetchUnreadNotificationsCount(userId);
    });
    socket.on('all-personal-notifications-read', () => {
      setUnreadNotifications(0);
    });
    socket.on('disconnect', () => {})
    socket.on('connect_error', (err: any) => {
      console.error('Socket.IO connection error:', err.message)
    })
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [userId, fetchUnreadSystemActivityCount, fetchUnreadNotificationsCount])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const clearUserData = () => {
    ;['token', 'userId', 'userRole', 'userName', 'userEmail', 'userClassGroupId'].forEach(
      item => localStorage.removeItem(item)
    )
  }

  const handleMarkNotificationAsRead = useCallback(async () => {
    if (userId) {
      await fetchUnreadNotificationsCount(userId);
    }
  }, [userId, fetchUnreadNotificationsCount]);

  const logout = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('set-user-offline', userId)
    }
    clearUserData()
    router.push('/login')
  }

  const getRoleIcon = (): ReactNode => {
    switch (role) {
      case '1': return <RiAdminFill className="text-indigo-600 dark:text-indigo-400 text-xl" />
      case '2': return <FaChalkboardTeacher className="text-purple-600 dark:text-purple-400 text-xl" />
      case '3': return <FiUser className="text-yellow-600 dark:text-yellow-400 text-xl" />
      default: return <FiUser className="text-pink-600 dark:text-pink-400 text-xl" />
    }
  }

  const getRoleName = (): string => {
    switch (role) {
      case '1': return 'Administrador'
      case '2': return 'Profesor'
      case '3': return 'Gerente'
      default: return 'Usuario'
    }
  }

  const getPanelTabs = (): string[] => {
    return panelTabNamesByRole[role || '4'] || [];
  }

  if (loading || activeTab === '') {
    return (
      <div className={`flex justify-center items-center min-h-screen ${getThemeClass(
        'bg-gradient-to-br from-slate-50 to-slate-100',
        'bg-gradient-to-br from-slate-900 to-slate-800'
      )}`}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-indigo-600 dark:border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`text-xl font-semibold ${getThemeClass('text-slate-800', 'text-white')}`}>Cargando dashboard...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${
      theme === 'light' 
        ? 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900' 
        : 'bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100'
    }`}>
      {/* Sidebar para desktop */}
      <div className={`hidden md:flex fixed inset-y-0 left-0 ${isSidebarCollapsed ? 'w-20' : 'w-64'} ${
        theme === 'light' 
          ? 'bg-white/95 backdrop-blur-lg border-r border-slate-200' 
          : 'bg-slate-800/90 backdrop-blur-lg border-r border-slate-700/50'
      } flex-col z-20 transition-all duration-300 ease-in-out`}>
        <div className={`p-6 ${
          theme === 'light' ? 'border-b border-slate-200' : 'border-b border-slate-700/50'
        } ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
          {isSidebarCollapsed ? (
            <h1 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">F</span>
            </h1>
          ) : (
            <>
              <h1 className="text-2xl font-bold">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">FaithCore</span>
              </h1>
              <div className="mt-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${
                  theme === 'light' ? 'bg-slate-100' : 'bg-slate-700'
                } flex items-center justify-center`}>{getRoleIcon()}</div>
                <div>
                  <p className={`font-medium ${
                    theme === 'light' ? 'text-slate-800' : 'text-white'
                  }`}>{userName}</p>
                  <p className={`text-xs ${
                    theme === 'light' ? 'text-slate-600' : 'text-slate-400'
                  }`}>{getRoleName()}</p>
                </div>
              </div>
            </>
          )}
        </div>
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`absolute -right-12 top-1/2 -translate-y-1/2 w-5 h-30 ${
            theme === 'light' 
              ? 'bg-white border border-slate-300 hover:bg-slate-100' 
              : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'
          } rounded-r-xl shadow-lg flex items-center justify-center transition-all group z-50`}
          aria-label={isSidebarCollapsed ? 'Expand menu' : 'Collapse menu'}
        >
          <motion.div initial={{ rotate: 0 }} animate={{ rotate: isSidebarCollapsed ? 0 : 180 }} transition={{ duration: 0.3 }}>
            {isSidebarCollapsed ? (
              <FiChevronRight className={`text-sm group-hover:text-indigo-500 dark:group-hover:text-indigo-300 ${
                theme === 'light' ? 'text-slate-600' : 'text-white'
              }`} />
            ) : (
              <FiChevronLeft className={`text-sm group-hover:text-indigo-500 dark:group-hover:text-indigo-300 ${
                theme === 'light' ? 'text-slate-600' : 'text-white'
              }`} />
            )}
          </motion.div>
        </button>
        <nav className="flex-1 p-4 space-y-1">
          {getSidebarButtons().map((tabInfo) => (
            <button
              key={tabInfo.label}
              onClick={tabInfo.onClick}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ease-in-out
                ${activeTab === tabInfo.tab
                  ? theme === 'light'
                    ? 'bg-indigo-600/20 text-indigo-700 border border-indigo-600/30 shadow-md'
                    : 'bg-indigo-600/20 text-white border border-indigo-500/30 shadow-md'
                  : theme === 'light'
                    ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }
                ${isSidebarCollapsed ? 'justify-center relative' : ''}
              `}
            >
              {tabInfo.icon}
              {!isSidebarCollapsed && <span className="truncate">{tabInfo.label}</span>}
              {tabInfo.extra}
            </button>
          ))}
        </nav>
        
        <div className={`p-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-slate-700/50'}`}>
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ease-in-out ${
              theme === 'light'
                ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            } ${isSidebarCollapsed ? 'justify-center' : ''}`}
            aria-label={`Cambiar a tema ${theme === 'dark' ? 'claro' : 'oscuro'}`}
          >
            {theme === 'dark' ? (
              <FiSun className="text-lg flex-shrink-0" />
            ) : (
              <FiMoon className="text-lg flex-shrink-0" />
            )}
            {!isSidebarCollapsed && (
              <span className="truncate">
                {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              </span>
            )}
          </button>
        </div>

        <div className={`p-4 border-t ${theme === 'light' ? 'border-slate-200' : 'border-slate-700/50'}`}>
          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ease-in-out ${
              theme === 'light'
                ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            } ${isSidebarCollapsed ? 'justify-center' : ''}`}
          >
            <FiLogOut className="text-lg flex-shrink-0" />
            {!isSidebarCollapsed && <span className="truncate">Cerrar sesión</span>}
          </button>
        </div>
        
        {!isSidebarCollapsed && (
          <div className={`p-4 text-center text-xs border-t ${
            theme === 'light' 
              ? 'border-slate-200 text-slate-500' 
              : 'border-slate-700/50 text-slate-500'
          } mt-auto`}>
            <p className="neon-text font-bold tracking-wider">
              Plataforma creada por DeviousWind
            </p>
            <p className={`mt-1 ${theme === 'light' ? 'text-slate-400' : 'text-slate-600'}`}>
              © {new Date().getFullYear()} Todos los derechos reservados.
            </p>
          </div>
        )}
      </div>

      {/* Mobile header */}
      <header className={`md:hidden fixed top-0 left-0 right-0 backdrop-blur-md z-30 border-b p-4 flex justify-between items-center ${
        theme === 'light'
          ? 'bg-white/90 border-slate-200 text-slate-800'
          : 'bg-slate-800/90 border-slate-700/50 text-slate-100'
      }`}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`p-2 rounded-lg transition-colors ${
            theme === 'light'
              ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
              : 'bg-slate-700/50 text-white hover:bg-slate-600'
          }`}
          aria-label="Open menu"
        >
          <FiMenu className="text-xl" />
        </button>
        <h1 className="text-xl font-bold">
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            FaithCore
          </span>
        </h1>
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-lg transition-colors ${
            theme === 'light'
              ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
              : 'bg-slate-700/50 text-white hover:bg-slate-600'
          }`}
          aria-label={`Cambiar a tema ${theme === 'dark' ? 'claro' : 'oscuro'}`}
        >
          {theme === 'dark' ? <FiSun className="text-lg" /> : <FiMoon className="text-lg" />}
        </button>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsMenuOpen(false)}
          >
            <motion.div
              ref={mobileMenuRef}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className={`fixed inset-y-0 left-0 w-64 backdrop-blur-sm z-40 border-r shadow-xl ${
                theme === 'light'
                  ? 'bg-white/95 border-slate-200 text-slate-800'
                  : 'bg-slate-800/95 border-slate-700/50 text-slate-100'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`p-6 border-b ${theme === 'light' ? 'border-slate-200' : 'border-slate-700/50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    theme === 'light' ? 'bg-slate-100' : 'bg-slate-700'
                  }`}>
                    {getRoleIcon()}
                  </div>
                  <div>
                    <p className={`font-medium ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{userName}</p>
                    <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>{getRoleName()}</p>
                  </div>
                </div>
              </div>
              <nav className="flex-1 p-4 space-y-1">
                {getSidebarButtons().map((tabInfo) => (
                  <button
                    key={tabInfo.label}
                    onClick={tabInfo.onClick}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ease-in-out
                      ${activeTab === tabInfo.tab
                        ? theme === 'light'
                          ? 'bg-indigo-600/20 text-indigo-700 border border-indigo-600/30 shadow-md'
                          : 'bg-indigo-600/20 text-white border border-indigo-500/30 shadow-md'
                        : theme === 'light'
                          ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                      }
                    `}
                  >
                    {tabInfo.icon}
                    <span>{tabInfo.label}</span>
                    {tabInfo.extra}
                  </button>
                ))}
              </nav>
              
              <div className={`p-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-slate-700/50'}`}>
                <button
                  onClick={toggleTheme}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ease-in-out ${
                    theme === 'light'
                      ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  {theme === 'dark' ? <FiSun className="text-lg" /> : <FiMoon className="text-lg" />}
                  <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
                </button>
              </div>

              <div className={`p-4 border-t ${theme === 'light' ? 'border-slate-200' : 'border-slate-700/50'}`}>
                <button
                  onClick={logout}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ease-in-out ${
                    theme === 'light'
                      ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <FiLogOut className="text-lg" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
              
              <div className={`p-4 text-center text-xs border-t ${
                theme === 'light' 
                  ? 'border-slate-200 text-slate-500' 
                  : 'border-slate-700/50 text-slate-500'
              } mt-auto`}>
                <p className="neon-text font-bold tracking-wider">
                  Plataforma creada por DeviousWind
                </p>
                <p className={`mt-1 ${theme === 'light' ? 'text-slate-400' : 'text-slate-600'}`}>
                  © {new Date().getFullYear()} Todos los derechos reservados.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`flex-1 ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'} pt-16 md:pt-0 min-h-screen transition-all duration-300 ease-in-out`}>
        <div className="p-6 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className={`text-2xl md:text-3xl font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
                  Bienvenido, <span className="text-indigo-600 dark:text-indigo-300">{userName}</span>
                </h2>
                <p className={`flex items-center gap-2 mt-1 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                  {getRoleIcon()} {getRoleName()}
                </p>
              </div>
              
              {(role === '1' || role === '3') && (
                <div
                  className={`rounded-lg px-4 py-2 flex items-center gap-2 cursor-pointer transition-colors ${
                    theme === 'light'
                      ? 'bg-white border border-slate-300 hover:bg-slate-50'
                      : 'bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/70'
                  }`}
                  onClick={() => role === '1' ? setActiveTab('connected') : setActiveTab('connected-users')}
                >
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                  <span className={`text-sm ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                    {connectedUsersCount} usuarios conectados
                  </span>
                </div>
              )}
            </div>
          </motion.div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mt-8"
            >
              {role === '1' && (
                <AdminPanel
                  connectedUsers={connectedUsers}
                  connectedUsersCount={connectedUsersCount}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  activeSection={adminPanelSection}
                  setActiveSection={setAdminPanelSection}
                  allowedTabs={getPanelTabs()}
                  theme={theme}
                />
              )}
              {role === '2' && (
                <TeacherPanel
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  allowedTabs={getPanelTabs()}
                  onNotificationRead={handleMarkNotificationAsRead}
                  theme={theme}
                />
              )}
              {role === '3' && (
                <ManagerPanel
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  theme={theme}
                />
              )}
              {role === '4' && (
                <UserPanel
                  currentUserId={userId}
                  currentUserName={userName}
                  setUserName={setUserName}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}