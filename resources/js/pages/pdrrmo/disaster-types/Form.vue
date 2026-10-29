<script setup lang="ts">
import { Form, Link } from '@inertiajs/vue3';
import InputError from '@/components/InputError.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

type DisasterTypeFormValues = {
    id?: number;
    type_name: string;
    description: string | null;
};

defineProps<{
    disasterType?: DisasterTypeFormValues;
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
                <Label for="type_name">Disaster Type Name</Label>
                <Input
                    id="type_name"
                    name="type_name"
                    :default-value="disasterType?.type_name"
                    required
                    placeholder="e.g. Typhoon, Flood, Earthquake, Landslide"
                />
                <InputError :message="errors.type_name" />
            </div>

            <div class="grid gap-2">
                <Label for="description">
                    Description
                    <span class="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                    id="description"
                    name="description"
                    :default-value="disasterType?.description ?? ''"
                    rows="4"
                    placeholder="Provide a brief description of this disaster classification..."
                />
                <InputError :message="errors.description" />
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

