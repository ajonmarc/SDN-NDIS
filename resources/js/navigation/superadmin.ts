import type { NavItem } from '@/types';
import {
    LayoutGrid,
    BookOpenText,
} from '@lucide/vue';

export const superadminNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/superadmin/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Documentation',
        href: '/superadmin/documentation',
        icon: BookOpenText,
    },
];