<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import Heading from '@/components/Heading.vue';

defineOptions({
    layout: {
        breadcrumbs: [
            {
                href: '/pdrrmo/disaster-types',
                title: 'Disaster Types',
            },
        ],
    },
});
</script>

<template>
    <Head title="Disaster Types" />
    <div class="px-4 py-6">
        <Heading
            title="Disaster Types"
            description="Manage classifications and descriptions of natural disasters"
        />
    </div>
</template>

