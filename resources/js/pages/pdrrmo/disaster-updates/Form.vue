<script setup lang="ts">
import { Form, Link } from '@inertiajs/vue3';
import type { AcceptableValue } from 'reka-ui';
import { ref, watch } from 'vue';
import InputError from '@/components/InputError.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

type DisasterOption = { id: number; title: string };

type DisasterUpdateFormValues = {
    id?: number;
    disaster_id: number | string | null;
    message: string;
    published_at: string | null;
};

const props = defineProps<{
    disasters: DisasterOption[];
    disasterUpdate?: DisasterUpdateFormValues;
    submitAction: { url: string; method: 'post' | 'put' };
    submitLabel: string;
    cancelHref?: string;
    onCancel?: () => void;
}>();

const emit = defineEmits<{ success: [] }>();

const selectedDisasterId = ref<string | undefined>(
    props.disasterUpdate?.disaster_id
        ? String(props.disasterUpdate.disaster_id)
        : undefined
);

watch(
    () => props.disasterUpdate,
    (newUpdate) => {
        selectedDisasterId.value = newUpdate?.disaster_id
            ? String(newUpdate.disaster_id)
            : undefined;
    },
    { immediate: true }
);

const handleDisasterChange = (value: AcceptableValue) => {
    if (value === null || value === undefined) {
        selectedDisasterId.value = undefined;
    } else {
        selectedDisasterId.value = String(value);
    }
};
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
            <!-- Related Disaster -->
            <div class="grid gap-2">
                <Label for="disaster_id">Related Disaster</Label>
                <input
                    type="hidden"
                    name="disaster_id"
                    :value="selectedDisasterId"
                />
                <Select
                    :model-value="selectedDisasterId"
                    @update:model-value="handleDisasterChange"
                >
                    <SelectTrigger id="disaster_id" class="w-full">
                        <SelectValue placeholder="Select a disaster event" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem
                            v-for="disaster in disasters"
                            :key="disaster.id"
                            :value="disaster.id.toString()"
                        >
                            {{ disaster.title }}
                        </SelectItem>
                    </SelectContent>
                </Select>
                <InputError :message="errors.disaster_id" />
            </div>

            <!-- Published At -->
            <div class="grid gap-2">
                <Label for="published_at">
                    Publish Date & Time
                    <span class="text-muted-foreground">
                        (leave blank to use current date & time)
                    </span>
                </Label>
                <Input
                    id="published_at"
                    type="datetime-local"
                    name="published_at"
                    :default-value="disasterUpdate?.published_at ?? undefined"
                />
                <InputError :message="errors.published_at" />
            </div>

            <!-- Message / Advisory -->
            <div class="grid gap-2">
                <Label for="message">Advisory / Situation Message</Label>
                <Textarea
                    id="message"
                    name="message"
                    :default-value="disasterUpdate?.message ?? ''"
                    required
                    rows="5"
                    placeholder="Enter official situation report, public advisory, or evacuation instructions..."
                />
                <InputError :message="errors.message" />
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

