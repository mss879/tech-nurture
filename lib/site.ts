/* ============================================================
   TechNurture — central content source
   Home-appliance service business: Air Conditioning, Refrigerator
   & Freezer, Washing Machine, and Maintenance & AMC.
   Brand: TechNurture Pvt Ltd · Tagline: "Technology Inspired by Nurture"
   Subsidiary of Lusako Holdings Pvt Ltd.
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
  hours: "Mon – Sat · 8:30am – 6:00pm", // TODO: confirm business hours
  geo: { lat: 6.9271, lng: 79.8612 }, // TODO: real coordinates (currently central Colombo)
  trustLine:
    "A subsidiary of Lusako Holdings Pvt Ltd, backed by over a decade of experience serving leading banks, hospitals, corporate organizations, and institutions across Sri Lanka.",
};

export const nav = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  {
    label: "Services",
    href: "/services",
    children: [
      { label: "Air Conditioning", href: "/services/air-conditioning" },
      { label: "Refrigerator & Freezer", href: "/services/refrigerator" },
      { label: "Washing Machine", href: "/services/washing-machine" },
      { label: "Maintenance & AMC", href: "/services/maintenance-amc" },
    ],
  },
  { label: "Blog", href: "/blog" },
  { label: "Book", href: "/book" },
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
    { label: "Island-Wide", color: "lime" },
    { label: "10+ Years", color: "teal" },
    { label: "Trusted Team", color: "green" },
    { label: "Fast Response", color: "navy" },
    { label: "Genuine Parts", color: "lime" },
  ],
  headline: ["Reliable systems.", "Total confidence."],
  sub: "Expert repair, servicing and maintenance for air conditioners, refrigerators and washing machines — keeping homes and businesses across Sri Lanka cool, fresh and running.",
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
  { value: 500, suffix: "+", label: "Appliances serviced & repaired" },
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
  body: "TechNurture Pvt Ltd brings reliable technicians, professional service and modern processes to help you repair, maintain and depend on your air conditioners, refrigerators and washing machines.",
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
  cards: [
    {
      icon: "air",
      title: "Air Conditioning",
      body: "Repair, servicing, gas charging and installation for split, inverter and commercial AC — efficient cooling with lower bills.",
      points: ["Repairs", "Servicing", "Gas Charging", "Installation"],
    },
    {
      icon: "fridge",
      title: "Refrigerator & Freezer",
      body: "Cooling faults, gas refilling, compressor, thermostat and door-seal repairs for fridges and freezers of every brand.",
      points: ["No-Cooling Repair", "Gas Refilling", "Compressor & PCB", "Commercial Units"],
    },
    {
      icon: "washer",
      title: "Washing Machine",
      body: "Drain, spin, motor, drum and PCB repairs for front-load, top-load and fully-automatic washing machines.",
      points: ["Drain & Spin", "Motor & Drum", "Electronics & PCB", "Inlet & Leaks"],
    },
    {
      icon: "wrench",
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
   · /services/washing-machine  → "washing machine repair Sri Lanka"
     (service intent)
   · /services/maintenance-amc  → "appliance annual maintenance
     contract (AMC) Sri Lanka" (service intent)
   · /blog/*                    → long-tail informational
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
    related: ["refrigerator", "washing-machine", "maintenance-amc"],
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
    related: ["air-conditioning", "washing-machine", "maintenance-amc"],
  },
  {
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
      "Scheduled preventive maintenance and Annual Maintenance Contracts for air conditioners, refrigerators and washing machines.",
    metaTitle: "Appliance Annual Maintenance Contract (AMC) in Sri Lanka",
    metaDescription:
      "Comprehensive and non-comprehensive AMC plans for air conditioners, refrigerators and washing machines in Sri Lanka. Scheduled preventive visits, priority support and lower long-term costs from TechNurture.",
    keywords: [
      "appliance AMC Sri Lanka",
      "annual maintenance contract Sri Lanka",
      "AC AMC plan",
      "home appliance maintenance",
      "preventive maintenance service",
    ],
    image: "/services/maintenance-amc.png",
    intro: {
      heading: "The cheapest repair is the one you never need.",
      body: [
        "Preventive maintenance is the key to maximizing performance, reducing downtime and extending the life of your appliances. Our Annual Maintenance Contracts make that preventive care automatic — with scheduled visits, servicing and priority support built in for your air conditioners, refrigerators and washing machines.",
        "Choose the coverage that fits: a fully-inclusive Comprehensive AMC, an economical Non-Comprehensive plan, or flexible On-Call service only when you need it.",
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
    related: ["air-conditioning", "refrigerator", "washing-machine"],
  },
];

export function getService(slug: string) {
  return serviceCatalog.find((s) => s.slug === slug);
}

export const whyChoose = {
  eyebrow: "Why TechNurture",
  heading: "Reasons customers trust us",
  cards: [
    { title: "Experienced Technical Team", body: "Qualified technicians with extensive hands-on experience across air conditioning, refrigeration and laundry appliances." },
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
    { n: "01", title: "Contact our team", body: "Reach us by phone, WhatsApp or the website inquiry form to tell us what you need." },
    { n: "02", title: "On-site diagnosis", body: "We assess your appliance and the fault on-site or remotely, and explain it plainly." },
    { n: "03", title: "Customized quotation", body: "Receive a clear, tailored solution and transparent pricing — no surprises." },
    { n: "04", title: "Professional repair", body: "Trained technicians repair or service your appliance with genuine parts." },
    { n: "05", title: "Ongoing support", body: "Preventive maintenance and responsive support throughout the life of your appliance." },
  ],
};

/* ---- Blog: 5 posts, balanced across the service pillars ---- */
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
    slug: "washing-machine-not-spinning-or-draining",
    title: "Washing Machine Not Spinning or Draining? Here's Why",
    excerpt:
      "No spin, no drain, or water left in the drum — the usual culprits behind the most common washing-machine faults.",
    date: "2026-06-26",
    readTime: "5 min read",
    category: "Washing Machine",
    image: "/blog/washing-machine-repair.png",
    body: [
      "If your washing machine won't spin or drain, the water left in the drum usually points to a blocked drain pump, a clogged filter, a kinked drain hose or a worn drive belt. On automatic machines, a faulty door lock or control board can also stop the cycle.",
      "Before calling for service, check the drain filter (usually behind a small panel at the front) and make sure the drain hose isn't blocked or pushed too far into the standpipe. Clearing lint and debris solves a surprising number of 'won't drain' cases.",
      "Persistent no-spin faults are often the motor carbon brushes, the drive belt, the door-lock switch or the main PCB. Loud banging on spin usually means worn drum bearings — a bigger job best handled by a technician before it damages the drum.",
      "We repair front-load, top-load and fully-automatic washing machines of all major brands, diagnose error codes, and fit genuine parts. Every repair is tested with a full cycle so you know it's truly fixed.",
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
      "Preventive maintenance is the key to maximizing appliance performance, reducing downtime and extending asset lifespan. An Annual Maintenance Contract (AMC) makes that preventive care automatic for your air conditioners, refrigerators and washing machines.",
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
      "Small routines that keep your AC, fridge and washing machine running longer — and out of the repair queue.",
    date: "2026-06-10",
    readTime: "4 min read",
    category: "Maintenance",
    image: "/blog/preventive-maintenance-savings.png",
    body: [
      "Most appliance failures are gradual, not sudden — which means a few simple habits can add years to the life of your AC, refrigerator and washing machine, and keep them running efficiently.",
      "Clean or replace filters on schedule. AC filters restrict airflow when clogged, forcing the system to work harder; washing-machine drain filters cause drainage faults when neglected. This is the single highest-impact habit most people skip.",
      "Give appliances room to breathe. Leave a gap behind the fridge for the condenser to release heat, keep the AC condenser unit clear of leaves and dust, and don't overload the washing machine drum.",
      "Watch for early warning signs — weak cooling, unusual sounds, longer cycles, rising bills or small leaks. Catching a small fault early is almost always cheaper than waiting for a full breakdown.",
      "Finally, book a periodic professional service. Reactive repairs are almost always more expensive, more disruptive and more urgent than planned maintenance — which is exactly what an Annual Maintenance Contract is designed to prevent.",
    ],
  },
];

/* ---- FAQ ---- */
export const faqs = [
  {
    q: "How often should home appliances be serviced?",
    a: "As a guide: air conditioners every 3–6 months, refrigerators once a year, and washing machines whenever performance drops. Regular maintenance keeps appliances efficient and prevents breakdowns.",
  },
  {
    q: "Which appliance brands do you repair?",
    a: "We repair all major brands of air conditioners, refrigerators, freezers and washing machines — regardless of who originally supplied or installed the unit.",
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
  sub: "Keep your air conditioners, refrigerators and washing machines performing at their best with our flexible Annual Maintenance Contracts (AMC) and on-demand services.",
  plans: [
    {
      id: "comprehensive",
      name: "Comprehensive",
      badge: "",
      featured: false,
      priceLabel: "Maximum protection with predictable, fixed maintenance costs for critical operations.",
      points: [
        "Scheduled preventive maintenance",
        "Routine inspections & servicing",
        "Labour charges included",
        "Eligible spare parts replaced",
        "Breakdown & priority support",
      ],
      cta: "Enquire about Comprehensive",
    },
    {
      id: "non-comprehensive",
      name: "Non-Comprehensive",
      badge: "MOST POPULAR",
      featured: true,
      priceLabel: "Professional servicing and technical support, with replacement parts managed separately.",
      points: [
        "Scheduled preventive maintenance",
        "Routine inspections & servicing",
        "Labour charges included",
        "Technical support",
        "Performance checks",
      ],
      cta: "Enquire about Non-Comprehensive",
    },
    {
      id: "on-call",
      name: "On-Call Service",
      badge: "",
      featured: false,
      priceLabel: "Service support only when you need it — ideal for occasional requirements.",
      points: [
        "Service visits on request",
        "Breakdown troubleshooting",
        "Equipment inspections",
        "Repair recommendations",
        "Inspection fee deductible",
      ],
      cta: "Enquire about On-Call Service",
    },
  ],
};

export function whatsappLink(message: string) {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
}
