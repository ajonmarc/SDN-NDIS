<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import Heading from '@/components/Heading.vue';

defineOptions({
    layout: {
        breadcrumbs: [
            {
                href: '/guest/dashboard',
                title: 'Dashboard',
            },
        ],
    },
});
</script>

<template>
    <Head title="Guest Dashboard" />
    <div class="px-4 py-6">
        <Heading
            title="Guest Dashboard"
            description="Public overview of Surigao del Norte natural disaster alerts and evacuation center availability"
        />
    </div>
</template>
