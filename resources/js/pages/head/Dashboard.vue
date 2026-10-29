<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import Heading from '@/components/Heading.vue';
import { dashboard } from '@/routes/head';

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
    <Head title="Head Dashboard" />
    <div class="px-4 py-6">
        <Heading title="Head Dashboard" description="Manage your Head dashboard and system administration" />

        <div class="mt-6 max-w-2xl">
            <section class="space-y-12">
                main content
            </section>
        </div>
    </div>
</template>

