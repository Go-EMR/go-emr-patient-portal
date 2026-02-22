import { inject, Injectable, signal, DOCUMENT } from '@angular/core';

import { hiTranslations, taTranslations, bnTranslations } from './translations-indic';
import { viTranslations, zhTranslations, tlTranslations, htTranslations } from './translations-additional';
import { teTranslations, mrTranslations, knTranslations } from './translations-indic-extra';
import { yueTranslations, arTranslations, itTranslations, elTranslations } from './translations-community';

export type SupportedLanguage =
  | 'en' | 'es'
  | 'hi' | 'ta' | 'bn' | 'te' | 'mr' | 'kn'
  | 'vi' | 'zh' | 'tl' | 'ht'
  | 'yue' | 'ar' | 'it' | 'el';

/**
 * TranslationService
 *
 * Lightweight i18n service using Angular Signals.  Provides translations for
 * the patient portal in English, Spanish, Hindi, Tamil, Bengali, Vietnamese,
 * Mandarin Chinese, Tagalog, French Creole, Telugu, Marathi, Kannada,
 * Cantonese, Arabic, Italian, and Greek.  Keys follow a dot-notation
 * namespace convention (e.g. 'nav.dashboard', 'common.save').
 *
 * Usage:
 *   // In a component
 *   readonly t = inject(TranslationService);
 *   title = computed(() => this.t.translate('nav.dashboard'));
 *
 *   // In a template (via TranslatePipe)
 *   {{ 'nav.dashboard' | translate }}
 */
@Injectable({ providedIn: 'root' })
export class TranslationService {
  private document = inject(DOCUMENT);

  private _currentLanguage = signal<SupportedLanguage>('en');
  readonly currentLanguage = this._currentLanguage.asReadonly();

  // ── Translation tables ──────────────────────────────────────────────────────

  private readonly translations: Record<SupportedLanguage, Record<string, string>> = {
    en: {
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.appointments': 'Appointments',
      'nav.messages': 'Messages',
      'nav.billing': 'Billing',
      'nav.settings': 'Settings',
      'nav.health_records': 'Health Records',
      'nav.prescriptions': 'Prescriptions',
      'nav.telehealth': 'Telehealth',
      'nav.providers': 'Providers',
      'nav.care_team': 'Care Team',
      'nav.forms': 'Forms',
      'nav.overview': 'Overview',
      'nav.quick_help': 'Quick Help',
      'nav.symptom_checker': 'Symptom Checker',
      'nav.referrals': 'Referrals',
      'nav.health_analytics': 'Health Analytics',
      'nav.timeline': 'Timeline',
      'nav.lab_trends': 'Lab Trends',
      'nav.questionnaires': 'Questionnaires',
      'nav.devices': 'Devices',
      'nav.insurance': 'Insurance',
      'nav.feedback': 'Feedback',

      // Dashboard
      'dashboard.welcome': 'Welcome back',
      'dashboard.health_summary': "Here's your health summary for today",
      'dashboard.upcoming_appointments': 'Upcoming Appointments',
      'dashboard.unread_messages': 'Unread Messages',
      'dashboard.lab_results': 'New Lab Results',
      'dashboard.outstanding_balance': 'Outstanding Balance',
      'dashboard.next_appointment': 'Next Appointment',
      'dashboard.recent_vitals': 'Recent Vitals',
      'dashboard.active_medications': 'Active Medications',
      'dashboard.recent_messages': 'Recent Messages',

      // Common actions
      'common.view_all': 'View All',
      'common.book_appointment': 'Book Appointment',
      'common.send_message': 'Send Message',
      'common.sign_out': 'Sign Out',
      'common.cancel': 'Cancel',
      'common.save': 'Save',
      'common.submit': 'Submit',
      'common.loading': 'Loading...',
      'common.no_data': 'No data available',
      'common.back': 'Back',
      'common.close': 'Close',
      'common.confirm': 'Confirm',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.search': 'Search',
      'common.filter': 'Filter',
      'common.print': 'Print',
      'common.download': 'Download',
      'common.next': 'Next',

      // Settings
      'settings.title': 'Settings',
      'settings.subtitle': 'Manage your account and preferences',
      'settings.profile': 'Profile Information',
      'settings.security': 'Security',
      'settings.notifications': 'Notifications',
      'settings.preferences': 'Preferences',
      'settings.language': 'Language',
      'settings.timezone': 'Time Zone',
      'settings.simple_view': 'Simple View',
      'settings.simple_view_desc': 'Show plain-language explanations for medical terms',
      'settings.reading_level': 'Reading Level',
      'settings.reading_level_desc': 'Adjust the complexity of health information displayed',
      'settings.reading_standard': 'Standard',
      'settings.reading_easy': 'Easy Read (8th grade)',
      'settings.reading_simple': 'Very Simple (5th grade)',

      // Accessibility
      'a11y.skip_to_main': 'Skip to main content',
      'a11y.expand_sidebar': 'Expand sidebar',
      'a11y.collapse_sidebar': 'Collapse sidebar',
      'a11y.notifications': 'Notifications',
      'a11y.unread_count': '{count} unread',
    },

    es: {
      // Navegación
      'nav.dashboard': 'Panel Principal',
      'nav.appointments': 'Citas',
      'nav.messages': 'Mensajes',
      'nav.billing': 'Facturación',
      'nav.settings': 'Configuración',
      'nav.health_records': 'Registros de Salud',
      'nav.prescriptions': 'Recetas',
      'nav.telehealth': 'Telesalud',
      'nav.providers': 'Proveedores',
      'nav.care_team': 'Equipo de Atención',
      'nav.forms': 'Formularios',
      'nav.overview': 'Resumen',
      'nav.quick_help': 'Ayuda Rápida',
      'nav.symptom_checker': 'Verificador de Síntomas',
      'nav.referrals': 'Derivaciones',
      'nav.health_analytics': 'Análisis de Salud',
      'nav.timeline': 'Cronología',
      'nav.lab_trends': 'Tendencias de Laboratorio',
      'nav.questionnaires': 'Cuestionarios',
      'nav.devices': 'Dispositivos',
      'nav.insurance': 'Seguro',
      'nav.feedback': 'Comentarios',

      // Panel principal
      'dashboard.welcome': 'Bienvenido de nuevo',
      'dashboard.health_summary': 'Aquí está su resumen de salud para hoy',
      'dashboard.upcoming_appointments': 'Próximas Citas',
      'dashboard.unread_messages': 'Mensajes sin leer',
      'dashboard.lab_results': 'Nuevos resultados de laboratorio',
      'dashboard.outstanding_balance': 'Saldo pendiente',
      'dashboard.next_appointment': 'Próxima Cita',
      'dashboard.recent_vitals': 'Signos Vitales Recientes',
      'dashboard.active_medications': 'Medicamentos Activos',
      'dashboard.recent_messages': 'Mensajes Recientes',

      // Acciones comunes
      'common.view_all': 'Ver todo',
      'common.book_appointment': 'Reservar Cita',
      'common.send_message': 'Enviar Mensaje',
      'common.sign_out': 'Cerrar Sesión',
      'common.cancel': 'Cancelar',
      'common.save': 'Guardar',
      'common.submit': 'Enviar',
      'common.loading': 'Cargando...',
      'common.no_data': 'No hay datos disponibles',
      'common.back': 'Atrás',
      'common.close': 'Cerrar',
      'common.confirm': 'Confirmar',
      'common.delete': 'Eliminar',
      'common.edit': 'Editar',
      'common.search': 'Buscar',
      'common.filter': 'Filtrar',
      'common.print': 'Imprimir',
      'common.download': 'Descargar',
      'common.next': 'Siguiente',

      // Configuración
      'settings.title': 'Configuración',
      'settings.subtitle': 'Gestione su cuenta y preferencias',
      'settings.profile': 'Información de Perfil',
      'settings.security': 'Seguridad',
      'settings.notifications': 'Notificaciones',
      'settings.preferences': 'Preferencias',
      'settings.language': 'Idioma',
      'settings.timezone': 'Zona Horaria',
      'settings.simple_view': 'Vista Simple',
      'settings.simple_view_desc': 'Mostrar explicaciones en lenguaje sencillo para términos médicos',
      'settings.reading_level': 'Nivel de Lectura',
      'settings.reading_level_desc': 'Ajuste la complejidad de la información de salud mostrada',
      'settings.reading_standard': 'Estándar',
      'settings.reading_easy': 'Lectura Fácil (8° grado)',
      'settings.reading_simple': 'Muy Simple (5° grado)',

      // Accesibilidad
      'a11y.skip_to_main': 'Ir al contenido principal',
      'a11y.expand_sidebar': 'Expandir barra lateral',
      'a11y.collapse_sidebar': 'Contraer barra lateral',
      'a11y.notifications': 'Notificaciones',
      'a11y.unread_count': '{count} sin leer',
    },

    // ── Indic languages ────────────────────────────────────────────────────────
    hi: hiTranslations,
    ta: taTranslations,
    bn: bnTranslations,

    // ── Additional Indic languages ─────────────────────────────────────────────
    te: teTranslations,
    mr: mrTranslations,
    kn: knTranslations,

    // ── Additional languages ───────────────────────────────────────────────────
    vi: viTranslations,
    zh: zhTranslations,
    tl: tlTranslations,
    ht: htTranslations,

    // ── Community languages ────────────────────────────────────────────────────
    yue: yueTranslations,
    ar: arTranslations,
    it: itTranslations,
    el: elTranslations,
  };

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Switch the active language.  Updates the <html lang> attribute for
   * assistive technologies and persists the choice to localStorage.
   */
  setLanguage(lang: SupportedLanguage): void {
    this._currentLanguage.set(lang);
    this.document.documentElement.lang = lang;
    try {
      localStorage.setItem('portal_language', lang);
    } catch {
      // localStorage may be unavailable in restricted environments — ignore.
    }
  }

  /**
   * Retrieve the translated string for the given key in the current language.
   * Falls back to English if the key is missing in the active language, and
   * returns the key itself if not found in either language.
   */
  translate(key: string): string {
    const lang = this._currentLanguage();
    const table = this.translations[lang];
    if (table[key] !== undefined) return table[key];

    // Fallback to English
    const en = this.translations['en'];
    if (en[key] !== undefined) return en[key];

    // Return the key as last resort (avoids blank UI)
    return key;
  }

  /**
   * Restore persisted language preference (call once from app initialisation).
   */
  restoreLanguage(): void {
    try {
      const stored = localStorage.getItem('portal_language') as SupportedLanguage | null;
      const supported: SupportedLanguage[] = [
        'en', 'es',
        'hi', 'ta', 'bn', 'te', 'mr', 'kn',
        'vi', 'zh', 'tl', 'ht',
        'yue', 'ar', 'it', 'el'
      ];
      if (stored && supported.includes(stored)) {
        this.setLanguage(stored);
      }
    } catch {
      // Ignore
    }
  }
}
