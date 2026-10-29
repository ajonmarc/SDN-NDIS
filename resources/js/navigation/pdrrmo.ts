import type { NavItem } from '@/types';
import {
    AlertTriangle,
    Building2,
    History,
    LayoutGrid,
    MapPin,
    Megaphone,
    Tags,
} from '@lucide/vue';

export const pdrrmoNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/pdrrmo/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Municipalities',
        href: '/pdrrmo/municipalities',
        icon: MapPin,
    },
    {
        title: 'Disaster Types',
        href: '/pdrrmo/disaster-types',
        icon: Tags,
    },
    {
        title: 'Disasters',
        href: '/pdrrmo/disasters',
        icon: AlertTriangle,
    },
    {
        title: 'Disaster Updates',
        href: '/pdrrmo/disaster-updates',
        icon: Megaphone,
    },
    {
        title: 'Evacuation Centers',
        href: '/pdrrmo/evacuation-centers',
        icon: Building2,
    },
    {
        title: 'Access Logs',
        href: '/pdrrmo/access-logs',
        icon: History,
    },
];
