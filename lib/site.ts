/* ============================================================
   TechNature — central content source
   All copy is drawn from the client briefs (About, Website
   Structure, FAQs, AMC, General Suggestions, Products).
   Brand: TechNurture Pvt Ltd · Tagline: "Technology Inspired by Nurture"
   Subsidiary of Lusako Holdings Pvt Ltd.
   ============================================================ */

export const site = {
  name: "TechNurture",
  legal: "TechNurture Pvt Ltd",
  tagline: "Technology Inspired by Nurture",
  parent: "Lusako Holdings Pvt Ltd",
  // Placeholders — replace with real details before launch.
  phone: "+94 11 234 5678",
  phoneHref: "tel:+94112345678",
  whatsapp: "94771234567",
  email: "hello@technurture.lk",
  address: "Colombo, Sri Lanka",
  domain: "technurture.lk",
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
      { label: "Water Purification", href: "/services/water-purification" },
      { label: "Air Conditioning", href: "/services/air-conditioning" },
      { label: "Maintenance & AMC", href: "/services/maintenance-amc" },
    ],
  },
  { label: "Products", href: "/products" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
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
  sub: "Professional water purification, cooling, and maintenance systems designed to nurture healthy, efficient spaces across Sri Lanka.",
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
  { value: 500, suffix: "+", label: "Systems installed & maintained" },
];

export const partnershipsIntro = {
  eyebrow: "Industries We Serve",
  title: "Over a decade keeping Sri Lanka running.",
  body: "From idea to installation to lifelong maintenance, we combine technical expertise and a customer-first approach to keep your water and cooling systems performing — for households and the country's most demanding institutions.",
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
  heading: "We help homes and businesses run cleaner, cooler and with total confidence.",
  body: "TechNurture Pvt Ltd brings reliable products, professional service and modern processes to help you install, maintain and depend on your water purification and air conditioning systems.",
  story:
    "TechNurture Pvt Ltd is a technology solutions company dedicated to delivering reliable products, professional services, and exceptional customer experiences across Sri Lanka. As a subsidiary of Lusako Holdings Pvt Ltd, TechNurture is built on a foundation of innovation, operational excellence, and customer-centric service.",
  heritage:
    "Backed by over a decade of industry experience through the Lusako Group, we have successfully served a diverse portfolio of clients — including leading banks, hospitals, corporate organizations, educational institutions, manufacturing facilities, and government establishments. Our reputation has been built through consistent service delivery, technical expertise, and an unwavering commitment to customer satisfaction.",
  mission:
    "To empower homes and businesses with innovative technology solutions supported by exceptional service, professional expertise, and a commitment to long-term customer success.",
  vision:
    "To become Sri Lanka's most trusted technology solutions and service provider, recognized for innovation, reliability, and customer satisfaction.",
  values: [
    { title: "Integrity", body: "Transparency and accountability in every project we deliver." },
    { title: "Reliability", body: "Standardized processes and trained technicians, every single time." },
    { title: "Excellence", body: "Quality products and high service standards we stand behind." },
    { title: "Customer Focus", body: "Every solution designed around your needs and long-term value." },
    { title: "Continuous Improvement", body: "We keep refining our systems, tools and processes." },
  ],
};

export const services = {
  eyebrow: "Services",
  heading: "Expertise built on insight & experience",
  sub: "We deliver dependable solutions grounded in over a decade of field experience, genuine parts and proven service procedures.",
  cards: [
    {
      icon: "droplet",
      title: "Water Purification",
      body: "Installation, repairs, preventive maintenance, filter replacement and water-quality assessment for RO, UV, UF and multi-stage systems.",
      points: ["Installation", "Repairs", "Filter Replacement", "Water Quality Assessment"],
    },
    {
      icon: "wind",
      title: "Air Conditioning",
      body: "Installation, servicing, gas charging, troubleshooting and repairs for residential and commercial cooling — keeping systems efficient.",
      points: ["Installation", "Maintenance", "Gas Charging", "Commercial AC Support"],
    },
    {
      icon: "shield",
      title: "Maintenance & AMC",
      body: "Scheduled preventive maintenance and annual service contracts that reduce breakdowns, extend equipment life and cut long-term costs.",
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
   · /services/water-purification → "water purifier service /
     repair / installation Sri Lanka" (service intent)
   · /services/air-conditioning   → "AC service / repair /
     installation Sri Lanka" (service intent)
   · /services/maintenance-amc    → "annual maintenance contract
     (AMC) Sri Lanka" (service intent)
   · /shop + /shop/[slug]         → "buy water purifier online /
     price Sri Lanka" + Lusako model numbers (buy intent)
   · /products                    → product range / genuine filters
     & spare parts (catalogue intent)
   · /blog/*                      → long-tail informational
   ============================================================ */
export const serviceCatalog = [
  {
    slug: "water-purification",
    icon: "droplet",
    title: "Water Purification",
    h1: "Water Purification Services in Sri Lanka",
    tagline: "Safe, clean, great-tasting water — installed and maintained.",
    summary:
      "Design, installation and lifelong maintenance of RO, UV, UF and multi-stage water purification systems for homes, offices and institutions.",
    metaTitle: "Water Purifier Service, Repair & Installation in Sri Lanka",
    metaDescription:
      "Expert water purifier service, repair and installation across Sri Lanka. RO, UV, UF and multi-stage systems, genuine filter replacement and free water-quality checks by TechNurture.",
    keywords: [
      "water purifier service Sri Lanka",
      "water purifier repair",
      "RO water purifier installation",
      "water filter replacement Sri Lanka",
      "water purification services",
    ],
    image: "/products/dispenser-counter-front.jpeg",
    intro: {
      heading: "Clean water you can rely on, day after day.",
      body: [
        "From selecting the right system to installing it correctly and keeping it running for years, our team handles every stage of your water purification needs. We work with domestic and commercial RO, UV, UF and multi-stage systems.",
        "Our technicians service most major brands and models — regardless of who originally installed the system — using genuine filters and consumables so your water stays safe and your equipment stays efficient.",
      ],
      highlights: [
        "RO, UV, UF & multi-stage systems",
        "Genuine filters & consumables",
        "Domestic & commercial scale",
        "Water-quality assessment",
      ],
    },
    offerings: [
      {
        title: "New Installation",
        body: "Correct sizing, placement and commissioning for domestic and commercial purifiers, done to manufacturer standards.",
      },
      {
        title: "Repairs & Troubleshooting",
        body: "Fast diagnosis and repair of leaks, low flow, taste or odour issues, pump and membrane faults.",
      },
      {
        title: "Filter Replacement",
        body: "Scheduled replacement of sediment, carbon, RO membranes, UV lamps and mineral cartridges before quality drops.",
      },
      {
        title: "Water Quality Assessment",
        body: "On-site testing so every recommendation is backed by real data about your water.",
      },
    ],
    steps: [
      { n: "01", title: "Assess", body: "We test your water and understand your usage and space." },
      { n: "02", title: "Recommend", body: "A tailored system and transparent quotation — no surprises." },
      { n: "03", title: "Install", body: "Professional installation and commissioning by trained technicians." },
      { n: "04", title: "Maintain", body: "Scheduled servicing and filter changes keep quality consistent." },
    ],
    related: ["air-conditioning", "maintenance-amc"],
  },
  {
    slug: "air-conditioning",
    icon: "wind",
    title: "Air Conditioning",
    h1: "Air Conditioning Services in Sri Lanka",
    tagline: "Efficient, reliable cooling for homes and businesses.",
    summary:
      "Installation, servicing, gas charging and repairs for split, inverter and commercial air conditioning — keeping systems efficient and bills low.",
    metaTitle: "AC Service, Repair & Installation in Sri Lanka",
    metaDescription:
      "Professional AC service, repair, installation and gas charging for split, inverter and commercial air conditioning across Sri Lanka. Fast response from TechNurture technicians.",
    keywords: [
      "AC service Sri Lanka",
      "AC repair Colombo",
      "air conditioning installation Sri Lanka",
      "AC gas charging",
      "commercial air conditioning service",
    ],
    image: "/products/dispenser-counter-angle.jpeg",
    intro: {
      heading: "Cooling that stays efficient — and stays working.",
      body: [
        "We install, service and repair split, inverter and commercial air conditioning systems for residential and commercial environments. Regular servicing improves efficiency, extends equipment life and keeps electricity bills in check.",
        "From a single home unit to large commercial systems across offices, healthcare and education facilities, our technicians diagnose and resolve issues efficiently — with emergency support when you need it most.",
      ],
      highlights: [
        "Split, inverter & commercial AC",
        "Gas charging & performance checks",
        "Residential & commercial",
        "Emergency repair support",
      ],
    },
    offerings: [
      {
        title: "Installation",
        body: "Professional installation and setup of split, inverter and commercial cooling systems.",
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
        title: "Repairs & Diagnostics",
        body: "Troubleshooting for weak cooling, strange sounds, blocked condensers and faulty components.",
      },
    ],
    steps: [
      { n: "01", title: "Inspect", body: "We evaluate your space, load and existing equipment." },
      { n: "02", title: "Quote", body: "A clear recommendation and transparent pricing for the right system." },
      { n: "03", title: "Install / Service", body: "Trained technicians install or service to manufacturer standards." },
      { n: "04", title: "Support", body: "Ongoing maintenance keeps cooling efficient and reliable." },
    ],
    related: ["water-purification", "maintenance-amc"],
  },
  {
    slug: "maintenance-amc",
    icon: "shield",
    title: "Maintenance & AMC",
    h1: "Annual Maintenance Contracts (AMC) in Sri Lanka",
    tagline: "Preventive care that turns surprise repairs into peace of mind.",
    summary:
      "Scheduled preventive maintenance and Annual Maintenance Contracts that reduce breakdowns, extend equipment life and cut long-term costs.",
    metaTitle: "Annual Maintenance Contract (AMC) Plans in Sri Lanka",
    metaDescription:
      "Comprehensive and non-comprehensive annual maintenance contracts (AMC) for water purifiers and air conditioning in Sri Lanka. Scheduled preventive visits, priority support and lower long-term costs.",
    keywords: [
      "annual maintenance contract Sri Lanka",
      "AMC plans water purifier",
      "AMC air conditioning",
      "preventive maintenance services",
      "equipment maintenance contract",
    ],
    image: "/products/dispenser-floor-front.jpeg",
    intro: {
      heading: "The cheapest repair is the one you never need.",
      body: [
        "Preventive maintenance is the key to maximizing performance, reducing downtime and extending the life of your equipment. Our Annual Maintenance Contracts make that preventive care automatic — with scheduled visits, servicing and priority support built in.",
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
      { n: "01", title: "Review", body: "We assess your equipment and how critical uptime is for you." },
      { n: "02", title: "Choose a plan", body: "Comprehensive, non-comprehensive or on-call — you decide the coverage." },
      { n: "03", title: "Schedule", body: "Preventive visits are planned in advance so you never think about it." },
      { n: "04", title: "Relax", body: "Fewer breakdowns, longer equipment life and predictable costs." },
    ],
    related: ["water-purification", "air-conditioning"],
  },
];

export function getService(slug: string) {
  return serviceCatalog.find((s) => s.slug === slug);
}

export const whyChoose = {
  eyebrow: "Why TechNurture",
  heading: "Reasons customers trust us",
  cards: [
    { title: "Experienced Technical Team", body: "Qualified technicians with extensive hands-on experience across water and cooling systems." },
    { title: "Fast Response", body: "Prompt support to minimize downtime and inconvenience for homes and businesses." },
    { title: "Preventive Maintenance", body: "Scheduled inspections that prevent costly, unexpected breakdowns before they happen." },
    { title: "Island-Wide Coverage", body: "Professional service wherever your home or business operates across Sri Lanka." },
    { title: "Genuine Parts", body: "Quality components and consumables for maximum reliability and performance." },
    { title: "Long-Term Partnership", body: "We measure success through retention and lasting customer relationships." },
  ],
};

export const process = {
  eyebrow: "How We Work",
  heading: "A simple, transparent service journey",
  steps: [
    { n: "01", title: "Contact our team", body: "Reach us by phone, WhatsApp or the website inquiry form to tell us what you need." },
    { n: "02", title: "Site inspection", body: "We assess your requirements, water quality and space on-site or remotely." },
    { n: "03", title: "Customized quotation", body: "Receive a clear, tailored solution and transparent pricing — no surprises." },
    { n: "04", title: "Professional installation", body: "Trained technicians install or service your system to manufacturer standards." },
    { n: "05", title: "Ongoing support", body: "Preventive maintenance and responsive support throughout the life of your equipment." },
  ],
};

export const productCategories = [
  {
    slug: "water-purifiers",
    title: "Water Purifiers",
    intro:
      "A range of domestic and commercial water purification systems designed to provide safe, clean, high-quality drinking water.",
    items: [
      "Domestic Water Purifiers",
      "Commercial Water Purifiers",
      "Reverse Osmosis (RO) Systems",
      "UV Water Purification Systems",
      "Multi-Stage Filtration Systems",
      "Customized Water Treatment Solutions",
    ],
  },
  {
    slug: "air-conditioning",
    title: "Air Conditioning Systems",
    intro:
      "Energy-efficient air conditioning solutions for residential, commercial and industrial applications.",
    items: [
      "Split Air Conditioners",
      "Inverter Air Conditioners",
      "Commercial Air Conditioning Systems",
      "Office Cooling Solutions",
      "Customized Cooling Systems",
    ],
  },
  {
    slug: "filters-consumables",
    title: "Genuine Filters & Consumables",
    intro:
      "Regular filter replacement is essential to maintain water quality, system efficiency and equipment lifespan.",
    items: [
      "Sediment Filters",
      "Carbon Filters",
      "RO Membranes",
      "UV Lamps",
      "Mineral Cartridges",
      "Specialized Filtration Media",
    ],
  },
  {
    slug: "spare-parts",
    title: "Spare Parts & Accessories",
    intro:
      "A wide range of quality spare parts and replacement components to ensure fast repairs and minimal downtime.",
    items: [
      "Water Purifier Pumps",
      "Pressure Switches",
      "Solenoid Valves",
      "Storage Tanks",
      "AC Capacitors & Fan Motors",
      "Sensors & Refrigeration Components",
    ],
  },
];

/* ---- Shop: real Lusako catalogue lives in lib/products.ts ---- */

/* ---- Blog: 5 posts (titles from the brief's SEO content list) ---- */
export const posts = [
  {
    slug: "how-often-should-a-water-purifier-be-serviced",
    title: "How Often Should a Water Purifier Be Serviced?",
    excerpt:
      "Service intervals, the warning signs to watch for, and how the right maintenance schedule protects your drinking water and your investment.",
    date: "2026-06-12",
    readTime: "5 min read",
    category: "Water Purification",
    image: "/blog/water-purifier-service.png",
    body: [
      "We recommend servicing your water purifier every 4 to 6 months, depending on water quality, usage and manufacturer recommendations. Regular maintenance ensures optimal performance and consistently safe drinking water.",
      "Common signs that your purifier needs attention include reduced water flow, an unusual taste or odour, leakage, unusual operating sounds, filter-replacement indicators lighting up, or a general drop in water quality. Any one of these is worth a quick inspection.",
      "During a service, genuine, high-quality filters and consumables are replaced to maintain efficiency and extend the life of your system. Sediment filters, carbon filters, RO membranes and UV lamps each have their own replacement rhythm.",
      "Our experienced technicians can inspect, repair and maintain most major brands and models — regardless of who originally installed the system. We can also arrange water-quality testing so you have hard data behind every recommendation.",
      "The simplest way to never miss a service is an Annual Maintenance Contract: scheduled inspections, filter replacements and priority technical support, all planned in advance so you never think about it.",
    ],
  },
  {
    slug: "signs-your-air-conditioner-needs-maintenance",
    title: "Signs Your Air Conditioner Needs Maintenance",
    excerpt:
      "Weak cooling, rising bills and strange sounds are your AC asking for help. Here's how to read the signals before a breakdown.",
    date: "2026-06-12",
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
    slug: "benefits-of-annual-maintenance-contracts",
    title: "The Benefits of Annual Maintenance Contracts",
    excerpt:
      "An AMC turns unpredictable repair bills into a planned, predictable cost — while keeping your equipment healthier for longer.",
    date: "2026-06-12",
    readTime: "6 min read",
    category: "Maintenance",
    image: "/blog/amc-benefits.png",
    body: [
      "Preventive maintenance is the key to maximizing equipment performance, reducing downtime and extending asset lifespan. An Annual Maintenance Contract (AMC) makes that preventive care automatic.",
      "A Comprehensive AMC is our most complete solution — scheduled preventive visits, routine servicing, labour, eligible spare-part replacement, breakdown support and priority technical assistance, all for one predictable annual cost.",
      "A Non-Comprehensive AMC is the economical option: professional servicing, inspections, labour and technical support, with replacement parts charged separately as needed.",
      "Prefer to pay only when something happens? On-Call Service gives you service visits on request, breakdown troubleshooting and inspections without a contract.",
      "Whichever you choose, the benefits are the same: fewer breakdowns, longer equipment life, lower long-term repair costs, better efficiency and priority support — in short, peace of mind.",
    ],
  },
  {
    slug: "how-to-improve-indoor-air-quality",
    title: "How to Improve Indoor Air Quality",
    excerpt:
      "Cleaner indoor air is part filtration, part airflow and part maintenance. A practical guide for homes and workplaces.",
    date: "2026-06-12",
    readTime: "5 min read",
    category: "Air Conditioning",
    image: "/blog/indoor-air-quality.png",
    body: [
      "Indoor air quality has a direct effect on comfort, focus and health. Much of it comes down to how well your air conditioning and ventilation systems are maintained.",
      "Start with the filters. Dirty AC filters restrict airflow and recirculate dust — cleaning or replacing them on schedule is the single highest-impact thing most people skip.",
      "Good airflow matters as much as filtration. Blocked condensers and poorly balanced systems leave stale pockets of air; a professional service rebalances and clears them.",
      "Pair well-maintained cooling with clean, purified water and you've covered the two essentials of a healthy indoor environment — which is exactly where a combined water-and-air service partner earns its keep.",
    ],
  },
  {
    slug: "why-preventive-maintenance-saves-money",
    title: "Why Preventive Maintenance Saves Money",
    excerpt:
      "The cheapest repair is the one you never need. Here's the simple economics behind preventive maintenance.",
    date: "2026-06-12",
    readTime: "4 min read",
    category: "Maintenance",
    image: "/blog/preventive-maintenance-savings.png",
    body: [
      "It's tempting to wait until something breaks. But reactive repairs are almost always more expensive, more disruptive and more urgent than planned maintenance — and they tend to arrive at the worst possible time.",
      "Preventive maintenance reduces unexpected breakdowns, extends equipment lifespan, improves operating efficiency and lowers long-term repair costs. For water and cooling systems it also protects water quality and cooling performance.",
      "There's a reliability dividend too: standardized procedures, trained technicians and continuous performance monitoring mean small issues are caught while they're still small and cheap.",
      "Across a fleet of systems — in a hospital, a bank branch network or a manufacturing facility — those savings compound quickly. That's why our customers measure value not at the point of purchase, but across years of dependable operation.",
    ],
  },
];

/* ---- FAQ (condensed from the brief) ---- */
export const faqs = [
  {
    q: "How often should a water purifier be serviced?",
    a: "Every 4 to 6 months depending on water quality, usage and manufacturer recommendations. Regular maintenance ensures optimal performance and safe drinking water.",
  },
  {
    q: "Can you service equipment installed by another company?",
    a: "Absolutely. Our experienced technicians can inspect, repair and maintain most major brands and models, regardless of the original installer.",
  },
  {
    q: "Do you provide island-wide service coverage?",
    a: "Yes. We provide installation, maintenance and technical support services across Sri Lanka.",
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
    body: "Professional installation is just the beginning. We provide ongoing maintenance, preventive care and responsive technical support for the life of your equipment.",
  },
  {
    title: "Reliable Service Delivery",
    body: "Standardized processes, trained technicians and performance-driven operations ensure consistent quality, reduced downtime and complete satisfaction.",
  },
];

export const servicePlans = {
  eyebrow: "AMC & Service Plans",
  heading: "Tailored care for your water & cooling systems",
  sub: "Keep your systems performing at their best with our flexible Annual Maintenance Contracts (AMC) and on-demand services.",
  plans: [
    {
      id: "comprehensive",
      name: "Comprehensive",
      badge: "MOST POPULAR",
      featured: true,
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
      badge: "",
      featured: false,
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

