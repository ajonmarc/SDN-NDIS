<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import Heading from '@/components/Heading.vue';

defineOptions({
    layout: {
        breadcrumbs: [
            {
                href: '/pdrrmo/dashboard',
                title: 'Dashboard',
            },
        ],
    },
});
</script>

<template>
    <Head title="PDRRMO Dashboard" />
    <div class="px-4 py-6">
        <Heading
            title="PDRRMO Dashboard"
            description="Overview of Surigao del Norte disaster monitoring, evacuation centers, and emergency updates"
        />
    </div>
</template>
