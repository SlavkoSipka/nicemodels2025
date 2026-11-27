import Image from 'next/image'
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BarChart3,
  Building2,
  Calendar,
  Camera,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Film,
  GraduationCap,
  Handshake,
  Home,
  Lightbulb,
  Lock,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  MessageCircle,
  MessageSquare,
  Monitor,
  Navigation,
  Phone,
  Save,
  Search,
  Settings,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
  User,
  X,
  Zap,
} from 'lucide-react'
import type { GuideView } from './GuidePlayer'
import type { Device, Lang } from './SignupDemoScreens'

/**
 * Copies of the model dashboard for the animated "fill in your profile" and
 * "activate your sedcard" guides: the sidebar (a fixed column on the laptop, a
 * top bar with a drawer on the phone), the profile sections, the activation
 * page and the confirmation after it. Markup and classes mirror
 * DashboardSidebar and the /dashboard/model pages; wording follows
 * `messages/de.json` and `messages/en.json`. Responsive prefixes are replaced
 * by an explicit `device` switch, because the copy is laid out at the device's
 * width, not the viewer's.
 *
 * Nothing here is interactive. `data-demo` marks what the guides click or type
 * into; flags (`view.has`) carry what has happened so far.
 */

export type DashScreen =
  | 'home' | 'bio' | 'about' | 'contact' | 'area' | 'media' | 'services' | 'activate' | 'success'

const PATHS: Record<DashScreen, string> = {
  home: '/dashboard/model',
  bio: '/dashboard/model/profile/biography',
  about: '/dashboard/model/profile/about-me',
  contact: '/dashboard/model/profile/contact-details',
  area: '/dashboard/model/profile/area',
  media: '/dashboard/model/profile/pictures-video',
  services: '/dashboard/model/profile/services',
  activate: '/dashboard/model/activate-ad',
  success: '/dashboard/checkout/success',
}

/** Safari on the iPhone shows only the domain in its address bar; the laptop shows the full path. */
export const dashUrl = (screen: string, device: Device) =>
  device === 'phone' ? 'nicemodels.ch' : `nicemodels.ch${PATHS[screen as DashScreen] ?? PATHS.home}`

/** Dashboard pages have no title of their own, so the tab shows the site default. */
export const dashTabTitle = () => 'NiceModels.ch – Das Erotikportal der Schweiz'

/** The phone has a 56px top bar above the page; the laptop's sidebar sits beside it. */
export const dashHeader = (device: Device) => (device === 'phone' ? 56 : 0)

const PROFILE_SCREENS: DashScreen[] = ['bio', 'about', 'contact', 'area', 'media', 'services']

/** The demo model. */
const SHOWNAME = 'Sandra'
const CLIENT_CODE = 'NM-48213'

const UI = {
  de: {
    sidebar: {
      dashboard: 'Dashboard', myProfile: 'Mein Profil', activateSedcard: 'Sedcard aktivieren', buyBanner: 'Banner kaufen',
      uploadStory: 'Story hochladen', verification: 'Verifizierung', clubsAndInvites: 'Clubs & Einladungen', reviews: 'Bewertungen',
      collaborations: 'Kollaborationen', purchaseHistory: 'Kaufhistorie', statistics: 'Statistiken', settings: 'Einstellungen',
      logout: 'Abmelden', viewModelsPage: 'Models-Seite ansehen', language: 'Deutsch', flag: '🇩🇪',
      subs: [
        ['bio', 'Biografie'], ['about', 'Über mich'], ['contact', 'Kontaktdaten'], ['area', 'Region / Adresse'],
        ['media', 'Bilder / Video'], ['languages', 'Sprachen'], ['services', 'Dienste'], ['hours', 'Arbeitszeiten'], ['rates', 'Tarife'],
      ] as [string, string][],
    },
    cancel: 'Abbrechen', save: 'Speichern', saving: 'Speichern...', select: 'Auswählen...',
    home: {
      howToStart: 'So fängst du an', startTour: 'Geführte Tour starten',
      steps: [
        ['Vervollständige dein Profil', 'Gehe zu Mein Profil und fülle Biografie, Daten und Services aus. Achte darauf, dass alles korrekt ist — genau das sehen Kunden.', 'Mein Profil öffnen'],
        ['Lade Fotos hoch', 'Lade mindestens 3 hochwertige Fotos hoch, damit Kunden dich sehen können. Je besser die Fotos, desto mehr Interesse erhältst du.', 'Fotos hochladen'],
        ['Aktiviere dein Inserat', 'Gehe zu Sedcard aktivieren und wähle eine Laufzeit. Die Aktivierung ist kostenlos — danach erscheint dein Profil in den Suchergebnissen.', 'Sedcard aktivieren'],
      ],
      statusMessage: 'Statusmeldung', statusSubtitle: 'Veröffentliche einen Status, der in der Sidebar der Startseite sichtbar ist',
      adRequired: 'Anzeige erforderlich', adRequiredHint: 'Du benötigst ein aktives Anzeigenpaket, um Statusmeldungen zu posten. Aktiviere deine Anzeige, um Updates zu teilen.',
      activateSedcard: 'Sedcard aktivieren', welcomeBack: 'Willkommen zurück, ', idPrefix: 'ID:', promotion: 'Aktion', buyHomepageBanner: 'Homepage-Banner kaufen',
    },
    bio: {
      title: 'Profil bearbeiten — Biografie', subtitle: 'Pflichtfelder sind markiert mit', basicBio: 'Basis-Bio', showname: 'Showname',
      shownameHint: 'Wird auf deinem Profil angezeigt', slogan: 'Slogan', sloganPlaceholder: 'Dein Slogan oder Schlagwort...', gender: 'Geschlecht',
      genders: ['Weiblich', 'Männlich', 'Trans'], ethnicity: 'Herkunft', nationality: 'Nationalität', age: 'Alter',
      physical: 'Körperliche Merkmale',
      physicalFields: [['Haarfarbe', ''], ['Augenfarbe', ''], ['Kleidergröße', ''], ['Größe', 'cm'], ['Gewicht', 'kg'], ['Brust', 'cm'], ['Taille', 'cm'], ['Hüfte', 'cm'], ['Schambehaarung', '']],
      additional: 'Zusätzliche Informationen', smoking: 'Rauchen', drinking: 'Alkohol', special: 'Besondere Merkmale', specialPlaceholder: 'Tattoos, Piercings, etc.',
      saveChanges: 'Änderungen speichern', saved: 'Biografie erfolgreich gespeichert!',
    },
    about: {
      title: 'Profil bearbeiten — Über mich', subtitle: 'Beschreibe dich und deine Dienstleistungen', label: 'Beschreibe dich',
      placeholder: 'Schreibe über dich, deine Dienstleistungen, was dich besonders macht...',
      hint: (n: number) => `Schreibe mindestens 150 Zeichen, damit Besucher dich besser kennenlernen können (${n}/150).`,
      saved: 'Erfolgreich gespeichert!',
    },
    contact: {
      title: 'Kontaktdaten', subtitle: 'Verwalte deine Kontaktinformationen und Präferenzen', showOnProfile: 'Telefonnummer im Profil anzeigen',
      showOnCard: 'Telefonnummer auf Listing-Karte anzeigen', showOnCardHint: 'Deine Nummer ist direkt auf deiner Karte im Model-Verzeichnis sichtbar, ohne dein Profil öffnen zu müssen.',
      phone: 'Telefonnummer', phonePlaceholder: 'Telefonnummer eingeben', availableOn: 'Verfügbar auf', preference: 'Kontaktpräferenz',
      prefs: ['SMS & Anruf', 'Nur SMS', 'Keine SMS'], noWithheld: 'Keine unterdrückten Nummern', other: 'Andere Anweisungen',
      otherPlaceholder: 'Zusätzliche Anweisungen...', saved: 'Kontaktdaten erfolgreich gespeichert!',
    },
    area: {
      title: 'Profil bearbeiten — Gebiet / Adresse', subtitle: 'Lege deine Stadt und Verfügbarkeitsoptionen fest', shareLocation: 'Aktiven Standort teilen',
      shareLocationHint: 'Wenn aktiviert, wird dein aktueller Standort als Live-Standort auf deiner Profilkarte angezeigt. Dies ändert nicht deine permanente Stadt unten.',
      disabled: 'Deaktiviert', city: 'Stadt', cityPlaceholder: 'Stadt oder PLZ suchen...', postalCode: 'Postleitzahl (PLZ)',
      postalCodeHint: 'Wird automatisch ausgefüllt, wenn du eine Stadt auswählst', street: 'Strasse', streetNumber: 'Hausnummer',
      incall: 'Incall', incalls: ['Privatwohnung', 'Hotelzimmer', 'Club/Studio', 'Andere'],
      outcall: 'Outcall', outcalls: ['Nur Hotelbesuche', 'Nur Hausbesuche', 'Hotel- und Hausbesuche', 'Andere'], saved: 'Gebiet erfolgreich gespeichert!',
    },
    media: {
      title: 'Bilder / Video', subtitle: 'Verwalte deine Fotos und Videos', back: 'Zurück', dragHint: 'Ziehen Sie Fotos, um die Reihenfolge auf Ihrem Profil festzulegen.',
      photos: 'Fotos', upload: 'Fotos hochladen', uploading: 'Wird hochgeladen...', requirements: 'Anforderungen',
      photoReqs: ['Hochwertige Fotos, keine expliziten Inhalte', 'Hochformat: 400×600 px · Querformat: 500×375 px · Max. 10 MB'],
      noPhotos: 'Noch keine Fotos hochgeladen', published: 'Veröffentlicht', delete: 'Löschen', video: 'Video', uploadVideo: 'Video hochladen',
      videoReqs: ['Max. 200 MB · Formate: MP4, MOV, WMV, FLV, AVI, MKV', 'Keine explizite Nacktheit · Min. Höhe 360 px'], noVideos: 'Noch keine Videos hochgeladen',
      autoLabel: 'Automatische Veröffentlichung:', autoHint: 'Hochgeladene Inhalte erscheinen sofort in deinem Profil. Unser Team prüft die Einhaltung der Richtlinien.',
    },
    services: {
      title: 'Profil bearbeiten — Dienstleistungen', subtitle: 'Lege deine Orientierung, Dienstleistungen und Angebote fest',
      orientation: 'Sexuelle Orientierung', servicesFor: 'Dienstleistungen angeboten für', fors: ['Männer', 'Frauen', 'Paare', 'Trans', 'Homosexuelle'],
      services: 'Dienstleistungen', categories: ['Hauptdienstleistungen', 'Zusatzdienstleistungen', 'Fetisch / Bizarr', 'Virtuelle Dienstleistungen', 'Massage (ohne Sex)'],
      other: 'Andere Dienstleistungen', otherHint: 'Füge nicht aufgelistete Dienstleistungen hinzu (optional, max. 2000 Zeichen).',
      otherPlaceholder: 'z. B. individuelle Wünsche, besondere Vereinbarungen…', saved: 'Dienstleistungen erfolgreich gespeichert!',
    },
    activate: {
      title: 'Sedcard aktivieren', subtitle: 'Die Sedcard-Aktivierung ist zurzeit kostenlos — wähle unten eine Laufzeit.',
      checkTitle: 'Vor der Aktivierung — prüfe dein Profil',
      checkBody: 'Sobald deine Anzeige aktiv ist, sehen Besucher deine Profilkarte. Stelle sicher, dass alles top aussieht, bevor du online gehst.',
      checkItems: ['Name, Bio und Beschreibung sind ausgefüllt', 'Standort, Alter und Services sind gesetzt', 'Mindestens 3 hochwertige Fotos hochgeladen', 'Kontaktdaten sind korrekt'],
      editProfile: 'Profil bearbeiten', managePhotos: 'Fotos verwalten', livePreview: 'Live-Vorschau', previewTitle: 'So erscheint deine Profilkarte',
      desktop: 'Desktop', mobile: 'Mobil', yourCard: 'DEINE KARTE', selectDuration: 'Dauer wählen:',
      pkgs: [['5 Tage', 'Dein Profil bleibt 5 Tage lang in der Suche sichtbar.'], ['14 Tage', 'Dein Profil bleibt 14 Tage lang in der Suche sichtbar.'], ['30 Tage', 'Dein Profil bleibt 30 Tage lang in der Suche sichtbar.']],
      free: 'Kostenlos für Models', noPayment: 'Keine Zahlung nötig', inCart: 'Im Warenkorb', activationDate: 'Aktivierungsdatum:',
      acts: ['Sofort', 'Nach aktueller', 'An bestimmtem Datum'], addToCart: 'In den Warenkorb', yourCart: 'Dein Warenkorb:',
      actImmediatelyDesc: 'Sofort aktivieren', remove: 'Entfernen', total: 'Gesamt:', cart: 'Warenkorb: 1 Artikel',
      termsPre: 'Ich akzeptiere die ', terms: 'AGB / Nutzungsbedingungen', termsMid: ' und die ', privacy: 'Datenschutzerklärung', termsPost: '.',
      confirm: 'Jetzt aktivieren',
    },
    success: {
      title: 'Aktivierung abgeschlossen', desc: 'Deine Sedcard ist aktiv und in der Suche sichtbar.', order: 'Bestellung', items: 'Artikel',
      item: '30 Days', itemType: '(ad package)', total: 'Gesamt', method: 'Zahlungsmethode', free: 'Kostenlos', cta: 'Bestellverlauf',
    },
  },
  en: {
    sidebar: {
      dashboard: 'Dashboard', myProfile: 'My Profile', activateSedcard: 'Activate Sedcard', buyBanner: 'Buy Banner',
      uploadStory: 'Upload Story', verification: 'Verification', clubsAndInvites: 'Clubs & Invites', reviews: 'Reviews',
      collaborations: 'Collaborations', purchaseHistory: 'Purchase History', statistics: 'Statistics', settings: 'Settings',
      logout: 'Logout', viewModelsPage: 'View Models Page', language: 'English', flag: '🇬🇧',
      subs: [
        ['bio', 'Biography'], ['about', 'About Me'], ['contact', 'Contact Details'], ['area', 'Area / Address'],
        ['media', 'Pictures / Video'], ['languages', 'Languages'], ['services', 'Services'], ['hours', 'Working Hours'], ['rates', 'Rates'],
      ] as [string, string][],
    },
    cancel: 'Cancel', save: 'Save', saving: 'Saving...', select: 'Select...',
    home: {
      howToStart: 'How to get started', startTour: 'Start guided tour',
      steps: [
        ['Complete your profile', 'Go to My Profile and fill in your biography, details and services. Make sure everything is accurate — this is exactly what clients will see.', 'Open My Profile'],
        ['Upload your photos', 'Add at least 3 high-quality photos so clients can see you. The better the photos, the more interest you will get.', 'Upload photos'],
        ['Activate your ad', 'Go to Activate Sedcard and choose a duration. Activation is free — your profile will appear in search results once activated.', 'Activate Sedcard'],
      ],
      statusMessage: 'Status Message', statusSubtitle: 'Post a status visible on the homepage sidebar',
      adRequired: 'Ad required', adRequiredHint: 'You need an active ad package to post status messages. Activate your ad to start sharing updates.',
      activateSedcard: 'Activate Sedcard', welcomeBack: 'Welcome back, ', idPrefix: 'ID:', promotion: 'Promotion', buyHomepageBanner: 'Buy a homepage banner',
    },
    bio: {
      title: 'Edit Profile — Biography', subtitle: 'Mandatory fields are marked with', basicBio: 'Basic BIO', showname: 'Showname',
      shownameHint: 'Appears on your profile', slogan: 'Slogan', sloganPlaceholder: 'Your slogan or keyword...', gender: 'Gender',
      genders: ['Female', 'Male', 'Trans'], ethnicity: 'Background', nationality: 'Nationality', age: 'Age',
      physical: 'Physical Features',
      physicalFields: [['Hair Color', ''], ['Eye Color', ''], ['Dress Size', ''], ['Height', 'cm'], ['Weight', 'kg'], ['Bust', 'cm'], ['Waist', 'cm'], ['Hip', 'cm'], ['Pubic Hair', '']],
      additional: 'Additional Information', smoking: 'Smoking', drinking: 'Drinking', special: 'Special Characteristics', specialPlaceholder: 'Tattoos, piercings, etc.',
      saveChanges: 'Save Changes', saved: 'Biography saved successfully!',
    },
    about: {
      title: 'Edit Profile — About Me', subtitle: 'Describe yourself and your services', label: 'Describe yourself',
      placeholder: 'Write about yourself, your services, what makes you special...',
      hint: (n: number) => `Write at least 150 characters so visitors get a real sense of you (${n}/150).`,
      saved: 'Saved successfully!',
    },
    contact: {
      title: 'Contact Details', subtitle: 'Manage your contact information and preferences', showOnProfile: 'Show phone number on profile',
      showOnCard: 'Show phone number on listing card', showOnCardHint: 'Your number will be visible directly on your card in the model directory, without needing to open your profile.',
      phone: 'Phone Number', phonePlaceholder: 'Enter phone number', availableOn: 'Available on', preference: 'Contact Preference',
      prefs: ['SMS & Call', 'SMS Only', 'No SMS'], noWithheld: 'No withheld numbers', other: 'Other instructions',
      otherPlaceholder: 'Additional instructions...', saved: 'Contact details saved successfully!',
    },
    area: {
      title: 'Edit Profile — Area / Address', subtitle: 'Set your city and availability options', shareLocation: 'Share Active Location',
      shareLocationHint: 'When enabled, your current location will be shared as a live location on your profile card. This does not change your permanent city setting below.',
      disabled: 'Disabled', city: 'City', cityPlaceholder: 'Search city or PLZ...', postalCode: 'Postal Code (PLZ)',
      postalCodeHint: 'Auto-filled when selecting a city', street: 'Street', streetNumber: 'Street Number',
      incall: 'Incall', incalls: ['Private apartment', 'Hotel room', 'Club/Studio', 'Other'],
      outcall: 'Outcall', outcalls: ['Hotel visits only', 'Home visits only', 'Hotel and Home visits', 'Other'], saved: 'Area saved successfully!',
    },
    media: {
      title: 'Pictures / Video', subtitle: 'Manage your photos and videos', back: 'Back', dragHint: 'Drag photos to set which appears first on your profile.',
      photos: 'Photos', upload: 'Upload Photos', uploading: 'Uploading...', requirements: 'Requirements',
      photoReqs: ['Good quality photos, no explicit content', 'Portrait: 400×600 px · Landscape: 500×375 px · Max 10MB'],
      noPhotos: 'No photos uploaded yet', published: 'Published', delete: 'Delete', video: 'Video', uploadVideo: 'Upload Video',
      videoReqs: ['Max 200MB · Formats: MP4, MOV, WMV, FLV, AVI, MKV', 'No explicit nudity · Min height 360px'], noVideos: 'No videos uploaded yet',
      autoLabel: 'Auto-publish:', autoHint: 'Uploaded content appears on your profile immediately. Our team monitors for policy compliance.',
    },
    services: {
      title: 'Edit Profile — Services', subtitle: 'Set your orientation, services, and what you offer',
      orientation: 'Sexual Orientation', servicesFor: 'Services Offered For', fors: ['Men', 'Women', 'Couples', 'Trans', 'Gays'],
      services: 'Services', categories: ['Main Services', 'Extra Services', 'Fetish / Bizarre', 'Virtual Services', 'Massage (without sex)'],
      other: 'Other services', otherHint: 'Add any service not listed above (optional, max 2000 characters).',
      otherPlaceholder: 'e.g. Custom requests, special arrangements…', saved: 'Services saved successfully!',
    },
    activate: {
      title: 'Activate Sedcard', subtitle: 'Sedcard activation is free right now — pick a duration below.',
      checkTitle: 'Before activating your ad — check your profile',
      checkBody: 'Once your ad is active, your profile card will be shown to visitors. Make sure everything looks great before going live.',
      checkItems: ['Your name, bio and description are filled in', 'Your location, age and services are set', 'You have uploaded at least 3 high-quality photos', 'Your contact details are correct'],
      editProfile: 'Edit Profile', managePhotos: 'Manage Photos', livePreview: 'Live preview', previewTitle: 'Where your profile card will appear',
      desktop: 'Desktop', mobile: 'Mobile', yourCard: 'YOUR CARD', selectDuration: 'Select duration:',
      pkgs: [['5 days', 'Your profile stays visible in search for 5 days.'], ['14 days', 'Your profile stays visible in search for 14 days.'], ['30 days', 'Your profile stays visible in search for 30 days.']],
      free: 'Free for models', noPayment: 'No payment required', inCart: 'Added to cart', activationDate: 'Activation date:',
      acts: ['Immediately', 'After current', 'At certain date'], addToCart: 'Add to cart', yourCart: 'Your cart:',
      actImmediatelyDesc: 'Activate immediately', remove: 'Remove', total: 'Total:', cart: 'Cart: 1 item',
      termsPre: 'I accept the ', terms: 'terms and conditions (AGB)', termsMid: ' and the ', privacy: 'privacy policy', termsPost: '.',
      confirm: 'Activate now',
    },
    success: {
      title: 'Activation complete', desc: 'Your sedcard is active and visible in search.', order: 'Order', items: 'Items',
      item: '30 Days', itemType: '(ad package)', total: 'Total', method: 'Payment method', free: 'Free', cta: 'Purchase History',
    },
  },
} as const

/** Services in the "Massage (without sex)" category, as stored (the names are not translated). */
const MASSAGES = [
  'Acupressure', 'Brush massage', 'Classical massage', 'Foot reflex massage', 'Hot Stone Massage',
  'Shiatsu Massage', 'Singing bowl massage', 'Tantra Massage (no Sex)', 'Thai Massage', 'Tuina Massage',
]
const CATEGORY_SIZES = [17, 32, 19, 16, 10]

/** City search results for "Zür", as the live `cities` table returns them. */
const ZURICH_PLZ = ['8001', '8002', '8003', '8004', '8005', '8006']

/* ───────────────────────── Fixed layer: sidebar / top bar / drawer ───────────────────────── */

export function DashboardOverlay({ device, lang, screen, has }: GuideView) {
  const phone = device === 'phone'
  if (!phone) {
    return (
      <aside className="absolute left-0 top-0 z-20 flex h-full w-[280px] flex-col border-r border-gray-200 bg-white shadow-sm">
        <SidebarContent device={device} lang={lang} screen={screen} has={has} />
      </aside>
    )
  }

  const open = has('drawer')
  return (
    <>
      {/* Mobile top bar */}
      <div className="absolute inset-x-0 top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
        <span data-demo="nav-menu" className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-700">
          <Menu className="h-5 w-5" />
        </span>
        <Image src="/logo.webp" alt="" width={120} height={36} className="h-7 w-auto object-contain" />
        <span className="relative p-2 text-gray-600">
          <Bell className="h-6 w-6" />
        </span>
      </div>
      {/* Overlay + drawer */}
      <div
        className="absolute inset-0 z-[25] bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: 'none' }}
      />
      <aside
        className="absolute left-0 top-0 z-[26] flex h-full w-[260px] flex-col border-r border-gray-200 bg-white shadow-sm transition-transform duration-300 ease-in-out"
        style={{ transform: open ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        <SidebarContent device={device} lang={lang} screen={screen} has={has} />
      </aside>
    </>
  )
}

function SidebarContent({ device, lang, screen, has }: Pick<GuideView, 'device' | 'lang' | 'screen' | 'has'>) {
  const ui = UI[lang].sidebar
  const phone = device === 'phone'
  const s = screen as DashScreen
  const profileActive = PROFILE_SCREENS.includes(s)
  // Like the real sidebar: the submenu opens on a click, and stays open on any profile page.
  const profileOpen = has('profileOpen') || profileActive

  const item = phone ? 'px-3 py-2.5' : 'px-4 py-3'
  const navLink = (active: boolean) =>
    `flex items-center gap-3 ${item} rounded-lg font-medium text-sm ${
      active ? 'text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-sm' : 'text-gray-700'
    }`
  const subLink = (active: boolean) =>
    `block rounded-md ${phone ? 'py-1.5 px-2.5 text-[13px]' : 'py-2 px-3 text-sm'} ${
      active ? 'bg-pink-100 text-pink-700 font-semibold' : 'text-gray-600'
    }`
  const icon = 'h-5 w-5 shrink-0'

  return (
    <>
      <div className={`border-b border-gray-100 ${phone ? 'p-4' : 'p-6'}`}>
        <div className={`flex items-center justify-between ${phone ? 'mb-1' : 'mb-3'}`}>
          <Image src="/logo.webp" alt="" width={162} height={48} className={`${phone ? 'h-8' : 'h-10'} w-auto object-contain`} />
          <div className="flex items-center gap-2">
            <span className="relative p-2 text-gray-600">
              <Bell className="h-6 w-6" />
            </span>
            {phone && (
              <span className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500">
                <X className="h-5 w-5" />
              </span>
            )}
          </div>
        </div>
      </div>

      <nav className={`flex-1 overflow-hidden ${phone ? 'px-3 py-4' : 'px-4 py-6'}`}>
        <div className={phone ? 'space-y-0.5' : 'space-y-1'}>
          <div className={navLink(s === 'home')}>
            <Home className={icon} />
            <span>{ui.dashboard}</span>
          </div>

          <div>
            <div
              data-demo="nav-profile"
              className={`flex w-full items-center justify-between gap-3 ${item} rounded-lg text-sm ${
                profileActive ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-sm' : 'text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <User className={icon} />
                <span>{ui.myProfile}</span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </div>
            {profileOpen && (
              <div className={`border-l-2 border-pink-200 ${phone ? 'ml-3 mt-0.5 space-y-0.5 pl-3' : 'ml-4 mt-1 space-y-1 pl-4'}`}>
                {ui.subs.map(([id, label]) => (
                  <div key={id} data-demo={`nav-${id}`} className={subLink(s === id)}>
                    {label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            data-demo="nav-sedcard"
            className={`flex items-center gap-3 ${item} rounded-lg text-sm font-semibold text-white shadow-sm ${
              s === 'activate' ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-amber-400 to-orange-400'
            }`}
          >
            <Zap className={icon} />
            <span>{ui.activateSedcard}</span>
          </div>

          <div className={`flex items-center gap-3 ${item} rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 text-sm font-semibold text-white shadow-sm`}>
            <Megaphone className={icon} />
            <span>{ui.buyBanner}</span>
          </div>

          {([
            [Camera, ui.uploadStory],
            [CheckCircle, ui.verification],
            [Building2, ui.clubsAndInvites],
            [MessageSquare, ui.reviews],
            [Handshake, ui.collaborations],
            [ClipboardList, ui.purchaseHistory],
            [BarChart3, ui.statistics],
            [Settings, ui.settings],
          ] as const).map(([Icon, label]) => (
            <div key={label} className={navLink(false)}>
              <Icon className={icon} />
              <span>{label}</span>
            </div>
          ))}

          <div className="mt-3 border-t border-gray-200 pt-3">
            <div className={`flex items-center gap-3 ${item} rounded-lg text-sm font-medium text-red-600`}>
              <LogOut className="h-5 w-5" />
              <span>{ui.logout}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className={`border-t border-gray-100 ${phone ? 'px-3 pt-3' : 'px-4 pt-4'}`}>
        <div className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700">
          <span className="flex items-center gap-2">
            <span className="text-base leading-none">{ui.flag}</span>
            <span>{ui.language}</span>
          </span>
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
      <div className={phone ? 'p-3' : 'p-4'}>
        <div className={`flex items-center justify-center gap-2 ${item} rounded-lg bg-gradient-to-r from-gray-700 to-gray-800 text-sm font-medium text-white shadow-sm`}>
          <span>{ui.viewModelsPage}</span>
          <ExternalLink className="h-4 w-4" />
        </div>
      </div>
    </>
  )
}

/* ───────────────────────── Shared bits of the dashboard pages ───────────────────────── */

const inputBase = 'w-full px-3 py-2 text-sm border rounded-lg bg-white'
const field = (focused: boolean) => `${inputBase} ${focused ? 'border-transparent ring-2 ring-brand' : 'border-gray-200'}`
const label = 'block text-xs font-bold text-gray-800 mb-1'
const card = (phone: boolean) => `rounded-lg border border-gray-200 bg-white ${phone ? 'p-3.5' : 'p-5'}`
const toggleBtn = (active: boolean, color?: string) =>
  `px-3 py-2 text-sm rounded-lg border font-medium ${
    active ? color || 'border-brand bg-brand/10 text-brand' : 'border-gray-200 bg-white text-gray-700'
  }`

function Caret({ on }: { on: boolean }) {
  return on ? <span className="ml-px inline-block h-[17px] w-[1.5px] animate-pulse bg-gray-900 align-middle" /> : null
}

/** A text input drawn as a box: typed text or the placeholder, plus a caret while focused. */
function TextBox({ id, view, placeholder, className = '' }: { id: string; view: GuideView; placeholder: string; className?: string }) {
  const v = view.text(id)
  const focused = view.focus === id
  return (
    <div data-demo={id} className={`${field(focused)} min-h-[38px] ${className}`}>
      {v ? <span className="text-gray-900">{v}</span> : <span className="text-gray-400">{placeholder}</span>}
      <Caret on={focused} />
    </div>
  )
}

function SelectBox({ id, value, placeholder }: { id?: string; value?: string; placeholder: string }) {
  return (
    <div data-demo={id} className={`${field(false)} flex items-center justify-between`}>
      <span className={value ? 'text-gray-900' : 'text-gray-700'}>{value || placeholder}</span>
      <ChevronDown className="h-4 w-4 text-gray-600" />
    </div>
  )
}

/** The <select> popup: a macOS menu in Chrome on the laptop, the iOS popover on the phone. */
function SelectMenu({ device, options, pick, pickId }: { device: Device; options: readonly string[]; pick: number; pickId: string }) {
  if (device === 'phone') {
    return (
      <div className="absolute left-0 top-full z-20 mt-1.5 w-[250px] overflow-hidden rounded-[13px] bg-white/95 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur">
        {options.map((o, i) => (
          <div
            key={o}
            data-demo={i === pick ? pickId : undefined}
            className={`flex h-[44px] items-center gap-2 px-4 text-[17px] ${i < options.length - 1 ? 'border-b border-black/10' : ''} ${i === 0 ? 'text-gray-400' : 'text-black'}`}
          >
            <span className="w-4">{i === 0 && <Check className="h-4 w-4 text-black" strokeWidth={2.5} />}</span>
            {o}
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="absolute inset-x-0 top-[22px] z-20 rounded-[6px] border border-black/10 bg-[#f6f6f6]/95 py-[5px] text-[13px] shadow-[0_8px_24px_rgba(0,0,0,0.22)] backdrop-blur">
      {options.map((o, i) => (
        <div
          key={o}
          data-demo={i === pick ? pickId : undefined}
          className={`relative mx-[5px] flex h-[22px] items-center rounded-[4px] pl-[22px] ${i === pick ? 'bg-[#0a63d6] text-white' : i === 0 ? 'text-gray-500' : 'text-gray-900'}`}
        >
          {i === 0 && <Check className="absolute left-[6px] h-3 w-3" strokeWidth={3} />}
          {o}
        </div>
      ))}
    </div>
  )
}

/** A native checkbox as Chrome (laptop) and Safari (phone) draw it: the site gives checkboxes no colour of its own. */
function Checkbox({ id, on, device, small }: { id?: string; on: boolean; device: Device; small?: boolean }) {
  const phone = device === 'phone'
  return (
    <span
      data-demo={id}
      className={`flex shrink-0 items-center justify-center ${small ? 'h-3.5 w-3.5' : 'h-4 w-4'}`}
      style={{
        borderRadius: phone ? 4 : 3,
        border: on ? 'none' : `1px solid ${phone ? '#c7c7cc' : '#767676'}`,
        background: on ? (phone ? '#007aff' : '#0075ff') : '#ffffff',
      }}
    >
      {on && <Check className={small ? 'h-2.5 w-2.5 text-white' : 'h-3 w-3 text-white'} strokeWidth={3.5} />}
    </span>
  )
}

function PageShell({ device, wide, children }: { device: Device; wide?: 'xl' | '5xl' | '6xl'; children: React.ReactNode }) {
  const phone = device === 'phone'
  const max = wide === '6xl' ? 'max-w-6xl' : wide === '5xl' ? 'max-w-5xl' : 'max-w-4xl'
  return (
    <div className={`flex-1 bg-gray-50 ${phone ? 'px-4 pb-10 pt-4' : 'ml-[280px] px-6 pb-10 pt-6'}`}>
      <div className={`mx-auto space-y-4 ${max}`}>{children}</div>
    </div>
  )
}

function PageHeader({ Icon, title, subtitle, action, required }: {
  Icon: typeof User; title: string; subtitle: string; action: string; required?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand/10">
          <Icon className="h-4 w-4 text-brand" />
        </div>
        <div>
          <p className="text-xl font-bold text-gray-900">{title}</p>
          <p className="text-xs text-gray-500">
            {subtitle} {required && <span className="text-red-500">*</span>}
          </p>
        </div>
      </div>
      <span className="shrink-0 text-sm font-semibold text-gray-600">{action}</span>
    </div>
  )
}

function Saved({ id, show, text }: { id: string; show: boolean; text: string }) {
  if (!show) return null
  return (
    <div data-demo={id} className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3" style={{ animation: 'nmDemoFade 300ms ease-out' }}>
      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
      <p className="text-sm text-emerald-800">{text}</p>
    </div>
  )
}

function SaveRow({ id, saving, lang, labelText }: { id: string; saving: boolean; lang: Lang; labelText?: string }) {
  const ui = UI[lang]
  return (
    <div className="flex items-center justify-end gap-3 pb-2">
      <span className="text-sm font-semibold text-gray-600">{ui.cancel}</span>
      <span
        data-demo={id}
        className={`flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white ${saving ? 'opacity-50' : ''}`}
      >
        <Save className="h-4 w-4" />
        {saving ? ui.saving : labelText ?? ui.save}
      </span>
    </div>
  )
}

/* ───────────────────────── Pages ───────────────────────── */

export function DashboardPage(view: GuideView) {
  switch (view.screen as DashScreen) {
    case 'bio': return <BioPage {...view} />
    case 'about': return <AboutPage {...view} />
    case 'contact': return <ContactPage {...view} />
    case 'area': return <AreaPage {...view} />
    case 'media': return <MediaPage {...view} />
    case 'services': return <ServicesPage {...view} />
    case 'activate': return <ActivatePage {...view} />
    case 'success': return <SuccessPage {...view} />
    default: return <HomePage {...view} />
  }
}

function HomePage({ device, lang }: GuideView) {
  const ui = UI[lang].home
  const phone = device === 'phone'
  return (
    <PageShell device={device} wide="6xl">
      <div className={card(phone)}>
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand/10">
              <Lightbulb className="h-4 w-4 text-brand" />
            </div>
            <p className="text-sm font-bold text-gray-800">{ui.howToStart}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white">
            <GraduationCap className="h-3.5 w-3.5" />
            {ui.startTour}
          </span>
        </div>
        <div className="space-y-3">
          {(ui.steps as readonly (readonly string[])[]).map(([title, desc, action], i) => (
            <div key={title} className="flex gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{i + 1}</div>
              <div className="flex-1">
                <p className="mb-0.5 text-sm font-semibold text-gray-900">{title}</p>
                <p className="mb-1.5 text-xs text-gray-500">{desc}</p>
                <span className="flex items-center gap-1 text-xs font-bold text-brand">
                  {action} <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
        <div className={`flex items-center gap-3 border-b border-gray-100 ${phone ? 'px-3 py-3' : 'px-5 py-4'}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-200">
            <MessageCircle className="h-4 w-4 text-gray-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900">{ui.statusMessage}</p>
            <p className="text-xs text-gray-500">{ui.statusSubtitle}</p>
          </div>
        </div>
        <div className={phone ? 'px-3 py-3' : 'px-5 py-4'}>
          <div className="py-4 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <p className="mb-1 text-sm font-semibold text-gray-600">{ui.adRequired}</p>
            <p className="mx-auto mb-3 max-w-xs text-xs text-gray-400">{ui.adRequiredHint}</p>
            <span className="mx-auto flex w-fit items-center gap-1 text-xs font-bold text-violet-600">
              {ui.activateSedcard} <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>

      <div>
        <p className={`${phone ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>
          {ui.welcomeBack}<span className="text-brand">{SHOWNAME}</span>
        </p>
        <p className="mt-0.5 font-mono text-xs text-gray-400">{ui.idPrefix} {CLIENT_CODE}</p>
      </div>

      <div className={`w-full rounded-xl border border-violet-300/60 bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-md shadow-violet-500/25 ${phone ? 'p-4' : 'p-5'}`}>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/90">{ui.promotion}</span>
          <span className="text-base font-bold text-white">{ui.buyHomepageBanner}</span>
        </div>
      </div>
    </PageShell>
  )
}

function BioPage(view: GuideView) {
  const { device, lang, has } = view
  const ui = UI[lang]
  const t = ui.bio
  const phone = device === 'phone'
  const cols3 = phone ? 'grid-cols-1' : 'grid-cols-3'
  return (
    <PageShell device={device}>
      <PageHeader Icon={User} title={t.title} subtitle={t.subtitle} action={ui.cancel} required />
      <Saved id="bio-success" show={has('bioSaved')} text={t.saved} />

      <div className={card(phone)}>
        <p className="mb-3 text-sm font-bold text-gray-800">{t.basicBio}</p>
        <div className={`grid gap-3 ${cols3}`}>
          <div>
            <span className={label}>{t.showname} <span className="text-red-500">*</span></span>
            <TextBox id="bio-showname" view={view} placeholder="marina" />
            <p className="mt-0.5 text-xs text-gray-400">{t.shownameHint}</p>
          </div>
          <div>
            <span className={label}>{t.slogan}</span>
            <TextBox id="bio-slogan" view={view} placeholder={t.sloganPlaceholder} />
          </div>
          <div className="relative">
            <span className={label}>{t.gender}</span>
            <SelectBox id="bio-gender" value={has('genderChosen') ? t.genders[0] : undefined} placeholder={ui.select} />
            {has('genderOpen') && <SelectMenu device={device} options={[ui.select, ...t.genders]} pick={1} pickId="bio-gender-female" />}
          </div>
          <div>
            <span className={label}>{t.ethnicity}</span>
            <SelectBox placeholder={ui.select} />
          </div>
          <div>
            <span className={label}>{t.nationality}</span>
            <SelectBox placeholder={ui.select} />
          </div>
          <div>
            <span className={label}>{t.age}</span>
            <TextBox id="bio-age" view={view} placeholder="25" />
          </div>
        </div>
      </div>

      <div className={card(phone)}>
        <p className="mb-3 text-sm font-bold text-gray-800">{t.physical}</p>
        <div className={`grid gap-3 ${cols3}`}>
          {(t.physicalFields as readonly (readonly string[])[]).map(([name, unit]) => (
            <div key={name}>
              <span className={label}>{name}</span>
              {unit ? (
                <div className={`${field(false)} relative pr-10 text-gray-400`}>
                  &nbsp;
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{unit}</span>
                </div>
              ) : (
                <SelectBox placeholder={ui.select} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={card(phone)}>
        <p className="mb-3 text-sm font-bold text-gray-800">{t.additional}</p>
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <span className={label}>{t.smoking}</span>
            <SelectBox placeholder={ui.select} />
          </div>
          <div>
            <span className={label}>{t.drinking}</span>
            <SelectBox placeholder={ui.select} />
          </div>
        </div>
        <span className={label}>{t.special}</span>
        <div className={`${field(false)} h-[80px] text-gray-400`}>{t.specialPlaceholder}</div>
      </div>

      <SaveRow id="bio-save" saving={has('bioSaving')} lang={lang} labelText={t.saveChanges} />
    </PageShell>
  )
}

function AboutPage(view: GuideView) {
  const { device, lang, has, focus } = view
  const ui = UI[lang]
  const t = ui.about
  const phone = device === 'phone'
  const value = view.text('about-text')
  const n = value.length
  return (
    <PageShell device={device}>
      <PageHeader Icon={FileText} title={t.title} subtitle={t.subtitle} action={ui.cancel} />
      <Saved id="about-success" show={has('aboutSaved')} text={t.saved} />
      <div className={`rounded-lg border border-gray-200 bg-white ${phone ? 'p-4' : 'p-5'}`}>
        <span className={label}>{t.label} <span className="text-red-500">*</span></span>
        <div
          data-demo="about-text"
          className={`${field(focus === 'about-text')} whitespace-pre-wrap leading-relaxed`}
          style={{ minHeight: phone ? 220 : 350 }}
        >
          {value ? <span className="text-gray-900">{value}</span> : <span className="text-gray-400">{t.placeholder}</span>}
          <Caret on={focus === 'about-text'} />
        </div>
        <p className="mt-1 text-right text-xs text-gray-400">{n} / 25000</p>
        <p className={`mt-2 text-xs ${n < 150 ? 'text-amber-600' : 'text-gray-400'}`}>{t.hint(n)}</p>
      </div>
      <SaveRow id="about-save" saving={has('aboutSaving')} lang={lang} />
    </PageShell>
  )
}

function ContactPage(view: GuideView) {
  const { device, lang, has, focus } = view
  const ui = UI[lang]
  const t = ui.contact
  const phone = device === 'phone'
  const value = view.text('contact-phone')
  return (
    <PageShell device={device}>
      <PageHeader Icon={Phone} title={t.title} subtitle={t.subtitle} action={ui.cancel} />
      <Saved id="contact-success" show={has('contactSaved')} text={t.saved} />
      <div className={`space-y-5 rounded-lg border border-gray-200 bg-white ${phone ? 'p-4' : 'p-5'}`}>
        <div className="flex items-center gap-2">
          <Checkbox id="contact-show" on={has('showPhone')} device={device} />
          <span className="text-sm font-semibold text-gray-900">{t.showOnProfile}</span>
        </div>
        <div className="pl-1">
          <div className="flex items-center gap-2">
            <Checkbox on={false} device={device} />
            <span className="text-sm font-semibold text-gray-900">{t.showOnCard}</span>
          </div>
          <p className="ml-6 mt-0.5 text-xs text-gray-500">{t.showOnCardHint}</p>
        </div>

        <div>
          <span className={label}>{t.phone} <span className="text-red-500">*</span></span>
          <div className="flex w-full items-stretch">
            <span className={`flex shrink-0 items-center gap-1 rounded-l-lg border-2 border-r-0 border-gray-200 bg-gray-50 text-sm font-medium text-gray-800 ${phone ? 'px-2' : 'px-3'}`}>
              🇨🇭 +41 <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
            </span>
            <div
              data-demo="contact-phone"
              className={`min-w-0 flex-1 rounded-r-lg border-2 bg-gray-50 px-3 py-2 text-sm ${focus === 'contact-phone' ? 'border-pink-500 ring-1 ring-pink-200' : 'border-gray-200'}`}
            >
              {value ? <span className="text-gray-900">{value}</span> : <span className="text-gray-400">{t.phonePlaceholder}</span>}
              <Caret on={focus === 'contact-phone'} />
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold text-gray-800">{t.availableOn}</p>
          <div className="flex flex-wrap gap-2">
            <span className={toggleBtn(false)}>Viber</span>
            <span data-demo="contact-whatsapp" className={toggleBtn(has('whatsapp'), 'border-green-400 bg-green-50 text-green-700')}>
              {has('whatsapp') && '✓ '}WhatsApp
            </span>
            <span className={toggleBtn(false)}>Telegram</span>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold text-gray-800">{t.preference}</p>
          <div className="flex flex-wrap gap-2">
            {t.prefs.map((p, i) => (
              <span key={p} className={toggleBtn(i === 0)}>{p}</span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox on={false} device={device} />
          <span className="text-sm font-semibold text-gray-900">{t.noWithheld}</span>
        </div>

        <div>
          <span className={label}>{t.other}</span>
          <div className={`${field(false)} h-[80px] text-gray-400`}>{t.otherPlaceholder}</div>
        </div>
      </div>
      <SaveRow id="contact-save" saving={has('contactSaving')} lang={lang} />
    </PageShell>
  )
}

function AreaPage(view: GuideView) {
  const { device, lang, has, focus } = view
  const ui = UI[lang]
  const t = ui.area
  const phone = device === 'phone'
  const query = view.text('area-city')
  const picked = has('cityPicked')
  const listOpen = !!query && !picked
  return (
    <PageShell device={device}>
      <PageHeader Icon={MapPin} title={t.title} subtitle={t.subtitle} action={ui.cancel} />
      <Saved id="area-success" show={has('areaSaved')} text={t.saved} />

      <div className={`space-y-4 rounded-lg border border-gray-200 bg-white ${phone ? 'p-4' : 'p-5'}`}>
        <div className="mb-1 flex items-center gap-2">
          <Navigation className="h-4 w-4 text-emerald-600" />
          <p className="text-sm font-bold text-gray-800">{t.shareLocation}</p>
        </div>
        <p className="text-xs text-gray-500">{t.shareLocationHint}</p>
        <div className="flex items-center gap-3">
          <span className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300">
            <span className="inline-block h-4 w-4 translate-x-1 rounded-full bg-white" />
          </span>
          <span className="text-sm text-gray-700">{t.disabled}</span>
        </div>
      </div>

      <div className={`space-y-5 rounded-lg border border-gray-200 bg-white ${phone ? 'p-4' : 'p-5'}`}>
        <div className="relative">
          <span className="mb-1 block text-sm font-bold text-gray-700">
            {t.city} <span className="text-pink-600">*</span>
          </span>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <div
              data-demo="area-city"
              className={`w-full rounded-lg border bg-gray-50 py-2 pl-9 pr-16 text-sm ${focus === 'area-city' ? 'border-transparent ring-2 ring-pink-500' : 'border-gray-300'}`}
            >
              {picked ? (
                <span className="text-gray-900">Zürich (8001)</span>
              ) : query ? (
                <span className="text-gray-900">{query}</span>
              ) : (
                <span className="text-gray-400">{t.cityPlaceholder}</span>
              )}
              <Caret on={focus === 'area-city'} />
            </div>
            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
              {(query || picked) && <X className="h-4 w-4 text-gray-400" />}
              <Search className="h-4 w-4 text-gray-300" />
            </div>
          </div>
          {listOpen && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
              {ZURICH_PLZ.map((plz, i) => (
                <div
                  key={plz}
                  data-demo={i === 0 ? 'area-city-pick' : undefined}
                  className={`w-full px-3 py-2 text-left text-sm ${i === 0 ? 'bg-pink-50 text-pink-900' : 'text-gray-700'}`}
                >
                  <span className="font-medium">Zürich</span>
                  <span className="ml-1 text-gray-400">({plz}, ZH)</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`grid gap-3 ${phone ? 'grid-cols-1' : 'grid-cols-3'}`}>
          <div>
            <span className={label}>{t.postalCode}</span>
            <div className={field(false)}>{picked ? <span className="text-gray-900">8001</span> : <span className="text-gray-400">e.g. 8001</span>}</div>
            <p className="mt-0.5 text-xs text-gray-400">{t.postalCodeHint}</p>
          </div>
          <div>
            <span className={label}>{t.street}</span>
            <div className={`${field(false)} text-gray-400`}>e.g. Bahnhofstrasse</div>
          </div>
          <div>
            <span className={label}>{t.streetNumber}</span>
            <div className={`${field(false)} text-gray-400`}>e.g. 12a</div>
          </div>
        </div>

        {([
          [t.incall, t.incalls, 'area-incall'],
          [t.outcall, t.outcalls, null],
        ] as const).map(([title, opts, id]) => (
          <div key={title}>
            <p className="mb-2 text-xs font-bold text-gray-800">{title}</p>
            <div className="grid grid-cols-2 gap-2">
              {opts.map((o, i) => (
                <span key={o} data-demo={id && i === 0 ? id : undefined} className={`${toggleBtn(!!id && i === 0 && has('incall'))} text-center`}>
                  {o}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <SaveRow id="area-save" saving={has('areaSaving')} lang={lang} />
    </PageShell>
  )
}

const PHOTO_TONES = ['from-pink-200 via-rose-200 to-rose-300', 'from-amber-100 via-pink-100 to-pink-200', 'from-violet-200 via-fuchsia-100 to-pink-200']

function MediaPage({ device, lang, has }: GuideView) {
  const t = UI[lang].media
  const phone = device === 'phone'
  const uploading = has('uploading')
  return (
    <PageShell device={device} wide="5xl">
      <PageHeader Icon={Camera} title={t.title} subtitle={t.subtitle} action={t.back} />

      <div className={`rounded-lg border border-gray-200 bg-white ${phone ? 'p-4' : 'p-5'}`}>
        <p className="mb-2 text-xs text-gray-500">{t.dragHint}</p>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-gray-800">{t.photos}</p>
          <span data-demo="media-upload" className={`flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-bold text-white ${uploading ? 'opacity-80' : ''}`}>
            <Upload className="h-4 w-4" />
            {uploading ? t.uploading : t.upload}
          </span>
        </div>
        <div className="mb-4 rounded-lg bg-gray-50 p-3">
          <p className="mb-1 text-xs font-semibold text-gray-700">{t.requirements}</p>
          <ul className="list-inside list-disc space-y-0.5 text-xs text-gray-500">
            {t.photoReqs.map(r => <li key={r}>{r}</li>)}
          </ul>
        </div>
        {has('photos') ? (
          <div data-demo="media-photos" className={`grid gap-3 ${phone ? 'grid-cols-2' : 'grid-cols-5'}`}>
            {PHOTO_TONES.map((tone, i) => (
              <div key={tone} className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50" style={{ animation: `nmDemoFade 400ms ease-out ${i * 120}ms both` }}>
                <div className={`flex aspect-square items-end justify-center bg-gradient-to-b ${tone}`}>
                  <User className="h-2/3 w-2/3 text-white/70" strokeWidth={1.2} />
                </div>
                <div className="p-2">
                  <span className="mb-1 inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">{t.published}</span>
                  <span className="flex w-full items-center justify-center gap-1 rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-600">
                    <Trash2 className="h-3 w-3" /> {t.delete}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-2 text-xs italic text-gray-400">{t.noPhotos}</p>
        )}
      </div>

      <div className={`rounded-lg border border-gray-200 bg-white ${phone ? 'p-4' : 'p-5'}`}>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-brand" />
            <p className="text-sm font-bold text-gray-800">{t.video}</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-bold text-white">
            <Upload className="h-4 w-4" />
            {t.uploadVideo}
          </span>
        </div>
        <div className="mb-4 rounded-lg bg-gray-50 p-3">
          <p className="mb-1 text-xs font-semibold text-gray-700">{t.requirements}</p>
          <ul className="list-inside list-disc space-y-0.5 text-xs text-gray-500">
            {t.videoReqs.map(r => <li key={r}>{r}</li>)}
          </ul>
        </div>
        <p className="py-2 text-xs italic text-gray-400">{t.noVideos}</p>
      </div>

      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
        <p className="text-xs text-emerald-800">
          <span className="font-bold">{t.autoLabel}</span> {t.autoHint}
        </p>
      </div>
    </PageShell>
  )
}

function ServicesPage({ device, lang, has }: GuideView) {
  const ui = UI[lang]
  const t = ui.services
  const phone = device === 'phone'
  const fors = [has('forMen'), false, has('forCouples'), false, false]
  const forIds = ['svc-men', undefined, 'svc-couples', undefined, undefined]
  const open = has('massageOpen')
  const picked = [has('svcClassical'), has('svcTantra')]
  return (
    <PageShell device={device}>
      <PageHeader Icon={Sparkles} title={t.title} subtitle={t.subtitle} action={ui.cancel} />
      <Saved id="svc-success" show={has('svcSaved')} text={t.saved} />

      <div className={`space-y-5 rounded-lg border border-gray-200 bg-white ${phone ? 'p-4' : 'p-5'}`}>
        <div>
          <span className={label}>{t.orientation}</span>
          <SelectBox placeholder={ui.select} />
        </div>

        <div>
          <p className="mb-2 text-xs font-bold text-gray-800">{t.servicesFor}</p>
          <div className="flex flex-wrap gap-2">
            {t.fors.map((f, i) => (
              <span key={f} data-demo={forIds[i]} className={toggleBtn(fors[i])}>{f}</span>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold text-gray-800">{t.services}</p>
          <div className="space-y-2">
            {t.categories.map((cat, i) => {
              const massage = i === 4
              const expanded = massage && open
              const count = massage ? picked.filter(Boolean).length : 0
              return (
                <div key={cat} className="overflow-hidden rounded-lg border border-gray-200">
                  <div data-demo={massage ? 'svc-massage' : undefined} className="flex w-full items-center justify-between bg-gray-50 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-brand">{cat}</span>
                      <span className="text-xs text-gray-500">{count}/{CATEGORY_SIZES[i]}</span>
                    </div>
                    {expanded ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                  </div>
                  {expanded && (
                    <div className="grid grid-cols-2 gap-2 bg-white p-3">
                      {MASSAGES.map(name => {
                        const idx = name === 'Classical massage' ? 0 : name === 'Tantra Massage (no Sex)' ? 1 : -1
                        const on = idx >= 0 && picked[idx]
                        return (
                          <div key={name} data-demo={idx === 0 ? 'svc-classical' : idx === 1 ? 'svc-tantra' : undefined} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm">
                            <Checkbox on={on} device={device} small />
                            <span className="truncate">{name}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-4 border-t border-gray-200 pt-4">
            <span className={label}>{t.other}</span>
            <p className="mb-2 text-[11px] text-gray-500">{t.otherHint}</p>
            <div className={`${field(false)} h-[96px] text-gray-400`}>{t.otherPlaceholder}</div>
          </div>
        </div>
      </div>
      <SaveRow id="svc-save" saving={has('svcSaving')} lang={lang} />
    </PageShell>
  )
}

function ActivatePage({ device, lang, has }: GuideView) {
  const t = UI[lang].activate
  const phone = device === 'phone'
  const inCart = has('inCart')
  const selected = has('pkg30') && !inCart
  const pad = phone ? 'p-3.5' : 'p-5'
  return (
    <PageShell device={device} wide="6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand/10">
            <Zap className="h-4 w-4 text-brand" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{t.title}</p>
            <p className="text-xs text-gray-500">{t.subtitle}</p>
          </div>
        </div>
        {inCart && (
          <span className="relative flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white">
            <ShoppingCart className="h-4 w-4" />
            {t.cart}
            <span className="ml-1 rounded bg-white px-1.5 py-0.5 text-xs font-bold text-brand">{t.free}</span>
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">1</span>
          </span>
        )}
      </div>

      <div data-demo="act-check" className={`rounded-xl border border-amber-300 bg-amber-50 ${phone ? 'p-3.5' : 'p-5'}`}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="mb-1 text-sm font-bold text-amber-900">{t.checkTitle}</p>
            <p className="mb-4 text-sm text-amber-800">{t.checkBody}</p>
            <div className={`mb-4 grid gap-2 ${phone ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {t.checkItems.map(item => (
                <div key={item} className="flex items-center gap-2 text-sm text-amber-800">
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-amber-400">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white">
                <User className="h-3.5 w-3.5" /> {t.editProfile} <ChevronRight className="h-3 w-3" />
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-800">
                <Camera className="h-3.5 w-3.5" /> {t.managePhotos} <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Compact live preview of the home feed with the model's card highlighted */}
      <div className={`space-y-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50/40 to-violet-50/30 ${phone ? 'p-3' : 'p-4'}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
              <Eye className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-700">{t.livePreview}</p>
              <p className="truncate text-sm font-bold leading-tight text-slate-900">{t.previewTitle}</p>
            </div>
          </div>
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
            <span className="flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white">
              <Monitor className="h-3.5 w-3.5" /> {t.desktop}
            </span>
            <span className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-slate-600">
              <Smartphone className="h-3.5 w-3.5" /> {t.mobile}
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/70 bg-gradient-to-b from-slate-100 to-slate-50 p-2.5">
          <div className="mx-auto overflow-hidden rounded-lg border border-slate-200 bg-[#fce9f3]" style={{ maxWidth: 560 }}>
            <div className="h-3 bg-[#e8f4fd]" />
            <div className="h-2 bg-gradient-to-r from-pink-500 to-pink-400" />
            <div className="grid grid-cols-2 gap-1.5 p-2">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`relative flex h-[58px] overflow-hidden rounded-md bg-white ${i === 1 ? 'ring-2 ring-violet-500 ring-offset-1' : ''}`}
                >
                  <div className={`w-[36%] bg-gradient-to-b ${i === 1 ? 'from-violet-400 via-fuchsia-400 to-pink-400' : 'from-pink-100 to-pink-200'}`} />
                  <div className="flex-1 space-y-1 p-1.5">
                    <span className="block h-1.5 w-10 rounded bg-gray-200" />
                    <span className="block h-1 w-14 rounded bg-gray-100" />
                    <span className="block h-1 w-12 rounded bg-gray-100" />
                  </div>
                  {i === 1 && (
                    <span className="absolute right-1 top-1 rounded bg-violet-600 px-1 text-[7px] font-bold text-white">{t.yourCard}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={`rounded-lg border border-gray-200 bg-white ${pad}`}>
        <p className="mb-4 text-sm font-bold text-gray-800">{t.selectDuration}</p>
        <div className={`grid gap-3 ${phone ? 'grid-cols-1' : 'grid-cols-3 gap-4'}`}>
          {(t.pkgs as readonly (readonly string[])[]).map(([title, desc], i) => {
            const isThirty = i === 2
            const cartCard = isThirty && inCart
            const sel = isThirty && selected
            return (
              <div
                key={title}
                data-demo={isThirty ? 'act-pkg30' : undefined}
                className={`relative rounded-lg border-2 ${
                  cartCard ? 'border-emerald-400 bg-emerald-50/50 opacity-70' : sel ? 'border-brand bg-brand/5 shadow-sm' : 'border-gray-200 bg-white'
                }`}
              >
                {cartCard && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-bold text-white">
                    {t.inCart}
                  </div>
                )}
                <div className={`text-center ${pad}`}>
                  <p className="mb-1 text-base font-bold text-gray-900">{title}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                  <div className="mt-4 border-t border-gray-100 pt-3">
                    <p className="text-base font-bold leading-tight text-emerald-700">{t.free}</p>
                    <p className="mt-0.5 text-[11px] text-gray-400">{t.noPayment}</p>
                  </div>
                </div>
                {(cartCard || sel) && (
                  <div className={`absolute bottom-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full ${cartCard ? 'bg-emerald-500' : 'bg-brand'}`}>
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {selected && (
        <div className={`rounded-lg border border-gray-200 bg-white ${pad}`}>
          <p className="mb-3 text-sm font-bold text-gray-800">{t.activationDate}</p>
          <div className="flex flex-wrap gap-2">
            {([Zap, Clock, Calendar] as const).map((Icon, i) => (
              <span
                key={t.acts[i]}
                data-demo={i === 0 ? 'act-now' : undefined}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold ${i === 0 ? 'bg-brand text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                <Icon className="h-4 w-4" /> {t.acts[i]}
              </span>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <span data-demo="act-add" className="inline-block rounded-lg bg-brand px-6 py-2.5 text-sm font-bold text-white">
          {t.addToCart}
        </span>
      )}

      {inCart && (
        <div className={`rounded-lg border border-gray-200 bg-white ${pad}`} style={{ animation: 'nmDemoFade 300ms ease-out' }}>
          <p className="mb-3 text-sm font-bold text-gray-800">{t.yourCart}</p>
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">{t.pkgs[2][0]}</p>
              <p className="text-xs text-gray-500">{t.actImmediatelyDesc}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-900">{t.free}</span>
              <span className="text-xs font-semibold text-red-600">{t.remove}</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
            <p className="text-sm font-bold text-gray-900">{t.total}</p>
            <p className="text-base font-bold text-gray-900">{t.free}</p>
          </div>
          <div className="mt-3 flex items-start gap-2">
            <span className="mt-0.5">
              <Checkbox id="act-terms" on={has('terms')} device={device} />
            </span>
            <span className="text-xs leading-snug text-gray-700">
              {t.termsPre}
              <span className="font-semibold text-pink-600 underline">{t.terms}</span>
              {t.termsMid}
              <span className="font-semibold text-pink-600 underline">{t.privacy}</span>
              {t.termsPost}
            </span>
          </div>
          <span
            data-demo="act-confirm"
            className={`mt-3 block w-full rounded-lg bg-brand py-2.5 text-center text-sm font-bold text-white ${has('terms') ? '' : 'opacity-50'}`}
          >
            {t.confirm}
          </span>
        </div>
      )}
    </PageShell>
  )
}

function SuccessPage({ device, lang }: GuideView) {
  const t = UI[lang].success
  const phone = device === 'phone'
  const pad = phone ? 'p-6' : 'p-8'
  return (
    <div className={`flex-1 bg-gray-50 ${phone ? 'px-4 py-6' : 'ml-[280px] px-6 py-12'}`}>
      <div className="mx-auto max-w-2xl">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div data-demo="success-head" className={`bg-emerald-50 text-center ${pad}`}>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="mb-1 text-2xl font-bold text-gray-900">{t.title}</p>
            <p className="text-sm text-gray-700">{t.desc}</p>
          </div>
          <div className={`space-y-4 ${pad}`}>
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-500">{t.order}</p>
              <p className="font-mono text-sm text-gray-900">5f3c2a91-7d4e-4b8a-9c21-0e6f4d1a2b77</p>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">{t.items}</p>
              <p className="text-sm text-gray-900">
                {t.item}
                <span className="ml-2 text-xs text-gray-500">{t.itemType}</span>
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <p className="text-sm font-bold text-gray-900">{t.total}</p>
              <p className="text-base font-bold text-gray-900">CHF 0.00</p>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{t.method}</span>
              <span className="font-semibold uppercase text-gray-700">{t.free}</span>
            </div>
            <div className="pt-2">
              <span className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white">
                {t.cta} <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
