import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Mail, MessageSquare, PenSquare, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/inbox', label: 'Inbox', icon: Mail },
  { to: '/chat', label: 'Chat Assistant', icon: MessageSquare },
  { to: '/compose', label: 'Compose', icon: PenSquare }
];

export default function Navbar() {
  const { user, logout } = useAuth();
  
  console.log('Navbar - user data:', user);

  return (
    <header className="navbar">
      <NavLink className="brand" to="/dashboard">
        <Sparkles size={20} style={{ color: 'var(--brand-color)' }} />
        <span>Gmail <span className="accent">Intelligence</span></span>
      </NavLink>
      
      {user ? (
        <nav className="nav-links" aria-label="Primary navigation">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink key={link.to} className="nav-link" to={link.to}>
                <Icon size={16} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px', paddingLeft: '12px', borderLeft: '1px solid var(--border-color)' }}>
            {user.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.name || 'User'} 
                title={user.name || user.google_email}
                style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--brand-color)' }} 
              />
            ) : (
              <div 
                className="avatar" 
                title={user.name || user.google_email}
                style={{ width: '32px', height: '32px', fontSize: '12px', border: '2px solid var(--brand-color)', background: 'var(--brand-soft)', color: 'var(--brand-color)' }}
              >
                {(user.name || user.google_email || 'U')[0].toUpperCase()}
              </div>
            )}
            
            <button 
              className="icon-button" 
              type="button" 
              onClick={logout} 
              title="Logout" 
              aria-label="Logout"
              style={{ width: '36px', height: '36px', borderRadius: '50%' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
