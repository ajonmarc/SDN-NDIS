<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import Heading from '@/components/Heading.vue';

defineOptions({
    layout: {
        breadcrumbs: [
            {
                href: '/pdrrmo/disasters',
                title: 'Disasters',
            },
        ],
    },
});
</script>

<template>
    <Head title="Disasters" />
    <div class="px-4 py-6">
        <Heading
            title="Disasters"
            description="Manage disaster records, severity levels, statuses, and map coordinates (latitude and longitude)"
        />
    </div>
</template>

