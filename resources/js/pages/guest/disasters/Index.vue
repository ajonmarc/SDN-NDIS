<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import Heading from '@/components/Heading.vue';

defineOptions({
    layout: {
        breadcrumbs: [
            {
                href: '/guest/disasters',
                title: 'Disasters & Updates',
            },
        ],
    },
});
</script>

<template>
    <Head title="Disasters & Updates" />
    <div class="px-4 py-6">
        <Heading
            title="Disasters & Updates"
            description="View reported natural disasters, severity details, and published advisories across Surigao del Norte"
        />
    </div>
</template>

