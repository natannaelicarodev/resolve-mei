import {
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Briefcase,
  Calendar,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleMinus,
  CirclePlus,
  CircleX,
  Clock,
  Copy,
  Download,
  Eye,
  FileText,
  Filter,
  GripVertical,
  Mail,
  MessageCircle,
  Info,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Share2,
  Link2,
  Link2Off,
  RefreshCw,
  Settings,
  Star,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  UserPlus,
  Users,
  Wallet,
  X,
} from 'lucide-react-native';
import type { ColorToken } from '@/theme';
import { sizes, useTheme } from '@/theme';

// One catalog, one stroke weight, one size scale. Screens name an icon by its
// role in the product, so swapping the underlying glyph never touches a screen.
const icons = {
  // Domain objects
  client: Users,
  clientAdd: UserPlus,
  profile: User,
  service: Briefcase,
  quote: FileText,
  money: Wallet,
  // Interface actions
  search: Search,
  filter: Filter,
  edit: Pencil,
  delete: Trash2,
  add: Plus,
  addCircle: CirclePlus,
  duplicate: Copy,
  download: Download,
  preview: Eye,
  share: Share2,
  link: Link2,
  unlink: Link2Off,
  copy: Copy,
  refresh: RefreshCw,
  settings: Settings,
  close: X,
  // Navigation
  back: ArrowLeft,
  forward: ChevronRight,
  expand: ChevronDown,
  // Status and data
  alert: CircleAlert,
  success: CircleCheck,
  statusNeutral: CircleMinus,
  statusInfo: Info,
  statusDanger: CircleX,
  trendUp: TrendingUp,
  trendDown: TrendingDown,
  date: Calendar,
  duration: Clock,
  // Contact
  phone: Phone,
  email: Mail,
  whatsapp: MessageCircle,
  // Tactile organization
  favorite: Star,
  archive: Archive,
  restore: RotateCcw,
  reorder: GripVertical,
  moveUp: ArrowUp,
  moveDown: ArrowDown,
} as const;

export type IconName = keyof typeof icons;
export type IconSize = 'small' | 'medium' | 'large';

const iconSizes: Record<IconSize, number> = {
  small: sizes.iconSmall,
  medium: sizes.iconMedium,
  large: sizes.iconLarge,
};

export interface IconProps {
  name: IconName;
  size?: IconSize;
  color?: ColorToken;
  /** Overrides the token colour when a raw value is unavoidable. */
  rawColor?: string;
}

export function Icon({
  name,
  size = 'medium',
  color = 'textPrimary',
  rawColor,
}: IconProps) {
  const { colors } = useTheme();
  const Glyph = icons[name];
  return (
    <Glyph
      color={rawColor ?? colors[color]}
      size={iconSizes[size]}
      strokeWidth={1.75}
    />
  );
}

export const iconNames = Object.keys(icons) as IconName[];
