import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Beaker,
  LayoutDashboard,
  Package,
  Truck,
  ShieldAlert,
  GitPullRequest,
  FolderKanban,
  Warehouse,
  ClipboardList,
  BarChart3,
  Users as UsersIcon,
  Bell,
  LogOut,
  User as UserIcon,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import * as notificationsApi from '../api/notifications';
import type { AppNotification, UserRole } from '../types';
import { ToastContainer } from './Toast';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { to: '/products', label: 'Products', icon: <Package size={20} /> },
  { to: '/suppliers', label: 'Suppliers', icon: <Truck size={20} /> },
  { to: '/non-conformances', label: 'Non-Conformances', icon: <ShieldAlert size={20} /> },
  { to: '/change-requests', label: 'Change Requests', icon: <GitPullRequest size={20} /> },
  { to: '/projects', label: 'Projects', icon: <FolderKanban size={20} /> },
  { to: '/inventory', label: 'Inventory', icon: <Warehouse size={20} /> },
  { to: '/my-tasks', label: 'My Tasks', icon: <ClipboardList size={20} /> },
  { to: '/reports', label: 'Reports', icon: <BarChart3 size={20} /> },
  { to: '/users', label: 'Users', icon: <UsersIcon size={20} />, roles: ['ADMIN'] },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasRole } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadUnread = () => {
      notificationsApi
        .fetchUnreadCount()
        .then((r) => setUnreadCount(r.count))
        .catch(() => {});
    };
    loadUnread();
    const interval = setInterval(loadUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openNotifications = () => {
    setShowNotifications((v) => !v);
    if (!showNotifications) {
      notificationsApi.fetchNotifications().then(setNotifications).catch(() => {});
    }
  };

  const handleNotificationClick = async (n: AppNotification) => {
    if (!n.read) {
      await notificationsApi.markRead(n.id);
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
    if (n.link) navigate(n.link);
    setShowNotifications(false);
  };

  const handleMarkAllRead = async () => {
    await notificationsApi.markAllRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
  };

  const visibleNavItems = NAV_ITEMS.filter((item) => !item.roles || hasRole(...item.roles));

  return (
    <div className="app-layout">
      <button
        className="btn btn-secondary hamburger-btn"
        onClick={() => setIsMobileNavOpen((v) => !v)}
        aria-label="Toggle navigation"
      >
        {isMobileNavOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <div
        className={`sidebar-overlay ${isMobileNavOpen ? 'open' : ''}`}
        onClick={() => setIsMobileNavOpen(false)}
      />
      <div className={`sidebar ${isMobileNavOpen ? 'open' : ''}`}>
        <h2 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Beaker color="var(--accent-primary)" /> FormCraft PLM
        </h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {visibleNavItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-link ${location.pathname === item.to ? 'active' : ''}`}
              onClick={() => setIsMobileNavOpen(false)}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="main-content">
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1.5rem' }}>
          <div ref={bellRef} style={{ position: 'relative' }}>
            <button
              className="btn btn-secondary"
              style={{ position: 'relative', padding: '0.5rem' }}
              onClick={openNotifications}
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    background: 'var(--danger)',
                    color: 'white',
                    borderRadius: '9999px',
                    fontSize: '0.65rem',
                    padding: '0.1rem 0.4rem',
                    fontWeight: 700,
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div
                className="glass-panel animate-fade-in"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '2.75rem',
                  width: 'min(360px, calc(100vw - 2rem))',
                  maxHeight: '420px',
                  overflowY: 'auto',
                  padding: '1rem',
                  zIndex: 60,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <strong>Notifications</strong>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                    onClick={handleMarkAllRead}
                  >
                    Mark all read
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <p className="text-muted" style={{ fontSize: '0.875rem' }}>No notifications yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        style={{
                          padding: '0.6rem',
                          borderRadius: 'var(--radius-md)',
                          background: n.read ? 'transparent' : 'rgba(59,130,246,0.1)',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{n.title}</div>
                        {n.message && <div className="text-muted" style={{ fontSize: '0.75rem' }}>{n.message}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div ref={userMenuRef} style={{ position: 'relative' }}>
            <button className="btn btn-secondary" onClick={() => setShowUserMenu((v) => !v)}>
              <UserIcon size={16} /> {user?.fullName || user?.username} ({user?.role})
            </button>
            {showUserMenu && (
              <div
                className="glass-panel animate-fade-in"
                style={{ position: 'absolute', right: 0, top: '2.75rem', padding: '0.5rem', zIndex: 60, minWidth: '160px' }}
              >
                <button
                  className="btn btn-danger"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={logout}
                >
                  <LogOut size={16} /> Log out
                </button>
              </div>
            )}
          </div>
        </div>

        {children}
      </div>
      <ToastContainer />
    </div>
  );
}
