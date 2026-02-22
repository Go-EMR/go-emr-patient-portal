/**
 * translations-indic-extra.ts
 *
 * Additional Indic language translation tables for the GoHealth Patient Portal.
 * Languages: Telugu (te), Marathi (mr), Kannada (kn).
 *
 * Keys match the dot-notation convention used in TranslationService.
 * Each language contains 40+ key translations covering navigation, dashboard,
 * common actions, settings, appointments, messages, billing, records, and accessibility.
 */

// ---------------------------------------------------------------------------
// Telugu (te) — తెలుగు
// ---------------------------------------------------------------------------

export const teTranslations: Record<string, string> = {
  // Navigation — నావిగేషన్
  'nav.dashboard': 'డాష్‌బోర్డ్',
  'nav.appointments': 'అపాయింట్‌మెంట్లు',
  'nav.messages': 'సందేశాలు',
  'nav.billing': 'బిల్లింగ్',
  'nav.settings': 'సెట్టింగులు',
  'nav.health_records': 'ఆరోగ్య రికార్డులు',
  'nav.prescriptions': 'మందుల చీటీలు',
  'nav.telehealth': 'టెలీహెల్త్',
  'nav.providers': 'వైద్యులు',
  'nav.care_team': 'సంరక్షణ బృందం',
  'nav.forms': 'ఫారాలు',
  'nav.overview': 'సమీక్ష',
  'nav.quick_help': 'త్వరిత సహాయం',
  'nav.symptom_checker': 'లక్షణ పరీక్షకుడు',
  'nav.referrals': 'రిఫరల్స్',
  'nav.health_analytics': 'ఆరోగ్య విశ్లేషణ',
  'nav.timeline': 'కాల రేఖ',
  'nav.lab_trends': 'ల్యాబ్ ట్రెండులు',
  'nav.questionnaires': 'ప్రశ్నాపత్రాలు',
  'nav.devices': 'పరికరాలు',
  'nav.insurance': 'బీమా',
  'nav.feedback': 'అభిప్రాయం',

  // Dashboard — డాష్‌బోర్డ్
  'dashboard.welcome': 'తిరిగి స్వాగతం',
  'dashboard.health_summary': 'ఈ రోజు మీ ఆరోగ్య సారాంశం ఇక్కడ ఉంది',
  'dashboard.upcoming_appointments': 'రాబోయే అపాయింట్‌మెంట్లు',
  'dashboard.unread_messages': 'చదవని సందేశాలు',
  'dashboard.lab_results': 'కొత్త ల్యాబ్ ఫలితాలు',
  'dashboard.outstanding_balance': 'మిగిలిన చెల్లింపు',
  'dashboard.next_appointment': 'తదుపరి అపాయింట్‌మెంట్',
  'dashboard.recent_vitals': 'ఇటీవలి శరీర సూచికలు',
  'dashboard.active_medications': 'ప్రస్తుత మందులు',
  'dashboard.recent_messages': 'ఇటీవలి సందేశాలు',

  // Common actions — సాధారణ చర్యలు
  'common.view_all': 'అన్నీ చూడండి',
  'common.book_appointment': 'అపాయింట్‌మెంట్ బుక్ చేయండి',
  'common.send_message': 'సందేశం పంపండి',
  'common.sign_out': 'సైన్ అవుట్',
  'common.cancel': 'రద్దు చేయండి',
  'common.save': 'సేవ్ చేయండి',
  'common.submit': 'సమర్పించండి',
  'common.loading': 'లోడ్ అవుతోంది...',
  'common.no_data': 'డేటా అందుబాటులో లేదు',
  'common.back': 'వెనుకకు',
  'common.close': 'మూసివేయండి',
  'common.confirm': 'నిర్ధారించండి',
  'common.delete': 'తొలగించండి',
  'common.edit': 'సవరించండి',
  'common.search': 'వెతకండి',
  'common.filter': 'వడపోత',
  'common.print': 'ముద్రించు',
  'common.download': 'డౌన్‌లోడ్ చేయండి',
  'common.next': 'తదుపరి',

  // Settings — సెట్టింగులు
  'settings.title': 'సెట్టింగులు',
  'settings.subtitle': 'మీ ఖాతా మరియు ప్రాధాన్యతలను నిర్వహించండి',
  'settings.profile': 'వ్యక్తిగత సమాచారం',
  'settings.security': 'భద్రత',
  'settings.notifications': 'నోటిఫికేషన్లు',
  'settings.preferences': 'ప్రాధాన్యతలు',
  'settings.language': 'భాష',
  'settings.timezone': 'సమయ మండలం',

  // Appointments — అపాయింట్‌మెంట్లు
  'appointments.title': 'అపాయింట్‌మెంట్లు',
  'appointments.upcoming': 'రాబోయేవి',
  'appointments.past': 'గతంలో జరిగినవి',
  'appointments.schedule': 'అపాయింట్‌మెంట్ సెట్ చేయండి',
  'appointments.cancel': 'అపాయింట్‌మెంట్ రద్దు చేయండి',

  // Messages — సందేశాలు
  'messages.title': 'సందేశాలు',
  'messages.new': 'కొత్త సందేశం',
  'messages.reply': 'జవాబు',
  'messages.sent': 'పంపబడింది',

  // Billing — బిల్లింగ్
  'billing.title': 'బిల్లింగ్',
  'billing.pay': 'చెల్లించండి',
  'billing.statements': 'స్టేట్‌మెంట్లు',
  'billing.balance': 'బ్యాలెన్స్',

  // Records — రికార్డులు
  'records.medications': 'మందులు',
  'records.allergies': 'అలెర్జీలు',
  'records.immunizations': 'టీకాలు',
  'records.labs': 'ల్యాబ్ పరీక్షలు',

  // Accessibility — ప్రవేశయోగ్యత
  'a11y.skip_to_main': 'ప్రధాన కంటెంట్‌కు వెళ్ళండి',
  'a11y.notifications': 'నోటిఫికేషన్లు',
};

// ---------------------------------------------------------------------------
// Marathi (mr) — मराठी
// ---------------------------------------------------------------------------

export const mrTranslations: Record<string, string> = {
  // Navigation — नेव्हिगेशन
  'nav.dashboard': 'डॅशबोर्ड',
  'nav.appointments': 'भेटी',
  'nav.messages': 'संदेश',
  'nav.billing': 'बिलिंग',
  'nav.settings': 'सेटिंग्ज',
  'nav.health_records': 'आरोग्य नोंदी',
  'nav.prescriptions': 'प्रिस्क्रिप्शन',
  'nav.telehealth': 'टेलीहेल्थ',
  'nav.providers': 'सेवा प्रदाते',
  'nav.care_team': 'काळजी संघ',
  'nav.forms': 'फॉर्म',
  'nav.overview': 'आढावा',
  'nav.quick_help': 'त्वरित मदत',
  'nav.symptom_checker': 'लक्षण तपासनीस',
  'nav.referrals': 'रेफरल्स',
  'nav.health_analytics': 'आरोग्य विश्लेषण',
  'nav.timeline': 'वेळरेषा',
  'nav.lab_trends': 'प्रयोगशाळा ट्रेंड',
  'nav.questionnaires': 'प्रश्नावली',
  'nav.devices': 'उपकरणे',
  'nav.insurance': 'विमा',
  'nav.feedback': 'प्रतिक्रिया',

  // Dashboard — डॅशबोर्ड
  'dashboard.welcome': 'पुन्हा स्वागत आहे',
  'dashboard.health_summary': 'आजसाठी तुमचा आरोग्य सारांश येथे आहे',
  'dashboard.upcoming_appointments': 'आगामी भेटी',
  'dashboard.unread_messages': 'न वाचलेले संदेश',
  'dashboard.lab_results': 'नवे प्रयोगशाळा निकाल',
  'dashboard.outstanding_balance': 'थकीत शिल्लक',
  'dashboard.next_appointment': 'पुढील भेट',
  'dashboard.recent_vitals': 'अलीकडील महत्त्वाच्या खुणा',
  'dashboard.active_medications': 'सक्रिय औषधे',
  'dashboard.recent_messages': 'अलीकडील संदेश',

  // Common actions — सामान्य क्रिया
  'common.view_all': 'सर्व पहा',
  'common.book_appointment': 'भेट नोंदवा',
  'common.send_message': 'संदेश पाठवा',
  'common.sign_out': 'साइन आउट',
  'common.cancel': 'रद्द करा',
  'common.save': 'जतन करा',
  'common.submit': 'सादर करा',
  'common.loading': 'लोड होत आहे...',
  'common.no_data': 'कोणतीही माहिती उपलब्ध नाही',
  'common.back': 'मागे',
  'common.close': 'बंद करा',
  'common.confirm': 'पुष्टी करा',
  'common.delete': 'हटवा',
  'common.edit': 'संपादित करा',
  'common.search': 'शोधा',
  'common.filter': 'फिल्टर',
  'common.print': 'मुद्रित करा',
  'common.download': 'डाउनलोड करा',
  'common.next': 'पुढे',

  // Settings — सेटिंग्ज
  'settings.title': 'सेटिंग्ज',
  'settings.subtitle': 'तुमचे खाते आणि प्राधान्ये व्यवस्थापित करा',
  'settings.profile': 'प्रोफाइल माहिती',
  'settings.security': 'सुरक्षितता',
  'settings.notifications': 'सूचना',
  'settings.preferences': 'प्राधान्ये',
  'settings.language': 'भाषा',
  'settings.timezone': 'वेळ क्षेत्र',

  // Appointments — भेटी
  'appointments.title': 'भेटी',
  'appointments.upcoming': 'आगामी',
  'appointments.past': 'मागील',
  'appointments.schedule': 'भेट ठरवा',
  'appointments.cancel': 'भेट रद्द करा',

  // Messages — संदेश
  'messages.title': 'संदेश',
  'messages.new': 'नवा संदेश',
  'messages.reply': 'उत्तर द्या',
  'messages.sent': 'पाठवला',

  // Billing — बिलिंग
  'billing.title': 'बिलिंग',
  'billing.pay': 'पैसे भरा',
  'billing.statements': 'विवरणपत्रे',
  'billing.balance': 'शिल्लक',

  // Records — नोंदी
  'records.medications': 'औषधे',
  'records.allergies': 'ऍलर्जी',
  'records.immunizations': 'लसीकरण',
  'records.labs': 'प्रयोगशाळा चाचण्या',

  // Accessibility — प्रवेशयोग्यता
  'a11y.skip_to_main': 'मुख्य सामग्रीकडे जा',
  'a11y.notifications': 'सूचना',
};

// ---------------------------------------------------------------------------
// Kannada (kn) — ಕನ್ನಡ
// ---------------------------------------------------------------------------

export const knTranslations: Record<string, string> = {
  // Navigation — ನ್ಯಾವಿಗೇಷನ್
  'nav.dashboard': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
  'nav.appointments': 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು',
  'nav.messages': 'ಸಂದೇಶಗಳು',
  'nav.billing': 'ಬಿಲ್ಲಿಂಗ್',
  'nav.settings': 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
  'nav.health_records': 'ಆರೋಗ್ಯ ದಾಖಲೆಗಳು',
  'nav.prescriptions': 'ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್‌ಗಳು',
  'nav.telehealth': 'ಟೆಲಿಹೆಲ್ತ್',
  'nav.providers': 'ವೈದ್ಯರು',
  'nav.care_team': 'ಆರೈಕೆ ತಂಡ',
  'nav.forms': 'ನಮೂನೆಗಳು',
  'nav.overview': 'ಅವಲೋಕನ',
  'nav.quick_help': 'ತ್ವರಿತ ಸಹಾಯ',
  'nav.symptom_checker': 'ರೋಗಲಕ್ಷಣ ಪರೀಕ್ಷಕ',
  'nav.referrals': 'ರೆಫರಲ್‌ಗಳು',
  'nav.health_analytics': 'ಆರೋಗ್ಯ ವಿಶ್ಲೇಷಣೆ',
  'nav.timeline': 'ಟೈಮ್‌ಲೈನ್',
  'nav.lab_trends': 'ಲ್ಯಾಬ್ ಟ್ರೆಂಡ್‌ಗಳು',
  'nav.questionnaires': 'ಪ್ರಶ್ನಾವಳಿಗಳು',
  'nav.devices': 'ಸಾಧನಗಳು',
  'nav.insurance': 'ವಿಮೆ',
  'nav.feedback': 'ಪ್ರತಿಕ್ರಿಯೆ',

  // Dashboard — ಡ್ಯಾಶ್‌ಬೋರ್ಡ್
  'dashboard.welcome': 'ಮತ್ತೆ ಸ್ವಾಗತ',
  'dashboard.health_summary': 'ಇಂದಿನ ನಿಮ್ಮ ಆರೋಗ್ಯ ಸಾರಾಂಶ ಇಲ್ಲಿದೆ',
  'dashboard.upcoming_appointments': 'ಮುಂದಿನ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು',
  'dashboard.unread_messages': 'ಓದದ ಸಂದೇಶಗಳು',
  'dashboard.lab_results': 'ಹೊಸ ಲ್ಯಾಬ್ ಫಲಿತಾಂಶಗಳು',
  'dashboard.outstanding_balance': 'ಬಾಕಿ ಮೊತ್ತ',
  'dashboard.next_appointment': 'ಮುಂದಿನ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್',
  'dashboard.recent_vitals': 'ಇತ್ತೀಚಿನ ಜೀವಸಂಕೇತಗಳು',
  'dashboard.active_medications': 'ಸಕ್ರಿಯ ಔಷಧಗಳು',
  'dashboard.recent_messages': 'ಇತ್ತೀಚಿನ ಸಂದೇಶಗಳು',

  // Common actions — ಸಾಮಾನ್ಯ ಕ್ರಿಯೆಗಳು
  'common.view_all': 'ಎಲ್ಲವನ್ನೂ ನೋಡಿ',
  'common.book_appointment': 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕ್ ಮಾಡಿ',
  'common.send_message': 'ಸಂದೇಶ ಕಳುಹಿಸಿ',
  'common.sign_out': 'ಸೈನ್ ಔಟ್',
  'common.cancel': 'ರದ್ದು ಮಾಡಿ',
  'common.save': 'ಉಳಿಸಿ',
  'common.submit': 'ಸಲ್ಲಿಸಿ',
  'common.loading': 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
  'common.no_data': 'ಯಾವುದೇ ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲ',
  'common.back': 'ಹಿಂದೆ',
  'common.close': 'ಮುಚ್ಚಿ',
  'common.confirm': 'ದೃಢಪಡಿಸಿ',
  'common.delete': 'ಅಳಿಸಿ',
  'common.edit': 'ಸಂಪಾದಿಸಿ',
  'common.search': 'ಹುಡುಕಿ',
  'common.filter': 'ಫಿಲ್ಟರ್',
  'common.print': 'ಮುದ್ರಿಸಿ',
  'common.download': 'ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ',
  'common.next': 'ಮುಂದೆ',

  // Settings — ಸೆಟ್ಟಿಂಗ್‌ಗಳು
  'settings.title': 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
  'settings.subtitle': 'ನಿಮ್ಮ ಖಾತೆ ಮತ್ತು ಆದ್ಯತೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ',
  'settings.profile': 'ಪ್ರೊಫೈಲ್ ಮಾಹಿತಿ',
  'settings.security': 'ಭದ್ರತೆ',
  'settings.notifications': 'ಅಧಿಸೂಚನೆಗಳು',
  'settings.preferences': 'ಆದ್ಯತೆಗಳು',
  'settings.language': 'ಭಾಷೆ',
  'settings.timezone': 'ಸಮಯ ವಲಯ',

  // Appointments — ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು
  'appointments.title': 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು',
  'appointments.upcoming': 'ಮುಂಬರಲಿರುವ',
  'appointments.past': 'ಹಿಂದಿನ',
  'appointments.schedule': 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ನಿಗದಿ ಮಾಡಿ',
  'appointments.cancel': 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ರದ್ದು ಮಾಡಿ',

  // Messages — ಸಂದೇಶಗಳು
  'messages.title': 'ಸಂದೇಶಗಳು',
  'messages.new': 'ಹೊಸ ಸಂದೇಶ',
  'messages.reply': 'ಪ್ರತ್ಯುತ್ತರ',
  'messages.sent': 'ಕಳುಹಿಸಲಾಗಿದೆ',

  // Billing — ಬಿಲ್ಲಿಂಗ್
  'billing.title': 'ಬಿಲ್ಲಿಂಗ್',
  'billing.pay': 'ಪಾವತಿಸಿ',
  'billing.statements': 'ಹೇಳಿಕೆಗಳು',
  'billing.balance': 'ಬ್ಯಾಲೆನ್ಸ್',

  // Records — ದಾಖಲೆಗಳು
  'records.medications': 'ಔಷಧಗಳು',
  'records.allergies': 'ಅಲರ್ಜಿಗಳು',
  'records.immunizations': 'ಲಸಿಕೆಗಳು',
  'records.labs': 'ಲ್ಯಾಬ್ ಪರೀಕ್ಷೆಗಳು',

  // Accessibility — ಪ್ರವೇಶಸಾಧ್ಯತೆ
  'a11y.skip_to_main': 'ಮುಖ್ಯ ವಿಷಯಕ್ಕೆ ಹೋಗಿ',
  'a11y.notifications': 'ಅಧಿಸೂಚನೆಗಳು',
};
