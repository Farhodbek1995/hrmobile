import React, { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  Settings, Home, Calendar, User, LogOut, ChevronRight, CheckCircle2, XCircle,
  Search, Mic, Clock, Users, CalendarDays, AlertCircle, X
} from 'lucide-react';
import './index.css';
import { api, getBaseUrl, setBaseUrl, getToken, setToken } from './api.js';

// ---------- Auth context ----------
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!getToken()) { setUser(null); setLoading(false); return; }
    try {
      const me = await api.me();
      setUser(me);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (login, password) => {
    const { access_token } = await api.login(login, password);
    setToken(access_token);
    const me = await api.me();
    setUser(me);
    return me;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, reload: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/" replace />;
  return children;
};

const Splash = () => (
  <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
    <div style={{ width: '70px', height: '70px', background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '28px', fontWeight: 'bold', marginBottom: '16px' }}>HR</div>
    <p style={{ color: 'var(--text-light)' }}>Yuklanmoqda...</p>
  </div>
);

// ---------- Shared helpers ----------
const Avatar = ({ name, color, size = 40 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    background: color || 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', fontWeight: 'bold', fontSize: size * 0.4,
  }}>
    {(name || '?').trim().charAt(0).toUpperCase()}
  </div>
);

const toLocalDate = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const UZ_MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
const UZ_DAYS = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];

// ---------- Login ----------
const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [serverIp, setServerIp] = useState(getBaseUrl());
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const saveSettings = () => {
    setBaseUrl(serverIp.replace(/\/+$/, ''));
    setShowSettings(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const me = await login(loginValue, password);
      navigate(me.role === 'employee' ? '/attendance' : '/dashboard');
    } catch (err) {
      setError(err.message || 'Kirishda xatolik yuz berdi');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', padding: '20px' }}>
      <div className="glass" style={{ padding: '30px', position: 'relative' }}>
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}
          aria-label="Sozlamalar"
        >
          <Settings size={24} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))', borderRadius: '24px', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '32px', fontWeight: 'bold' }}>
            HR
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>HR Mobil</h1>
          <p style={{ color: 'var(--text-light)', fontSize: '14px', marginTop: '8px' }}>Tizimga kirish uchun ma'lumotlarni kiriting</p>
        </div>

        {showSettings ? (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>API Sozlamalari</h3>
            <input type="text" className="input-field" value={serverIp} onChange={(e) => setServerIp(e.target.value)} placeholder="http://192.168.1.100:8000" style={{ marginBottom: '16px' }} />
            <button className="btn-primary" onClick={saveSettings}>Saqlash</button>
            <button className="btn-primary" onClick={() => setShowSettings(false)} style={{ background: 'transparent', color: 'var(--text-dark)', boxShadow: 'none', border: '1px solid var(--border-color)', marginTop: '10px' }}>Bekor qilish</button>
          </div>
        ) : (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && <div className="error-box"><AlertCircle size={18} /> {error}</div>}
            <input type="text" className="input-field" placeholder="Login (Telefon raqam)" value={loginValue} onChange={(e) => setLoginValue(e.target.value)} required />
            <input type="password" className="input-field" placeholder="Parol" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit" className="btn-primary" disabled={busy} style={{ marginTop: '10px' }}>
              {busy ? 'Kutilmoqda...' : 'Tizimga Kirish'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// ---------- Bottom nav ----------
const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const navItems = user?.role === 'employee'
    ? [
      { id: 'attendance', icon: <CalendarDays size={24} />, path: '/attendance', label: 'Davomat' },
      { id: 'profile', icon: <User size={24} />, path: '/profile', label: 'Profil' },
    ]
    : [
      { id: 'dashboard', icon: <Home size={24} />, path: '/dashboard', label: 'Asosiy' },
      { id: 'schedule', icon: <Calendar size={24} />, path: '/schedule', label: 'Smena' },
      { id: 'profile', icon: <User size={24} />, path: '/profile', label: 'Profil' },
    ];

  return (
    <div className="glass" style={{
      position: 'fixed', bottom: '20px', left: '20px', right: '20px',
      maxWidth: '440px', margin: '0 auto',
      display: 'flex', justifyContent: 'space-around', padding: '12px 10px',
      borderRadius: '24px', zIndex: 1000,
    }}>
      {navItems.map(item => {
        const isActive = location.pathname.includes(item.path);
        return (
          <div key={item.id} onClick={() => navigate(item.path)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            color: isActive ? 'var(--primary-color)' : 'var(--text-light)',
            cursor: 'pointer', transition: 'color 0.2s',
          }}>
            {item.icon}
            <span style={{ fontSize: '12px', fontWeight: isActive ? '600' : '400' }}>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};

// ---------- Dashboard ----------
const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.statsToday().then(setStats).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="app-container" style={{ padding: '20px 20px 100px 20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', marginTop: '20px' }}>
        <div>
          <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Xush kelibsiz,</p>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold' }}>{user?.full_name || 'Foydalanuvchi'}</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-light)', textTransform: 'capitalize' }}>{user?.role}</p>
        </div>
        <Avatar name={user?.full_name} color="var(--primary-light)" size={48} />
      </header>

      {error && <div className="error-box"><AlertCircle size={18} /> {error}</div>}

      <div className="glass" style={{ padding: '20px', marginBottom: '20px', background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))', color: 'white' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '500', opacity: 0.9 }}>Bugungi Davomat</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', marginTop: '10px' }}>
          <span style={{ fontSize: '36px', fontWeight: 'bold', lineHeight: '1' }}>{stats ? stats.present + stats.late : '—'}</span>
          <span style={{ fontSize: '16px', opacity: 0.8, marginBottom: '4px' }}>/ {stats ? stats.total : '—'} ishchi</span>
        </div>
        <p style={{ marginTop: '10px', fontSize: '14px', opacity: 0.9 }}>
          {stats ? `${stats.absent} ta ishchi hozircha kelmadi` : 'Yuklanmoqda...'}
        </p>
      </div>

      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Tezkor Amallar</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="glass" onClick={() => navigate('/schedule')} style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--secondary-color)', padding: '12px', borderRadius: '16px' }}>
            <Calendar size={28} />
          </div>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>Grafik tuzish</span>
        </div>
        <div className="glass" onClick={() => navigate('/schedule')} style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <div style={{ background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary-color)', padding: '12px', borderRadius: '16px' }}>
            <Users size={28} />
          </div>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>Xodimlar</span>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

// ---------- Brigade Schedule ----------
const BrigadeSchedule = () => {
  const [selectedDate, setSelectedDate] = useState(toLocalDate(new Date()));
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [activeShift, setActiveShift] = useState(null);
  const [selected, setSelected] = useState({}); // employee_id -> bool
  const [search, setSearch] = useState('');
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const touchRef = useRef({ x: 0, y: 0 });
  const recognitionRef = useRef(null);

  // Build 14-day calendar window.
  const days = useMemo(() => {
    const arr = [];
    for (let i = -3; i <= 10; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, []);

  const loadShifts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.schedules(selectedDate);
      setShifts(data);
      if (data.length > 0) {
        setActiveShift((prev) => prev || data[0]);
        const ids = data[0].assigned_employee_ids || [];
        const sel = {};
        ids.forEach((id) => { sel[id] = true; });
        setSelected(sel);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const loadEmployees = useCallback(async () => {
    try {
      const data = await api.employees(search || undefined);
      setAllEmployees(data);
    } catch (e) {
      setError(e.message);
    }
  }, [search]);

  useEffect(() => { loadShifts(); }, [loadShifts]);
  useEffect(() => { loadEmployees(); }, [loadEmployees]);

  // Sync employee list + selected state whenever active shift changes.
  useEffect(() => {
    setEmployees(allEmployees);
    if (activeShift) {
      const ids = activeShift.assigned_employee_ids || [];
      const sel = {};
      ids.forEach((id) => { sel[id] = true; });
      setSelected(sel);
    }
  }, [allEmployees, activeShift]);

  const selectShift = (shift) => {
    setActiveShift(shift);
    const ids = shift.assigned_employee_ids || [];
    const sel = {};
    ids.forEach((id) => { sel[id] = true; });
    setSelected(sel);
  };

  const toggleAssign = (id) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Touch-based swipe: right = assign, left = unassign.
  const onTouchStart = (e, emp) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, id: emp.id };
  };
  const onTouchEnd = (e) => {
    const start = touchRef.current;
    if (!start || !e.changedTouches.length) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) setSelected((prev) => ({ ...prev, [start.id]: true }));
      else setSelected((prev) => ({ ...prev, [start.id]: false }));
      showToast(dx > 0 ? 'Smenaga biriktirildi' : 'Smenadan olib tashlandi');
    }
    touchRef.current = { x: 0, y: 0 };
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const handleBulkSave = async () => {
    if (!activeShift) return;
    const ids = Object.entries(selected).filter(([, v]) => v).map(([k]) => Number(k));
    if (ids.length === 0) { showToast('Kamida bitta xodim tanlang'); return; }
    setLoading(true);
    try {
      const updated = await api.assign(activeShift.id, ids);
      setShifts((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setActiveShift(updated);
      showToast(`${ids.length} ta xodim saqlandi ✅`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Voice search via Web Speech API (works in Chrome / Android WebView).
  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showToast('Brauzer ovozli qidiruvni qo\'llab-quvvatlamaydi'); return; }
    if (!recognitionRef.current) {
      recognitionRef.current = new SR();
      recognitionRef.current.lang = 'uz-UZ';
      recognitionRef.current.onresult = (ev) => {
        const text = ev.results[0][0].transcript;
        setSearch(text);
      };
      recognitionRef.current.onend = () => setListening(false);
      recognitionRef.current.onerror = () => setListening(false);
    }
    setListening(true);
    recognitionRef.current.start();
  };

  const filteredEmployees = employees;
  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div className="app-container" style={{ padding: '20px 20px 120px 20px' }}>
      <header style={{ marginBottom: '24px', marginTop: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Smenaga biriktirish</h2>
        <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Ishchilarni tezkor tahrirlash (Swipe)</p>
      </header>

      {/* Horizontal calendar */}
      <div className="glass" style={{ display: 'flex', overflowX: 'auto', padding: '16px', gap: '12px', marginBottom: '20px', borderRadius: '20px' }}>
        {days.map((d) => {
          const dateStr = toLocalDate(d);
          const isActive = dateStr === selectedDate;
          return (
            <div key={dateStr} onClick={() => setSelectedDate(dateStr)} style={{
              minWidth: '62px', height: '82px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', borderRadius: '16px', cursor: 'pointer',
              background: isActive ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)',
              color: isActive ? 'white' : 'inherit',
              border: `1px solid ${isActive ? 'transparent' : 'var(--border-color)'}`,
              transition: 'all 0.2s',
            }}>
              <span style={{ fontSize: '12px', opacity: 0.8 }}>{UZ_DAYS[d.getDay()]}</span>
              <span style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>{d.getDate()}</span>
              <span style={{ fontSize: '10px', opacity: 0.8 }}>{UZ_MONTHS[d.getMonth()]}</span>
            </div>
          );
        })}
      </div>

      {error && <div className="error-box"><AlertCircle size={18} /> {error}</div>}

      {/* Shift cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        {shifts.map((s) => (
          <div key={s.id} className="glass" onClick={() => selectShift(s)} style={{
            padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', border: activeShift?.id === s.id ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <Clock size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '600' }}>{s.shift_name}</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>{s.start_time} — {s.end_time}</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--primary-color)' }}>{s.assigned_count}</span>
              <p style={{ fontSize: '11px', color: 'var(--text-light)' }}>ishchi</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + employee list */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input className="input-field" style={{ paddingLeft: '40px' }} placeholder="Xodimni qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button onClick={startVoice} className="glass" style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: listening ? 'var(--secondary-color)' : 'var(--text-light)', border: 'none' }}>
          <Mic size={22} />
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Ishchilar ro'yxati</h3>
        <span style={{ fontSize: '14px', color: 'var(--primary-color)', fontWeight: '500' }}>{selectedCount} ta tanlandi</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredEmployees.map((emp) => {
          const isAssigned = Boolean(selected[emp.id]);
          return (
            <div key={emp.id} className={`glass swipe-item ${isAssigned ? 'swipe-assigned' : 'swipe-unassigned'}`}
              style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
              onClick={() => toggleAssign(emp.id)}
              onTouchStart={(e) => onTouchStart(e, emp)}
              onTouchEnd={onTouchEnd}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Avatar name={emp.full_name} color={emp.avatar_color} />
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '600' }}>{emp.full_name}</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>{emp.position} {emp.brigade ? `• ${emp.brigade}` : ''}</p>
                </div>
              </div>
              <div>
                {isAssigned ? <CheckCircle2 size={24} color="var(--secondary-color)" /> : <XCircle size={24} color="var(--text-light)" style={{ opacity: 0.4 }} />}
              </div>
            </div>
          );
        })}
        {filteredEmployees.length === 0 && !loading && (
          <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '30px 0' }}>Xodimlar topilmadi</p>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: 'var(--text-dark)', color: 'var(--bg-color)', padding: '12px 20px', borderRadius: '30px', zIndex: 2000, fontSize: '14px', fontWeight: '500' }}>
          {toast}
        </div>
      )}

      {/* Bulk save FAB */}
      <div style={{ position: 'fixed', bottom: '100px', left: '20px', right: '20px', maxWidth: '440px', margin: '0 auto', zIndex: 999 }}>
        <button onClick={handleBulkSave} disabled={loading} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '16px', fontSize: '18px', boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.5)' }}>
          <CheckCircle2 size={24} /> {selectedCount} ta xodimni saqlash
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

// ---------- Attendance (employee view) ----------
const Attendance = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.attendanceRecords(undefined, user?.id)
      .then(setRecords)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const statusLabel = { present: 'Kelgan', late: 'Kechikkan', absent: 'Kelmagan' };
  const statusColor = { present: 'var(--secondary-color)', late: '#F59E0B', absent: '#EF4444' };

  return (
    <div className="app-container" style={{ padding: '20px 20px 100px 20px' }}>
      <header style={{ marginBottom: '24px', marginTop: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Davomat tarixi</h2>
        <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Oxirgi 7 kun</p>
      </header>

      {error && <div className="error-box"><AlertCircle size={18} /> {error}</div>}
      {loading && <p style={{ color: 'var(--text-light)', textAlign: 'center' }}>Yuklanmoqda...</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {records.map((r) => (
          <div key={r.id} className="glass" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '600' }}>{r.date}</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
                {r.check_in ? `${r.check_in} — ${r.check_out || ''}` : 'Ma\'lumot yo\'q'}
              </p>
            </div>
            <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', background: `${statusColor[r.status]}22`, color: statusColor[r.status] }}>
              {statusLabel[r.status] || r.status}
            </span>
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

// ---------- Profile ----------
const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showServer, setShowServer] = useState(false);
  const [serverIp, setServerIp] = useState(getBaseUrl());

  const saveServer = () => {
    setBaseUrl(serverIp.replace(/\/+$/, ''));
    setShowServer(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app-container" style={{ padding: '20px 20px 100px 20px' }}>
      <header style={{ marginBottom: '30px', marginTop: '20px', textAlign: 'center' }}>
        <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '36px', fontWeight: 'bold', margin: '0 auto 16px', boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)' }}>
          {(user?.full_name || '?').charAt(0).toUpperCase()}
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>{user?.full_name}</h2>
        <p style={{ color: 'var(--text-light)', fontSize: '14px', marginTop: '4px', textTransform: 'capitalize' }}>{user?.role} • ID: {user?.employee_code || '—'}</p>
      </header>

      {showServer && (
        <div className="glass" style={{ padding: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '16px' }}>Server manzili</h3>
            <button onClick={() => setShowServer(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}><X size={20} /></button>
          </div>
          <input className="input-field" value={serverIp} onChange={(e) => setServerIp(e.target.value)} style={{ marginBottom: '12px' }} />
          <button className="btn-primary" onClick={saveServer}>Saqlash</button>
        </div>
      )}

      <div className="glass" style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div onClick={() => setShowServer(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ color: 'var(--text-light)' }}><Settings size={20} /></div>
            <span style={{ fontSize: '16px', fontWeight: '500' }}>Tizim sozlamalari</span>
          </div>
          <ChevronRight size={20} color="var(--text-light)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ color: 'var(--text-light)' }}><User size={20} /></div>
            <span style={{ fontSize: '16px', fontWeight: '500' }}>Shaxsiy ma'lumotlar</span>
          </div>
          <ChevronRight size={20} color="var(--text-light)" />
        </div>
      </div>

      <button onClick={handleLogout} className="glass" style={{ marginTop: '24px', width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>
        <LogOut size={20} /> Tizimdan chiqish
      </button>

      <BottomNav />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/schedule" element={<ProtectedRoute><BrigadeSchedule /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
