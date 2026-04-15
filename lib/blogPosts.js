/**
 * Blog post data.
 * content: markdown string (## for h2, ### for h3, **bold**, - for list items, blank lines = paragraph breaks)
 */

export const blogPosts = [
  {
    slug:        'what-to-do-flight-cancelled-eu',
    title:       'Your flight was cancelled in Europe. Here\'s exactly what to do.',
    excerpt:     'EU Regulation 261/2004 entitles you to up to €600 in cash compensation when your flight is cancelled. Here\'s the step-by-step process — from checking eligibility to submitting your claim.',
    date:        '2026-04-10',
    author:      'FlightComp',
    category:    'EU261',
    readingTime: '6 min read',
    content: `
When an airline cancels your flight in Europe, most passengers accept whatever the airline offers — a voucher, a rebooking, or an apology email. What many don't realise is that you're often entitled to **cash compensation of up to €600**, on top of a refund or rebooking.

This guide walks you through exactly what to do, step by step.

## Step 1: Check whether you're eligible

EU Regulation 261/2004 applies when **all three** of the following are true:

- Your flight departed from an EU airport **or** your flight was operated by an EU carrier arriving at an EU airport
- Your flight was cancelled, and you were **not informed at least 14 days in advance**
- The cancellation was not caused by extraordinary circumstances (more on this below)

The compensation amounts are fixed:

- **€250** — flights of 1,500 km or less
- **€400** — intra-EU flights over 1,500 km, and all other flights between 1,500–3,500 km
- **€600** — flights over 3,500 km

UK flights are covered by the same rules under UK261 (retained post-Brexit).

## Step 2: Understand "extraordinary circumstances"

Airlines frequently claim cancellations were caused by extraordinary circumstances — severe weather, air traffic control strikes, security threats — and use this to refuse compensation under Article 5(3).

However, many "extraordinary circumstances" defences fail on close examination:

- **Technical/mechanical faults** are generally **not** extraordinary circumstances. The Court of Justice of the EU confirmed in *Wallentin-Hermann v Alitalia* (C-549/07) that technical problems inherent in normal airline operations don't qualify.
- **Crew shortages** caused by staff calling in sick are typically within the airline's control.
- **Genuine bad weather** or **airport closures** may qualify — but the airline must prove the cancellation was directly caused by the event.

If the airline claims extraordinary circumstances, ask for the specific cause in writing and check whether it actually applies.

## Step 3: Write a formal claim letter

You don't need a lawyer or a claims company. A formal letter citing the specific EU261 articles is often enough to get a response. Your letter should include:

- Your full name and contact details
- Flight number and date
- The route (departure and arrival airports)
- A clear statement of your entitlement under Article 5 and Article 7 of EU Regulation 261/2004
- The exact compensation amount you're claiming (€250, €400, or €600)
- A 14-day deadline for the airline to respond

FlightComp can generate this letter for you — personalised, legally accurate, and ready to send — for $19.

## Step 4: Submit your claim

Most airlines have an online claims portal or a dedicated claims email address. When submitting:

- Keep a copy of everything you send, with timestamps
- Note the date you submitted your claim — the 14-day deadline starts from this date
- Save any auto-replies or reference numbers you receive

## Step 5: Follow up if there's no response

Airlines don't always respond within 14 days. If you haven't heard back:

- Send a follow-up letter referencing your original claim date and reference number
- State that you will escalate to the relevant national enforcement body if you don't receive a response within 7 days

## Step 6: Escalate if the claim is rejected

If the airline rejects your claim or doesn't respond after follow-up, your next step is the **National Enforcement Body (NEB)** in the country where your flight departed.

Filing a complaint with the NEB is free. The NEB can compel the airline to pay if the refusal was unlawful. The European Commission maintains a list of all NEBs at the link below.

For UK flights, the relevant authority is the **UK Civil Aviation Authority (CAA)**.

## One more thing: you can do this yourself

Claims companies charge 30–50% of whatever they recover. For a straightforward letter-writing process, that's a lot. FlightComp charges $19 for the full Flight Compensation Kit — including the personalised letter, submission instructions, follow-up templates, and a guide to handling common airline responses.

Check your eligibility free, in under two minutes, and decide from there.
    `.trim(),
  },
];

/**
 * Get a post by slug. Returns undefined if not found.
 * @param {string} slug
 */
export function getPostBySlug(slug) {
  return blogPosts.find(p => p.slug === slug);
}
