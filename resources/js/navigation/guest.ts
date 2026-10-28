import type { NavItem } from '@/types';
import {
    LayoutGrid,
    Sailboat,
    ClipboardList,
} from '@lucide/vue';

export const guestNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/guest/dashboard',
        icon: LayoutGrid,
    },
];