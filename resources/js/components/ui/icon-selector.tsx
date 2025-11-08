/**
 * Icon Selector Component
 * Maps icon names to lucide-react SVG icons
 */

import React from 'react';
import {
  Activity,
  UtensilsCrossed,
  Building2,
  Bus,
  Moon,
  Package,
  Target,
  Camera,
  Mountain,
  Waves,
  Palette,
  Plane,
  Car,
  Hotel,
  Coffee,
  Bed,
  MapPin,
  Footprints,
  Eye,
  Clock,
  Calendar,
  Image,
  Music,
  Gamepad2,
  BookOpen,
  ShoppingBag,
  Heart,
  Star,
  Zap,
  Flame,
} from 'lucide-react';

export type IconName = 
  | 'activity'
  | 'utensils'
  | 'building'
  | 'bus'
  | 'moon'
  | 'package'
  | 'target'
  | 'camera'
  | 'mountain'
  | 'waves'
  | 'palette'
  | 'plane'
  | 'car'
  | 'hotel'
  | 'coffee'
  | 'bed'
  | 'map-pin'
  | 'footprints'
  | 'eye'
  | 'clock'
  | 'calendar'
  | 'image'
  | 'music'
  | 'gamepad'
  | 'book'
  | 'shopping'
  | 'heart'
  | 'star'
  | 'zap'
  | 'flame';

const iconMap: Record<IconName, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  'activity': Activity,
  'utensils': UtensilsCrossed,
  'building': Building2,
  'bus': Bus,
  'moon': Moon,
  'package': Package,
  'target': Target,
  'camera': Camera,
  'mountain': Mountain,
  'waves': Waves,
  'palette': Palette,
  'plane': Plane,
  'car': Car,
  'hotel': Hotel,
  'coffee': Coffee,
  'bed': Bed,
  'map-pin': MapPin,
  'footprints': Footprints,
  'eye': Eye,
  'clock': Clock,
  'calendar': Calendar,
  'image': Image,
  'music': Music,
  'gamepad': Gamepad2,
  'book': BookOpen,
  'shopping': ShoppingBag,
  'heart': Heart,
  'star': Star,
  'zap': Zap,
  'flame': Flame,
};

interface IconSelectorProps {
  iconName: IconName | string;
  className?: string;
  size?: number;
}

export const IconSelector: React.FC<IconSelectorProps> = ({ 
  iconName, 
  className = 'w-5 h-5',
  size 
}: IconSelectorProps) => {
  const IconComponent = iconMap[iconName as IconName] || Package;
  const sizeProps = size ? { width: size, height: size } : {};
  
  return <IconComponent className={className} {...sizeProps} />;
};

export const availableIcons: Array<{ name: IconName; label: string; component: React.ComponentType<React.SVGProps<SVGSVGElement>> }> = [
  { name: 'activity', label: 'Activity', component: Activity },
  { name: 'utensils', label: 'Meal', component: UtensilsCrossed },
  { name: 'building', label: 'Building', component: Building2 },
  { name: 'bus', label: 'Bus', component: Bus },
  { name: 'plane', label: 'Plane', component: Plane },
  { name: 'car', label: 'Car', component: Car },
  { name: 'hotel', label: 'Hotel', component: Hotel },
  { name: 'moon', label: 'Rest', component: Moon },
  { name: 'bed', label: 'Bed', component: Bed },
  { name: 'coffee', label: 'Coffee', component: Coffee },
  { name: 'package', label: 'Package', component: Package },
  { name: 'target', label: 'Target', component: Target },
  { name: 'camera', label: 'Camera', component: Camera },
  { name: 'mountain', label: 'Mountain', component: Mountain },
  { name: 'waves', label: 'Waves', component: Waves },
  { name: 'palette', label: 'Palette', component: Palette },
  { name: 'map-pin', label: 'Location', component: MapPin },
  { name: 'footprints', label: 'Hiking', component: Footprints },
  { name: 'eye', label: 'Sightseeing', component: Eye },
  { name: 'clock', label: 'Time', component: Clock },
  { name: 'calendar', label: 'Calendar', component: Calendar },
  { name: 'image', label: 'Image', component: Image },
  { name: 'music', label: 'Music', component: Music },
  { name: 'gamepad', label: 'Entertainment', component: Gamepad2 },
  { name: 'book', label: 'Education', component: BookOpen },
  { name: 'shopping', label: 'Shopping', component: ShoppingBag },
  { name: 'heart', label: 'Wellness', component: Heart },
  { name: 'star', label: 'Featured', component: Star },
  { name: 'zap', label: 'Energy', component: Zap },
  { name: 'flame', label: 'Adventure', component: Flame },
];

export default IconSelector;

