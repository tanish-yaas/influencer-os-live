"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  FolderKanban, Users, ArrowRightLeft, 
  CreditCard, Receipt, CalendarDays, BarChart3, Plus, 
  Search, Bell, AlertCircle, ArrowLeft, 
  Edit2, Trash2, ExternalLink, AlertTriangle
} from 'lucide-react';

// Connect to the Live Database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const ALL_MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

export default function InfluencerOS() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('campaigns');
  const [activeCampaignId, setActiveCampaignId] = useState(null);
  
  // Global Controls
  const [globalLens, setGlobalLens] = useState('planned_go_live_month');
  const [targetMonth, setTargetMonth] = useState('April');
  const [currency, setCurrency] = useState('INR');
  
  // App Data State
  const [campaigns, setCampaigns] = useState([]);
  const [creators, setCreators] = useState([]);
  const [bills, setBills] = useState([]);

  // Modals & Forms State
  const [isCampaignModalOpen, setCampaignModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  
  const [isCreatorModalOpen, setCreatorModalOpen] = useState(false);
  const [editingCreator, setEditingCreator] = useState(null);

  // Delete Prompt State
  const [deletePrompt, setDeletePrompt] = useState({ isOpen: false, type: '', id: '', name: '' });

  // System State
  const [isMounted, setIsMounted] = useState(false);

  // --- SUPABASE DATABASE ENGINE ---
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

  // Helpers
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  // CORE LOGIC ENGINE
  const computations = useMemo(() => {
    let opsTotal = 0;
    let financeTotal = 0;
    let mismatchReasons = [];

    const opsDeals = creators.filter(c => c[globalLens] === targetMonth);
    opsTotal = opsDeals.reduce((sum, c) => sum + Number(c.deal_value), 0);

    const finBills = bills.filter(b => b.invoice_month === targetMonth);
    financeTotal = finBills.reduce((sum, b) => sum + Number(b.invoice_amount), 0);

    const variance = financeTotal - opsTotal;

    creators.forEach(c => {
      const bill = bills.find(b => b.creator_deal_id === c.creator_deal_id);
      
      if (bill?.invoice_month === targetMonth && c.planned_go_live_month !== targetMonth) {
        mismatchReasons.push({
          creator: c.creator_name,
          reason: `Full bill raised in ${bill.invoice_month}, but live post planned for ${c.planned_go_live_month}.`,
          impact: `+${formatMoney(bill.invoice_amount)}`,
        });
      }
      
      if (c.planned_go_live_month === targetMonth && c.payment_model === 'full_later') {
         mismatchReasons.push({
          creator: c.creator_name,
          reason: `Full later booking; budget recognized in ${targetMonth}, but payment scheduled after live.`,
          impact: `Pending`,
        });
      }
    });

    return { opsTotal, financeTotal, variance, mismatchReasons };
  }, [creators, bills, globalLens, targetMonth, currency]);

  // --- CRUD ACTIONS: CAMPAIGNS ---
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

  // --- CRUD ACTIONS: CREATORS ---
  const handleSaveCreator = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const goLiveDate = formData.get('planned_go_live_date');
    const goLiveMonth = new Date(goLiveDate).toLocaleString('default', { month: 'long' }) || targetMonth;
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
      views: parseInt(formData.get('views')) || 0,
      payment_model: formData.get('payment_model'),
      creator_status: 'booked'
    };

    if (editingCreator) {
      setCreators(creators.map(c => c.creator_deal_id === creatorData.creator_deal_id ? creatorData : c));
      await supabase.from('creators').update(creatorData).eq('creator_deal_id', creatorData.creator_deal_id);
    } else {
      setCreators([...creators, creatorData]);
      await supabase.from('creators').insert([creatorData]);
      
      const today = new Date().toISOString().split('T')[0];
      const billData = {
        invoice_id: `inv_${creatorData.creator_deal_id}`,
        creator_deal_id: creatorData.creator_deal_id,
        invoice_amount: dealValue,
        invoice_date: today,
        invoice_month: targetMonth,
        status: 'processed'
      };
      
      setBills([...bills, billData]);
      await supabase.from('bills').insert([billData]);
    }
    
    setCreatorModalOpen(false);
    setEditingCreator(null);
  };

  // --- DESTRUCTIVE ACTIONS ENGINE ---
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
    }
    setDeletePrompt({ isOpen: false, type: '', id: '', name: '' });
  };

  // --- TABULATION ENGINE ---
  const getGroupedCreators = () => {
    const campaignCreators = creators.filter(c => c.ip_id === activeCampaignId);
    campaignCreators.sort((a, b) => new Date(a.planned_go_live_date) - new Date(b.planned_go_live_date));

    const grouped = campaignCreators.reduce((acc, creator) => {
      const month = creator.planned_go_live_month || 'Unscheduled';
      if (!acc[month]) acc[month] = [];
      acc[month].push(creator);
      return acc;
    }, {});

    return grouped;
  };

  // NAVIGATION COMPONENT
  const NavItem = ({ id, icon: Icon, label }) => (
    <button 
      onClick={() => { setActiveTab(id); setActiveCampaignId(null); }}
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
        
        {/* TOP COMMAND BAR */}
        <header className="h-16 border-b border-zinc-800/60 flex items-center justify-between px-8 backdrop-blur-md bg-[#09090b]/80 z-10 sticky top-0">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-medium text-zinc-100 tracking-tight capitalize">
              {activeCampaignId ? 'Campaign Workspace' : activeTab.replace(/_/g, ' ')}
            </h1>
            
            <div className="h-4 w-px bg-zinc-800"></div>
            
            <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 rounded-md p-1 shadow-sm">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest pl-2">Lens:</span>
              <select 
                value={globalLens}
                onChange={(e) => setGlobalLens(e.target.value)}
                className="bg-transparent text-sm font-medium text-zinc-200 outline-none cursor-pointer pl-2 pr-4"
              >
                <option value="closed_month">Booked Month</option>
                <option value="planned_go_live_month">Planned Live Month</option>
                <option value="invoice_month">Bill Month</option>
              </select>
              <div className="h-3 w-px bg-zinc-700 mx-1"></div>
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

        {/* SCROLLABLE WORKSPACE */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          
          {/* VIEW: CAMPAIGNS GRID */}
          {activeTab === 'campaigns' && !activeCampaignId && (
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-semibold text-zinc-100 tracking-tight">Active Campaigns</h2>
                <button 
                  onClick={() => { setEditingCampaign(null); setCampaignModalOpen(true); }}
                  className="bg-zinc-100 text-zinc-900 hover:bg-white px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors"
                >
                  <Plus size={16} /> New Campaign
                </button>
              </div>
              <div className="grid grid-cols-3 gap-6">
                {campaigns.map(camp => {
                  const campCreators = creators.filter(c => c.ip_id === camp.ip_id);
                  const bookedValue = campCreators.reduce((sum, c) => sum + Number(c.deal_value), 0);

                  return (
                    <div 
                      key={camp.ip_id} 
                      onClick={() => setActiveCampaignId(camp.ip_id)}
                      className="bg-zinc-900/40 border border-zinc-800/80 p-5 rounded-xl hover:border-zinc-700 transition-colors cursor-pointer group flex flex-col relative overflow-hidden"
                    >
                      {/* Action Hover Strip */}
                      <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => openCampaignEdit(e, camp)} className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded shadow-md transition-colors"><Edit2 size={14}/></button>
                        <button onClick={(e) => requestDelete(e, 'campaign', camp.ip_id, camp.ip_name)} className="p-1.5 bg-zinc-800 hover:bg-red-900/50 text-zinc-300 hover:text-red-400 rounded shadow-md transition-colors"><Trash2 size={14}/></button>
                      </div>

                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-indigo-400 transition-colors">
                          <FolderKanban size={20} />
                        </div>
                      </div>
                      <h3 className="text-lg font-medium text-zinc-200">{camp.ip_name}</h3>
                      <p className="text-sm text-zinc-500 mt-1">Owner: {camp.owner}</p>
                      
                      <div className="mt-6 pt-4 border-t border-zinc-800/50 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Creators</p>
                          <p className="text-sm font-medium text-zinc-200">{campCreators.length}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Booked Value</p>
                          <p className="text-sm font-medium text-zinc-200">{formatMoney(bookedValue)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {campaigns.length === 0 && (
                  <div className="col-span-3 py-16 text-center border border-dashed border-zinc-800 rounded-xl">
                    <p className="text-zinc-500 mb-4">No active campaigns.</p>
                    <button onClick={() => { setEditingCampaign(null); setCampaignModalOpen(true); }} className="text-indigo-400 hover:text-indigo-300 font-medium text-sm">Create your first campaign &rarr;</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: SINGLE CAMPAIGN DETAIL */}
          {activeTab === 'campaigns' && activeCampaignId && (
             <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
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
                    <p className="text-sm text-zinc-500 mt-1">Manage creator bookings and deliverables for this campaign.</p>
                  </div>
                  <button 
                    onClick={() => { setEditingCreator(null); setCreatorModalOpen(true); }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-colors"
                  >
                    <Plus size={16} /> Book Creator
                  </button>
                </div>
              </div>

              <div className="bg-[#09090b] rounded-xl border border-zinc-800/80 overflow-x-auto shadow-xl pb-16">
                 <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-zinc-900/50 text-zinc-500 border-b border-zinc-800/80">
                    <tr>
                      <th className="px-5 py-4 font-medium text-xs uppercase tracking-widest">Creator Profile</th>
                      <th className="px-5 py-4 font-medium text-xs uppercase tracking-widest">Deliverable Type</th>
                      <th className="px-5 py-4 font-medium text-xs uppercase tracking-widest">Target Date</th>
                      <th className="px-5 py-4 font-medium text-xs uppercase tracking-widest">Reach / Views</th>
                      <th className="px-5 py-4 font-medium text-xs uppercase tracking-widest">Spend (Fee)</th>
                      <th className="px-5 py-4 font-medium text-xs uppercase tracking-widest">Bill Date</th>
                      <th className="px-5 py-4 font-medium text-xs uppercase tracking-widest">Payment terms</th>
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
                        const monthTotal = monthCreators.reduce((sum, c) => sum + Number(c.deal_value), 0);
                        
                        return (
                          <React.Fragment key={month}>
                            <tr className="bg-zinc-900/30">
                              <td colSpan="8" className="px-5 py-2.5">
                                <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-widest">
                                  <span className="text-zinc-400">{month} Delivery Target</span>
                                  <span className="text-zinc-500">
                                    <span className="text-zinc-300">{monthCreators.length}</span> Creators • Total: <span className="text-indigo-400">{formatMoney(monthTotal)}</span>
                                  </span>
                                </div>
                              </td>
                            </tr>
                            {monthCreators.map((c) => {
                              const creatorBill = bills.find(b => b.creator_deal_id === c.creator_deal_id);
                              return (
                                <tr key={c.creator_deal_id} className="hover:bg-zinc-800/20 transition-colors group">
                                  <td className="px-5 py-4">
                                    <div className="flex flex-col">
                                      <span className="font-medium text-zinc-200">{c.creator_name}</span>
                                      <a href={`https://${c.profile_link}`} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-0.5">
                                        {c.platform} <ExternalLink size={10} />
                                      </a>
                                    </div>
                                  </td>
                                  <td className="px-5 py-4 text-zinc-300">{c.content_type}</td>
                                  <td className="px-5 py-4 text-zinc-400">{c.planned_go_live_date}</td>
                                  <td className="px-5 py-4">
                                    <div className="flex flex-col">
                                      <span className="text-zinc-300">{formatNumber(c.followers)} <span className="text-zinc-600 text-xs">foll</span></span>
                                      <span className="text-zinc-500 text-xs mt-0.5">{formatNumber(c.views)} <span className="text-zinc-600">est. views</span></span>
                                    </div>
                                  </td>
                                  <td className="px-5 py-4">
                                    <div className="flex flex-col">
                                      <span className="font-medium text-zinc-200">{formatMoney(c.deal_value)}</span>
                                      {c.payment_model === '50_50' && (
                                        <span className="text-[10px] text-zinc-500 mt-1 tracking-wider border-t border-zinc-800 pt-1 w-max">
                                          {formatMoney(c.deal_value / 2)} <span className="text-zinc-700">/</span> {formatMoney(c.deal_value / 2)}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-5 py-4 text-zinc-400">
                                    {creatorBill ? creatorBill.invoice_date : <span className="text-zinc-600 italic">Pending</span>}
                                  </td>
                                  <td className="px-5 py-4">
                                    <span className="text-[10px] uppercase tracking-widest bg-zinc-800/80 text-zinc-400 px-2 py-1 rounded border border-zinc-700">
                                      {c.payment_model.replace('_', ' ')}
                                    </span>
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

          {/* VIEW: FINANCE VS OPS */}
          {activeTab === 'finance_vs_ops' && (
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
              
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-zinc-100 tracking-tight">Finance vs Ops</h2>
                  <p className="text-sm text-zinc-500 mt-1 font-light">Resolving the timing gap between campaign execution and cash flow.</p>
                </div>
                {computations.variance !== 0 && (
                  <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-4 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium shadow-lg backdrop-blur-sm">
                    <AlertCircle size={16} className="text-indigo-400" />
                    Billing vs Live Gap: Finance booked {formatMoney(Math.abs(computations.variance))} higher than Ops budget.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl overflow-hidden backdrop-blur-sm flex flex-col relative group">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="p-5 border-b border-zinc-800/50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-zinc-500"></div>
                      <h3 className="font-medium text-zinc-200">Operations Target</h3>
                    </div>
                    <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 border border-zinc-800 px-2 py-1 rounded bg-zinc-950">Expected Execution</span>
                  </div>
                  <div className="p-6">
                    <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider font-medium">Ops Budget ({globalLens.replace(/_/g, ' ')})</p>
                    <p className="text-4xl font-light tracking-tight text-zinc-100">{formatMoney(computations.opsTotal)}</p>
                  </div>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl overflow-hidden backdrop-blur-sm flex flex-col relative group">
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="p-5 border-b border-zinc-800/50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      <h3 className="font-medium text-zinc-200">Finance Booked</h3>
                    </div>
                    <span className="text-[10px] font-medium uppercase tracking-widest text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded bg-indigo-500/10">Bills Processed</span>
                  </div>
                  <div className="p-6">
                    <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider font-medium">Billed Amount (Bill Month)</p>
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
                      <th className="px-6 py-4 font-medium text-xs uppercase tracking-widest text-right">Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {computations.mismatchReasons.length > 0 ? computations.mismatchReasons.map((mr, i) => (
                      <tr key={i} className="hover:bg-zinc-800/20 transition-colors">
                        <td className="px-6 py-4 text-zinc-200">{mr.creator}</td>
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
                <input name="campaign_name" defaultValue={editingCampaign?.ip_name} required className="w-full bg-zinc-900/50 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" placeholder="e.g. Summer Launch" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Owner</label>
                <input name="owner" defaultValue={editingCampaign?.owner} required className="w-full bg-zinc-900/50 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" placeholder="Owner Name" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Total Budget</label>
                <input name="budget" type="number" defaultValue={editingCampaign?.budget} required className="w-full bg-zinc-900/50 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" placeholder="1500000" />
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
          <div className="bg-[#09090b] border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/30">
              <h3 className="font-medium text-zinc-100">{editingCreator ? 'Edit Creator Booking' : 'Book Creator'}</h3>
              <button type="button" onClick={() => {setCreatorModalOpen(false); setEditingCreator(null);}} className="text-zinc-500 hover:text-zinc-300">Close</button>
            </div>
            <form onSubmit={handleSaveCreator} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Creator Name</label>
                  <input name="creator_name" defaultValue={editingCreator?.creator_name} required className="w-full bg-zinc-900/50 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" placeholder="Creator Name" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Profile Link</label>
                  <input name="profile_link" defaultValue={editingCreator?.profile_link} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" placeholder="instagram.com/username" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-5">
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
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Content Type</label>
                  <select name="content_type" defaultValue={editingCreator?.content_type || 'Reel Collab'} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500">
                    <option>Reel Collab</option>
                    <option>Story (Set of 3)</option>
                    <option>Dedicated Video</option>
                    <option>YT Integration</option>
                    <option>Shorts</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Followers</label>
                  <input name="followers" type="number" defaultValue={editingCreator?.followers} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" placeholder="e.g. 150000" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Spend / Fee</label>
                  <input name="deal_value" type="number" required defaultValue={editingCreator?.deal_value} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" placeholder="Amount" />
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
                  <label className="block text-xs uppercase tracking-widest text-zinc-500 mb-1.5 font-medium">Planned Go-Live</label>
                  <input name="planned_go_live_date" type="date" required defaultValue={editingCreator?.planned_go_live_date} className="w-full bg-zinc-900/50 border border-zinc-800 rounded-md px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 [color-scheme:dark]" />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
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