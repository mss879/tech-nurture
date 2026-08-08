import {
  AirVent,
  Droplets,
  GlassWater,
  Refrigerator,
  WashingMachine,
  Wrench,
} from "lucide-react";

/* One icon map for every surface that renders a service (the homepage
   cards, /services, /services/[slug] and the footer). These used to be
   duplicated in three files and had already drifted; a missing key falls
   back to the wrench with no build error, so a silent wrong glyph is the
   failure mode worth avoiding. Keys match `icon` in serviceCatalog and
   services.cards in lib/site.ts. */
export const serviceIcons: Record<string, React.ElementType> = {
  air: AirVent,
  fridge: Refrigerator,
  water: Droplets,
  dispenser: GlassWater,
  washer: WashingMachine,
  wrench: Wrench,
};

export function serviceIcon(key: string): React.ElementType {
  return serviceIcons[key] ?? Wrench;
}
