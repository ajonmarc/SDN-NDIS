<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import Heading from '@/components/Heading.vue';

defineOptions({
    layout: {
        breadcrumbs: [
            {
                href: '/pdrrmo/evacuation-centers',
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
            description="Manage evacuation centers, facility images, map coordinates, capacity, current occupancy, and status"
        />
    </div>
</template>

