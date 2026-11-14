import React, { useState } from 'react';
import { useCommunity } from '../context/CommunityContext';
import { ORGANIZATION_ROLES } from '../data/organizationRoles';
import { Role, RoleDetail } from '../types';
import {
  Award,
  Coins,
  Home,
  FileText,
  Calendar,
  Layers,
  Users,
  CheckCircle2,
  ChevronRight,
  Search,
} from 'lucide-react';

interface OrganizationStructureProps {
  isAdmin?: boolean;
}

export const OrganizationStructure: React.FC<OrganizationStructureProps> = ({ isAdmin = false }) => {
  const {
    members,
    assignMemberRole,
    quickSwitchMember,
    currentMember,
    setCurrentView,
    t
  } = useCommunity();

  const [searchRole, setSearchRole] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleDetail>(ORGANIZATION_ROLES[0]);
  const [assigningMemberId, setAssigningMemberId] = useState<string>('');

  const filteredRoles = ORGANIZATION_ROLES.filter(r => {
    const q = searchRole.toLowerCase();
    return (
      r.titleEn.toLowerCase().includes(q) ||
      r.titleBn.includes(q) ||
      r.departmentEn.toLowerCase().includes(q) ||
      r.departmentBn.includes(q) ||
      r.descriptionEn.toLowerCase().includes(q) ||
      r.descriptionBn.includes(q)
    );
  });

  // Find members holding a specific role
  const getHolders = (role: Role) => {
    return members.filter(m => m.role === role);
  };

  return (
    <div className="space-y-6">

      {/* Hero Header */}
      <div className="p-6 bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 text-white rounded-3xl border border-emerald-800/50 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-800/80 rounded-full text-emerald-200 text-xs font-semibold">
              <Award className="w-4 h-4 text-amber-300" />
              <span>{t('Organizational Hierarchy & Duty Allocation', 'সাংগঠনিক পদবি কাঠামো ও দায়িত্ব বণ্টন')}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {t('Youth Council Structure & Role Responsibilities', 'যুব সংগঠন পরিচালনা পরিষদ ও কাজের পরিধি')}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              {t(
                'Complete portfolio breakdown for all community office bearers. Admin possesses universal control, while Cashier/Assistant Cashier hold funds authority, Data Collector manages citizen records, and each secretary manages their respective wing.',
                'সংগঠনের সকল পদের দায়িত্ব ও ক্ষমতার সুস্পষ্ট বণ্টন। অ্যাডমিন সকল ক্ষমতা রাখেন, ক্যাশিয়ার/সহকারী ক্যাশিয়ার ফান্ড হিসাব পরিচালনা করেন, তথ্য সংগ্রাহক নাগরিক তথ্য ভাণ্ডার পরিচালনা করেন এবং অন্যান্য সম্পাদক স্ব-স্ব উইং পরিচালনা করেন।'
              )}
            </p>
          </div>

          <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-xs shrink-0 space-y-1">
            <div className="text-[10px] text-emerald-200 font-bold uppercase tracking-wider">
              {t('Total Portfolios Defined', 'নির্ধারিত সাংগঠনিক পদবি')}
            </div>
            <div className="text-2xl font-black text-white">
              {ORGANIZATION_ROLES.length} {t('Roles', 'টি পদবি')}
            </div>
            <div className="text-[11px] text-emerald-300">
              {members.length} {t('active members assigned', 'জন সদস্য দায়িত্বপ্রাপ্ত')}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Roles List, Right Selected Role Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Roles Navigation List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchRole}
              onChange={e => setSearchRole(e.target.value)}
              placeholder={t('Search roles (e.g. Cashier, Data Collector)...', 'পদবি খুঁজুন (যেমন: কোষাধ্যক্ষ, তথ্য সংগ্রাহক)...')}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 backdrop-blur-md"
            />
          </div>

          <div className="glass-card rounded-3xl border border-white/40 dark:border-white/10 divide-y divide-white/20 dark:divide-white/10 overflow-hidden shadow-xl backdrop-blur-2xl max-h-[340px] lg:max-h-[600px] overflow-y-auto">
            {filteredRoles.map(roleItem => {
              const holders = getHolders(roleItem.role);
              const isSelected = selectedRole.role === roleItem.role;
              return (
                <button
                  key={roleItem.role}
                  onClick={() => setSelectedRole(roleItem)}
                  className={`w-full p-3.5 text-left transition-all flex items-center justify-between gap-2 group ${
                    isSelected
                      ? 'bg-emerald-500/15 border-l-4 border-l-emerald-500'
                      : 'hover:bg-white/40 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`font-black text-xs ${isSelected ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-950 dark:text-slate-200'}`}>
                        {roleItem.titleEn}
                      </span>
                      <span className="text-xs text-slate-800 dark:text-slate-400 font-semibold">({roleItem.titleBn})</span>
                    </div>
                    <div className="text-[11px] text-slate-700 dark:text-slate-400 line-clamp-1">
                      {roleItem.departmentEn}
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      {holders.length > 0 ? (
                        <span className="text-[10px] font-bold text-emerald-900 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/70 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          {holders.length} {t('Holding:', 'নিয়োগপ্রাপ্ত:')} {holders.map(h => h.name.split(' ')[0]).join(', ')}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-700 dark:text-slate-400 italic">
                          {t('Vacant position', 'পদটি খালি রয়েছে')}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-emerald-800 dark:text-emerald-400 translate-x-1' : 'text-slate-600 dark:text-slate-400 group-hover:translate-x-0.5'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Role Detail Panel */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-card rounded-3xl border border-white/40 dark:border-white/10 p-4 sm:p-6 shadow-xl backdrop-blur-2xl space-y-5">
            
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-400 block">
                  {selectedRole.departmentEn} · {selectedRole.departmentBn}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-slate-100 mt-0.5">
                  {selectedRole.titleEn} <span className="text-slate-700 dark:text-slate-400 text-base sm:text-lg font-semibold">({selectedRole.titleBn})</span>
                </h3>
              </div>
              <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${selectedRole.badgeColor} shrink-0 self-start`}>
                {selectedRole.role}
              </span>
            </div>

            {/* Description */}
            <div className="space-y-1.5 text-xs text-slate-900 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
              <p className="font-medium">{selectedRole.descriptionEn}</p>
              <p className="text-slate-800 dark:text-slate-400">{selectedRole.descriptionBn}</p>
            </div>

            {/* Key Authorized Permissions */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-500 block">
                {t('Operational System Permissions:', 'সফটওয়্যারে নির্ধারিত ক্ষমতা ও পারমিশন:')}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                  selectedRole.canManageFunds
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                }`}>
                  <Coins className="w-3.5 h-3.5" />
                  <span>{t('Manage Funds & Money', 'ফান্ডের টাকা হিসাব ও এন্ট্রি')}</span>
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                  selectedRole.canCollectData
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-950 dark:text-blue-200 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                }`}>
                  <Home className="w-3.5 h-3.5" />
                  <span>{t('Collect Citizen Records', 'নাগরিক তথ্য সংগ্রহ ও এন্ট্রি')}</span>
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                  selectedRole.canManageNotices
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                }`}>
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t('Issue Notices & Circulars', 'নোটিশ ও পরিপত্র জারি')}</span>
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                  selectedRole.canManageEvents
                    ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-950 dark:text-purple-200 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                }`}>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{t('Events & Tournaments', 'অনুষ্ঠান ও টুর্নামেন্ট')}</span>
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                  selectedRole.canManageProjects
                    ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-300 dark:border-teal-800 text-teal-950 dark:text-teal-200 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                }`}>
                  <Layers className="w-3.5 h-3.5" />
                  <span>{t('Manage Projects & Aid', 'প্রকল্প ও ত্রাণ পরিচালনা')}</span>
                </div>

                <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                  selectedRole.canManageMembers
                    ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300 dark:border-cyan-800 text-cyan-950 dark:text-cyan-200 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                }`}>
                  <Users className="w-3.5 h-3.5" />
                  <span>{t('Member Registration', 'সদস্য তালিকা ও অনুমোদন')}</span>
                </div>
              </div>
            </div>

            {/* Designated Duties & Responsibilities */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                {t('Prescribed Duties & Portfolio Responsibilities:', 'কাজের সুনির্দিষ্ট দায়িত্বসমূহ:')}
              </span>
              <div className="space-y-2">
                {selectedRole.dutiesEn.map((dutyEn, idx) => (
                  <div key={idx} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-3 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{dutyEn}</div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{selectedRole.dutiesBn[idx]}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Currently Assigned Members & Reassignment */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {t('Current Officers Holding This Role:', 'এই পদে বর্তমানে নিয়োজিত সদস্য:')}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {getHolders(selectedRole.role).length} {t('assigned', 'জন')}
                </span>
              </div>

              {getHolders(selectedRole.role).length > 0 ? (
                <div className="space-y-2">
                  {getHolders(selectedRole.role).map(m => (
                    <div key={m.id} className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {m.name[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-slate-950 dark:text-slate-100 truncate">{m.name}</div>
                          <div className="text-[11px] text-slate-700 dark:text-slate-400 font-mono truncate">{m.memberNo} · {m.phone} · {m.village}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            quickSwitchMember(m.id);
                            setCurrentView('member');
                          }}
                          className="w-full sm:w-auto px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs"
                        >
                          {t('Test View →', 'ভিউ টেস্ট →')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs text-slate-700 dark:text-slate-400 text-center">
                  {t('No member is currently assigned to this portfolio.', 'বর্তমানে কোনো সদস্য এই পদে নিয়োজিত নেই।')}
                </div>
              )}

              {/* Admin Quick Assignment Dropdown */}
              {isAdmin && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 text-xs">
                  <span className="font-bold text-slate-900 dark:text-slate-300 shrink-0">
                    {t('Assign another member to this role:', 'অন্য সদস্যকে এই পদে নিযুক্ত করুন:')}
                  </span>
                  <select
                    value={assigningMemberId}
                    onChange={e => setAssigningMemberId(e.target.value)}
                    className="w-full sm:flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-950 dark:text-slate-200 font-semibold text-xs"
                  >
                    <option value="">{t('Select member from registry...', 'তালিকা থেকে সদস্য নির্বাচন করুন...')}</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.memberNo}) - Currently: {m.role}
                      </option>
                    ))}
                  </select>
                  <button
                    disabled={!assigningMemberId}
                    onClick={() => {
                      if (assigningMemberId) {
                        assignMemberRole(assigningMemberId, selectedRole.role);
                        setAssigningMemberId('');
                      }
                    }}
                    className="w-full sm:w-auto px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold rounded-xl shrink-0"
                  >
                    {t('Assign Role', 'নিযুক্ত করুন')}
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
