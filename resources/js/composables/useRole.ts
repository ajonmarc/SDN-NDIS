import { usePage } from '@inertiajs/vue3';
import { computed } from 'vue';

interface User {
    id: number;
    name: string;
    email: string;
    role?: { id: number; name: string } | null;
}

export function useRole() {
    const page = usePage();

    const user = computed(() => page.props.auth?.user as User | undefined);
    const roleName = computed(() => user.value?.role?.name ?? null);

    const isPdrrmo = computed(() => roleName.value === 'PDRRMO');
    const isGuest = computed(() => roleName.value === 'GUEST');

    const hasRole = (...roles: string[]) =>
        roleName.value !== null && roles.includes(roleName.value);

    return { user, roleName, isPdrrmo, isGuest, hasRole };
}
