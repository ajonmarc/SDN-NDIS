<script setup lang="ts">
import type { HTMLAttributes } from 'vue';

defineOptions({
    inheritAttrs: false,
});

type Props = {
    className?: HTMLAttributes['class'];
};

defineProps<Props>();
</script>

<template>
    <img
        src="/logo.png"
        alt="Surigao del Norte Natural Disaster Information System Logo"
        :class="['object-contain select-none', className]"
        v-bind="$attrs"
    />
</template>
