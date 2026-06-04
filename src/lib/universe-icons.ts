import {
  Home,
  Music,
  Gamepad2,
  Cat,
  Dog,
  Shirt,
  Sparkles,
  Heart,
  Sprout,
  Coffee,
  Gift,
  BookOpen,
  Camera,
  Palette,
  Star,
  Tv,
  Headphones,
  Flame,
  Gem,
  Rocket,
  Smile,
  Trophy,
  Film,
  Bike,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface UniverseIconOption {
  name: string;
  label: string;
  Icon: LucideIcon;
}

export const UNIVERSE_ICONS: UniverseIconOption[] = [
  { name: 'home', label: 'Hogar', Icon: Home },
  { name: 'music', label: 'Música', Icon: Music },
  { name: 'gamepad', label: 'Gamer', Icon: Gamepad2 },
  { name: 'cat', label: 'Gato', Icon: Cat },
  { name: 'dog', label: 'Perro', Icon: Dog },
  { name: 'shirt', label: 'Moda', Icon: Shirt },
  { name: 'sparkles', label: 'Brillo', Icon: Sparkles },
  { name: 'heart', label: 'Corazón', Icon: Heart },
  { name: 'sprout', label: 'Plantas', Icon: Sprout },
  { name: 'coffee', label: 'Café', Icon: Coffee },
  { name: 'gift', label: 'Regalo', Icon: Gift },
  { name: 'book', label: 'Libro', Icon: BookOpen },
  { name: 'camera', label: 'Foto', Icon: Camera },
  { name: 'palette', label: 'Arte', Icon: Palette },
  { name: 'star', label: 'Estrella', Icon: Star },
  { name: 'tv', label: 'TV', Icon: Tv },
  { name: 'headphones', label: 'Audio', Icon: Headphones },
  { name: 'flame', label: 'Fuego', Icon: Flame },
  { name: 'gem', label: 'Joya', Icon: Gem },
  { name: 'rocket', label: 'Cohete', Icon: Rocket },
  { name: 'smile', label: 'Sonrisa', Icon: Smile },
  { name: 'trophy', label: 'Trofeo', Icon: Trophy },
  { name: 'film', label: 'Cine', Icon: Film },
  { name: 'bike', label: 'Deporte', Icon: Bike },
];

export function getUniverseIcon(name?: string | null): LucideIcon | null {
  if (!name) return null;
  return UNIVERSE_ICONS.find((i) => i.name === name)?.Icon ?? null;
}
