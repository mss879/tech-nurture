/* ============================================================
   TechNurture — central content source
   Home & business appliance service company: Air Conditioning,
   Refrigerator & Freezer, Inline Water Purifiers, Bottle Water
   Dispensers, and Maintenance & AMC.
   Brand: TechNurture Pvt Ltd · Tagline: "Technology Inspired by Nurture"
   Subsidiary of Lusako Holdings Pvt Ltd.

   NOTE ON `listed`: a service with `listed: false` keeps its page and
   its URL, but is left out of the header drop-down, the footer menu,
   the /services grid and every `related` block. Used to quietly retire
   a service line without breaking inbound links or search results.
   ============================================================ */

export const site = {
  name: "TechNurture",
  legal: "TechNurture Pvt Ltd",
  // Registered company name & number (Certificate of Incorporation,
  // Companies Act No 7 of 2007 — Registrar of Companies, Sri Lanka).
  regName: "TechNurture (Pvt) Ltd",
  regNo: "PV 00337653",
  tagline: "Technology Inspired by Nurture",
  parent: "Lusako Holdings Pvt Ltd",
  phone: "+94 11 433 4886",
  phoneHref: "tel:+94114334886",
  whatsapp: "94771234567", // TODO: real WhatsApp/mobile number (landline above isn't WhatsApp)
  email: "hello@technurture.lk", // TODO: confirm real email (domain is technurture.lk)
  address: "19A, 1st Lane, Gothami Road, Colombo 08",
  domain: "technurture.lk",
  /* LAUNCH BLOCKER — confirm with the client before go-live.
     `hours` is the human-readable string shown on /contact and /book;
     openDays/opens/closes are the machine-readable form used by the
     LocalBusiness JSON-LD on the homepage. Keep the three in step. */
  hours: "Mon – Sat · 8:30am – 6:00pm", // TODO: confirm business hours
  openDays: [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],
  opens: "08:30",
  closes: "18:00",
  // TODO: confirm the exact map pin for 19A, 1st Lane, Gothami Road with the
  // client. Currently the Gothami Road / Borella area, not a surveyed point —
  // this drives local-pack distance ranking and the map embed on /contact.
  geo: { lat: 6.9147, lng: 79.8776 },
  trustLine:
    "A subsidiary of Lusako Holdings Pvt Ltd, backed by over a decade of experience serving leading banks, hospitals, corporate organizations, and institutions across Sri Lanka.",
};

export const nav = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  {
    label: "Services",
    href: "/services",
    /* Clicking "Services" opens /services, which lists them all; the
       drop-down is a shortcut straight to an individual service. */
    children: [
      { label: "Air Conditioning", href: "/services/air-conditioning" },
      { label: "Refrigerator & Freezer", href: "/services/refrigerator" },
      {
        label: "Inline Water Purifiers",
        href: "/services/inline-water-purifiers",
      },
      {
        label: "Bottle Water Dispensers",
        href: "/services/bottle-water-dispensers",
      },
      { label: "Maintenance & AMC", href: "/services/maintenance-amc" },
    ],
  },
  // No `children` here: the Products drop-down is built from the published
  // products at runtime (see components/layout/ProductNav.tsx). The href is
  // only a landing pad — /products forwards straight to a product page.
  { label: "Products", href: "/products" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

/* Social profiles. `label` maps to a brand icon in
   components/layout/SocialLinks.tsx; the URLs also feed the
   Organization JSON-LD `sameAs` in app/layout.tsx. */
export const social = [
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@technurture.lk?_r=1&_t=ZS-988g3FFUIvQ",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/share/18Ea8vsFV7/",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/technurture.lk?igsh=MW1jOXZ4MG9qejJqMA==",
  },
];

/* ============================================================
   Service booking — shared source for the public /book form and
   the admin bookings board (so the option lists never drift apart).
   ============================================================ */

// Service types a customer can book online.
export const bookingServices = [
  "Air Conditioning — Repair / Service",
  "Air Conditioning — Installation",
  "Air Conditioning — Gas Charging",
  "Refrigerator / Freezer — Repair",
  "Inline Water Purifier — Installation",
  "Inline Water Purifier — Service / Filter Replacement",
  "Bottle Water Dispenser — Service / Sanitization",
  "Bottle Water Dispenser — Repair",
  "Washing Machine — Repair",
  "Annual Maintenance Contract (AMC)",
  "Other",
];

// Preferred time slots for a visit.
export const bookingTimeSlots = [
  "Morning · 8:30am – 12:00pm",
  "Afternoon · 12:00pm – 3:00pm",
  "Evening · 3:00pm – 6:00pm",
];

// All 25 administrative districts of Sri Lanka (grouped by province,
// listed for coverage across the whole island).
export const districts = [
  "Colombo",
  "Gampaha",
  "Kalutara",
  "Kandy",
  "Matale",
  "Nuwara Eliya",
  "Galle",
  "Matara",
  "Hambantota",
  "Jaffna",
  "Kilinochchi",
  "Mannar",
  "Vavuniya",
  "Mullaitivu",
  "Batticaloa",
  "Ampara",
  "Trincomalee",
  "Kurunegala",
  "Puttalam",
  "Anuradhapura",
  "Polonnaruwa",
  "Badulla",
  "Monaragala",
  "Ratnapura",
  "Kegalle",
];

export const hero = {
  eyebrow: "Technology Inspired by Nurture",
  // Floating credibility pills (kept general — no single-service framing)
  pills: [
    { label: "Islandwide", color: "lime" },
    { label: "10+ Years", color: "teal" },
    { label: "Trusted Team", color: "green" },
    { label: "Fast Response", color: "navy" },
    { label: "Genuine Parts", color: "lime" },
  ],
  headline: ["Reliable systems.", "Total confidence."],
  sub: "Expert repair, servicing and maintenance for air conditioners, refrigerators, inline water purifiers and bottle water dispensers, keeping homes and businesses across Sri Lanka cool, fresh and running.",
  primaryCta: { label: "Explore Services", href: "/services" },
  secondaryCta: { label: "Contact Us", href: "/contact" },
};

/* ---- Creator / build credit (ARC AI) ---- */
export const creator = {
  name: "ARC AI",
  legal: "ARC AI",
  url: "https://www.arcai.agency",
  domain: "www.arcai.agency",
  logo: "/arclogo.webp",
  tagline: "AI Agency & Web Design",
  description:
    "ARC AI is an AI agency and web design studio building intelligent, high-performance websites and automation for growing businesses.",
};

export const stats = [
  { value: 10, suffix: "+", label: "Years of industry experience" },
  { value: 100, suffix: "%", label: "Island-wide service coverage" },
  { value: 5000, suffix: "+", label: "Appliances serviced & repaired" },
];

export const partnershipsIntro = {
  eyebrow: "Industries We Serve",
  title: "Over a decade keeping Sri Lanka running.",
  body: "From first diagnosis to expert repair to lifelong maintenance, we combine technical skill and a customer-first approach to keep your appliances performing — for households and the country's most demanding institutions.",
};

export const industries = [
  "Banks",
  "Hospitals",
  "Hotels",
  "Offices",
  "Education",
  "Manufacturing",
  "Retail",
  "Government",
  "Residential",
];

export const about = {
  eyebrow: "About Us",
  heading: "We help homes and businesses run cooler, fresher and with total confidence.",
  body: "TechNurture Pvt Ltd brings reliable technicians, professional service and modern processes to help you repair, maintain and depend on your air conditioners, refrigerators, inline water purifiers and bottle water dispensers.",
  story:
    "TechNurture Pvt Ltd is a home-appliance service company dedicated to delivering reliable repairs, professional maintenance, and exceptional customer experiences across Sri Lanka. As a subsidiary of Lusako Holdings Pvt Ltd, TechNurture is built on a foundation of technical excellence, operational discipline, and customer-centric service.",
  heritage:
    "Backed by over a decade of industry experience through the Lusako Group, we have successfully served a diverse portfolio of clients — including leading banks, hospitals, corporate organizations, educational institutions, manufacturing facilities, and government establishments. Our reputation has been built through consistent service delivery, technical expertise, and an unwavering commitment to customer satisfaction.",
  mission:
    "To keep every home and business running smoothly with fast, honest appliance repair and maintenance — backed by exceptional service, professional expertise, and long-term customer success.",
  vision:
    "To become Sri Lanka's most trusted home-appliance service provider, recognized for reliability, technical excellence, and customer satisfaction.",
  values: [
    { title: "Integrity", body: "Transparent diagnosis and honest pricing on every job we take on." },
    { title: "Reliability", body: "Standardized procedures and trained technicians, every single time." },
    { title: "Excellence", body: "Genuine parts and high service standards we stand behind." },
    { title: "Customer Focus", body: "Every repair designed around your needs and long-term value." },
    { title: "Continuous Improvement", body: "We keep refining our systems, tools and processes." },
  ],
};

export const services = {
  eyebrow: "Services",
  heading: "Expertise built on insight & experience",
  sub: "Dependable appliance repair and maintenance grounded in over a decade of field experience, genuine parts and proven service procedures.",
  /* Each card carries its own `href`. Cards and service pages are not 1:1 —
     card 03 covers both water services — so the destination has to be
     explicit rather than derived from the icon key. */
  cards: [
    {
      icon: "air",
      href: "/services/air-conditioning",
      title: "Air Conditioning",
      body: "Repair, servicing, gas charging and installation for split, inverter and commercial AC — efficient cooling with lower bills.",
      points: ["Repairs", "Servicing", "Gas Charging", "Installation"],
    },
    {
      icon: "fridge",
      href: "/services/refrigerator",
      title: "Refrigerator & Freezer",
      body: "Cooling faults, gas refilling, compressor, thermostat and door-seal repairs for fridges and freezers of every brand.",
      points: ["No-Cooling Repair", "Gas Refilling", "Compressor & PCB", "Commercial Units"],
    },
    {
      icon: "water",
      href: "/services/inline-water-purifiers",
      title: "Inline Water Purifiers & Bottle Water Dispensers",
      body: "Installation, preventive maintenance, repairs, sanitization, filter replacement and annual service contracts for water purifiers and bottle water dispensers.",
      points: [
        "Tank Chlorination & Steam Sanitization",
        "Bacterial Disinfection",
        "Filter Replacements",
        "Water Tests",
      ],
    },
    {
      icon: "wrench",
      href: "/services/maintenance-amc",
      title: "Maintenance & AMC",
      body: "Scheduled preventive maintenance and annual service contracts that reduce breakdowns and extend appliance life.",
      points: ["Comprehensive AMC", "Non-Comprehensive AMC", "On-Call Service", "Priority Support"],
    },
  ],
};

/* ============================================================
   Service catalogue — drives /services and /services/[slug].
   Each service is cross-linked to the others (see `related`).
   Structured so new services can be added without code changes.

   SEO keyword map (one primary target per page — keep these
   distinct to avoid cannibalization):
   · /services/air-conditioning → "AC repair / service / installation
     Sri Lanka" (service intent)
   · /services/refrigerator     → "refrigerator / fridge repair
     Sri Lanka" (service intent)
   · /services/inline-water-purifiers → "inline water purifier
     installation & filter replacement Sri Lanka" (service intent)
   · /services/bottle-water-dispensers → "water dispenser repair &
     sanitization Sri Lanka" (service intent)
   · /services/maintenance-amc  → "appliance annual maintenance
     contract (AMC) Sri Lanka" (service intent)
   · /products/[slug]           → transactional ("price", "buy")
   · /blog/*                    → long-tail informational

   · /services/washing-machine  → retired from the menus (listed: false)
     but still live so inbound links and search results don't break.

   Cannibalization rule: service pages never target "price"/"buy";
   product pages never target "repair"/"service".
   ============================================================ */
export const serviceCatalog = [
  {
    slug: "air-conditioning",
    icon: "air",
    title: "Air Conditioning",
    h1: "Air Conditioning Repair & Service in Sri Lanka",
    tagline: "Efficient, reliable cooling for homes and businesses.",
    summary:
      "Repair, servicing, gas charging and installation for split, inverter and commercial air conditioning — efficient cooling and lower bills.",
    metaTitle: "AC Repair, Service & Installation in Sri Lanka",
    metaDescription:
      "Professional AC repair, service, installation and gas charging for split, inverter and commercial air conditioning across Sri Lanka. Fast-response technicians from TechNurture.",
    keywords: [
      "AC repair Sri Lanka",
      "AC service Colombo",
      "air conditioner installation Sri Lanka",
      "AC gas charging",
      "inverter AC repair",
    ],
    image: "/services/air-conditioning.png",
    imageAlt:
      "TechNurture technician servicing a wall-mounted split air conditioner indoor unit",
    intro: {
      heading: "Cooling that stays efficient — and stays working.",
      body: [
        "We install, service and repair split, inverter and commercial air conditioning systems for residential and commercial environments. Regular servicing improves efficiency, extends equipment life and keeps electricity bills in check.",
        "From a single home unit to large commercial systems across offices, healthcare and education facilities, our technicians diagnose and resolve issues efficiently — with emergency support when you need it most.",
      ],
      highlights: [
        "Split, inverter & commercial AC",
        "Gas charging & leak checks",
        "Residential & commercial",
        "Emergency repair support",
      ],
    },
    offerings: [
      {
        title: "Repairs & Diagnostics",
        body: "Fast troubleshooting for weak cooling, water leaks, strange sounds, blocked condensers and faulty components.",
      },
      {
        title: "Servicing & Maintenance",
        body: "Cleaning, filter care and performance tuning every 3–6 months to keep systems efficient.",
      },
      {
        title: "Gas Charging",
        body: "Refrigerant top-up and leak checks to restore cooling capacity and efficiency.",
      },
      {
        title: "Installation",
        body: "Professional installation and setup of split, inverter and commercial cooling systems.",
      },
    ],
    steps: [
      { n: "01", title: "Inspect", body: "We evaluate your space, load and existing equipment." },
      { n: "02", title: "Quote", body: "A clear recommendation and transparent pricing before any work." },
      { n: "03", title: "Repair / Service", body: "Trained technicians repair or service to manufacturer standards." },
      { n: "04", title: "Support", body: "Ongoing maintenance keeps cooling efficient and reliable." },
    ],
    related: [
      "refrigerator",
      "inline-water-purifiers",
      "bottle-water-dispensers",
      "maintenance-amc",
    ],
  },
  {
    slug: "refrigerator",
    icon: "fridge",
    title: "Refrigerator & Freezer",
    h1: "Refrigerator & Freezer Repair in Sri Lanka",
    tagline: "Fast fridge and freezer repairs that stop food spoiling.",
    summary:
      "Diagnosis and repair of cooling faults, gas refilling, compressor, thermostat and door-seal issues for fridges and freezers of every brand.",
    metaTitle: "Refrigerator & Freezer Repair in Sri Lanka",
    metaDescription:
      "Same-day refrigerator and freezer repair across Sri Lanka — not cooling, gas refilling, compressor, thermostat and door-seal faults on all major brands. Genuine parts, trained technicians from TechNurture.",
    keywords: [
      "refrigerator repair Sri Lanka",
      "fridge repair Colombo",
      "freezer repair",
      "fridge gas refilling",
      "refrigerator compressor repair",
    ],
    image: "/services/refrigerator.png",
    imageAlt:
      "TechNurture technician diagnosing the cooling system at the back of a refrigerator",
    intro: {
      heading: "Back to cold, before anything spoils.",
      body: [
        "We repair domestic and commercial refrigerators, chest and upright freezers, and no-frost units — cooling loss, gas leaks, compressor and PCB faults, noisy operation and water leaks.",
        "Our technicians service all major brands regardless of who supplied the unit, using genuine parts and the correct refrigerant so the repair lasts.",
      ],
      highlights: [
        "No-cooling & gas refilling",
        "Compressor & thermostat faults",
        "Domestic & commercial units",
        "All major brands",
      ],
    },
    offerings: [
      {
        title: "Cooling & Gas Repair",
        body: "Leak detection, gas refilling and restoring correct cooling in fridges and freezers.",
      },
      {
        title: "Compressor & PCB",
        body: "Diagnosis and replacement of compressors, relays, thermostats and control boards.",
      },
      {
        title: "Seals & Water Leaks",
        body: "Door-gasket replacement, drainage and defrost fixes that stop leaks and frost build-up.",
      },
      {
        title: "Commercial Refrigeration",
        body: "Display chillers, chest freezers and cold-room support for shops and restaurants.",
      },
    ],
    steps: [
      { n: "01", title: "Diagnose", body: "We identify the fault on-site and explain it plainly." },
      { n: "02", title: "Quote", body: "Transparent pricing before any work begins." },
      { n: "03", title: "Repair", body: "Genuine parts and the correct refrigerant, done right." },
      { n: "04", title: "Verify", body: "We confirm stable cooling before we leave." },
    ],
    related: [
      "air-conditioning",
      "inline-water-purifiers",
      "bottle-water-dispensers",
      "maintenance-amc",
    ],
  },
  {
    slug: "inline-water-purifiers",
    icon: "water",
    title: "Inline Water Purifiers",
    h1: "Inline Water Purifier Installation & Service in Sri Lanka",
    tagline: "Clean water at the tap, without a bulky unit on the counter.",
    summary:
      "Installation, filter replacement, sanitization and repair of inline water purifiers — RO, UV, UF and multi-stage systems for homes, offices and institutions.",
    metaTitle: "Inline Water Purifier Installation & Filter Replacement in Sri Lanka",
    metaDescription:
      "Inline water purifier installation, filter replacement, sanitization and repair across Sri Lanka. RO, UV, UF and multi-stage systems serviced by trained TechNurture technicians — all major brands.",
    keywords: [
      "inline water purifier Sri Lanka",
      "water purifier filter replacement",
      "RO water purifier installation Sri Lanka",
      "water purifier service Colombo",
      "UV water purifier repair",
    ],
    image: "/services/inline-water-purifiers.png",
    imageAlt:
      "Inline water purifier servicing by TechNurture — installation, filter replacement and sanitization",
    intro: {
      heading: "Water you stop thinking about.",
      body: [
        "An inline purifier sits out of sight — under the sink or in the service duct — and treats water on its way to the tap. That is its advantage and its risk: because you never look at it, a spent cartridge or a fouled membrane can go unnoticed for months while quality quietly drops.",
        "We install, service and repair RO, UV, UF and multi-stage systems for households, offices and institutions. Mains supply in much of Sri Lanka swings with the monsoon and with local hardness, so we set service intervals against your actual water and usage rather than a generic sticker on the housing.",
        "We work on most major brands regardless of who installed the system, and fit genuine cartridges, membranes and lamps — the wrong-spec filter is the fastest way to shorten a pump's life.",
      ],
      highlights: [
        "RO, UV, UF & multi-stage systems",
        "Genuine filters & membranes",
        "System sanitization",
        "Water-quality inspection",
        "Domestic, office & institutional",
        "All major brands",
      ],
    },
    offerings: [
      {
        title: "Installation",
        body: "Correct sizing, placement and commissioning under the sink or in the service duct, with pressure and flow checked before we sign off.",
      },
      {
        title: "Filter Replacement",
        body: "Sediment and carbon cartridges, RO membranes, UV lamps and mineral stages replaced on schedule, before quality drops rather than after.",
      },
      {
        title: "System Sanitization",
        body: "Full flush and disinfection of housings, tubing and the storage tank to clear biofilm — the usual cause of an off taste in a system that tests otherwise clean.",
      },
      {
        title: "Repairs & Troubleshooting",
        body: "Low flow, leaks, noisy or short-cycling pumps, failed solenoids, TDS creep and taste or odour complaints diagnosed and fixed.",
      },
      {
        title: "Water Quality Inspection",
        body: "On-site testing so the recommendation is backed by your water, not an assumption about it.",
      },
      {
        title: "Annual Maintenance Contracts",
        body: "Scheduled visits, filter changes and priority support bundled into one predictable annual cost.",
      },
    ],
    steps: [
      { n: "01", title: "Test", body: "We check your water, pressure and usage before recommending anything." },
      { n: "02", title: "Quote", body: "A clear specification and transparent pricing — no surprises on the invoice." },
      { n: "03", title: "Install / Repair", body: "Trained technicians, genuine consumables, commissioned and flow-tested." },
      { n: "04", title: "Maintain", body: "Scheduled filter changes and sanitization keep quality steady year-round." },
    ],
    related: [
      "bottle-water-dispensers",
      "air-conditioning",
      "refrigerator",
      "maintenance-amc",
    ],
  },
  {
    slug: "bottle-water-dispensers",
    icon: "dispenser",
    title: "Bottle Water Dispensers",
    h1: "Bottle Water Dispenser Service & Repair in Sri Lanka",
    tagline: "Sanitized, serviced and working — hot and cold, all day.",
    summary:
      "Installation, sanitization, cooling and heating repairs, preventive maintenance and spare-part replacement for bottled water dispensers in homes and workplaces.",
    metaTitle: "Bottle Water Dispenser Repair & Sanitization in Sri Lanka",
    metaDescription:
      "Bottled water dispenser service, sanitization and repair across Sri Lanka — cooling and heating faults, leaks, taps and thermostats. Tank chlorination and bacterial disinfection by TechNurture.",
    keywords: [
      "water dispenser repair Sri Lanka",
      "bottle water dispenser service",
      "water dispenser sanitization Colombo",
      "water cooler repair Sri Lanka",
      "office water dispenser maintenance",
    ],
    image: "/services/bottle-water-dispensers.png",
    imageAlt:
      "Bottle water dispenser servicing by TechNurture — installation, sanitization and repair",
    intro: {
      heading: "The appliance everyone drinks from and nobody services.",
      body: [
        "A dispenser is the one appliance in an office that every person touches and no one is responsible for. Left alone, the internal tank grows biofilm, the cold side stops holding temperature, and the drip tray becomes the only part anyone ever cleans.",
        "We service bottled dispensers for homes, offices, clinics and schools — tank chlorination and steam sanitization, bacterial disinfection, cooling and heating repairs, tap and thermostat replacement, and scheduled preventive visits.",
        "Sanitization is the part worth insisting on. Wiping the outside does nothing for the reservoir, and in a shared workplace that reservoir is the whole point of the machine.",
      ],
      highlights: [
        "Tank chlorination & steam sanitization",
        "Bacterial disinfection",
        "Cooling & heating repairs",
        "Taps, thermostats & spare parts",
        "Home, office & institutional",
        "All major brands",
      ],
    },
    offerings: [
      {
        title: "Installation",
        body: "Placement, commissioning and a first sanitization cycle so the unit starts clean rather than merely new.",
      },
      {
        title: "Sanitization & Cleaning",
        body: "Tank chlorination, steam sanitization and bacterial disinfection of the reservoir, lines and taps — not just the visible surfaces.",
      },
      {
        title: "Cooling & Heating Repairs",
        body: "Compressor, thermostat, heating element and control faults on units that no longer hold cold or hot.",
      },
      {
        title: "Preventive Maintenance",
        body: "Scheduled visits that catch leaks, drips and failing taps before they reach the floor.",
      },
      {
        title: "Spare Parts Replacement",
        body: "Taps, valves, probes, thermostats and seals replaced with quality parts, matched to your model.",
      },
      {
        title: "Annual Maintenance Contracts",
        body: "Sanitization and servicing on a fixed schedule — the only way this appliance stays maintained in practice.",
      },
    ],
    steps: [
      { n: "01", title: "Inspect", body: "We assess the unit, its placement and how heavily it is used." },
      { n: "02", title: "Quote", body: "Transparent pricing for the sanitization or repair before any work starts." },
      { n: "03", title: "Service", body: "Sanitize, repair and replace parts, then run hot and cold to verify." },
      { n: "04", title: "Schedule", body: "Set a recurring interval so it never drifts back out of maintenance." },
    ],
    related: [
      "inline-water-purifiers",
      "air-conditioning",
      "refrigerator",
      "maintenance-amc",
    ],
  },
  {
    /* Retired from the menus per the client's June brief, but kept live so
       existing search results and inbound links don't break. See `listed`
       in the header comment. */
    listed: false,
    slug: "washing-machine",
    icon: "washer",
    title: "Washing Machine",
    h1: "Washing Machine Repair in Sri Lanka",
    tagline: "Repairs for every wash fault — front-load, top-load, automatic.",
    summary:
      "Repair of drainage, spin, drum, motor, PCB and water-inlet faults on front-load, top-load and fully-automatic washing machines.",
    metaTitle: "Washing Machine Repair & Service in Sri Lanka",
    metaDescription:
      "Expert washing machine repair across Sri Lanka — not spinning, not draining, error codes, drum, motor, PCB and inlet-valve faults on front-load, top-load and automatic machines. Genuine parts from TechNurture.",
    keywords: [
      "washing machine repair Sri Lanka",
      "washing machine service Colombo",
      "front load washing machine repair",
      "washer not spinning repair",
      "automatic washing machine repair",
    ],
    image: "/services/washing-machine.png",
    imageAlt:
      "TechNurture technician repairing a front-load washing machine",
    intro: {
      heading: "Laundry back to normal, fast.",
      body: [
        "We repair front-load, top-load and fully-automatic washing machines — no spin, no drain, water not filling, excessive vibration, error codes, and drum, bearing, motor and PCB faults.",
        "All major brands serviced with genuine parts, whether the machine is under a year old or a decade in.",
      ],
      highlights: [
        "Front-load, top-load & automatic",
        "Drainage & spin faults",
        "Motor, drum & PCB repair",
        "All major brands",
      ],
    },
    offerings: [
      {
        title: "Drain & Spin Repair",
        body: "Fixes for machines that won't drain, spin or complete a wash cycle.",
      },
      {
        title: "Motor, Belt & Drum",
        body: "Bearing, belt, drum and motor repair for noise and heavy vibration issues.",
      },
      {
        title: "Electronics & PCB",
        body: "Error-code diagnosis, control-board and sensor replacement.",
      },
      {
        title: "Inlet & Leaks",
        body: "Water-inlet valve, hose and seal repairs that stop leaks for good.",
      },
    ],
    steps: [
      { n: "01", title: "Diagnose", body: "We pinpoint the fault on-site and explain it clearly." },
      { n: "02", title: "Quote", body: "Transparent pricing before any repair begins." },
      { n: "03", title: "Repair", body: "Genuine parts fitted by trained technicians." },
      { n: "04", title: "Verify", body: "We run a full cycle to confirm the fix before we leave." },
    ],
    related: ["air-conditioning", "refrigerator", "maintenance-amc"],
  },
  {
    slug: "maintenance-amc",
    icon: "wrench",
    title: "Maintenance & AMC",
    h1: "Home Appliance Maintenance & AMC in Sri Lanka",
    tagline: "Preventive care that turns surprise breakdowns into peace of mind.",
    summary:
      "Scheduled preventive maintenance and Annual Maintenance Contracts for air conditioners, refrigerators, inline water purifiers, bottle water dispensers and washing machines.",
    metaTitle: "Appliance Annual Maintenance Contract (AMC) in Sri Lanka",
    metaDescription:
      "Comprehensive and non-comprehensive AMC plans in Sri Lanka for air conditioners, refrigerators, inline water purifiers and bottle water dispensers — scheduled visits, priority support, lower long-term costs.",
    keywords: [
      "appliance AMC Sri Lanka",
      "annual maintenance contract Sri Lanka",
      "AC AMC plan",
      "home appliance maintenance",
      "preventive maintenance service",
    ],
    image: "/services/maintenance-amc.png",
    imageAlt:
      "TechNurture technician carrying out a scheduled preventive maintenance visit",
    intro: {
      heading: "The cheapest repair is the one you never need.",
      body: [
        "The cheapest repair really is the one you never need. An Annual Maintenance Contract turns preventive care into something that happens on a schedule instead of something you mean to get around to — scheduled visits, servicing and priority support for your air conditioners, refrigerators, inline water purifiers, bottle water dispensers and washing machines.",
        "Choose the coverage that fits: a fully-inclusive Comprehensive AMC, an economical Non-Comprehensive plan, or flexible On-Call service only when you need it.",
        "Comprehensive and Non-Comprehensive contracts exclude major components — compressors, condensers, pressure pumps and anything else specified in your agreement. We spell those out in the contract rather than at the point of failure.",
      ],
      highlights: [
        "Comprehensive & non-comprehensive AMC",
        "Scheduled preventive visits",
        "Priority breakdown support",
        "Lower long-term costs",
      ],
    },
    offerings: [
      {
        title: "Comprehensive AMC",
        body: "Scheduled maintenance, labour, eligible spare-part replacement and priority support for one predictable annual cost.",
      },
      {
        title: "Non-Comprehensive AMC",
        body: "Professional servicing, inspections, labour and technical support, with parts charged separately as needed.",
      },
      {
        title: "On-Call Service",
        body: "Service visits, breakdown troubleshooting and inspections on request — no contract required.",
      },
      {
        title: "Priority Support",
        body: "Faster response times and planned visits so small issues are caught while they're still small.",
      },
    ],
    steps: [
      { n: "01", title: "Review", body: "We assess your appliances and how critical uptime is for you." },
      { n: "02", title: "Choose a plan", body: "Comprehensive, non-comprehensive or on-call — you decide the coverage." },
      { n: "03", title: "Schedule", body: "Preventive visits are planned in advance so you never think about it." },
      { n: "04", title: "Relax", body: "Fewer breakdowns, longer appliance life and predictable costs." },
    ],
    related: [
      "air-conditioning",
      "refrigerator",
      "inline-water-purifiers",
      "bottle-water-dispensers",
    ],
  },
];

export function getService(slug: string) {
  return serviceCatalog.find((s) => s.slug === slug);
}

/* Services that appear in the header drop-down, the footer menu and the
   /services grid. Retired services (`listed: false`) keep their page but
   drop out of every list — see the `listed` note at the top of this file. */
export const listedServices = serviceCatalog.filter((s) => s.listed !== false);

export const whyChoose = {
  eyebrow: "Why TechNurture",
  heading: "Reasons customers trust us",
  cards: [
    { title: "Experienced Technical Team", body: "Qualified technicians with extensive hands-on experience in air conditioning, refrigeration, water purification systems, and clean water dispensing equipment." },
    { title: "Fast Response", body: "Prompt support to minimize downtime and inconvenience for homes and businesses." },
    { title: "Preventive Maintenance", body: "Scheduled inspections that prevent costly, unexpected breakdowns before they happen." },
    { title: "Island-Wide Coverage", body: "Professional service wherever your home or business operates across Sri Lanka." },
    { title: "Genuine Parts", body: "Quality components and spare parts for maximum reliability and performance." },
    { title: "Long-Term Partnership", body: "We measure success through retention and lasting customer relationships." },
  ],
};

export const process = {
  eyebrow: "How We Work",
  heading: "A simple, transparent service journey",
  steps: [
    { n: "01", title: "Contact our team", body: "Reach us by phone, WhatsApp, email or the website to request installation or technical support." },
    { n: "02", title: "Choose your service option", body: "Our technicians can come to you, or you can bring the appliance to our service centre for diagnosis and repair." },
    { n: "03", title: "Inspection & diagnosis", body: "We inspect the appliance, identify the fault and recommend the repair or maintenance that actually fits it." },
    { n: "04", title: "Customized quotation", body: "A transparent quotation covering the work, the replacement parts and how long it will take." },
    { n: "05", title: "Professional installation or repair", body: "Certified technicians carry out the work using approved procedures and quality spare parts." },
    { n: "06", title: "Testing & quality assurance", body: "Every appliance is tested for safe operation and proper performance before it goes back to you." },
    { n: "07", title: "Collection, delivery & ongoing support", body: "Collect from our service centre or arrange delivery — then ongoing technical support and flexible AMC options." },
  ],
};

/* ---- Blog: 6 posts, balanced across the service pillars.
   Declared in any order and sorted newest-first below, so adding a post
   never depends on inserting it in the right place. ---- */
export const posts = [
  {
    slug: "signs-your-air-conditioner-needs-repair",
    title: "Signs Your Air Conditioner Needs Repair",
    excerpt:
      "Weak cooling, rising bills and strange sounds are your AC asking for help. Here's how to read the signals before a breakdown.",
    date: "2026-07-10",
    readTime: "4 min read",
    category: "Air Conditioning",
    image: "/blog/ac-unit-maintenance.png",
    body: [
      "We recommend servicing air conditioning units every 3 to 6 months, depending on usage and environmental conditions. Regular servicing improves efficiency and extends equipment life.",
      "If your AC is not cooling properly, the usual suspects are dirty filters, low refrigerant levels, blocked condensers, faulty components or poor airflow. Our technicians can diagnose and resolve these issues efficiently.",
      "Rising electricity bills are often the first quiet warning. A properly maintained air conditioner operates more efficiently, helping reduce energy consumption and utility costs month after month.",
      "For urgent issues we offer emergency repair services — because a comfortable indoor environment shouldn't have to wait. We also support large commercial systems across offices, healthcare and education facilities.",
    ],
  },
  {
    slug: "why-your-refrigerator-stops-cooling",
    title: "Why Your Refrigerator Stops Cooling (and How to Fix It)",
    excerpt:
      "A fridge that won't cool is a race against spoiling food. Here are the common causes — and when to call a technician.",
    date: "2026-07-04",
    readTime: "5 min read",
    category: "Refrigerator",
    image: "/blog/refrigerator-repair.png",
    body: [
      "When a refrigerator stops cooling, the most common causes are a gas (refrigerant) leak, a failing compressor, a faulty thermostat or a blocked defrost system. Each has different symptoms, so an accurate on-site diagnosis matters.",
      "Start with the easy checks: confirm the unit has power, the door seals fully, and the vents inside aren't blocked by food. If the freezer works but the fridge section is warm, the problem is often airflow or the defrost system rather than the compressor.",
      "A leaking refrigerant circuit or a burnt-out compressor needs a qualified technician — refrigerant handling and compressor replacement are not DIY jobs. We locate the leak, repair it, refill with the correct gas and verify stable cooling before we leave.",
      "Our technicians service domestic and commercial refrigerators and freezers of all major brands, using genuine parts. If a repair isn't worthwhile, we'll tell you honestly rather than sell you an unnecessary fix.",
      "The best protection against a mid-week breakdown is preventive care — an Annual Maintenance Contract keeps seals, gas levels and cooling performance in check all year round.",
    ],
  },
  {
    slug: "how-often-should-an-inline-water-purifier-be-serviced",
    title: "How Often Should an Inline Water Purifier Be Serviced?",
    excerpt:
      "Service intervals, the warning signs worth acting on, and why the sticker on the housing is usually wrong for Sri Lankan water.",
    date: "2026-08-05",
    readTime: "5 min read",
    category: "Inline Water Purifiers",
    image: "/blog/water-purifier-service.png",
    body: [
      "As a general rule, an inline water purifier needs servicing every three to six months. The honest answer is that the interval depends on your water source and how much you use — a household on a borehole in Kurunegala and an office on treated mains in Colombo 07 will not run the same schedule, even with identical hardware.",
      "The reason people get this wrong is that an inline system is invisible. It sits under the sink or in a service duct, it has no display, and nothing announces that the carbon stage stopped adsorbing six weeks ago. Unlike a countertop unit you look at every day, there is no visual cue at all — which is exactly why a fixed calendar interval matters more here, not less.",
      "Watch for the signs that the interval is too long: reduced flow at the tap, an unusual taste or odour, visible leakage at a housing, unusual sounds from the pump, or a filter-replacement indicator you have been ignoring. Any one of these is worth an inspection rather than a wait-and-see.",
      "Each stage has its own life. Sediment and carbon cartridges are the fast-moving consumables. RO membranes last considerably longer but fail expensively if the pre-filters ahead of them were neglected — most premature membrane failures we see are really pre-filter failures. UV lamps are the trap: a UV lamp keeps glowing well past the point where its output has dropped below the dose that actually kills anything, so it must be replaced on hours, not on whether it lights up.",
      "Sanitization is the step most schedules skip. Replacing cartridges in a housing that has grown biofilm puts a clean filter into a dirty system. If your water tests fine but still tastes off, biofilm in the tubing or storage tank is the usual explanation, and a full flush and disinfection is what fixes it.",
      "We service RO, UV, UF and multi-stage systems across Sri Lanka regardless of who installed them, fit genuine cartridges and membranes, and can arrange water-quality testing so the schedule is set against your actual supply. If you would rather not track it at all, an Annual Maintenance Contract puts the visits and the filter changes on a fixed cycle.",
    ],
  },
  {
    slug: "why-your-water-dispenser-needs-sanitizing",
    title: "Why Your Water Dispenser Needs Sanitizing, Not Just Wiping",
    excerpt:
      "The reservoir nobody cleans, what grows in it, and how often a shared office dispenser really needs professional sanitization.",
    date: "2026-07-29",
    readTime: "4 min read",
    category: "Bottle Water Dispensers",
    image: "/blog/bottle-water-dispenser-sanitization.jpg",
    body: [
      "A bottled water dispenser is the one appliance in an office that everybody drinks from and nobody owns. The drip tray gets emptied, the outside gets wiped, and the internal reservoir — the part the water actually sits in — goes untouched for years.",
      "That reservoir is warm at the top, cool at the bottom, permanently wet and open to room air every time a bottle is changed. It is close to ideal conditions for biofilm: a slick bacterial layer on the tank walls and the internal tubing that no amount of external cleaning reaches. Once established, it re-seeds every fresh bottle you load.",
      "The tell-tale signs are easy to dismiss individually. A faint taste that only some people notice. A slight film on the tap. Cold water that no longer feels properly cold. Water pooling under the unit. None of them looks urgent, which is precisely why dispensers tend to go a very long time between real services.",
      "Professional sanitization is a different job from cleaning. It means draining the unit, chlorinating and steam-sanitizing the tank, disinfecting the internal lines and taps, flushing thoroughly, and then verifying that the cold and hot sides still hold temperature. In a shared workplace we recommend it every three to six months — more often in a clinic, a school or a food-handling environment.",
      "Sanitization is also the moment to catch the mechanical faults: a thermostat drifting out of range, a heating element on its way out, a perished tap seal, a compressor working harder than it should. All of them are cheaper to address at a scheduled visit than as an emergency call.",
      "We service bottled dispensers for homes, offices, clinics and schools across Sri Lanka — tank chlorination and steam sanitization, bacterial disinfection, cooling and heating repairs, and spare-part replacement. Most customers put it on an Annual Maintenance Contract, because in practice this is the appliance that only stays maintained when somebody else is tracking it.",
    ],
  },
  {
    slug: "reverse-osmosis-vs-uv-water-filtration",
    title: "Reverse Osmosis vs UV Purification: Which Water Filter Is Right for You?",
    excerpt:
      "Understanding RO vs UV filtration technologies, how they target different contaminants, and which system best suits Sri Lankan municipal and borehole water supplies.",
    date: "2026-08-07",
    readTime: "5 min read",
    category: "Inline Water Purifiers",
    image: "/blog/water-purifier-comparison.png",
    body: [
      "Choosing between Reverse Osmosis (RO) and Ultraviolet (UV) water purification depends on your water source and the specific contaminants you need to eliminate. In Sri Lanka, water composition varies significantly between mains municipal supply and groundwater wells.",
      "Reverse Osmosis (RO) uses a semi-permeable membrane to remove dissolved solids, heavy metals, hardness minerals, microplastics, and chemical pollutants. It is ideal for areas with hard water or high total dissolved solids (TDS).",
      "Ultraviolet (UV) purification uses UV-C light to neutralize 99.99% of bacteria, viruses, and biological pathogens without chemical additives or water wastage. UV systems excel at biological disinfection when TDS levels are already low.",
      "Many modern inline systems combine multi-stage sediment filtering, carbon block adsorption, RO membrane filtration, and final UV sterilization into a unified under-sink unit for maximum safety and taste enhancement.",
      "Our water specialists conduct on-site water quality testing to recommend the optimal purification setup for your home or business across Sri Lanka, backed by genuine filter replacement and routine maintenance contracts.",
    ],
  },
  {
    slug: "benefits-of-an-appliance-amc",
    title: "The Benefits of an Appliance Annual Maintenance Contract",
    excerpt:
      "An AMC turns unpredictable repair bills into a planned, predictable cost — while keeping your appliances healthier for longer.",
    date: "2026-06-18",
    readTime: "6 min read",
    category: "Maintenance",
    image: "/blog/amc-benefits.png",
    body: [
      "Preventive maintenance is the key to maximizing appliance performance, reducing downtime and extending asset lifespan. An Annual Maintenance Contract (AMC) makes that preventive care automatic for your air conditioners, refrigerators, inline water purifiers, and bottle water dispensers.",
      "A Comprehensive AMC is our most complete solution — scheduled preventive visits, routine servicing, labour, eligible spare-part replacement, breakdown support and priority technical assistance, all for one predictable annual cost.",
      "A Non-Comprehensive AMC is the economical option: professional servicing, inspections, labour and technical support, with replacement parts charged separately as needed.",
      "Prefer to pay only when something happens? On-Call Service gives you service visits on request, breakdown troubleshooting and inspections without a contract.",
      "Whichever you choose, the benefits are the same: fewer breakdowns, longer appliance life, lower long-term repair costs, better efficiency and priority support — in short, peace of mind.",
    ],
  },
  {
    slug: "extend-the-life-of-your-home-appliances",
    title: "7 Habits That Extend the Life of Your Home Appliances",
    excerpt:
      "Small routines that keep your AC, fridge and water systems running longer — and out of the repair queue.",
    date: "2026-06-10",
    readTime: "4 min read",
    category: "Maintenance",
    image: "/blog/preventive-maintenance-savings.png",
    body: [
      "Most appliance failures are gradual, not sudden — which means a few simple habits can add years to the life of your AC, refrigerator, water purifier, and dispenser, and keep them running efficiently.",
      "Clean or replace filters on schedule. AC filters restrict airflow when clogged, forcing the system to work harder; water purifier filter cartridges cause flow and purity issues when neglected. This is the single highest-impact habit most people skip.",
      "Give appliances room to breathe. Leave a gap behind the fridge for the condenser to release heat, keep the AC condenser unit clear of leaves and dust, and sanitize water dispenser reservoirs regularly.",
      "Watch for early warning signs — weak cooling, unusual sounds, longer cycles, rising bills or small leaks. Catching a small fault early is almost always cheaper than waiting for a full breakdown.",
      "Finally, book a periodic professional service. Reactive repairs are almost always more expensive, more disruptive and more urgent than planned maintenance — which is exactly what an Annual Maintenance Contract is designed to prevent.",
    ],
  },
].sort((a, b) => b.date.localeCompare(a.date));

/* ---- FAQ ---- */
export const faqs = [
  {
    q: "How often should home appliances be serviced?",
    // Intervals are the client's own figures (see "Frequently Asked
    // Questions (FAQs).docx"): water purifiers are 4–6 months, not 3–6.
    a: "As a guide: air conditioners every 3–6 months, refrigerators once a year, inline water purifiers every 4–6 months depending on your water quality and consumption, and bottle water dispensers every 3–6 months. Regular maintenance keeps appliances efficient and prevents breakdowns.",
  },
  {
    q: "Which appliance brands do you repair?",
    a: "We repair all major brands of air conditioners, refrigerators, freezers, inline water purifiers, bottle water dispensers and washing machines — regardless of who originally supplied or installed the unit.",
  },
  {
    q: "Can you service equipment installed by another company?",
    a: "Absolutely. Our experienced technicians can inspect, repair and maintain most major brands and models, regardless of the original installer.",
  },
  {
    q: "Do you provide island-wide service coverage?",
    a: "Yes. We provide repair, maintenance and technical support services across Sri Lanka.",
  },
  {
    q: "What are your maintenance contract options?",
    a: "We offer three options: Comprehensive AMC, Non-Comprehensive AMC, and On-Call Service — designed to suit different requirements and budgets.",
  },
  {
    q: "Do you provide emergency repair services?",
    a: "Yes. We understand the importance of comfortable, functional environments and strive to respond quickly to urgent service requests.",
  },
  {
    q: "How can I request a quotation?",
    a: "Contact our team by phone, WhatsApp or the website inquiry form. We'll assess your requirements and provide a customized quotation.",
  },
];

export const trustCards = [
  {
    title: "Trusted Experience",
    body: "Over 10 years of industry experience and a proven track record serving banks, hospitals and corporate organizations across Sri Lanka.",
  },
  {
    title: "Long-Term Support",
    body: "A one-time repair is just the beginning. We provide ongoing maintenance, preventive care and responsive technical support for the life of your appliances.",
  },
  {
    title: "Reliable Service Delivery",
    body: "Standardized processes, trained technicians and performance-driven operations ensure consistent quality, reduced downtime and complete satisfaction.",
  },
];

export const servicePlans = {
  eyebrow: "AMC & Service Plans",
  heading: "Tailored care for your home appliances",
  sub: "Keep your air conditioners, refrigerators, inline water purifiers and bottle water dispensers performing at their best with our flexible Annual Maintenance Contracts (AMC) and on-demand services.",
  plans: [
    {
      id: "comprehensive",
      name: "Comprehensive",
      badge: "",
      featured: false,
      priceLabel: "Maximum protection with predictable, fixed maintenance costs for critical operations.",
      points: [
        "24/7 emergency assistance",
        "Complete service & breakdown history",
        "Scheduled preventive maintenance",
        "Unlimited emergency breakdown call-outs",
        "Labour charges included",
        "Eligible spare parts replacement included",
        "Priority service support",
      ],
      note: "Excludes major components — compressors, condensers, pressure pumps and anything else specified in the agreement.",
      cta: "Enquire about Comprehensive",
    },
    {
      id: "non-comprehensive",
      name: "Non-Comprehensive",
      badge: "MOST POPULAR",
      featured: true,
      priceLabel: "Professional servicing and technical support, with replacement parts managed separately.",
      points: [
        "24/7 emergency assistance",
        "Complete service & breakdown history",
        "Scheduled preventive maintenance",
        "Unlimited emergency breakdown call-outs",
        "Labour charges included",
        "Spare parts charged separately",
        "Priority service support",
      ],
      note: "Spare parts, consumables and major component replacements are quoted separately.",
      cta: "Enquire about Non-Comprehensive",
    },
    {
      id: "on-call",
      name: "On-Call Service",
      badge: "",
      featured: false,
      priceLabel: "Service support only when you need it — ideal for occasional requirements.",
      points: [
        "24/7 emergency assistance",
        "Complete service & breakdown history",
        "Preventive maintenance reminders",
        "Emergency breakdown call-out visits",
        "Labour and spare parts charged per visit",
        "No annual service contract required",
      ],
      note: "A reported breakdown may need an inspection before repairs. The charge is agreed in advance and deducted from the final invoice if the repair goes ahead with us.",
      cta: "Enquire about On-Call Service",
    },
  ],
};

export function whatsappLink(message: string) {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}
