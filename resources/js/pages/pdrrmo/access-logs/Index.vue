<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import Heading from '@/components/Heading.vue';

defineOptions({
    layout: {
        breadcrumbs: [
            {
                href: '/pdrrmo/access-logs',
                title: 'Access Logs',
            },
        ],
    },
});
</script>

<template>
    <Head title="Access Logs" />
    <div class="px-4 py-6">
        <Heading
            title="Access Logs"
            description="Monitor user login, logout, and guest visit activity across the system"
        />
    </div>
</template>

