<script setup lang="ts">
import { Form, Link } from '@inertiajs/vue3';
import InputError from '@/components/InputError.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type MunicipalityFormValues = {
    id?: number;
    municipality_name: string;
};

defineProps<{
    municipality?: MunicipalityFormValues;
    submitAction: { url: string; method: 'post' | 'put' };
    submitLabel: string;
    cancelHref?: string;
    onCancel?: () => void;
}>();

const emit = defineEmits<{ success: [] }>();
</script>

<template>
    <Form
        :action="submitAction.url"
        :method="submitAction.method"
        class="flex flex-col gap-6"
        v-slot="{ errors, processing }"
        @success="emit('success')"
    >
        <div class="grid grid-cols-1 gap-6">
            <div class="grid gap-2">
                <Label for="municipality_name">Municipality / City Name</Label>
                <Input
                    id="municipality_name"
                    name="municipality_name"
                    :default-value="municipality?.municipality_name"
                    required
                    placeholder="e.g. Surigao City, Dapa, General Luna"
                />
                <InputError :message="errors.municipality_name" />
            </div>
        </div>

        <div class="flex items-center justify-end gap-3">
            <Button
                v-if="cancelHref"
                as-child
                variant="outline"
                type="button"
                :disabled="processing"
            >
                <Link :href="cancelHref">Cancel</Link>
            </Button>
            <Button
                v-else-if="onCancel"
                variant="outline"
                type="button"
                :disabled="processing"
                @click="onCancel"
            >
                Cancel
            </Button>

            <Button type="submit" :disabled="processing">
                <Spinner v-if="processing" />
                {{ submitLabel }}
            </Button>
        </div>
    </Form>
</template>

