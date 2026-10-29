import type { NavItem } from '@/types';
import {
    LayoutGrid,
    Users,
    ClipboardList,
} from '@lucide/vue';

export const headNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/head/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'User Management',
        href: '/head/users',
        icon: Users,
        isActive: true,
        items: [
            {
                title: 'Users',
                href: '/head/users',
                icon: Users,
            },
        ],
    },
    {
        title: 'Documentation',
        href: '/head/documentation',
        icon: ClipboardList,
    },
];
