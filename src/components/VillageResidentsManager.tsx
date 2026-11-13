import React, { useState } from 'react';
import { useCommunity } from '../context/CommunityContext';
import { VillageResident, AidStatus } from '../types';
import {
  Search,
  Filter,
  Plus,
  Home,
  Phone,
  Heart,
  HeartHandshake,
  HeartPulse,
  GraduationCap,
  Trash2,
  Edit2,
  Eye,
  ShieldCheck,
  FileSpreadsheet,
  X,
  Check,
  Lock,
  Tag,
} from 'lucide-react';

interface VillageResidentsManagerProps {
  isAdmin?: boolean;
}

export const VillageResidentsManager: React.FC<VillageResidentsManagerProps> = ({ isAdmin = false }) => {
  const {
    villageResidents,
    addVillageResident,
    updateVillageResident,
    deleteVillageResident,
    canCollectDataPermission,
    isAdminLoggedIn,
    currentMember,
    members,
    assignMemberRole,
    showToast,
    t
  } = useCommunity();

  const canCollect = canCollectDataPermission();
  const canDelete = isAdminLoggedIn || isAdmin;

  const [searchTerm, setSearchTerm] = useState('');
  const [villageFilter, setVillageFilter] = useState('All');
  const [aidFilter, setAidFilter] = useState('All');
  const [bloodFilter, setBloodFilter] = useState('All');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<VillageResident | null>(null);
  const [viewingResident, setViewingResident] = useState<VillageResident | null>(null);
  const [deletingResident, setDeletingResident] = useState<VillageResident | null>(null);
  const [assignCollectorModalOpen, setAssignCollectorModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    nameBn: string;
    guardianName: string;
    village: string;
    para: string;
    phone: string;
    nidOrBirthCert: string;
    occupation: string;
    familyMembersCount: number;
    bloodGroup: string;
    aidStatus: AidStatus;
    notes: string;
  }>({
    name: '',
    nameBn: '',
    guardianName: '',
    village: 'Gaira',
    para: '',
    phone: '',
    nidOrBirthCert: '',
    occupation: '',
    familyMembersCount: 4,
    bloodGroup: 'O+',
    aidStatus: 'General Resident',
    notes: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      nameBn: '',
      guardianName: '',
      village: 'Gaira',
      para: '',
      phone: '',
      nidOrBirthCert: '',
      occupation: '',
      familyMembersCount: 4,
      bloodGroup: 'O+',
      aidStatus: 'General Resident',
      notes: ''
    });
    setEditingResident(null);
  };

  const openCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEdit = (res: VillageResident) => {
    setEditingResident(res);
    setFormData({
      name: res.name,
      nameBn: res.nameBn || '',
      guardianName: res.guardianName,
      village: res.village,
      para: res.para,
      phone: res.phone,
      nidOrBirthCert: res.nidOrBirthCert || '',
      occupation: res.occupation,
      familyMembersCount: res.familyMembersCount,
      bloodGroup: res.bloodGroup,
      aidStatus: res.aidStatus,
      notes: res.notes || ''
    });
    setIsCreateOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.guardianName.trim() || !formData.phone.trim()) {
      showToast(t('Please fill in Name, Guardian Name, and Phone number.', 'নাম, অভিভাবকের নাম ও ফোন নম্বর প্রদান করুন।'), 'warning');
      return;
    }

    const aidStatusBnMap: Record<AidStatus, string> = {
      'General Resident': 'সাধারণ অধিবাসী',
      'Eligible for Aid': 'ত্রাণ ও সহায়তাযোগ্য',
      'Senior Citizen': 'বয়োবৃদ্ধ নাগরিক',
      'Student / Youth': 'শিক্ষার্থী / যুবসমাজ',
      'Medical Assistance': 'চিকিৎসা সহায়তা প্রার্থী',
      'Farmer / Daily Wage Earner': 'কৃষক ও দিনমজুর'
    };

    if (editingResident) {
      updateVillageResident(editingResident.id, {
        name: formData.name.trim(),
        nameBn: formData.nameBn.trim() || undefined,
        guardianName: formData.guardianName.trim(),
        village: formData.village,
        para: formData.para.trim(),
        phone: formData.phone.trim(),
        nidOrBirthCert: formData.nidOrBirthCert.trim() || undefined,
        occupation: formData.occupation.trim(),
        familyMembersCount: Number(formData.familyMembersCount) || 1,
        bloodGroup: formData.bloodGroup,
        aidStatus: formData.aidStatus,
        aidStatusBn: aidStatusBnMap[formData.aidStatus],
        notes: formData.notes.trim() || undefined
      });
    } else {
      addVillageResident({
        name: formData.name.trim(),
        nameBn: formData.nameBn.trim() || undefined,
        guardianName: formData.guardianName.trim(),
        village: formData.village,
        para: formData.para.trim(),
        phone: formData.phone.trim(),
        nidOrBirthCert: formData.nidOrBirthCert.trim() || undefined,
        occupation: formData.occupation.trim(),
        familyMembersCount: Number(formData.familyMembersCount) || 1,
        bloodGroup: formData.bloodGroup,
        aidStatus: formData.aidStatus,
        aidStatusBn: aidStatusBnMap[formData.aidStatus],
        notes: formData.notes.trim() || undefined,
        collectedBy: ''
      });
    }

    setIsCreateOpen(false);
    resetForm();
  };

  // Filtered residents
  const filtered = villageResidents.filter(res => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      res.name.toLowerCase().includes(q) ||
      (res.nameBn && res.nameBn.includes(q)) ||
      res.guardianName.toLowerCase().includes(q) ||
      res.phone.includes(q) ||
      res.para.toLowerCase().includes(q) ||
      res.occupation.toLowerCase().includes(q) ||
      (res.nidOrBirthCert && res.nidOrBirthCert.includes(q));

    const matchVillage = villageFilter === 'All' || res.village.toLowerCase() === villageFilter.toLowerCase();
    const matchAid = aidFilter === 'All' || res.aidStatus === aidFilter;
    const matchBlood = bloodFilter === 'All' || res.bloodGroup === bloodFilter;

    return matchSearch && matchVillage && matchAid && matchBlood;
  });

  // Aid counts
  const eligibleCount = villageResidents.filter(r => r.aidStatus === 'Eligible for Aid').length;
  const seniorCount = villageResidents.filter(r => r.aidStatus === 'Senior Citizen').length;
  const medicalCount = villageResidents.filter(r => r.aidStatus === 'Medical Assistance').length;
  const studentCount = villageResidents.filter(r => r.aidStatus === 'Student / Youth').length;

  // Export CSV
  const exportCSV = () => {
    const headers = ['Resident ID', 'Name', 'Guardian', 'Village', 'Para', 'Phone', 'NID / BirthCert', 'Occupation', 'Family Members', 'Blood Group', 'Aid Status', 'Notes', 'Surveyor'];
    const rows = filtered.map(r => [
      r.residentNo,
      r.name,
      r.guardianName,
      r.village,
      r.para,
      r.phone,
      r.nidOrBirthCert || '',
      r.occupation,
      r.familyMembersCount,
      r.bloodGroup,
      r.aidStatus,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
      r.collectedBy
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `salmikkhang-village-census-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getAidBadge = (status: AidStatus) => {
    switch (status) {
      case 'Eligible for Aid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <HeartHandshake className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            <span>{t('Aid Eligible', 'ত্রাণযোগ্য')}</span>
          </span>
        );
      case 'Medical Assistance':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <HeartPulse className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>{t('Medical Need', 'চিকিৎসা সহায়তা')}</span>
          </span>
        );
      case 'Senior Citizen':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Heart className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            <span>{t('Senior Citizen', 'বয়োবৃদ্ধ')}</span>
          </span>
        );
      case 'Student / Youth':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <GraduationCap className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span>{t('Student / Youth', 'শিক্ষার্থী')}</span>
          </span>
        );
      case 'Farmer / Daily Wage Earner':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Home className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>{t('Farmer / Wage Earner', 'কৃষক ও দিনমজুর')}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <span>{t('General Resident', 'সাধারণ অধিবাসী')}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Security Indicator */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-3xl shadow-sm border border-emerald-800/60 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-800/80 rounded-full text-emerald-200 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>{t('Confidential Citizen Records — Restricted to Members & Admin', 'গোপনীয় নাগরিক তথ্য ভাণ্ডার — শুধুমাত্র সদস্য ও অ্যাডমিনদের দর্শনীয়')}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {t('Village Citizen & Household Directory', 'গ্রামবাসী ও সাধারণ নাগরিক তথ্য ভাণ্ডার')}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              {t(
                'Comprehensive village household census across Gaira and Jolchotro for emergency medical relief, winter clothes distribution, blood donors, and social welfare programs.',
                'গাইরা, জলছত্র ও আশপাশের গ্রামবাসীদের প্রয়োজনীয় পারিবারিক তথ্য, পেশা, জরুরি সহায়তাযোগ্যতা ও রক্তের গ্রুপের সমন্বিত ডাটাবেস।'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {canCollect ? (
              <button
                onClick={openCreate}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold shadow-md flex items-center gap-2 transition-all transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{t('+ Add Resident Information', '+ নাগরিক তথ্য যোগ করুন')}</span>
              </button>
            ) : (
              <div className="px-3.5 py-2 bg-slate-900/60 border border-emerald-700/60 rounded-2xl text-xs text-emerald-200 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{t('View-Only (Add/Edit requires Data Collector or Admin role)', 'দর্শন সুবিধা (তথ্য সংযোজন করতে ডাটা কালেক্টর বা অ্যাডমিন প্রয়োজন)')}</span>
              </div>
            )}

            <button
              onClick={exportCSV}
              className="px-3.5 py-2.5 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-emerald-700/60"
              title="Export filtered records to CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>{t('Export CSV', 'CSV এক্সপোর্ট')}</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setAssignCollectorModalOpen(true)}
                className="px-3.5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Tag className="w-4 h-4" />
                <span>{t('Manage Data Collectors', 'তথ্য সংগ্রাহক নির্ধারণ')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Overview Metric Cards (Nature Glassmorphism) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 glass-card rounded-2xl border border-white/40 dark:border-white/10 shadow-lg backdrop-blur-xl">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-800 dark:text-slate-400">
            {t('Total Households Registered', 'মোট নিবন্ধিত পরিবার')}
          </div>
          <div className="text-2xl font-black text-slate-950 dark:text-slate-100 mt-1">
            {villageResidents.length}
          </div>
          <div className="text-[11px] text-emerald-900 dark:text-emerald-400 mt-0.5 font-medium">
            {villageResidents.reduce((acc, r) => acc + (r.familyMembersCount || 1), 0)} {t('total villagers represented', 'জন গ্রামবাসীর তথ্য')}
          </div>
        </div>

        <div className="p-3.5 sm:p-4 glass-card rounded-2xl border border-rose-500/20 dark:border-rose-500/20 shadow-lg backdrop-blur-xl">
          <div className="text-[11px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-400">
            {t('Eligible for Relief & Aid', 'ত্রাণ ও সহায়তাযোগ্য পরিবার')}
          </div>
          <div className="text-2xl font-black text-rose-800 dark:text-rose-300 mt-1">
            {eligibleCount}
          </div>
          <div className="text-[11px] text-rose-800 dark:text-rose-400 mt-0.5 font-medium">
            {t('Priority for winter blankets & aid', 'শীতবস্ত্র ও খাদ্য সহায়তা অগ্রাধিকার')}
          </div>
        </div>

        <div className="p-3.5 sm:p-4 glass-card rounded-2xl border border-amber-500/20 dark:border-amber-500/20 shadow-lg backdrop-blur-xl">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-400">
            {t('Medical Assistance Needed', 'জরুরি চিকিৎসা সহায়তা')}
          </div>
          <div className="text-2xl font-black text-amber-950 dark:text-amber-300 mt-1">
            {medicalCount}
          </div>
          <div className="text-[11px] text-amber-900 dark:text-amber-400 mt-0.5 font-medium">
            {t('Hospital surgery & blood calls', 'হাসপাতাল অপারেশন ও রক্তদান')}
          </div>
        </div>

        <div className="p-3.5 sm:p-4 glass-card rounded-2xl border border-sky-500/20 dark:border-sky-500/20 shadow-lg backdrop-blur-xl">
          <div className="text-[11px] font-bold uppercase tracking-wider text-sky-900 dark:text-sky-400">
            {t('Seniors & Students', 'প্রবীণ ও শিক্ষার্থী')}
          </div>
          <div className="text-2xl font-black text-sky-950 dark:text-sky-300 mt-1">
            {seniorCount + studentCount}
          </div>
          <div className="text-[11px] text-sky-900 dark:text-sky-400 mt-0.5 font-medium">
            {seniorCount} {t('seniors', 'প্রবীণ')} · {studentCount} {t('students', 'শিক্ষার্থী')}
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-3.5 sm:p-4 glass-surface rounded-2xl border border-white/30 dark:border-white/10 space-y-3 backdrop-blur-xl shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-600 dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t('Search by Resident Name, Guardian, Phone, NID, Para, Occupation...', 'নাম, অভিভাবক, ফোন, ভোটার আইডি, পাড়া বা পেশা দিয়ে খুঁজুন...')}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 text-slate-950 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 backdrop-blur-md"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <select
              value={villageFilter}
              onChange={e => setVillageFilter(e.target.value)}
              className="flex-1 sm:flex-initial min-w-0 px-2.5 py-2 text-xs font-semibold rounded-xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 text-slate-950 dark:text-slate-200 backdrop-blur-md"
            >
              <option value="All">{t('All Villages', 'সকল গ্রাম')}</option>
              <option value="Gaira">Gaira (গাইরা)</option>
              <option value="Jolchotro">Jolchotro (জলছত্র)</option>
              <option value="Pirgacha">Pirgacha (পীরগাছা)</option>
              <option value="Sholakuri">Sholakuri (শোলাকুড়ী)</option>
            </select>

            <select
              value={aidFilter}
              onChange={e => setAidFilter(e.target.value)}
              className="flex-1 sm:flex-initial min-w-0 px-2.5 py-2 text-xs font-semibold rounded-xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 text-slate-950 dark:text-slate-200 backdrop-blur-md"
            >
              <option value="All">{t('All Aid Categories', 'সকল সাহায্য ক্যাটাগরি')}</option>
              <option value="Eligible for Aid">{t('Eligible for Aid', 'ত্রাণ ও সহায়তাযোগ্য')}</option>
              <option value="Medical Assistance">{t('Medical Assistance', 'চিকিৎসা সহায়তা প্রার্থী')}</option>
              <option value="Senior Citizen">{t('Senior Citizen', 'বয়োবৃদ্ধ নাগরিক')}</option>
              <option value="Student / Youth">{t('Student / Youth', 'শিক্ষার্থী / যুবসমাজ')}</option>
              <option value="Farmer / Daily Wage Earner">{t('Farmer / Wage Earner', 'কৃষক ও দিনমজুর')}</option>
              <option value="General Resident">{t('General Resident', 'সাধারণ অধিবাসী')}</option>
            </select>

            <select
              value={bloodFilter}
              onChange={e => setBloodFilter(e.target.value)}
              className="w-full sm:w-auto px-2.5 py-2 text-xs font-semibold rounded-xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 text-slate-950 dark:text-slate-200 backdrop-blur-md"
            >
              <option value="All">{t('Blood Group', 'রক্তের গ্রুপ')}</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-800 dark:text-slate-400 pt-1 border-t border-white/20 dark:border-white/10">
          <span>{filtered.length} {t('citizen records found', 'জন নাগরিকের তথ্য পাওয়া গেছে')}</span>
          {canCollect && (
            <span className="text-emerald-900 dark:text-emerald-400 font-bold flex items-center gap-1">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{t('Authorized Data Collector Mode Active', 'তথ্য সংগ্রাহক পারমিশন সক্রিয়')}</span>
            </span>
          )}
        </div>
      </div>

      {/* Directory Table (Desktop) & Cards View (Mobile) */}
      <div className="glass-card rounded-3xl border border-white/40 dark:border-white/10 overflow-hidden shadow-xl backdrop-blur-2xl">
        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-slate-200/70 dark:divide-slate-800">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-700 dark:text-slate-400 text-xs">
              <Home className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <div>{t('No resident records matching criteria.', 'কোনো নাগরিকের তথ্য মেলেনি।')}</div>
            </div>
          ) : (
            filtered.map(res => (
              <div key={res.id} className="p-4 space-y-2.5 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-slate-950 dark:text-slate-100">
                      {res.name} {res.nameBn && <span className="text-xs font-normal text-slate-700 dark:text-slate-400">({res.nameBn})</span>}
                    </div>
                    <div className="text-[11px] text-slate-700 dark:text-slate-400 font-mono">
                      {res.residentNo} · {res.familyMembersCount} {t('members', 'জন সদস্য')}
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 rounded-full shrink-0">
                    {res.bloodGroup}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {getAidBadge(res.aidStatus)}
                  <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-300">
                    {res.village}, {res.para}
                  </span>
                </div>

                <div className="text-[11px] text-slate-800 dark:text-slate-300 space-y-0.5">
                  <div><span className="font-bold">{t('Guardian:', 'অভিভাবক:')}</span> {res.guardianName || t('Restricted (Collector/Admin)', 'সংরক্ষিত (তথ্য সংগ্রাহক/অ্যাডমিন)')}</div>
                  <div><span className="font-bold">{t('Occupation:', 'পেশা:')}</span> {res.occupation}</div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  {res.phone ? (
                    <a
                      href={`tel:${res.phone}`}
                      className="font-mono text-emerald-900 dark:text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                    >
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>{res.phone}</span>
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Lock className="w-3 h-3 shrink-0" />
                      <span>{t('Restricted', 'সংরক্ষিত')}</span>
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewingResident(res)}
                      className="px-2.5 py-1.5 bg-white/80 dark:bg-slate-800 text-slate-950 dark:text-slate-200 rounded-lg font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t('View', 'দেখুন')}</span>
                    </button>
                    {canCollect && (
                      <button
                        onClick={() => openEdit(res)}
                        className="p-1.5 text-slate-800 dark:text-slate-300 hover:text-blue-700 rounded-lg"
                        title={t('Edit Resident Record', 'নাগরিক তথ্য এডিট করুন')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => setDeletingResident(res)}
                        className="p-1.5 text-rose-700 dark:text-rose-400 rounded-lg"
                        title={t('Delete Record', 'রেকর্ড মুছুন')}
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
                <th className="py-3 px-4">{t('Citizen & ID', 'নাগরিক ও কোড')}</th>
                <th className="py-3 px-4">{t('Guardian Name', 'অভিভাবক / পিতা')}</th>
                <th className="py-3 px-4">{t('Village & Para', 'গ্রাম ও পাড়া')}</th>
                <th className="py-3 px-4">{t('Phone & Blood', 'ফোন ও রক্ত')}</th>
                <th className="py-3 px-4">{t('Occupation', 'পেশা')}</th>
                <th className="py-3 px-4">{t('Category / Need', 'সাহায্যযোগ্যতা')}</th>
                <th className="py-3 px-4">{t('Surveyor', 'তথ্য সংগ্রাহক')}</th>
                <th className="py-3 px-4 text-right">{t('Action', 'অ্যাকশন')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Home className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <div>{t('No resident records matching criteria.', 'কোনো নাগরিকের তথ্য মেলেনি।')}</div>
                  </td>
                </tr>
              ) : (
                filtered.map(res => (
                  <tr key={res.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>{res.name}</span>
                        {res.nameBn && <span className="text-[11px] font-normal text-slate-500">({res.nameBn})</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {res.residentNo} · {res.familyMembersCount} {t('members in family', 'জন সদস্য')}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      <div>{res.guardianName || <span className="text-slate-400 italic">{t('Restricted', 'সংরক্ষিত')}</span>}</div>
                      {res.nidOrBirthCert && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ID: {res.nidOrBirthCert}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{res.village}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{res.para}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      {res.phone ? (
                        <a
                          href={`tel:${res.phone}`}
                          className="font-mono text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Phone className="w-3 h-3 shrink-0" />
                          <span>{res.phone}</span>
                        </a>
                      ) : (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Lock className="w-3 h-3 shrink-0" />
                          <span>{t('Restricted', 'সংরক্ষিত')}</span>
                        </div>
                      )}
                      <div className="mt-0.5 inline-block text-[10px] font-bold px-1.5 py-0.2 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded">
                        {t('Blood:', 'রক্ত:')} {res.bloodGroup}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {res.occupation}
                    </td>

                    <td className="py-3.5 px-4">
                      {getAidBadge(res.aidStatus)}
                      {res.notes && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-1 max-w-[150px]" title={res.notes}>
                          {res.notes}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-[11px] text-slate-500 dark:text-slate-400">
                      <div>{res.collectedBy || 'Council'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{res.collectedDate}</div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingResident(res)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title={t('View Full Citizen Record', 'সম্পূর্ণ তথ্য দেখুন')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canCollect && (
                          <button
                            onClick={() => openEdit(res)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title={t('Edit Resident Record', 'নাগরিক তথ্য এডিট করুন')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeletingResident(res)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title={t('Delete Record', 'রেকর্ড মুছুন')}
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

      {/* CREATE / EDIT RESIDENT MODAL (Authorized only to Data Collector & Admin) */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 space-y-5 my-auto max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                  {t('Field Data Collection Desk', 'মাঠপর্যায়ের তথ্য জরিপ সেল')}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {editingResident
                    ? t('Edit Resident Information', 'নাগরিক তথ্য সম্পাদন')
                    : t('Record New Village Resident', 'নতুন গ্রামবাসীর তথ্য অন্তর্ভুক্তি')}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  resetForm();
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Citizen Full Name *', 'নাগরিকের পূর্ণ নাম *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Biren Rema"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Name in Bengali (Optional)', 'বাংলায় নাম (ঐচ্ছিক)')}
                  </label>
                  <input
                    type="text"
                    value={formData.nameBn}
                    onChange={e => setFormData({ ...formData, nameBn: e.target.value })}
                    placeholder="যেমন: বীরেন রেমা"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Father / Guardian / Spouse Name *', 'পিতা / অভিভাবক / স্বামীর নাম *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.guardianName}
                    onChange={e => setFormData({ ...formData, guardianName: e.target.value })}
                    placeholder="e.g. Late Proshon Rema"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Phone / Contact Number *', 'মোবাইল নম্বর *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +880 1712-441122"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Village *', 'গ্রাম *')}
                  </label>
                  <select
                    value={formData.village}
                    onChange={e => setFormData({ ...formData, village: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    <option value="Gaira">Gaira (গাইরা)</option>
                    <option value="Jolchotro">Jolchotro (জলছত্র)</option>
                    <option value="Pirgacha">Pirgacha (পীরগাছা)</option>
                    <option value="Sholakuri">Sholakuri (শোলাকুড়ী)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Para / Neighborhood / Mahalla *', 'পাড়া / মহল্লা *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.para}
                    onChange={e => setFormData({ ...formData, para: e.target.value })}
                    placeholder="e.g. West Para (পশ্চিম পাড়া)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Occupation *', 'পেশা / জীবিকা *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.occupation}
                    onChange={e => setFormData({ ...formData, occupation: e.target.value })}
                    placeholder="e.g. Farmer / Teacher"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Family Members Count', 'পরিবারের সদস্য সংখ্যা')}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={formData.familyMembersCount}
                    onChange={e => setFormData({ ...formData, familyMembersCount: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Blood Group', 'রক্তের গ্রুপ')}
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-rose-600"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('NID / Birth Certificate No.', 'জাতীয় পরিচয়পত্র / জন্ম নিবন্ধন নং')}
                  </label>
                  <input
                    type="text"
                    value={formData.nidOrBirthCert}
                    onChange={e => setFormData({ ...formData, nidOrBirthCert: e.target.value })}
                    placeholder="e.g. 19759312847291028"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t('Assistance / Aid Category *', 'সাহায্যযোগ্যতা / ক্যাটাগরি *')}
                  </label>
                  <select
                    value={formData.aidStatus}
                    onChange={e => setFormData({ ...formData, aidStatus: e.target.value as AidStatus })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                  >
                    <option value="General Resident">General Resident (সাধারণ অধিবাসী)</option>
                    <option value="Eligible for Aid">Eligible for Aid (ত্রাণ ও সহায়তাযোগ্য)</option>
                    <option value="Medical Assistance">Medical Assistance (জরুরি চিকিৎসা সহায়তা প্রার্থী)</option>
                    <option value="Senior Citizen">Senior Citizen (বয়োবৃদ্ধ নাগরিক)</option>
                    <option value="Student / Youth">Student / Youth (শিক্ষার্থী ও যুবসমাজ)</option>
                    <option value="Farmer / Daily Wage Earner">Farmer / Daily Wage Earner (কৃষক ও দিনমজুর)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('Emergency Notes / Relief Requirements', 'জরুরি প্রয়োজন বা বিশেষ মন্তব্য')}
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={t('e.g. Requires winter blanket, homestead seeds, cataract checkup...', 'যেমন: শীতকালীন কম্বল প্রয়োজন, চোখের ছানি অপারেশন, বীজ সহায়তা...')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-[11px] text-slate-500 flex items-center justify-between">
                <span>{t('Data Collector in Record:', 'সংগ্রাহকের স্বাক্ষর:')}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {currentMember ? `${currentMember.name} (${currentMember.role})` : 'Admin Council'}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                >
                  {t('Cancel', 'বাতিল')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-sm"
                >
                  {editingResident ? t('Save Changes', 'তথ্য হালনাগাদ করুন') : t('Save Resident Record', 'নাগরিক তথ্য সংরক্ষণ করুন')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW RESIDENT DETAIL MODAL */}
      {viewingResident && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 space-y-5 my-auto max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-400 font-bold">
                  {viewingResident.residentNo}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-950 dark:text-slate-100">
                  {viewingResident.name} {viewingResident.nameBn && `(${viewingResident.nameBn})`}
                </h3>
              </div>
              <button
                onClick={() => setViewingResident(null)}
                className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('Father / Guardian:', 'অভিভাবক:')}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{viewingResident.guardianName || t('Restricted (Collector/Admin)', 'সংরক্ষিত')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('Category / Status:', 'ক্যাটাগরি:')}</span>
                  {getAidBadge(viewingResident.aidStatus)}
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('Village & Para:', 'গ্রাম ও পাড়া:')}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingResident.village}, {viewingResident.para}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('Blood Group:', 'রক্তের গ্রুপ:')}</span>
                  <span className="font-black text-rose-600 dark:text-rose-400">{viewingResident.bloodGroup}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('Contact Phone:', 'মোবাইল:')}</span>
                  {viewingResident.phone ? (
                    <a href={`tel:${viewingResident.phone}`} className="font-mono text-emerald-700 dark:text-emerald-400 font-bold hover:underline">
                      {viewingResident.phone}
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">{t('Restricted (Collector/Admin)', 'সংরক্ষিত')}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('Family Size:', 'পরিবারের সদস্য:')}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{viewingResident.familyMembersCount} {t('members', 'জন')}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('Occupation:', 'পেশা:')}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingResident.occupation}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t('NID / Birth Certificate:', 'জাতীয় পরিচয়পত্র:')}</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {viewingResident.nidOrBirthCert || (canCollect ? t('Not recorded', 'নিবন্ধিত নয়') : t('Restricted (Collector/Admin)', 'সংরক্ষিত'))}
                  </span>
                </div>
              </div>

              {viewingResident.notes && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl">
                  <span className="text-amber-900 dark:text-amber-300 font-bold block mb-1">
                    {t('Community Assistance & Special Notes:', 'জরুরি সহায়তা ও মন্তব্য:')}
                  </span>
                  <p className="text-amber-800 dark:text-amber-200 leading-relaxed">
                    {viewingResident.notes}
                  </p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>{t('Surveyed by:', 'তথ্য সংগ্রহকারী:')} <strong className="text-slate-700 dark:text-slate-300">{viewingResident.collectedBy}</strong></span>
                <span>{viewingResident.collectedDate}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setViewingResident(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-xs"
              >
                {t('Close', 'বন্ধ করুন')}
              </button>
              {canDelete && (
                <button
                  onClick={() => {
                    const toDel = viewingResident;
                    setViewingResident(null);
                    setDeletingResident(toDel);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('Delete', 'ডিলিট করুন')}</span>
                </button>
              )}
              {canCollect && (
                <button
                  onClick={() => {
                    const toEdit = viewingResident;
                    setViewingResident(null);
                    openEdit(toEdit);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{t('Edit Record', 'তথ্য এডিট করুন')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADMIN ASSIGN DATA COLLECTOR MODAL */}
      {assignCollectorModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 space-y-5 my-auto max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-500 uppercase tracking-wider block">
                  {t('Admin Delegation', 'অ্যাডমিন ক্ষমতা বণ্টন')}
                </span>
                <h3 className="text-lg font-black text-slate-950 dark:text-slate-100">
                  {t('Assign Data Collector Role', 'তথ্য সংগ্রাহক পদবি নিয়োগ')}
                </h3>
              </div>
              <button
                onClick={() => setAssignCollectorModalOpen(false)}
                className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-800 dark:text-slate-300 leading-relaxed">
              {t(
                'As requested, only Admin and members with the "Data Collector" role have authorization to add or modify village citizen information. Select any registered youth member below to appoint them as an official Data Collector.',
                'অ্যাডমিনের পর শুধুমাত্র "তথ্য সংগ্রাহক" (Data Collector) পদবিধারী সদস্যরা গ্রামবাসীদের তথ্য যোগ ও এডিট করতে পারবেন। নিচের তালিকা থেকে যে কোনো সদস্যকে এই দায়িত্ব দিন।'
              )}
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {members.map(m => {
                const isCollector = m.role === 'Data Collector';
                return (
                  <div
                    key={m.id}
                    className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs transition-colors ${
                      isCollector
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-950 dark:text-slate-100 flex flex-wrap items-center gap-2">
                        <span>{m.name}</span>
                        {isCollector && (
                          <span className="px-2 py-0.2 bg-blue-600 text-white font-bold text-[10px] rounded-full">
                            {t('Active Data Collector', 'তথ্য সংগ্রাহক')}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-700 dark:text-slate-400">
                        {m.memberNo} · {m.role} · {m.village}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        assignMemberRole(m.id, isCollector ? 'Member' : 'Data Collector');
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors shrink-0 self-start sm:self-auto ${
                        isCollector
                          ? 'bg-rose-100 hover:bg-rose-200 text-rose-900 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                      }`}
                    >
                      {isCollector ? t('Remove Role', 'দায়িত্ব বাতিল') : t('Appoint as Collector', 'তথ্য সংগ্রাহক করুন')}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setAssignCollectorModalOpen(false)}
                className="px-5 py-2 bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs rounded-xl"
              >
                {t('Done', 'সম্পন্ন')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE RESIDENT CONFIRMATION MODAL (Admin Only) */}
      {deletingResident && canDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-rose-700 dark:text-rose-400">
                {t('Confirm Delete Citizen Record', 'নাগরিক তথ্য মুছে ফেলা নিশ্চিত করুন')}
              </h3>
              <button
                onClick={() => setDeletingResident(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {t(
                `Are you sure you want to permanently delete the record for "${deletingResident.name}" (${deletingResident.residentNo})?`,
                `আপনি কি "${deletingResident.name}" (${deletingResident.residentNo})-এর নাগরিক তথ্যটি স্থায়ীভাবে মুছে ফেলতে চান?`
              )}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingResident(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t('Cancel', 'বাতিল')}
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteVillageResident(deletingResident.id);
                  setDeletingResident(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('Delete Permanently', 'স্থায়ীভাবে মুছুন')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
