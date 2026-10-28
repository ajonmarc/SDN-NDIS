<script setup lang="ts">
import { Moon, Sun } from '@lucide/vue';
import { computed } from 'vue';
import { Button } from '@/components/ui/button';
import { useAppearance } from '@/composables/useAppearance';

const { appearance, updateAppearance } = useAppearance();

const isDark = computed(() => appearance.value === 'dark');

const toggle = () => {
    updateAppearance(isDark.value ? 'light' : 'dark');
};
</script>

<template>
    <Button
        variant="ghost"
        size="icon"
        class="h-9 w-9 rounded-full"
        @click="toggle"
    >
        <Sun v-if="isDark" class="h-4 w-4" />
        <Moon v-else class="h-4 w-4" />
    </Button>
</template>