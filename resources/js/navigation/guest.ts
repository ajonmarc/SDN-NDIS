import type { NavItem } from '@/types';
import {
    AlertTriangle,
    Building2,
    LayoutGrid,
    Map,
} from '@lucide/vue';

export const guestNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/guest/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Disaster Map',
        href: '/guest/map',
        icon: Map,
    },
    {
        title: 'Disasters & Updates',
        href: '/guest/disasters',
        icon: AlertTriangle,
    },
    {
        title: 'Evacuation Centers',
        href: '/guest/evacuation-centers',
        icon: Building2,
    },
];
