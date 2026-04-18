import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

const STRIPE_STRINGS = {
  en: {
    name: 'FlightComp Flight Compensation Kit',
    description:
      'Complete 6-document Flight Compensation Kit: personalised claim letter, airline submission guide, ' +
      '14-day follow-up template, 30-day escalation template, and What to Expect guide. Download as PDF.',
    payment_description: 'FlightComp — Flight Compensation Kit',
  },
  tr: {
    name: 'FlightComp Ucus Tazminat Kiti',
    description:
      '6 belgeden olusan Ucus Tazminat Kiti: kisisellestirilmis talep mektubu, havayolu basvuru kilavuzu, ' +
      '14 gunluk takip sablonu, 30 gunluk eskalasyon sablonu ve Beklentiler rehberi. PDF olarak indirin.',
    payment_description: 'FlightComp — Ucus Tazminat Kiti',
  },
  fr: {
    name: "FlightComp Kit d'indemnisation de vol",
    description:
      "Kit d'indemnisation de vol complet en 6 documents : lettre de demande personnalisee, guide de soumission " +
      "a la compagnie aerienne, modele de suivi a 14 jours, modele d'escalade a 30 jours et guide Quoi attendre. Telechargez en PDF.",
    payment_description: "FlightComp — Kit d'indemnisation de vol",
  },
  de: {
    name: 'FlightComp Fluggastrechte-Kit',
    description:
      'Vollstandiges Fluggastrechte-Kit mit 6 Dokumenten: personalisierter Anspruchsbrief, Einreichungsanleitung, ' +
      '14-Tage-Nachfassvorlage, 30-Tage-Eskalationsvorlage und Erwartungsleitfaden. Als PDF herunterladen.',
    payment_description: 'FlightComp — Fluggastrechte-Kit',
  },
  es: {
    name: 'FlightComp Kit de compensacion de vuelo',
    description:
      'Kit completo de compensacion de vuelo con 6 documentos: carta de reclamacion personalizada, guia de presentacion, ' +
      'plantilla de seguimiento a 14 dias, plantilla de escalada a 30 dias y guia Que esperar. Descarga en PDF.',
    payment_description: 'FlightComp — Kit de compensacion de vuelo',
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { customerEmail, successUrl, cancelUrl, claimMeta, language } = req.body;
  const lang = ['en', 'tr', 'fr', 'de', 'es'].includes(language) ? language : 'en';
  const s = STRIPE_STRINGS[lang];

  if (!successUrl || !cancelUrl) {
    return res.status(400).json({ error: 'Missing successUrl or cancelUrl' });
  }

  // Attach claim data as Stripe metadata so the webhook can fulfil the order
  // without relying on client sessionStorage. All values must be strings.
  const metadata = claimMeta ? {
    email:        String(claimMeta.email        || '').slice(0, 500),
    name:         String(claimMeta.name         || '').slice(0, 500),
    airline:      String(claimMeta.airline      || '').slice(0, 500),
    flightNumber: String(claimMeta.flightNumber || '').slice(0, 500),
    route:        String(claimMeta.route        || '').slice(0, 500),
    regulation:   String(claimMeta.regulation   || '').slice(0, 500),
    compensation: String(claimMeta.compensation || '').slice(0, 500),
    language:     lang,
  } : {};

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: 1499, // $14.99
            product_data: {
              name: s.name,
              description: s.description,
            },
          },
          quantity: 1,
        },
      ],
      customer_email: customerEmail || undefined,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      payment_intent_data: {
        description: s.payment_description,
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('[create-checkout-session] Stripe error:', err.message);
    return res.status(500).json({ error: 'Stripe session creation failed' });
  }
}
