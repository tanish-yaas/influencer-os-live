"use client";
import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState('campaigns');
  const [activeCampaignId, setActiveCampaignId] = useState(null);
  const [targetMonth, setTargetMonth] = useState('May');
  
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
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginEmail === 'collab@yaas.studio' && loginPassword === 'influencermarketing@yaas') {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid email or password.');
    }
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

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { campaigns: [], creators: [] };
    const q = searchQuery.toLowerCase();
    return {
      campaigns: campaigns.filter(c => c.ip_name.toLowerCase().includes(q) || c.owner.toLowerCase().includes(q)),
      creators: creators.filter(c => c.creator_name.toLowerCase().includes(q))
    };
  }, [searchQuery, campaigns, creators]);

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
        
        if (data.metrics.followers && data.metrics.followers > 0) {
          document.querySelector('input[name="followers"]').value = data.metrics.followers;
        }

        setCreators(prev => prev.map(c => c.creator_deal_id === editingCreator?.creator_deal_id ? { ...c, ...data.metrics } : c));
        setEditingCreator(prev => prev ? { ...prev, ...data.metrics } : null);
      } else {
        alert("Failed to sync metrics: " + data.error);
      }
    } catch (err) {
      alert("A network error occurred while syncing.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBulkAutoSync = async () => {
    const creatorsWithLinks = creators.filter(c => c.deliverable_link && c.deliverable_link.trim() !== '');
    if (creatorsWithLinks.length === 0) {
      alert("No creators found across any campaign with valid live deliverable links.");
      return;
    }

    setIsBulkSyncing(true);
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
        console.error(`Error processing background bulk pipeline execution for ${creator.creator_name}:`, err);
      }
    }

    setCreators(localCreatorsState);
    setIsBulkSyncing(false);
    alert(`Bulk Synchronization Complete! Successfully matched and updated numbers for ${successfulSyncs} out of ${creatorsWithLinks.length} total active placements.`);
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

  const NavItem = ({ id, icon: Icon, label }) => {
    const active = activeTab === id && !activeCampaignId;
    return (
      <button 
        onClick={() => { setActiveTab(id); setActiveCampaignId(null); setSelectedCampaigns([]); }}
        className={`group w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 relative ${
          active
            ? 'bg-orange-500/10 text-orange-200 border border-orange-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_24px_-8px_rgba(249,115,22,0.5)]' 
            : 'text-stone-500 border border-transparent hover:text-stone-300 hover:bg-white/[0.03]'
        }`}
      >
        {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] rounded-full bg-orange-500 shadow-[0_0_10px_2px_rgba(249,115,22,0.7)]"></span>}
        <Icon className={active ? 'text-orange-400' : 'text-stone-500 group-hover:text-stone-300'} size={16}/>
        {label}
      </button>
    );
  };

  if (!isMounted) return <div className="h-screen w-full bg-[#0a0807]"></div>;

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0807] font-sans selection:bg-orange-500/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-600/15 via-[#0a0807] to-[#0a0807]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-orange-900/10 via-transparent to-transparent"></div>

        <div className="relative w-full max-w-md p-8 bg-white/[0.03] border border-white/[0.08] rounded-2xl shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-[0_0_28px_rgba(249,115,22,0.55)] flex items-center justify-center mb-4">
              <Lock className="text-white" size={24}/>
            </div>
            <h1 className="text-2xl font-bold text-stone-100 tracking-tight">Influencer OS</h1>
            <p className="text-sm text-stone-500 mt-2">Sign in to access your workspace</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="text-stone-500" size={16}/>
                </div>
                <input 
                  type="email" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70 transition-colors" 
                  placeholder="name@company.com"
                  required 
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-stone-500" size={16}/>
                </div>
                <input 
                  type="password" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70 transition-colors" 
                  placeholder="••••••••"
                  required 
                />
              </div>
            </div>

            {loginError && (
              <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 p-3 rounded-md border border-red-400/20">
                <AlertCircle size={14}/> {loginError}
              </div>
            )}

            <button 
              type="submit" 
              className="w-full py-3 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold rounded-lg transition-all shadow-[0_0_24px_-4px_rgba(249,115,22,0.6)] hover:shadow-[0_0_30px_-2px_rgba(249,115,22,0.75)] mt-2"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0807] font-sans text-stone-300 selection:bg-orange-500/30">
      <aside className="w-64 border-r border-white/[0.06] bg-[#0a0807] flex flex-col p-4 z-20">
        <div className="flex items-center gap-3 mb-10 px-2 mt-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-orange-500 to-amber-600 shadow-[0_0_14px_rgba(249,115,22,0.6)]"></div>
          <span className="font-semibold text-stone-100 tracking-tight text-lg">Influencer OS</span>
        </div>
        <nav className="flex flex-col gap-1.5 flex-1">
          <NavItem icon={FolderKanban} id="campaigns" label="Campaigns"/>
          <div className="h-px w-full bg-white/[0.06] my-2"></div>
          <NavItem icon={ArrowRightLeft} id="finance_vs_ops" label="Finance vs Ops"/>
          <NavItem icon={CreditCard} id="payments" label="Payments"/>
          <NavItem icon={Receipt} id="bills" label="Bills"/>
          <div className="h-px w-full bg-white/[0.06] my-2"></div>
          <NavItem icon={CalendarDays} id="timeline" label="Timeline"/>
          <NavItem icon={BarChart3} id="reports" label="Reports"/>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-900/15 via-[#0a0807] to-[#0a0807]">
        
        <header className="h-16 border-b border-white/[0.06] flex items-center justify-between px-8 backdrop-blur-md bg-[#0a0807]/80 z-10 sticky top-0 shadow-[0_1px_0_rgba(249,115,22,0.08)]">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-medium text-stone-100 tracking-tight capitalize">
              {activeCampaignId ? 'Campaign Workspace' : activeTab.replace(/_/g, ' ')}
            </h1>
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
                  placeholder="Search campaigns or creators..."
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

                    {searchResults.campaigns.length === 0 && searchResults.creators.length === 0 && (
                      <div className="p-4 text-center text-sm text-stone-500">
                        No results found for "{searchQuery}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-white/10"></div>
            <Bell className="text-stone-500 hover:text-stone-300 cursor-pointer" size={18}/>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500/30 to-amber-600/20 border border-orange-500/30 flex items-center justify-center text-xs font-medium text-orange-200">TR</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 relative">
          
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
                  <button 
                    onClick={handleBulkAutoSync}
                    disabled={isBulkSyncing}
                    className="bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] text-stone-300 px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={isBulkSyncing ? "animate-spin text-orange-400" : "text-orange-400"} size={16}/>
                    {isBulkSyncing ? "Bulk Syncing Data..." : "Bulk Sync All IPs"}
                  </button>

                  <button 
                    onClick={() => { setEditingCampaign(null); setCampaignModalOpen(true); }}
                    className="bg-orange-500 text-white hover:bg-orange-400 px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors shadow-[0_0_22px_-6px_rgba(249,115,22,0.7)]"
                  >
                    <Plus size={16}/> New Campaign
                  </button>
                </div>
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

                      <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => openCampaignEdit(e, camp)} className="p-1.5 bg-white/[0.05] hover:bg-white/[0.1] text-stone-300 rounded shadow-md transition-colors"><Edit2 size={14}/></button>
                        <button onClick={(e) => requestDelete(e, 'campaign', camp.ip_id, camp.ip_name)} className="p-1.5 bg-white/[0.05] hover:bg-red-900/50 text-stone-300 hover:text-red-400 rounded shadow-md transition-colors"><Trash2 size={14}/></button>
                      </div>

                      <div className="flex justify-between items-start mb-4 pl-8">
                        <div className="w-10 h-10 rounded bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-stone-400 group-hover:text-orange-400 group-hover:border-orange-500/30 transition-colors">
                          <FolderKanban size={20}/>
                        </div>
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
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-semibold text-stone-100 tracking-tight">
                      {campaigns.find(c => c.ip_id === activeCampaignId)?.ip_name}
                    </h2>
                    <p className="text-sm text-stone-500 mt-1">Manage creator bookings, deliverables, and performance tracking.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setExportModal({ isOpen: true, type: 'ops' })}
                      className="bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] text-stone-300 px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors"
                    >
                      <Download size={16}/> Export Report
                    </button>
                    <button 
                      onClick={() => { setEditingCreator(null); setCreatorModalOpen(true); }}
                      className="bg-orange-500 hover:bg-orange-400 text-white px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors shadow-[0_0_22px_-6px_rgba(249,115,22,0.7)]"
                    >
                      <Plus size={16}/> Book Creator
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-[#0c0a08] rounded-xl border border-white/[0.07] overflow-x-auto shadow-xl pb-16">
                 <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white/[0.02] text-stone-500 border-b border-white/[0.07]">
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
                  
                  {creators.filter(c => c.ip_id === activeCampaignId).length === 0 ? (
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

                              return (
                                <tr key={c.creator_deal_id} className="hover:bg-white/[0.025] transition-colors group">
                                  <td className="px-5 py-4">
                                    <div className="flex flex-col">
                                      <span className="font-medium text-stone-200">{c.creator_name}</span>
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
                                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => { setEditingCreator(c); setCreatorModalOpen(true); }} className="text-stone-500 hover:text-orange-400"><Edit2 size={16}/></button>
                                      <button onClick={(e) => requestDelete(e, 'creator', c.creator_deal_id, c.creator_name)} className="text-stone-500 hover:text-red-400"><Trash2 size={16}/></button>
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
        </div>
      </main>

      {/* Date Range Export Modal */}
      {exportModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0c0a08] border border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/[0.07] flex justify-between items-center bg-white/[0.02]">
              <h3 className="font-medium text-stone-100 flex items-center gap-2">
                <Download className={exportModal.type === 'finance' ? 'text-orange-400' : 'text-orange-400'} size={18}/> 
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
              <button type="button" onClick={() => { setCampaignModalOpen(false); setEditingCampaign(null); }} className="text-stone-500 hover:text-stone-300">Close</button>
            </div>
            <form onSubmit={handleSaveCampaign} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Campaign Name</label>
                <input name="campaign_name" defaultValue={editingCampaign?.ip_name} required className="w-full bg-white/[0.03] border border-white/10 rounded-md px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Owner</label>
                <input name="owner" defaultValue={editingCampaign?.owner} required className="w-full bg-white/[0.03] border border-white/10 rounded-md px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70" />
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
                      <select name="platform" defaultValue={editingCreator?.platform || 'Instagram'} className="w-full bg-white/[0.03] border border-white/10 rounded-md px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70">
                        <option className="bg-[#0c0a08]">Instagram</option>
                        <option className="bg-[#0c0a08]">YouTube</option>
                        <option className="bg-[#0c0a08]">TikTok</option>
                        <option className="bg-[#0c0a08]">LinkedIn</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Profile Link</label>
                      <input name="profile_link" defaultValue={editingCreator?.profile_link} className="w-full bg-white/[0.03] border border-white/10 rounded-md px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70" placeholder="instagram.com/username" />
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
                      <input name="deliverable_link" defaultValue={editingCreator?.deliverable_link} className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70" placeholder="https://instagram.com/p/..." />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Content Type</label>
                        <select name="content_type" defaultValue={editingCreator?.content_type || 'Reel Collab'} className="w-full bg-black/40 border border-white/10 rounded-md px-3 py-2.5 text-sm text-stone-200 focus:outline-none focus:border-orange-500/70">
                          <option className="bg-[#0c0a08]">Reel Collab</option>
                          <option className="bg-[#0c0a08]">Story (Set of 3)</option>
                          <option className="bg-[#0c0a08]">Dedicated Video</option>
                          <option className="bg-[#0c0a08]">YT Integration</option>
                          <option className="bg-[#0c0a08]">Shorts</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-1.5 font-medium">Followers</label>
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
