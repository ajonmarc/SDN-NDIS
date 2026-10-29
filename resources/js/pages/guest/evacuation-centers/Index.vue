<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import Heading from '@/components/Heading.vue';

defineOptions({
    layout: {
        breadcrumbs: [
            {
                href: '/guest/evacuation-centers',
                title: 'Evacuation Centers',
            },
        ],
    },
});
</script>

<template>
    <Head title="Evacuation Centers" />
    <div class="px-4 py-6">
        <Heading
            title="Evacuation Centers"
            description="Browse evacuation center locations, addresses, photos, capacity, current occupancy, and operational status"
        />
    </div>
</template>

