/**
 * translations-community.ts
 *
 * Community language translation tables for the AuraHealth Patient Portal.
 * Languages: Cantonese (yue), Arabic (ar), Italian (it), Greek (el).
 *
 * Keys match the dot-notation convention used in TranslationService.
 * Each language contains 40+ key translations covering navigation, dashboard,
 * common actions, settings, appointments, messages, billing, records, and accessibility.
 *
 * Arabic note: RTL text direction is noted — the Angular app should apply
 * `dir="rtl"` on the root element when Arabic is active. The translations
 * themselves are correct right-to-left Arabic script.
 */

// ---------------------------------------------------------------------------
// Cantonese (yue) — 廣東話 (Traditional Chinese characters)
// ---------------------------------------------------------------------------

export const yueTranslations: Record<string, string> = {
  // Navigation — 導航
  'nav.dashboard': '主頁',
  'nav.appointments': '預約',
  'nav.messages': '訊息',
  'nav.billing': '賬單',
  'nav.settings': '設定',
  'nav.health_records': '健康紀錄',
  'nav.prescriptions': '處方',
  'nav.telehealth': '遙距醫療',
  'nav.providers': '醫療人員',
  'nav.care_team': '護理團隊',
  'nav.forms': '表格',
  'nav.overview': '概覽',
  'nav.quick_help': '快速幫助',
  'nav.symptom_checker': '症狀檢查',
  'nav.referrals': '轉介',
  'nav.health_analytics': '健康分析',
  'nav.timeline': '時間線',
  'nav.lab_trends': '化驗趨勢',
  'nav.questionnaires': '問卷',
  'nav.devices': '設備',
  'nav.insurance': '保險',
  'nav.feedback': '意見',

  // Dashboard — 主頁
  'dashboard.welcome': '歡迎回來',
  'dashboard.health_summary': '以下係你今日嘅健康摘要',
  'dashboard.upcoming_appointments': '即將到來嘅預約',
  'dashboard.unread_messages': '未讀訊息',
  'dashboard.lab_results': '新化驗結果',
  'dashboard.outstanding_balance': '未付餘額',
  'dashboard.next_appointment': '下次預約',
  'dashboard.recent_vitals': '最近生命體徵',
  'dashboard.active_medications': '現用藥物',
  'dashboard.recent_messages': '最近訊息',

  // Common actions — 常用操作
  'common.view_all': '查看全部',
  'common.book_appointment': '預約',
  'common.send_message': '發送訊息',
  'common.sign_out': '登出',
  'common.cancel': '取消',
  'common.save': '儲存',
  'common.submit': '提交',
  'common.loading': '載入中...',
  'common.no_data': '沒有可用資料',
  'common.back': '返回',
  'common.close': '關閉',
  'common.confirm': '確認',
  'common.delete': '刪除',
  'common.edit': '編輯',
  'common.search': '搜索',
  'common.filter': '篩選',
  'common.print': '列印',
  'common.download': '下載',
  'common.next': '下一步',

  // Settings — 設定
  'settings.title': '設定',
  'settings.subtitle': '管理你嘅帳戶同偏好設定',
  'settings.profile': '個人資料',
  'settings.security': '安全',
  'settings.notifications': '通知',
  'settings.preferences': '偏好',
  'settings.language': '語言',
  'settings.timezone': '時區',

  // Appointments — 預約
  'appointments.title': '預約',
  'appointments.upcoming': '即將到來',
  'appointments.past': '過去',
  'appointments.schedule': '安排預約',
  'appointments.cancel': '取消預約',

  // Messages — 訊息
  'messages.title': '訊息',
  'messages.new': '新訊息',
  'messages.reply': '回覆',
  'messages.sent': '已發送',

  // Billing — 賬單
  'billing.title': '賬單',
  'billing.pay': '付款',
  'billing.statements': '賬單記錄',
  'billing.balance': '餘額',

  // Records — 紀錄
  'records.medications': '藥物',
  'records.allergies': '過敏',
  'records.immunizations': '疫苗接種',
  'records.labs': '化驗',

  // Accessibility — 無障礙
  'a11y.skip_to_main': '跳至主要內容',
  'a11y.notifications': '通知',
};

// ---------------------------------------------------------------------------
// Arabic (ar) — العربية
// RTL language — app should apply dir="rtl" when Arabic is active
// ---------------------------------------------------------------------------

export const arTranslations: Record<string, string> = {
  // Navigation — التنقل
  'nav.dashboard': 'لوحة التحكم',
  'nav.appointments': 'المواعيد',
  'nav.messages': 'الرسائل',
  'nav.billing': 'الفواتير',
  'nav.settings': 'الإعدادات',
  'nav.health_records': 'السجلات الصحية',
  'nav.prescriptions': 'الوصفات الطبية',
  'nav.telehealth': 'الرعاية الصحية عن بُعد',
  'nav.providers': 'مزودو الرعاية',
  'nav.care_team': 'فريق الرعاية',
  'nav.forms': 'النماذج',
  'nav.overview': 'نظرة عامة',
  'nav.quick_help': 'مساعدة سريعة',
  'nav.symptom_checker': 'مدقق الأعراض',
  'nav.referrals': 'الإحالات',
  'nav.health_analytics': 'تحليلات الصحة',
  'nav.timeline': 'الجدول الزمني',
  'nav.lab_trends': 'اتجاهات المختبر',
  'nav.questionnaires': 'الاستبيانات',
  'nav.devices': 'الأجهزة',
  'nav.insurance': 'التأمين',
  'nav.feedback': 'التغذية الراجعة',

  // Dashboard — لوحة التحكم
  'dashboard.welcome': 'مرحباً بعودتك',
  'dashboard.health_summary': 'فيما يلي ملخصك الصحي لليوم',
  'dashboard.upcoming_appointments': 'المواعيد القادمة',
  'dashboard.unread_messages': 'الرسائل غير المقروءة',
  'dashboard.lab_results': 'نتائج المختبر الجديدة',
  'dashboard.outstanding_balance': 'الرصيد المستحق',
  'dashboard.next_appointment': 'الموعد القادم',
  'dashboard.recent_vitals': 'العلامات الحيوية الأخيرة',
  'dashboard.active_medications': 'الأدوية النشطة',
  'dashboard.recent_messages': 'الرسائل الأخيرة',

  // Common actions — الإجراءات الشائعة
  'common.view_all': 'عرض الكل',
  'common.book_appointment': 'حجز موعد',
  'common.send_message': 'إرسال رسالة',
  'common.sign_out': 'تسجيل الخروج',
  'common.cancel': 'إلغاء',
  'common.save': 'حفظ',
  'common.submit': 'إرسال',
  'common.loading': 'جارٍ التحميل...',
  'common.no_data': 'لا توجد بيانات متاحة',
  'common.back': 'رجوع',
  'common.close': 'إغلاق',
  'common.confirm': 'تأكيد',
  'common.delete': 'حذف',
  'common.edit': 'تعديل',
  'common.search': 'بحث',
  'common.filter': 'تصفية',
  'common.print': 'طباعة',
  'common.download': 'تنزيل',
  'common.next': 'التالي',

  // Settings — الإعدادات
  'settings.title': 'الإعدادات',
  'settings.subtitle': 'إدارة حسابك وتفضيلاتك',
  'settings.profile': 'معلومات الملف الشخصي',
  'settings.security': 'الأمان',
  'settings.notifications': 'الإشعارات',
  'settings.preferences': 'التفضيلات',
  'settings.language': 'اللغة',
  'settings.timezone': 'المنطقة الزمنية',

  // Appointments — المواعيد
  'appointments.title': 'المواعيد',
  'appointments.upcoming': 'القادمة',
  'appointments.past': 'السابقة',
  'appointments.schedule': 'جدولة موعد',
  'appointments.cancel': 'إلغاء الموعد',

  // Messages — الرسائل
  'messages.title': 'الرسائل',
  'messages.new': 'رسالة جديدة',
  'messages.reply': 'رد',
  'messages.sent': 'مُرسَل',

  // Billing — الفواتير
  'billing.title': 'الفواتير',
  'billing.pay': 'دفع',
  'billing.statements': 'كشوف الحساب',
  'billing.balance': 'الرصيد',

  // Records — السجلات
  'records.medications': 'الأدوية',
  'records.allergies': 'الحساسية',
  'records.immunizations': 'التطعيمات',
  'records.labs': 'فحوصات المختبر',

  // Accessibility — إمكانية الوصول
  'a11y.skip_to_main': 'انتقل إلى المحتوى الرئيسي',
  'a11y.notifications': 'الإشعارات',
};

// ---------------------------------------------------------------------------
// Italian (it) — Italiano
// ---------------------------------------------------------------------------

export const itTranslations: Record<string, string> = {
  // Navigation — Navigazione
  'nav.dashboard': 'Dashboard',
  'nav.appointments': 'Appuntamenti',
  'nav.messages': 'Messaggi',
  'nav.billing': 'Fatturazione',
  'nav.settings': 'Impostazioni',
  'nav.health_records': 'Cartella Clinica',
  'nav.prescriptions': 'Prescrizioni',
  'nav.telehealth': 'Telemedicina',
  'nav.providers': 'Medici',
  'nav.care_team': 'Team di Cura',
  'nav.forms': 'Moduli',
  'nav.overview': 'Panoramica',
  'nav.quick_help': 'Aiuto Rapido',
  'nav.symptom_checker': 'Controllo Sintomi',
  'nav.referrals': 'Referti',
  'nav.health_analytics': 'Analisi della Salute',
  'nav.timeline': 'Cronologia',
  'nav.lab_trends': 'Tendenze di Laboratorio',
  'nav.questionnaires': 'Questionari',
  'nav.devices': 'Dispositivi',
  'nav.insurance': 'Assicurazione',
  'nav.feedback': 'Feedback',

  // Dashboard — Dashboard
  'dashboard.welcome': 'Bentornato',
  'dashboard.health_summary': 'Ecco il tuo riepilogo della salute per oggi',
  'dashboard.upcoming_appointments': 'Prossimi Appuntamenti',
  'dashboard.unread_messages': 'Messaggi non letti',
  'dashboard.lab_results': 'Nuovi risultati di laboratorio',
  'dashboard.outstanding_balance': 'Saldo in sospeso',
  'dashboard.next_appointment': 'Prossimo Appuntamento',
  'dashboard.recent_vitals': 'Parametri Vitali Recenti',
  'dashboard.active_medications': 'Farmaci Attivi',
  'dashboard.recent_messages': 'Messaggi Recenti',

  // Common actions — Azioni comuni
  'common.view_all': 'Vedi tutto',
  'common.book_appointment': 'Prenota Appuntamento',
  'common.send_message': 'Invia Messaggio',
  'common.sign_out': 'Disconnetti',
  'common.cancel': 'Annulla',
  'common.save': 'Salva',
  'common.submit': 'Invia',
  'common.loading': 'Caricamento...',
  'common.no_data': 'Nessun dato disponibile',
  'common.back': 'Indietro',
  'common.close': 'Chiudi',
  'common.confirm': 'Conferma',
  'common.delete': 'Elimina',
  'common.edit': 'Modifica',
  'common.search': 'Cerca',
  'common.filter': 'Filtra',
  'common.print': 'Stampa',
  'common.download': 'Scarica',
  'common.next': 'Avanti',

  // Settings — Impostazioni
  'settings.title': 'Impostazioni',
  'settings.subtitle': 'Gestisci il tuo account e le preferenze',
  'settings.profile': 'Informazioni Profilo',
  'settings.security': 'Sicurezza',
  'settings.notifications': 'Notifiche',
  'settings.preferences': 'Preferenze',
  'settings.language': 'Lingua',
  'settings.timezone': 'Fuso Orario',

  // Appointments — Appuntamenti
  'appointments.title': 'Appuntamenti',
  'appointments.upcoming': 'Prossimi',
  'appointments.past': 'Passati',
  'appointments.schedule': 'Programma Appuntamento',
  'appointments.cancel': 'Annulla Appuntamento',

  // Messages — Messaggi
  'messages.title': 'Messaggi',
  'messages.new': 'Nuovo Messaggio',
  'messages.reply': 'Rispondi',
  'messages.sent': 'Inviato',

  // Billing — Fatturazione
  'billing.title': 'Fatturazione',
  'billing.pay': 'Paga',
  'billing.statements': 'Estratti Conto',
  'billing.balance': 'Saldo',

  // Records — Cartella Clinica
  'records.medications': 'Farmaci',
  'records.allergies': 'Allergie',
  'records.immunizations': 'Vaccinazioni',
  'records.labs': 'Esami di Laboratorio',

  // Accessibility — Accessibilità
  'a11y.skip_to_main': 'Vai al contenuto principale',
  'a11y.notifications': 'Notifiche',
};

// ---------------------------------------------------------------------------
// Greek (el) — Ελληνικά
// ---------------------------------------------------------------------------

export const elTranslations: Record<string, string> = {
  // Navigation — Πλοήγηση
  'nav.dashboard': 'Πίνακας Ελέγχου',
  'nav.appointments': 'Ραντεβού',
  'nav.messages': 'Μηνύματα',
  'nav.billing': 'Χρέωση',
  'nav.settings': 'Ρυθμίσεις',
  'nav.health_records': 'Ιατρικό Ιστορικό',
  'nav.prescriptions': 'Συνταγές',
  'nav.telehealth': 'Τηλεϊατρική',
  'nav.providers': 'Πάροχοι',
  'nav.care_team': 'Ομάδα Φροντίδας',
  'nav.forms': 'Φόρμες',
  'nav.overview': 'Επισκόπηση',
  'nav.quick_help': 'Γρήγορη Βοήθεια',
  'nav.symptom_checker': 'Έλεγχος Συμπτωμάτων',
  'nav.referrals': 'Παραπομπές',
  'nav.health_analytics': 'Ανάλυση Υγείας',
  'nav.timeline': 'Χρονολόγιο',
  'nav.lab_trends': 'Τάσεις Εργαστηρίου',
  'nav.questionnaires': 'Ερωτηματολόγια',
  'nav.devices': 'Συσκευές',
  'nav.insurance': 'Ασφάλιση',
  'nav.feedback': 'Σχόλια',

  // Dashboard — Πίνακας Ελέγχου
  'dashboard.welcome': 'Καλώς ήρθατε πίσω',
  'dashboard.health_summary': 'Εδώ είναι η υγειονομική σας περίληψη για σήμερα',
  'dashboard.upcoming_appointments': 'Επερχόμενα Ραντεβού',
  'dashboard.unread_messages': 'Αδιάβαστα Μηνύματα',
  'dashboard.lab_results': 'Νέα Αποτελέσματα Εργαστηρίου',
  'dashboard.outstanding_balance': 'Εκκρεμές Υπόλοιπο',
  'dashboard.next_appointment': 'Επόμενο Ραντεβού',
  'dashboard.recent_vitals': 'Πρόσφατα Ζωτικά Σημεία',
  'dashboard.active_medications': 'Ενεργά Φάρμακα',
  'dashboard.recent_messages': 'Πρόσφατα Μηνύματα',

  // Common actions — Κοινές ενέργειες
  'common.view_all': 'Προβολή όλων',
  'common.book_appointment': 'Κράτηση Ραντεβού',
  'common.send_message': 'Αποστολή Μηνύματος',
  'common.sign_out': 'Αποσύνδεση',
  'common.cancel': 'Ακύρωση',
  'common.save': 'Αποθήκευση',
  'common.submit': 'Υποβολή',
  'common.loading': 'Φόρτωση...',
  'common.no_data': 'Δεν υπάρχουν διαθέσιμα δεδομένα',
  'common.back': 'Πίσω',
  'common.close': 'Κλείσιμο',
  'common.confirm': 'Επιβεβαίωση',
  'common.delete': 'Διαγραφή',
  'common.edit': 'Επεξεργασία',
  'common.search': 'Αναζήτηση',
  'common.filter': 'Φίλτρο',
  'common.print': 'Εκτύπωση',
  'common.download': 'Λήψη',
  'common.next': 'Επόμενο',

  // Settings — Ρυθμίσεις
  'settings.title': 'Ρυθμίσεις',
  'settings.subtitle': 'Διαχειριστείτε τον λογαριασμό και τις προτιμήσεις σας',
  'settings.profile': 'Πληροφορίες Προφίλ',
  'settings.security': 'Ασφάλεια',
  'settings.notifications': 'Ειδοποιήσεις',
  'settings.preferences': 'Προτιμήσεις',
  'settings.language': 'Γλώσσα',
  'settings.timezone': 'Ζώνη Ώρας',

  // Appointments — Ραντεβού
  'appointments.title': 'Ραντεβού',
  'appointments.upcoming': 'Επερχόμενα',
  'appointments.past': 'Παρελθόντα',
  'appointments.schedule': 'Προγραμματισμός Ραντεβού',
  'appointments.cancel': 'Ακύρωση Ραντεβού',

  // Messages — Μηνύματα
  'messages.title': 'Μηνύματα',
  'messages.new': 'Νέο Μήνυμα',
  'messages.reply': 'Απάντηση',
  'messages.sent': 'Εστάλη',

  // Billing — Χρέωση
  'billing.title': 'Χρέωση',
  'billing.pay': 'Πληρωμή',
  'billing.statements': 'Καταστάσεις',
  'billing.balance': 'Υπόλοιπο',

  // Records — Ιατρικό Ιστορικό
  'records.medications': 'Φάρμακα',
  'records.allergies': 'Αλλεργίες',
  'records.immunizations': 'Εμβολιασμοί',
  'records.labs': 'Εργαστηριακές Εξετάσεις',

  // Accessibility — Προσβασιμότητα
  'a11y.skip_to_main': 'Μετάβαση στο κύριο περιεχόμενο',
  'a11y.notifications': 'Ειδοποιήσεις',
};
