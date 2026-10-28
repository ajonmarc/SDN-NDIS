import type { NavItem } from '@/types';
import {
    LayoutGrid,
    Users,
    MapPin,
    CalendarClock,
    ClipboardList,
    CreditCard,
    CloudSun,
} from '@lucide/vue';

export const pdrrmoNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/pdrrmo/dashboard',
        icon: LayoutGrid,
    },

    {
        title: 'User Management',
        href: '/pdrrmo/users',
        icon: Users,
        isActive: true,
        items: [
            {
                title: 'Users',
                href: '/pdrrmo/users',
                icon: Users,
            },
        ],

    },
];