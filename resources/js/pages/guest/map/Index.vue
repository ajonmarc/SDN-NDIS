<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import Heading from '@/components/Heading.vue';

defineOptions({
    layout: {
        breadcrumbs: [
            {
                href: '/guest/map',
                title: 'Disaster Map',
            },
        ],
    },
});
</script>

<template>
    <Head title="Disaster Map" />
    <div class="px-4 py-6">
        <Heading
            title="Disaster & Evacuation Map"
            description="Interactive map of Surigao del Norte showing active disaster locations and evacuation center markers"
        />
    </div>
</template>

