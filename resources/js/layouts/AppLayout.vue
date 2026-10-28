<script setup lang="ts">
import { computed } from 'vue';
import AppSidebarLayout from '@/layouts/app/AppSidebarLayout.vue';
import AppHeaderLayout from '@/layouts/app/AppHeaderLayout.vue';
import { useRole } from '@/composables/useRole';
import type { BreadcrumbItem } from '@/types';

const { breadcrumbs = [] } = defineProps<{
    breadcrumbs?: BreadcrumbItem[];
}>();

const { isGuest } = useRole();

const layoutComponent = computed(() => (isGuest.value ? AppHeaderLayout : AppSidebarLayout));
</script>

<template>
    <component :is="layoutComponent" :breadcrumbs="breadcrumbs">
        <slot />
    </component>
</template>