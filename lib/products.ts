/* ============================================================
   Lusako Inline Water Purifiers — real catalogue data.
   Source: Direct Sales spec sheets (public/products/specs/*.pdf).
   Each product family ships in two models: a UF filtration unit
   for city water and an RO unit for city & well water.
   ============================================================ */

export type ProductVariant = {
  model: string;
  filtration: "UF" | "RO";
  filterStages: string;
  recommendedFor: string;
  price: number; // LKR
  plusVat: boolean;
};

export type Product = {
  slug: string;
  name: string;
  series: string;
  form: "Floor-standing" | "Countertop";
  category: string;
  blurb: string;
  images: [string, string];
  pdf: string;
  tags: string[];
  features: { title: string; body: string }[];
  specs: [string, string][];
  variants: [ProductVariant, ProductVariant];
};

const sharedFeatures = [
  {
    title: "Unique & Sleek Design",
    body: "Modern, space-saving design that fits any environment — home, office or commercial space.",
  },
  {
    title: "Three Faucets",
    body: "Instant access to hot, normal and cool purified water from three dedicated faucets.",
  },
  {
    title: "Hot & Cool Control",
    body: "Independent on/off switches for heating and cooling deliver real energy efficiency.",
  },
];

const sharedSpecs: [string, string][] = [
  ["Rated Voltage / Frequency", "220–240V / 50–60Hz"],
  ["Faucets", "3 Faucets (Hot / Normal / Cool)"],
  ["Heating Power", "420W"],
  ["Cooling Power", "90W"],
  ["Water Tank Material", "SS 304 (Stainless Steel)"],
  ["Refrigerant", "R600a"],
  ["Heating Temperature", "85°C – 95°C · 5L/h"],
  ["Cooling Temperature", "6°C – 10°C · 2L/h"],
  ["Available Colours", "Dual-Tone Look"],
];

export const purchaseTerms = {
  installation: "Installation free up to 5m; additional length subject to charges.",
  delivery: "Colombo & Suburbs — free of charge. Other areas — additional charges apply.",
  warranty: "2-year warranty with 3 free preventive services.",
  afterSales:
    "After the warranty period, continue our care with an AMC (Annual Maintenance Contract) plan that suits your needs.",
};

export const products: Product[] = [
  {
    slug: "w2904-series",
    name: "Lusako W2904 Inline Purifier",
    series: "W2904-3F / W2904-3R",
    form: "Floor-standing",
    category: "Floor-standing · Hot / Normal / Cool",
    blurb:
      "A sleek floor-standing inline purifier with three faucets and independent hot & cool control — ideal for homes, offices and high-traffic spaces.",
    images: ["/products/w2904-3f-1.jpg", "/products/w2904-3f-2.jpg"],
    pdf: "/products/specs/w2904-series.pdf",
    tags: ["3 Faucets", "Hot & Cool", "Floor-standing"],
    features: sharedFeatures,
    specs: [
      ...sharedSpecs,
      ["Hot Tank Capacity", "1.5 Liters"],
      ["Cold Tank Capacity", "3.2 Liters"],
      ["Product Dimensions", "330 × 505 × 1140 mm"],
    ],
    variants: [
      {
        model: "W2904-3F",
        filtration: "UF",
        filterStages: "Sediment / Pre-carbon / UF / Post-carbon",
        recommendedFor: "City Water",
        price: 97500,
        plusVat: false,
      },
      {
        model: "W2904-3R",
        filtration: "RO",
        filterStages: "Sediment / Pre-carbon / RO / Post-carbon",
        recommendedFor: "City & Well Water",
        price: 116500,
        plusVat: false,
      },
    ],
  },
  {
    slug: "w2905-c-series",
    name: "Lusako W2905-C Countertop Purifier",
    series: "W2905-3CF / W2905-3CR",
    form: "Countertop",
    category: "Countertop · Hot / Normal / Cool",
    blurb:
      "The compact countertop edition — the same three-faucet purification and hot & cool control in a space-saving counter-top format for pantries and small offices.",
    images: ["/products/w2905-3cf-1.jpg", "/products/w2905-3cf-2.jpg"],
    pdf: "/products/specs/w2905-c-series.pdf",
    tags: ["Compact", "3 Faucets", "Countertop"],
    features: [
      {
        title: "Counter-Top Design",
        body: "Modern, space-saving counter-top design that fits any environment without taking floor space.",
      },
      ...sharedFeatures.slice(1),
    ],
    specs: [
      ...sharedSpecs,
      ["Hot Tank Capacity", "1.5 Liters"],
      ["Cold Tank Capacity", "3.2 Liters"],
      ["Product Dimensions", "290 × 445 × 520 mm"],
    ],
    variants: [
      {
        model: "W2905-3CF",
        filtration: "UF",
        filterStages: "Sediment / Pre-carbon / UF / Post-carbon",
        recommendedFor: "City Water",
        price: 89500,
        plusVat: true,
      },
      {
        model: "W2905-3CR",
        filtration: "RO",
        filterStages: "Sediment / Pre-carbon / RO / Post-carbon",
        recommendedFor: "City & Well Water",
        price: 99500,
        plusVat: true,
      },
    ],
  },
  {
    slug: "w2905-series",
    name: "Lusako W2905 Inline Purifier",
    series: "W2905-3F / W2905-3R",
    form: "Floor-standing",
    category: "Floor-standing · Large 5L hot tank",
    blurb:
      "The high-capacity floor-standing model with a 5-liter hot tank — built for spaces where hot water demand runs high, from offices to clinics.",
    images: ["/products/w2905-3f-1.jpg", "/products/w2905-3f-2.jpg"],
    pdf: "/products/specs/w2905-series.pdf",
    tags: ["5L Hot Tank", "3 Faucets", "Floor-standing"],
    features: sharedFeatures,
    specs: [
      ...sharedSpecs,
      ["Hot Tank Capacity", "5 Liters"],
      ["Cold Tank Capacity", "2 Liters"],
      ["Product Dimensions", "330 × 505 × 1140 mm"],
    ],
    variants: [
      {
        model: "W2905-3F",
        filtration: "UF",
        filterStages: "Sediment / Pre-carbon / UF / Post-carbon",
        recommendedFor: "City Water",
        price: 97500,
        plusVat: true,
      },
      {
        model: "W2905-3R",
        filtration: "RO",
        filterStages: "Sediment / Pre-carbon / RO / Post-carbon",
        recommendedFor: "City & Well Water",
        price: 116500,
        plusVat: true,
      },
    ],
  },
];

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getVariant(slug: string, model: string) {
  const product = getProduct(slug);
  return product?.variants.find((v) => v.model === model);
}

export function formatLKR(amount: number) {
  return `Rs ${amount.toLocaleString("en-LK")}`;
}
