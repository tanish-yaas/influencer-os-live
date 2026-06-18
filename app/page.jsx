"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  FolderKanban, Users, ArrowRightLeft, 
  CreditCard, Receipt, CalendarDays, BarChart3, Plus, 
  Search, Bell, AlertCircle, ArrowLeft, 
  Edit2, Trash2, ExternalLink, AlertTriangle, Link as LinkIcon, RefreshCw,
  Download, CheckSquare, Square, Lock, Mail
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ALL_MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

export default function InfluencerOS() {
  // --- AUTHENTICATION STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // --- DASHBOARD STATE ---
  const [activeTab, setActiveTab] = useState('campaigns');
  const [activeCampaignId, setActiveCampaignId] = useState(null);
  
  const [targetMonth, setTargetMonth] = useState('May');
  const [currency, setCurrency] = useState('INR');
  
  const [campaigns, setCampaigns] = useState([]);
  const [creators, setCreators] = useState([]);
  const [bills, setBills] = useState([]);

  const [isCampaignModalOpen, setCampaignModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  
  const [isCreatorModalOpen, setCreatorModalOpen] = useState(false);
  const [editingCreator, setEditingCreator] = useState(null);

  const [deletePrompt, setDeletePrompt] = useState({ isOpen: false, type: '', id: '', name: '' });
  
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  const [exportModal, setExportModal] = useState({ isOpen: false, type: '' });

  const [isMounted, setIsMounted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false); 

  useEffect(() => {
    setIsMounted(true);
    fetchLiveDatabase();
  }, []);

  const fetchLiveDatabase = async () => {
    const { data: campData } = await supabase.from('campaigns').select('*');
    const { data: creatorData } = await supabase.from('creators').select('*');
    const { data: billData } = await supabase.from('bills').select('*');

    if (campData) setCampaigns(campData);
    if (creatorData) setCreators(creatorData);
    if (billData) setBills(billData);
  };

  // --- AUTHENTICATION HANDLER ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginEmail === 'collab@yaas.studio' && loginPassword === 'influencermarketing@yaas') {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid email or password.');
    }
  };

  // --- CSV GENERATOR ENGINE ---
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

  // --- FORMATTING & MATH HELPERS ---
  const formatMoney = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency, maximumFractionDigits: 0 }).format(amount);
  const formatMicroMoney = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency, maximumFractionDigits: 2 }).format(amount);
  const formatNumber = (num) => new Intl.NumberFormat('en-IN').format(num);

  const getCreatorBillDate = (creatorId) => bills.find(b => b.creator_deal_id === creatorId)?.invoice_date || '';

  const calculateCreatorMetrics = (c) => {
    const views = Number(c.views) || 0;
    const engagement = (Number(c.likes) || 0) + (Number(c.comments) || 0) + (Number(c.shares) || 0) + (Number(c.saves) || 0);
    const cost = Number(c.deal_value) || 0;
    return { engagement, cpv: views > 0 ? (cost / views) : 0, cpe: engagement > 0 ? (cost / engagement) : 0 };
  };

  // --- CORE LOGIC ENGINE ---
  const computations = useMemo(() => {
    let opsTotal = 0;
    let financeTotal = 0;
    let mismatchReasons = [];

    const opsDeals = creators.filter(c => c.planned_go_live_month === targetMonth);
    opsTotal = opsDeals.reduce((sum, c) => sum + Number(c.deal_value), 0);

    const finBills = bills.filter(b => b.invoice_month === targetMonth);
    financeTotal = finBills.reduce((sum, b) => sum + Number(b.invoice_amount), 0);

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

    return { opsTotal, financeTotal, variance, mismatchReasons };
  }, [creators, bills, targetMonth, currency]);

  // --- CRUD ACTIONS ---
  const handleSaveCampaign = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const campData = {
      ip_id: editingCampaign ? editingCampaign.ip_id : `ip_${Date.now()}`,
      ip_name: formData.get('campaign_name'),
      owner: formData.get('owner'),
      status: editingCampaign ? editingCampaign.status : 'active',
      budget: parseInt(formData.get('budget')) || 0
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
  };

  const openCampaignEdit = (e, camp) => {
    e.stopPropagation(); 
    setEditingCampaign(camp);
    setCampaignModalOpen(true);
  };

  const handleSaveCreator = async (e) => {
    e.preventDefault();
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
  };

  const requestDelete = (e, type, id, name) => {
    e.stopPropagation();
    setDeletePrompt({ isOpen: true, type, id, name });
  };

  const executeDelete = async () => {
    if (deletePrompt.type === 'campaign') {
      setCampaigns(campaigns.filter(c => c.ip_id !== deletePrompt.id));
      await supabase.from('campaigns').delete().eq('ip_id', deletePrompt.id);
      if (activeCampaignId === deletePrompt.id) setActiveCampaignId(null);
    } else if (deletePrompt.type === 'creator') {
      setCreators(creators.filter(c => c.creator_deal_id !== deletePrompt.id));
      setBills(bills.filter(b => b.creator_deal_id !== deletePrompt.id));
      await supabase.from('creators').delete().eq('creator_deal_id', deletePrompt.id);
      await supabase.from('bills').delete().eq('creator_deal_id', deletePrompt.id);
    }
    setDeletePrompt({ isOpen: false, type: '', id: '', name: '' });
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
        setEditingCreator({ ...editingCreator, ...data.metrics });
      } else {
        alert("Failed to sync metrics: " + data.error);
      }
    } catch (err) {
      alert("A network error occurred while syncing.");
    } finally {
      setIsSyncing(false);
    }
  };

  const getGroupedCreators = () => {
    const campaignCreators = creators.filter(c => c.ip_id === activeCampaignId);
    campaignCreators.sort((a, b) => new Date(a.planned_go_live_date) - new Date(b.planned_go_live_date));

    return campaignCreators.reduce((acc, creator) => {
      const month = creator.planned_go_live_month || 'Unscheduled';
      if (!acc[month]) acc[month] = [];
      acc[month].push(creator);
      return acc;
    }, {});
  };

  const NavItem = ({ id, icon: Icon, label }) => (
    <button 
      onClick={() => { setActiveTab(id); setActiveCampaignId(null); setSelectedCampaigns([]); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
        activeTab === id && !activeCampaignId
          ? 'bg-zinc-800/80 text-zinc-100 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]' 
          : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'
      }`}
    >
      <Icon size={16} className={activeTab === id && !activeCampaignId ? 'text-indigo-400' : ''} />
      {label}
    </button>
  );

  if (!isMounted) return <div className="h-screen w-full bg-[#09090b]"></div>;

  // --- LOGIN GATEKEEPER ---
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b] font-sans selection:bg-indigo-500/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#09090b] to-[#09090b]"></div>
        
        <div className="relative w-full max-w-md p-8 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-[0_0_20px_rgba(79,70,229,0.4)] flex items-center justify-center mb-4">
              <Lock size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Influencer OS</h1>
            <p className="text-sm text-zinc-500 mt-2">Sign in to access your workspace</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={16} className="text-zinc-500" />
                </div>
                <input 
                  type="email" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-black/50 border border-zinc-800 rounded-lg pl-10 pr-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors" 
                  placeholder="name@company.com"
                  required 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-zinc-500" />
                </div>
                <input 
                  type="password" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-black/50 border border-zinc-800 rounded-lg pl-10 pr-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors" 
                  placeholder="••••••••"
                  required 
                />
              </div>
            </div>

            {loginError && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 p-3 rounded-md border border-red-400/20">
                <AlertCircle size={14} /> {loginError}
              </div>
            )}

            <button 
              type="submit" 
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-all shadow-lg hover:shadow-indigo-500/25 mt-2"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- MAIN DASHBOARD RENDER ---
  return (
    <div className="flex h-screen bg-[#09090b] font-sans text-zinc-300 selection:bg-indigo-500/30">
      
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-zinc-800/60 bg-[#09090b] flex flex-col p-4 z-20">
        <div className="flex items-center gap-3 mb-10 px-2 mt-2">
          <div className="w-6 h-6 rounded bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-[0_0_12px_rgba(79,70,229,0.4)]"></div>
          <span className="font-semibold text-zinc-100 tracking-tight text-lg">Influencer OS</span>
        </div>
        <nav className="flex flex-col gap-1.5 flex-1">
          <NavItem id="campaigns" icon={FolderKanban} label="Campaigns" />
          <div className="h-px w-full bg-zinc-800/50 my-2"></div>
          <NavItem id="finance_vs_ops" icon={ArrowRightLeft} label="Finance vs Ops" />
          <NavItem id="payments" icon={CreditCard} label="Payments" />
          <NavItem id="bills" icon={Receipt} label="Bills" />
          <div className="h-px w-full bg-zinc-800/50 my-2"></div>
          <NavItem id="timeline" icon={CalendarDays} label="Timeline" />
          <NavItem id="reports" icon={BarChart3} label="Reports" />
        </nav>
      </aside>

      {/* MAIN CANVAS */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-900/40 via-[#09090b] to-[#09090b]">
        
        <header className="h-16 border-b border-zinc-800/60 flex items-center justify-between px-8 backdrop-blur-md bg-[#09090b]/80 z-10 sticky top-0">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-medium text-zinc-100 tracking-tight capitalize">
              {activeCampaignId ? 'Campaign Workspace' : activeTab.replace(/_/g, ' ')}
            </h1>
            <div className="h-4 w-px bg-zinc-800"></div>
            <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 rounded-md p-1 shadow-sm">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest pl-2">Filter Month:</span>
              <select 
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
                className="bg-transparent text-sm font-medium text-indigo-400 outline-none cursor-pointer pr-2"
              >
                {ALL_MONTHS.map(m => (
                  <option key={m} value={m}>{m} 2026</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex bg-zinc-900/80 border border-zinc-800 rounded-md p-1 shadow-sm">
              <button onClick={() => setCurrency('INR')} className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${currency === 'INR' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>INR</button>
              <button onClick={() => setCurrency('USD')} className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${currency === 'USD' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}>USD</button>
            </div>
            <div className="h-4 w-px bg-zinc-800"></div>
            <Search size={18} className="text-zinc-500 hover:text-zinc-300 cursor-pointer" />
            <Bell size={18} className="text-zinc-500 hover:text-zinc-300 cursor-pointer" />
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-300">TR</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 relative">
          
          {/* CAMPAIGNS GRID */}
          {activeTab === 'campaigns' && !activeCampaignId && (
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-semibold text-zinc-100 tracking-tight flex items-center gap-4">
                  Active Campaigns
                  {selectedCampaigns.length > 0 && (
                    <button 
                      onClick={handleExportCampaigns}
                      className="text-xs flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-full border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors"
                    >
                      <Download size={12} /> Export Selected ({selectedCampaigns.length})
                    </button>
                  )}
                </h2>
                <button 
                  onClick={() => { setEditingCampaign(null); setCampaignModalOpen(true); }}
                  className="bg-zinc-100 text-zinc-900 hover:bg-white px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors"
                >
                  <Plus size={16} /> New Campaign
                </button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map(camp => {
                  const campCreators = creators.filter(c => c.ip_id === camp.ip_id);
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
                      className={`bg-zinc-900/40 border p-5 rounded-xl transition-colors cursor-pointer group flex flex-col relative overflow-hidden ${isSelected ? 'border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'border-zinc-800/80 hover:border-zinc-700'}`}
                    >
                      {/* Selection Checkbox */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCampaigns(prev => prev.includes(camp.ip_id) ? prev.filter(id => id !== camp.ip_id) : [...prev, camp.ip_id]);
                        }}
                        className={`absolute top-4 left-4 z-10 p-1 rounded-md transition-opacity ${isSelected ? 'opacity-100 text-indigo-400' : 'opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-300'}`}
                      >
                        {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                      </button>

                      <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => openCampaignEdit(e, camp)} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded shadow-md transition-colors"><Edit2 size={14}/></button>
                        <button onClick={(e) => requestDelete(e, 'campaign', camp.ip_id, camp.ip_name)} className="p-1.5 bg-zinc-800 hover:bg-red-900/50 text-zinc-300 hover:text-red-400 rounded shadow-md transition-colors"><Trash2 size={14}/></button>
                      </div>

                      <div className="flex justify-between items-start mb-4 pl-8">
                        <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-indigo-400 transition-colors">
                          <FolderKanban size={20} />
                        </div>
                      </div>
                      <h3 className="text-lg font-medium text-zinc-200">{camp.ip_name}</h3>
                      <p className="text-sm text-zinc-500 mt-1">Owner: {camp.owner}</p>
                      
                      <div className="mt-5 pt-4 border-t border-zinc-800/50 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Booked Value</p>
                          <p className="text-sm font-medium text-zinc-200">{formatMoney(bookedValue)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Total Views</p>
                          <p className="text-sm font-medium text-zinc-200">{formatNumber(campViews)}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center gap-4 bg-zinc-950 rounded-lg p-2.5 border border-zinc-800/50">
                        <div className="flex-1">
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-0.5">Avg CPV</p>
                          <p className="text-xs font-semibold text-indigo-400">{formatMicroMoney(campCpv)}</p>
                        </div>
                        <div className="w-px h-6 bg-zinc-800"></div>
                        <div className="flex-1">
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-0.5">Avg CPE</p>
                          <p className="text-xs font-semibold text-emerald-400">{formatMicroMoney(campCpe)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SINGLE CAMPAIGN DETAIL */}
          {activeTab === 'campaigns' && activeCampaignId && (
             <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col gap-4 mb-6">
                <button 
                  onClick={() => setActiveCampaignId(null)}
                  className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors w-fit"
                >
                  <ArrowLeft size={16} /> Back to Campaigns
                </button>
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-semibold text-zinc-100 tracking-tight">
                      {campaigns.find(c => c.ip_id === activeCampaignId)?.ip_name}
                    </h2>
                    <p className="text-sm text-zinc-500 mt-1">Manage creator bookings, deliverables, and performance tracking.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setExportModal({ isOpen: true, type: 'ops' })}
                      className="bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors"
                    >
                      <Download size={16} /> Export Report
                    </button>
                    <button 
                      onClick={() => { setEditingCreator(null); setCreatorModalOpen(true); }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg"
                    >
                      <Plus size={16} /> Book Creator
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-[#09090b] rounded-xl border border-zinc-800/80 overflow-x-auto shadow-xl pb-16">
                 <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-zinc-900/50 text-zinc-500 border-b border-zinc-800/80">
                    <tr>
                      <th className="px-5 py-4 font-medium text-xs uppercase tracking-widest">Creator</th>
                      <th className="px-5 py-4 font-medium text-xs uppercase tracking-widest">Deliverable</th>
                      <th className="px-5 py-4 font-medium text-xs uppercase tracking-widest">Target Date</th>
                      <th className="px-5 py-4 font-medium text-xs uppercase tracking-widest">Performance</th>
                      <th className="px-5 py-4 font-medium text-xs uppercase tracking-widest">Efficiency</th>
                      <th className="px-5 py-4 font-medium text-xs uppercase tracking-widest">Spend (Fee)</th>
                      <th className="px-5 py-4 font-medium text-xs uppercase tracking-widest">Finance Bill</th>
                      <th className="px-5 py-4 font-medium text-xs uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  
                  {creators.filter(c => c.ip_id === activeCampaignId).length === 0 ? (
                    <tbody>
                      <tr><td colSpan="8" className="px-5 py-12 text-center text-zinc-600">No creators booked for this campaign yet.</td></tr>
                    </tbody>
                  ) : (
                    <tbody className="divide-y divide-zinc-800/50">
                      {Object.entries(getGroupedCreators()).map(([month, monthCreators]) => {
                        return (
                          <React.Fragment key={month}>
                            <tr className="bg-zinc-900/30">
                              <td colSpan="8" className="px-5 py-2.5">
                                <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-widest text-zinc-400">
                                  <span>{month} Delivery Target</span>
                                </div>
                              </td>
                            </tr>
                            {monthCreators.map((c) => {
                              const creatorBill = bills.find(b => b.creator_deal_id === c.creator_deal_id);
                              const metrics = calculateCreatorMetrics(c);

                              return (
                                <tr key={c.creator_deal_id} className="hover:bg-zinc-800/20 transition-colors group">
                                  <td className="px-5 py-4">
                                    <div className="flex flex-col">
                                      <span className="font-medium text-zinc-200">{c.creator_name}</span>
                                      <span className="text-xs text-zinc-500 mt-0.5">{formatNumber(c.followers)} foll</span>
                                    </div>
                                  </td>
                                  
                                  <td className="px-5 py-4">
                                    <div className="flex flex-col">
                                      <span className="text-zinc-300">{c.content_type}</span>
                                      {c.deliverable_link ? (
                                        <a href={c.deliverable_link.startsWith('http') ? c.deliverable_link : `https://${c.deliverable_link}`} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1">
                                          <LinkIcon size={12} /> View Live Post
                                        </a>
                                      ) : (
                                        <span className="text-xs text-zinc-600 italic mt-1">No link provided</span>
                                      )}
                                    </div>
                                  </td>

                                  <td className="px-5 py-4 text-zinc-400">{c.planned_go_live_date}</td>
                                  
                                  <td className="px-5 py-4">
                                    <div className="flex flex-col gap-1">
                                      <span className="text-zinc-200 font-medium">{formatNumber(c.views || 0)} <span className="text-zinc-600 text-xs font-normal">views</span></span>
                                      <span className="text-zinc-400 text-xs">{formatNumber(metrics.engagement)} <span className="text-zinc-600">engagements</span></span>
                                    </div>
                                  </td>

                                  <td className="px-5 py-4">
                                     <div className="flex flex-col gap-1">
                                      <span className="text-indigo-400 font-medium">{formatMicroMoney(metrics.cpv)} <span className="text-zinc-600 text-xs font-normal">CPV</span></span>
                                      <span className="text-emerald-400 text-xs font-medium">{formatMicroMoney(metrics.cpe)} <span className="text-zinc-600 font-normal">CPE</span></span>
                                    </div>
                                  </td>

                                  <td className="px-5 py-4">
                                    <div className="flex flex-col">
                                      <span className="font-medium text-zinc-200">{formatMoney(c.deal_value)}</span>
                                      <span className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">
                                        {c.payment_model.replace('_', ' ')}
                                      </span>
                                    </div>
                                  </td>

                                  <td className="px-5 py-4 text-zinc-400">
                                    {creatorBill ? creatorBill.invoice_date : <span className="text-zinc-600 italic">Pending</span>}
                                  </td>
                                  
                                  <td className="px-5 py-4 text-right">
                                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => { setEditingCreator(c); setCreatorModalOpen(true); }} className="text-zinc-500 hover:text-zinc-200"><Edit2 size={16} /></button>
                                      <button onClick={(e) => requestDelete(e, 'creator', c.creator_deal_id, c.creator_name)} className="text-zinc-500 hover:text-red-400"><Trash2 size={16} /></button>
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
             </div>
          )}

          {/* FINANCE VS OPS */}
          {activeTab === 'finance_vs_ops' && (
             <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-zinc-100 tracking-tight">Finance vs Ops Mismatch</h2>
                  <p className="text-sm text-zinc-500 mt-1 font-light">Resolving the timing gap between campaign execution and cash flow for {targetMonth}.</p>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setExportModal({ isOpen: true, type: 'finance' })}
                    className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
                  >
                    <Download size={16} /> Export Financials
                  </button>
                  {computations.variance !== 0 && (
                    <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-4 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium shadow-lg backdrop-blur-sm">
                      <AlertCircle size={16} className="text-indigo-400" />
                      Variance Detected: {formatMoney(Math.abs(computations.variance))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl overflow-hidden backdrop-blur-sm flex flex-col relative group">
                  <div className="p-5 border-b border-zinc-800/50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-zinc-500"></div>
                      <h3 className="font-medium text-zinc-200">Ops Budget ({targetMonth})</h3>
                    </div>
                    <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 border border-zinc-800 px-2 py-1 rounded bg-zinc-950">Counted by Go-Live</span>
                  </div>
                  <div className="p-6">
                    <p className="text-4xl font-light tracking-tight text-zinc-100">{formatMoney(computations.opsTotal)}</p>
                  </div>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl overflow-hidden backdrop-blur-sm flex flex-col relative group">
                  <div className="p-5 border-b border-zinc-800/50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      <h3 className="font-medium text-zinc-200">Finance Expense ({targetMonth})</h3>
                    </div>
                    <span className="text-[10px] font-medium uppercase tracking-widest text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded bg-indigo-500/10">Counted by Bill Date</span>
                  </div>
                  <div className="p-6">
                    <p className="text-4xl font-light tracking-tight text-zinc-100">{formatMoney(computations.financeTotal)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#09090b] rounded-xl border border-zinc-800/80 overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/50">
                  <h3 className="font-medium text-zinc-200">System Mismatch Intelligence</h3>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-900/30 text-zinc-500 border-b border-zinc-800/50">
                    <tr>
                      <th className="px-6 py-4 font-medium text-xs uppercase tracking-widest">Creator Booking</th>
                      <th className="px-6 py-4 font-medium text-xs uppercase tracking-widest">Mismatch Reason</th>
                      <th className="px-6 py-4 font-medium text-xs uppercase tracking-widest text-right">Impact for {targetMonth}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {computations.mismatchReasons.length > 0 ? computations.mismatchReasons.map((mr, i) => (
                      <tr key={i} className="hover:bg-zinc-800/20 transition-colors">
                        <td className="px-6 py-4 font-medium text-zinc-200">{mr.creator}</td>
                        <td className="px-6 py-4 text-zinc-400">{mr.reason}</td>
                        <td className="px-6 py-4 text-right font-medium text-indigo-400">{mr.impact}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="3" className="px-6 py-12 text-center text-zinc-600 font-light">Data is aligned. No timing gaps detected.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- OVERLAY MODALS --- */}

      {/* Date Range Export Modal */}
      {exportModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#09090b] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/30">
              <h3 className="font-medium text-zinc-100 flex items-center gap-2">
                <Download size={18} className={exportModal.type === 'finance' ? 'text-emerald-400' : 'text-indigo-400'}/> 
                Export {exportModal.type === 'finance' ? 'Finance' : 'Ops'} Report
              </h3>
              <button type="button" onClick={() => setExportModal({ isOpen: false, type: '' })} className="text-zinc-500 hover:text-zinc-300">Close</button>
            </div>
            <form onSubmit={executeAdvancedExport} className="p-6 space-y-5">
              
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <p className="text-xs text-zinc-400 mb-3">
                  {exportModal.type === 'finance' 
                    ? 'Finance reports filter creators strictly by their Invoice Bill Date, regardless of when they post.' 
                    : 'Ops reports filter creators strictly by their Target Go-Live Date, regardless of when they are billed.'}
                </p>
                
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-2 font-medium">Select Range Type</label>
                <select name="filter_type" defaultValue="month" className="w-full bg-black/50 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 mb-4" onChange={(e) => {
                  document.getElementById('custom-date-row').style.display = e.target.value === 'custom' ? 'grid' : 'none';
                }}>
                  <option value="month">Current Filtered Month ({targetMonth})</option>
                  <option value="custom">Custom Date Range</option>
                  <option value="all">All Available Data</option>
                </select>

                <div id="custom-date-row" className="grid-cols-2 gap-4 hidden">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Start Date</label>
                    <input name="start_date" type="date" className="w-full bg-black/50 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 [color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">End Date</label>
                    <input name="end_date" type="date" className="w-full bg-black/50 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 [color-scheme:dark]" />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button type="submit" className={`px-6 py-2.5 text-white text-sm font-semibold rounded-md transition-colors shadow-lg ${exportModal.type === 'finance' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}>
                  Download CSV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#09090b] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/30">
              <h3 className="font-medium text-zinc-100">{editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}</h3>
              <button type="button" onClick={() => { setCampaignModalOpen(false); setEditingCampaign(null); }} className="text-zinc-500 hover:text-zinc-300">Close</button>
            </div>
            <form onSubmit={handleSaveCampaign} className="p-6 space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Campaign Name</label>
                <input name="campaign_name" defaultValue={editingCampaign?.ip_name} required className="w-full bg-zinc-900/50 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Owner</label>
                <input name="owner" defaultValue={editingCampaign?.owner} required className="w-full bg-zinc-900/50 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Total Budget</label>
                <input name="budget" type="number" defaultValue={editingCampaign?.budget} required className="w-full bg-zinc-900/50 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="submit" className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-900 text-sm font-medium rounded-md transition-colors">
                  {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCreatorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#09090b] border border-zinc-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/30 shrink-0">
              <h3 className="font-medium text-zinc-100">{editingCreator ? 'Edit Creator Booking' : 'Book Creator'}</h3>
              <button type="button" onClick={() => {setCreatorModalOpen(false); setEditingCreator(null);}} className="text-zinc-500 hover:text-zinc-300">Close</button>
            </div>
            
            <form onSubmit={handleSaveCreator} className="flex flex-col overflow-hidden">
              <div className="p-6 space-y-6 overflow-y-auto">
                
                <div>
                  <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-widest border-b border-zinc-800 pb-2 mb-4">Core Profile</h4>
                  <div className="grid grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Creator Name</label>
                      <input name="creator_name" defaultValue={editingCreator?.creator_name} required className="w-full bg-zinc-900/50 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Platform</label>
                      <select name="platform" defaultValue={editingCreator?.platform || 'Instagram'} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500">
                        <option>Instagram</option>
                        <option>YouTube</option>
                        <option>TikTok</option>
                        <option>LinkedIn</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Profile Link</label>
                      <input name="profile_link" defaultValue={editingCreator?.profile_link} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" placeholder="instagram.com/username" />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-widest border-b border-zinc-800 pb-2 mb-4">Deal Details</h4>
                  <div className="grid grid-cols-4 gap-5">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Spend / Fee</label>
                      <input name="deal_value" type="number" required defaultValue={editingCreator?.deal_value} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Payment Model</label>
                      <select name="payment_model" defaultValue={editingCreator?.payment_model || '100_advance'} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500">
                        <option value="100_advance">100% Advance</option>
                        <option value="50_50">50-50 Split</option>
                        <option value="full_later">Full Post-Live</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Target Go-Live Date</label>
                      <input name="planned_go_live_date" type="date" required defaultValue={editingCreator?.planned_go_live_date} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 [color-scheme:dark]" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Finance Bill Date</label>
                      <input name="invoice_date" type="date" required defaultValue={editingCreator ? getCreatorBillDate(editingCreator.creator_deal_id) : ''} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 [color-scheme:dark]" />
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/30 p-5 rounded-xl border border-zinc-800/50">
                  <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-3">
                    <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">Live Performance Tracking</h4>
                    <button 
                      type="button" 
                      onClick={handleAutoSync}
                      disabled={isSyncing}
                      className="flex items-center gap-2 text-[10px] uppercase tracking-widest bg-indigo-600/20 text-indigo-400 px-3 py-1.5 rounded-full border border-indigo-500/20 hover:bg-indigo-600/30 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
                      {isSyncing ? "Syncing Simulator..." : "Auto-Sync Simulator"}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-5 mb-5">
                     <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Deliverable Link (URL)</label>
                      <input name="deliverable_link" defaultValue={editingCreator?.deliverable_link} className="w-full bg-black/40 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" placeholder="https://instagram.com/p/..." />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Content Type</label>
                        <select name="content_type" defaultValue={editingCreator?.content_type || 'Reel Collab'} className="w-full bg-black/40 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500">
                          <option>Reel Collab</option>
                          <option>Story (Set of 3)</option>
                          <option>Dedicated Video</option>
                          <option>YT Integration</option>
                          <option>Shorts</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Followers</label>
                        <input name="followers" type="number" defaultValue={editingCreator?.followers} className="w-full bg-black/40 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5 font-medium text-indigo-300">Views</label>
                      <input name="views" type="number" defaultValue={editingCreator?.views} className="w-full bg-indigo-950/20 border border-indigo-900/50 rounded-md px-3 py-2 text-sm text-indigo-200 focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Likes</label>
                      <input name="likes" type="number" defaultValue={editingCreator?.likes} className="w-full bg-black/40 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Comments</label>
                      <input name="comments" type="number" defaultValue={editingCreator?.comments} className="w-full bg-black/40 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Shares</label>
                      <input name="shares" type="number" defaultValue={editingCreator?.shares} className="w-full bg-black/40 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Saves</label>
                      <input name="saves" type="number" defaultValue={editingCreator?.saves} className="w-full bg-black/40 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" />
                    </div>
                  </div>
                </div>

              </div>
              <div className="p-5 border-t border-zinc-800 flex justify-end shrink-0 bg-zinc-900/30">
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-md transition-colors shadow-lg">
                  {editingCreator ? 'Update Creator Booking' : 'Save Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletePrompt.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#09090b] border border-red-900/50 rounded-2xl w-full max-w-sm shadow-[0_0_40px_rgba(220,38,38,0.15)] overflow-hidden">
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-medium text-zinc-100 mb-2">Delete {deletePrompt.type === 'campaign' ? 'Campaign' : 'Creator'}?</h3>
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                You are about to delete <strong>{deletePrompt.name}</strong>. This action will permanently remove all associated data, including financial records and billing history. This cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setDeletePrompt({ isOpen: false, type: '', id: '', name: '' })} className="flex-1 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-sm font-medium rounded-md transition-colors">
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