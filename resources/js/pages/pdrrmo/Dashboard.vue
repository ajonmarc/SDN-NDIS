<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import Heading from '@/components/Heading.vue';
import { dashboard } from '@/routes/pdrrmo';

defineOptions({
    layout: {
        breadcrumbs: [
            {
                href: dashboard(),
                title: 'Dashboard',
            },
        ],
    },
});
</script>

<template>

    <Head title="Dashboard" />
    <div class="px-4 py-6">
        <Heading title="pdrrmo Dashboard" description="manage your pdrrmo dashboard" />

        <div class="mt-6 max-w-2xl">
            <section class="space-y-12">
                main content
            </section>
        </div>
    </div>
</template>
