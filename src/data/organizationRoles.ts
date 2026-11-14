import { Role, RoleDetail, VillageResident, FundTransaction } from '../types';

export const ORGANIZATION_ROLES: RoleDetail[] = [
  {
    role: 'Admin',
    titleEn: 'Admin (System Administrator)',
    titleBn: 'অ্যাডমিন (সিস্টেম প্রশাসক)',
    departmentEn: 'System Administration & Full Governance',
    departmentBn: 'সিস্টেম প্রশাসন ও সার্বিক নিয়ন্ত্রণ',
    descriptionEn: 'Primary system administrator with full authority to manage members, roles, village census, treasury funds, notices, events, projects, gallery, applications, inbox, and community settings.',
    descriptionBn: 'সিস্টেমের প্রধান প্রশাসক। সদস্য নিবন্ধন, পদবি নির্ধারণ, নাগরিক তথ্য, তহবিল, নোটিশ, ইভেন্ট, প্রকল্প, গ্যালারি, আবেদন ও কমিউনিটি সেটিংস পরিচালনার পূর্ণ ক্ষমতা রাখেন।',
    dutiesEn: [
      'Manage member registrations, role grants, and council access permissions',
      'Maintain community settings, official contact email, and website backgrounds',
      'Oversee and manage all notices, events, projects, gallery, census, and treasury records',
      'Review and approve/reject incoming membership applications and visitor inquiries'
    ],
    dutiesBn: [
      'সদস্য নিবন্ধন, পদবি বণ্টন ও অ্যাক্সেস পারমিশন পরিচালনা করা',
      'কমিউনিটির সেটিংস, অফিসিয়াল ইমেইল ও ওয়েবসাইট ব্যাকগ্রাউন্ড হালনাগাদ রাখা',
      'সকল নোটিশ, ইভেন্ট, প্রকল্প, গ্যালারি, নাগরিক তথ্য ও তহবিল পরিচালনা করা',
      'নতুন সদস্য আবেদন অনুমোদন/বাতিল ও ভিজিটর ইনবক্স তদারকি করা'
    ],
    canManageFunds: true,
    canCollectData: true,
    canManageMembers: true,
    canManageNotices: true,
    canManageEvents: true,
    canManageProjects: true,
    canManageGallery: true,
    badgeColor: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-200 border-emerald-400 dark:border-emerald-700 font-bold'
  },
  {
    role: 'President',
    titleEn: 'President',
    titleBn: 'সভাপতি',
    departmentEn: 'Executive Presidency & Governance (View-Only Audit)',
    departmentBn: 'নির্বাহী পরিষদ ও সার্বিক তদারকি (পর্যবেক্ষণ)',
    descriptionEn: 'Chief constitutional head and executive overseer of the community youth council. Has full view-only visibility across all Admin workspaces, records, applications, inbox, treasury, and settings without edit/delete rights.',
    descriptionBn: 'সংগঠনের প্রধান নির্বাহী ও নীতি-নির্ধারক অভিভাবক। অ্যাডমিনের মতো সকল তথ্য, আবেদন, ইনবক্স, তহবিল ও সেটিংস দেখতে পারেন, তবে কোনো তথ্য পরিবর্তন বা মুছতে পারেন না।',
    dutiesEn: [
      'Preside over general and executive council assemblies',
      'Review all community records, applications, treasury ledgers, and inbox in view-only mode',
      'Represent the community in external administrative and regional dialogues',
      'Guide policy decisions and strategic community initiatives'
    ],
    dutiesBn: [
      'সাধারণ সভা ও কার্যনির্বাহী সভার সভাপতিত্ব পরিচালনা করা',
      'কমিউনিটির সকল তথ্য, আবেদন, তহবিল হিসাব ও বার্তা পর্যবেক্ষণ করা (শুধুমাত্র দর্শন)',
      'প্রশাসন ও বহিরাগত ফোরামে সংগঠনের প্রধান প্রতিনিধি হিসেবে দায়িত্ব পালন',
      'সংগঠনের বার্ষিক পরিকল্পনা ও নীতি নির্ধারণে দিকনির্দেশনা প্রদান'
    ],
    badgeColor: 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800'
  },
  {
    role: 'Vice President',
    titleEn: 'Vice President',
    titleBn: 'সহ-সভাপতি',
    departmentEn: 'Executive Presidency & Special Wings',
    departmentBn: 'নির্বাহী নেতৃত্ব ও বিশেষ উইং তত্ত্বাবধান',
    descriptionEn: 'Assists the President in overall direction and takes executive leadership in the Presidents absence.',
    descriptionBn: 'সভাপতির অনুপস্থিতিতে সকল দায়িত্ব পালন এবং বিভিন্ন উপকমিটির কাজ সমন্বয় করা।',
    dutiesEn: [
      'Preside over council meetings in absence of President',
      'Supervise operational sub-committees and volunteer wings',
      'Coordinate mediation and peaceful resolution of youth disputes',
      'Assist executive governance and quarterly progress evaluations'
    ],
    dutiesBn: [
      'সভাপতির অনুপস্থিতিতে সভার সভাপতিত্ব ও প্রশাসনিক কাজ পরিচালনা',
      'বিভিন্ন উপকমিটি ও স্বেচ্ছাসেবক দলের কার্যক্রম তদারকি করা',
      'যুবসমাজের আভ্যন্তরীণ ঐক্য ও সমঝোতা বজায় রাখা',
      'ত্রৈমাসিক উন্নয়ন অগ্রগতি মূল্যায়ন ও সমন্বয় করা'
    ],
    canManageEvents: true,
    canManageProjects: true,
    badgeColor: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
  },
  {
    role: 'General Secretary',
    titleEn: 'General Secretary',
    titleBn: 'সাধারণ সম্পাদক',
    departmentEn: 'General Secretariat & Operations',
    departmentBn: 'সাধারণ সচিবালয় ও সার্বিক প্রশাসন',
    descriptionEn: 'Chief administrative officer responsible for day-to-day operations, official notices, and secretarial communications.',
    descriptionBn: 'সংগঠনের প্রশাসনিক কেন্দ্রবিন্দু। দৈনন্দিন কার্যাবলী, অফিশিয়াল নোটিশ, চিঠি ও সভার সিদ্ধান্ত বাস্তবায়ন করেন।',
    dutiesEn: [
      'Issue and publish official notices, circulars, and PDF announcements',
      'Maintain council proceedings, meeting minutes, and official correspondence',
      'Coordinate between all secretarial portfolios (finance, sports, welfare, media)',
      'Organize emergency sessions and annual general meetings'
    ],
    dutiesBn: [
      'অফিসিয়াল নোটিশ, পরিপত্র ও জরুরি বিজ্ঞপ্তি জারি ও প্রকাশ করা',
      'সভার কার্যবিবরণী (রেজোলিউশন) লিপিবদ্ধ ও সংরক্ষণ করা',
      'বিভিন্ন দপ্তর (অর্থ, ক্রীড়া, সমাজকল্যাণ, প্রচার) এর সাথে যোগাযোগ সমন্বয়',
      'সাধারণ সভা ও বার্ষিক সমাবেশের সার্বিক প্রস্তুতি গ্রহণ'
    ],
    canManageMembers: true,
    canManageNotices: true,
    canManageEvents: true,
    canManageProjects: true,
    badgeColor: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
  },
  {
    role: 'Joint Secretary',
    titleEn: 'Joint General Secretary',
    titleBn: 'যুগ্ম সাধারণ সম্পাদক',
    departmentEn: 'General Secretariat & Field Execution',
    departmentBn: 'সচিবালয় ও মাঠপর্যায়ের সমন্বয়',
    descriptionEn: 'Assists General Secretary with documentation, operational logistics, and field team alignment.',
    descriptionBn: 'সাধারণ সম্পাদককে সার্বিক প্রশাসনিক কাজে সহায়তা ও মাঠপর্যায়ের কার্যক্রম সক্রিয় রাখা।',
    dutiesEn: [
      'Prepare event schedules and meeting agendas',
      'Assist in member communications and circular distribution',
      'Follow up on task completions across village youth squads',
      'Step in for General Secretary when delegated'
    ],
    dutiesBn: [
      'বিভিন্ন সভার কর্মসূচি ও আলোচ্যসূচি প্রস্তুত করা',
      'বিজ্ঞপ্তি ও পরিপত্র সদস্যদের মাঝে পৌঁছানো নিশ্চিত করা',
      'গ্রাম্য যুব দলের মাঠপর্যায়ের অগ্রগতি তদারকি করা',
      'সাধারণ সম্পাদকের নির্দেশিত বিশেষ দায়িত্ব পালন'
    ],
    canManageNotices: true,
    canManageEvents: true,
    badgeColor: 'bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-800'
  },
  {
    role: 'Cashier',
    titleEn: 'Cashier / Treasurer',
    titleBn: 'কোষাধ্যক্ষ / ক্যাশিয়ার',
    departmentEn: 'Treasury & Financial Accounts',
    departmentBn: 'অর্থ দপ্তর ও কোষাধ্যক্ষ',
    descriptionEn: 'Chief financial officer authorized to receive, disburse, calculate, and account for all community funds and donor monies.',
    descriptionBn: 'সংগঠনের তহবিলের সার্বিক রক্ষক ও হিসাব নিয়ন্ত্রক। চাঁদা সংগ্রহ, ব্যয় ভাউচার অনুমোদন ও ব্যালেন্স হিসাব করেন।',
    dutiesEn: [
      'Record incoming membership dues, donations, and philanthropic grants',
      'Issue and register expense vouchers for community initiatives and tree purchases',
      'Calculate and audit live cash balances, inflow/outflow sheets, and ledgers',
      'Present monthly financial transparency reports to council members'
    ],
    dutiesBn: [
      'সদস্যদের নিয়মিত মাসিক চাঁদা ও শুভানুধ্যায়ীদের অনুদান গ্রহণ ও এন্ট্রি',
      'প্রকল্প ব্যয় ও কেনাকাটার যথাযথ ভাউচার প্রস্তুত ও খরচ লিপিবদ্ধ করা',
      'তহবিলের বর্তমান ক্যাশ ব্যালেন্স ও আয়-ব্যয়ের পুঙ্খানুপুঙ্খ হিসাব গণনা',
      'সদস্যদের সামনে স্বচ্ছ মাসিক ও বার্ষিক আয়-ব্যয় বিবরণী উপস্থাপন'
    ],
    canManageFunds: true,
    badgeColor: 'bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-800 font-bold'
  },
  {
    role: 'Assistant Cashier',
    titleEn: 'Assistant Cashier / Co-Treasurer',
    titleBn: 'সহ-কোষাধ্যক্ষ / সহকারী ক্যাশিয়ার',
    departmentEn: 'Treasury & Cash Collection Desk',
    departmentBn: 'অর্থ দপ্তর ও সহকারী ক্যাশিয়ার',
    descriptionEn: 'Assists the Cashier in daily collection, money receipts, voucher entries, and cash count calculations.',
    descriptionBn: 'ক্যাশিয়ারের সাথে সরাসরি তহবিলের টাকা গ্রহণ, খরচ এন্ট্রি, ভাউচার যাচাই এবং হিসাব গণনায় দায়িত্ব পালন করেন।',
    dutiesEn: [
      'Collect monthly subscription fees from village youth members',
      'Enter and verify expense slips and purchase receipts into ledger',
      'Assist Cashier in live balance calculations and reconciliation',
      'Manage field petty cash during events and youth tournaments'
    ],
    dutiesBn: [
      'মাঠপর্যায়ে সদস্যদের কাছ থেকে চাঁদা সংগ্রহ ও রসিদ রেজিস্টার করা',
      'খরচের ক্যাশ ভাউচার ও মেমো সিস্টেমে লিপিবদ্ধ করা',
      'ক্যাশিয়ারকে দৈনিক/মাসিক ব্যালেন্স মেলানো ও গণনায় সহায়তা প্রদান',
      'বিভিন্ন টুর্নামেন্ট ও সামাজিক কাজের সময় খুচরা খরচ পরিচালনা'
    ],
    canManageFunds: true,
    badgeColor: 'bg-yellow-100 text-yellow-950 dark:bg-yellow-950 dark:text-yellow-200 border-yellow-300 dark:border-yellow-800'
  },
  {
    role: 'Data Collector',
    titleEn: 'Data Collector & Field Surveyor',
    titleBn: 'তথ্য সংগ্রাহক ও ফিল্ড সার্ভেয়ার',
    departmentEn: 'Community Census & Public Data Wing',
    departmentBn: 'নাগরিক তথ্য ভাণ্ডার ও জরিপ সেল',
    descriptionEn: 'Authorized field specialist designated by Admin to survey, record, and maintain public villager household information.',
    descriptionBn: 'অ্যাডমিন কর্তৃক অনুমোদিত ফিল্ড স্পেশালিস্ট। সাধারণ গ্রামবাসীদের তথ্য সংগ্রহ, জরুরি সহায়তার তালিকা ও আপডেট করেন।',
    dutiesEn: [
      'Conduct door-to-door village household survey in Gaira, Jolchotro, etc.',
      'Record resident details, family head, occupation, blood group, and contact',
      'Identify and categorize residents eligible for humanitarian and winter relief',
      'Ensure data accuracy, confidentiality, and timely updates for council aid programs'
    ],
    dutiesBn: [
      'গাইরা, জলছত্র ও আশপাশের গ্রামে বাড়ি বাড়ি গিয়ে তথ্য জরিপ করা',
      'পরিবারের প্রধান, সদস্য সংখ্যা, পেশা, মোবাইল ও রক্তের গ্রুপ নিবন্ধন',
      'অসচ্ছল, বয়োবৃদ্ধ, রোগী ও সহায়তাযোগ্য পরিবারসমূহ চিহ্নিত ও লিপিবদ্ধ করা',
      'সংগৃহীত তথ্যের গোপনীয়তা রক্ষা এবং জরুরি সময়ে তাৎক্ষণিক তালিকা সরবরাহ'
    ],
    canCollectData: true,
    badgeColor: 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800'
  },
  {
    role: 'Organizing Secretary',
    titleEn: 'Organizing Secretary',
    titleBn: 'সাংগঠনিক সম্পাদক',
    departmentEn: 'Organization, Membership & Mobilization',
    departmentBn: 'সাংগঠনিক বিস্তার ও সদস্য ব্যবস্থাপনা',
    descriptionEn: 'Responsible for member recruitment, volunteer squads, internal discipline, and organizational expansion.',
    descriptionBn: 'সংগঠনের ভিত মজবুত রাখা, নতুন সদস্য অন্তর্ভুক্তির আবেদন যাচাই এবং যুবকদের ঐক্যবদ্ধ রাখা।',
    dutiesEn: [
      'Review prospective member applications and conduct onboarding verification',
      'Organize ward and para youth cells across Gaira and Jolchotro',
      'Mobilize volunteers for emergency disaster response and village works',
      'Maintain council organizational directory and member participation rosters'
    ],
    dutiesBn: [
      'সদস্য হতে ইচ্ছুকদের আবেদন পর্যালোচনা ও প্রাথমিক যাচাইকরণ',
      'বিভিন্ন পাড়ায় যুব ইউনিট গঠন ও সাংগঠনিক যোগাযোগ বৃদ্ধি করা',
      'জরুরি পরিস্থিতিতে দ্রুত স্বেচ্ছাসেবক টিম প্রস্তুত ও দায়িত্ব বণ্টন',
      'সদস্যদের উপস্থিতি ও সক্রিয় অংশগ্রহণের রেকর্ড রাখা'
    ],
    canManageMembers: true,
    badgeColor: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
  },
  {
    role: 'Publicity Secretary',
    titleEn: 'Publicity & Communication Secretary',
    titleBn: 'প্রচার ও প্রকাশনা সম্পাদক',
    departmentEn: 'Media, PR & Publications Desk',
    departmentBn: 'প্রচার, প্রকাশনা ও জনসংযোগ সেল',
    descriptionEn: 'Leads digital communication, bulletin publications, photography, news coverage, and public relations.',
    descriptionBn: 'সংগঠনের সকল কার্যক্রম প্রচার, প্রেস বিজ্ঞপ্তি তৈরি, ফটো গ্যালারি ও ডিজিটাল মাধ্যম তদারকি করেন।',
    dutiesEn: [
      'Draft and publish community news bulletins and social announcements',
      'Photograph and document youth initiatives, tree plantations, and events',
      'Manage official photo gallery archives and event coverage',
      'Coordinate with local media and maintain public goodwill'
    ],
    dutiesBn: [
      'সংগঠনের সংবাদ বিজ্ঞপ্তি, সারসংক্ষেপ ও প্রেস বিজ্ঞপ্তি প্রস্তুত করা',
      'কার্যক্রমের স্থিরচিত্র ধারণ ও অফিশিয়াল ফটো গ্যালারিতে প্রকাশ করা',
      'ডিজিটাল ওয়াল ও নোটিশ বোর্ডে নিয়মিত তথ্য হালনাগাদ করা',
      'গ্রামবাসীর সাথে সৌহার্দ্যপূর্ণ যোগাযোগ ও প্রচার বাড়ানো'
    ],
    canManageNotices: true,
    canManageEvents: true,
    canManageGallery: true,
    badgeColor: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800'
  },
  {
    role: 'Sports & Cultural Secretary',
    titleEn: 'Sports & Cultural Secretary',
    titleBn: 'ক্রীড়া ও সাংস্কৃতিক সম্পাদক',
    departmentEn: 'Sports, Heritage & Cultural Wing',
    departmentBn: 'ক্রীড়া, সংস্কৃতি ও ঐতিহ্য সংরক্ষণ',
    descriptionEn: 'Organizes football tournaments, traditional cultural celebrations (Wangala, indigenous arts), and youth athletics.',
    descriptionBn: 'যুবকদের মাদক ও বিপথগামিতা থেকে দূরে রাখতে ফুটবল টুর্নামেন্ট ও স্থানীয় ঐতিহ্যবাহী সাংস্কৃতিক উৎসব আয়োজন।',
    dutiesEn: [
      'Organize inter-village football, volleyball, and badminton tournaments',
      'Preserve and showcase Achik/Garo cultural heritage and traditional music',
      'Manage sports equipment, uniforms, grounds, and match logistics',
      'Upload tournament photos and highlight sporting achievements'
    ],
    dutiesBn: [
      'আন্তঃগ্রাম ফুটবল, ভলিবল ও শীতকালীন ব্যাডমিন্টন টুর্নামেন্ট আয়োজন',
      'আচিক/গারো নিজস্ব সংস্কৃতি, লোকসংগীত ও ওয়ানগালা উৎসব উদযাপন',
      'খেলার মাঠ সংস্কার ও খেলাধুলার সরঞ্জামাদি সংরক্ষণ ও বণ্টন',
      'ক্রীড়াবিদদের অনুপ্রেরণা ও টুর্নামেন্টের ফটো গ্যালারি ব্যবস্থাপনা'
    ],
    canManageEvents: true,
    canManageGallery: true,
    badgeColor: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
  },
  {
    role: 'Social Welfare Secretary',
    titleEn: 'Social Welfare & Relief Secretary',
    titleBn: 'সমাজকল্যাণ ও ত্রাণ সম্পাদক',
    departmentEn: 'Social Welfare, Environment & Relief',
    departmentBn: 'সমাজকল্যাণ, ত্রাণ ও পরিবেশ সংরক্ষণ',
    descriptionEn: 'Spearheads tree plantations, environmental drives, winter clothing distributions, and humanitarian aid.',
    descriptionBn: 'বৃক্ষরোপণ কর্মসূচি, শীতবস্ত্র বিতরণ, অসুস্থদের রক্তদান সহায়তা এবং অসচ্ছল পরিবারে ত্রাণ পৌঁছে দেওয়া।',
    dutiesEn: [
      'Plan and execute native tree plantation drives across Madhupur forest edge',
      'Distribute warm clothes, blankets, and dry food during hardship seasons',
      'Coordinate emergency medical relief and blood donor calls for critical patients',
      'Supervise community clean-up campaigns and green village initiatives'
    ],
    dutiesBn: [
      'সবুজ গ্রাম ও বনাঞ্চল রক্ষায় নিয়মিত বৃক্ষরোপণ কর্মসূচি পরিচালনা',
      'শীতকালে ছিন্নমূল ও অসচ্ছল পরিবারের মাঝে শীতবস্ত্র ও কম্বল বিতরণ',
      'জরুরি রোগী ও গর্ভবতী মায়েদের রক্তদাতাদের সাথে তাৎক্ষণিক সংযোগ',
      'গ্রামের রাস্তাঘাট পরিষ্কার ও পরিবেশ সচেতনতামূলক ক্যাম্পেইন পরিচালনা'
    ],
    canManageProjects: true,
    badgeColor: 'bg-lime-100 text-lime-900 dark:bg-lime-950 dark:text-lime-300 border-lime-200 dark:border-lime-800'
  },
  {
    role: 'Education & Library Secretary',
    titleEn: 'Education & Youth Development Secretary',
    titleBn: 'শিক্ষা ও পাঠাগার সম্পাদক',
    departmentEn: 'Education, Literacy & Youth Skills',
    departmentBn: 'শিক্ষা, পাঠাগার ও যুব দক্ষতা উন্নয়ন',
    descriptionEn: 'Fosters educational support for village students, manages youth library, and organizes skills workshops.',
    descriptionBn: 'গ্রামের শিক্ষার্থীদের লেখাপড়ায় সহায়তা, বিনামূল্যে পাঠদান, পাঠাগার উন্নয়ন ও কম্পিউটার/স্কিল প্রশিক্ষণ।',
    dutiesEn: [
      'Organize free evening tutoring and mentorship for underprivileged school children',
      'Maintain community book bank, study materials, and youth reading circle',
      'Host career guidance sessions and digital literacy workshops for teenagers',
      'Facilitate scholarships and school supply kits for meritorious village students'
    ],
    dutiesBn: [
      'অসচ্ছল শিক্ষার্থীদের জন্য বিনামূল্যে সান্ধ্যকালীন কোচিং ও গাইডেন্স',
      'কমিউনিটি পাঠাগার ও শিক্ষা সামগ্রী ব্যাংক পরিচালনা করা',
      'তরুণদের জন্য কম্পিউটার, কারিগরি শিক্ষা ও ক্যারিয়ার সচেতনতা সভা',
      'মেধাবী শিক্ষার্থীদের মাঝে শিক্ষা সামগ্রী ও উপবৃত্তি সহায়তা প্রদান'
    ],
    canManageProjects: true,
    badgeColor: 'bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-300 border-violet-200 dark:border-violet-800'
  },
  {
    role: 'Youth Coordinator',
    titleEn: 'Youth Coordinator',
    titleBn: 'যুব সমন্বয়ক',
    departmentEn: 'Youth Mobilization & Field Squads',
    departmentBn: 'যুব শক্তি ও ফিল্ড সমন্বয়',
    descriptionEn: 'Connects village teenagers and young adults into productive community works and leadership pathways.',
    descriptionBn: 'গ্রামের তরুণ প্রজন্মকে সংগঠিত রাখা এবং গঠনমূলক সামাজিক কাজে যুক্ত করা।',
    dutiesEn: [
      'Mobilize youth participants for upcoming voluntary projects',
      'Listen to youth concerns and propose dynamic recreational programs',
      'Lead village youth safety squads and peaceful vigilance',
      'Encourage young girls and boys to develop civic leadership skills'
    ],
    dutiesBn: [
      'সামাজিক কাজে তরুণদের অংশ নিতে উদ্বুদ্ধ ও সমন্বয় করা',
      'যুবকদের সমস্যা ও প্রত্যাশা কার্যনির্বাহী কমিটিতে তুলে ধরা',
      'গ্রামের শৃঙ্খলা ও সচেতনতা সৃষ্টিতে অগ্রণী ভূমিকা রাখা',
      'নতুনদের সামাজিক দায়বদ্ধতা ও নেতৃত্ব বিকাশে সাহায্য করা'
    ],
    badgeColor: 'bg-fuchsia-100 text-fuchsia-900 dark:bg-fuchsia-950 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-800'
  },
  {
    role: 'Executive Member',
    titleEn: 'Executive Member',
    titleBn: 'কার্যনির্বাহী সদস্য',
    departmentEn: 'Executive Council',
    departmentBn: 'কার্যনির্বাহী পরিষদ',
    descriptionEn: 'Voting member of the executive committee participating in all key organizational decisions and project execution.',
    descriptionBn: 'কার্যনির্বাহী কমিটির নিয়মিত সদস্য। নীতি প্রণয়ন সভায় ভোটাধিকার প্রয়োগ ও প্রকল্প বাস্তবায়নে সক্রিয় থাকেন।',
    dutiesEn: [
      'Attend monthly executive committee meetings with voting rights',
      'Take frontline ownership of assigned community projects',
      'Maintain discipline and foster solidarity across village neighborhoods',
      'Support the office bearers in executing emergency initiatives'
    ],
    dutiesBn: [
      'মাসিক কার্যনির্বাহী সভায় নিয়মিত উপস্থিতি ও ভোটাধিকার প্রয়োগ',
      'নির্দিষ্ট প্রজেক্টের দায়িত্ব গ্রহণ করে সফলভাবে বাস্তবায়ন',
      'সংগঠনের সুনাম ও শৃংখলা বজায় রাখা',
      'জরুরি পরিস্থিতিতে কর্মকর্তা ও সম্পাদকমণ্ডলীকে প্রত্যক্ষ সহায়তা'
    ],
    badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
  },
  {
    role: 'Advisor',
    titleEn: 'Senior Advisor',
    titleBn: 'উপদেষ্টা',
    departmentEn: 'Advisory Board & Elders Council',
    departmentBn: 'উপদেষ্টা পরিষদ ও মুরব্বিদের অভিভাবকত্ব',
    descriptionEn: 'Respected senior village elder providing wisdom, ethical guidance, cultural stewardship, and long-term vision.',
    descriptionBn: 'গ্রামের প্রবীণ ও শ্রদ্ধেয় ব্যক্তিত্ব। তরুণদের সঠিক দিকনির্দেশনা, নীতিপরায়ণতা ও ঐতিহ্য রক্ষার পরামর্শ দেন।',
    dutiesEn: [
      'Provide non-partisan ethical counsel to the youth executive committee',
      'Mediate complex community situations with village elders and authorities',
      'Ensure the organization stays true to its secular, social welfare mission',
      'Review annual progress reports and bless community gatherings'
    ],
    dutiesBn: [
      'তরুণ নেতৃত্বকে প্রজ্ঞা ও অভিজ্ঞতার আলোকে প্রয়োজনীয় উপদেশ প্রদান',
      'গ্রামের প্রবীণ সমাজ ও প্রশাসনের সাথে সুসম্পর্ক ও সমন্বয় নিশ্চিত করা',
      'সংগঠনকে অরাজনৈতিক ও জনকল্যাণমুখী ধারায় পরিচালনা করতে পরামর্শ',
      'বার্ষিক সাধারণ সভায় দিকনির্দেশনামূলক বক্তব্য ও আশীর্বাদ প্রদান'
    ],
    badgeColor: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800'
  },
  {
    role: 'Volunteer',
    titleEn: 'Volunteer',
    titleBn: 'স্বেচ্ছাসেবক',
    departmentEn: 'Field Volunteer Brigade',
    departmentBn: 'মাঠপর্যায়ের স্বেচ্ছাসেবক ব্রিগেড',
    descriptionEn: 'Dedicated field volunteer contributing hands-on labor for sapling planting, event setup, medical camps, and relief.',
    descriptionBn: 'মাঠপর্যায়ের মূল চালিকাশক্তি। বৃক্ষরোপণ, অনুষ্ঠান সাজসজ্জা, ত্রাণ বিতরণ ও পরিচ্ছন্নতা অভিযানে সরাসরি শ্রম দেন।',
    dutiesEn: [
      'Participate actively in physical community work and tree planting days',
      'Assist in tent setup, sound arrangements, and crowd coordination at events',
      'Be on standby for emergency blood donation calls in Madhupur hospitals',
      'Spread awareness about education and healthy environment among peers'
    ],
    dutiesBn: [
      'বৃক্ষরোপণ ও পরিচ্ছন্নতা অভিযানে কায়িক শ্রমে অগ্রণী থাকা',
      'অনুষ্ঠানের স্টেজ, চেয়ার ও সাউন্ড সিস্টেমের সার্বিক ব্যবস্থাপনায় সাহায্য',
      'জরুরি রক্তের প্রয়োজনে সবার আগে এগিয়ে আসা',
      'গ্রামে মাদকবিরোধী ও পরিবেশ সচেতনতা ক্যাম্পেইনে অংশ নেওয়া'
    ],
    badgeColor: 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-800'
  },
  {
    role: 'Member',
    titleEn: 'General Member',
    titleBn: 'সাধারণ সদস্য',
    departmentEn: 'General Assembly',
    departmentBn: 'সাধারণ পরিষদ',
    descriptionEn: 'Verified registered community member with full access to confidential member portal, public directory, and forums.',
    descriptionBn: 'নিবন্ধিত সাধারণ সদস্য। মেম্বার পোর্টালে লগইন, গোপনীয় নাগরিক তথ্য ভাণ্ডার দর্শন, ফোরামে মতবিনিময় ও স্বচ্ছ হিসাব দেখতে পারেন।',
    dutiesEn: [
      'Contribute regular monthly dues to keep community initiatives funded',
      'Participate in general assembly meetings and share creative community ideas',
      'Utilize the member portal and village citizen directory for community needs',
      'Uphold village solidarity and support fellow community members in need'
    ],
    dutiesBn: [
      'নিয়মিত মাসিক চাঁদা দিয়ে সংগঠনের তহবিল সচল রাখা',
      'সাধারণ সভায় যোগদান ও গ্রামের উন্নয়নে পরামর্শ প্রদান',
      'মেম্বার পোর্টাল ব্যবহার করে পারস্পরিক যোগাযোগ ও জরুরি রক্তের সন্ধান নেওয়া',
      'গ্রামের যেকোন বিপদ-আপদে একে অপরের পাশে দাঁড়ানো'
    ],
    badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  }
];

export function getRoleDetail(role: Role): RoleDetail {
  const found = ORGANIZATION_ROLES.find(r => r.role === role);
  if (found) return found;
  return ORGANIZATION_ROLES[ORGANIZATION_ROLES.length - 1]; // fallback to Member
}

// Permission checking helpers
export function canManageFunds(role?: Role, isAdmin = false): boolean {
  if (isAdmin || role === 'Admin') return true;
  if (!role || role === 'President') return false;
  return role === 'Cashier' || role === 'Assistant Cashier';
}

export function canCollectData(role?: Role, isAdmin = false): boolean {
  if (isAdmin || role === 'Admin') return true;
  if (!role || role === 'President') return false;
  return role === 'Data Collector';
}

export function canManageNotices(role?: Role, isAdmin = false): boolean {
  if (isAdmin || role === 'Admin') return true;
  if (!role || role === 'President') return false;
  return role === 'General Secretary' || role === 'Joint Secretary' || role === 'Publicity Secretary';
}

export function canManageEvents(role?: Role, isAdmin = false): boolean {
  if (isAdmin || role === 'Admin') return true;
  if (!role || role === 'President') return false;
  return role === 'General Secretary' || role === 'Joint Secretary' || role === 'Publicity Secretary' || role === 'Sports & Cultural Secretary';
}

export function canManageProjects(role?: Role, isAdmin = false): boolean {
  if (isAdmin || role === 'Admin') return true;
  if (!role || role === 'President') return false;
  return role === 'General Secretary' || role === 'Social Welfare Secretary' || role === 'Education & Library Secretary' || role === 'Organizing Secretary';
}

export function canManageMembers(role?: Role, isAdmin = false): boolean {
  if (isAdmin || role === 'Admin') return true;
  if (!role || role === 'President') return false;
  return role === 'General Secretary' || role === 'Organizing Secretary';
}

export function canManageGallery(role?: Role, isAdmin = false): boolean {
  if (isAdmin || role === 'Admin') return true;
  if (!role || role === 'President') return false;
  return role === 'Publicity Secretary' || role === 'Sports & Cultural Secretary';
}

// Initial Village Residents (General Public / Citizen Information)
export const initialVillageResidents: VillageResident[] = [
  {
    id: 'res-1',
    residentNo: 'RES-2026-001',
    name: 'Biren Rema',
    nameBn: 'বীরেন রেমা',
    guardianName: 'Late Proshon Rema',
    village: 'Gaira',
    para: 'Gaira West Para (পশ্চিম পাড়া)',
    phone: '+880 1712-441122',
    nidOrBirthCert: '19759312847291028',
    occupation: 'Small Farmer & Pineapple Grower',
    familyMembersCount: 5,
    bloodGroup: 'B+',
    aidStatus: 'Eligible for Aid',
    aidStatusBn: 'ত্রাণ ও সহায়তাযোগ্য',
    notes: 'Elderly household head; requires winter blanket and periodic medical checkup support for knee arthritis.',
    collectedBy: 'Pritom Sangma (Data Collector)',
    collectedDate: '2026-10-12'
  },
  {
    id: 'res-2',
    residentNo: 'RES-2026-002',
    name: 'Profullo Marak',
    nameBn: 'প্রফুল্ল মারাক',
    guardianName: 'Girish Marak',
    village: 'Gaira',
    para: 'Gaira Middle Para (মধ্য পাড়া)',
    phone: '+880 1819-332211',
    nidOrBirthCert: '19829310294827103',
    occupation: 'Primary School Teacher',
    familyMembersCount: 4,
    bloodGroup: 'A+',
    aidStatus: 'General Resident',
    aidStatusBn: 'সাধারণ অধিবাসী',
    notes: 'Actively encourages village youth in evening studies; volunteer tutor for math.',
    collectedBy: 'Pritom Sangma (Data Collector)',
    collectedDate: '2026-10-14'
  },
  {
    id: 'res-3',
    residentNo: 'RES-2026-003',
    name: 'Suniti Nokrek',
    nameBn: 'সুনীতি নকরেক',
    guardianName: 'Late Joyanto Sangma',
    village: 'Jolchotro',
    para: 'Jolchotro Mission Para (মিশন পাড়া)',
    phone: '+880 1914-776655',
    nidOrBirthCert: '19689310293847561',
    occupation: 'Weaving & Traditional Crafts',
    familyMembersCount: 3,
    bloodGroup: 'O+',
    aidStatus: 'Senior Citizen',
    aidStatusBn: 'বয়োবৃদ্ধ নাগরিক',
    notes: 'Lives with two school-going grandchildren; eligible for community education supplies kit and winter clothing.',
    collectedBy: 'Pritom Sangma (Data Collector)',
    collectedDate: '2026-10-18'
  },
  {
    id: 'res-4',
    residentNo: 'RES-2026-004',
    name: 'Kalam Miah',
    nameBn: 'কালাম মিয়া',
    guardianName: 'Abdul Gafur',
    village: 'Jolchotro',
    para: 'Bazaar Para (বাজার পাড়া)',
    phone: '+880 1723-998877',
    nidOrBirthCert: '19899318274615293',
    occupation: 'Grocery Store Owner',
    familyMembersCount: 6,
    bloodGroup: 'AB+',
    aidStatus: 'General Resident',
    aidStatusBn: 'সাধারণ অধিবাসী',
    notes: 'Local grocery supplier; generously provided discounts for community event snacks and tree plantation day.',
    collectedBy: 'Admin Council',
    collectedDate: '2026-10-20'
  },
  {
    id: 'res-5',
    residentNo: 'RES-2026-005',
    name: 'Milon Chisim',
    nameBn: 'মিলন চিসিম',
    guardianName: 'Bipul Chisim',
    village: 'Gaira',
    para: 'Gaira South Forest Edge (দক্ষিণ বনপ্রান্ত)',
    phone: '+880 1833-221144',
    nidOrBirthCert: '19959318274610294',
    occupation: 'Daily Wage Agricultural Worker',
    familyMembersCount: 4,
    bloodGroup: 'O-',
    aidStatus: 'Eligible for Aid',
    aidStatusBn: 'ত্রাণ ও সহায়তাযোগ্য',
    notes: 'Rare O- blood group; willing emergency donor. Needs agricultural seedling subsidy for homestead vegetable gardening.',
    collectedBy: 'Pritom Sangma (Data Collector)',
    collectedDate: '2026-10-22'
  },
  {
    id: 'res-6',
    residentNo: 'RES-2026-006',
    name: 'Shila Mankhin',
    nameBn: 'শিলা মানখিন',
    guardianName: 'David Rema',
    village: 'Jolchotro',
    para: 'Hospital Road Para (হাসপাতাল রোড)',
    phone: '+880 1745-667788',
    nidOrBirthCert: '19989318294716253',
    occupation: 'College Student (HSC 2nd Year)',
    familyMembersCount: 4,
    bloodGroup: 'B+',
    aidStatus: 'Student / Youth',
    aidStatusBn: 'শিক্ষার্থী / যুবসমাজ',
    notes: 'Applying for community higher-secondary education scholarship and college guide books.',
    collectedBy: 'Pritom Sangma (Data Collector)',
    collectedDate: '2026-10-25'
  },
  {
    id: 'res-7',
    residentNo: 'RES-2026-007',
    name: 'Subol Chambugong',
    nameBn: 'সুবল চাম্বুগং',
    guardianName: 'Late Moniram Chambugong',
    village: 'Gaira',
    para: 'Gaira East Para (পূর্ব পাড়া)',
    phone: '+880 1711-002233',
    nidOrBirthCert: '19619318273645129',
    occupation: 'Retired Forest Guard',
    familyMembersCount: 2,
    bloodGroup: 'A-',
    aidStatus: 'Medical Assistance',
    aidStatusBn: 'চিকিৎসা সহায়তা প্রার্থী',
    notes: 'Requires eye cataract surgery assistance at Tangail Eye Hospital; emergency aid committee notified.',
    collectedBy: 'Admin Council',
    collectedDate: '2026-10-28'
  }
];

// Initial Transactions with realistic Cashier vouchers
export const initialDetailedFunds: FundTransaction[] = [
  {
    id: 'f-1',
    voucherNo: 'VCH-2026-001',
    date: '2026-10-01',
    type: 'Inflow',
    amount: 3200,
    title: 'Monthly Member Subscriptions (32 active members @ 100 BDT)',
    titleBn: 'মাসিক সদস্য চাঁদা সংগ্রহ (৩২ জন @ ১০০ টাকা)',
    donorOrBeneficiary: 'Salmikkhang Active Members',
    category: 'Membership Dues',
    recordedBy: 'Subrata Marak (Cashier)',
    notes: 'Receipt book #1 countersigned by Assistant Cashier.'
  },
  {
    id: 'f-2',
    voucherNo: 'VCH-2026-002',
    date: '2026-10-05',
    type: 'Outflow',
    amount: 1450,
    title: 'Purchase of 60 Native Neem & Mahogany Saplings',
    titleBn: '৬০টি নিম ও মেহগনি চারা ক্রয় ও পরিবহন',
    donorOrBeneficiary: 'Madhupur Forest Nursery',
    category: 'Tree Saplings',
    recordedBy: 'Subrata Marak (Cashier)',
    notes: 'Cash voucher with stamped receipt from Madhupur Forest Nursery.'
  },
  {
    id: 'f-3',
    voucherNo: 'VCH-2026-003',
    date: '2026-10-15',
    type: 'Inflow',
    amount: 5000,
    title: 'Special Donation for Winter Youth Football Cup',
    titleBn: 'শীতকালীন ফুটবল টুর্নামেন্টের জন্য অনুদান',
    donorOrBeneficiary: 'Expatriate Well-Wisher (UK)',
    category: 'Public Donation',
    recordedBy: 'Riton Chisim (Assistant Cashier)',
    notes: 'bKash transfer into organization treasury account; acknowledged in circular.'
  },
  {
    id: 'f-4',
    voucherNo: 'VCH-2026-004',
    date: '2026-10-22',
    type: 'Outflow',
    amount: 2200,
    title: 'Purchase of 2 Match Footballs, Whistles & Goal Nets',
    titleBn: '২টি ফুটবল, বাঁশি ও গোলপোস্ট নেট ক্রয়',
    donorOrBeneficiary: 'Tangail Sports Emporium',
    category: 'Sports Equipment',
    recordedBy: 'Subrata Marak (Cashier)',
    notes: 'Handed over to Sports Secretary Rakib Hasan for upcoming friendly.'
  },
  {
    id: 'f-5',
    voucherNo: 'VCH-2026-005',
    date: '2026-10-29',
    type: 'Inflow',
    amount: 3500,
    title: 'Emergency Medical Solidarity Fund contribution',
    titleBn: 'জরুরি চিকিৎসা তহবিল অনুদান সংগ্রহ',
    donorOrBeneficiary: 'Village Advisory Council & Local Traders',
    category: 'Emergency Aid',
    recordedBy: 'Riton Chisim (Assistant Cashier)',
    notes: 'Earmarked for vulnerable cataract and emergency patient support.'
  },
  {
    id: 'f-6',
    voucherNo: 'VCH-2026-006',
    date: '2026-11-02',
    type: 'Outflow',
    amount: 980,
    title: 'Printing Official Council Notice Circulars & Registry Books',
    titleBn: 'অফিসিয়াল নোটিশ পরিপত্র ও খাতা প্রিন্টিং ব্যয়',
    donorOrBeneficiary: 'Jolchotro Digital Printing',
    category: 'Office & Printing',
    recordedBy: 'Subrata Marak (Cashier)',
    notes: 'Printed 100 circulars and 2 receipt books.'
  }
];
