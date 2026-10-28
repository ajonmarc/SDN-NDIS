<script setup lang="ts">
import Heading from '@/components/Heading.vue';
</script>

<template>
    <div class="px-4 py-6">
        <Heading
            title="Settings"
            description="Manage your profile and account settings"
        />

        <div class="mt-6 max-w-2xl">
            <section class="space-y-12">
                <slot />
            </section>
        </div>
    </div>
</template>