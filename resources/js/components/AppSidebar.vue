<script setup lang="ts">
import { Link, router } from '@inertiajs/vue3';
import { LogOut } from '@lucide/vue';
import { computed } from 'vue';

import AppLogo from '@/components/AppLogo.vue';
import NavMain from '@/components/NavMain.vue';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';

import { logout } from '@/routes';
import { useRole } from '@/composables/useRole';

import {
    superadminNavItems,
    pdrrmoNavItems,
    guestNavItems,
} from '@/navigation';

const { isSuperadmin, isPdrrmo, isGuest } = useRole();

const homeHref = computed(() => {
    if (isSuperadmin.value) return '/superadmin/dashboard';
    if (isPdrrmo.value) return '/pdrrmo/dashboard';
    if (isGuest.value) return '/guest/dashboard';

    return '/';
});

const handleLogout = () => {
    router.flushAll();
};

</script>

<template>
    <Sidebar collapsible="offcanvas" variant="sidebar">
        <SidebarHeader>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton size="lg" as-child>
                        <Link :href="homeHref">
                            <AppLogo />
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
   
            <template v-if="isSuperadmin">
                <NavMain label="Super Admin" :items="superadminNavItems" />
                <NavMain label="PDRRMO" :items="pdrrmoNavItems" />
                <NavMain label="Guest" :items="guestNavItems" />
            </template>

      
            <template v-else-if="isPdrrmo">
                <NavMain label="PDRRMO" :items="pdrrmoNavItems" />
            </template>

        
            <template v-else-if="isGuest">
                <NavMain label="Guest" :items="guestNavItems" />
            </template>
        </SidebarContent>

        <SidebarFooter>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton as-child>
                        <Link class="block w-full cursor-pointer" :href="logout()" @click="handleLogout" as="button"
                            data-test="logout-button">
                            <LogOut class="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
    </Sidebar>
    <slot />
</template>