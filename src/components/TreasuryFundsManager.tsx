import React, { useState } from 'react';
import { useCommunity } from '../context/CommunityContext';
import { FundTransaction } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Trash2,
  Search,
  Printer,
  ShieldCheck,
  Lock,
  UserCheck,
  Coins,
  Receipt,
  X,
  Tag,
  Check,
} from 'lucide-react';

interface TreasuryFundsManagerProps {
  isAdmin?: boolean;
}

export const TreasuryFundsManager: React.FC<TreasuryFundsManagerProps> = ({ isAdmin = false }) => {
  const {
    funds,
    addFundTransaction,
    deleteFundTransaction,
    canManageFundsPermission,
    currentMember,
    members,
    assignMemberRole,
    showToast,
    t
  } = useCommunity();

  const canManage = canManageFundsPermission();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Inflow' | 'Outflow'>('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<FundTransaction | null>(null);
  const [deletingTxn, setDeletingTxn] = useState<FundTransaction | null>(null);
  const [assignCashierModalOpen, setAssignCashierModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    type: 'Inflow' | 'Outflow';
    amount: number | '';
    title: string;
    titleBn: string;
    donorOrBeneficiary: string;
    category: FundTransaction['category'];
    voucherNo: string;
    date: string;
    notes: string;
  }>({
    type: 'Inflow',
    amount: '',
    title: '',
    titleBn: '',
    donorOrBeneficiary: '',
    category: 'Membership Dues',
    voucherNo: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const resetForm = () => {
    setFormData({
      type: 'Inflow',
      amount: '',
      title: '',
      titleBn: '',
      donorOrBeneficiary: '',
      category: 'Membership Dues',
      voucherNo: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const openAddModal = (type: 'Inflow' | 'Outflow') => {
    resetForm();
    const nextVoucher = `VCH-2026-${String(funds.length + 1).padStart(3, '0')}`;
    setFormData(prev => ({
      ...prev,
      type,
      voucherNo: nextVoucher,
      category: type === 'Inflow' ? 'Membership Dues' : 'Sports Equipment'
    }));
    setIsAddOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(formData.amount);
    if (!numAmount || numAmount <= 0) {
      showToast(t('Please enter a valid amount.', 'সঠিক টাকার পরিমাণ দিন।'), 'warning');
      return;
    }
    if (!formData.title.trim()) {
      showToast(t('Please enter a title or purpose.', 'বিবরণ বা উদ্দেশ্য লিখুন।'), 'warning');
      return;
    }

    addFundTransaction({
      type: formData.type,
      amount: numAmount,
      title: formData.title.trim(),
      titleBn: formData.titleBn.trim() || formData.title.trim(),
      donorOrBeneficiary: formData.donorOrBeneficiary.trim() || (formData.type === 'Inflow' ? 'Member / Donor' : 'Supplier / Vendor'),
      category: formData.category,
      voucherNo: formData.voucherNo.trim() || undefined,
      date: formData.date || new Date().toISOString().split('T')[0],
      notes: formData.notes.trim() || undefined
    });

    setIsAddOpen(false);
    resetForm();
  };

  // Calculations
  const totalInflow = funds.filter(f => f.type === 'Inflow').reduce((sum, f) => sum + f.amount, 0);
  const totalOutflow = funds.filter(f => f.type === 'Outflow').reduce((sum, f) => sum + f.amount, 0);
  const netBalance = totalInflow - totalOutflow;

  // Filtered list
  const filtered = funds.filter(f => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      f.title.toLowerCase().includes(q) ||
      (f.titleBn && f.titleBn.toLowerCase().includes(q)) ||
      f.donorOrBeneficiary.toLowerCase().includes(q) ||
      (f.voucherNo && f.voucherNo.toLowerCase().includes(q));

    const matchType = typeFilter === 'All' || f.type === typeFilter;
    const matchCat = categoryFilter === 'All' || f.category === categoryFilter;

    return matchSearch && matchType && matchCat;
  });

  // Current active Cashiers
  const cashierMembers = members.filter(m => m.role === 'Cashier' || m.role === 'Assistant Cashier');

  // Categories Breakdown
  const categoriesList = [
    'Membership Dues',
    'Tree Saplings',
    'Sports Equipment',
    'Education Supplies',
    'Public Donation',
    'Emergency Aid',
    'Office & Printing',
    'Event Food & Tent',
    'Community Welfare'
  ];

  return (
    <div className="space-y-6">

      {/* Top Banner & Security Indicator */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl shadow-sm border border-emerald-800/50 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-800/80 rounded-full text-emerald-200 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>{t('Strict Role Control: Cashier, Assistant Cashier & Admin Only', 'কঠোর আর্থিক নিয়ন্ত্রণ: ক্যাশিয়ার, সহকারী ক্যাশিয়ার ও অ্যাডমিনের নিয়ন্ত্রণাধীন')}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {t('Community Treasury, Funds & Cash Book', 'কমিউনিটি তহবিল ও ক্যাশ বুক রেজিস্টার')}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              {t(
                'Complete financial calculations, membership subscriptions, donor funds, expense vouchers, and live audited net balances for Salmikkhang youth community.',
                'মাসিক চাঁদা, অনুদান, বিভিন্ন সামাজিক উদ্যোগের খরচ ভাউচার এন্ট্রি ও স্বয়ংক্রিয় নেট ব্যালেন্স হিসাব।'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {canManage ? (
              <>
                <button
                  onClick={() => openAddModal('Inflow')}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold shadow-md flex items-center gap-2 transition-all transform active:scale-95"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>{t('+ Record Inflow (জমা)', '+ চাঁদা / আয় ভাউচার')}</span>
                </button>
                <button
                  onClick={() => openAddModal('Outflow')}
                  className="px-4 py-2.5 bg-rose-700 hover:bg-rose-600 text-white rounded-2xl text-xs font-bold shadow-md flex items-center gap-2 transition-all transform active:scale-95"
                >
                  <TrendingDown className="w-4 h-4" />
                  <span>{t('- Record Outflow (ব্যয়)', '- খরচ ভাউচার এন্ট্রি')}</span>
                </button>
              </>
            ) : (
              <div className="px-3.5 py-2 bg-slate-900/60 border border-emerald-700/60 rounded-2xl text-xs text-emerald-200 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{t('View-Only (Add/Remove requires Cashier, Assistant Cashier or Admin)', 'দর্শন সুবিধা (টাকা লেনদেন পরিচালনা শুধু ক্যাশিয়ার ও অ্যাডমিনের)')}</span>
              </div>
            )}

            {isAdmin && (
              <button
                onClick={() => setAssignCashierModalOpen(true)}
                className="px-3.5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Tag className="w-4 h-4" />
                <span>{t('Manage Cashier Roles', 'ক্যাশিয়ার নিয়োগ')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Calculation & Balance Cards (Nature Glassmorphic) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Net Treasury Balance */}
        <div className="p-4 sm:p-5 glass-card rounded-3xl border border-emerald-500/30 shadow-xl flex flex-col justify-between backdrop-blur-2xl">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
              <span>{t('Audited Net Fund Balance', 'বর্তমান উদ্বৃত্ত ক্যাশ ব্যালেন্স')}</span>
              <Coins className="w-4 h-4 text-emerald-800 dark:text-emerald-400 shrink-0" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-slate-100 mt-2">
              ৳ {netBalance.toLocaleString()}
            </div>
            <div className="text-xs text-emerald-900 dark:text-emerald-400 mt-1 font-semibold">
              {netBalance >= 0 ? t('Healthy Treasury Reserve', 'তহবিল সক্রিয় ও উদ্বৃত্ত') : t('Deficit — Inflows Needed', 'ঘাটতি রয়েছে')}
            </div>
          </div>

          <div className="pt-4 border-t border-white/20 dark:border-white/10 mt-4 flex items-center justify-between gap-2 text-[11px] text-emerald-900 dark:text-emerald-300">
            <span>{t('Formula:', 'গণনা:')} Inflow - Outflow</span>
            <span className="font-bold">৳{totalInflow.toLocaleString()} - ৳{totalOutflow.toLocaleString()}</span>
          </div>
        </div>

        {/* Total Collections */}
        <div className="p-4 sm:p-5 glass-card rounded-3xl border border-white/40 dark:border-white/10 shadow-lg flex flex-col justify-between backdrop-blur-2xl">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-400 uppercase tracking-wider">
              <span>{t('Total Inflows / Collections', 'সর্বমোট জমা ও চাঁদা')}</span>
              <TrendingUp className="w-4 h-4 text-emerald-800 dark:text-emerald-400 shrink-0" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-slate-100 mt-2">
              ৳ {totalInflow.toLocaleString()}
            </div>
            <div className="text-xs text-slate-800 dark:text-slate-400 mt-1">
              {funds.filter(f => f.type === 'Inflow').length} {t('inflow transactions recorded', 'টি রসিদ ও চাঁদা এন্ট্রি')}
            </div>
          </div>

          <div className="pt-4 border-t border-white/20 dark:border-white/10 mt-4 flex items-center justify-between text-[11px] text-slate-800 dark:text-slate-400">
            <span>{t('Member dues & Donations', 'সদস্যদের নিয়মিত চাঁদা ও অনুদান')}</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="p-4 sm:p-5 glass-card rounded-3xl border border-rose-500/20 dark:border-rose-500/20 shadow-lg flex flex-col justify-between backdrop-blur-2xl">
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider">
              <span>{t('Total Outflows / Expenses', 'সর্বমোট ব্যয় ও খরচ ভাউচার')}</span>
              <TrendingDown className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-slate-100 mt-2">
              ৳ {totalOutflow.toLocaleString()}
            </div>
            <div className="text-xs text-slate-800 dark:text-slate-400 mt-1">
              {funds.filter(f => f.type === 'Outflow').length} {t('expense vouchers verified', 'টি ভাউচার পরিশোধিত')}
            </div>
          </div>

          <div className="pt-4 border-t border-white/20 dark:border-white/10 mt-4 flex items-center justify-between text-[11px] text-slate-800 dark:text-slate-400">
            <span>{t('Saplings, kits, education, events', 'চারা, টুর্নামেন্ট, ত্রাণ ও পাঠাগার')}</span>
          </div>
        </div>
      </div>

      {/* Authorized Officers Badge */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-800 dark:text-emerald-400 shrink-0" />
          <span className="font-bold text-slate-950 dark:text-slate-200">
            {t('Authorized Treasury Officers:', 'তহবিল পরিচালনায় দায়িত্বপ্রাপ্ত:')}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {cashierMembers.map(m => (
              <span key={m.id} className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-300 font-bold rounded-lg text-[11px]">
                {m.name} ({m.role})
              </span>
            ))}
            <span className="px-2.5 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-950 dark:text-purple-300 font-bold rounded-lg text-[11px]">
              Admin Council
            </span>
          </div>
        </div>

        {canManage ? (
          <span className="text-emerald-900 dark:text-emerald-400 font-bold flex items-center gap-1">
            <Check className="w-4 h-4 text-emerald-800 dark:text-emerald-400 shrink-0" />
            <span>{t('You are authorized to Add / Remove / Calculate transactions.', 'আপনি টাকা সংযোজন, বিয়োজন ও হিসাব পরিচালনায় ক্ষমতাপ্রাপ্ত।')}</span>
          </span>
        ) : (
          <span className="text-slate-800 dark:text-slate-400">
            {t('You have view-only access as a verified community member.', 'সদস্য হিসেবে আপনি সার্বিক হিসাব দেখতে পাচ্ছেন।')}
          </span>
        )}
      </div>

      {/* Search and Filters */}
      <div className="p-3.5 sm:p-4 glass-surface rounded-2xl border border-white/30 dark:border-white/10 space-y-3 backdrop-blur-xl shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-600 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t('Search by Voucher No, title, donor, payee...', 'ভাউচার নং, শিরোনাম, দাতা বা গ্রাহকের নাম দিয়ে খুঁজুন...')}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 text-slate-950 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 backdrop-blur-md"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="flex items-center p-1 bg-white/40 dark:bg-slate-900/40 rounded-xl border border-white/20 dark:border-white/10 shrink-0">
              {(['All', 'Inflow', 'Outflow'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setTypeFilter(tab)}
                  className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                    typeFilter === tab
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-900 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100'
                  }`}
                >
                  {tab === 'All' ? t('All', 'সকল') : tab === 'Inflow' ? t('Inflow (+)', 'জমা (+)') : t('Outflow (-)', 'খরচ (-)')}
                </button>
              ))}
            </div>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="flex-1 sm:flex-initial min-w-0 px-2.5 py-2 text-xs font-semibold rounded-xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 text-slate-950 dark:text-slate-200 backdrop-blur-md"
            >
              <option value="All">{t('All Categories', 'সকল খাত')}</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-800 dark:text-slate-400 pt-1 border-t border-white/20 dark:border-white/10">
          <span>{filtered.length} {t('transaction entries in view', 'টি লেনদেন প্রদর্শিত')}</span>
          <span>
            {t('Filtered Total:', 'ফিল্টারকৃত ব্যালেন্স:')}{' '}
            <strong className="text-slate-950 dark:text-slate-200 font-mono">
              ৳ {filtered.reduce((acc, f) => f.type === 'Inflow' ? acc + f.amount : acc - f.amount, 0).toLocaleString()}
            </strong>
          </span>
        </div>
      </div>

      {/* Transaction Ledger (Mobile Cards + Desktop Table) */}
      <div className="glass-card rounded-3xl border border-white/40 dark:border-white/10 overflow-hidden shadow-xl backdrop-blur-2xl">
        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-slate-200/70 dark:divide-slate-800">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-700 dark:text-slate-400 text-xs">
              <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <div>{t('No transactions matching criteria.', 'কোনো লেনদেন মেলেনি।')}</div>
            </div>
          ) : (
            filtered.map(txn => (
              <div key={txn.id} className="p-4 space-y-2.5 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-mono font-bold text-[11px] text-slate-700 dark:text-slate-400">
                      {txn.voucherNo || txn.id} · {txn.date}
                    </div>
                    <div className="font-bold text-sm text-slate-950 dark:text-slate-100 mt-0.5">
                      {t(txn.title, txn.titleBn)}
                    </div>
                  </div>
                  <span className={`font-black font-mono text-sm shrink-0 ${
                    txn.type === 'Inflow'
                      ? 'text-emerald-800 dark:text-emerald-400'
                      : 'text-rose-800 dark:text-rose-400'
                  }`}>
                    {txn.type === 'Inflow' ? '+' : '-'} ৳ {txn.amount.toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-300">
                    {txn.category}
                  </span>
                  <span className="text-slate-800 dark:text-slate-300 font-medium">
                    {txn.donorOrBeneficiary}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <span className="text-[11px] text-slate-700 dark:text-slate-400">
                    {txn.recordedBy || 'Treasury Desk'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedVoucher(txn)}
                      className="px-2.5 py-1.5 bg-white/80 dark:bg-slate-800 text-slate-950 dark:text-slate-200 rounded-lg font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>{t('Slip', 'রসিদ')}</span>
                    </button>
                    {canManage && (
                      <button
                        onClick={() => setDeletingTxn(txn)}
                        className="p-1.5 text-rose-700 dark:text-rose-400 rounded-lg"
                        title={t('Cancel / Delete Voucher', 'ভাউচার বাতিল করুন')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/40 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 border-b border-white/20 dark:border-white/10 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">{t('Voucher & Date', 'ভাউচার ও তারিখ')}</th>
                <th className="py-3 px-4">{t('Title & Purpose', 'বিবরণ ও উদ্দেশ্য')}</th>
                <th className="py-3 px-4">{t('Category', 'হিসাব খাত')}</th>
                <th className="py-3 px-4">{t('Donor / Beneficiary', 'দাতা / সুবিধাভোগী')}</th>
                <th className="py-3 px-4">{t('Recorded By', 'হিসাবকারী')}</th>
                <th className="py-3 px-4 text-right">{t('Amount (BDT)', 'টাকার পরিমাণ')}</th>
                <th className="py-3 px-4 text-right">{t('Action', 'রসিদ')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <div>{t('No transactions matching criteria.', 'কোনো লেনদেন মেলেনি।')}</div>
                  </td>
                </tr>
              ) : (
                filtered.map(txn => (
                  <tr key={txn.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {txn.voucherNo || txn.id}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{txn.date}</div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {t(txn.title, txn.titleBn)}
                      </div>
                      {txn.notes && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {txn.notes}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {txn.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {txn.donorOrBeneficiary}
                    </td>

                    <td className="py-3.5 px-4 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {txn.recordedBy || 'Treasury Desk'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span className={`font-black font-mono text-sm ${
                        txn.type === 'Inflow'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-rose-700 dark:text-rose-400'
                      }`}>
                        {txn.type === 'Inflow' ? '+' : '-'} ৳ {txn.amount.toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedVoucher(txn)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title={t('View Voucher Receipt Slip', 'ভাউচার রসিদ দেখুন')}
                        >
                          <Receipt className="w-4 h-4" />
                        </button>

                        {canManage && (
                          <button
                            onClick={() => setDeletingTxn(txn)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title={t('Cancel / Delete Voucher', 'ভাউচার বাতিল করুন')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD TRANSACTION / VOUCHER MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 space-y-5 my-auto max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                  formData.type === 'Inflow' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                }`}>
                  {formData.type === 'Inflow' ? t('Treasury Inflow Receipt', 'তহবিল জমা রসিদ') : t('Treasury Expense Voucher', 'তহবিল খরচ ভাউচার')}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {formData.type === 'Inflow'
                    ? t('Record Incoming Fund / Member Due', 'চাঁদা বা অনুদান সংগ্রহ লিপিবদ্ধ করুন')
                    : t('Record Outgoing Community Expense', 'খরচ বা ক্রয়ের ভাউচার লিপিবদ্ধ করুন')}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddOpen(false);
                  resetForm();
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'Inflow', category: 'Membership Dues' })}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    formData.type === 'Inflow'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{t('Inflow / Cash Received (+)', 'জমা / চাঁদা গ্রহণ (+)')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'Outflow', category: 'Sports Equipment' })}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    formData.type === 'Outflow'
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>{t('Outflow / Expense Paid (-)', 'ব্যয় / খরচ ভাউচার (-)')}</span>
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Amount in BDT (৳) *', 'টাকার পরিমাণ (৳) *')}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || '' })}
                    placeholder="e.g. 2500"
                    className="w-full px-3 py-2 text-sm font-black font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Voucher Serial No. *', 'ভাউচার সিরিয়াল নং *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.voucherNo}
                    onChange={e => setFormData({ ...formData, voucherNo: e.target.value })}
                    placeholder="e.g. VCH-2026-008"
                    className="w-full px-3 py-2 font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('Purpose / Transaction Title *', 'উদ্দেশ্য বা খরচের বিবরণ *')}
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder={formData.type === 'Inflow' ? 'e.g. Monthly Subscriptions from 25 members' : 'e.g. Purchase of 40 fruit saplings for school ground'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Category *', 'হিসাব খাত *')}
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {formData.type === 'Inflow' ? t('Donor / Source *', 'প্রদানকারী / উৎস *') : t('Recipient / Payee *', 'প্রাপক / দোকান / সরবরাহকারী *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.donorOrBeneficiary}
                    onChange={e => setFormData({ ...formData, donorOrBeneficiary: e.target.value })}
                    placeholder={formData.type === 'Inflow' ? 'e.g. Active Members / Well-wisher' : 'e.g. Tangail Sports Emporium'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Date *', 'তারিখ *')}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Notes / Memo (Optional)', 'বিশেষ নোট বা মেমো নং')}
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. Receipt book #2 page 14"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-[11px] text-slate-500 flex items-center justify-between">
                <span>{t('Authorized Cashier Signing:', 'কোষাধ্যক্ষের স্বাক্ষর:')}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {currentMember ? `${currentMember.name} (${currentMember.role})` : 'Admin Council'}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  {t('Cancel', 'বাতিল')}
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-white font-bold shadow-sm ${
                    formData.type === 'Inflow' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                >
                  {formData.type === 'Inflow' ? t('Submit Inflow Voucher', 'জমা ভাউচার নিশ্চিত করুন') : t('Submit Expense Voucher', 'খরচ ভাউচার নিশ্চিত করুন')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW VOUCHER RECEIPT SLIP MODAL */}
      {selectedVoucher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 space-y-5 my-auto max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                  {selectedVoucher.voucherNo || selectedVoucher.id}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {t('Official Community Cash Voucher', 'অফিসিয়াল ক্যাশ ভাউচার ও রসিদ')}
                </h3>
              </div>
              <button
                onClick={() => setSelectedVoucher(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Voucher Slip Layout */}
            <div className="p-5 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl space-y-4 bg-slate-50/50 dark:bg-slate-800/30 text-xs">
              <div className="text-center space-y-0.5 border-b border-slate-200 dark:border-slate-700 pb-3">
                <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100 tracking-tight">
                  SALMIKKHANG VILLAGE YOUTH COMMUNITY
                </div>
                <div className="text-[10px] text-slate-500">
                  Gaira, Jolchotro, Madhupur, Tangail · Treasury & Finance Dept
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block font-bold">{t('Voucher Serial:', 'ভাউচার নং:')}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{selectedVoucher.voucherNo || selectedVoucher.id}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block font-bold">{t('Date:', 'তারিখ:')}</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{selectedVoucher.date}</span>
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl space-y-1.5 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">{t('Type:', 'ধরন:')}</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    selectedVoucher.type === 'Inflow'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {selectedVoucher.type === 'Inflow' ? t('CASH INFLOW / RECEIPT (+)', 'জমা / চাঁদা গ্রহণ (+)') : t('CASH OUTFLOW / EXPENSE (-)', 'ব্যয় / খরচ ভাউচার (-)')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">{t('Purpose:', 'উদ্দেশ্য:')}</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 text-right">
                    {t(selectedVoucher.title, selectedVoucher.titleBn)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">{t('Category:', 'হিসাব খাত:')}</span>
                  <span className="text-slate-700 dark:text-slate-300">{selectedVoucher.category}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">{selectedVoucher.type === 'Inflow' ? t('Received From:', 'গ্রহণকারী:') : t('Paid To / Payee:', 'প্রাপক:')}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedVoucher.donorOrBeneficiary}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{t('Total Amount:', 'মোট টাকা:')}</span>
                  <span className="font-black font-mono text-emerald-700 dark:text-emerald-400 text-base">
                    ৳ {selectedVoucher.amount.toLocaleString()}
                  </span>
                </div>
              </div>

              {selectedVoucher.notes && (
                <div className="text-[11px] text-slate-500 italic">
                  <strong>{t('Memo:', 'নোট:')}</strong> {selectedVoucher.notes}
                </div>
              )}

              {/* Signature Blocks */}
              <div className="grid grid-cols-2 gap-4 pt-6 text-[10px] text-center">
                <div className="border-t border-slate-300 dark:border-slate-700 pt-1">
                  <div className="font-bold text-slate-700 dark:text-slate-300">{selectedVoucher.recordedBy || 'Treasurer / Cashier'}</div>
                  <div className="text-slate-400">{t('Cashier / Treasury Desk', 'কোষাধ্যক্ষ / সহকারী ক্যাশিয়ার')}</div>
                </div>
                <div className="border-t border-slate-300 dark:border-slate-700 pt-1">
                  <div className="font-bold text-slate-700 dark:text-slate-300">Bipul Rema</div>
                  <div className="text-slate-400">{t('President / Council Counter-Seal', 'সভাপতি / নিরীক্ষা সিল')}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedVoucher(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl"
              >
                {t('Close', 'বন্ধ করুন')}
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{t('Print Slip', 'রসিদ প্রিন্ট করুন')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN ASSIGN CASHIER MODAL */}
      {assignCashierModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 space-y-5 my-auto max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-500 uppercase tracking-wider block">
                  {t('Treasury Governance', 'কোষাধ্যক্ষ ও অর্থ দপ্তর নিয়োগ')}
                </span>
                <h3 className="text-lg font-black text-slate-950 dark:text-slate-100">
                  {t('Assign Cashier & Assistant Cashier Roles', 'ক্যাশিয়ার ও সহকারী ক্যাশিয়ার পদবি')}
                </h3>
              </div>
              <button
                onClick={() => setAssignCashierModalOpen(false)}
                className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-800 dark:text-slate-300 leading-relaxed">
              {t(
                'Only Admin and members appointed as "Cashier" (কোষাধ্যক্ষ) or "Assistant Cashier" (সহকারী ক্যাশিয়ার) can add/remove money and calculate balances. You can delegate these financial positions below.',
                'ইউজারের চাহিদানুসারে শুধুমাত্র অ্যাডমিন এবং ক্যাশিয়ার / সহকারী ক্যাশিয়াররা তহবিলের টাকা সংযোজন, বিয়োজন ও হিসাব গণনা করতে পারেন।'
              )}
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {members.map(m => {
                const isCashier = m.role === 'Cashier';
                const isAssis = m.role === 'Assistant Cashier';
                return (
                  <div
                    key={m.id}
                    className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs transition-colors ${
                      isCashier || isAssis
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-950 dark:text-slate-100 flex flex-wrap items-center gap-1.5">
                        <span>{m.name}</span>
                        {isCashier && (
                          <span className="px-2 py-0.2 bg-amber-600 text-white font-bold text-[10px] rounded-full">
                            {t('Cashier / Treasurer', 'কোষাধ্যক্ষ')}
                          </span>
                        )}
                        {isAssis && (
                          <span className="px-2 py-0.2 bg-teal-600 text-white font-bold text-[10px] rounded-full">
                            {t('Assistant Cashier', 'সহকারী ক্যাশিয়ার')}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-700 dark:text-slate-400">
                        {m.memberNo} · {m.role} · {m.village}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => assignMemberRole(m.id, isCashier ? 'Member' : 'Cashier')}
                        className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-colors ${
                          isCashier
                            ? 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-600 hover:bg-amber-500 text-white'
                        }`}
                      >
                        {isCashier ? t('Revoke', 'বাতিল') : t('Make Cashier', 'ক্যাশিয়ার')}
                      </button>

                      <button
                        onClick={() => assignMemberRole(m.id, isAssis ? 'Member' : 'Assistant Cashier')}
                        className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-colors ${
                          isAssis
                            ? 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-teal-700 hover:bg-teal-600 text-white'
                        }`}
                      >
                        {isAssis ? t('Revoke', 'বাতিল') : t('Make Assis', 'সহকারী')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setAssignCashierModalOpen(false)}
                className="px-5 py-2 bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs rounded-xl"
              >
                {t('Done', 'সম্পন্ন')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingTxn && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-rose-700 dark:text-rose-400">
                {t('Delete Transaction Voucher', 'লেনদেন ভাউচার মুছুন')}
              </h3>
              <button
                onClick={() => setDeletingTxn(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {t(
                `Delete transaction voucher "${deletingTxn.voucherNo || deletingTxn.title}" of ৳${deletingTxn.amount}?`,
                `৳${deletingTxn.amount} টাকার "${deletingTxn.voucherNo || deletingTxn.title}" ভাউচারটি কি ডিলিট করতে চান?`
              )}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTxn(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t('Cancel', 'বাতিল')}
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteFundTransaction(deletingTxn.id);
                  setDeletingTxn(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('Delete Voucher', 'ভাউচার মুছুন')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
