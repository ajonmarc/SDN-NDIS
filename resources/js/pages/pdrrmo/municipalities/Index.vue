<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import Heading from '@/components/Heading.vue';

defineOptions({
    layout: {
        breadcrumbs: [
            {
                href: '/pdrrmo/municipalities',
                title: 'Municipalities',
            },
        ],
    },
});
</script>

<template>
    <Head title="Municipalities" />
    <div class="px-4 py-6">
        <Heading
            title="Municipalities"
            description="Manage municipalities across Surigao del Norte for disaster and evacuation center assignment"
        />
    </div>
</template>

