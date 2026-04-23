import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// ── Inline translations for authorize page ────────────────
const STRINGS = {
  en: {
    page_title:             'Authorization to Act on Your Behalf | FlightComp',
    page_meta:              'Authorize FlightComp / Noontide Ventures LLC to submit and manage your flight compensation claim.',
    back_link:              '← Back to FlightComp',
    heading:                'Authorization to Act on Your Behalf',
    subheading:             'This agreement authorizes Noontide Ventures LLC (operating as FlightComp) to submit and manage your flight compensation claim.',
    est_comp_label:         'Estimated compensation:',
    section_your_details:   'Your Details',
    section_flight_details: 'Flight Details',
    section_timing:         'Timing (if applicable)',
    section_agreement:      'Authorization Agreement',
    field_full_name:        'Full legal name *',
    field_full_name_ph:     'As it appears on your passport',
    field_email:            'Email address *',
    field_email_ph:         'your@email.com',
    field_address:          'Mailing address *',
    field_address_ph:       'Street, city, country',
    field_airline:          'Airline name *',
    field_airline_ph:       'e.g. Lufthansa',
    field_flight_number:    'Flight number *',
    field_flight_number_ph: 'e.g. LH1234',
    field_flight_date:      'Flight date *',
    field_dep_airport:      'Departure airport *',
    field_dep_airport_ph:   'e.g. LHR',
    field_arr_airport:      'Arrival airport *',
    field_arr_airport_ph:   'e.g. JFK',
    field_disruption:       'Disruption type *',
    field_disruption_ph:    'Select…',
    field_booking_ref:      'Booking reference / PNR',
    field_booking_ref_ph:   'e.g. ABC123',
    field_sched_arr:        'Scheduled arrival time',
    field_actual_arr:       'Actual arrival time',
    field_description:      'Brief description of what happened',
    field_description_ph:   '2–3 sentences describing the disruption',
    checkbox_label:         'I have read and agree to the above authorization',
    submit_button:          'Submit Authorization',
    submit_loading:         'Submitting…',
    success_title:          'Authorization received.',
    success_body_pre:       'We\'ve sent a confirmation to',
    success_body_post:      '. Our team will review your claim and begin the process. You\'ll hear from us within 48 hours.',
    error_generic:          'Something went wrong. Please try again.',
    footer:                 'Operated by Noontide Ventures LLC · Georgia, USA ·',
    disruption_cancel:      'Cancellation',
    disruption_delay:       'Delay over 3 hours',
    disruption_denied:      'Denied boarding',
    disruption_downgrade:   'Downgrade',
  },
  tr: {
    page_title:             'Adınıza Hareket Etme Yetkisi | FlightComp',
    page_meta:              'FlightComp / Noontide Ventures LLC\'ye uçuş tazminat talebinizi sunması ve yönetmesi için yetki verin.',
    back_link:              '← FlightComp\'a Dön',
    heading:                'Adınıza Hareket Etme Yetkisi',
    subheading:             'Bu sözleşme, Noontide Ventures LLC\'ye (FlightComp olarak faaliyet göstermektedir) uçuş tazminat talebinizi sunma ve yönetme yetkisi vermektedir.',
    est_comp_label:         'Tahmini tazminat:',
    section_your_details:   'Kişisel Bilgileriniz',
    section_flight_details: 'Uçuş Bilgileri',
    section_timing:         'Zamanlama (varsa)',
    section_agreement:      'Yetkilendirme Sözleşmesi',
    field_full_name:        'Tam yasal adınız *',
    field_full_name_ph:     'Pasaportunuzda göründüğü gibi',
    field_email:            'E-posta adresi *',
    field_email_ph:         'ornek@eposta.com',
    field_address:          'Posta adresi *',
    field_address_ph:       'Sokak, şehir, ülke',
    field_airline:          'Havayolu adı *',
    field_airline_ph:       'örn. Türk Hava Yolları',
    field_flight_number:    'Sefer numarası *',
    field_flight_number_ph: 'örn. TK 123',
    field_flight_date:      'Uçuş tarihi *',
    field_dep_airport:      'Kalkış havalimanı *',
    field_dep_airport_ph:   'örn. IST',
    field_arr_airport:      'Varış havalimanı *',
    field_arr_airport_ph:   'örn. LHR',
    field_disruption:       'Aksama türü *',
    field_disruption_ph:    'Seçiniz…',
    field_booking_ref:      'Rezervasyon referansı / PNR',
    field_booking_ref_ph:   'örn. ABC123',
    field_sched_arr:        'Planlanan varış saati',
    field_actual_arr:       'Gerçekleşen varış saati',
    field_description:      'Yaşananların kısa açıklaması',
    field_description_ph:   'Aksama ile ilgili 2–3 cümle yazınız',
    checkbox_label:         'Yukarıdaki yetkilendirmeyi okudum ve kabul ediyorum',
    submit_button:          'Yetkilendirmeyi Gönder',
    submit_loading:         'Gönderiliyor…',
    success_title:          'Yetkilendirme alındı.',
    success_body_pre:       'Onay e-postası şu adrese gönderildi:',
    success_body_post:      '. Ekibimiz talebinizi inceleyecek ve süreci başlatacaktır. 48 saat içinde sizinle iletişime geçeceğiz.',
    error_generic:          'Bir hata oluştu. Lütfen tekrar deneyin.',
    footer:                 'Noontide Ventures LLC tarafından işletilmektedir · Georgia, ABD ·',
    disruption_cancel:      'İptal',
    disruption_delay:       '3 saatin üzerinde gecikme',
    disruption_denied:      'Biniş reddi',
    disruption_downgrade:   'Sınıf düşürme',
  },
  fr: {
    page_title:             'Autorisation d\'agir en votre nom | FlightComp',
    page_meta:              'Autorisez FlightComp / Noontide Ventures LLC à soumettre et gérer votre demande d\'indemnisation.',
    back_link:              '← Retour à FlightComp',
    heading:                'Autorisation d\'agir en votre nom',
    subheading:             'Cet accord autorise Noontide Ventures LLC (opérant sous le nom de FlightComp) à soumettre et gérer votre demande d\'indemnisation pour perturbation de vol.',
    est_comp_label:         'Indemnisation estimée :',
    section_your_details:   'Vos coordonnées',
    section_flight_details: 'Détails du vol',
    section_timing:         'Horaires (si applicable)',
    section_agreement:      'Accord d\'autorisation',
    field_full_name:        'Nom légal complet *',
    field_full_name_ph:     'Tel qu\'il apparaît sur votre passeport',
    field_email:            'Adresse courriel *',
    field_email_ph:         'votre@courriel.com',
    field_address:          'Adresse postale *',
    field_address_ph:       'Rue, ville, pays',
    field_airline:          'Nom de la compagnie aérienne *',
    field_airline_ph:       'ex. Air France',
    field_flight_number:    'Numéro de vol *',
    field_flight_number_ph: 'ex. AF1234',
    field_flight_date:      'Date du vol *',
    field_dep_airport:      'Aéroport de départ *',
    field_dep_airport_ph:   'ex. CDG',
    field_arr_airport:      'Aéroport d\'arrivée *',
    field_arr_airport_ph:   'ex. JFK',
    field_disruption:       'Type de perturbation *',
    field_disruption_ph:    'Sélectionner…',
    field_booking_ref:      'Référence de réservation / PNR',
    field_booking_ref_ph:   'ex. ABC123',
    field_sched_arr:        'Heure d\'arrivée prévue',
    field_actual_arr:       'Heure d\'arrivée réelle',
    field_description:      'Brève description de ce qui s\'est passé',
    field_description_ph:   '2–3 phrases décrivant la perturbation',
    checkbox_label:         'J\'ai lu et j\'accepte l\'autorisation ci-dessus',
    submit_button:          'Soumettre l\'autorisation',
    submit_loading:         'Envoi en cours…',
    success_title:          'Autorisation reçue.',
    success_body_pre:       'Nous avons envoyé une confirmation à',
    success_body_post:      '. Notre équipe examinera votre demande et débutera le processus. Vous aurez de nos nouvelles dans les 48 heures.',
    error_generic:          'Une erreur s\'est produite. Veuillez réessayer.',
    footer:                 'Exploité par Noontide Ventures LLC · Géorgie, États-Unis ·',
    disruption_cancel:      'Annulation',
    disruption_delay:       'Retard de plus de 3 heures',
    disruption_denied:      'Refus d\'embarquement',
    disruption_downgrade:   'Déclassement',
  },
  de: {
    page_title:             'Bevollmächtigung zur Interessenvertretung | FlightComp',
    page_meta:              'Bevollmächtigen Sie FlightComp / Noontide Ventures LLC, Ihren Entschädigungsanspruch einzureichen und zu verwalten.',
    back_link:              '← Zurück zu FlightComp',
    heading:                'Bevollmächtigung zur Interessenvertretung',
    subheading:             'Diese Vereinbarung bevollmächtigt Noontide Ventures LLC (handelnd als FlightComp), Ihren Fluggastrechtsanspruch einzureichen und zu verwalten.',
    est_comp_label:         'Geschätzte Entschädigung:',
    section_your_details:   'Ihre Angaben',
    section_flight_details: 'Flugdetails',
    section_timing:         'Zeiten (falls zutreffend)',
    section_agreement:      'Vollmachtsvereinbarung',
    field_full_name:        'Vollständiger Rechtsname *',
    field_full_name_ph:     'Wie im Reisepass angegeben',
    field_email:            'E-Mail-Adresse *',
    field_email_ph:         'ihre@email.de',
    field_address:          'Postanschrift *',
    field_address_ph:       'Straße, Stadt, Land',
    field_airline:          'Name der Fluggesellschaft *',
    field_airline_ph:       'z.B. Lufthansa',
    field_flight_number:    'Flugnummer *',
    field_flight_number_ph: 'z.B. LH1234',
    field_flight_date:      'Flugdatum *',
    field_dep_airport:      'Abflughafen *',
    field_dep_airport_ph:   'z.B. FRA',
    field_arr_airport:      'Ankunftsflughafen *',
    field_arr_airport_ph:   'z.B. JFK',
    field_disruption:       'Art der Störung *',
    field_disruption_ph:    'Auswählen…',
    field_booking_ref:      'Buchungsreferenz / PNR',
    field_booking_ref_ph:   'z.B. ABC123',
    field_sched_arr:        'Planmäßige Ankunftszeit',
    field_actual_arr:       'Tatsächliche Ankunftszeit',
    field_description:      'Kurze Beschreibung des Vorfalls',
    field_description_ph:   '2–3 Sätze zur Beschreibung der Störung',
    checkbox_label:         'Ich habe die obige Vollmacht gelesen und stimme ihr zu',
    submit_button:          'Vollmacht einreichen',
    submit_loading:         'Wird gesendet…',
    success_title:          'Vollmacht erhalten.',
    success_body_pre:       'Wir haben eine Bestätigung an',
    success_body_post:      ' gesendet. Unser Team wird Ihren Anspruch prüfen und den Prozess einleiten. Sie werden innerhalb von 48 Stunden von uns hören.',
    error_generic:          'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
    footer:                 'Betrieben von Noontide Ventures LLC · Georgia, USA ·',
    disruption_cancel:      'Annullierung',
    disruption_delay:       'Verspätung über 3 Stunden',
    disruption_denied:      'Nichtbeförderung',
    disruption_downgrade:   'Herabstufung',
  },
  es: {
    page_title:             'Autorización para actuar en su nombre | FlightComp',
    page_meta:              'Autorice a FlightComp / Noontide Ventures LLC a presentar y gestionar su reclamación de compensación por vuelo.',
    back_link:              '← Volver a FlightComp',
    heading:                'Autorización para actuar en su nombre',
    subheading:             'Este acuerdo autoriza a Noontide Ventures LLC (que opera como FlightComp) a presentar y gestionar su reclamación de compensación por perturbación de vuelo.',
    est_comp_label:         'Compensación estimada:',
    section_your_details:   'Sus datos',
    section_flight_details: 'Datos del vuelo',
    section_timing:         'Horarios (si procede)',
    section_agreement:      'Acuerdo de autorización',
    field_full_name:        'Nombre legal completo *',
    field_full_name_ph:     'Tal como aparece en su pasaporte',
    field_email:            'Dirección de correo electrónico *',
    field_email_ph:         'su@correo.com',
    field_address:          'Dirección postal *',
    field_address_ph:       'Calle, ciudad, país',
    field_airline:          'Nombre de la aerolínea *',
    field_airline_ph:       'ej. Iberia',
    field_flight_number:    'Número de vuelo *',
    field_flight_number_ph: 'ej. IB1234',
    field_flight_date:      'Fecha del vuelo *',
    field_dep_airport:      'Aeropuerto de salida *',
    field_dep_airport_ph:   'ej. MAD',
    field_arr_airport:      'Aeropuerto de llegada *',
    field_arr_airport_ph:   'ej. JFK',
    field_disruption:       'Tipo de perturbación *',
    field_disruption_ph:    'Seleccionar…',
    field_booking_ref:      'Referencia de reserva / PNR',
    field_booking_ref_ph:   'ej. ABC123',
    field_sched_arr:        'Hora de llegada prevista',
    field_actual_arr:       'Hora de llegada real',
    field_description:      'Breve descripción de lo ocurrido',
    field_description_ph:   '2–3 frases describiendo la perturbación',
    checkbox_label:         'He leído y acepto la autorización anterior',
    submit_button:          'Enviar autorización',
    submit_loading:         'Enviando…',
    success_title:          'Autorización recibida.',
    success_body_pre:       'Hemos enviado una confirmación a',
    success_body_post:      '. Nuestro equipo revisará su reclamación e iniciará el proceso. Tendrá noticias nuestras en un plazo de 48 horas.',
    error_generic:          'Algo salió mal. Por favor, inténtelo de nuevo.',
    footer:                 'Operado por Noontide Ventures LLC · Georgia, EE. UU. ·',
    disruption_cancel:      'Cancelación',
    disruption_delay:       'Retraso de más de 3 horas',
    disruption_denied:      'Denegación de embarque',
    disruption_downgrade:   'Degradación',
  },
};

// Legal agreement text — localized
function buildAgreementText(lang, form) {
  const name     = form.fullName    || (lang === 'tr' ? '[Tam Yasal Ad]'       : lang === 'fr' ? '[Nom légal complet]'    : lang === 'de' ? '[Vollständiger Rechtsname]' : lang === 'es' ? '[Nombre legal completo]'  : '[Full Legal Name]');
  const airline  = form.airline     || (lang === 'tr' ? '[Havayolu Adı]'       : lang === 'fr' ? '[Nom de la compagnie]'  : lang === 'de' ? '[Fluggesellschaft]'         : lang === 'es' ? '[Nombre de la aerolínea]' : '[Airline Name]');
  const flight   = form.flightNumber|| (lang === 'tr' ? '[Sefer Numarası]'     : lang === 'fr' ? '[Numéro de vol]'        : lang === 'de' ? '[Flugnummer]'               : lang === 'es' ? '[Número de vuelo]'        : '[Flight Number]');
  const date     = form.flightDate  || (lang === 'tr' ? '[Uçuş Tarihi]'        : lang === 'fr' ? '[Date du vol]'          : lang === 'de' ? '[Flugdatum]'                : lang === 'es' ? '[Fecha del vuelo]'        : '[Flight Date]');

  if (lang === 'tr') {
    return `Ben, ${name}, Noontide Ventures LLC'ye (FlightComp olarak faaliyet göstermektedir) adıma aşağıdakileri yapma yetkisini veriyorum:

1. ${airline} havayoluna ${flight} sefer numaralı, ${date} tarihli uçuşa ilişkin tazminat talebini geçerli yolcu hakları mevzuatı (AB Tüzüğü 261/2004, UK Tüzüğü 261, Kanada Hava Yolcu Koruma Yönetmelikleri veya Türkiye SHY Yönetmeliği) kapsamında sunmak.
2. Bu talep ile ilgili olarak havayolu, ilgili havacılık otoriteleri ve diğer gerekli taraflarla adıma iletişime geçmek.
3. Bu talep ile ilgili yazışmaları almak.

Aşağıdakileri onaylıyorum:
• Sağladığım bilgilerin bildiğim kadarıyla doğru ve eksiksiz olduğunu.
• Bu talebi başka bir tarafa veya şirkete devretmediğimi.
• FlightComp'un yönetilen hizmet ücretinin başarıyla tahsil edilen tazminatın %25'i olduğunu ve tazminat tahsil edilememesi halinde ücret ödenmeyeceğini (kazan-kazan esası).
• Bu yetkilendirmenin tazminatın tahsil edileceğine dair bir garanti oluşturmadığını anlıyorum.
• Bu yetkilendirmeyi dilediğim zaman support@getflightcomp.com adresine e-posta göndererek iptal edebileceğimi.

Bu yetkilendirme, Amerika Birleşik Devletleri Georgia Eyaleti yasalarına tabidir.`;
  }
  if (lang === 'fr') {
    return `Je soussigné(e), ${name}, autorise par la présente Noontide Ventures LLC, opérant sous le nom de FlightComp, à agir en mon nom pour :

1. Soumettre une demande d'indemnisation à ${airline} concernant le vol ${flight} du ${date}, en vertu du règlement applicable relatif aux droits des passagers (Règlement UE 261/2004, Règlement UK 261, Règlement canadien sur la protection des passagers aériens, ou Règlement turc SHY).
2. Communiquer avec la compagnie aérienne, les autorités aéronautiques compétentes et toute autre partie nécessaire en mon nom concernant cette demande.
3. Recevoir toute correspondance relative à cette demande.

Je confirme que :
• Les informations que j'ai fournies sont exactes et complètes à ma connaissance.
• Je n'ai pas cédé cette créance à une autre partie ou société.
• Je comprends que les honoraires du service géré de FlightComp sont de 25 % de toute indemnisation effectivement récupérée, et qu'aucun honoraire n'est dû si aucune indemnisation n'est obtenue (sans gain, sans frais).
• Je comprends que cette autorisation ne constitue pas une garantie que l'indemnisation sera obtenue.
• Je peux révoquer cette autorisation à tout moment en envoyant un courriel à support@getflightcomp.com.

La présente autorisation est régie par les lois de l'État de Géorgie, États-Unis.`;
  }
  if (lang === 'de') {
    return `Ich, ${name}, bevollmächtige hiermit Noontide Ventures LLC, handelnd als FlightComp, in meinem Namen folgende Handlungen vorzunehmen:

1. Einreichung eines Entschädigungsanspruchs bei ${airline} bezüglich Flug ${flight} am ${date} gemäß der anwendbaren Fluggastrechteverordnung (EU-Verordnung 261/2004, UK-Verordnung 261, Kanadische Fluggastschutzverordnung oder Türkische SHY-Verordnung).
2. Kommunikation mit der Fluggesellschaft, den zuständigen Luftfahrtbehörden und anderen erforderlichen Parteien in meinem Namen bezüglich dieses Anspruchs.
3. Entgegennahme von Korrespondenz im Zusammenhang mit diesem Anspruch.

Ich bestätige, dass:
• Die von mir gemachten Angaben nach meinem besten Wissen korrekt und vollständig sind.
• Ich diesen Anspruch keiner anderen Partei oder keinem anderen Unternehmen abgetreten habe.
• Ich verstehe, dass die Vergütung des von FlightComp verwalteten Dienstes 25 % der erfolgreich eingetriebenen Entschädigung beträgt und dass kein Honorar anfällt, wenn keine Entschädigung erzielt wird (kein Erfolg, keine Kosten).
• Ich verstehe, dass diese Vollmacht keine Garantie darstellt, dass eine Entschädigung erzielt wird.
• Ich diese Vollmacht jederzeit durch eine E-Mail an support@getflightcomp.com widerrufen kann.

Diese Vollmacht unterliegt dem Recht des Bundesstaates Georgia, Vereinigte Staaten.`;
  }
  if (lang === 'es') {
    return `Yo, ${name}, por medio del presente documento autorizo a Noontide Ventures LLC, que opera como FlightComp, para actuar en mi nombre con el fin de:

1. Presentar una reclamación de compensación ante ${airline} en relación con el vuelo ${flight} del ${date}, al amparo de la normativa de derechos de los pasajeros aplicable (Reglamento UE 261/2004, Reglamento UK 261, Reglamento canadiense sobre protección de pasajeros aéreos o Reglamento turco SHY).
2. Comunicarse con la aerolínea, las autoridades aeronáuticas pertinentes y cualquier otra parte necesaria en mi nombre en relación con esta reclamación.
3. Recibir correspondencia relacionada con esta reclamación.

Confirmo que:
• La información que he proporcionado es exacta y completa según mi leal saber y entender.
• No he cedido esta reclamación a ninguna otra parte o empresa.
• Entiendo que los honorarios del servicio gestionado de FlightComp son el 25 % de cualquier compensación efectivamente recuperada, y que no se deberá honorario alguno si no se recupera compensación (sin éxito, sin honorarios).
• Entiendo que esta autorización no constituye una garantía de que se recuperará la compensación.
• Puedo revocar esta autorización en cualquier momento enviando un correo electrónico a support@getflightcomp.com.

Esta autorización se rige por las leyes del Estado de Georgia, Estados Unidos.`;
  }
  // Default: English
  return `I, ${name}, hereby authorize Noontide Ventures LLC, operating as FlightComp, to act on my behalf to:

1. Submit a compensation claim to ${airline} regarding flight ${flight} on ${date} under the applicable passenger rights regulation (EU Regulation 261/2004, UK Regulation 261, Canadian Air Passenger Protection Regulations, or Turkish SHY Regulation).
2. Communicate with the airline, relevant aviation authorities, and any other necessary parties on my behalf regarding this claim.
3. Receive correspondence related to this claim.

I confirm that:
• The information I have provided is accurate and complete to the best of my knowledge.
• I have not assigned this claim to any other party or company.
• I understand that FlightComp's managed service fee is 25% of any compensation successfully recovered, and that no fee is owed if no compensation is recovered (no win, no fee).
• I understand that this authorization does not constitute a guarantee that compensation will be recovered.
• I may revoke this authorization at any time by emailing support@getflightcomp.com.

This authorization is governed by the laws of the State of Georgia, United States.`;
}

const DISRUPTION_TYPES = [
  'Cancellation',
  'Delay over 3 hours',
  'Denied boarding',
  'Downgrade',
];

const EMPTY = {
  fullName: '',
  email: '',
  address: '',
  airline: '',
  flightNumber: '',
  flightDate: '',
  depAirport: '',
  arrAirport: '',
  disruptionType: '',
  bookingRef: '',
  scheduledArrival: '',
  actualArrival: '',
  description: '',
};

export default function Authorize() {
  const [form, setForm]       = useState(EMPTY);
  const [agreed, setAgreed]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');
  const [estimatedComp, setEstimatedComp] = useState('');
  const [regulation, setRegulation]       = useState('');
  const [language, setLanguage]           = useState('en');
  const router = useRouter();

  const t = (key) => STRINGS[language]?.[key] ?? STRINGS.en[key] ?? key;

  // Language detection: URL param > sessionStorage > default 'en'
  useEffect(() => {
    if (!router.isReady) return;
    const urlLang = router.query.lang;
    if (urlLang && ['en', 'tr', 'fr', 'de', 'es'].includes(String(urlLang))) {
      setLanguage(String(urlLang));
      return;
    }
    try {
      const raw = sessionStorage.getItem('fc_claim');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.language && ['en', 'tr', 'fr', 'de', 'es'].includes(parsed.language)) {
          setLanguage(parsed.language);
        }
      }
    } catch { /* ignore */ }
  }, [router.isReady, router.query]);

  // Pre-fill form fields from query params (passed by the results page)
  useEffect(() => {
    if (!router.isReady) return;
    const { airline, flight, date, from, to, disruption, regulation: reg, compensation } = router.query;
    setForm(prev => ({
      ...prev,
      ...(airline    && { airline }),
      ...(flight     && { flightNumber: flight }),
      ...(date       && { flightDate: date }),
      ...(from       && { depAirport: from }),
      ...(to         && { arrAirport: to }),
      ...(disruption && { disruptionType: disruption }),
    }));
    if (reg) setRegulation(reg);
    if (compensation) setEstimatedComp(String(compensation));
  }, [router.isReady, router.query]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const canSubmit =
    agreed &&
    !loading &&
    form.fullName.trim() &&
    form.email.includes('@') &&
    form.address.trim() &&
    form.airline.trim() &&
    form.flightNumber.trim() &&
    form.flightDate &&
    form.depAirport.trim() &&
    form.arrAirport.trim() &&
    form.disruptionType;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        ...(regulation   && { regulation }),
        ...(estimatedComp && { estimatedCompensation: estimatedComp }),
      };
      const res = await fetch('/api/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Submission failed');
      }
      setSuccess(true);
      // Mark email_captures row as converted (managed service authorised)
      if (form.email) {
        fetch('/api/mark-converted', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email }),
        }).catch(() => {});
      }
    } catch (err) {
      setError(err.message || t('error_generic'));
    } finally {
      setLoading(false);
    }
  }

  const agreementText = buildAgreementText(language, form);

  return (
    <>
      <Head>
        <title>{t('page_title')}</title>
        <meta name="description" content={t('page_meta')} />
      </Head>

      <div style={{ minHeight: '100dvh', background: 'var(--bg)', padding: '40px 16px 80px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <a href="/" style={{ color: 'var(--muted)', fontSize: 14, textDecoration: 'none' }}>{t('back_link')}</a>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginTop: 20, marginBottom: 8 }}>
              {t('heading')}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
              {t('subheading')}
            </p>
            {estimatedComp && (
              <div style={{ background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.25)', borderRadius: 8, padding: '10px 14px', marginTop: 12, fontSize: 14, color: '#22c55e', fontWeight: 600 }}>
                {t('est_comp_label')} {estimatedComp}
              </div>
            )}
          </div>

          {success ? (
            <div style={{
              background: 'var(--greenbg)', border: '1px solid var(--greenbd)',
              borderRadius: 12, padding: 28, textAlign: 'center',
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                {t('success_title')}
              </div>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
                {t('success_body_pre')} <strong style={{ color: 'var(--text)' }}>{form.email}</strong>{t('success_body_post')}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>

              {/* Personal details */}
              <fieldset style={fieldsetStyle}>
                <legend style={legendStyle}>{t('section_your_details')}</legend>
                <Field label={t('field_full_name')} required>
                  <input style={inputStyle} type="text" value={form.fullName} onChange={set('fullName')} placeholder={t('field_full_name_ph')} required />
                </Field>
                <Field label={t('field_email')} required>
                  <input style={inputStyle} type="email" value={form.email} onChange={set('email')} placeholder={t('field_email_ph')} required />
                </Field>
                <Field label={t('field_address')} required>
                  <input style={inputStyle} type="text" value={form.address} onChange={set('address')} placeholder={t('field_address_ph')} required />
                </Field>
              </fieldset>

              {/* Flight details */}
              <fieldset style={fieldsetStyle}>
                <legend style={legendStyle}>{t('section_flight_details')}</legend>
                <Field label={t('field_airline')} required>
                  <input style={inputStyle} type="text" value={form.airline} onChange={set('airline')} placeholder={t('field_airline_ph')} required />
                </Field>
                <Field label={t('field_flight_number')} required>
                  <input style={inputStyle} type="text" value={form.flightNumber} onChange={set('flightNumber')} placeholder={t('field_flight_number_ph')} required />
                </Field>
                <Field label={t('field_flight_date')} required>
                  <input style={inputStyle} type="date" value={form.flightDate} onChange={set('flightDate')} required />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label={t('field_dep_airport')} required>
                    <input style={inputStyle} type="text" value={form.depAirport} onChange={set('depAirport')} placeholder={t('field_dep_airport_ph')} required />
                  </Field>
                  <Field label={t('field_arr_airport')} required>
                    <input style={inputStyle} type="text" value={form.arrAirport} onChange={set('arrAirport')} placeholder={t('field_arr_airport_ph')} required />
                  </Field>
                </div>
                <Field label={t('field_disruption')} required>
                  <select style={inputStyle} value={form.disruptionType} onChange={set('disruptionType')} required>
                    <option value="">{t('field_disruption_ph')}</option>
                    <option value="Cancellation">{t('disruption_cancel')}</option>
                    <option value="Delay over 3 hours">{t('disruption_delay')}</option>
                    <option value="Denied boarding">{t('disruption_denied')}</option>
                    <option value="Downgrade">{t('disruption_downgrade')}</option>
                  </select>
                </Field>
                <Field label={t('field_booking_ref')}>
                  <input style={inputStyle} type="text" value={form.bookingRef} onChange={set('bookingRef')} placeholder={t('field_booking_ref_ph')} />
                </Field>
              </fieldset>

              {/* Timing */}
              <fieldset style={fieldsetStyle}>
                <legend style={legendStyle}>{t('section_timing')}</legend>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label={t('field_sched_arr')}>
                    <input style={inputStyle} type="time" value={form.scheduledArrival} onChange={set('scheduledArrival')} />
                  </Field>
                  <Field label={t('field_actual_arr')}>
                    <input style={inputStyle} type="time" value={form.actualArrival} onChange={set('actualArrival')} />
                  </Field>
                </div>
                <Field label={t('field_description')}>
                  <textarea
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                    value={form.description}
                    onChange={set('description')}
                    maxLength={500}
                    placeholder={t('field_description_ph')}
                    rows={3}
                  />
                  <span style={{ fontSize: 12, color: 'var(--dim)', display: 'block', marginTop: 4 }}>
                    {form.description.length}/500
                  </span>
                </Field>
              </fieldset>

              {/* Agreement text */}
              <div style={{
                background: 'var(--surf2)', border: '1px solid var(--border)',
                borderRadius: 10, padding: 20, marginBottom: 20,
              }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {t('section_agreement')}
                </p>
                <pre style={{
                  fontSize: 13, color: 'var(--muted)', lineHeight: 1.7,
                  whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0,
                }}>
                  {agreementText}
                </pre>
              </div>

              {/* Checkbox */}
              <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', marginBottom: 24 }}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0, accentColor: 'var(--blue)' }}
                />
                <span style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>
                  {t('checkbox_label')}
                </span>
              </label>

              {error && (
                <div style={{
                  background: 'var(--redbg)', border: '1px solid var(--redbd)',
                  borderRadius: 8, padding: '12px 16px', marginBottom: 16,
                  fontSize: 14, color: 'var(--red)',
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  width: '100%', padding: '14px 24px',
                  background: canSubmit ? 'var(--blue)' : 'var(--surf3)',
                  color: canSubmit ? '#fff' : 'var(--dim)',
                  border: 'none', borderRadius: 'var(--rbtn)',
                  fontSize: 16, fontWeight: 600, cursor: canSubmit ? 'pointer' : 'not-allowed',
                  transition: 'background 0.15s',
                }}
              >
                {loading ? t('submit_loading') : t('submit_button')}
              </button>

              <p style={{ fontSize: 12, color: 'var(--dim)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
                {t('footer')}{' '}
                <a href="/terms" style={{ color: 'var(--dim)' }}>Terms</a> ·{' '}
                <a href="/privacy" style={{ color: 'var(--dim)' }}>Privacy</a>
              </p>

            </form>
          )}
        </div>
      </div>
    </>
  );
}

// ── Sub-components ─────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--muted)', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Shared styles ──────────────────────────────────────
const inputStyle = {
  width: '100%', padding: '10px 14px',
  background: 'var(--surf2)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text)', fontSize: 14,
  outline: 'none',
};

const fieldsetStyle = {
  border: '1px solid var(--border)', borderRadius: 10,
  padding: '20px 20px 4px', marginBottom: 20,
};

const legendStyle = {
  fontSize: 12, fontWeight: 600, color: 'var(--muted)',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  padding: '0 6px',
};
