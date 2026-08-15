/* Company facts for the AI assistant, transcribed from the client's own
   documents in the project root:

     - "About TechNurture.docx"
     - "Annual Maintenance Contracts (AMC).docx"
     - "Frequently Asked Questions (FAQs).docx"

   lib/site.ts is the source of truth for anything the WEBSITE renders.
   This file is the source of truth for the things the client wrote down
   that the website has no component for — heritage, vision, mission, AMC
   inclusions and exclusions, the inspection-charge policy, service
   intervals — but that a customer will absolutely ask the assistant about.

   KEEP IN STEP WITH THE CLIENT. When they send a new document, update
   this file; the assistant picks the change up on the next request with
   no other edits. Do not invent facts here — if the client hasn't stated
   it, leave it out and let the assistant offer a callback instead. */

/* Recommended service intervals. These are the client's own numbers from
   the FAQ document; note the water purifier figure is 4–6 months, NOT the
   3–6 months used for air conditioners. */
export const serviceIntervals = [
  {
    what: "Air conditioners",
    every: "every 3 to 6 months",
    why: "depending on usage and environment; regular servicing improves efficiency and extends equipment life",
  },
  {
    what: "Inline water purifiers (RO / UV / UF / multi-stage)",
    every: "every 4 to 6 months",
    why: "depending on water quality, usage and the manufacturer's recommendation; keeps performance optimal and drinking water safe",
  },
  {
    what: "Bottle water dispensers",
    every: "every 3 to 6 months",
    why: "tank chlorination, steam sanitization and bacterial disinfection — the hygiene job, not a filter change",
  },
  {
    what: "Refrigerators and freezers",
    every: "about once a year",
    why: "unless something is wrong sooner",
  },
];

/* Signs a customer can check themselves before calling. Straight from the
   FAQ document — useful because it lets the assistant be helpful without
   diagnosing or quoting. */
export const troubleSigns = {
  waterPurifier: [
    "reduced water flow",
    "unusual taste or odour",
    "leakage",
    "unusual operating sounds",
    "a filter-replacement indicator showing",
    "noticeably poorer water quality",
  ],
  airConditioner: [
    "dirty filters",
    "low refrigerant levels",
    "blocked condensers",
    "faulty components",
    "poor airflow",
  ],
};

/* What we actually do, per the client's FAQ document. */
export const capabilities = [
  "Install, service and maintain domestic and commercial water purification systems — RO (Reverse Osmosis), UV, UF and multi-stage filtration.",
  "Supply and replace genuine, high-quality filters and consumables.",
  "Arrange water quality testing and recommend what a system needs to meet a customer's specific requirements.",
  "Air conditioning: installation, maintenance, servicing, troubleshooting, repairs, gas charging, system inspections and preventive maintenance — residential and commercial.",
  "Service equipment installed by anyone else — most major brands and models, regardless of the original installer.",
  "Support large commercial air conditioning systems: offices, healthcare institutions, educational establishments and other large-scale environments.",
  "Emergency / urgent repair response — response times vary with location and the work required.",
];

/* The AMC document, condensed. The website renders servicePlans from
   lib/site.ts; this adds the inclusions, exclusions and the inspection
   policy that the plan cards don't have room for. */
export const amc = {
  intro:
    "Preventive maintenance is the key to maximizing equipment performance, reducing downtime and extending asset lifespan. There are three options.",
  options: [
    {
      name: "AMC Comprehensive",
      forWho:
        "customers who want maximum protection and predictable, fixed maintenance costs — best for critical operations",
      includes: [
        "scheduled preventive maintenance visits",
        "routine inspections and servicing",
        "labour charges",
        "replacement of eligible spare parts",
        "breakdown support",
        "priority technical assistance",
      ],
      excludes:
        "major components — compressors, condensers, pressure pumps, and anything else specifically excluded in the agreement",
    },
    {
      name: "AMC Non-Comprehensive",
      forWho:
        "cost-conscious customers who want professional servicing and technical support but prefer to manage replacement-part costs separately",
      includes: [
        "scheduled preventive maintenance visits",
        "routine inspections and servicing",
        "labour charges",
        "technical support",
        "performance checks",
      ],
      excludes:
        "spare parts, consumables and major component replacements — all charged separately when required",
    },
    {
      name: "On-Call Service",
      forWho:
        "customers with occasional needs who don't want a maintenance contract at all",
      includes: [
        "service visits on request",
        "breakdown troubleshooting",
        "equipment inspections",
        "repair recommendations",
      ],
      excludes:
        "no fixed annual cost, no priority response, and labour and parts are charged per visit",
    },
  ],
  /* This one matters commercially — it is the honest answer to "will you
     charge me just to look at it?", and the assistant should give it
     rather than dodge the question. */
  inspectionPolicy:
    "For a reported breakdown an inspection may be required before repairs are carried out. The inspection charge is always communicated in advance, and it is deducted from the final repair invoice if the repair work goes ahead through TechNurture.",
  benefits: [
    "fewer unexpected breakdowns",
    "longer equipment lifespan",
    "better operating efficiency",
    "lower long-term repair costs",
    "maintained water quality and cooling performance",
    "priority technical support",
  ],
};

/* Who the company is, in its own words. */
export const identity = {
  positioning:
    "A technology solutions company delivering reliable products, professional services and exceptional customer experiences across Sri Lanka.",
  heritage:
    "TechNurture was established to extend the trusted service culture and operational excellence of Lusako Holdings Pvt Ltd into broader technology and technical service sectors. The Lusako Group has earned the confidence of hundreds of organizations across Sri Lanka.",
  vision:
    "To become Sri Lanka's most trusted technology solutions and service provider, recognized for innovation, reliability and customer satisfaction.",
  mission:
    "To empower homes and businesses with innovative technology solutions supported by exceptional service, professional expertise and a commitment to long-term customer success.",
  whyTrusted: [
    "Proven experience — more than 10 years supporting businesses and institutions across Sri Lanka.",
    "Trusted by reputed organizations in banking, healthcare, corporate and commercial sectors, where reliability is critical.",
    "Island-wide service network across Sri Lanka.",
    "Customer-first approach — solutions designed around the customer's needs and long-term value.",
    "Responsive technical support focused on minimizing downtime.",
    "Long-term partnerships, measured by customer retention and repeat business.",
  ],
  technicians:
    "Our technicians receive ongoing training and follow established service procedures, so service is consistent and professional.",
};

/* Sri Lankan towns, suburbs and landmarks → the district they sit in.

   Customers give an address, never a district: the booking that started
   this work said "55 dewala road, maligawatta" when the assistant had
   asked for a district. The booking form only accepts one of the 25
   districts, so without this the assistant either guesses or stalls.

   Not exhaustive by design — it covers the Colombo/Gampaha belt where
   most demand is, plus each district's main towns. When an address isn't
   listed here the assistant asks rather than guesses. */
export const townToDistrict: Record<string, string> = {
  // Colombo city and its suburbs
  colombo: "Colombo", "colombo 1": "Colombo", fort: "Colombo",
  slavefisland: "Colombo", "slave island": "Colombo", kollupitiya: "Colombo",
  bambalapitiya: "Colombo", wellawatte: "Colombo", wellawatta: "Colombo",
  dehiwala: "Colombo", "mount lavinia": "Colombo", ratmalana: "Colombo",
  moratuwa: "Colombo", maligawatta: "Colombo", maradana: "Colombo",
  borella: "Colombo", "cinnamon gardens": "Colombo", "colombo 07": "Colombo",
  narahenpita: "Colombo", nugegoda: "Colombo", "kirulapone": "Colombo",
  kohuwala: "Colombo", maharagama: "Colombo", kottawa: "Colombo",
  homagama: "Colombo", padukka: "Colombo", hanwella: "Colombo",
  avissawella: "Colombo", kaduwela: "Colombo", malabe: "Colombo",
  battaramulla: "Colombo", rajagiriya: "Colombo", kotte: "Colombo",
  "sri jayawardenepura": "Colombo", thalawathugoda: "Colombo",
  athurugiriya: "Colombo", piliyandala: "Colombo", kesbewa: "Colombo",
  boralesgamuwa: "Colombo", pannipitiya: "Colombo", "grandpass": "Colombo",
  kotahena: "Colombo", modara: "Colombo", mattakkuliya: "Colombo",
  dematagoda: "Colombo", wellampitiya: "Colombo", kolonnawa: "Colombo",

  // Gampaha
  gampaha: "Gampaha", negombo: "Gampaha", wattala: "Gampaha",
  jaela: "Gampaha", "ja-ela": "Gampaha", "ja ela": "Gampaha",
  kandana: "Gampaha", ragama: "Gampaha", kelaniya: "Gampaha",
  peliyagoda: "Gampaha", kadawatha: "Gampaha", kiribathgoda: "Gampaha",
  minuwangoda: "Gampaha", veyangoda: "Gampaha", nittambuwa: "Gampaha",
  divulapitiya: "Gampaha", katunayake: "Gampaha", seeduwa: "Gampaha",
  mirigama: "Gampaha", delgoda: "Gampaha", biyagama: "Gampaha",

  // Kalutara
  kalutara: "Kalutara", panadura: "Kalutara", horana: "Kalutara",
  beruwala: "Kalutara", aluthgama: "Kalutara", bandaragama: "Kalutara",
  matugama: "Kalutara", wadduwa: "Kalutara", bentota: "Kalutara",

  // Rest of the island — main towns
  kandy: "Kandy", peradeniya: "Kandy", katugastota: "Kandy",
  gampola: "Kandy", kadugannawa: "Kandy", digana: "Kandy",
  matale: "Matale", dambulla: "Matale", sigiriya: "Matale",
  "nuwara eliya": "Nuwara Eliya", hatton: "Nuwara Eliya", talawakelle: "Nuwara Eliya",
  galle: "Galle", hikkaduwa: "Galle", ambalangoda: "Galle", karapitiya: "Galle",
  matara: "Matara", weligama: "Matara", mirissa: "Matara", akuressa: "Matara",
  hambantota: "Hambantota", tangalle: "Hambantota", tissamaharama: "Hambantota",
  ambalantota: "Hambantota", beliatta: "Hambantota",
  jaffna: "Jaffna", chavakachcheri: "Jaffna", "point pedro": "Jaffna",
  kilinochchi: "Kilinochchi", mannar: "Mannar", vavuniya: "Vavuniya",
  mullaitivu: "Mullaitivu",
  batticaloa: "Batticaloa", kattankudy: "Batticaloa", valaichchenai: "Batticaloa",
  ampara: "Ampara", kalmunai: "Ampara", akkaraipattu: "Ampara", "sainthamaruthu": "Ampara",
  trincomalee: "Trincomalee", kinniya: "Trincomalee",
  kurunegala: "Kurunegala", kuliyapitiya: "Kurunegala", narammala: "Kurunegala",
  wariyapola: "Kurunegala", polgahawela: "Kurunegala",
  puttalam: "Puttalam", chilaw: "Puttalam", wennappuwa: "Puttalam",
  marawila: "Puttalam", nattandiya: "Puttalam",
  anuradhapura: "Anuradhapura", kekirawa: "Anuradhapura", medawachchiya: "Anuradhapura",
  polonnaruwa: "Polonnaruwa", kaduruwela: "Polonnaruwa",
  badulla: "Badulla", bandarawela: "Badulla", "haputale": "Badulla",
  welimada: "Badulla", diyatalawa: "Badulla",
  monaragala: "Monaragala", wellawaya: "Monaragala", bibile: "Monaragala",
  ratnapura: "Ratnapura", embilipitiya: "Ratnapura", balangoda: "Ratnapura",
  eheliyagoda: "Ratnapura", kuruwita: "Ratnapura",
  kegalle: "Kegalle", mawanella: "Kegalle", warakapola: "Kegalle",
  rambukkana: "Kegalle", dehiowita: "Kegalle",
};

/** Best-effort district for a free-text address. Null when unsure — the
    assistant is told to ask rather than guess in that case. */
export function districtFromAddress(address: string): string | null {
  const text = ` ${String(address ?? "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ")} `;
  let best: { district: string; length: number } | null = null;
  for (const [town, district] of Object.entries(townToDistrict)) {
    // Word-boundary match, longest town name wins ("mount lavinia" over "colombo").
    if (text.includes(` ${town} `) && (!best || town.length > best.length)) {
      best = { district, length: town.length };
    }
  }
  return best?.district ?? null;
}
