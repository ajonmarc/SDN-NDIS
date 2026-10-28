<script setup lang="ts">
import { usePage } from '@inertiajs/vue3';
import AppLogoIcon from '@/components/AppLogoIcon.vue';

const name = usePage().props.name;
</script>

<template>
    <div
        class="flex aspect-square size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-transparent"
    >
        <AppLogoIcon class="size-9 rounded-full object-contain" />
    </div>
    <div class="ml-1.5 grid flex-1 text-left text-sm leading-tight">
        <span class="truncate font-bold tracking-tight">
            {{ name && name !== 'Laravel' ? name : 'SDN-NDIS' }}
        </span>
        <span class="truncate text-[11px] font-medium text-muted-foreground">
            Surigao del Norte PDRRMO
        </span>
    </div>
</template>
