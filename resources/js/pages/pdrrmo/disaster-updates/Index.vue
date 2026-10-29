<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import Heading from '@/components/Heading.vue';

defineOptions({
    layout: {
        breadcrumbs: [
            {
                href: '/pdrrmo/disaster-updates',
                title: 'Disaster Updates',
            },
        ],
    },
});
</script>

<template>
    <Head title="Disaster Updates" />
    <div class="px-4 py-6">
        <Heading
            title="Disaster Updates"
            description="Publish and manage real-time advisories and status updates for active disasters"
        />
    </div>
</template>

