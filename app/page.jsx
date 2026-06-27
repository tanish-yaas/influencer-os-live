"use client";
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPoratal } from 'react-dom';
import { createClient } from '@supabase/supabase-js';
import { 
  FolderKanban, Users, ArrowRightLeft, 
  CreditCard, Receipt, CalendarDays, BarChart3, Plus, 
  Search, Bell, AlertCircle, ArrowLeft, 
  Edit2, Trash2, ExternalLink, AlertTriangle, Link as LinkIcon, RefreshCw,
  Download, CheckSquare, Square, Lock, Mail,
  MessageSquare, Send, LogOut, Shield, Sparkles, Check, ChevronDown, ChevronLeft, ChevronRight, Maximize2, Minimize2, Pin, Hash, ImagePlus, X, PieChart, Info, Settings, Sun, Moon, Type, ScanSearch, UserPlus, BadgeCheck, Loader2
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ALL_MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

// Set to '' to allow ANY Google account, or to a domain like 'yaas.studio' to restrict logins.
const ALLOWED_DOMAIN = '';

// Cute, pickable avatars. Gradient class strings are written in full so Tailwind keeps them.
const AVATARS = [
  { emoji: '🦊', grad: 'from-orange-400 to-amber-600' },
  { emoji: '🐰', grad: 'from-rose-300 to-pink-500' },
  { emoji: '🐼', grad: 'from-zinc-300 to-zinc-600' },
  { emoji: '🐯', grad: 'from-amber-400 to-orange-600' },
  { emoji: '🦁', grad: 'from-yellow-400 to-amber-600' },
  { emoji: '🐸', grad: 'from-lime-400 to-green-600' },
  { emoji: '🐨', grad: 'from-slate-400 to-slate-600' },
  { emoji: '🐧', grad: 'from-sky-400 to-indigo-600' },
  { emoji: '🦄', grad: 'from-fuchsia-400 to-purple-600' },
  { emoji: '🐱', grad: 'from-orange-300 to-rose-500' },
  { emoji: '🦉', grad: 'from-amber-500 to-orange-700' },
  { emoji: '🐵', grad: 'from-amber-600 to-yellow-800' },
];

// YAAS logo. For a crisp version you control, drop a file in /public and set LOGO_URL = '/yaas-logo.png'.
const LOGO_URL = 'https://framerusercontent.com/images/6ilTb1mEivC7MRT4niIsyIMktbs.png';

const AvatarBadge = ({ index = 0, size = 40, ring = false, photo = null, className = '' }) => {
  const a = AVATARS[index] || AVATARS[0];
  if (photo) {
    return (
      <img
        src={photo}
        alt=""
        style={{ width: size, height: size }}
        className={`rounded-full object-cover shrink-0 ring-1 ring-white/10 ${ring ? 'outline outline-2 outline-offset-2 outline-orange-500/70' : ''} ${className}`}
      />
    );
  }
  return (
    <div
      className={`rounded-full bg-gradient-to-br ${a.grad} flex items-center justify-center shrink-0 ring-1 ring-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] ${ring ? 'outline outline-2 outline-offset-2 outline-orange-500/70' : ''} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.5, lineHeight: 1 }}
    >
      <span>{a.emoji}</span>
    </div>
  );
};

const GoogleG = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

// Animated orbital "atom" scene. Reused on the login art and as a faint backdrop in the app.
const OrbitalScene = ({ className = '', light = false }) => {
  const c = light ? {
    g1: '#fed7aa', g2: '#f97316', hz1: '#fdba74', hz2: '#ffffff', hzO: 0.20,
    trace: '#ea580c', trO: 0.28, node: '#f97316', ndO: 0.85, hex: '#ea580c', hxO: 0.26,
    con: '#c2410c', cnO: 0.28, star: '#f97316', stO: 0.85,
    el1: '#ea580c', e1O: 0.26, el2: '#c2410c', e2O: 0.18,
    r1: '#f97316', r1O: 0.32, d1: '#ea580c', d2: '#f97316', d3: '#fb923c',
    r2: '#fb923c', r2O: 0.30, d4: '#ea580c', d5: '#f97316',
    core: '#f97316', coreRing: '#9a3412', crO: 0.6, coreDot: '#fff7ed'
  } : {
    g1: '#fed7aa', g2: '#f97316', hz1: '#7c2d12', hz2: '#000000', hzO: 0.40,
    trace: '#f97316', trO: 0.22, node: '#fb923c', ndO: 0.8, hex: '#f59e0b', hxO: 0.16,
    con: '#fbbf24', cnO: 0.14, star: '#fde68a', stO: 0.7,
    el1: '#f97316', e1O: 0.20, el2: '#f59e0b', e2O: 0.12,
    r1: '#fb923c', r1O: 0.30, d1: '#f97316', d2: '#fdba74', d3: '#fbbf24',
    r2: '#fdba74', r2O: 0.25, d4: '#f59e0b', d5: '#fb923c',
    core: '#fb923c', coreRing: '#fed7aa', crO: 0.7, coreDot: '#fff7ed'
  };
  const sfx = light ? 'l' : 'd';
  return (
  <svg className={className} viewBox="0 0 620 840" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <radialGradient id={`coreGlow-${sfx}`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={c.g1} stopOpacity="0.95"/>
        <stop offset="35%" stopColor={c.g2} stopOpacity="0.55"/>
        <stop offset="100%" stopColor={c.g2} stopOpacity="0"/>
      </radialGradient>
      <radialGradient id={`haze-${sfx}`} cx="55%" cy="42%" r="62%">
        <stop offset="0%" stopColor={c.hz1} stopOpacity={c.hzO}/>
        <stop offset="100%" stopColor={c.hz2} stopOpacity="0"/>
      </radialGradient>
    </defs>

    <rect width="620" height="840" fill={`url(#haze-${sfx})`}/>

    <g stroke={c.trace} strokeOpacity={c.trO} strokeWidth="1.2" fill="none">
      <path d="M40 120 H150 V210 H230"/>
      <path d="M60 700 H180 V610 H300"/>
      <path d="M520 90 V180 H430"/>
      <path d="M560 760 V650 H470 V560"/>
    </g>
    <g fill={c.node} fillOpacity={c.ndO}>
      <circle cx="40" cy="120" r="3"/><circle cx="230" cy="210" r="3"/>
      <circle cx="60" cy="700" r="3"/><circle cx="300" cy="610" r="3"/>
      <circle cx="520" cy="90" r="3"/><circle cx="430" cy="180" r="3"/>
      <circle cx="560" cy="760" r="3"/><circle cx="470" cy="560" r="3"/>
    </g>

    <g stroke={c.hex} strokeOpacity={c.hxO} strokeWidth="1.2" fill="none">
      <polygon points="110,300 140,285 170,300 170,335 140,350 110,335"/>
      <polygon points="480,400 506,386 532,400 532,430 506,444 480,430"/>
      <polygon points="430,690 452,678 474,690 474,714 452,726 430,714"/>
    </g>

    <g stroke={c.con} strokeOpacity={c.cnO} strokeWidth="1">
      <line x1="90" y1="470" x2="200" y2="540"/>
      <line x1="200" y1="540" x2="120" y2="640"/>
      <line x1="500" y1="250" x2="560" y2="340"/>
    </g>
    <g fill={c.star} fillOpacity={c.stO}>
      <circle cx="90" cy="470" r="2.5"/><circle cx="200" cy="540" r="2.5"/>
      <circle cx="120" cy="640" r="2.5"/><circle cx="500" cy="250" r="2.5"/>
      <circle cx="560" cy="340" r="2.5"/>
    </g>

    <g transform="translate(310 440)">
      <circle r="160" fill={`url(#coreGlow-${sfx})`}>
        <animate attributeName="opacity" values="0.7;1;0.7" dur="6s" repeatCount="indefinite"/>
      </circle>

      <ellipse rx="210" ry="80" fill="none" stroke={c.el1} strokeOpacity={c.e1O} strokeWidth="1.2" transform="rotate(-22)"/>
      <ellipse rx="250" ry="150" fill="none" stroke={c.el2} strokeOpacity={c.e2O} strokeWidth="1" transform="rotate(14)"/>

      <g>
        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="70s" repeatCount="indefinite"/>
        <circle r="120" fill="none" stroke={c.r1} strokeOpacity={c.r1O} strokeWidth="1.2"/>
        <circle cx="120" cy="0" r="6" fill={c.d1}/>
        <circle cx="-120" cy="0" r="4" fill={c.d2}/>
        <circle cx="0" cy="120" r="3" fill={c.d3}/>
      </g>
      <g>
        <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="100s" repeatCount="indefinite"/>
        <circle r="70" fill="none" stroke={c.r2} strokeOpacity={c.r2O} strokeWidth="1"/>
        <circle cx="70" cy="0" r="4" fill={c.d4}/>
        <circle cx="-70" cy="0" r="3" fill={c.d5}/>
      </g>

      <circle r="22" fill={c.core}/>
      <circle r="22" fill="none" stroke={c.coreRing} strokeOpacity={c.crO} strokeWidth="1.5"/>
      <circle r="9" fill={c.coreDot}/>
    </g>
  </svg>
  );
};

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const parseCSVText = (text) => {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\r') { /* skip */ }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
};

const parseFollowers = (s) => {
  if (!s) return 0;
  const t = String(s).trim().replace(/,/g, '');
  const m = t.match(/^([\d.]+)\s*([kKmM]?)/);
  if (!m) return parseInt(t) || 0;
  let n = parseFloat(m[1]) || 0;
  const u = (m[2] || '').toLowerCase();
  if (u === 'm') n *= 1e6; else if (u === 'k') n *= 1e3;
  return Math.round(n);
};

const parseIntSafe = (s) => parseInt(String(s == null ? '' : s).replace(/[^0-9.]/g, '')) || 0;

const parseDMY = (s) => {
  const t = String(s || '').trim();
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return '';
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
};

const detectPlatform = (a, b) => {
  const s = `${a || ''} ${b || ''}`.toLowerCase();
  if (s.includes('youtube.com') || s.includes('youtu.be')) return 'YouTube';
  if (s.includes('tiktok.com')) return 'TikTok';
  if (s.includes('linkedin.com')) return 'LinkedIn';
  return 'Instagram';
};

// Parse a campaign CSV (month-sectioned) into creator rows.
const parseCampaignCSV = (text) => {
  const rows = parseCSVText(text);
  const monthRe = new RegExp(`^\\s*(${MONTH_NAMES.join('|')})\\s*-\\s*(\\d{4})\\s*$`, 'i');
  let curMonth = '', curYear = '';
  const out = [];
  for (const r of rows) {
    const c0 = (r[0] || '').trim();
    const mh = c0.match(monthRe);
    if (mh) { curMonth = MONTH_NAMES.find(m => m.toLowerCase() === mh[1].toLowerCase()) || ''; curYear = mh[2]; continue; }
    const name = (r[1] || '').trim();
    const profile = (r[2] || '').trim();
    if (!name || !/^https?:\/\//i.test(profile)) continue; // skip headers, totals, notes
    const deliverableRaw = (r[8] || '').trim();
    let date = parseDMY(r[5]);
    if (!date && curMonth && curYear) {
      const mNum = String(MONTH_NAMES.indexOf(curMonth) + 1).padStart(2, '0');
      date = `${curYear}-${mNum}-01`;
    }
    out.push({
      name,
      profile,
      followers: parseFollowers(r[3]),
      spend: parseIntSafe(r[4]),
      date,
      views: parseIntSafe(r[6]),
      deliverable: /^https?:\/\//i.test(deliverableRaw) ? deliverableRaw : '',
      type: (r[9] || '').trim() || 'Reel Collab',
      platform: detectPlatform(profile, deliverableRaw),
      month: curMonth
    });
  }
  return out;
};

const campaignNameFromFile = (filename) => String(filename || 'Imported Campaign').replace(/\.[^.]+$/, '').replace(/[._-]+/g, ' ').trim();

const getCreatorHandle = (url) => {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    if (u.hostname.includes('youtube') || u.hostname.includes('youtu.be')) {
      const at = parts.find(p => p.startsWith('@'));
      return at || (parts[0] ? '@' + parts[0] : '');
    }
    const skip = new Set(['reel', 'reels', 'p', 'tv', 'stories']);
    const seg = parts.find(p => !skip.has(p.toLowerCase()));
    return seg ? '@' + seg : '';
  } catch { return ''; }
};

// Build an embeddable URL for a deliverable link (Instagram post/reel or YouTube video).
const getEmbedInfo = (link) => {
  if (!link) return { url: '', kind: '' };
  try {
    const u = new URL(link);
    const host = u.hostname.toLowerCase();
    if (host.includes('instagram.com')) {
      const parts = u.pathname.split('/').filter(Boolean);
      const idx = parts.findIndex(p => ['p', 'reel', 'reels', 'tv'].includes(p.toLowerCase()));
      if (idx >= 0 && parts[idx + 1]) return { url: `https://www.instagram.com/p/${parts[idx + 1]}/embed`, kind: 'instagram' };
      return { url: '', kind: '' };
    }
    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      let id = '';
      if (host.includes('youtu.be')) id = u.pathname.split('/').filter(Boolean)[0];
      else {
        const parts = u.pathname.split('/').filter(Boolean);
        const si = parts.findIndex(p => p.toLowerCase() === 'shorts');
        if (si >= 0 && parts[si + 1]) id = parts[si + 1];
        else id = u.searchParams.get('v') || '';
      }
      return id ? { url: `https://www.youtube.com/embed/${id}`, kind: 'youtube' } : { url: '', kind: '' };
    }
  } catch {}
  return { url: '', kind: '' };
};

const CHART_PALETTE = ['#f97316', '#22d3ee', '#f59e0b', '#a78bfa', '#34d399', '#f472b6', '#60a5fa', '#fb7185', '#fbbf24', '#4ade80'];

const ChartPanel = ({ title, children, className = '' }) => (
  <div className={`bg-white/[0.025] border border-white/[0.07] rounded-xl p-5 backdrop-blur-sm ${className}`}>
    <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-medium mb-4">{title}</p>
    {children}
  </div>
);

const StatCard = ({ label, value, sub, dot = '#f97316' }) => (
  <div className="bg-white/[0.025] border border-white/[0.07] rounded-xl p-4 backdrop-blur-sm">
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot, boxShadow: `0 0 8px ${dot}99` }}></span>
      <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-medium truncate">{label}</p>
    </div>
    <p className="text-xl font-semibold mt-2 tabular-nums text-stone-100 leading-tight tracking-tight">{value}</p>
    {sub && <p className="text-xs text-stone-500 mt-1 truncate">{sub}</p>}
  </div>
);

const VBarChart = ({ data = [], color = '#f97316', format = (v) => String(v) }) => {
  if (!data.length) return <div className="h-44 flex items-center justify-center text-sm text-stone-600">No data</div>;
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div>
      <div className="flex items-end gap-2 h-44">
        {data.map((d, i) => (
          <div key={i} className="flex-1 h-full flex items-end" title={`${d.label}: ${format(d.value)}`}>
            <div className="w-full rounded-t-md transition-all hover:opacity-80" style={{ height: `${Math.max(2, (d.value / max) * 100)}%`, background: `linear-gradient(to top, ${color}, ${color}88)` }}></div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        {data.map((d, i) => (<div key={i} className="flex-1 text-center text-[10px] text-stone-500 truncate" title={d.label}>{d.label}</div>))}
      </div>
    </div>
  );
};

const HBarChart = ({ data = [], color = '#22d3ee', format = (v) => String(v) }) => {
  if (!data.length) return <div className="h-44 flex items-center justify-center text-sm text-stone-600">No data</div>;
  const max = Math.max(1, ...data.map(d => d.value));
  return (
    <div className="space-y-3 py-1">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-stone-400 truncate pr-2">{d.label}</span>
            <span className="text-stone-300 tabular-nums shrink-0">{format(d.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(d.value / max) * 100}%`, background: color }}></div>
          </div>
        </div>
      ))}
    </div>
  );
};

const DonutChart = ({ data = [] }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <div className="h-44 flex items-center justify-center text-sm text-stone-600">No data</div>;
  const size = 140, thickness = 22, r = (size - thickness) / 2, circ = 2 * Math.PI * r, cx = size / 2, cy = size / 2;
  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          {data.map((d, i) => {
            const len = (d.value / total) * circ;
            const el = (<circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth={thickness} strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-offset} />);
            offset += len;
            return el;
          })}
        </g>
      </svg>
      <div className="space-y-1.5 min-w-0 flex-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: d.color }}></span>
            <span className="text-stone-400 truncate">{d.label}</span>
            <span className="text-stone-300 tabular-nums ml-auto pl-2 shrink-0">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const TrendChart = ({ data = [], color = '#f97316' }) => {
  if (!data.length) return <div className="h-40 flex items-center justify-center text-sm text-stone-600">No data</div>;
  const w = 600, h = 150, top = 12, bot = 12;
  const max = Math.max(1, ...data.map(d => d.value));
  const n = data.length;
  const X = (i) => n <= 1 ? w / 2 : (i * w) / (n - 1);
  const Y = (v) => (h - bot) - (v / max) * (h - top - bot);
  const line = data.map((d, i) => `${X(i)},${Y(d.value)}`).join(' ');
  const area = `0,${h - bot} ${line} ${w},${h - bot}`;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full" style={{ height: h }}>
        <polygon points={area} fill={color} fillOpacity="0.14" />
        <polyline points={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="flex justify-between mt-1.5">
        {data.map((d, i) => (<span key={i} className="text-[10px] text-stone-500">{d.label}</span>))}
      </div>
    </div>
  );
};

const PLATFORM_COLORS = { instagram: '#ec4899', youtube: '#f97316', facebook: '#3b82f6', tiktok: '#22d3ee', linkedin: '#60a5fa' };
const getPlatformColor = (p) => PLATFORM_COLORS[(p || '').toLowerCase()] || '#a78bfa';

const fmtDateShort = (d) => { try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); } catch { return d; } };
const fmtDateFull = (d) => { try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }); } catch { return d; } };

// Multi-series overlaid area chart with hover tooltip + zoom (Views/Likes/Comments by platform).
const MultiSeriesChart = ({ dates = [], series = [], mode = 'cumulative', format = (v) => v }) => {
  const [hover, setHover] = useState(null);
  const [zoom, setZoom] = useState(1);
  if (!dates.length || !series.length) return <div className="h-48 flex items-center justify-center text-sm text-stone-600">No data in range</div>;
  const plotted = series.map(s => { let run = 0; return { ...s, vals: s.values.map(v => mode === 'cumulative' ? (run += v) : v) }; });
  const max = Math.max(1, ...plotted.flatMap(s => s.vals));
  const n = dates.length;
  const H = 220, padT = 14, padB = 26, padL = 6, padR = 6;
  const pxPer = 16 * zoom;
  const W = Math.max(620, padL + padR + Math.max(1, n - 1) * pxPer);
  const plotW = W - padL - padR;
  const X = (i) => n <= 1 ? padL + plotW / 2 : padL + (i * plotW) / (n - 1);
  const Y = (v) => (H - padB) - (v / max) * (H - padT - padB);
  const labelStep = Math.max(1, Math.ceil(n / Math.max(4, Math.floor(W / 88))));
  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    let i = n <= 1 ? 0 : Math.round((x - padL) / (plotW / (n - 1)));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };
  return (
    <div className="relative">
      <div className="flex justify-end gap-1 mb-1">
        <button onClick={() => setZoom(z => Math.max(1, +(z - 0.5).toFixed(1)))} className="w-6 h-6 rounded bg-white/[0.05] border border-white/10 text-stone-300 hover:bg-white/10 flex items-center justify-center text-sm leading-none">−</button>
        <button onClick={() => setZoom(z => Math.min(8, +(z + 0.5).toFixed(1)))} className="w-6 h-6 rounded bg-white/[0.05] border border-white/10 text-stone-300 hover:bg-white/10 flex items-center justify-center text-sm leading-none">+</button>
      </div>
      <div className="overflow-x-auto">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} onMouseMove={onMove} onMouseLeave={() => setHover(null)} style={{ display: 'block' }}>
          {plotted.map((s, si) => {
            const line = s.vals.map((v, i) => `${X(i)},${Y(v)}`).join(' ');
            const area = `${padL},${H - padB} ${line} ${W - padR},${H - padB}`;
            return (<g key={si}><polygon points={area} fill={s.color} fillOpacity="0.10" /><polyline points={line} fill="none" stroke={s.color} strokeWidth="2" />{s.vals.map((v, i) => v > 0 ? <circle key={i} cx={X(i)} cy={Y(v)} r="2.4" fill={s.color} /> : null)}</g>);
          })}
          {hover != null && (
            <g>
              <line x1={X(hover)} y1={padT} x2={X(hover)} y2={H - padB} stroke="#ffffff" strokeOpacity="0.18" />
              {plotted.map((s, si) => <circle key={si} cx={X(hover)} cy={Y(s.vals[hover])} r="3.5" fill={s.color} stroke="#0c0a08" strokeWidth="1.5" />)}
            </g>
          )}
          {dates.map((d, i) => (i % labelStep === 0 || i === n - 1) ? <text key={i} x={X(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#78716c">{fmtDateShort(d)}</text> : null)}
        </svg>
      </div>
      {hover != null && (
        <div className="absolute top-9 right-2 bg-[#0c0a08]/95 border border-white/10 rounded-lg shadow-2xl p-3 text-xs pointer-events-none z-10 min-w-[150px]">
          <p className="font-semibold text-stone-200 mb-1.5">{fmtDateFull(dates[hover])}</p>
          {plotted.map((s, si) => (<div key={si} className="flex items-center gap-2"><span className="w-2 h-2 rounded-sm" style={{ background: s.color }}></span><span className="text-stone-400">{s.name}</span><span className="ml-auto pl-3 text-stone-200 tabular-nums">{format(s.vals[hover])}</span></div>))}
        </div>
      )}
      <div className="flex flex-wrap gap-3 mt-3 justify-center">
        {series.map((s, i) => (<div key={i} className="flex items-center gap-1.5 text-xs"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }}></span><span className="text-stone-400">{s.name}</span></div>))}
      </div>
    </div>
  );
};

// Stacked bar timeline of post frequency by date + platform: zoomable, scrollable, click a bar to expand.
const StackedBarTimeline = ({ items = [], onSelectDay = () => {} }) => {
  const [zoom, setZoom] = useState(1.5);
  const [hover, setHover] = useState(null); // { i, x, y }
  const wrapRef = useRef(null);
  if (!items.length) return <div className="h-56 flex items-center justify-center text-sm text-stone-600">No posts in range</div>;
  const n = items.length;
  const totals = items.map(it => Object.values(it.platforms).reduce((a, b) => a + b, 0));
  const max = Math.max(1, ...totals);
  const platformsSeen = [...new Set(items.flatMap(it => Object.keys(it.platforms)))];
  const barW = Math.round(16 * zoom);
  const gap = Math.max(3, Math.round(5 * zoom));
  const W = n * (barW + gap);
  const labelStep = Math.max(1, Math.ceil((barW + gap < 46 ? 46 : 1) / (barW + gap)));
  const track = (i, e) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHover({ i, x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  const TW = 232;
  let tip = null;
  if (hover != null && items[hover.i]) {
    const it = items[hover.i];
    const cw = wrapRef.current?.clientWidth || 9999;
    const left = Math.max(8, Math.min(hover.x - TW / 2, cw - TW - 8));
    const below = hover.y < 160;
    tip = (
      <div className="pointer-events-none absolute z-50 bg-[#0c0a08] border border-white/10 rounded-xl shadow-2xl p-3.5 text-left" style={{ left, width: TW, top: below ? hover.y + 18 : hover.y - 14, transform: below ? 'none' : 'translateY(-100%)' }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-stone-100">{fmtDateFull(it.date)}</p>
          <span className="text-[10px] uppercase tracking-wider text-orange-300 bg-orange-500/15 border border-orange-500/25 rounded px-1.5 py-0.5">{totals[hover.i]} post{totals[hover.i] === 1 ? '' : 's'}</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 mb-2.5">
          {Object.entries(it.platforms).map(([p, cnt], k) => (
            <div key={k} className="flex items-center gap-1.5 bg-white/[0.04] rounded-md px-2 py-1">
              <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: getPlatformColor(p) }}></span>
              <span className="text-[11px] text-stone-300 truncate">{p}</span>
              <span className="text-[11px] text-stone-400 tabular-nums ml-auto">{cnt}</span>
            </div>
          ))}
        </div>
        <div className="space-y-0.5 max-h-32 overflow-y-auto border-t border-white/[0.06] pt-2">
          {it.names.slice(0, 8).map((nm, j) => (<p key={j} className="text-[11px] text-stone-400 truncate">• {nm}</p>))}
          {it.names.length > 8 && <p className="text-[10px] text-stone-600 pl-2">+{it.names.length - 8} more</p>}
        </div>
        <p className="text-[10px] text-orange-400/80 mt-2 flex items-center gap-1">Click the bar to open links →</p>
      </div>
    );
  }
  return (
    <div className="relative" ref={wrapRef} onMouseLeave={() => setHover(null)}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-stone-500">Hover a bar to preview · click to open that day's links</p>
        <div className="flex gap-1">
          <button onClick={() => setZoom(z => Math.max(1, +(z - 0.5).toFixed(1)))} className="w-6 h-6 rounded bg-white/[0.05] border border-white/10 text-stone-300 hover:bg-white/10 flex items-center justify-center text-sm leading-none">−</button>
          <button onClick={() => setZoom(z => Math.min(8, +(z + 0.5).toFixed(1)))} className="w-6 h-6 rounded bg-white/[0.05] border border-white/10 text-stone-300 hover:bg-white/10 flex items-center justify-center text-sm leading-none">+</button>
        </div>
      </div>
      <div className="overflow-x-auto pb-1">
        <div style={{ width: Math.max(W, 100) }}>
          <div className="flex items-end h-56" style={{ gap }}>
            {items.map((it, i) => (
              <button key={i} onClick={() => onSelectDay(it)} onMouseEnter={(e) => track(i, e)} onMouseMove={(e) => track(i, e)} style={{ width: barW }} className={`h-full flex flex-col justify-end items-stretch relative shrink-0 transition-opacity ${hover ? (hover.i === i ? 'opacity-100' : 'opacity-50') : 'hover:opacity-90'}`}>
                {Object.entries(it.platforms).map(([p, cnt], j) => (
                  <div key={j} style={{ height: `${(cnt / max) * 100}%`, background: getPlatformColor(p) }} className="w-full first:rounded-t-sm"></div>
                ))}
              </button>
            ))}
          </div>
          <div className="flex mt-2" style={{ gap }}>
            {items.map((it, i) => (
              <div key={i} style={{ width: barW }} className="shrink-0 text-center text-[9px] text-stone-500 whitespace-nowrap overflow-visible">
                {i % labelStep === 0 ? fmtDateShort(it.date) : ''}
              </div>
            ))}
          </div>
        </div>
      </div>
      {tip}
      <div className="flex flex-wrap gap-3 mt-3 justify-center">
        {platformsSeen.map((p, i) => (<div key={i} className="flex items-center gap-1.5 text-xs"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: getPlatformColor(p) }}></span><span className="text-stone-400">{p}</span></div>))}
      </div>
    </div>
  );
};

const defaultNameFromEmail = (email) => {
  const handle = (email || '').split('@')[0] || 'New User';
  return handle.replace(/[._-]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
};
const hashIndex = (str, n) => {
  let h = 0;
  for (let i = 0; i < (str || '').length; i++) h = (h + str.charCodeAt(i)) % n;
  return h;
};

export default function InfluencerOS() {
  // ---- Auth / profile state ----
  const [currentUser, setCurrentUser] = useState(null); // { email, isAdmin }
  const [profile, setProfile] = useState(null);          // { email, display_name, avatar_index, title, is_admin }
  const [authChecked, setAuthChecked] = useState(false);
  const [loginMode, setLoginMode] = useState('google');  // 'google' | 'admin'
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // profile form
  const [profileName, setProfileName] = useState('');
  const [profileTitle, setProfileTitle] = useState('');
  const [profileAvatar, setProfileAvatar] = useState(0);
  const [profileBio, setProfileBio] = useState('');
  const [profileInterests, setProfileInterests] = useState([]);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [newInterest, setNewInterest] = useState('');
  const [viewProfileEmail, setViewProfileEmail] = useState(null);
  const [isProfileEditorOpen, setProfileEditorOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [editorsList, setEditorsList] = useState([]);
  const [editorInput, setEditorInput] = useState('');
  const [campaignImage, setCampaignImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [analyticsCampaign, setAnalyticsCampaign] = useState('all');
  const [analyticsPlatform, setAnalyticsPlatform] = useState('all');
  const [analyticsMonth, setAnalyticsMonth] = useState('all');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importName, setImportName] = useState('');
  const [importOwner, setImportOwner] = useState('');
  const [importEditorsList, setImportEditorsList] = useState([]);
  const [importEditorInput, setImportEditorInput] = useState('');
  const [importAutoSync, setImportAutoSync] = useState(false);
  const [importError, setImportError] = useState('');
  const [importing, setImporting] = useState(false);

  const [activeTab, setActiveTab] = useState('campaigns');
  const [activeCampaignId, setActiveCampaignId] = useState(null);
  const [targetMonth, setTargetMonth] = useState('May');
  
  const [campaigns, setCampaigns] = useState([]);
  const [creators, setCreators] = useState([]);
  const [bills, setBills] = useState([]);
  const [comments, setComments] = useState([]);

  const [isCampaignModalOpen, setCampaignModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  
  const [isCreatorModalOpen, setCreatorModalOpen] = useState(false);
  const [editingCreator, setEditingCreator] = useState(null);
  const [modalPlatform, setModalPlatform] = useState('Instagram');
  const [modalContentType, setModalContentType] = useState('Reel Collab');

  const CONTENT_TYPES = {
    Instagram: ['Reel Collab', 'Story (Set of 3)', 'Static Post', 'Carousel', 'Reel + Story Combo'],
    YouTube: ['YouTube Integration', 'Dedicated Video', 'Shorts', 'Community Post'],
    TikTok: ['TikTok Video', 'TikTok Series'],
    LinkedIn: ['LinkedIn Post', 'LinkedIn Video', 'LinkedIn Article']
  };
  const contentTypesFor = (p) => CONTENT_TYPES[p] || CONTENT_TYPES.Instagram;

  useEffect(() => {
    if (isCreatorModalOpen) {
      const p = editingCreator?.platform || 'Instagram';
      setModalPlatform(p);
      const list = contentTypesFor(p);
      const ct = editingCreator?.content_type;
      setModalContentType(ct && list.includes(ct) ? ct : (ct || list[0]));
    }
  }, [isCreatorModalOpen, editingCreator]);

  const onModalPlatformChange = (p) => {
    setModalPlatform(p);
    const list = contentTypesFor(p);
    if (!list.includes(modalContentType)) setModalContentType(list[0]);
  };

  const [deletePrompt, setDeletePrompt] = useState({ isOpen: false, type: '', id: '', name: '' });
  
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  const [exportModal, setExportModal] = useState({ isOpen: false, type: '' });

  const [isMounted, setIsMounted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false); 
  const [isCampaignSyncing, setIsCampaignSyncing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // comments
  const [commentModal, setCommentModal] = useState({ isOpen: false, creator: null });
  const [commentFrom, setCommentFrom] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [profileCardCreator, setProfileCardCreator] = useState(null);
  const [timelineDay, setTimelineDay] = useState(null);
  const [theme, setTheme] = useState('light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [tableExpanded, setTableExpanded] = useState(false);
  const [talksExpanded, setTalksExpanded] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scrapeQuery, setScrapeQuery] = useState('');
  const [scrapePlatform, setScrapePlatform] = useState('instagram');
  const [scrapeResults, setScrapeResults] = useState([]);
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [scrapeNote, setScrapeNote] = useState('');
  const [leadPickerFor, setLeadPickerFor] = useState(null);
  const [leadAssignCampaign, setLeadAssignCampaign] = useState('');
  const [leadAssignPoc, setLeadAssignPoc] = useState('');
  const [teamProfiles, setTeamProfiles] = useState([]);
  // ---- messaging ----
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [msgChannel, setMsgChannel] = useState('group:all');
  const [allMsgs, setAllMsgs] = useState([]);
  const [msgText, setMsgText] = useState('');
  const [msgSearch, setMsgSearch] = useState('');
  const [msgSeen, setMsgSeen] = useState({});
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editMsgText, setEditMsgText] = useState('');
  const [notifs, setNotifs] = useState([]);
  const [deleteCommentTarget, setDeleteCommentTarget] = useState(null);
  const msgEndRef = useRef(null);
  const lastNotifiedRef = useRef(null);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [orbitOpen, setOrbitOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [timelineCampaignFilter, setTimelineCampaignFilter] = useState('all');
  const [timelineStatusFilter, setTimelineStatusFilter] = useState('all');
  const [timelineSearch, setTimelineSearch] = useState('');
  const [leadDrafts, setLeadDrafts] = useState({});
  const [campaignView, setCampaignView] = useState('live');
  const [reportCampaign, setReportCampaign] = useState('all');
  const [reportDateMode, setReportDateMode] = useState('month');
  const [reportMonth, setReportMonth] = useState('all');
  const [reportStart, setReportStart] = useState('');
  const [reportEnd, setReportEnd] = useState('');
  const [viewsMode, setViewsMode] = useState('cumulative');
  const [likesMode, setLikesMode] = useState('cumulative');
  const [commentsMode, setCommentsMode] = useState('cumulative');
  const [reportsView, setReportsView] = useState('reports');
  const [reportExport, setReportExport] = useState({ open: false, format: 'csv' });
  const [exportOpts, setExportOpts] = useState({
    summary: true, breakdown: true,
    creator: true, platform: true, contentType: true, goLive: true, spend: true, views: true,
    likes: true, comments: true, shares: true, saves: true, engagement: true, er: true,
    cpv: true, cpe: true
  });
  const [exportGroupsOpen, setExportGroupsOpen] = useState({});

  // ---- Auth helpers ----
  const loadProfile = async (email) => {
    let local = null;
    try { const raw = localStorage.getItem('ios_profile_' + email); if (raw) local = JSON.parse(raw); } catch {}
    if (local) {
      setProfile(local);
      setProfileName(local.display_name || '');
      setProfileTitle(local.title || '');
      setProfileAvatar(local.avatar_index ?? 0);
      setProfileBio(local.bio || '');
      setProfileInterests(Array.isArray(local.interests) ? local.interests : []);
      setProfilePhoto(local.avatar_photo || null);
    } else {
      setProfileName(defaultNameFromEmail(email));
      setProfileTitle('');
      setProfileAvatar(hashIndex(email, AVATARS.length));
    }
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
      if (!error && data) {
        setProfile(data);
        setProfileName(data.display_name || '');
        setProfileTitle(data.title || '');
        setProfileAvatar(data.avatar_index ?? 0);
        setProfileBio(data.bio || '');
        setProfileInterests(Array.isArray(data.interests) ? data.interests : []);
        setProfilePhoto(data.avatar_photo || null);
        try { localStorage.setItem('ios_profile_' + email, JSON.stringify(data)); } catch {}
      }
    } catch {}
  };

  const handleSession = async (session) => {
    try { if (localStorage.getItem('ios_admin') === '1') return; } catch {}
    const email = (session?.user?.email || '').toLowerCase();
    if (!email) return;
    if (ALLOWED_DOMAIN && !email.endsWith('@' + ALLOWED_DOMAIN)) {
      setLoginError(`Access is restricted to @${ALLOWED_DOMAIN} accounts.`);
      await supabase.auth.signOut().catch(() => {});
      setCurrentUser(null);
      setProfile(null);
      return;
    }
    setLoginError('');
    setCurrentUser({ email, isAdmin: false });
    await loadProfile(email);
  };

  const handleGoogleLogin = async () => {
    setLoginError('');
    const queryParams = { prompt: 'select_account' };
    if (ALLOWED_DOMAIN) queryParams.hd = ALLOWED_DOMAIN;
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          queryParams
        }
      });
      if (error) setLoginError('Google sign-in isn’t set up yet: ' + error.message);
    } catch (e) {
      setLoginError('Google sign-in failed: ' + (e.message || 'unknown error'));
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminEmail.trim() === 'admin@yaas' && adminPassword === 'hustlesucks') {
      try { localStorage.setItem('ios_admin', '1'); } catch {}
      setCurrentUser({ email: 'admin@yaas', isAdmin: true });
      setLoginError('');
      loadProfile('admin@yaas');
    } else {
      setLoginError('Invalid admin credentials.');
    }
  };

  const handleLogout = async () => {
    try { localStorage.removeItem('ios_admin'); } catch {}
    await supabase.auth.signOut().catch(() => {});
    setCurrentUser(null);
    setProfile(null);
    setProfileMenuOpen(false);
    setActiveCampaignId(null);
    setActiveTab('campaigns');
  };

  const saveProfile = async () => {
    if (!currentUser) return;
    if (!profileName.trim()) { alert('Please enter a display name.'); return; }
    const cleanInterests = profileInterests.map(s => (s || '').trim()).filter(Boolean).slice(0, 5);
    const row = {
      email: currentUser.email,
      display_name: profileName.trim(),
      title: profileTitle.trim(),
      avatar_index: profileAvatar,
      bio: profileBio.trim(),
      interests: cleanInterests,
      avatar_photo: profilePhoto || null,
      is_admin: !!currentUser.isAdmin
    };
    setProfile(row);
    setProfileInterests(cleanInterests);
    // reflect in the team list immediately so messages/search update
    setTeamProfiles(prev => {
      const others = prev.filter(p => (p.email || '').toLowerCase() !== currentUser.email.toLowerCase());
      return [...others, row];
    });
    try { localStorage.setItem('ios_profile_' + currentUser.email, JSON.stringify(row)); } catch {}
    setProfileEditorOpen(false);
    try {
      const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'email' });
      if (error) throw error;
    } catch (e) {
      // bio/interests/avatar_photo columns may not exist yet — fall back to the core fields
      console.error('profile save (full) failed, retrying core fields:', e);
      try {
        const { email, display_name, title, avatar_index, is_admin } = row;
        await supabase.from('profiles').upsert({ email, display_name, title, avatar_index, is_admin }, { onConflict: 'email' });
      } catch (e2) { console.error('profile save (core) failed:', e2); }
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please choose an image file.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        const S = 256;
        const canvas = document.createElement('canvas');
        canvas.width = S; canvas.height = S;
        const ctx = canvas.getContext('2d');
        const scale = Math.max(S / img.width, S / img.height);
        const w = img.width * scale, h = img.height * scale;
        ctx.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
        try { setProfilePhoto(canvas.toDataURL('image/jpeg', 0.82)); } catch { alert('Could not process that image.'); }
      };
      img.onerror = () => alert('Could not read that image.');
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };
  const addInterest = () => {
    const v = newInterest.trim();
    if (!v) return;
    if (profileInterests.length >= 5) { setNewInterest(''); return; }
    if (profileInterests.some(x => x.toLowerCase() === v.toLowerCase())) { setNewInterest(''); return; }
    setProfileInterests([...profileInterests, v]);
    setNewInterest('');
  };
  const removeInterest = (i) => setProfileInterests(profileInterests.filter((_, idx) => idx !== i));

  useEffect(() => {
    try {
      const t = localStorage.getItem('ios_theme');
      const f = localStorage.getItem('ios_fontsize');
      const sb = localStorage.getItem('ios_sidebar');
      if (t === 'light' || t === 'dark') setTheme(t);
      if (f === 'small' || f === 'medium' || f === 'large') setFontSize(f);
      if (sb === 'collapsed') setSidebarCollapsed(true);
    } catch {}
  }, []);

  // When a user signs in, apply that account's saved preferences (default to light/medium)
  useEffect(() => {
    if (!currentUser) return;
    try {
      const t = localStorage.getItem('ios_theme_' + currentUser.email);
      setTheme((t === 'light' || t === 'dark') ? t : 'light');
      const f = localStorage.getItem('ios_fontsize_' + currentUser.email);
      setFontSize((f === 'small' || f === 'medium' || f === 'large') ? f : 'medium');
    } catch {}
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('ios_theme', theme);
      if (currentUser) localStorage.setItem('ios_theme_' + currentUser.email, theme);
    } catch {}
  }, [theme, currentUser]);

  useEffect(() => {
    try { localStorage.setItem('ios_sidebar', sidebarCollapsed ? 'collapsed' : 'expanded'); } catch {}
  }, [sidebarCollapsed]);

  useEffect(() => { setTableExpanded(false); }, [activeCampaignId]);
  useEffect(() => { setTalksExpanded(false); }, [activeCampaignId, campaignView]);

  // ---- Browser back/forward support for the dashboard view ----
  const isPoppingRef = useRef(false);
  const navReadyRef = useRef(false);
  const lastViewRef = useRef('');
  useEffect(() => {
    if (!currentUser || !profile) return;
    if (isPoppingRef.current) { isPoppingRef.current = false; return; }
    const key = (activeTab || '') + '|' + (activeCampaignId || '');
    if (key === lastViewRef.current) return;
    lastViewRef.current = key;
    const st = { ios: true, tab: activeTab, camp: activeCampaignId };
    try {
      if (!navReadyRef.current) { window.history.replaceState(st, ''); navReadyRef.current = true; }
      else { window.history.pushState(st, ''); }
    } catch {}
  }, [activeTab, activeCampaignId, currentUser, profile]);
  useEffect(() => {
    const onPop = (e) => {
      isPoppingRef.current = true;
      // close any open overlays so nothing floats over the restored view
      setMessagesOpen(false); setSettingsOpen(false); setProfileEditorOpen(false);
      setViewProfileEmail(null); setOrbitOpen(false); setNotifPanelOpen(false);
      setAddLeadOpen(false); setTableExpanded(false); setTalksExpanded(false);
      const s = e.state;
      const tab = (s && s.ios) ? (s.tab || 'campaigns') : 'campaigns';
      const camp = (s && s.ios) ? (s.camp ?? null) : null;
      lastViewRef.current = (tab || '') + '|' + (camp || '');
      setActiveTab(tab);
      setActiveCampaignId(camp);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    const px = fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : '16px';
    try {
      document.documentElement.style.fontSize = px;
      localStorage.setItem('ios_fontsize', fontSize);
      if (currentUser) localStorage.setItem('ios_fontsize_' + currentUser.email, fontSize);
    } catch {}
    return () => { try { document.documentElement.style.fontSize = ''; } catch {} };
  }, [fontSize, currentUser]);

  // ---- messaging: load + poll ----
  const refreshMessages = async () => {
    try {
      const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(300);
      if (!error && Array.isArray(data)) setAllMsgs(data.slice().reverse());
    } catch {}
  };

  useEffect(() => {
    if (!currentUser) return;
    refreshMessages();
    const id = setInterval(refreshMessages, messagesOpen ? 4000 : 12000);
    return () => clearInterval(id);
  }, [currentUser, messagesOpen]);

  useEffect(() => {
    if (!currentUser) { setMsgSeen({}); return; }
    try {
      const s = localStorage.getItem('ios_msgseen_' + (currentUser.email || '').toLowerCase());
      setMsgSeen(s ? JSON.parse(s) : {});
    } catch { setMsgSeen({}); }
  }, [currentUser]);

  useEffect(() => {
    if (messagesOpen && msgEndRef.current) msgEndRef.current.scrollIntoView({ block: 'end' });
  }, [allMsgs, msgChannel, messagesOpen]);

  const dmChannelId = (a, b) => 'dm:' + [(a || '').toLowerCase(), (b || '').toLowerCase()].sort().join('|');
  const nameForEmail = (email) => {
    const e = (email || '').toLowerCase();
    const p = teamProfiles.find(p => (p.email || '').toLowerCase() === e);
    if (p) return p.display_name;
    const m = [...allMsgs].reverse().find(m => (m.sender_email || '').toLowerCase() === e && m.sender_name);
    return m?.sender_name || email;
  };

  const markSeen = (ch) => {
    const me = (currentUser?.email || '').toLowerCase();
    setMsgSeen(prev => {
      const n = { ...prev, [ch]: new Date().toISOString() };
      try { localStorage.setItem('ios_msgseen_' + me, JSON.stringify(n)); } catch {}
      return n;
    });
  };

  const openChannel = (ch) => { setMsgChannel(ch); markSeen(ch); };
  const startDm = (email) => { const ch = dmChannelId((currentUser?.email || ''), email); setMsgChannel(ch); markSeen(ch); setMsgSearch(''); };

  const sendMessage = async () => {
    const body = msgText.trim();
    if (!body || !currentUser) return;
    const me = (currentUser.email || '').toLowerCase();
    const row = { channel: msgChannel, sender_email: me, sender_name: profile?.display_name || currentUser.email, body };
    setMsgText('');
    setAllMsgs(prev => [...prev, { ...row, id: 'tmp-' + Date.now(), created_at: new Date().toISOString() }]);
    markSeen(msgChannel);
    try { await supabase.from('messages').insert(row); await refreshMessages(); } catch (e) { console.error('send message failed:', e); }
  };

  const saveEditMessage = async (m) => {
    const body = editMsgText.trim();
    setEditingMsgId(null);
    if (!body || body === m.body) return;
    setAllMsgs(prev => prev.map(x => x.id === m.id ? { ...x, body, edited: true } : x));
    try {
      const { error } = await supabase.from('messages').update({ body, edited: true }).eq('id', m.id);
      if (error) { await supabase.from('messages').update({ body }).eq('id', m.id); }
    } catch (e) { console.error('edit message failed:', e); }
  };

  const deleteMessage = async (m) => {
    setAllMsgs(prev => prev.filter(x => x.id !== m.id));
    if (String(m.id).startsWith('tmp-')) return;
    try { await supabase.from('messages').delete().eq('id', m.id); await refreshMessages(); } catch (e) { console.error('delete message failed:', e); }
  };

  const deleteComment = async (cm) => {
    if (!cm) return;
    setComments(prev => prev.filter(x => x.id !== cm.id));
    setDeleteCommentTarget(null);
    try { await supabase.from('creator_comments').delete().eq('id', cm.id); } catch (e) { console.error('delete comment failed:', e); }
  };

  const timeAgo = (iso) => {
    const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (s < 60) return 'just now';
    const mn = Math.floor(s / 60); if (mn < 60) return `${mn}m ago`;
    const h = Math.floor(mn / 60); if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  // Phone-style notifications when a new message arrives
  useEffect(() => {
    if (!currentUser || allMsgs.length === 0) return;
    const me = (currentUser.email || '').toLowerCase();
    const maxAt = allMsgs[allMsgs.length - 1].created_at;
    if (lastNotifiedRef.current === null) { lastNotifiedRef.current = maxAt; return; }
    const fresh = allMsgs.filter(m =>
      new Date(m.created_at) > new Date(lastNotifiedRef.current) &&
      (m.sender_email || '').toLowerCase() !== me &&
      !String(m.id).startsWith('tmp-') &&
      m.channel.startsWith('dm:') &&
      m.channel.slice(3).split('|').includes(me) &&
      !(messagesOpen && m.channel === msgChannel)
    );
    if (fresh.length) {
      setNotifs(prev => [
        ...prev,
        ...fresh.map(m => ({ key: String(m.id) + '-' + Math.random().toString(36).slice(2), channel: m.channel, name: m.sender_name || m.sender_email, body: m.body, at: m.created_at }))
      ].slice(-4));
    }
    lastNotifiedRef.current = maxAt;
  }, [allMsgs, currentUser, messagesOpen, msgChannel]);

  useEffect(() => {
    if (notifs.length === 0) return;
    const t = setTimeout(() => setNotifs(prev => prev.slice(1)), 6000);
    return () => clearTimeout(t);
  }, [notifs]);

  useEffect(() => { setCampaignView('live'); }, [activeCampaignId]);

  useEffect(() => {
    (async () => {
      try {
        let { data, error } = await supabase.from('profiles').select('email, display_name, title, avatar_index, bio, interests, avatar_photo');
        if (error) { const r = await supabase.from('profiles').select('email, display_name, title, avatar_index'); data = r.data; }
        if (Array.isArray(data)) setTeamProfiles(data.filter(p => p.display_name));
      } catch {}
    })();
  }, [currentUser, isProfileEditorOpen]);

  useEffect(() => {
    setIsMounted(true);
    let adminFlag = false;
    try { adminFlag = localStorage.getItem('ios_admin') === '1'; } catch {}

    (async () => {
      if (adminFlag) {
        setCurrentUser({ email: 'admin@yaas', isAdmin: true });
        await loadProfile('admin@yaas');
      } else {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email) await handleSession(session);
        } catch {}
      }
      setAuthChecked(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (session?.user?.email) handleSession(session);
    });

    fetchLiveDatabase();
    return () => { sub?.subscription?.unsubscribe?.(); };
  }, []);

  const fetchLiveDatabase = async () => {
    const { data: campData } = await supabase.from('campaigns').select('*');
    const { data: creatorData } = await supabase.from('creators').select('*');
    const { data: billData } = await supabase.from('bills').select('*');

    if (campData) setCampaigns(campData);
    if (creatorData) setCreators(creatorData);
    if (billData) setBills(billData);

    try {
      const { data: commentData, error } = await supabase.from('creator_comments').select('*').order('created_at', { ascending: true });
      if (!error && commentData) {
        setComments(commentData);
        try { localStorage.setItem('ios_comments', JSON.stringify(commentData)); } catch {}
      } else {
        throw error || new Error('no comments');
      }
    } catch {
      try { const raw = localStorage.getItem('ios_comments'); if (raw) setComments(JSON.parse(raw)); } catch {}
    }
  };

  // ---- Google Sheets one-way sync (app -> sheets) ----
  const creatorsRef = useRef(creators);
  const campaignsRef = useRef(campaigns);
  useEffect(() => { creatorsRef.current = creators; }, [creators]);
  useEffect(() => { campaignsRef.current = campaigns; }, [campaigns]);
  const sheetTimer = useRef(null);

  const pushAllSheets = async () => {
    const camps = campaignsRef.current || [];
    const crs = creatorsRef.current || [];
    const num = (v) => Number(v) || 0;
    const build = (kind) => camps.map(camp => ({
      campaign: camp.ip_name,
      headers: kind === 'live'
        ? ['Creator', 'Platform', 'Followers', 'Deliverable Type', 'Go-Live Date', 'Fee', 'Views', 'Likes', 'Comments', 'Shares', 'Saves', 'Deliverable Link', 'POC']
        : ['Creator', 'Platform', 'Followers', 'POC', 'Expected Budget', 'Go-Live Date', 'Profile Link', 'Avg Views', 'Eng Rate %'],
      rows: crs.filter(c => c.ip_id === camp.ip_id && (kind === 'live' ? c.creator_status !== 'lead' : c.creator_status === 'lead'))
        .map(c => kind === 'live'
          ? [c.creator_name, c.platform, num(c.followers), c.content_type || '', c.planned_go_live_date || '', num(c.deal_value), num(c.views), num(c.likes), num(c.comments), num(c.shares), num(c.saves), c.deliverable_link || '', c.poc || '']
          : [c.creator_name, c.platform, num(c.followers), c.poc || '', num(c.deal_value), c.planned_go_live_date || '', c.profile_link || '', num(c.views), c.views > 0 ? (((num(c.likes) + num(c.comments)) / c.views) * 100).toFixed(2) : '0'])
    }));
    try {
      await fetch('/api/sheets-sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ live: build('live'), talks: build('talks') }) });
    } catch {}
  };

  const scheduleSheetSync = () => {
    if (sheetTimer.current) clearTimeout(sheetTimer.current);
    sheetTimer.current = setTimeout(() => { pushAllSheets(); }, 1500);
  };

  const downloadCSV = (filename, rows) => {
    if (!rows || !rows.length) {
      alert("No data available to export for this selection.");
      return;
    }
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => headers.map(fieldName => {
        let data = row[fieldName] === null || row[fieldName] === undefined ? '' : row[fieldName];
        if (typeof data === 'string') {
          data = data.replace(/"/g, '""'); 
          if (data.includes(',') || data.includes('\n') || data.includes('"')) {
            data = `"${data}"`; 
          }
        }
        return data;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCampaigns = () => {
    const dataToExport = [];
    selectedCampaigns.forEach(campId => {
      const camp = campaigns.find(c => c.ip_id === campId);
      const campCreators = creators.filter(c => c.ip_id === campId);
      
      if (campCreators.length === 0) {
        dataToExport.push({
          'Campaign Name': camp.ip_name, 'Campaign Owner': camp.owner, 
          'Creator Name': 'No creators booked', 'Spend': 0
        });
      } else {
        campCreators.forEach(c => {
          const bill = bills.find(b => b.creator_deal_id === c.creator_deal_id);
          dataToExport.push({
            'Campaign Name': camp.ip_name,
            'Campaign Owner': camp.owner,
            'Creator Name': c.creator_name,
            'Platform': c.platform,
            'Content Type': c.content_type,
            'Followers': c.followers,
            'Spend (Fee)': c.deal_value,
            'Payment Model': c.payment_model?.replace('_', ' '),
            'Go-Live Date': c.planned_go_live_date,
            'Go-Live Month': c.planned_go_live_month,
            'Bill Date': bill ? bill.invoice_date : 'Pending',
            'Bill Month': bill ? bill.invoice_month : 'Pending',
            'Views': c.views || 0,
            'Engagement': (c.likes||0) + (c.comments||0) + (c.shares||0) + (c.saves||0)
          });
        });
      }
    });
    downloadCSV('Campaign_Export.csv', dataToExport);
    setSelectedCampaigns([]); 
  };

  const executeAdvancedExport = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const filterType = formData.get('filter_type');
    const startDate = formData.get('start_date');
    const endDate = formData.get('end_date');

    const dataToExport = [];

    if (exportModal.type === 'ops') {
      let filteredCreators = creators.filter(c => c.ip_id === activeCampaignId);
      const campName = campaigns.find(c => c.ip_id === activeCampaignId)?.ip_name || 'Campaign';

      if (filterType === 'month') {
        filteredCreators = filteredCreators.filter(c => c.planned_go_live_month === targetMonth);
      } else if (filterType === 'custom') {
        filteredCreators = filteredCreators.filter(c => c.planned_go_live_date >= startDate && c.planned_go_live_date <= endDate);
      } 

      filteredCreators.forEach(c => {
        const bill = bills.find(b => b.creator_deal_id === c.creator_deal_id);
        dataToExport.push({
          'Campaign': campName,
          'Creator': c.creator_name,
          'Platform': c.platform,
          'Deliverable': c.content_type,
          'Target Go-Live Date': c.planned_go_live_date,
          'Spend': c.deal_value,
          'Finance Bill Date': bill ? bill.invoice_date : 'Pending',
          'Link': c.deliverable_link || '',
          'Views': c.views || 0,
          'Likes': c.likes || 0,
          'Comments': c.comments || 0,
          'Shares': c.shares || 0,
          'Saves': c.saves || 0
        });
      });
      downloadCSV(`Ops_Report_${campName.replace(/\s+/g, '_')}.csv`, dataToExport);

    } else if (exportModal.type === 'finance') {
      let filteredBills = bills;
      
      if (filterType === 'month') {
        filteredBills = filteredBills.filter(b => b.invoice_month === targetMonth);
      } else if (filterType === 'custom') {
        filteredBills = filteredBills.filter(b => b.invoice_date >= startDate && b.invoice_date <= endDate);
      }

      filteredBills.forEach(b => {
        const creator = creators.find(c => c.creator_deal_id === b.creator_deal_id);
        const campName = creator ? campaigns.find(c => c.ip_id === creator.ip_id)?.ip_name : 'Unknown';
        
        dataToExport.push({
          'Invoice ID': b.invoice_id,
          'Bill Date': b.invoice_date,
          'Bill Month': b.invoice_month,
          'Billed Amount': b.invoice_amount,
          'Creator Name': creator ? creator.creator_name : 'Unknown',
          'Campaign Attached': campName,
          'Ops Target Go-Live': creator ? creator.planned_go_live_date : 'Unknown',
          'Payment Terms': creator ? creator.payment_model.replace('_', ' ') : 'Unknown'
        });
      });
      downloadCSV('Finance_Billing_Report.csv', dataToExport);
    }
    
    setExportModal({ isOpen: false, type: '' });
  };

  const formatMoney = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  const formatMicroMoney = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);
  const formatNumber = (num) => new Intl.NumberFormat('en-IN').format(num);

  const getCreatorBillDate = (creatorId) => bills.find(b => b.creator_deal_id === creatorId)?.invoice_date || '';

  const calculateCreatorMetrics = (c) => {
    const views = Number(c.views) || 0;
    const engagement = (Number(c.likes) || 0) + (Number(c.comments) || 0) + (Number(c.shares) || 0) + (Number(c.saves) || 0);
    const cost = Number(c.deal_value) || 0;
    return { engagement, cpv: views > 0 ? (cost / views) : 0, cpe: engagement > 0 ? (cost / engagement) : 0 };
  };

  const commentsFor = (creatorId) => comments.filter(x => x.creator_deal_id === creatorId);

  const openComments = (creator) => {
    setCommentModal({ isOpen: true, creator });
    setCommentFrom(profile?.display_name || '');
    setCommentBody('');
  };

  const sendComment = async () => {
    if (!commentBody.trim() || !commentModal.creator) return;
    const from = (commentFrom.trim() || profile?.display_name || 'Anonymous');
    const newC = {
      id: `local_${Date.now()}`,
      creator_deal_id: commentModal.creator.creator_deal_id,
      author: from,
      body: commentBody.trim(),
      created_at: new Date().toISOString()
    };
    const next = [...comments, newC];
    setComments(next);
    try { localStorage.setItem('ios_comments', JSON.stringify(next)); } catch {}
    setCommentBody('');
    try {
      await supabase.from('creator_comments').insert([{ creator_deal_id: newC.creator_deal_id, author: newC.author, body: newC.body }]);
    } catch (e) { console.error('comment save (db) failed:', e); }
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { campaigns: [], creators: [], people: [] };
    const q = searchQuery.toLowerCase();
    const meEmail = (currentUser?.email || '').toLowerCase();
    return {
      campaigns: campaigns.filter(c => c.ip_name.toLowerCase().includes(q) || c.owner.toLowerCase().includes(q)),
      creators: creators.filter(c => c.creator_name.toLowerCase().includes(q)),
      people: teamProfiles.filter(p => (p.email || '').toLowerCase() !== meEmail && ((p.display_name || '').toLowerCase().includes(q) || (p.title || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q)))
    };
  }, [searchQuery, campaigns, creators, teamProfiles, currentUser]);

  const handleSearchResultClick = (type, item) => {
    setActiveTab('campaigns');
    if (type === 'campaign') {
      setActiveCampaignId(item.ip_id);
    } else if (type === 'creator') {
      setActiveCampaignId(item.ip_id);
    }
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  const computations = useMemo(() => {
    let opsTotal = 0;
    let financeTotal = 0;
    let mismatchReasons = [];
    let opsBreakdown = {};
    let financeBreakdown = {};

    const opsDeals = creators.filter(c => c.planned_go_live_month === targetMonth);
    opsDeals.forEach(c => {
      const val = Number(c.deal_value) || 0;
      opsTotal += val;
      const campName = campaigns.find(camp => camp.ip_id === c.ip_id)?.ip_name || 'Unassigned Campaign';
      opsBreakdown[campName] = (opsBreakdown[campName] || 0) + val;
    });

    const finBills = bills.filter(b => b.invoice_month === targetMonth);
    finBills.forEach(b => {
      const val = Number(b.invoice_amount) || 0;
      financeTotal += val;
      const creator = creators.find(c => c.creator_deal_id === b.creator_deal_id);
      const campName = creator ? (campaigns.find(camp => camp.ip_id === creator.ip_id)?.ip_name || 'Unassigned Campaign') : 'Unassigned Campaign';
      financeBreakdown[campName] = (financeBreakdown[campName] || 0) + val;
    });

    const variance = financeTotal - opsTotal;

    creators.forEach(c => {
      const bill = bills.find(b => b.creator_deal_id === c.creator_deal_id);
      if (!bill) return;

      const isOpsMonth = c.planned_go_live_month === targetMonth;
      const isFinMonth = bill.invoice_month === targetMonth;

      if (isFinMonth && !isOpsMonth) {
        mismatchReasons.push({
          creator: c.creator_name,
          reason: `Billed in ${targetMonth}, but Ops tracks go-live for ${c.planned_go_live_month}.`,
          impact: `Finance is carrying +${formatMoney(bill.invoice_amount)}`,
        });
      }
      
      if (!isFinMonth && isOpsMonth) {
         mismatchReasons.push({
          creator: c.creator_name,
          reason: `Goes live in ${targetMonth}, but Finance already billed this in ${bill.invoice_month}.`,
          impact: `Ops is carrying +${formatMoney(c.deal_value)}`,
        });
      }
    });

    return { opsTotal, financeTotal, variance, mismatchReasons, opsBreakdown, financeBreakdown };
  }, [creators, bills, campaigns, targetMonth]);

  const allPlatforms = useMemo(() => [...new Set(creators.map(c => c.platform).filter(Boolean))], [creators]);

  const analytics = useMemo(() => {
    const num = (v) => Number(v) || 0;
    const liveIds = new Set(campaigns.map(c => c.ip_id));
    let cr = creators.filter(c => liveIds.has(c.ip_id) && c.creator_status !== 'lead');
    if (analyticsCampaign !== 'all') cr = cr.filter(c => c.ip_id === analyticsCampaign);
    if (analyticsPlatform !== 'all') cr = cr.filter(c => c.platform === analyticsPlatform);
    if (analyticsMonth !== 'all') cr = cr.filter(c => c.planned_go_live_month === analyticsMonth);

    const totalSpend = cr.reduce((s, c) => s + num(c.deal_value), 0);
    const totalViews = cr.reduce((s, c) => s + num(c.views), 0);
    const likes = cr.reduce((s, c) => s + num(c.likes), 0);
    const comments = cr.reduce((s, c) => s + num(c.comments), 0);
    const shares = cr.reduce((s, c) => s + num(c.shares), 0);
    const saves = cr.reduce((s, c) => s + num(c.saves), 0);
    const totalEng = likes + comments + shares + saves;
    const totalFollowers = cr.reduce((s, c) => s + num(c.followers), 0);
    const creatorCount = cr.length;
    const campaignCount = new Set(cr.map(c => c.ip_id)).size;
    const avgCpv = totalViews > 0 ? totalSpend / totalViews : 0;
    const avgCpe = totalEng > 0 ? totalSpend / totalEng : 0;
    const engRate = totalViews > 0 ? (totalEng / totalViews) * 100 : 0;

    const byCampaign = {};
    cr.forEach(c => {
      const name = campaigns.find(x => x.ip_id === c.ip_id)?.ip_name || 'Unassigned';
      if (!byCampaign[name]) byCampaign[name] = { spend: 0, views: 0 };
      byCampaign[name].spend += num(c.deal_value);
      byCampaign[name].views += num(c.views);
    });
    const campNames = Object.keys(byCampaign);
    const spendByCampaign = campNames.map(name => ({ label: name.length > 10 ? name.slice(0, 9) + '…' : name, value: byCampaign[name].spend }));
    const viewsByCampaign = campNames.map(name => ({ label: name.length > 10 ? name.slice(0, 9) + '…' : name, value: byCampaign[name].views }));

    const platMap = {};
    cr.forEach(c => { const p = c.platform || 'Other'; if (!platMap[p]) platMap[p] = { spend: 0, count: 0 }; platMap[p].spend += num(c.deal_value); platMap[p].count += 1; });
    const spendByPlatform = Object.keys(platMap).map((p, i) => ({ label: p, value: platMap[p].spend, color: CHART_PALETTE[i % CHART_PALETTE.length] }));
    const creatorsByPlatform = Object.keys(platMap).map((p, i) => ({ label: p, value: platMap[p].count, color: CHART_PALETTE[i % CHART_PALETTE.length] }));

    const engMix = [
      { label: 'Likes', value: likes, color: CHART_PALETTE[0] },
      { label: 'Comments', value: comments, color: CHART_PALETTE[1] },
      { label: 'Shares', value: shares, color: CHART_PALETTE[3] },
      { label: 'Saves', value: saves, color: CHART_PALETTE[4] },
    ].filter(d => d.value > 0);

    const payMap = {};
    cr.forEach(c => { const m = (c.payment_model || 'other').replace(/_/g, ' '); payMap[m] = (payMap[m] || 0) + 1; });
    const paymentSplit = Object.keys(payMap).map((m, i) => ({ label: m, value: payMap[m], color: CHART_PALETTE[i % CHART_PALETTE.length] }));

    const contentMap = {};
    cr.forEach(c => { const t = c.content_type || 'Other'; contentMap[t] = (contentMap[t] || 0) + 1; });
    const contentDist = Object.keys(contentMap).map(t => ({ label: t, value: contentMap[t] })).sort((a, b) => b.value - a.value);

    const topCreators = [...cr].sort((a, b) => num(b.views) - num(a.views)).slice(0, 6).map(c => ({ label: c.creator_name, value: num(c.views) }));

    const monthMap = {};
    cr.forEach(c => { const m = c.planned_go_live_month; if (!m) return; if (!monthMap[m]) monthMap[m] = { spend: 0, views: 0 }; monthMap[m].spend += num(c.deal_value); monthMap[m].views += num(c.views); });
    const orderedMonths = ALL_MONTHS.filter(m => monthMap[m]);
    const spendTrend = orderedMonths.map(m => ({ label: m.slice(0, 3), value: monthMap[m].spend }));
    const viewsTrend = orderedMonths.map(m => ({ label: m.slice(0, 3), value: monthMap[m].views }));

    return {
      totalSpend, totalViews, totalEng, totalFollowers, creatorCount, campaignCount, avgCpv, avgCpe, engRate,
      spendByCampaign, viewsByCampaign, spendByPlatform, creatorsByPlatform, engMix, paymentSplit, contentDist, topCreators, spendTrend, viewsTrend
    };
  }, [creators, campaigns, analyticsCampaign, analyticsPlatform, analyticsMonth]);

  const report = useMemo(() => {
    const num = (v) => Number(v) || 0;
    const liveIds = new Set(campaigns.map(c => c.ip_id));
    let cr = creators.filter(c => liveIds.has(c.ip_id) && c.creator_status !== 'lead');
    if (reportCampaign !== 'all') cr = cr.filter(c => c.ip_id === reportCampaign);
    if (reportDateMode === 'month' && reportMonth !== 'all') cr = cr.filter(c => c.planned_go_live_month === reportMonth);
    if (reportDateMode === 'custom' && reportStart && reportEnd) cr = cr.filter(c => c.planned_go_live_date && c.planned_go_live_date >= reportStart && c.planned_go_live_date <= reportEnd);

    const sum = (k, arr = cr) => arr.reduce((s, c) => s + num(c[k]), 0);
    const views = sum('views'), likes = sum('likes'), comments = sum('comments'), shares = sum('shares'), saves = sum('saves');
    const eng = likes + comments + shares + saves;
    const spend = sum('deal_value');
    const erAvg = views > 0 ? (eng / views) * 100 : 0;
    const isVideo = (t) => /reel|video|short|yt|integration|collab/i.test(t || '');
    const vid = cr.filter(c => isVideo(c.content_type));
    const stat = cr.filter(c => !isVideo(c.content_type));
    const engOf = (arr) => sum('likes', arr) + sum('comments', arr) + sum('shares', arr) + sum('saves', arr);
    const erVideo = sum('views', vid) > 0 ? (engOf(vid) / sum('views', vid)) * 100 : null;
    const erStatic = sum('views', stat) > 0 ? (engOf(stat) / sum('views', stat)) * 100 : null;
    const cpe = eng > 0 ? spend / eng : 0;
    const cpv = views > 0 ? spend / views : 0;

    const dateSet = [...new Set(cr.filter(c => c.planned_go_live_date).map(c => c.planned_go_live_date))].sort();
    const platforms = [...new Set(cr.map(c => c.platform).filter(Boolean))];
    const seriesFor = (metric) => platforms.map(p => ({
      name: p, color: getPlatformColor(p),
      values: dateSet.map(d => cr.filter(c => c.planned_go_live_date === d && c.platform === p).reduce((s, c) => s + num(c[metric]), 0))
    }));
    const timeline = dateSet.map(d => {
      const day = cr.filter(c => c.planned_go_live_date === d);
      const plat = {};
      day.forEach(c => { const p = c.platform || 'Other'; plat[p] = (plat[p] || 0) + 1; });
      return { date: d, platforms: plat, names: day.map(c => c.creator_name), creators: day };
    });

    return {
      count: cr.length, views, likes, comments, shares, saves, eng, spend, erAvg, erVideo, erStatic, cpe, cpv,
      dateSet, platforms, timeline, rows: cr,
      viewsSeries: seriesFor('views'), likesSeries: seriesFor('likes'), commentsSeries: seriesFor('comments')
    };
  }, [creators, campaigns, reportCampaign, reportDateMode, reportMonth, reportStart, reportEnd]);

  const reportScope = () => {
    const camp = reportCampaign === 'all' ? 'All Campaigns' : (campaigns.find(c => c.ip_id === reportCampaign)?.ip_name || 'Campaign');
    const range = reportDateMode === 'month' ? (reportMonth === 'all' ? 'All months' : `${reportMonth} 2026`) : `${reportStart || '…'} to ${reportEnd || '…'}`;
    return { camp, range };
  };

  const reportColumnDefs = [
    { key: 'creator', label: 'Creator', group: 'Profile', num: false, csv: (c) => c.creator_name, pdf: (c) => c.creator_name },
    { key: 'platform', label: 'Platform', group: 'Profile', num: false, csv: (c) => c.platform, pdf: (c) => c.platform },
    { key: 'contentType', label: 'Content Type', group: 'Profile', num: false, csv: (c) => c.content_type, pdf: (c) => c.content_type },
    { key: 'goLive', label: 'Go-Live', group: 'Profile', num: false, csv: (c) => c.planned_go_live_date || '', pdf: (c) => c.planned_go_live_date || '' },
    { key: 'spend', label: 'Spend', group: 'Profile', num: true, csv: (c) => c.deal_value, pdf: (c) => formatMoney(c.deal_value) },
    { key: 'views', label: 'Views', group: 'Engagement', num: true, csv: (c) => c.views || 0, pdf: (c) => formatNumber(c.views || 0) },
    { key: 'likes', label: 'Likes', group: 'Engagement', num: true, csv: (c) => c.likes || 0, pdf: (c) => formatNumber(c.likes || 0) },
    { key: 'comments', label: 'Comments', group: 'Engagement', num: true, csv: (c) => c.comments || 0, pdf: (c) => formatNumber(c.comments || 0) },
    { key: 'shares', label: 'Shares', group: 'Engagement', num: true, csv: (c) => c.shares || 0, pdf: (c) => formatNumber(c.shares || 0) },
    { key: 'saves', label: 'Saves', group: 'Engagement', num: true, csv: (c) => c.saves || 0, pdf: (c) => formatNumber(c.saves || 0) },
    { key: 'engagement', label: 'Engagement', group: 'Engagement', num: true, csv: (c, m) => m.engagement, pdf: (c, m) => formatNumber(m.engagement) },
    { key: 'er', label: 'ER %', group: 'Engagement', num: true, csv: (c, m) => c.views > 0 ? ((m.engagement / c.views) * 100).toFixed(2) : '0', pdf: (c, m) => (c.views > 0 ? ((m.engagement / c.views) * 100).toFixed(2) : '0') + '%' },
    { key: 'cpv', label: 'CPV', group: 'Cost', num: true, csv: (c, m) => m.cpv.toFixed(3), pdf: (c, m) => formatMicroMoney(m.cpv) },
    { key: 'cpe', label: 'CPE', group: 'Cost', num: true, csv: (c, m) => m.cpe.toFixed(3), pdf: (c, m) => formatMicroMoney(m.cpe) }
  ];

  const downloadReportCSV = (opts) => {
    const o = opts || exportOpts;
    const { camp, range } = reportScope();
    const lines = [];
    if (o.summary) {
      lines.push(['Influencer OS — YAAS Report']);
      lines.push(['Scope', camp, range, `${report.count} creators`]);
      lines.push([]);
      lines.push(['Summary']);
      lines.push(['Views', report.views]);
      lines.push(['Likes', report.likes]);
      lines.push(['Comments', report.comments]);
      lines.push(['Shares', report.shares]);
      lines.push(['E.R. Avg %', report.erAvg.toFixed(3)]);
      lines.push(['CPE', report.cpe]);
      lines.push(['CPV', report.cpv]);
      lines.push(['Total Spend', report.spend]);
      lines.push([]);
    }
    if (o.breakdown) {
      const cols = reportColumnDefs.filter(col => o[col.key]);
      if (cols.length) {
        lines.push(cols.map(c => c.label));
        report.rows.forEach(c => { const m = calculateCreatorMetrics(c); lines.push(cols.map(col => col.csv(c, m))); });
      }
    }
    if (lines.length === 0) { alert('Turn on at least one section/column to export.'); return; }
    const csv = lines.map(r => r.map(field => {
      const s = String(field == null ? '' : field);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Report_${camp}_${range}.csv`.replace(/[^a-z0-9]+/gi, '_');
    a.click(); URL.revokeObjectURL(url);
  };

  const downloadReportPDF = (opts) => {
    const o = opts || exportOpts;
    const { camp, range } = reportScope();
    const r = report;
    const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const stats = [
      ['Views', formatNumber(r.views)], ['Likes', formatNumber(r.likes)], ['Comments', formatNumber(r.comments)],
      ['Shares', formatNumber(r.shares)], ['E.R. (Avg)', r.erAvg.toFixed(3) + '%'],
      ['E.R. (Video)', r.erVideo == null ? '-' : r.erVideo.toFixed(3) + '%'], ['E.R. (Static)', r.erStatic == null ? '-' : r.erStatic.toFixed(3) + '%'],
      ['CPE', formatMicroMoney(r.cpe)], ['CPV', formatMicroMoney(r.cpv)], ['Total Spend', formatMoney(r.spend)]
    ];
    const statCards = stats.map(([k, v]) => `<div class="card"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div></div>`).join('');
    const cols = o.breakdown ? reportColumnDefs.filter(col => o[col.key]) : [];
    const headHtml = cols.map(col => col.num ? `<th class="n">${esc(col.label)}</th>` : `<th>${esc(col.label)}</th>`).join('');
    const rowsHtml = r.rows.map(c => {
      const m = calculateCreatorMetrics(c);
      return `<tr>${cols.map(col => col.num ? `<td class="n">${esc(col.pdf(c, m))}</td>` : `<td>${esc(col.pdf(c, m))}</td>`).join('')}</tr>`;
    }).join('');
    const summaryBlock = o.summary ? `<div class="grid">${statCards}</div>` : '';
    const tableBlock = (o.breakdown && cols.length) ? `<h2>Creator Breakdown</h2><table><thead><tr>${headHtml}</tr></thead><tbody>${rowsHtml}</tbody></table>` : '';
    if (!summaryBlock && !tableBlock) { alert('Turn on at least one section/column to export.'); return; }
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(camp)} Report</title><style>
      *{box-sizing:border-box}body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1c1917;margin:32px;}
      h1{font-size:22px;margin:0 0 2px}.sub{color:#78716c;font-size:13px;margin-bottom:20px}
      .brand{display:flex;align-items:center;gap:8px;margin-bottom:16px}.dot{width:14px;height:14px;border-radius:4px;background:#f97316}
      .grid{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:24px}
      .card{border:1px solid #e7e5e4;border-radius:10px;padding:12px}.k{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#a8a29e}.v{font-size:18px;font-weight:600;margin-top:4px}
      h2{font-size:14px;margin:18px 0 8px}table{width:100%;border-collapse:collapse;font-size:11px}
      th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #eee}th{color:#78716c;text-transform:uppercase;letter-spacing:.08em;font-size:9px}
      td.n,th.n{text-align:right}.foot{margin-top:18px;color:#a8a29e;font-size:10px}
      @media print{body{margin:14px}}
    </style></head><body>
      <div class="brand"><div class="dot"></div><strong>Influencer OS — YAAS</strong></div>
      <h1>${esc(camp)} — Campaign Report</h1>
      <div class="sub">Scope: ${esc(range)} &middot; ${r.count} creators &middot; Generated ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
      ${summaryBlock}
      ${tableBlock}
      <div class="foot">Generated by Influencer OS · YAAS</div>
    </body></html>`;
    const win = window.open('', '_blank');
    if (!win) { alert('Please allow pop-ups to download the PDF report.'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
  };

  const runReportExport = () => {
    const o = exportOpts;
    if (reportExport.format === 'csv') downloadReportCSV(o); else downloadReportPDF(o);
    setReportExport({ open: false, format: reportExport.format });
  };

  const handleSaveCampaign = async (e) => {
    e.preventDefault();
    if (!isAdmin) { alert('Only an admin can create or edit campaigns.'); return; }
    const formData = new FormData(e.target);
    const cleanEditors = editorsList.map(x => String(x).trim().toLowerCase()).filter(Boolean);
    const campData = {
      ip_id: editingCampaign ? editingCampaign.ip_id : `ip_${Date.now()}`,
      ip_name: formData.get('campaign_name'),
      owner: (formData.get('owner') || '').trim().toLowerCase(),
      status: editingCampaign ? editingCampaign.status : 'active',
      budget: parseInt(formData.get('budget')) || 0,
      editors: cleanEditors,
      image_url: campaignImage || null
    };

    if (editingCampaign) {
      setCampaigns(campaigns.map(c => c.ip_id === campData.ip_id ? campData : c));
      await supabase.from('campaigns').update(campData).eq('ip_id', campData.ip_id);
    } else {
      setCampaigns([...campaigns, campData]);
      await supabase.from('campaigns').insert([campData]);
    }
    setCampaignModalOpen(false);
    setEditingCampaign(null);
    setEditorsList([]);
    setEditorInput('');
    setCampaignImage('');
    scheduleSheetSync();
  };

  const openCampaignModal = (camp) => {
    setEditingCampaign(camp);
    setEditorsList(Array.isArray(camp?.editors) ? camp.editors : []);
    setEditorInput('');
    setCampaignImage(camp?.image_url || '');
    setCampaignModalOpen(true);
  };

  // Downscale an image in-browser to a small data URL (no storage bucket needed).
  const handleCampaignImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please choose an image file.'); return; }
    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        const max = 360;
        let w = img.width, h = img.height;
        if (w > h && w > max) { h = Math.round(h * max / w); w = max; }
        else if (h >= w && h > max) { w = Math.round(w * max / h); h = max; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0c0a08';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        setCampaignImage(canvas.toDataURL('image/jpeg', 0.82));
        setUploadingImage(false);
      };
      img.onerror = () => { setUploadingImage(false); alert('Could not read that image.'); };
      img.src = ev.target.result;
    };
    reader.onerror = () => { setUploadingImage(false); alert('Could not read that file.'); };
    reader.readAsDataURL(file);
  };

  const addEditor = () => {
    const v = editorInput.trim().toLowerCase();
    if (!v) return;
    if (!v.includes('@')) { alert('Please enter a valid email address.'); return; }
    if (!editorsList.map(x => x.toLowerCase()).includes(v)) setEditorsList([...editorsList, v]);
    setEditorInput('');
  };

  const removeEditor = (email) => setEditorsList(editorsList.filter(x => x !== email));

  const handleImportFile = (file) => {
    if (!file) return;
    setImportError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = parseCampaignCSV(String(ev.target.result || ''));
        if (parsed.length === 0) {
          setImportError('No creator rows found in that CSV. Make sure it has Name + profile link columns.');
          return;
        }
        setImportRows(parsed);
        setImportName(campaignNameFromFile(file.name));
        setImportOwner('');
        setImportEditorsList([]);
        setImportEditorInput('');
        setImportAutoSync(false);
        setImportModalOpen(true);
      } catch (e) {
        setImportError('Could not read that CSV: ' + (e.message || 'unknown error'));
      }
    };
    reader.onerror = () => setImportError('Could not read that file.');
    reader.readAsText(file);
  };

  const addImportEditor = () => {
    const v = importEditorInput.trim().toLowerCase();
    if (!v) return;
    if (!v.includes('@')) { alert('Please enter a valid email address.'); return; }
    if (!importEditorsList.map(x => x.toLowerCase()).includes(v)) setImportEditorsList([...importEditorsList, v]);
    setImportEditorInput('');
  };

  const executeImport = async () => {
    if (!isAdmin) { alert('Only an admin can import campaigns.'); return; }
    if (!importName.trim()) { setImportError('Please give the campaign a name.'); return; }
    if (!importOwner.trim() || !importOwner.includes('@')) { setImportError('Please enter a valid owner email.'); return; }
    setImporting(true);
    setImportError('');

    const newId = `ip_${Date.now()}`;
    const totalSpend = importRows.reduce((s, r) => s + (Number(r.spend) || 0), 0);
    const campData = {
      ip_id: newId,
      ip_name: importName.trim(),
      owner: importOwner.trim().toLowerCase(),
      status: 'active',
      budget: totalSpend,
      editors: importEditorsList.map(x => x.toLowerCase()),
      image_url: null
    };

    const newCreators = importRows.map((r, i) => ({
      creator_deal_id: `cd_${Date.now()}_${i}`,
      ip_id: newId,
      creator_name: r.name,
      platform: r.platform,
      profile_link: r.profile,
      followers: r.followers,
      content_type: r.type,
      deal_value: r.spend,
      closed_month: r.month || null,
      planned_go_live_date: r.date || null,
      planned_go_live_month: r.month || null,
      payment_model: '100_advance',
      creator_status: 'booked',
      deliverable_link: r.deliverable,
      views: r.views,
      likes: 0, comments: 0, shares: 0, saves: 0
    }));

    try {
      const { error: campErr } = await supabase.from('campaigns').insert([campData]);
      if (campErr) throw campErr;
      const { error: crErr } = await supabase.from('creators').insert(newCreators);
      if (crErr) throw crErr;
    } catch (e) {
      setImporting(false);
      setImportError('Import failed while saving: ' + (e.message || 'unknown error'));
      return;
    }

    setCampaigns(prev => [...prev, campData]);
    setCreators(prev => [...prev, ...newCreators]);
    setImportModalOpen(false);
    setImporting(false);
    setActiveTab('campaigns');
    setActiveCampaignId(newId);

    if (importAutoSync) {
      setIsCampaignSyncing(true);
      let updated = [...newCreators];
      for (const cr of newCreators.filter(c => c.deliverable_link)) {
        try {
          const res = await fetch('/api/sync-instagram', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ link: cr.deliverable_link }) });
          const data = await res.json();
          if (data.success) {
            updated = updated.map(c => c.creator_deal_id === cr.creator_deal_id ? { ...c, ...data.metrics } : c);
            await supabase.from('creators').update({
              views: data.metrics.views, likes: data.metrics.likes, comments: data.metrics.comments,
              shares: data.metrics.shares, saves: data.metrics.saves,
              followers: data.metrics.followers > 0 ? data.metrics.followers : cr.followers
            }).eq('creator_deal_id', cr.creator_deal_id);
          }
        } catch (err) { console.error(err); }
      }
      setCreators(prev => prev.map(c => updated.find(x => x.creator_deal_id === c.creator_deal_id) || c));
      setIsCampaignSyncing(false);
    }
    scheduleSheetSync();
  };

  const openCampaignEdit = (e, camp) => {
    e.stopPropagation();
    openCampaignModal(camp);
  };

  const handleSaveCreator = async (e) => {
    e.preventDefault();
    if (!canManageCampaign(activeCampaign)) { alert('You do not have edit access to this campaign.'); return; }
    const formData = new FormData(e.target);
    
    const goLiveDate = formData.get('planned_go_live_date');
    const goLiveMonth = new Date(goLiveDate).toLocaleString('default', { month: 'long' }) || targetMonth;
    const invoiceDate = formData.get('invoice_date');
    const invoiceMonth = new Date(invoiceDate).toLocaleString('default', { month: 'long' }) || targetMonth;
    const dealValue = parseInt(formData.get('deal_value')) || 0;

    const creatorData = {
      creator_deal_id: editingCreator ? editingCreator.creator_deal_id : `cd_${Date.now()}`,
      ip_id: activeCampaignId, 
      creator_name: formData.get('creator_name'),
      platform: formData.get('platform'),
      profile_link: formData.get('profile_link'),
      followers: parseInt(formData.get('followers')) || 0,
      content_type: formData.get('content_type'),
      deal_value: dealValue,
      closed_month: targetMonth,
      planned_go_live_date: goLiveDate,
      planned_go_live_month: goLiveMonth,
      payment_model: formData.get('payment_model'),
      creator_status: 'booked',
      deliverable_link: formData.get('deliverable_link'),
      views: parseInt(formData.get('views')) || 0,
      likes: parseInt(formData.get('likes')) || 0,
      comments: parseInt(formData.get('comments')) || 0,
      shares: parseInt(formData.get('shares')) || 0,
      saves: parseInt(formData.get('saves')) || 0,
    };

    const billData = {
      invoice_id: editingCreator ? bills.find(b=>b.creator_deal_id === creatorData.creator_deal_id)?.invoice_id || `inv_${creatorData.creator_deal_id}` : `inv_${creatorData.creator_deal_id}`,
      creator_deal_id: creatorData.creator_deal_id,
      invoice_amount: dealValue,
      invoice_date: invoiceDate,
      invoice_month: invoiceMonth,
      status: 'processed'
    };

    if (editingCreator) {
      setCreators(creators.map(c => c.creator_deal_id === creatorData.creator_deal_id ? creatorData : c));
      await supabase.from('creators').update(creatorData).eq('creator_deal_id', creatorData.creator_deal_id);
      
      const existingBill = bills.find(b => b.creator_deal_id === creatorData.creator_deal_id);
      if (existingBill) {
        setBills(bills.map(b => b.creator_deal_id === billData.creator_deal_id ? billData : b));
        await supabase.from('bills').update(billData).eq('creator_deal_id', creatorData.creator_deal_id);
      } else {
        setBills([...bills, billData]);
        await supabase.from('bills').insert([billData]);
      }
    } else {
      setCreators([...creators, creatorData]);
      setBills([...bills, billData]);
      await supabase.from('creators').insert([creatorData]);
      await supabase.from('bills').insert([billData]);
    }
    
    setCreatorModalOpen(false);
    setEditingCreator(null);
    scheduleSheetSync();
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2600); };

  const handleScrape = async () => {
    const q = scrapeQuery.trim();
    if (!q) return;
    setScrapeLoading(true); setScrapeNote(''); setScrapeResults([]);
    try {
      const res = await fetch('/api/scrape-instagram', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q, platform: scrapePlatform }) });
      const data = await res.json();
      if (data.success && Array.isArray(data.results) && data.results.length) {
        setScrapeResults(data.results.map(r => ({ ...r, fee: '' })));
        if (data.simulated) setScrapeNote(scrapePlatform === 'youtube' ? 'Showing simulated data — add a YOUTUBE_API_KEY to the scrape API route for live YouTube data.' : 'Showing simulated data — add an Apify token to the scrape API route for live Instagram data.');
      } else {
        setScrapeNote(data.error || 'No profiles found for that search.');
      }
    } catch (e) {
      setScrapeNote('Scrape request failed (' + (e.message || 'network error') + '). Make sure the /api/scrape-instagram route is deployed.');
    } finally {
      setScrapeLoading(false);
    }
  };

  const addLeadToCampaign = async (lead, campId, poc) => {
    if (!campId) { alert('Pick a campaign first.'); return; }
    const newC = {
      creator_deal_id: `cd_${Date.now()}`,
      ip_id: campId,
      creator_name: lead.fullName || lead.username,
      platform: lead.platform || 'Instagram',
      profile_link: lead.profileUrl,
      followers: lead.followers || 0,
      content_type: lead.category || 'Reel Collab',
      deal_value: Math.round(Number(lead.fee) || 0),
      closed_month: null,
      planned_go_live_date: null,
      planned_go_live_month: null,
      payment_model: '100_advance',
      creator_status: 'lead',
      deliverable_link: '',
      views: lead.avgViews || 0,
      likes: lead.avgLikes || 0,
      comments: lead.avgComments || 0,
      shares: 0, saves: 0
    };
    setCreators(prev => [...prev, { ...newC, poc: poc || null }]);
    setLeadPickerFor(null);
    setLeadAssignCampaign('');
    setLeadAssignPoc('');
    await supabase.from('creators').insert([newC]);
    if (poc) { try { await supabase.from('creators').update({ poc }).eq('creator_deal_id', newC.creator_deal_id); } catch {} }
    scheduleSheetSync();
    showToast(`Added ${newC.creator_name} to ${campaigns.find(c => c.ip_id === campId)?.ip_name || 'campaign'} → In-Talks`);
  };

  const handleAddLead = async (e) => {
    e.preventDefault();
    if (!canManageCampaign(activeCampaign)) { alert('You do not have edit access to this campaign.'); return; }
    const f = new FormData(e.target);
    const name = (f.get('creator_name') || '').toString().trim();
    if (!name) { alert('Enter a creator name.'); return; }
    const poc = (f.get('poc') || '').toString().trim();
    const newC = {
      creator_deal_id: `cd_${Date.now()}`,
      ip_id: activeCampaignId,
      creator_name: name,
      platform: f.get('platform') || 'Instagram',
      profile_link: (f.get('profile_link') || '').toString().trim(),
      followers: parseInt(f.get('followers')) || 0,
      content_type: (f.get('content_type') || '').toString().trim() || 'Reel Collab',
      deal_value: parseInt(f.get('deal_value')) || 0,
      closed_month: null,
      planned_go_live_date: null,
      planned_go_live_month: null,
      payment_model: '100_advance',
      creator_status: 'lead',
      deliverable_link: '',
      views: 0, likes: 0, comments: 0, shares: 0, saves: 0
    };
    setCreators(prev => [...prev, { ...newC, poc: poc || null }]);
    setAddLeadOpen(false);
    try {
      await supabase.from('creators').insert([newC]);
      if (poc) { try { await supabase.from('creators').update({ poc }).eq('creator_deal_id', newC.creator_deal_id); } catch {} }
    } catch (err) { console.error('add in-talks failed:', err); }
    scheduleSheetSync();
    showToast(`Added ${name} → In-Talks`);
  };

  const updateCreatorGoLive = async (creator, date) => {
    const month = date ? new Date(date).toLocaleString('default', { month: 'long' }) : null;
    const status = date ? 'booked' : creator.creator_status;
    setCreators(creators.map(c => c.creator_deal_id === creator.creator_deal_id ? { ...c, planned_go_live_date: date || null, planned_go_live_month: month, creator_status: status } : c));
    await supabase.from('creators').update({ planned_go_live_date: date || null, planned_go_live_month: month, creator_status: status }).eq('creator_deal_id', creator.creator_deal_id);
  };

  const updateCreatorInvoice = async (creator, date) => {
    if (!date) return;
    const month = new Date(date).toLocaleString('default', { month: 'long' });
    const existing = bills.find(b => b.creator_deal_id === creator.creator_deal_id);
    const billData = {
      invoice_id: existing?.invoice_id || `inv_${creator.creator_deal_id}`,
      creator_deal_id: creator.creator_deal_id,
      invoice_amount: creator.deal_value || 0,
      invoice_date: date,
      invoice_month: month,
      status: 'processed'
    };
    if (existing) {
      setBills(bills.map(b => b.creator_deal_id === creator.creator_deal_id ? billData : b));
      await supabase.from('bills').update(billData).eq('creator_deal_id', creator.creator_deal_id);
    } else {
      setBills([...bills, billData]);
      await supabase.from('bills').insert([billData]);
    }
  };

  const moveCreatorToCampaign = async (creator, campId) => {
    setCreators(creators.map(c => c.creator_deal_id === creator.creator_deal_id ? { ...c, ip_id: campId } : c));
    await supabase.from('creators').update({ ip_id: campId }).eq('creator_deal_id', creator.creator_deal_id);
    showToast(`Moved ${creator.creator_name} to ${campaigns.find(c => c.ip_id === campId)?.ip_name || 'campaign'}`);
  };

  const editFromTimeline = (creator) => {
    setActiveCampaignId(creator.ip_id);
    setEditingCreator(creator);
    setCreatorModalOpen(true);
  };

  const setLeadDraft = (id, patch) => setLeadDrafts(d => ({ ...d, [id]: { ...d[id], ...patch } }));

  const getLeadDraft = (creator) => ({
    budget: leadDrafts[creator.creator_deal_id]?.budget ?? (creator.deal_value || ''),
    date: leadDrafts[creator.creator_deal_id]?.date ?? (creator.planned_go_live_date || ''),
    poc: leadDrafts[creator.creator_deal_id]?.poc ?? (creator.poc || '')
  });

  const persistPOC = async (creator, poc) => {
    if ((creator.poc || '') === (poc || '')) return;
    setCreators(creators.map(c => c.creator_deal_id === creator.creator_deal_id ? { ...c, poc } : c));
    await supabase.from('creators').update({ poc }).eq('creator_deal_id', creator.creator_deal_id);
    scheduleSheetSync();
  };

  const confirmLead = async (creator) => {
    const draft = getLeadDraft(creator);
    const budget = Math.round(Number(draft.budget) || 0);
    const date = draft.date || '';
    if (!budget || !date) { alert('Add an expected budget and a go-live date before confirming. (Invoice date is optional — add it later in the campaign.)'); return; }
    const month = new Date(date).toLocaleString('default', { month: 'long' });
    const update = { deal_value: budget, planned_go_live_date: date, planned_go_live_month: month, creator_status: 'booked' };
    setCreators(creators.map(c => c.creator_deal_id === creator.creator_deal_id ? { ...c, ...update } : c));
    setLeadDrafts(d => { const n = { ...d }; delete n[creator.creator_deal_id]; return n; });
    await supabase.from('creators').update(update).eq('creator_deal_id', creator.creator_deal_id);
    scheduleSheetSync();
    showToast(`${creator.creator_name} confirmed → moved to Live Creators in ${campaigns.find(c => c.ip_id === creator.ip_id)?.ip_name || 'campaign'}`);
  };

  const rejectLead = async (creator) => {
    if (!window.confirm(`Remove ${creator.creator_name} from the talking phase? This deletes the lead.`)) return;
    setCreators(creators.filter(c => c.creator_deal_id !== creator.creator_deal_id));
    setLeadDrafts(d => { const n = { ...d }; delete n[creator.creator_deal_id]; return n; });
    await supabase.from('creators').delete().eq('creator_deal_id', creator.creator_deal_id);
    scheduleSheetSync();
  };

  const requestDelete = (e, type, id, name) => {
    e.stopPropagation();
    setDeletePrompt({ isOpen: true, type, id, name });
  };

  const executeDelete = async () => {
    if (deletePrompt.type === 'campaign') {
      if (!isAdmin) { alert('Only an admin can delete a campaign.'); return; }
      const campId = deletePrompt.id;
      const childCreatorIds = creators.filter(c => c.ip_id === campId).map(c => c.creator_deal_id);
      // Remove the campaign and everything under it so it stops counting in analytics/reports.
      setCampaigns(campaigns.filter(c => c.ip_id !== campId));
      setCreators(creators.filter(c => c.ip_id !== campId));
      setBills(bills.filter(b => !childCreatorIds.includes(b.creator_deal_id)));
      await supabase.from('campaigns').delete().eq('ip_id', campId);
      await supabase.from('creators').delete().eq('ip_id', campId);
      if (childCreatorIds.length) await supabase.from('bills').delete().in('creator_deal_id', childCreatorIds);
      if (activeCampaignId === campId) setActiveCampaignId(null);
    } else if (deletePrompt.type === 'creator') {
      const target = creators.find(c => c.creator_deal_id === deletePrompt.id);
      const camp = activeCampaign || campaigns.find(c => c.ip_id === target?.ip_id);
      if (!canManageCampaign(camp)) { alert('You do not have edit access to this campaign.'); return; }
      setCreators(creators.filter(c => c.creator_deal_id !== deletePrompt.id));
      setBills(bills.filter(b => b.creator_deal_id !== deletePrompt.id));
      await supabase.from('creators').delete().eq('creator_deal_id', deletePrompt.id);
      await supabase.from('bills').delete().eq('creator_deal_id', deletePrompt.id);
    }
    setDeletePrompt({ isOpen: false, type: '', id: '', name: '' });
    scheduleSheetSync();
  };

  const handleAutoSync = async () => {
    const linkInput = document.querySelector('input[name="deliverable_link"]').value;
    if (!linkInput) { alert("Please paste a deliverable link first to auto-sync metrics."); return; }
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync-instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link: linkInput })
      });
      const data = await res.json();
      if (data.success) {
        document.querySelector('input[name="views"]').value = data.metrics.views;
        document.querySelector('input[name="likes"]').value = data.metrics.likes;
        document.querySelector('input[name="comments"]').value = data.metrics.comments;
        document.querySelector('input[name="shares"]').value = data.metrics.shares;
        document.querySelector('input[name="saves"]').value = data.metrics.saves;
        
        if (data.metrics.followers && data.metrics.followers > 0) {
          document.querySelector('input[name="followers"]').value = data.metrics.followers;
        }

        setCreators(prev => prev.map(c => c.creator_deal_id === editingCreator?.creator_deal_id ? { ...c, ...data.metrics } : c));
        setEditingCreator(prev => prev ? { ...prev, ...data.metrics } : null);
        if (data.simulated) {
          alert('⚠️ These are ESTIMATED numbers, not live data.\n\nReason: ' + (data.reason || 'the live source could not be reached') + '\n\nThe fields were filled with placeholder estimates. Fix the cause above and sync again for real numbers.');
        } else {
          showToast('Synced live metrics ✓');
        }
      } else {
        alert("Failed to sync metrics: " + data.error);
      }
    } catch (err) {
      alert("A network error occurred while syncing.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Per-campaign sync: only syncs creators inside the given campaign.
  const handleCampaignSync = async (campaignId) => {
    if (!canManageCampaign(campaigns.find(c => c.ip_id === campaignId))) { alert('You do not have edit access to this campaign.'); return; }
    const creatorsWithLinks = creators.filter(c => c.ip_id === campaignId && c.deliverable_link && c.deliverable_link.trim() !== '');
    if (creatorsWithLinks.length === 0) {
      alert("No creators in this campaign have a live deliverable link to sync.");
      return;
    }

    setIsCampaignSyncing(true);
    let successfulSyncs = 0;
    let localCreatorsState = [...creators];

    for (let creator of creatorsWithLinks) {
      try {
        const res = await fetch('/api/sync-instagram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ link: creator.deliverable_link })
        });
        const data = await res.json();

        if (data.success) {
          localCreatorsState = localCreatorsState.map(c => 
            c.creator_deal_id === creator.creator_deal_id ? { ...c, ...data.metrics } : c
          );

          await supabase
            .from('creators')
            .update({
              views: data.metrics.views,
              likes: data.metrics.likes,
              comments: data.metrics.comments,
              shares: data.metrics.shares,
              saves: data.metrics.saves,
              followers: data.metrics.followers > 0 ? data.metrics.followers : creator.followers
            })
            .eq('creator_deal_id', creator.creator_deal_id);

          successfulSyncs++;
        }
      } catch (err) {
        console.error(`Error syncing ${creator.creator_name}:`, err);
      }
    }

    setCreators(localCreatorsState);
    setIsCampaignSyncing(false);
    scheduleSheetSync();
    alert(`Sync complete for this campaign — updated ${successfulSyncs} of ${creatorsWithLinks.length} creator${creatorsWithLinks.length === 1 ? '' : 's'} with live links.`);
  };

  const inTalksTable = (campLeads, canManage) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm min-w-[860px]">
        <thead className="text-stone-500">
          <tr className="border-b border-white/[0.05]">
            <th className="px-5 py-2.5 font-medium text-[11px] uppercase tracking-wider">Creator</th>
            <th className="px-4 py-2.5 font-medium text-[11px] uppercase tracking-wider">Stats</th>
            <th className="px-4 py-2.5 font-medium text-[11px] uppercase tracking-wider">POC</th>
            <th className="px-4 py-2.5 font-medium text-[11px] uppercase tracking-wider">Budget</th>
            <th className="px-4 py-2.5 font-medium text-[11px] uppercase tracking-wider">Go-Live Date</th>
            <th className="px-4 py-2.5 font-medium text-[11px] uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.05]">
          {campLeads.map(c => {
            const draft = getLeadDraft(c);
            return (
              <tr key={c.creator_deal_id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3">
                  <button onClick={() => setProfileCardCreator(c)} className="font-medium text-stone-200 hover:text-orange-300 transition-colors text-left">{c.creator_name}</button>
                  <p className="text-xs text-stone-500 tabular-nums">{formatNumber(c.followers)} followers</p>
                </td>
                <td className="px-4 py-3 text-xs text-stone-400 tabular-nums whitespace-nowrap">
                  {formatNumber(c.views || 0)} views · {c.views > 0 ? (((c.likes || 0) + (c.comments || 0)) / c.views * 100).toFixed(1) : '0.0'}% ER
                </td>
                <td className="px-4 py-3">
                  <input type="text" list="poc-options" defaultValue={draft.poc} disabled={!canManage} onChange={(e) => setLeadDraft(c.creator_deal_id, { poc: e.target.value })} onBlur={(e) => persistPOC(c, e.target.value)} placeholder="Assign…" className="w-28 bg-black/40 border border-white/10 rounded-md px-2 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-orange-500/70 disabled:opacity-60" />
                </td>
                <td className="px-4 py-3">
                  <div className="relative w-28">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500 text-sm">₹</span>
                    <input type="number" value={draft.budget} disabled={!canManage} onChange={(e) => setLeadDraft(c.creator_deal_id, { budget: e.target.value })} placeholder="0" className="w-full bg-black/40 border border-white/10 rounded-md pl-6 pr-2 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-orange-500/70 disabled:opacity-60" />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input type="date" value={draft.date} disabled={!canManage} onChange={(e) => setLeadDraft(c.creator_deal_id, { date: e.target.value })} className="bg-black/40 border border-white/10 rounded-md px-2 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-orange-500/70 disabled:opacity-60 [color-scheme:dark]" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openComments(c)} className="text-stone-500 hover:text-orange-400 transition-colors p-1" title="Comments"><MessageSquare size={15}/></button>
                    {canManage && <button onClick={() => editFromTimeline(c)} className="text-stone-500 hover:text-orange-400 transition-colors p-1" title="Edit"><Edit2 size={15}/></button>}
                    {canManage && <button onClick={() => confirmLead(c)} className="w-7 h-7 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 flex items-center justify-center transition-colors" title="Confirm → move to Live Creators"><Check size={15}/></button>}
                    {canManage && <button onClick={() => rejectLead(c)} className="w-7 h-7 rounded-md bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 flex items-center justify-center transition-colors" title="Reject lead"><X size={15}/></button>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const getGroupedCreators = () => {
    const q = (tableExpanded && searchQuery.trim()) ? searchQuery.toLowerCase() : '';
    const campaignCreators = creators.filter(c => c.ip_id === activeCampaignId && c.creator_status !== 'lead' && (!q || (c.creator_name || '').toLowerCase().includes(q)));
    campaignCreators.sort((a, b) => new Date(a.planned_go_live_date) - new Date(b.planned_go_live_date));

    const groups = campaignCreators.reduce((acc, creator) => {
      const month = creator.planned_go_live_month || 'Unscheduled';
      if (!acc[month]) acc[month] = [];
      acc[month].push(creator);
      return acc;
    }, {});

    // Order groups most-recent month first; keep "Unscheduled" at the bottom.
    const ordered = {};
    Object.keys(groups)
      .sort((a, b) => {
        if (a === 'Unscheduled') return 1;
        if (b === 'Unscheduled') return -1;
        return new Date(groups[b][0].planned_go_live_date) - new Date(groups[a][0].planned_go_live_date);
      })
      .forEach(m => { ordered[m] = groups[m]; });
    return ordered;
  };

  const NAV_COLORS = { campaigns: '#6366f1', finance_vs_ops: '#10b981', scraper: '#0ea5e9', payments: '#8b5cf6', reports: '#f43f5e' };
  const NavItem = ({ id, icon: Icon, label }) => {
    const active = activeTab === id && !activeCampaignId;
    const light = theme === 'light';
    const collapsed = sidebarCollapsed;
    const pad = collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3';
    if (light) {
      const c = NAV_COLORS[id] || '#6366f1';
      return (
        <button
          title={collapsed ? label : undefined}
          onClick={() => { setActiveTab(id); setActiveCampaignId(null); setSelectedCampaigns([]); }}
          style={active ? { backgroundColor: c + '14', borderColor: c + '40', color: c } : undefined}
          className={`group w-full flex items-center ${pad} rounded-lg text-sm font-medium transition-all duration-200 relative border ${active ? 'shadow-[0_1px_2px_rgba(16,24,40,0.05)]' : 'border-transparent text-stone-500 hover:text-stone-800 hover:bg-black/[0.035]'}`}
        >
          {active && !collapsed && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full" style={{ backgroundColor: c }}></span>}
          <Icon size={16} style={active ? { color: c } : undefined} className={active ? '' : 'text-stone-400 group-hover:text-stone-700'} />
          {!collapsed && label}
        </button>
      );
    }
    return (
      <button 
        title={collapsed ? label : undefined}
        onClick={() => { setActiveTab(id); setActiveCampaignId(null); setSelectedCampaigns([]); }}
        className={`group w-full flex items-center ${pad} rounded-lg text-sm font-medium transition-all duration-200 relative ${
          active
            ? 'bg-orange-500/10 text-orange-200 border border-orange-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_24px_-8px_rgba(249,115,22,0.5)]' 
            : 'text-stone-500 border border-transparent hover:text-stone-300 hover:bg-white/[0.03]'
        }`}
      >
        {active && !collapsed && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] rounded-full bg-orange-500 shadow-[0_0_10px_2px_rgba(249,115,22,0.7)]"></span>}
        <Icon className={active ? 'text-orange-400' : 'text-stone-500 group-hover:text-stone-300'} size={16}/>
        {!collapsed && label}
      </button>
    );
  };

  // Reusable avatar picker grid
  const AvatarPicker = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <AvatarBadge index={profileAvatar} photo={profilePhoto} size={56} ring />
        <div className="flex items-center gap-2">
          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium bg-orange-500/15 text-orange-300 border border-orange-500/30 hover:bg-orange-500/25 transition-colors">
            <ImagePlus size={14}/> Upload photo
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden"/>
          </label>
          {profilePhoto && (
            <button type="button" onClick={() => setProfilePhoto(null)} className="px-3 py-2 rounded-md text-xs font-medium border border-white/10 text-stone-400 hover:bg-white/[0.06] transition-colors">Remove</button>
          )}
        </div>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.15em] text-stone-500 mb-2 font-medium">{profilePhoto ? 'Or pick an animal instead' : 'Pick an animal'}</p>
        <div className="grid grid-cols-6 gap-3">
          {AVATARS.map((a, i) => {
            const active = !profilePhoto && profileAvatar === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => { setProfilePhoto(null); setProfileAvatar(i); }}
                className={`relative aspect-square rounded-full bg-gradient-to-br ${a.grad} flex items-center justify-center text-xl transition-transform hover:scale-105 ${active ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-[#0c0a08]' : 'opacity-70 hover:opacity-100'}`}
              >
                <span>{a.emoji}</span>
                {active && (
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
                    <Check size={12} className="text-white"/>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const isAdmin = !!currentUser?.isAdmin;
  const myEmail = (currentUser?.email || '').toLowerCase();
  // ---- messaging derived ----
  const msgUnread = (ch) => {
    const seen = msgSeen[ch];
    return allMsgs.filter(m => m.channel === ch && (m.sender_email || '').toLowerCase() !== myEmail && (!seen || new Date(m.created_at) > new Date(seen))).length;
  };
  const myDmChannels = [...new Set(allMsgs.filter(m => m.channel.startsWith('dm:') && m.channel.slice(3).split('|').includes(myEmail)).map(m => m.channel))];
  const unreadTotal = msgUnread('group:all') + myDmChannels.reduce((s, ch) => s + msgUnread(ch), 0);
  const otherEmail = (ch) => ch.slice(3).split('|').find(e => e !== myEmail) || myEmail;
  const profileForEmail = (email) => {
    const e = (email || '').toLowerCase();
    if (e === myEmail) return { email: myEmail, display_name: profileName || profile?.display_name || myEmail, title: profileTitle, bio: profileBio, interests: profileInterests, avatar_index: profileAvatar, avatar_photo: profilePhoto };
    return teamProfiles.find(p => (p.email || '').toLowerCase() === e) || null;
  };
  const avatarPropsForEmail = (email) => {
    const p = profileForEmail(email);
    return { index: p?.avatar_index ?? hashIndex(email || '', AVATARS.length), photo: p?.avatar_photo || null };
  };
  const dmThreads = myDmChannels.map(ch => {
    const ms = allMsgs.filter(m => m.channel === ch);
    const last = ms[ms.length - 1];
    return { ch, name: nameForEmail(otherEmail(ch)), last: last?.body || '', lastAt: last?.created_at, unread: msgUnread(ch) };
  }).sort((a, b) => new Date(b.lastAt || 0) - new Date(a.lastAt || 0));
  const channelMsgs = allMsgs.filter(m => m.channel === msgChannel);
  const groupLastIncoming = [...allMsgs].reverse().find(m => m.channel === 'group:all' && (m.sender_email || '').toLowerCase() !== myEmail);
  const unreadConvos = [
    ...(msgUnread('group:all') > 0 ? [{ ch: 'group:all', name: 'Team Channel', who: groupLastIncoming?.sender_name || '', last: groupLastIncoming?.body || '', lastAt: groupLastIncoming?.created_at, unread: msgUnread('group:all'), group: true }] : []),
    ...dmThreads.filter(t => t.unread > 0).map(t => ({ ch: t.ch, name: t.name, who: t.name, last: t.last, lastAt: t.lastAt, unread: t.unread, group: false }))
  ].sort((a, b) => new Date(b.lastAt || 0) - new Date(a.lastAt || 0));
  const peopleResults = msgSearch.trim()
    ? teamProfiles.filter(p => (p.email || '').toLowerCase() !== myEmail && (p.display_name || '').toLowerCase().includes(msgSearch.toLowerCase()))
    : [];
  const canManageCampaign = (camp) => {
    if (isAdmin) return true;
    if (!camp) return false;
    const allowed = [String(camp.owner || '').toLowerCase()];
    if (Array.isArray(camp.editors)) camp.editors.forEach(e => allowed.push(String(e).toLowerCase()));
    return allowed.includes(myEmail);
  };
  const activeCampaign = campaigns.find(c => c.ip_id === activeCampaignId);
  const canManageActive = canManageCampaign(activeCampaign);

  if (!isMounted || !authChecked) {
    return (
      <div className="h-screen w-full bg-[#0a0807] flex items-center justify-center">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-orange-500 to-amber-600 shadow-[0_0_24px_rgba(249,115,22,0.6)] animate-pulse"></div>
      </div>
    );
  }

  // ============ LOGIN SCREEN ============
  if (!currentUser) {
    return (
      <div className="flex min-h-screen bg-[#070605] font-sans text-stone-200 selection:bg-orange-500/30 relative overflow-hidden">
        {/* Ambient techy backdrop across the whole screen */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,_rgba(249,115,22,0.20),_transparent_45%)]"></div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_85%,_rgba(120,53,15,0.22),_transparent_40%)]"></div>
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:46px_46px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"></div>

        {/* Left visual panel */}
        <div className="hidden lg:flex relative w-[52%] overflow-hidden">
          {/* glowing seam */}
          <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-orange-500/60 to-transparent shadow-[0_0_18px_2px_rgba(249,115,22,0.45)] z-20"></div>

          {/* cool tech illustration filling the panel */}
          <OrbitalScene light={false} className="absolute inset-0 w-full h-full" />

          <div className="relative z-10 flex flex-col justify-between p-14 w-full">
            {/* Brand lockup top-left */}
            <div className="flex items-center gap-3">
              {!logoError ? (
                <img
                  src={LOGO_URL}
                  alt="YAAS"
                  onError={() => setLogoError(true)}
                  className="app-logo h-16 w-auto max-w-[260px] object-contain"
                />
              ) : (
                <div className="h-10 px-3 rounded-md bg-gradient-to-br from-orange-500 to-amber-600 shadow-[0_0_14px_rgba(249,115,22,0.6)] flex items-center font-bold tracking-tight text-white">YAAS</div>
              )}
              <div className="h-7 w-px bg-white/15"></div>
              <div className="leading-tight">
                <p className="font-semibold tracking-tight text-stone-100">Influencer OS</p>
                <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-orange-400/80">YAAS Influencer Dashboard</p>
              </div>
            </div>

            <div></div>

            <p className="text-[11px] font-mono text-stone-500 tracking-[0.22em] uppercase">// One source of truth for every creator campaign</p>
          </div>
        </div>

        {/* Right sign-in panel */}
        <div className="relative flex-1 flex items-center">
          <div className="relative z-10 w-full max-w-xl px-10 md:px-16 py-12">
            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/[0.06] backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_2px_rgba(249,115,22,0.8)]"></span>
              <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-orange-300">YAAS // Influencer OS</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tighter leading-[0.9] text-white uppercase [text-shadow:0_0_40px_rgba(249,115,22,0.35)]">
              Centralized<br/>Creator<br/><span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">Hub</span>
            </h1>

            <p className="text-stone-400 text-base md:text-lg leading-relaxed mt-8 max-w-md">
              YAAS's internal influencer dashboard. Reconcile go-live timelines against billing periods, track live performance, and keep every campaign honest down to the rupee.
            </p>

            {loginMode === 'google' ? (
              <>
                <p className="text-stone-500 text-sm leading-relaxed mt-5 max-w-md">
                  Sign in with your {ALLOWED_DOMAIN ? <><span className="font-semibold text-stone-300">@{ALLOWED_DOMAIN}</span> </> : ''}Google account. Single sign-on — no extra password to remember.
                </p>

                <button
                  onClick={handleGoogleLogin}
                  className="group mt-9 w-full max-w-md flex items-center justify-center gap-3 bg-white hover:bg-stone-100 text-stone-900 font-semibold text-sm tracking-wide uppercase py-4 rounded-xl transition-all shadow-[0_0_30px_-8px_rgba(255,255,255,0.4)]"
                >
                  <GoogleG size={20}/> Sign in with Google
                </button>

                <button
                  onClick={() => { setLoginMode('admin'); setLoginError(''); }}
                  className="mt-5 inline-flex items-center gap-2 text-stone-500 hover:text-orange-300 text-sm font-medium transition-colors"
                >
                  <Shield size={15}/> Sign in as admin
                </button>
              </>
            ) : (
              <>
                <p className="text-stone-500 text-sm leading-relaxed mt-5 max-w-md">
                  Admin access. Enter your operator credentials.
                </p>

                <form onSubmit={handleAdminLogin} className="mt-7 w-full max-w-md space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="text-stone-500" size={16}/>
                    </div>
                    <input
                      type="text"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@yaas"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-3 py-3.5 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-orange-500/70 backdrop-blur-sm transition-colors"
                      required
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="text-stone-500" size={16}/>
                    </div>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-3 py-3.5 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-orange-500/70 backdrop-blur-sm transition-colors"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm tracking-wide uppercase py-4 rounded-xl transition-colors shadow-[0_0_30px_-8px_rgba(249,115,22,0.8)]"
                  >
                    <Shield size={16}/> Sign in as admin
                  </button>
                </form>

                <button
                  onClick={() => { setLoginMode('google'); setLoginError(''); }}
                  className="mt-5 inline-flex items-center gap-2 text-stone-500 hover:text-orange-300 text-sm font-medium transition-colors"
                >
                  <ArrowLeft size={15}/> Back to Google sign-in
                </button>
              </>
            )}

            {loginError && (
              <div className="mt-6 max-w-md flex items-start gap-2 text-orange-200 bg-orange-500/[0.08] border border-orange-500/30 px-4 py-3 rounded-lg text-sm backdrop-blur-sm">
                <AlertCircle size={16} className="mt-0.5 shrink-0"/> <span>{loginError}</span>
              </div>
            )}

            <p className="mt-10 text-[11px] font-mono text-stone-600 tracking-[0.2em] uppercase">
              Influencer OS v6.0.0 // {loginMode === 'admin' ? 'Admin Access' : 'Google SSO'} · A YAAS Product
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============ PROFILE SETUP (no profile yet) ============
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0807] font-sans text-stone-200 selection:bg-orange-500/30 p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-700/15 via-[#0a0807] to-[#0a0807]"></div>
        <OrbitalScene className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none" />

        <div className="relative w-full max-w-lg p-8 bg-white/[0.03] border border-white/[0.08] rounded-2xl shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center gap-2 mb-2 text-orange-400">
            <Sparkles size={16}/>
            <span className="text-[11px] uppercase tracking-[0.2em] font-semibold">Set up your profile</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-100 tracking-tight">Make it yours</h1>
          <p className="text-sm text-stone-500 mt-1">
            Signed in as <span className="text-stone-300">{currentUser.email}</span>
            {currentUser.isAdmin && <span className="ml-2 inline-flex items-center gap-1 text-orange-300 text-xs"><Shield size={12}/> Admin</span>}
          </p>

          <div className="mt-7 flex items-center gap-4">
            <AvatarBadge index={profileAvatar} photo={profilePhoto} size={64} ring />
            <div className="flex-1">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Display Name</label>
              <input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70"
                placeholder="e.g. Tanya R."
              />
            </div>
          </div>

          <div className="mt-5">
            <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Title / Role <span className="text-stone-600 normal-case tracking-normal">(optional)</span></label>
            <input
              value={profileTitle}
              onChange={(e) => setProfileTitle(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70"
              placeholder="e.g. Account Manager"
            />
          </div>

          <div className="mt-6">
            <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-3 font-medium">Choose your avatar</label>
            <AvatarPicker />
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button onClick={handleLogout} className="text-sm text-stone-500 hover:text-stone-300 transition-colors">Not you? Sign out</button>
            <button
              onClick={saveProfile}
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold rounded-md transition-colors shadow-[0_0_22px_-6px_rgba(249,115,22,0.7)]"
            >
              Create profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============ MAIN APP ============
  return (
    <div className={`flex h-screen bg-[#0a0807] font-sans text-stone-300 selection:bg-orange-500/30 ${theme === 'light' ? 'theme-light' : ''}`}>
      <style>{`
        /* ============ LIGHT MODE — clean neutral palette ============ */
        /* canvas + kill dark backdrop */
        .theme-light main{background-color:#f4f5f7!important;background-image:none!important}
        .theme-light .orbital-bg{display:none!important}
        .theme-light [class~="bg-[#0a0807]"]{background-color:#f4f5f7!important}
        .theme-light [class~="bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))]"]{background-image:none!important;background-color:#f4f5f7!important}
        /* surfaces */
        .theme-light [class~="bg-[#0c0a08]"]{background-color:#ffffff!important}
        .theme-light [class~="bg-[#070605]"]{background-color:#eceef1!important}
        .theme-light [class~="bg-[#0a0807]/80"]{background-color:rgba(255,255,255,0.92)!important}
        .theme-light [class~="bg-white/[0.015]"],.theme-light [class~="bg-white/[0.02]"],.theme-light [class~="bg-white/[0.025]"],.theme-light [class~="bg-white/[0.03]"]{background-color:#ffffff!important}
        .theme-light [class~="bg-white/[0.04]"],.theme-light [class~="bg-white/[0.05]"],.theme-light [class~="bg-white/[0.06]"]{background-color:#f1f3f6!important}
        .theme-light [class~="bg-white/[0.1]"],.theme-light [class~="bg-white/10"],.theme-light [class~="bg-white/15"]{background-color:#e7eaef!important}
        .theme-light [class~="bg-black/30"],.theme-light [class~="bg-black/40"]{background-color:#ffffff!important}
        /* sidebar = clean white */
        .theme-light aside{background-color:#ffffff!important;border-color:#e6e8ec!important}
        /* card depth */
        .theme-light [class~="bg-[#0c0a08]"],.theme-light [class~="bg-white/[0.02]"],.theme-light [class~="bg-white/[0.025]"],.theme-light [class~="bg-white/[0.03]"]{box-shadow:0 1px 2px rgba(16,24,40,0.04),0 4px 14px -6px rgba(16,24,40,0.08)}
        /* soften orange glows into clean neutral shadows */
        .theme-light [class*="rgba(249,115,22"]{box-shadow:0 1px 2px rgba(16,24,40,0.05),0 6px 16px -8px rgba(16,24,40,0.12)!important}
        /* borders */
        .theme-light [class~="border-white/[0.06]"],.theme-light [class~="border-white/[0.07]"],.theme-light [class~="border-white/[0.08]"]{border-color:#e6e8ec!important}
        .theme-light [class~="border-white/10"],.theme-light [class~="border-white/[0.1]"]{border-color:#dde0e6!important}
        /* text — slate scale */
        .theme-light [class~="text-stone-100"]{color:#0e121b!important}
        .theme-light [class~="text-stone-200"]{color:#1d2433!important}
        .theme-light [class~="text-stone-300"]{color:#344054!important}
        .theme-light [class~="text-stone-400"]{color:#475467!important}
        .theme-light [class~="text-stone-500"]{color:#667085!important}
        .theme-light [class~="text-stone-600"]{color:#98a2b3!important}
        .theme-light [class~="placeholder-stone-600"]::placeholder{color:#98a2b3!important}
        /* keep orange ACTIONS punchy but make orange TEXT legible on white */
        .theme-light [class~="text-orange-100"]{color:#7c2d12!important}
        .theme-light [class~="text-orange-200"]{color:#9a3412!important}
        .theme-light [class~="text-orange-300"]{color:#c2410c!important}
        .theme-light [class~="text-orange-400"]{color:#c2410c!important}
        /* cyan accent -> teal for white bg */
        .theme-light [class~="text-cyan-300"],.theme-light [class~="text-cyan-400"]{color:#0d9488!important}
        /* ===== Orange accent kept; fix faint orange on white (light mode) ===== */
        /* all orange text -> readable dark orange (covers /70 /80 /90 opacity variants too) */
        .theme-light [class*="text-orange-"]{color:#c2410c!important}
        /* faint orange tints -> actually visible on white (group headers, active pills, etc.) */
        .theme-light [class~="bg-orange-500/[0.04]"],.theme-light [class~="bg-orange-500/[0.06]"],.theme-light [class~="bg-orange-500/[0.07]"],.theme-light [class~="bg-orange-500/[0.08]"],.theme-light [class~="bg-orange-500/10"]{background-color:rgba(249,115,22,0.11)!important}
        .theme-light [class~="bg-orange-500/15"]{background-color:rgba(249,115,22,0.14)!important}
        .theme-light [class~="bg-orange-500/20"]{background-color:rgba(249,115,22,0.17)!important}
        .theme-light [class~="bg-orange-500/25"],.theme-light [class~="bg-orange-500/30"]{background-color:rgba(249,115,22,0.2)!important}
        .theme-light [class~="bg-orange-950/30"]{background-color:rgba(249,115,22,0.1)!important}
        /* faint left-borders on group headers -> more present */
        .theme-light [class~="border-orange-500/60"]{border-color:rgba(249,115,22,0.85)!important}
        /* white text -> dark in light mode EXCEPT on filled orange buttons (keep white there) */
        .theme-light [class~="text-white"]:not([class~="bg-orange-500"]):not([class~="bg-orange-400"]){color:#1c1917!important}
        /* chart hover tooltip (and any /95 dark cards) -> light so text is legible */
        .theme-light [class~="bg-[#0c0a08]/95"]{background-color:rgba(255,255,255,0.98)!important}
        /* logo recolored to orange */
        .app-logo{filter:brightness(0) saturate(100%) invert(52%) sepia(89%) saturate(1746%) hue-rotate(346deg) brightness(101%) contrast(96%)!important}
        /* atom backdrop: shown in light mode (orange variant) */
        .theme-light .orbital-bg{display:block!important;opacity:0.13!important}
        /* login ambient orange/brown glows off in light */
        .theme-light .login-ambient{display:none!important}
      `}</style>
      <aside className={`${sidebarCollapsed ? 'w-[68px]' : 'w-64'} border-r border-white/[0.06] bg-[#0a0807] flex flex-col p-4 z-20 relative transition-[width] duration-200 ease-out`}>
        {/* pop-out collapse / expand toggle */}
        <button
          onClick={() => setSidebarCollapsed(v => !v)}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand' : 'Collapse'}
          className="absolute top-24 -right-3 z-40 h-6 w-6 rounded-full border border-white/10 bg-[#0c0a08] text-stone-300 hover:text-stone-100 hover:border-white/20 flex items-center justify-center shadow-md transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight size={14}/> : <ChevronLeft size={14}/>}
        </button>

        <button onClick={() => setOrbitOpen(true)} title="psst — click me ✨" className={`flex items-center mb-10 mt-2 group/logo ${sidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-2'}`}>
          {!logoError ? (
            <img src={LOGO_URL} alt="YAAS" onError={() => setLogoError(true)} className={`app-logo object-contain transition-transform duration-200 group-hover/logo:scale-105 ${sidebarCollapsed ? 'h-9 w-auto max-w-[44px]' : 'h-12 w-auto max-w-[170px]'}`}/>
          ) : (
            <div className="w-7 h-7 rounded bg-gradient-to-br from-orange-500 to-amber-600 shadow-[0_0_14px_rgba(249,115,22,0.6)] shrink-0"></div>
          )}
          {!sidebarCollapsed && <span className="font-semibold text-stone-100 tracking-tight text-lg">Influencer OS</span>}
        </button>
        <nav className="flex flex-col gap-1.5 flex-1">
          <NavItem icon={FolderKanban} id="campaigns" label="Campaigns"/>
          <div className="h-px w-full bg-white/[0.06] my-2"></div>
          <NavItem icon={ArrowRightLeft} id="finance_vs_ops" label="Finance vs Ops"/>
          <NavItem icon={ScanSearch} id="scraper" label="Lead Scraper"/>
          <NavItem icon={CreditCard} id="payments" label="Payments"/>
          <div className="h-px w-full bg-white/[0.06] my-2"></div>
          <NavItem icon={BarChart3} id="reports" label="Reports & Analytics"/>
        </nav>
      </aside>

      <main className="relative flex-1 flex flex-col min-w-0 overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-900/15 via-[#0a0807] to-[#0a0807]">
        {/* faint animated orbital backdrop */}
        <OrbitalScene light={theme === 'light'} className="orbital-bg absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none z-0" />
        
        <header className="h-16 border-b border-white/[0.06] flex items-center justify-between px-8 backdrop-blur-md bg-[#0a0807]/80 z-30 sticky top-0 shadow-[0_1px_0_rgba(249,115,22,0.08)]">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-medium text-stone-100 tracking-tight capitalize">
              {activeCampaignId ? 'Campaign Workspace' : activeTab.replace(/_/g, ' ')}
            </h1>
            {activeTab === 'finance_vs_ops' && !activeCampaignId && (
              <>
                <div className="h-4 w-px bg-white/10"></div>
                <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] rounded-md p-1 shadow-sm">
                  <span className="text-[10px] font-medium text-stone-500 uppercase tracking-[0.2em] pl-2">Filter Month:</span>
                  <select 
                    value={targetMonth}
                    onChange={(e) => setTargetMonth(e.target.value)}
                    className="bg-transparent text-sm font-medium text-orange-400 outline-none cursor-pointer pr-2"
                  >
                    {ALL_MONTHS.map(m => (
                      <option key={m} value={m} className="bg-[#0a0807] text-stone-200">{m} 2026</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-5">
            <div 
              className="relative"
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setTimeout(() => setIsSearchFocused(false), 200);
                }
              }}
            >
              <div className={`flex items-center bg-white/[0.03] border ${isSearchFocused ? 'border-orange-500/70' : 'border-white/[0.08]'} rounded-md px-3 py-1.5 transition-colors`}>
                <Search className="text-stone-500" size={16}/>
                <input 
                  type="text"
                  placeholder="Search campaigns, creators, people..."
                  className="bg-transparent border-none outline-none text-sm text-stone-200 ml-2 w-56 placeholder-stone-600"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                />
              </div>

              {isSearchFocused && searchQuery.trim() !== '' && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-[#0c0a08] border border-white/[0.08] rounded-lg shadow-2xl overflow-hidden z-50 backdrop-blur-xl">
                  <div className="max-h-80 overflow-y-auto">
                    {searchResults.campaigns.length > 0 && (
                      <div className="p-2">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-semibold mb-1 px-2">Campaigns</p>
                        {searchResults.campaigns.map(camp => (
                          <button
                            key={camp.ip_id}
                            onMouseDown={() => handleSearchResultClick('campaign', camp)}
                            className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/[0.04] transition-colors"
                          >
                            <FolderKanban className="text-orange-400" size={14}/>
                            <div>
                              <p className="text-sm font-medium text-stone-200">{camp.ip_name}</p>
                              <p className="text-xs text-stone-500">Owner: {camp.owner}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {searchResults.creators.length > 0 && (
                      <div className="p-2 border-t border-white/[0.06]">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-semibold mb-1 px-2">Creators</p>
                        {searchResults.creators.map(creator => {
                          const parentCamp = campaigns.find(c => c.ip_id === creator.ip_id);
                          return (
                            <button
                              key={creator.creator_deal_id}
                              onMouseDown={() => handleSearchResultClick('creator', creator)}
                              className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/[0.04] transition-colors"
                            >
                              <Users className="text-cyan-400" size={14}/>
                              <div>
                                <p className="text-sm font-medium text-stone-200">{creator.creator_name}</p>
                                <p className="text-xs text-stone-500">in {parentCamp?.ip_name || 'Campaign'}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {searchResults.people.length > 0 && (
                      <div className="p-2 border-t border-white/[0.06]">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-semibold mb-1 px-2">People</p>
                        {searchResults.people.map(p => (
                          <button
                            key={p.email}
                            onMouseDown={() => { setViewProfileEmail(p.email); setSearchQuery(''); setIsSearchFocused(false); }}
                            className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/[0.04] transition-colors"
                          >
                            <AvatarBadge {...avatarPropsForEmail(p.email)} size={28}/>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-stone-200 truncate">{p.display_name}</p>
                              <p className="text-xs text-stone-500 truncate">{p.title || p.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults.campaigns.length === 0 && searchResults.creators.length === 0 && searchResults.people.length === 0 && (
                      <div className="p-4 text-center text-sm text-stone-500">
                        No results found for "{searchQuery}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-white/10"></div>
            <button
              onClick={() => { setMessagesOpen(true); openChannel(msgChannel); }}
              title="Messages"
              className="relative flex items-center text-stone-500 hover:text-stone-300 transition-colors"
            >
              <MessageSquare size={18}/>
              {unreadTotal > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-1 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center tabular-nums">{unreadTotal > 9 ? '9+' : unreadTotal}</span>}
            </button>
            <div className="relative flex items-center">
              <button
                onClick={() => setNotifPanelOpen(o => !o)}
                title="Notifications"
                className="relative flex items-center text-stone-500 hover:text-stone-300 transition-colors"
              >
                <Bell size={18}/>
                {unreadTotal > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-1 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center tabular-nums">{unreadTotal > 9 ? '9+' : unreadTotal}</span>}
              </button>
              {notifPanelOpen && (
                <>
                  <div className="fixed inset-0 z-[55]" onClick={() => setNotifPanelOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-[#0c0a08] border border-white/10 rounded-xl shadow-2xl z-[56] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-4 py-3 border-b border-white/[0.07] flex items-center justify-between">
                      <span className="text-sm font-semibold text-stone-100">Notifications</span>
                      {unreadTotal > 0 && <span className="text-[11px] text-stone-500">{unreadTotal} unread</span>}
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto">
                      {unreadConvos.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-stone-500">You're all caught up 🎉</div>
                      ) : unreadConvos.map(c => (
                        <button
                          key={c.ch}
                          onClick={() => { setNotifPanelOpen(false); setMessagesOpen(true); openChannel(c.ch); }}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors text-left border-b border-white/[0.04] last:border-0"
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500/80 to-amber-600/80 flex items-center justify-center text-sm font-bold text-white shrink-0">
                            {c.group ? <Hash size={16}/> : (c.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-stone-100 truncate">{c.name}</p>
                              <span className="text-[10px] text-stone-500 shrink-0">{c.lastAt ? timeAgo(c.lastAt) : ''}</span>
                            </div>
                            {c.group && c.who && <p className="text-[11px] text-stone-500 leading-tight">{c.who}</p>}
                            <p className="text-xs text-stone-400 truncate mt-0.5">{c.last}</p>
                          </div>
                          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{c.unread}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <button onClick={() => setSettingsOpen(true)} title="Settings" className="flex items-center text-stone-500 hover:text-stone-300 transition-colors">
              <Settings size={18}/>
            </button>

            {/* Profile menu */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(o => !o)}
                className="flex items-center gap-2 rounded-full hover:bg-white/[0.04] pr-2 pl-0.5 py-0.5 transition-colors"
              >
                <AvatarBadge index={profile.avatar_index ?? 0} photo={profile?.avatar_photo || profilePhoto} size={32}/>
                <ChevronDown size={14} className="text-stone-500"/>
              </button>

              {profileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)}></div>
                  <div className="absolute top-full right-0 mt-2 w-64 bg-[#0c0a08] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl">
                    <div className="p-4 flex items-center gap-3 border-b border-white/[0.06]">
                      <AvatarBadge index={profile.avatar_index ?? 0} photo={profile?.avatar_photo || profilePhoto} size={42}/>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-stone-100 truncate flex items-center gap-1.5">
                          {profile.display_name}
                          {profile.is_admin && <Shield size={12} className="text-orange-400"/>}
                        </p>
                        <p className="text-xs text-stone-500 truncate">{profile.title || currentUser.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setProfileMenuOpen(false); setProfileEditorOpen(true); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-stone-300 hover:bg-white/[0.04] transition-colors"
                    >
                      <Edit2 size={15} className="text-stone-500"/> Edit profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-stone-300 hover:bg-white/[0.04] transition-colors border-t border-white/[0.06]"
                    >
                      <LogOut size={15} className="text-stone-500"/> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 relative z-10">
          
          {activeTab === 'campaigns' && !activeCampaignId && (
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-semibold text-stone-100 tracking-tight flex items-center gap-4">
                  Active Campaigns
                  {selectedCampaigns.length > 0 && (
                    <button 
                      onClick={handleExportCampaigns}
                      className="text-xs flex items-center gap-1.5 bg-orange-500/15 text-orange-300 px-3 py-1.5 rounded-full border border-orange-500/30 hover:bg-orange-500/25 transition-colors"
                    >
                      <Download size={12}/> Export Selected ({selectedCampaigns.length})
                    </button>
                  )}
                </h2>
                
                <div className="flex items-center gap-3">
                  {isAdmin && (
                  <label className="cursor-pointer bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] text-stone-200 px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors">
                    <Download size={16} className="rotate-180"/> Import CSV
                    <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { handleImportFile(e.target.files?.[0]); e.target.value = ''; }} />
                  </label>
                  )}
                  {isAdmin && (
                  <button 
                    onClick={() => openCampaignModal(null)}
                    className="bg-orange-500 text-white hover:bg-orange-400 px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors shadow-[0_0_22px_-6px_rgba(249,115,22,0.7)]"
                  >
                    <Plus size={16}/> New Campaign
                  </button>
                  )}
                </div>
              </div>

              {importError && !importModalOpen && (
                <div className="flex items-center gap-2 text-sm text-orange-200 bg-orange-500/[0.08] border border-orange-500/30 px-4 py-2.5 rounded-lg">
                  <AlertCircle size={16}/> {importError}
                </div>
              )}
              
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map(camp => {
                  const campCreators = creators.filter(c => c.ip_id === camp.ip_id && c.creator_status !== 'lead');
                  const bookedValue = campCreators.reduce((sum, c) => sum + Number(c.deal_value), 0);
                  const isSelected = selectedCampaigns.includes(camp.ip_id);
                  
                  let campViews = 0; let campEngagements = 0;
                  campCreators.forEach(c => {
                    const metrics = calculateCreatorMetrics(c);
                    campViews += Number(c.views || 0); campEngagements += metrics.engagement;
                  });

                  const campCpv = campViews > 0 ? (bookedValue / campViews) : 0;
                  const campCpe = campEngagements > 0 ? (bookedValue / campEngagements) : 0;

                  return (
                    <div 
                      key={camp.ip_id} 
                      onClick={() => setActiveCampaignId(camp.ip_id)}
                      className={`bg-white/[0.025] border p-5 rounded-xl transition-all cursor-pointer group flex flex-col relative overflow-hidden backdrop-blur-sm ${isSelected ? 'border-orange-500/50 shadow-[0_0_24px_-6px_rgba(249,115,22,0.45)]' : 'border-white/[0.07] hover:border-orange-500/30 hover:shadow-[0_0_24px_-10px_rgba(249,115,22,0.4)]'}`}
                    >
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCampaigns(prev => prev.includes(camp.ip_id) ? prev.filter(id => id !== camp.ip_id) : [...prev, camp.ip_id]);
                        }}
                        className={`absolute top-4 left-4 z-10 p-1 rounded-md transition-opacity ${isSelected ? 'opacity-100 text-orange-400' : 'opacity-0 group-hover:opacity-100 text-stone-500 hover:text-stone-300'}`}
                      >
                        {isSelected ? <CheckSquare size={20}/> : <Square size={20}/>}
                      </button>

                      {isAdmin && (
                      <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => openCampaignEdit(e, camp)} className="p-1.5 bg-white/[0.05] hover:bg-white/[0.1] text-stone-300 rounded shadow-md transition-colors"><Edit2 size={14}/></button>
                        <button onClick={(e) => requestDelete(e, 'campaign', camp.ip_id, camp.ip_name)} className="p-1.5 bg-white/[0.05] hover:bg-red-900/50 text-stone-300 hover:text-red-400 rounded shadow-md transition-colors"><Trash2 size={14}/></button>
                      </div>
                      )}

                      <div className="flex justify-between items-start mb-4 pl-8">
                        {camp.image_url ? (
                          <div className="w-10 h-10 rounded overflow-hidden border border-white/[0.06] group-hover:border-orange-500/30 transition-colors">
                            <img src={camp.image_url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-stone-400 group-hover:text-orange-400 group-hover:border-orange-500/30 transition-colors">
                            <FolderKanban size={20}/>
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg font-medium text-stone-200">{camp.ip_name}</h3>
                      <p className="text-sm text-stone-500 mt-1">Owner: {camp.owner}</p>
                      
                      <div className="mt-5 pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-stone-500 mb-1">Booked Value</p>
                          <p className="text-sm font-medium text-stone-100 tabular-nums">{formatMoney(bookedValue)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-stone-500 mb-1">Total Views</p>
                          <p className="text-sm font-medium text-stone-100 tabular-nums">{formatNumber(campViews)}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center gap-4 bg-black/40 rounded-lg p-2.5 border border-white/[0.06]">
                        <div className="flex-1">
                          <p className="text-[10px] text-stone-500 uppercase tracking-[0.2em] mb-0.5">Avg CPV</p>
                          <p className="text-xs font-semibold text-orange-400 tabular-nums">{formatMicroMoney(campCpv)}</p>
                        </div>
                        <div className="w-px h-6 bg-white/10"></div>
                        <div className="flex-1">
                          <p className="text-[10px] text-stone-500 uppercase tracking-[0.2em] mb-0.5">Avg CPE</p>
                          <p className="text-xs font-semibold text-cyan-400 tabular-nums">{formatMicroMoney(campCpe)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'campaigns' && activeCampaignId && (
             <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col gap-4 mb-6">
                <button 
                  onClick={() => setActiveCampaignId(null)}
                  className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-300 transition-colors w-fit"
                >
                  <ArrowLeft size={16}/> Back to Campaigns
                </button>
                <div className="sticky top-0 z-20 py-3 bg-[#0a0807] flex justify-between items-end">
                  <div className="flex items-center gap-4">
                    {activeCampaign?.image_url && (
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 shrink-0">
                        <img src={activeCampaign.image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-2xl font-semibold text-stone-100 tracking-tight">
                        {activeCampaign?.ip_name}
                      </h2>
                      <p className="text-sm text-stone-500 mt-1">Manage creator bookings, deliverables, and performance tracking.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {canManageActive && (
                    <button 
                      onClick={() => handleCampaignSync(activeCampaignId)}
                      disabled={isCampaignSyncing}
                      className="bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] text-stone-300 px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={isCampaignSyncing ? "animate-spin text-orange-400" : "text-orange-400"} size={16}/>
                      {isCampaignSyncing ? "Syncing Campaign..." : "Sync Metrics"}
                    </button>
                    )}
                    <button 
                      onClick={() => setExportModal({ isOpen: true, type: 'ops' })}
                      className="bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] text-stone-300 px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors"
                    >
                      <Download size={16}/> Export Report
                    </button>
                    {canManageActive ? (
                    <button 
                      onClick={() => { setEditingCreator(null); setCreatorModalOpen(true); }}
                      className="bg-orange-500 hover:bg-orange-400 text-white px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors shadow-[0_0_22px_-6px_rgba(249,115,22,0.7)]"
                    >
                      <Plus size={16}/> Book Creator
                    </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium text-stone-400 border border-white/10 bg-white/[0.02]">
                        <Lock size={13}/> View only
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {(() => {
                const liveCount = creators.filter(c => c.ip_id === activeCampaignId && c.creator_status !== 'lead').length;
                const talkCount = creators.filter(c => c.ip_id === activeCampaignId && c.creator_status === 'lead').length;
                return (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center rounded-lg border border-white/10 overflow-hidden w-fit">
                      <button onClick={() => setCampaignView('live')} className={`px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${campaignView === 'live' ? 'bg-orange-500/20 text-orange-300' : 'text-stone-400 hover:text-stone-200'}`}>Live Creators <span className="text-xs opacity-70">({liveCount})</span></button>
                      <button onClick={() => setCampaignView('talks')} className={`px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 border-l border-white/10 ${campaignView === 'talks' ? 'bg-orange-500/20 text-orange-300' : 'text-stone-400 hover:text-stone-200'}`}>In-Talks <span className="text-xs opacity-70">({talkCount})</span></button>
                    </div>
                    <button
                      onClick={() => setTableExpanded(v => !v)}
                      title={tableExpanded ? 'Exit full screen' : 'Expand table'}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03] text-stone-300 hover:text-stone-100 hover:bg-white/[0.06] text-sm font-medium transition-colors shrink-0"
                    >
                      {tableExpanded ? <Minimize2 size={15}/> : <Maximize2 size={15}/>}
                      <span className="hidden sm:inline">{tableExpanded ? 'Minimize' : 'Expand'}</span>
                    </button>
                  </div>
                );
              })()}

              {campaignView === 'live' && (() => {
              const tableEl = (
              <div className={`bg-[#0c0a08] rounded-xl border border-white/[0.07] overflow-auto shadow-xl ${tableExpanded ? 'max-h-[calc(100vh-10rem)]' : 'max-h-[calc(100vh-19rem)]'}`}>
                 <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#0c0a08] text-stone-500 border-b border-white/[0.07] sticky top-0 z-10">
                    <tr>
                      <th className="px-5 py-4 font-medium text-[10px] uppercase tracking-[0.2em]">Creator</th>
                      <th className="px-5 py-4 font-medium text-[10px] uppercase tracking-[0.2em]">Deliverable</th>
                      <th className="px-5 py-4 font-medium text-[10px] uppercase tracking-[0.2em]">Target Date</th>
                      <th className="px-5 py-4 font-medium text-[10px] uppercase tracking-[0.2em]">Performance</th>
                      <th className="px-5 py-4 font-medium text-[10px] uppercase tracking-[0.2em]">Efficiency</th>
                      <th className="px-5 py-4 font-medium text-[10px] uppercase tracking-[0.2em]">Spend (Fee)</th>
                      <th className="px-5 py-4 font-medium text-[10px] uppercase tracking-[0.2em]">Finance Bill</th>
                      <th className="px-5 py-4 font-medium text-[10px] uppercase tracking-[0.2em] text-right">Actions</th>
                    </tr>
                  </thead>
                  
                  {creators.filter(c => c.ip_id === activeCampaignId && c.creator_status !== 'lead').length === 0 ? (
                    <tbody>
                      <tr><td colSpan="8" className="px-5 py-12 text-center text-stone-600">No creators booked for this campaign yet.</td></tr>
                    </tbody>
                  ) : (
                    <tbody className="divide-y divide-white/[0.05]">
                      {Object.entries(getGroupedCreators()).map(([month, monthCreators]) => {
                        return (
                          <React.Fragment key={month}>
                            <tr className="bg-orange-500/[0.04]">
                              <td colSpan="8" className="px-5 py-2.5 border-l-2 border-orange-500/60">
                                <div className="flex justify-between items-center text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-300/80">
                                  <span>{month} Delivery Target</span>
                                </div>
                              </td>
                            </tr>
                            {monthCreators.map((c) => {
                              const creatorBill = bills.find(b => b.creator_deal_id === c.creator_deal_id);
                              const metrics = calculateCreatorMetrics(c);
                              const cCount = commentsFor(c.creator_deal_id).length;

                              return (
                                <tr key={c.creator_deal_id} className="hover:bg-white/[0.025] transition-colors group">
                                  <td className="px-5 py-4">
                                    <div className="flex flex-col">
                                      <div className="flex items-center gap-1.5">
                                        <button onClick={() => setProfileCardCreator(c)} className="font-medium text-stone-200 hover:text-orange-300 transition-colors text-left">{c.creator_name}</button>
                                        <span className="relative group/info inline-flex">
                                          <Info size={13} className="text-stone-500 hover:text-orange-400 cursor-help"/>
                                          <div className="pointer-events-none absolute left-0 top-full mt-2 w-56 opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-150 z-50 bg-[#0c0a08] border border-white/10 rounded-lg shadow-2xl p-3">
                                            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2">Engagement breakdown</p>
                                            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                                              <div className="flex justify-between"><span className="text-stone-500">Likes</span><span className="text-stone-200 tabular-nums">{formatNumber(c.likes || 0)}</span></div>
                                              <div className="flex justify-between"><span className="text-stone-500">Comments</span><span className="text-stone-200 tabular-nums">{formatNumber(c.comments || 0)}</span></div>
                                              <div className="flex justify-between"><span className="text-stone-500">Shares</span><span className="text-stone-200 tabular-nums">{formatNumber(c.shares || 0)}</span></div>
                                              <div className="flex justify-between"><span className="text-stone-500">Saves</span><span className="text-stone-200 tabular-nums">{formatNumber(c.saves || 0)}</span></div>
                                            </div>
                                            <div className="border-t border-white/10 mt-2 pt-2 space-y-1.5 text-xs">
                                              <div className="flex justify-between"><span className="text-stone-500">Total engagement</span><span className="text-stone-200 tabular-nums">{formatNumber(metrics.engagement)}</span></div>
                                              <div className="flex justify-between"><span className="text-stone-500">Eng. rate</span><span className="text-orange-300 tabular-nums">{c.views > 0 ? ((metrics.engagement / c.views) * 100).toFixed(1) : '0.0'}%</span></div>
                                              <div className="flex justify-between"><span className="text-stone-500">CPV / CPE</span><span className="text-cyan-300 tabular-nums">{formatMicroMoney(metrics.cpv)} / {formatMicroMoney(metrics.cpe)}</span></div>
                                            </div>
                                          </div>
                                        </span>
                                      </div>
                                      <span className="text-xs text-stone-500 mt-0.5 tabular-nums">{formatNumber(c.followers)} foll</span>
                                    </div>
                                  </td>
                                  
                                  <td className="px-5 py-4">
                                    <div className="flex flex-col">
                                      <span className="text-stone-300">{c.content_type}</span>
                                      {c.deliverable_link ? (
                                        <a href={c.deliverable_link.startsWith('http') ? c.deliverable_link : `https://${c.deliverable_link}`} target="_blank" rel="noreferrer" className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 mt-1">
                                          <LinkIcon size={12}/> View Live Post
                                        </a>
                                      ) : (
                                        <span className="text-xs text-stone-600 italic mt-1">No link provided</span>
                                      )}
                                    </div>
                                  </td>

                                  <td className="px-5 py-4 text-stone-400 tabular-nums">{c.planned_go_live_date}</td>
                                  
                                  <td className="px-5 py-4">
                                    <div className="flex flex-col gap-1">
                                      <span className="text-stone-200 font-medium tabular-nums">{formatNumber(c.views || 0)} <span className="text-stone-600 text-xs font-normal">views</span></span>
                                      <span className="text-stone-400 text-xs tabular-nums">{formatNumber(metrics.engagement)} <span className="text-stone-600">engagements</span></span>
                                    </div>
                                  </td>

                                  <td className="px-5 py-4">
                                     <div className="flex flex-col gap-1">
                                      <span className="text-orange-400 font-medium tabular-nums">{formatMicroMoney(metrics.cpv)} <span className="text-stone-600 text-xs font-normal">CPV</span></span>
                                      <span className="text-cyan-400 text-xs font-medium tabular-nums">{formatMicroMoney(metrics.cpe)} <span className="text-stone-600 font-normal">CPE</span></span>
                                    </div>
                                  </td>

                                  <td className="px-5 py-4">
                                    <div className="flex flex-col">
                                      <span className="font-medium text-stone-200 tabular-nums">{formatMoney(c.deal_value)}</span>
                                      <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mt-1">
                                        {c.payment_model.replace('_', ' ')}
                                      </span>
                                    </div>
                                  </td>

                                  <td className="px-5 py-4 text-stone-400 tabular-nums">
                                    {creatorBill ? creatorBill.invoice_date : <span className="text-stone-600 italic">Pending</span>}
                                  </td>
                                  
                                  <td className="px-5 py-4 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                      <button
                                        onClick={() => openComments(c)}
                                        title="Comments"
                                        className={`relative transition-colors ${cCount > 0 ? 'text-orange-400 hover:text-orange-300' : 'text-stone-500 hover:text-orange-400 opacity-100 md:opacity-60 group-hover:opacity-100'}`}
                                      >
                                        <MessageSquare size={16}/>
                                        {cCount > 0 && (
                                          <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center tabular-nums">{cCount}</span>
                                        )}
                                      </button>
                                      {canManageActive && (<>
                                      <span className="w-px h-4 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                                      <button onClick={() => { setEditingCreator(c); setCreatorModalOpen(true); }} className="text-stone-500 hover:text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 size={16}/></button>
                                      <button onClick={(e) => requestDelete(e, 'creator', c.creator_deal_id, c.creator_name)} className="text-stone-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                                      </>)}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  )}
                 </table>
              </div>
              );
              return tableExpanded ? createPortal((
                <div className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-stretch justify-center p-3 sm:p-5 animate-in fade-in duration-200 ${theme === 'light' ? 'theme-light' : ''}`} onClick={() => { setTableExpanded(false); setSearchQuery(''); }}>
                  <div className="bg-[#0c0a08] rounded-2xl border border-white/10 shadow-2xl w-full max-w-[1600px] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.07] shrink-0 flex-wrap">
                      <h3 className="text-base font-semibold text-stone-100 tracking-tight mr-auto truncate">{activeCampaign?.ip_name} · Live Creators</h3>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={15}/>
                        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Filter creators..." className="bg-white/[0.03] border border-white/10 rounded-md pl-9 pr-3 py-2 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-orange-500/70 w-56"/>
                      </div>
                      {canManageActive && (
                        <button onClick={() => handleCampaignSync(activeCampaignId)} disabled={isCampaignSyncing} className="bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] text-stone-300 px-3 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50">
                          <RefreshCw className={isCampaignSyncing ? "animate-spin text-orange-400" : "text-orange-400"} size={15}/>
                          {isCampaignSyncing ? "Syncing..." : "Sync Metrics"}
                        </button>
                      )}
                      <button onClick={() => setExportModal({ isOpen: true, type: 'ops' })} className="bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] text-stone-300 px-3 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors">
                        <Download size={15}/> Export
                      </button>
                      {canManageActive && (
                        <button onClick={() => { setEditingCreator(null); setCreatorModalOpen(true); }} className="bg-orange-500 hover:bg-orange-400 text-white px-3 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors shadow-[0_0_22px_-6px_rgba(249,115,22,0.7)]">
                          <Plus size={15}/> Book Creator
                        </button>
                      )}
                      <button onClick={() => { setTableExpanded(false); setSearchQuery(''); }} title="Close" className="ml-1 h-9 w-9 flex items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-stone-300 hover:text-stone-100 hover:bg-white/[0.06] transition-colors">
                        <X size={18}/>
                      </button>
                    </div>
                    <div className="flex-1 min-h-0 overflow-auto p-4">
                      {tableEl}
                    </div>
                  </div>
                </div>
              ), document.body) : tableEl;
              })()}

              {campaignView === 'talks' && (() => {
                const campLeads = creators.filter(c => c.ip_id === activeCampaignId && c.creator_status === 'lead');
                const header = (
                  <div className="px-5 py-3 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between gap-3">
                    <p className="text-sm text-stone-400 hidden md:block">Talking phase — set a budget + go-live date, assign a POC, then confirm (✓) to move into Live Creators.</p>
                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                      {campLeads.length > 0 && (
                        <button onClick={() => setTalksExpanded(v => !v)} title={talksExpanded ? 'Exit full screen' : 'Expand table'} className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm border border-white/10 text-stone-300 hover:bg-white/[0.06] transition-colors">
                          {talksExpanded ? <Minimize2 size={15}/> : <Maximize2 size={15}/>}
                          <span className="hidden sm:inline">{talksExpanded ? 'Minimize' : 'Expand'}</span>
                        </button>
                      )}
                      {canManageActive && (
                        <button onClick={() => setAddLeadOpen(true)} className="bg-orange-500 hover:bg-orange-400 text-white px-3 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors shadow-[0_0_22px_-6px_rgba(249,115,22,0.7)]">
                          <Plus size={15}/> Add Creator
                        </button>
                      )}
                    </div>
                  </div>
                );
                const body = campLeads.length === 0
                  ? <div className="text-center py-16 text-stone-600 text-sm">No creators in talks for this campaign yet. Add one above or from the Lead Scraper.</div>
                  : inTalksTable(campLeads, canManageActive);

                if (talksExpanded) {
                  return createPortal((
                    <div className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex p-3 sm:p-5 animate-in fade-in duration-200 ${theme === 'light' ? 'theme-light' : ''}`} onClick={() => setTalksExpanded(false)}>
                      <div className="bg-[#0c0a08] border border-white/[0.08] rounded-xl shadow-2xl w-full h-full flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="px-5 py-3.5 border-b border-white/[0.07] flex items-center justify-between gap-3 shrink-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <h3 className="text-sm font-semibold text-stone-100 truncate">{activeCampaign?.ip_name || 'Campaign'} — In-Talks</h3>
                            <span className="text-xs text-stone-500 shrink-0">({campLeads.length})</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {canManageActive && (
                              <button onClick={() => setAddLeadOpen(true)} className="bg-orange-500 hover:bg-orange-400 text-white px-3 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors"><Plus size={15}/> Add Creator</button>
                            )}
                            <button onClick={() => setTalksExpanded(false)} title="Close" className="h-9 w-9 flex items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-stone-300 hover:text-stone-100 hover:bg-white/[0.06] transition-colors"><Minimize2 size={16}/></button>
                          </div>
                        </div>
                        <div className="flex-1 overflow-auto">{body}</div>
                      </div>
                    </div>
                  ), document.body);
                }
                return (
                  <div className="bg-white/[0.025] border border-white/[0.07] rounded-xl overflow-hidden">
                    {header}
                    {body}
                  </div>
                );
              })()}
             </div>
          )}

          {activeTab === 'finance_vs_ops' && (
             <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-stone-100 tracking-tight">Finance vs Ops Mismatch</h2>
                  <p className="text-sm text-stone-500 mt-1 font-light">Resolving the timing gap between campaign execution and cash flow for {targetMonth}.</p>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setExportModal({ isOpen: true, type: 'finance' })}
                    className="bg-orange-500/15 text-orange-300 hover:bg-orange-500/25 border border-orange-500/30 px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
                  >
                    <Download size={16}/> Export Financials
                  </button>
                  {computations.variance !== 0 && (
                    <div className="bg-orange-500/10 border border-orange-500/25 text-orange-300 px-4 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium shadow-[0_0_24px_-8px_rgba(249,115,22,0.5)] backdrop-blur-sm">
                      <AlertCircle className="text-orange-400" size={16}/>
                      Variance Detected: <span className="tabular-nums">{formatMoney(Math.abs(computations.variance))}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                
                <div className="bg-white/[0.025] border border-white/[0.07] rounded-xl overflow-hidden backdrop-blur-sm flex flex-col relative group">
                  <div className="p-5 border-b border-white/[0.06] flex justify-between items-center bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-stone-500"></div>
                      <h3 className="font-medium text-stone-200">Ops Budget ({targetMonth})</h3>
                    </div>
                    <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-stone-500 border border-white/10 px-2 py-1 rounded bg-black/40">Counted by Go-Live</span>
                  </div>
                  <div className="p-6">
                    <p className="text-4xl font-normal tracking-tight text-stone-100 mb-5 tabular-nums">{formatMoney(computations.opsTotal)}</p>
                    
                    {Object.keys(computations.opsBreakdown).length > 0 ? (
                      <div className="space-y-2 border-t border-white/[0.06] pt-4">
                        <p className="text-[10px] text-stone-500 uppercase tracking-[0.2em] font-semibold mb-3">IP Breakdown</p>
                        {Object.entries(computations.opsBreakdown).map(([campName, amount]) => (
                          <div key={campName} className="flex justify-between items-center text-sm">
                            <span className="text-stone-400 truncate pr-4">{campName}</span>
                            <span className="text-stone-200 font-medium tabular-nums">{formatMoney(amount)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                       <div className="border-t border-white/[0.06] pt-4">
                          <p className="text-sm text-stone-600 italic">No go-lives scheduled for {targetMonth}</p>
                       </div>
                    )}
                  </div>
                </div>

                <div className="bg-white/[0.025] border border-orange-500/20 rounded-xl overflow-hidden backdrop-blur-sm flex flex-col relative group shadow-[0_0_30px_-14px_rgba(249,115,22,0.5)]">
                  <div className="p-5 border-b border-white/[0.06] flex justify-between items-center bg-orange-500/[0.04]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_2px_rgba(249,115,22,0.7)]"></div>
                      <h3 className="font-medium text-stone-200">Finance Expense ({targetMonth})</h3>
                    </div>
                    <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-orange-400 border border-orange-500/30 px-2 py-1 rounded bg-orange-500/10">Counted by Bill Date</span>
                  </div>
                  <div className="p-6">
                    <p className="text-4xl font-normal tracking-tight text-stone-100 mb-5 tabular-nums [text-shadow:0_0_30px_rgba(249,115,22,0.3)]">{formatMoney(computations.financeTotal)}</p>
                    
                    {Object.keys(computations.financeBreakdown).length > 0 ? (
                      <div className="space-y-2 border-t border-white/[0.06] pt-4">
                        <p className="text-[10px] text-stone-500 uppercase tracking-[0.2em] font-semibold mb-3">IP Breakdown</p>
                        {Object.entries(computations.financeBreakdown).map(([campName, amount]) => (
                          <div key={campName} className="flex justify-between items-center text-sm">
                            <span className="text-stone-400 truncate pr-4">{campName}</span>
                            <span className="text-stone-200 font-medium tabular-nums">{formatMoney(amount)}</span>
                          </div>
                        ))}
                      </div>
                     ) : (
                       <div className="border-t border-white/[0.06] pt-4">
                          <p className="text-sm text-stone-600 italic">No invoices billed in {targetMonth}</p>
                       </div>
                    )}
                  </div>
                </div>

              </div>

              <div className="bg-[#0c0a08] rounded-xl border border-white/[0.07] overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-white/[0.07] bg-white/[0.02]">
                  <h3 className="font-medium text-stone-200">System Mismatch Intelligence</h3>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/[0.015] text-stone-500 border-b border-white/[0.06]">
                    <tr>
                      <th className="px-6 py-4 font-medium text-[10px] uppercase tracking-[0.2em]">Creator Booking</th>
                      <th className="px-6 py-4 font-medium text-[10px] uppercase tracking-[0.2em]">Mismatch Reason</th>
                      <th className="px-6 py-4 font-medium text-[10px] uppercase tracking-[0.2em] text-right">Impact for {targetMonth}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {computations.mismatchReasons.length > 0 ? computations.mismatchReasons.map((mr, i) => (
                      <tr key={i} className="hover:bg-white/[0.025] transition-colors">
                        <td className="px-6 py-4 font-medium text-stone-200">{mr.creator}</td>
                        <td className="px-6 py-4 text-stone-400">{mr.reason}</td>
                        <td className="px-6 py-4 text-right font-medium text-orange-400 tabular-nums">{mr.impact}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="3" className="px-6 py-12 text-center text-stone-600 font-light">Data is aligned. No timing gaps detected.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="max-w-[1400px] mx-auto mb-5 flex items-center justify-between gap-4 animate-in fade-in duration-300">
              <h2 className="text-2xl font-semibold text-stone-100 tracking-tight">Reports &amp; Analytics</h2>
              <div className="inline-flex items-center rounded-lg border border-white/10 overflow-hidden bg-white/[0.025] shrink-0">
                <button onClick={() => setReportsView('reports')} className={`px-5 py-2.5 text-sm font-medium transition-colors ${reportsView === 'reports' ? 'bg-orange-500/20 text-orange-300' : 'text-stone-400 hover:text-stone-200'}`}>Reports</button>
                <button onClick={() => setReportsView('analytics')} className={`px-5 py-2.5 text-sm font-medium transition-colors border-l border-white/10 ${reportsView === 'analytics' ? 'bg-orange-500/20 text-orange-300' : 'text-stone-400 hover:text-stone-200'}`}>Analytics</button>
              </div>
            </div>
          )}

          {activeTab === 'reports' && reportsView === 'analytics' && (
            <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-stone-100 tracking-tight">Analytics Overview</h2>
                  <p className="text-sm text-stone-500 mt-1">A visual snapshot across all campaigns and creators.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select value={analyticsCampaign} onChange={(e) => setAnalyticsCampaign(e.target.value)} className="bg-white/[0.03] border border-white/10 rounded-md px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70">
                    <option value="all" className="bg-[#0c0a08]">All campaigns</option>
                    {campaigns.map(c => <option key={c.ip_id} value={c.ip_id} className="bg-[#0c0a08]">{c.ip_name}</option>)}
                  </select>
                  <select value={analyticsPlatform} onChange={(e) => setAnalyticsPlatform(e.target.value)} className="bg-white/[0.03] border border-white/10 rounded-md px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70">
                    <option value="all" className="bg-[#0c0a08]">All platforms</option>
                    {allPlatforms.map(p => <option key={p} value={p} className="bg-[#0c0a08]">{p}</option>)}
                  </select>
                  <select value={analyticsMonth} onChange={(e) => setAnalyticsMonth(e.target.value)} className="bg-white/[0.03] border border-white/10 rounded-md px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70">
                    <option value="all" className="bg-[#0c0a08]">All months</option>
                    {ALL_MONTHS.map(m => <option key={m} value={m} className="bg-[#0c0a08]">{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard label="Total Spend" value={formatMoney(analytics.totalSpend)} dot={CHART_PALETTE[0]} />
                <StatCard label="Total Views" value={formatNumber(analytics.totalViews)} dot={CHART_PALETTE[1]} />
                <StatCard label="Engagement" value={formatNumber(analytics.totalEng)} dot={CHART_PALETTE[4]} />
                <StatCard label="Creators" value={formatNumber(analytics.creatorCount)} sub={`${analytics.campaignCount} campaign${analytics.campaignCount === 1 ? '' : 's'}`} dot={CHART_PALETTE[3]} />
                <StatCard label="Avg CPV" value={formatMicroMoney(analytics.avgCpv)} dot={CHART_PALETTE[2]} />
                <StatCard label="Eng. Rate" value={`${analytics.engRate.toFixed(1)}%`} sub={`${formatNumber(analytics.totalFollowers)} reach`} dot={CHART_PALETTE[5]} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartPanel title="Spend by Campaign">
                  <VBarChart data={analytics.spendByCampaign} color={CHART_PALETTE[0]} format={formatMoney} />
                </ChartPanel>
                <ChartPanel title="Views by Campaign">
                  <VBarChart data={analytics.viewsByCampaign} color={CHART_PALETTE[1]} format={formatNumber} />
                </ChartPanel>

                <ChartPanel title="Spend by Platform">
                  <DonutChart data={analytics.spendByPlatform} />
                </ChartPanel>
                <ChartPanel title="Creators by Platform">
                  <DonutChart data={analytics.creatorsByPlatform} />
                </ChartPanel>

                <ChartPanel title="Engagement Mix">
                  <DonutChart data={analytics.engMix} />
                </ChartPanel>
                <ChartPanel title="Payment Model Split">
                  <DonutChart data={analytics.paymentSplit} />
                </ChartPanel>

                <ChartPanel title="Content Type Distribution">
                  <HBarChart data={analytics.contentDist} color={CHART_PALETTE[2]} format={formatNumber} />
                </ChartPanel>
                <ChartPanel title="Top Creators by Views">
                  <HBarChart data={analytics.topCreators} color={CHART_PALETTE[1]} format={formatNumber} />
                </ChartPanel>

                <ChartPanel title="Spend Trend by Go-Live Month" className="lg:col-span-2">
                  <TrendChart data={analytics.spendTrend} color={CHART_PALETTE[0]} />
                </ChartPanel>
                <ChartPanel title="Views Trend by Go-Live Month" className="lg:col-span-2">
                  <TrendChart data={analytics.viewsTrend} color={CHART_PALETTE[1]} />
                </ChartPanel>
              </div>
            </div>
          )}

          {activeTab === 'reports' && reportsView === 'reports' && (
            <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-stone-100 tracking-tight">Campaign Report</h2>
                  <p className="text-sm text-stone-500 mt-1">{reportScope().camp} · {reportScope().range} · {report.count} creators</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setReportExport({ open: true, format: 'csv' })} className="bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] text-stone-200 px-3.5 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors">
                    <Download size={15}/> CSV
                  </button>
                  <button onClick={() => setReportExport({ open: true, format: 'pdf' })} className="bg-orange-500 hover:bg-orange-400 text-white px-3.5 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors shadow-[0_0_22px_-6px_rgba(249,115,22,0.7)]">
                    <Download size={15}/> PDF
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 bg-white/[0.025] border border-white/[0.07] rounded-xl p-3">
                <select value={reportCampaign} onChange={(e) => setReportCampaign(e.target.value)} className="bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70">
                  <option value="all" className="bg-[#0c0a08]">All campaigns</option>
                  {campaigns.map(c => <option key={c.ip_id} value={c.ip_id} className="bg-[#0c0a08]">{c.ip_name}</option>)}
                </select>
                <div className="flex items-center rounded-md border border-white/10 overflow-hidden">
                  <button onClick={() => setReportDateMode('month')} className={`px-3 py-2 text-sm transition-colors ${reportDateMode === 'month' ? 'bg-orange-500/20 text-orange-300' : 'text-stone-400 hover:text-stone-200'}`}>Month</button>
                  <button onClick={() => setReportDateMode('custom')} className={`px-3 py-2 text-sm transition-colors ${reportDateMode === 'custom' ? 'bg-orange-500/20 text-orange-300' : 'text-stone-400 hover:text-stone-200'}`}>Custom</button>
                </div>
                {reportDateMode === 'month' ? (
                  <select value={reportMonth} onChange={(e) => setReportMonth(e.target.value)} className="bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70">
                    <option value="all" className="bg-[#0c0a08]">All months</option>
                    {ALL_MONTHS.map(m => <option key={m} value={m} className="bg-[#0c0a08]">{m}</option>)}
                  </select>
                ) : (
                  <>
                    <input type="date" value={reportStart} onChange={(e) => setReportStart(e.target.value)} className="bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70 [color-scheme:dark]" />
                    <span className="text-stone-500 text-sm">to</span>
                    <input type="date" value={reportEnd} onChange={(e) => setReportEnd(e.target.value)} className="bg-black/30 border border-white/10 rounded-md px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70 [color-scheme:dark]" />
                  </>
                )}
              </div>

              {/* Statistics Overview */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-medium mb-3">Statistics Overview</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <StatCard label="Views" value={formatNumber(report.views)} dot={CHART_PALETTE[1]} />
                  <StatCard label="Likes" value={formatNumber(report.likes)} dot={CHART_PALETTE[0]} />
                  <StatCard label="Comments" value={formatNumber(report.comments)} dot={CHART_PALETTE[3]} />
                  <StatCard label="E.R. (Avg)" value={`${report.erAvg.toFixed(3)}%`} dot={CHART_PALETTE[4]} />
                  <StatCard label="E.R. (Video)" value={report.erVideo == null ? '—' : `${report.erVideo.toFixed(3)}%`} dot={CHART_PALETTE[5]} />
                  <StatCard label="E.R. (Static)" value={report.erStatic == null ? '—' : `${report.erStatic.toFixed(3)}%`} dot={CHART_PALETTE[6]} />
                  <StatCard label="CPE" value={formatMicroMoney(report.cpe)} dot={CHART_PALETTE[2]} />
                  <StatCard label="CPV" value={formatMicroMoney(report.cpv)} dot={CHART_PALETTE[7]} />
                  <StatCard label="Shares" value={formatNumber(report.shares)} dot={CHART_PALETTE[8]} />
                  <StatCard label="Total Spend" value={formatMoney(report.spend)} dot={CHART_PALETTE[0]} />
                </div>
              </div>

              {/* Stats Graphs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/[0.025] border border-white/[0.07] rounded-xl p-5 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-medium">Views</p>
                    <div className="flex items-center rounded-md border border-white/10 overflow-hidden text-xs">
                      <button onClick={() => setViewsMode('cumulative')} className={`px-2.5 py-1 ${viewsMode === 'cumulative' ? 'bg-orange-500/20 text-orange-300' : 'text-stone-400'}`}>Cumulative</button>
                      <button onClick={() => setViewsMode('daily')} className={`px-2.5 py-1 ${viewsMode === 'daily' ? 'bg-orange-500/20 text-orange-300' : 'text-stone-400'}`}>Daily</button>
                    </div>
                  </div>
                  <MultiSeriesChart dates={report.dateSet} series={report.viewsSeries} mode={viewsMode} format={formatNumber} />
                </div>
                <div className="bg-white/[0.025] border border-white/[0.07] rounded-xl p-5 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-medium">Likes</p>
                    <div className="flex items-center rounded-md border border-white/10 overflow-hidden text-xs">
                      <button onClick={() => setLikesMode('cumulative')} className={`px-2.5 py-1 ${likesMode === 'cumulative' ? 'bg-orange-500/20 text-orange-300' : 'text-stone-400'}`}>Cumulative</button>
                      <button onClick={() => setLikesMode('daily')} className={`px-2.5 py-1 ${likesMode === 'daily' ? 'bg-orange-500/20 text-orange-300' : 'text-stone-400'}`}>Daily</button>
                    </div>
                  </div>
                  <MultiSeriesChart dates={report.dateSet} series={report.likesSeries} mode={likesMode} format={formatNumber} />
                </div>
                <div className="bg-white/[0.025] border border-white/[0.07] rounded-xl p-5 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-medium">Comments</p>
                    <div className="flex items-center rounded-md border border-white/10 overflow-hidden text-xs">
                      <button onClick={() => setCommentsMode('cumulative')} className={`px-2.5 py-1 ${commentsMode === 'cumulative' ? 'bg-orange-500/20 text-orange-300' : 'text-stone-400'}`}>Cumulative</button>
                      <button onClick={() => setCommentsMode('daily')} className={`px-2.5 py-1 ${commentsMode === 'daily' ? 'bg-orange-500/20 text-orange-300' : 'text-stone-400'}`}>Daily</button>
                    </div>
                  </div>
                  <MultiSeriesChart dates={report.dateSet} series={report.commentsSeries} mode={commentsMode} format={formatNumber} />
                </div>
                <div className="bg-white/[0.025] border border-white/[0.07] rounded-xl p-5 backdrop-blur-sm">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-medium mb-4">Spend by Platform</p>
                  <DonutChart data={report.platforms.map((p, i) => ({ label: p, value: report.rows.filter(c => c.platform === p).reduce((s, c) => s + (Number(c.deal_value) || 0), 0), color: getPlatformColor(p) }))} />
                </div>
              </div>

              {/* Timeline Frequency */}
              <div className="bg-white/[0.025] border border-white/[0.07] rounded-xl p-5 backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-medium mb-4">Campaign Timeline Frequency</p>
                <StackedBarTimeline items={report.timeline} onSelectDay={(it) => setTimelineDay(it)} />
              </div>
            </div>
          )}

          {activeTab === 'scraper' && (
            <div className="max-w-[1100px] mx-auto space-y-6 animate-in fade-in duration-500">
              <div>
                <h2 className="text-2xl font-semibold text-stone-100 tracking-tight">Lead Scraper</h2>
                <p className="text-sm text-stone-500 mt-1">Search a creator by Instagram link or name to pull their stats, then send them to a campaign.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="flex items-center rounded-md border border-white/10 overflow-hidden text-sm shrink-0">
                  <button onClick={() => setScrapePlatform('instagram')} className={`px-3 py-2.5 transition-colors ${scrapePlatform === 'instagram' ? 'bg-orange-500/20 text-orange-300' : 'text-stone-400 hover:text-stone-200'}`}>Instagram</button>
                  <button onClick={() => setScrapePlatform('youtube')} className={`px-3 py-2.5 transition-colors border-l border-white/10 ${scrapePlatform === 'youtube' ? 'bg-orange-500/20 text-orange-300' : 'text-stone-400 hover:text-stone-200'}`}>YouTube</button>
                </div>
                <div className="flex-1 relative min-w-[220px]">
                  <ScanSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500"/>
                  <input
                    value={scrapeQuery}
                    onChange={(e) => setScrapeQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleScrape(); }}
                    placeholder={scrapePlatform === 'youtube' ? 'youtube.com/@channel  ·  video link  ·  or a name' : 'instagram.com/username  ·  or a creator name'}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-md pl-9 pr-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70"
                  />
                </div>
                <button onClick={handleScrape} disabled={scrapeLoading} className="bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white px-5 py-2.5 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors shadow-[0_0_22px_-6px_rgba(249,115,22,0.7)]">
                  {scrapeLoading ? <Loader2 size={16} className="animate-spin"/> : <ScanSearch size={16}/>} {scrapeLoading ? 'Scraping…' : 'Search'}
                </button>
              </div>

              {scrapeNote && (
                <div className="flex items-start gap-2 text-sm text-orange-200 bg-orange-500/[0.07] border border-orange-500/25 px-4 py-2.5 rounded-lg">
                  <Info size={16} className="mt-0.5 shrink-0"/> <span>{scrapeNote}</span>
                </div>
              )}

              {scrapeResults.length === 0 && !scrapeLoading && !scrapeNote && (
                <div className="text-center py-20 text-stone-600">
                  <ScanSearch size={40} className="mx-auto mb-4 opacity-40"/>
                  <p className="text-sm">Search a creator to see their scraped profile card.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {scrapeResults.map((r, idx) => {
                  const eng = (r.avgLikes || 0) + (r.avgComments || 0);
                  const fee = Number(r.fee) || 0;
                  const cpv = fee > 0 && r.avgViews > 0 ? fee / r.avgViews : null;
                  const cpe = fee > 0 && eng > 0 ? fee / eng : null;
                  return (
                    <div key={idx} className="bg-white/[0.025] border border-white/[0.07] rounded-xl p-5 backdrop-blur-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-xl font-bold text-white shrink-0">
                          {(r.fullName || r.username || '?').trim().charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-stone-100 truncate">{r.fullName || r.username}</h3>
                            {r.isVerified && <BadgeCheck size={15} className="text-orange-400 shrink-0"/>}
                          </div>
                          <a href={r.profileUrl} target="_blank" rel="noreferrer" className="text-sm text-orange-300/90 hover:text-orange-200 truncate block">@{r.username}</a>
                          {r.category && <span className="inline-block mt-1 mr-1.5 text-[10px] uppercase tracking-[0.15em] px-1.5 py-0.5 rounded border border-white/10 text-stone-400">{r.category}</span>}
                          <span className="inline-block mt-1 text-[10px] uppercase tracking-[0.15em] px-1.5 py-0.5 rounded border border-white/10 text-stone-400">{r.platform || 'Instagram'}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-4">
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-2 text-center"><p className="text-[10px] uppercase tracking-wide text-stone-500">Followers</p><p className="text-sm font-semibold text-stone-200 tabular-nums mt-0.5">{formatNumber(r.followers || 0)}</p></div>
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-2 text-center"><p className="text-[10px] uppercase tracking-wide text-stone-500">Avg Views</p><p className="text-sm font-semibold text-stone-200 tabular-nums mt-0.5">{formatNumber(r.avgViews || 0)}</p></div>
                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-2 text-center"><p className="text-[10px] uppercase tracking-wide text-stone-500">Eng. Rate</p><p className="text-sm font-semibold text-orange-300 tabular-nums mt-0.5">{(r.engagementRate || 0).toFixed(2)}%</p></div>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex-1 relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500 text-sm">₹</span>
                          <input
                            type="number" value={r.fee}
                            onChange={(e) => setScrapeResults(scrapeResults.map((x, i) => i === idx ? { ...x, fee: e.target.value } : x))}
                            placeholder="Expected fee"
                            className="w-full bg-black/40 border border-white/10 rounded-md pl-6 pr-2 py-1.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70"
                          />
                        </div>
                        <div className="text-xs text-stone-400 tabular-nums whitespace-nowrap">CPV {cpv == null ? '—' : formatMicroMoney(cpv)} · CPE {cpe == null ? '—' : formatMicroMoney(cpe)}</div>
                      </div>

                      <div className="mt-4 relative">
                        <button onClick={() => { setLeadPickerFor(leadPickerFor === idx ? null : idx); setLeadAssignCampaign(''); setLeadAssignPoc(''); }} className="w-full flex items-center justify-center gap-2 bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-300 text-sm font-medium py-2 rounded-md transition-colors">
                          <UserPlus size={15}/> Add to a campaign's talks
                        </button>
                        {leadPickerFor === idx && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-[#0c0a08] border border-white/10 rounded-lg shadow-2xl z-20 p-3 space-y-2.5">
                            {campaigns.length === 0 ? (
                              <p className="text-xs text-stone-500 p-1">No campaigns yet — create one first.</p>
                            ) : (
                              <>
                                <div>
                                  <label className="block text-[10px] uppercase tracking-[0.15em] text-stone-500 mb-1">Campaign</label>
                                  <select value={leadAssignCampaign} onChange={(e) => setLeadAssignCampaign(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-md px-2 py-1.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70">
                                    <option value="" className="bg-[#0c0a08]">Select campaign…</option>
                                    {campaigns.map(c => <option key={c.ip_id} value={c.ip_id} className="bg-[#0c0a08]">{c.ip_name}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] uppercase tracking-[0.15em] text-stone-500 mb-1">POC <span className="normal-case tracking-normal text-stone-600">(who's talking to them)</span></label>
                                  <input list="poc-options" value={leadAssignPoc} onChange={(e) => setLeadAssignPoc(e.target.value)} placeholder="Search team by name…" className="w-full bg-black/40 border border-white/10 rounded-md px-2 py-1.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70" />
                                </div>
                                <button onClick={() => addLeadToCampaign(r, leadAssignCampaign, leadAssignPoc)} disabled={!leadAssignCampaign} className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white text-sm font-semibold py-1.5 rounded-md transition-colors">
                                  Send to In-Talks
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          {activeTab === 'payments' && (
            <div className="h-full flex items-center justify-center animate-in fade-in duration-500">
              <div className="text-center max-w-md px-6">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center bg-orange-500/10 border border-orange-500/20 text-orange-400 shadow-[0_0_30px_-8px_rgba(249,115,22,0.6)]">
                  <CreditCard size={28}/>
                </div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-orange-400/80 font-semibold mb-2">Coming soon</p>
                <h2 className="text-2xl font-semibold text-stone-100 tracking-tight capitalize">Payments</h2>
                <p className="text-sm text-stone-500 mt-3 leading-relaxed">
                  We're still building this out. Payment tracking and payout schedules will land here soon.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ============ MESSAGES ============ */}
      {messagesOpen && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setMessagesOpen(false)}>
          <div className="bg-[#0c0a08] border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl h-[82vh] flex overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* conversation list */}
            <div className="w-72 border-r border-white/[0.07] flex flex-col shrink-0">
              <div className="px-4 py-3.5 border-b border-white/[0.07] flex items-center justify-between">
                <h3 className="font-semibold text-stone-100 tracking-tight flex items-center gap-2"><MessageSquare size={16} className="text-orange-400"/> Messages</h3>
              </div>
              <div className="p-3 border-b border-white/[0.07]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={14}/>
                  <input value={msgSearch} onChange={(e) => setMsgSearch(e.target.value)} placeholder="Search people to message..." className="w-full bg-white/[0.03] border border-white/10 rounded-md pl-9 pr-3 py-2 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-orange-500/70"/>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {msgSearch.trim() ? (
                  <div className="py-1">
                    <p className="px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-stone-500 font-semibold">People</p>
                    {peopleResults.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-stone-500">No people found.</p>
                    ) : peopleResults.map(p => (
                      <button key={p.email} onClick={() => startDm(p.email)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors text-left">
                        <AvatarBadge {...avatarPropsForEmail(p.email)} size={32}/>
                        <div className="min-w-0">
                          <p className="text-sm text-stone-200 truncate">{p.display_name}</p>
                          {p.title && <p className="text-xs text-stone-500 truncate">{p.title}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-1">
                    {/* pinned team channel */}
                    <button onClick={() => openChannel('group:all')} className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left border-l-2 ${msgChannel === 'group:all' ? 'bg-orange-500/10 border-orange-500' : 'border-transparent hover:bg-white/[0.04]'}`}>
                      <div className="w-9 h-9 rounded-lg bg-orange-500/15 flex items-center justify-center text-orange-400 shrink-0"><Hash size={16}/></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5"><span className="text-sm font-medium text-stone-200">Team Channel</span><Pin size={11} className="text-stone-500"/></div>
                        <p className="text-xs text-stone-500 truncate">Everyone can post here</p>
                      </div>
                      {msgUnread('group:all') > 0 && <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{msgUnread('group:all')}</span>}
                    </button>
                    <p className="px-4 pt-3 pb-1.5 text-[10px] uppercase tracking-[0.2em] text-stone-500 font-semibold">Direct Messages</p>
                    {dmThreads.length === 0 ? (
                      <p className="px-4 py-2 text-xs text-stone-500">Search a person above to start a chat.</p>
                    ) : dmThreads.map(t => (
                      <button key={t.ch} onClick={() => openChannel(t.ch)} className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left border-l-2 ${msgChannel === t.ch ? 'bg-orange-500/10 border-orange-500' : 'border-transparent hover:bg-white/[0.04]'}`}>
                        <AvatarBadge {...avatarPropsForEmail(otherEmail(t.ch))} size={36}/>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-200 truncate">{t.name}</p>
                          <p className="text-xs text-stone-500 truncate">{t.last}</p>
                        </div>
                        {t.unread > 0 && <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{t.unread}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* chat pane */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="px-5 py-3.5 border-b border-white/[0.07] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {msgChannel === 'group:all'
                    ? <><div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center text-orange-400 shrink-0"><Hash size={15}/></div><div className="min-w-0"><p className="text-sm font-semibold text-stone-100 truncate">Team Channel</p><p className="text-[11px] text-stone-500">Pinned · visible to everyone</p></div></>
                    : <><button onClick={() => setViewProfileEmail(otherEmail(msgChannel))} className="flex items-center gap-2.5 min-w-0 group/hdr text-left" title="View profile"><AvatarBadge {...avatarPropsForEmail(otherEmail(msgChannel))} size={32}/><div className="min-w-0"><p className="text-sm font-semibold text-stone-100 truncate group-hover/hdr:text-orange-300 transition-colors">{nameForEmail(otherEmail(msgChannel))}</p><p className="text-[11px] text-stone-500">View profile</p></div></button></>}
                </div>
                <button onClick={() => setMessagesOpen(false)} title="Close" className="h-8 w-8 flex items-center justify-center rounded-md text-stone-400 hover:text-stone-100 hover:bg-white/[0.06] transition-colors shrink-0"><X size={18}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {channelMsgs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-stone-500 gap-2">
                    <MessageSquare size={28} className="opacity-40"/>
                    <p className="text-sm">No messages yet. Say hello 👋</p>
                  </div>
                ) : channelMsgs.map(m => {
                  const mine = (m.sender_email || '').toLowerCase() === myEmail;
                  const canEdit = mine && !String(m.id).startsWith('tmp-') && (Date.now() - new Date(m.created_at).getTime() < 15 * 60 * 1000);
                  const editing = editingMsgId === m.id;
                  return (
                    <div key={m.id} className={`flex flex-col group/msg ${mine ? 'items-end' : 'items-start'}`}>
                      {!mine && msgChannel === 'group:all' && <span className="text-[11px] text-stone-500 mb-0.5 ml-9">{m.sender_name || nameForEmail(m.sender_email)}</span>}
                      {editing ? (
                        <div className="w-[82%] flex items-center gap-1.5">
                          <input value={editMsgText} onChange={(e) => setEditMsgText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveEditMessage(m); } if (e.key === 'Escape') setEditingMsgId(null); }} autoFocus className="flex-1 bg-white/[0.04] border border-orange-500/60 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none"/>
                          <button onClick={() => saveEditMessage(m)} title="Save" className="text-orange-400 hover:text-orange-300 p-1"><Check size={16}/></button>
                          <button onClick={() => setEditingMsgId(null)} title="Cancel" className="text-stone-500 hover:text-stone-300 p-1"><X size={16}/></button>
                        </div>
                      ) : (
                        <div className={`flex items-end gap-2 max-w-[85%] ${mine ? 'flex-row-reverse' : ''}`}>
                          {!mine && <button onClick={() => setViewProfileEmail(m.sender_email)} title="View profile" className="shrink-0 mb-0.5 hover:opacity-80 transition-opacity"><AvatarBadge {...avatarPropsForEmail(m.sender_email)} size={28}/></button>}
                          <div className={`min-w-0 px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${mine ? 'bg-orange-500 text-white rounded-br-sm' : 'bg-white/[0.06] text-stone-200 rounded-bl-sm'}`}>{m.body}</div>
                          {mine && (
                            <div className="flex items-center gap-0.5 opacity-0 group-hover/msg:opacity-100 transition-opacity shrink-0">
                              {canEdit && <button onClick={() => { setEditingMsgId(m.id); setEditMsgText(m.body); }} title="Edit (within 15 min)" className="text-stone-500 hover:text-stone-300 p-1"><Edit2 size={13}/></button>}
                              <button onClick={() => deleteMessage(m)} title="Delete" className="text-stone-500 hover:text-red-400 p-1"><Trash2 size={13}/></button>
                            </div>
                          )}
                        </div>
                      )}
                      <span className="text-[10px] text-stone-600 mt-0.5 mx-1">{new Date(m.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}{m.edited ? ' · edited' : ''}</span>
                    </div>
                  );
                })}
                <div ref={msgEndRef}></div>
              </div>

              <div className="p-3 border-t border-white/[0.07] flex items-center gap-2">
                <input
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={msgChannel === 'group:all' ? 'Message the team...' : 'Type a message...'}
                  className="flex-1 bg-white/[0.03] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-orange-500/70"
                />
                <button onClick={sendMessage} disabled={!msgText.trim()} className="bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white p-2.5 rounded-lg transition-colors shadow-[0_0_22px_-6px_rgba(249,115,22,0.7)]">
                  <Send size={16}/>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ ORBITAL SCENE (logo easter egg) ============ */}
      {orbitOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setOrbitOpen(false)}>
          <div className={`absolute inset-0 backdrop-blur-md ${theme === 'light' ? 'bg-orange-50/70' : 'bg-black/80'}`}></div>
          <div className={`relative w-full max-w-lg h-[80vh] rounded-3xl overflow-hidden border shadow-2xl ${theme === 'light' ? 'border-orange-200/80 bg-gradient-to-b from-[#fff7ed] to-[#ffedd5]' : 'border-white/10 bg-[#0a0807]'}`} onClick={(e) => e.stopPropagation()}>
            <OrbitalScene className="absolute inset-0 w-full h-full" light={theme === 'light'} />
            <div className="absolute top-0 inset-x-0 p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-orange-400"/>
                <span className={`text-sm font-semibold tracking-tight ${theme === 'light' ? 'text-orange-900' : 'text-stone-100'}`}>YAAS · in orbit</span>
              </div>
              <button onClick={() => setOrbitOpen(false)} title="Close" className={`h-9 w-9 flex items-center justify-center rounded-full backdrop-blur-sm transition-colors ${theme === 'light' ? 'bg-white/70 text-orange-700 hover:bg-white' : 'bg-white/10 text-stone-200 hover:bg-white/20'}`}><X size={18}/></button>
            </div>
            <div className="absolute bottom-0 inset-x-0 p-6 text-center pointer-events-none">
              {!logoError && <img src={LOGO_URL} alt="YAAS" className="app-logo h-9 w-auto max-w-[150px] object-contain mx-auto mb-3 opacity-90"/>}
              <p className={`text-xs ${theme === 'light' ? 'text-orange-800/70' : 'text-stone-500'}`}>Every creator, campaign, and rupee — orbiting one system.</p>
            </div>
          </div>
        </div>
      )}

      {/* ============ PROFILE VIEW ============ */}
      {viewProfileEmail && (() => {
        const vp = profileForEmail(viewProfileEmail);
        const isMe = (viewProfileEmail || '').toLowerCase() === myEmail;
        const ints = Array.isArray(vp?.interests) ? vp.interests : [];
        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setViewProfileEmail(null)}>
            <div className="bg-[#0c0a08] border border-white/[0.08] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="h-20 bg-gradient-to-br from-orange-500/30 to-amber-600/10 relative">
                <button onClick={() => setViewProfileEmail(null)} title="Close" className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center rounded-full bg-black/30 text-stone-200 hover:bg-black/50 transition-colors"><X size={16}/></button>
              </div>
              <div className="px-6 pb-6 -mt-10">
                <AvatarBadge index={vp?.avatar_index ?? 0} photo={vp?.avatar_photo || null} size={80} ring />
                <h3 className="text-lg font-semibold text-stone-100 mt-3">{vp?.display_name || viewProfileEmail}</h3>
                {vp?.title && <p className="text-sm text-orange-300">{vp.title}</p>}
                <p className="text-xs text-stone-500 mt-0.5 break-all">{vp?.email || viewProfileEmail}</p>
                {vp?.bio && <p className="text-sm text-stone-300 mt-4 leading-relaxed whitespace-pre-wrap">{vp.bio}</p>}
                {ints.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2 font-medium">Interests</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ints.map((it, i) => <span key={i} className="px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/25 text-orange-200 text-xs">{it}</span>)}
                    </div>
                  </div>
                )}
                {!vp && <p className="text-sm text-stone-500 mt-4">This person hasn't set up a profile yet.</p>}
                {!isMe ? (
                  <button onClick={() => { setViewProfileEmail(null); setMessagesOpen(true); startDm(viewProfileEmail); }} className="mt-6 w-full bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_22px_-6px_rgba(249,115,22,0.7)]"><MessageSquare size={15}/> Message</button>
                ) : (
                  <button onClick={() => { setViewProfileEmail(null); setProfileEditorOpen(true); }} className="mt-6 w-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-stone-200 text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"><Edit2 size={15}/> Edit profile</button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ============ ADD IN-TALKS CREATOR ============ */}
      {addLeadOpen && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setAddLeadOpen(false)}>
          <form onSubmit={handleAddLead} className="bg-[#0c0a08] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold text-stone-100 tracking-tight">Add In-Talks Creator</h3>
              <button type="button" onClick={() => setAddLeadOpen(false)} className="text-stone-500 hover:text-stone-300"><X size={18}/></button>
            </div>
            <p className="text-sm text-stone-500 mb-5">Add a creator you're in talks with. Confirm them later (✓) to move into Live Creators.</p>
            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] uppercase tracking-[0.15em] text-stone-500 font-semibold mb-1.5">Creator name</label>
                <input name="creator_name" autoFocus required placeholder="e.g. Pari Dua" className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-orange-500/70"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.15em] text-stone-500 font-semibold mb-1.5">Platform</label>
                  <select name="platform" defaultValue="Instagram" className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-orange-500/70">
                    <option>Instagram</option><option>YouTube</option><option>TikTok</option><option>LinkedIn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.15em] text-stone-500 font-semibold mb-1.5">Content type</label>
                  <input name="content_type" list="content-type-options" placeholder="Reel Collab" className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-orange-500/70"/>
                  <datalist id="content-type-options">
                    <option value="Reel Collab"/><option value="Static Post"/><option value="Story"/><option value="YouTube Integration"/><option value="YouTube Short"/><option value="Dedicated Video"/><option value="Carousel"/>
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[0.15em] text-stone-500 font-semibold mb-1.5">Profile link</label>
                <input name="profile_link" placeholder="instagram.com/username" className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-orange-500/70"/>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.15em] text-stone-500 font-semibold mb-1.5">Followers</label>
                  <input name="followers" type="number" min="0" placeholder="0" className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-orange-500/70"/>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.15em] text-stone-500 font-semibold mb-1.5">Est. fee (₹)</label>
                  <input name="deal_value" type="number" min="0" placeholder="0" className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-orange-500/70"/>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.15em] text-stone-500 font-semibold mb-1.5">POC</label>
                  <input name="poc" list="poc-options" placeholder="Owner" className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-orange-500/70"/>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button type="button" onClick={() => setAddLeadOpen(false)} className="px-4 py-2 rounded-md text-sm border border-white/10 text-stone-300 hover:bg-white/[0.06] transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-md text-sm bg-orange-500 hover:bg-orange-400 text-white font-semibold flex items-center gap-2 transition-colors shadow-[0_0_22px_-6px_rgba(249,115,22,0.7)]"><Plus size={15}/> Add to In-Talks</button>
            </div>
          </form>
        </div>
      )}

      {/* ============ MESSAGE NOTIFICATIONS (phone-style) ============ */}
      {notifs.length > 0 && (
        <div className="fixed top-20 right-5 z-[75] flex flex-col gap-2 w-80 max-w-[calc(100vw-2.5rem)]">
          {notifs.map(n => (
            <button
              key={n.key}
              onClick={() => { setMessagesOpen(true); openChannel(n.channel); setNotifs([]); }}
              className="text-left bg-[#0c0a08] border border-white/10 rounded-xl shadow-2xl p-3.5 flex items-start gap-3 hover:border-orange-500/40 transition-colors animate-in slide-in-from-right-4 fade-in duration-200"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500/80 to-amber-600/80 flex items-center justify-center text-sm font-bold text-white shrink-0">
                {n.channel === 'group:all' ? <Hash size={16}/> : (n.name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-stone-100 truncate">{n.channel === 'group:all' ? 'Team Channel' : n.name}</p>
                  <span className="text-[10px] text-stone-500 shrink-0">{timeAgo(n.at)}</span>
                </div>
                {n.channel === 'group:all' && <p className="text-[11px] text-stone-500 leading-tight">{n.name}</p>}
                <p className="text-xs text-stone-400 truncate mt-0.5">{n.body}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ============ DELETE COMMENT CONFIRM ============ */}
      {deleteCommentTarget && (
        <div className="fixed inset-0 z-[78] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setDeleteCommentTarget(null)}>
          <div className="bg-[#0c0a08] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <AlertTriangle size={18}/>
              <h3 className="font-semibold text-stone-100">Delete this comment?</h3>
            </div>
            <p className="text-sm text-stone-400">
              This permanently deletes <span className="text-stone-200 font-medium">{deleteCommentTarget.author}</span>'s comment. Anyone can delete comments, and this can't be undone.
            </p>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-stone-300 my-3 max-h-28 overflow-auto whitespace-pre-wrap break-words">{deleteCommentTarget.body}</div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setDeleteCommentTarget(null)} className="px-4 py-2 rounded-md text-sm border border-white/10 text-stone-300 hover:bg-white/[0.06] transition-colors">Cancel</button>
              <button onClick={() => deleteComment(deleteCommentTarget)} className="px-4 py-2 rounded-md text-sm bg-red-500 hover:bg-red-400 text-white font-semibold transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] bg-[#0c0a08] border border-orange-500/30 text-stone-100 text-sm px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check size={15} className="text-orange-400"/> {toast}
        </div>
      )}

      <datalist id="poc-options">
        {teamProfiles.map(p => <option key={p.email} value={p.display_name} />)}
      </datalist>

      {/* Timeline Day — deliverables posted that day */}
      {reportExport.open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setReportExport({ ...reportExport, open: false })}>
          <div className="bg-[#0c0a08] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[88vh] overflow-y-auto animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold text-stone-100">Export {reportExport.format.toUpperCase()} report</h3>
              <button onClick={() => setReportExport({ ...reportExport, open: false })} className="text-stone-500 hover:text-stone-200 text-sm">Close</button>
            </div>
            <p className="text-xs text-stone-500 mb-4">Everything's on by default — switch off anything you don't want in the file.</p>

            <div className="space-y-2.5">
              {[
                { key: 'summary', label: 'Summary statistics', desc: 'Total views, likes, ER, spend, CPE/CPV' },
                { key: 'breakdown', label: 'Creator breakdown', desc: 'A row per creator (pick columns below)' }
              ].map(opt => (
                <button key={opt.key} onClick={() => setExportOpts(o => ({ ...o, [opt.key]: !o[opt.key] }))} className="w-full flex items-center justify-between gap-3 rounded-lg border border-white/10 hover:bg-white/[0.03] px-3.5 py-3 text-left transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-200">{opt.label}</p>
                    <p className="text-[11px] text-stone-500 mt-0.5">{opt.desc}</p>
                  </div>
                  <span className={`shrink-0 w-10 h-6 rounded-full p-0.5 transition-colors ${exportOpts[opt.key] ? 'bg-orange-500' : 'bg-white/10'}`}>
                    <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${exportOpts[opt.key] ? 'translate-x-4' : 'translate-x-0'}`}></span>
                  </span>
                </button>
              ))}
            </div>

            {exportOpts.breakdown && (
              <div className="mt-4 border-t border-white/[0.07] pt-4">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[11px] uppercase tracking-[0.15em] text-stone-500">Columns</p>
                  <div className="flex gap-1.5">
                    <button onClick={() => setExportOpts(o => { const n = { ...o }; reportColumnDefs.forEach(c => n[c.key] = true); return n; })} className="text-[11px] text-orange-300 hover:text-orange-200 px-2 py-0.5 rounded border border-orange-500/25 bg-orange-500/10">All</button>
                    <button onClick={() => setExportOpts(o => { const n = { ...o }; reportColumnDefs.forEach(c => n[c.key] = false); return n; })} className="text-[11px] text-stone-400 hover:text-stone-200 px-2 py-0.5 rounded border border-white/10">None</button>
                  </div>
                </div>
                {['Profile', 'Engagement', 'Cost'].map(group => {
                  const cols = reportColumnDefs.filter(c => c.group === group);
                  const selected = cols.filter(c => exportOpts[c.key]).length;
                  const open = !!exportGroupsOpen[group];
                  return (
                    <div key={group} className="mb-2 last:mb-0 border border-white/[0.07] rounded-lg overflow-hidden">
                      <button onClick={() => setExportGroupsOpen(s => ({ ...s, [group]: !s[group] }))} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.03] transition-colors">
                        <span className="text-sm text-stone-200">{group}</span>
                        <span className="flex items-center gap-2">
                          <span className="text-[11px] text-stone-500 tabular-nums">{selected}/{cols.length}</span>
                          <span className={`text-stone-500 transition-transform ${open ? 'rotate-180' : ''}`}><ChevronDown size={15}/></span>
                        </span>
                      </button>
                      {open && (
                        <div className="flex flex-wrap gap-1.5 px-3 pb-3 pt-0.5">
                          {cols.map(col => {
                            const on = exportOpts[col.key];
                            return (
                              <button key={col.key} onClick={() => setExportOpts(o => ({ ...o, [col.key]: !o[col.key] }))} className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition-colors ${on ? 'bg-orange-500/20 border-orange-500/40 text-orange-200' : 'bg-white/[0.02] border-white/10 text-stone-500 hover:text-stone-300'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${on ? 'bg-orange-400' : 'bg-stone-600'}`}></span>
                                {col.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <button onClick={runReportExport} className="mt-5 w-full bg-orange-500 hover:bg-orange-400 text-white py-2.5 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-[0_0_22px_-6px_rgba(249,115,22,0.7)]">
              <Download size={15}/> Download {reportExport.format.toUpperCase()}
            </button>
          </div>
        </div>
      )}

      {timelineDay && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setTimelineDay(null)}>
          <div className="bg-[#0c0a08] border border-white/[0.08] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-white/[0.07] flex justify-between items-center bg-white/[0.02] shrink-0">
              <div>
                <h3 className="font-medium text-stone-100 flex items-center gap-2"><CalendarDays size={16} className="text-orange-400"/> {fmtDateFull(timelineDay.date)}</h3>
                <p className="text-xs text-stone-500 mt-0.5">{timelineDay.creators.length} deliverable{timelineDay.creators.length === 1 ? '' : 's'} posted</p>
              </div>
              <button onClick={() => setTimelineDay(null)} className="text-stone-500 hover:text-stone-300"><X size={18}/></button>
            </div>
            <div className="overflow-y-auto p-4 space-y-2">
              {timelineDay.creators.map((c) => {
                const href = c.deliverable_link ? (c.deliverable_link.startsWith('http') ? c.deliverable_link : `https://${c.deliverable_link}`) : '';
                return (
                  <div key={c.creator_deal_id} className="flex items-center gap-3 bg-white/[0.025] border border-white/[0.06] rounded-lg p-3">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: getPlatformColor(c.platform) }}></span>
                    <div className="min-w-0 flex-1">
                      <button onClick={() => { setTimelineDay(null); setProfileCardCreator(c); }} className="font-medium text-stone-200 hover:text-orange-300 transition-colors text-left truncate block">{c.creator_name}</button>
                      <p className="text-xs text-stone-500 truncate">{c.platform} · {c.content_type} · {formatNumber(c.views || 0)} views</p>
                    </div>
                    {href ? (
                      <a href={href} target="_blank" rel="noreferrer" className="shrink-0 inline-flex items-center gap-1.5 bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-300 text-xs font-medium px-3 py-1.5 rounded-md transition-colors">
                        <ExternalLink size={13}/> View post
                      </a>
                    ) : (
                      <span className="shrink-0 text-xs text-stone-600">No link</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Creator Profile Card */}
      {profileCardCreator && (() => {
        const c = profileCardCreator;
        const m = calculateCreatorMetrics(c);
        const handle = getCreatorHandle(c.profile_link) || c.creator_name;
        const embed = getEmbedInfo(c.deliverable_link);
        const gIdx = hashIndex(c.creator_name, AVATARS.length);
        const grad = AVATARS[gIdx].grad;
        const profileHref = c.profile_link ? (c.profile_link.startsWith('http') ? c.profile_link : `https://${c.profile_link}`) : '';
        return (
          <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setProfileCardCreator(null)}>
            <div className="bg-[#0c0a08] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[88vh]" onClick={(e) => e.stopPropagation()}>
              <div className="p-5 border-b border-white/[0.07] bg-white/[0.02] shrink-0">
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${grad} ring-2 ring-white/10 flex items-center justify-center text-2xl font-bold text-white shrink-0`}>
                    {(c.creator_name || '?').trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-stone-100 truncate">{c.creator_name}</h3>
                      <span className="text-[10px] uppercase tracking-[0.15em] px-1.5 py-0.5 rounded border border-white/10 text-stone-400 shrink-0">{c.platform}</span>
                    </div>
                    {handle && <p className="text-sm text-orange-300/90 truncate">{handle}</p>}
                    <div className="flex gap-4 mt-2 text-xs">
                      <div><span className="text-stone-200 font-semibold tabular-nums">{formatNumber(c.followers)}</span> <span className="text-stone-500">followers</span></div>
                      <div><span className="text-stone-200 font-semibold tabular-nums">{formatNumber(c.views || 0)}</span> <span className="text-stone-500">views</span></div>
                      <div><span className="text-stone-200 font-semibold tabular-nums">{formatNumber(m.engagement)}</span> <span className="text-stone-500">eng.</span></div>
                    </div>
                  </div>
                  <button onClick={() => setProfileCardCreator(null)} className="text-stone-500 hover:text-stone-300 shrink-0"><X size={18}/></button>
                </div>
              </div>

              <div className="overflow-y-auto p-4 space-y-4">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2"><p className="text-stone-500 mb-0.5">Deliverable</p><p className="text-stone-200">{c.content_type}</p></div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2"><p className="text-stone-500 mb-0.5">Fee</p><p className="text-stone-200 tabular-nums">{formatMoney(c.deal_value)}</p></div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2"><p className="text-stone-500 mb-0.5">Go-Live</p><p className="text-stone-200 tabular-nums">{c.planned_go_live_date || '—'}</p></div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2"><p className="text-stone-500 mb-0.5">Eng. Rate</p><p className="text-orange-300 tabular-nums">{c.views > 0 ? ((m.engagement / c.views) * 100).toFixed(1) : '0.0'}%</p></div>
                </div>

                {embed.url ? (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2">Latest deliverable</p>
                    <iframe
                      src={embed.url}
                      title="deliverable"
                      className="w-full rounded-lg border border-white/10 bg-black"
                      style={{ height: embed.kind === 'youtube' ? 230 : 560 }}
                      loading="lazy"
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                      allowFullScreen
                    ></iframe>
                  </div>
                ) : (
                  <div className="text-center text-sm text-stone-600 bg-white/[0.02] border border-white/[0.06] rounded-lg py-6 px-4">
                    No embeddable deliverable post yet.
                  </div>
                )}

                {profileHref && (
                  <a href={profileHref} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold py-2.5 rounded-md transition-colors shadow-[0_0_22px_-6px_rgba(249,115,22,0.7)]">
                    <ExternalLink size={15}/> Open full profile on {c.platform}
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Settings */}
      {settingsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSettingsOpen(false)}>
          <div className="bg-[#0c0a08] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-white/[0.07] flex justify-between items-center bg-white/[0.02]">
              <h3 className="font-medium text-stone-100 flex items-center gap-2"><Settings size={16} className="text-orange-400"/> Settings</h3>
              <button onClick={() => setSettingsOpen(false)} className="text-stone-500 hover:text-stone-300"><X size={18}/></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-3 font-medium">Appearance</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setTheme('dark')} className={`flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-orange-500/15 border-orange-500/40 text-orange-300' : 'bg-white/[0.03] border-white/10 text-stone-300 hover:bg-white/[0.06]'}`}>
                    <Moon size={16}/> Dark
                  </button>
                  <button onClick={() => setTheme('light')} className={`flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-medium transition-colors ${theme === 'light' ? 'bg-orange-500/15 border-orange-500/40 text-orange-300' : 'bg-white/[0.03] border-white/10 text-stone-300 hover:bg-white/[0.06]'}`}>
                    <Sun size={16}/> Light
                  </button>
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-3 font-medium flex items-center gap-1.5"><Type size={12}/> Font Size</p>
                <div className="grid grid-cols-3 gap-3">
                  {[['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']].map(([val, label]) => (
                    <button key={val} onClick={() => setFontSize(val)} className={`py-3 rounded-lg border font-medium transition-colors ${fontSize === val ? 'bg-orange-500/15 border-orange-500/40 text-orange-300' : 'bg-white/[0.03] border-white/10 text-stone-300 hover:bg-white/[0.06]'} ${val === 'small' ? 'text-xs' : val === 'large' ? 'text-base' : 'text-sm'}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-stone-500 mt-3">Adjusts text size across the whole app.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {commentModal.isOpen && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0c0a08] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-white/[0.07] flex justify-between items-center bg-white/[0.02] shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-orange-400"/>
                <h3 className="font-medium text-stone-100">Comments — {commentModal.creator?.creator_name}</h3>
              </div>
              <button type="button" onClick={() => setCommentModal({ isOpen: false, creator: null })} className="text-stone-500 hover:text-stone-300">Close</button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[160px]">
              {commentsFor(commentModal.creator?.creator_deal_id).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-stone-600 py-8">
                  <MessageSquare size={28} className="mb-3 opacity-40"/>
                  <p className="text-sm">No comments yet. Start the thread.</p>
                </div>
              ) : (
                commentsFor(commentModal.creator?.creator_deal_id).map((cm) => (
                  <div key={cm.id} className="flex flex-col group/cmt">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs font-semibold text-orange-300">{cm.author}</span>
                      <span className="text-[10px] text-stone-600 tabular-nums">
                        {cm.created_at ? new Date(cm.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                      <button onClick={() => setDeleteCommentTarget(cm)} title="Delete comment" className="ml-auto opacity-0 group-hover/cmt:opacity-100 text-stone-600 hover:text-red-400 transition-all p-0.5"><Trash2 size={13}/></button>
                    </div>
                    <div className="bg-white/[0.04] border border-white/[0.06] rounded-lg rounded-tl-none px-3 py-2 text-sm text-stone-200 whitespace-pre-wrap break-words">
                      {cm.body}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-white/[0.07] bg-white/[0.02] shrink-0 space-y-3">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">From</label>
                <input
                  value={commentFrom}
                  onChange={(e) => setCommentFrom(e.target.value)}
                  placeholder="Who is this from?"
                  className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70"
                />
              </div>
              <div className="flex items-end gap-2">
                <textarea
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendComment(); } }}
                  rows={2}
                  placeholder="Write a comment…  (Enter to send, Shift+Enter for new line)"
                  className="flex-1 resize-none bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70"
                />
                <button
                  onClick={sendComment}
                  disabled={!commentBody.trim()}
                  className="h-[42px] px-4 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-md flex items-center justify-center transition-colors shadow-[0_0_22px_-6px_rgba(249,115,22,0.7)]"
                >
                  <Send size={16}/>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Editor Modal */}
      {isProfileEditorOpen && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0c0a08] border border-white/[0.08] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-white/[0.07] flex justify-between items-center bg-white/[0.02] shrink-0">
              <h3 className="font-medium text-stone-100 flex items-center gap-2"><Edit2 size={16} className="text-orange-400"/> Edit profile</h3>
              <button type="button" onClick={() => setProfileEditorOpen(false)} className="text-stone-500 hover:text-stone-300">Close</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="flex items-center gap-4">
                <AvatarBadge index={profileAvatar} photo={profilePhoto} size={64} ring />
                <div className="flex-1">
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Display Name</label>
                  <input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Title / Role</label>
                <input
                  value={profileTitle}
                  onChange={(e) => setProfileTitle(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70"
                  placeholder="e.g. Account Manager"
                />
              </div>

              <div className="mt-6">
                <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-3 font-medium">Avatar</label>
                <AvatarPicker />
              </div>

              <div className="mt-6">
                <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Bio</label>
                <textarea
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  rows={3}
                  maxLength={300}
                  placeholder="A short line about you…"
                  className="w-full resize-none bg-black/40 border border-white/10 rounded-md px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70"
                />
                <p className="text-[10px] text-stone-600 mt-1 text-right">{profileBio.length}/300</p>
              </div>

              <div className="mt-3">
                <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2 font-medium">Interests <span className="text-stone-600 normal-case tracking-normal">({profileInterests.length}/5)</span></label>
                {profileInterests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {profileInterests.map((it, i) => (
                      <span key={i} className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/25 text-orange-200 text-xs">
                        {it}
                        <button type="button" onClick={() => removeInterest(i)} className="hover:text-white"><X size={12}/></button>
                      </span>
                    ))}
                  </div>
                )}
                {profileInterests.length < 5 && (
                  <div className="flex items-center gap-2">
                    <input
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addInterest(); } }}
                      placeholder="Add an interest + Enter"
                      className="flex-1 bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70"
                    />
                    <button type="button" onClick={addInterest} disabled={!newInterest.trim()} className="px-3 py-2 rounded-md text-sm bg-orange-500/15 text-orange-300 border border-orange-500/30 hover:bg-orange-500/25 disabled:opacity-40 transition-colors">Add</button>
                  </div>
                )}
              </div>

              <div className="mt-7 flex justify-end gap-3">
                <button onClick={() => setProfileEditorOpen(false)} className="px-4 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-stone-300 text-sm font-medium rounded-md transition-colors">Cancel</button>
                <button onClick={saveProfile} className="px-6 py-2.5 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold rounded-md transition-colors shadow-[0_0_22px_-6px_rgba(249,115,22,0.7)]">Save changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Range Export Modal */}
      {exportModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0c0a08] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/[0.07] flex justify-between items-center bg-white/[0.02]">
              <h3 className="font-medium text-stone-100 flex items-center gap-2">
                <Download className="text-orange-400" size={18}/> 
                Export {exportModal.type === 'finance' ? 'Finance' : 'Ops'} Report
              </h3>
              <button type="button" onClick={() => setExportModal({ isOpen: false, type: '' })} className="text-stone-500 hover:text-stone-300">Close</button>
            </div>
            <form onSubmit={executeAdvancedExport} className="p-6 space-y-5">
              
              <div className="bg-white/[0.02] border border-white/[0.07] rounded-lg p-4">
                <p className="text-xs text-stone-400 mb-3">
                  {exportModal.type === 'finance' 
                    ? 'Finance reports filter creators strictly by their Invoice Bill Date, regardless of when they post.' 
                    : 'Ops reports filter creators strictly by their Target Go-Live Date, regardless of when they are billed.'}
                </p>
                
                <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2 font-medium">Select Range Type</label>
                <select name="filter_type" defaultValue="month" className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70 mb-4" onChange={(e) => {
                  document.getElementById('custom-date-row').style.display = e.target.value === 'custom' ? 'grid' : 'none';
                }}>
                  <option value="month" className="bg-[#0c0a08]">Current Filtered Month ({targetMonth})</option>
                  <option value="custom" className="bg-[#0c0a08]">Custom Date Range</option>
                  <option value="all" className="bg-[#0c0a08]">All Available Data</option>
                </select>

                <div id="custom-date-row" className="grid-cols-2 gap-4 hidden">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Start Date</label>
                    <input name="start_date" type="date" className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70 [color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">End Date</label>
                    <input name="end_date" type="date" className="w-full bg-black/50 border border-white/10 rounded-md px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70 [color-scheme:dark]" />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button type="submit" className="px-6 py-2.5 text-white text-sm font-semibold rounded-md transition-colors shadow-[0_0_22px_-6px_rgba(249,115,22,0.7)] bg-orange-500 hover:bg-orange-400">
                  Download CSV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0c0a08] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/[0.07] flex justify-between items-center bg-white/[0.02]">
              <h3 className="font-medium text-stone-100">{editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}</h3>
              <button type="button" onClick={() => { setCampaignModalOpen(false); setEditingCampaign(null); setEditorsList([]); setEditorInput(''); setCampaignImage(''); }} className="text-stone-500 hover:text-stone-300">Close</button>
            </div>
            <form onSubmit={handleSaveCampaign} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Campaign Photo <span className="text-stone-600 normal-case tracking-normal">(optional)</span></label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 bg-white/[0.03] flex items-center justify-center shrink-0">
                    {campaignImage ? (
                      <img src={campaignImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImagePlus size={22} className="text-stone-600" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-3 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-stone-200 text-sm rounded-md transition-colors inline-flex items-center gap-2">
                      <ImagePlus size={14}/> {uploadingImage ? 'Processing…' : (campaignImage ? 'Change photo' : 'Upload photo')}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { handleCampaignImageFile(e.target.files?.[0]); e.target.value = ''; }} />
                    </label>
                    {campaignImage && (
                      <button type="button" onClick={() => setCampaignImage('')} className="px-2.5 py-2 text-stone-500 hover:text-red-400 text-sm rounded-md transition-colors inline-flex items-center gap-1">
                        <X size={14}/> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Campaign Name</label>
                <input name="campaign_name" defaultValue={editingCampaign?.ip_name} required className="w-full bg-white/[0.03] border border-white/10 rounded-md px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Owner Email <span className="text-stone-600 normal-case tracking-normal">(responsible — gets edit access)</span></label>
                <input name="owner" type="email" defaultValue={editingCampaign?.owner} required placeholder="someone@yaas.studio" className="w-full bg-white/[0.03] border border-white/10 rounded-md px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Editors <span className="text-stone-600 normal-case tracking-normal">(optional — can also edit, sync &amp; delete)</span></label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={editorInput}
                    onChange={(e) => setEditorInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEditor(); } }}
                    placeholder="editor@yaas.studio"
                    className="flex-1 bg-white/[0.03] border border-white/10 rounded-md px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70"
                  />
                  <button type="button" onClick={addEditor} className="px-3 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-stone-200 text-sm rounded-md transition-colors">Add</button>
                </div>
                {editorsList.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {editorsList.map((em) => (
                      <span key={em} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-200 text-xs">
                        {em}
                        <button type="button" onClick={() => removeEditor(em)} className="text-orange-300/70 hover:text-orange-100">×</button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-stone-600 mt-2">Everyone else who logs in can view this campaign but can't edit it.</p>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Total Budget</label>
                <input name="budget" type="number" defaultValue={editingCampaign?.budget} required className="w-full bg-white/[0.03] border border-white/10 rounded-md px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="submit" className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-medium rounded-md transition-colors shadow-[0_0_22px_-6px_rgba(249,115,22,0.7)]">
                  {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0c0a08] border border-white/[0.08] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-white/[0.07] flex justify-between items-center bg-white/[0.02] shrink-0">
              <h3 className="font-medium text-stone-100 flex items-center gap-2"><Download size={16} className="text-orange-400 rotate-180"/> Import Campaign from CSV</h3>
              <button type="button" onClick={() => setImportModalOpen(false)} className="text-stone-500 hover:text-stone-300">Close</button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="bg-orange-500/[0.06] border border-orange-500/20 rounded-lg px-4 py-3 text-sm text-orange-200 flex items-center gap-2">
                <Check size={16}/> Found <strong>{importRows.length}</strong> creator{importRows.length === 1 ? '' : 's'} across the sheet. Invoice details are skipped — add bill dates later by editing each creator.
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Campaign Name</label>
                  <input value={importName} onChange={(e) => setImportName(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-md px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Owner Email <span className="text-stone-600 normal-case tracking-normal">(required)</span></label>
                  <input type="email" value={importOwner} onChange={(e) => setImportOwner(e.target.value)} placeholder="someone@yaas.studio" className="w-full bg-white/[0.03] border border-white/10 rounded-md px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Editors <span className="text-stone-600 normal-case tracking-normal">(optional)</span></label>
                <div className="flex gap-2">
                  <input type="email" value={importEditorInput} onChange={(e) => setImportEditorInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImportEditor(); } }} placeholder="editor@yaas.studio" className="flex-1 bg-white/[0.03] border border-white/10 rounded-md px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70" />
                  <button type="button" onClick={addImportEditor} className="px-3 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-stone-200 text-sm rounded-md transition-colors">Add</button>
                </div>
                {importEditorsList.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {importEditorsList.map((em) => (
                      <span key={em} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-200 text-xs">
                        {em}
                        <button type="button" onClick={() => setImportEditorsList(importEditorsList.filter(x => x !== em))} className="text-orange-300/70 hover:text-orange-100">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2 font-medium">Preview (first 5)</p>
                <div className="border border-white/[0.07] rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/[0.02] text-stone-500">
                      <tr>
                        <th className="px-3 py-2 font-medium">Creator</th>
                        <th className="px-3 py-2 font-medium">Platform</th>
                        <th className="px-3 py-2 font-medium">Month</th>
                        <th className="px-3 py-2 font-medium">Spend</th>
                        <th className="px-3 py-2 font-medium">Views</th>
                        <th className="px-3 py-2 font-medium">Link</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {importRows.slice(0, 5).map((r, i) => (
                        <tr key={i} className="text-stone-300">
                          <td className="px-3 py-2 truncate max-w-[140px]">{r.name}</td>
                          <td className="px-3 py-2">{r.platform}</td>
                          <td className="px-3 py-2">{r.month || '—'}</td>
                          <td className="px-3 py-2 tabular-nums">{formatMoney(r.spend)}</td>
                          <td className="px-3 py-2 tabular-nums">{formatNumber(r.views)}</td>
                          <td className="px-3 py-2">{r.deliverable ? <Check size={13} className="text-orange-400"/> : <span className="text-stone-600">—</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-sm text-stone-300 cursor-pointer">
                <input type="checkbox" checked={importAutoSync} onChange={(e) => setImportAutoSync(e.target.checked)} className="accent-orange-500 w-4 h-4" />
                Auto-sync live metrics from deliverable links after import
                <span className="text-stone-600 text-xs">(slower — pulls each link)</span>
              </label>

              {importError && (
                <div className="flex items-center gap-2 text-sm text-orange-200 bg-orange-500/[0.08] border border-orange-500/30 px-4 py-2.5 rounded-lg">
                  <AlertCircle size={16}/> {importError}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-white/[0.07] flex justify-end gap-3 shrink-0 bg-white/[0.02]">
              <button type="button" onClick={() => setImportModalOpen(false)} className="px-4 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-stone-300 text-sm font-medium rounded-md transition-colors">Cancel</button>
              <button type="button" onClick={executeImport} disabled={importing} className="px-6 py-2.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white text-sm font-semibold rounded-md transition-colors shadow-[0_0_22px_-6px_rgba(249,115,22,0.7)]">
                {importing ? 'Importing…' : `Import ${importRows.length} creator${importRows.length === 1 ? '' : 's'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCreatorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0c0a08] border border-white/[0.08] rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-white/[0.07] flex justify-between items-center bg-white/[0.02] shrink-0">
              <h3 className="font-medium text-stone-100">{editingCreator ? 'Edit Creator Booking' : 'Book Creator'}</h3>
              <button type="button" onClick={() => {setCreatorModalOpen(false); setEditingCreator(null);}} className="text-stone-500 hover:text-stone-300">Close</button>
            </div>
            
            <form onSubmit={handleSaveCreator} className="flex flex-col overflow-hidden">
              <div className="p-6 space-y-6 overflow-y-auto">
                
                <div>
                  <h4 className="text-[10px] font-semibold text-stone-300 uppercase tracking-[0.2em] border-b border-white/[0.07] pb-2 mb-4">Core Profile</h4>
                  <div className="grid grid-cols-3 gap-5">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Creator Name</label>
                      <input name="creator_name" defaultValue={editingCreator?.creator_name} required className="w-full bg-white/[0.03] border border-white/10 rounded-md px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Platform</label>
                      <select name="platform" value={modalPlatform} onChange={(e) => onModalPlatformChange(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-md px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70">
                        <option className="bg-[#0c0a08]">Instagram</option>
                        <option className="bg-[#0c0a08]">YouTube</option>
                        <option className="bg-[#0c0a08]">TikTok</option>
                        <option className="bg-[#0c0a08]">LinkedIn</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Profile Link</label>
                      <input name="profile_link" defaultValue={editingCreator?.profile_link} className="w-full bg-white/[0.03] border border-white/10 rounded-md px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70" placeholder={modalPlatform === 'YouTube' ? 'youtube.com/@channel' : 'instagram.com/username'} />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-semibold text-stone-300 uppercase tracking-[0.2em] border-b border-white/[0.07] pb-2 mb-4">Deal Details</h4>
                  <div className="grid grid-cols-4 gap-5">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Spend / Fee</label>
                      <input name="deal_value" type="number" required defaultValue={editingCreator?.deal_value} className="w-full bg-white/[0.03] border border-white/10 rounded-md px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Payment Model</label>
                      <select name="payment_model" defaultValue={editingCreator?.payment_model || '100_advance'} className="w-full bg-white/[0.03] border border-white/10 rounded-md px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70">
                        <option value="100_advance" className="bg-[#0c0a08]">100% Advance</option>
                        <option value="50_50" className="bg-[#0c0a08]">50-50 Split</option>
                        <option value="full_later" className="bg-[#0c0a08]">Full Post-Live</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Target Go-Live Date</label>
                      <input name="planned_go_live_date" type="date" required defaultValue={editingCreator?.planned_go_live_date} className="w-full bg-white/[0.03] border border-white/10 rounded-md px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70 [color-scheme:dark]" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Finance Bill Date</label>
                      <input name="invoice_date" type="date" required defaultValue={editingCreator ? getCreatorBillDate(editingCreator.creator_deal_id) : ''} className="w-full bg-white/[0.03] border border-white/10 rounded-md px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70 [color-scheme:dark]" />
                    </div>
                  </div>
                </div>

                <div className="bg-white/[0.02] p-5 rounded-xl border border-white/[0.06]">
                  <div className="flex justify-between items-center mb-4 border-b border-white/[0.07] pb-3">
                    <h4 className="text-[10px] font-semibold text-stone-300 uppercase tracking-[0.2em]">Live Performance Tracking</h4>
                    <button 
                      type="button" 
                      onClick={handleAutoSync}
                      disabled={isSyncing}
                      className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] bg-orange-500/15 text-orange-400 px-3 py-1.5 rounded-full border border-orange-500/30 hover:bg-orange-500/25 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={isSyncing ? "animate-spin" : ""} size={12}/>
                      {isSyncing ? "Fetching Live Data..." : "Auto-Sync Live Metrics"}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-5 mb-5">
                     <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Deliverable Link (URL)</label>
                      <input name="deliverable_link" defaultValue={editingCreator?.deliverable_link} className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70" placeholder={modalPlatform === 'YouTube' ? 'youtube.com/watch?v=…  ·  /shorts/…' : 'https://instagram.com/p/...'} />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Content Type</label>
                        <select name="content_type" value={modalContentType} onChange={(e) => setModalContentType(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70">
                          {contentTypesFor(modalPlatform).map(ct => <option key={ct} className="bg-[#0c0a08]">{ct}</option>)}
                          {!contentTypesFor(modalPlatform).includes(modalContentType) && modalContentType && <option className="bg-[#0c0a08]">{modalContentType}</option>}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">{modalPlatform === 'YouTube' ? 'Subscribers' : 'Followers'}</label>
                        <input name="followers" type="number" defaultValue={editingCreator?.followers} className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-orange-300 mb-1.5 font-medium">Views</label>
                      <input name="views" type="number" defaultValue={editingCreator?.views} className="w-full bg-orange-950/30 border border-orange-500/30 rounded-md px-3 py-2 text-sm text-orange-100 focus:outline-none focus:border-orange-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Likes</label>
                      <input name="likes" type="number" defaultValue={editingCreator?.likes} className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Comments</label>
                      <input name="comments" type="number" defaultValue={editingCreator?.comments} className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Shares</label>
                      <input name="shares" type="number" defaultValue={editingCreator?.shares} className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Saves</label>
                      <input name="saves" type="number" defaultValue={editingCreator?.saves} className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70" />
                    </div>
                  </div>
                </div>

              </div>
              <div className="p-5 border-t border-white/[0.07] flex justify-end shrink-0 bg-white/[0.02]">
                <button type="submit" className="px-6 py-2.5 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold rounded-md transition-colors shadow-[0_0_22px_-6px_rgba(249,115,22,0.7)]">
                  {editingCreator ? 'Update Creator Booking' : 'Save Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletePrompt.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0c0a08] border border-red-900/50 rounded-2xl w-full max-w-sm shadow-[0_0_40px_rgba(220,38,38,0.15)] overflow-hidden">
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
                <AlertTriangle size={24}/>
              </div>
              <h3 className="text-lg font-medium text-stone-100 mb-2">Delete {deletePrompt.type === 'campaign' ? 'Campaign' : 'Creator'}?</h3>
              <p className="text-sm text-stone-400 mb-6 leading-relaxed">
                You are about to delete <strong>{deletePrompt.name}</strong>. This action will permanently remove all associated data, including financial records and billing history. This cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setDeletePrompt({ isOpen: false, type: '', id: '', name: '' })} className="flex-1 px-4 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-stone-300 text-sm font-medium rounded-md transition-colors">
                  Cancel
                </button>
                <button onClick={executeDelete} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-md transition-colors shadow-lg">
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
