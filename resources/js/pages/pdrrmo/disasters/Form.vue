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

type MunicipalityOption = { id: number; municipality_name: string };
type DisasterTypeOption = { id: number; type_name: string };

type DisasterFormValues = {
    id?: number;
    title: string;
    description: string | null;
    municipality_id: number | string | null;
    disaster_type_id: number | string | null;
    latitude: number | string | null;
    longitude: number | string | null;
    occurred_at: string | null;
    severity: string;
    status: string;
};

const props = defineProps<{
    municipalities: MunicipalityOption[];
    disasterTypes: DisasterTypeOption[];
    disaster?: DisasterFormValues;
    submitAction: { url: string; method: 'post' | 'put' };
    submitLabel: string;
    cancelHref?: string;
    onCancel?: () => void;
}>();

const emit = defineEmits<{ success: [] }>();

const severities = ['Low', 'Moderate', 'High', 'Critical'];
const statuses = ['Active', 'Monitoring', 'Contained', 'Resolved'];

const selectedMunicipalityId = ref<string | undefined>(
    props.disaster?.municipality_id ? String(props.disaster.municipality_id) : undefined
);
const selectedDisasterTypeId = ref<string | undefined>(
    props.disaster?.disaster_type_id ? String(props.disaster.disaster_type_id) : undefined
);
const selectedSeverity = ref<string | undefined>(
    props.disaster?.severity || 'Moderate'
);
const selectedStatus = ref<string | undefined>(
    props.disaster?.status || 'Active'
);

watch(
    () => props.disaster,
    (newDisaster) => {
        selectedMunicipalityId.value = newDisaster?.municipality_id
            ? String(newDisaster.municipality_id)
            : undefined;
        selectedDisasterTypeId.value = newDisaster?.disaster_type_id
            ? String(newDisaster.disaster_type_id)
            : undefined;
        selectedSeverity.value = newDisaster?.severity || 'Moderate';
        selectedStatus.value = newDisaster?.status || 'Active';
    },
    { immediate: true }
);

const toStringOrUndefined = (value: AcceptableValue): string | undefined => {
    if (value === null || value === undefined) {
        return undefined;
    }
    return String(value);
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
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <!-- Title (full width) -->
            <div class="grid gap-2 md:col-span-2">
                <Label for="title">Disaster Title</Label>
                <Input
                    id="title"
                    name="title"
                    :default-value="disaster?.title"
                    required
                    placeholder="e.g. Typhoon Odette Landfall in Siargao"
                />
                <InputError :message="errors.title" />
            </div>

            <!-- Municipality -->
            <div class="grid gap-2">
                <Label for="municipality_id">Municipality</Label>
                <input
                    type="hidden"
                    name="municipality_id"
                    :value="selectedMunicipalityId"
                />
                <Select
                    :model-value="selectedMunicipalityId"
                    @update:model-value="
                        (v) => (selectedMunicipalityId = toStringOrUndefined(v))
                    "
                >
                    <SelectTrigger id="municipality_id" class="w-full">
                        <SelectValue placeholder="Select municipality" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem
                            v-for="muni in municipalities"
                            :key="muni.id"
                            :value="muni.id.toString()"
                        >
                            {{ muni.municipality_name }}
                        </SelectItem>
                    </SelectContent>
                </Select>
                <InputError :message="errors.municipality_id" />
            </div>

            <!-- Disaster Type -->
            <div class="grid gap-2">
                <Label for="disaster_type_id">Disaster Type</Label>
                <input
                    type="hidden"
                    name="disaster_type_id"
                    :value="selectedDisasterTypeId"
                />
                <Select
                    :model-value="selectedDisasterTypeId"
                    @update:model-value="
                        (v) => (selectedDisasterTypeId = toStringOrUndefined(v))
                    "
                >
                    <SelectTrigger id="disaster_type_id" class="w-full">
                        <SelectValue placeholder="Select disaster type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem
                            v-for="type in disasterTypes"
                            :key="type.id"
                            :value="type.id.toString()"
                        >
                            {{ type.type_name }}
                        </SelectItem>
                    </SelectContent>
                </Select>
                <InputError :message="errors.disaster_type_id" />
            </div>

            <!-- Severity -->
            <div class="grid gap-2">
                <Label for="severity">Severity Level</Label>
                <input type="hidden" name="severity" :value="selectedSeverity" />
                <Select
                    :model-value="selectedSeverity"
                    @update:model-value="
                        (v) => (selectedSeverity = toStringOrUndefined(v))
                    "
                >
                    <SelectTrigger id="severity" class="w-full">
                        <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem
                            v-for="item in severities"
                            :key="item"
                            :value="item"
                        >
                            {{ item }}
                        </SelectItem>
                    </SelectContent>
                </Select>
                <InputError :message="errors.severity" />
            </div>

            <!-- Status -->
            <div class="grid gap-2">
                <Label for="status">Status</Label>
                <input type="hidden" name="status" :value="selectedStatus" />
                <Select
                    :model-value="selectedStatus"
                    @update:model-value="
                        (v) => (selectedStatus = toStringOrUndefined(v))
                    "
                >
                    <SelectTrigger id="status" class="w-full">
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem
                            v-for="item in statuses"
                            :key="item"
                            :value="item"
                        >
                            {{ item }}
                        </SelectItem>
                    </SelectContent>
                </Select>
                <InputError :message="errors.status" />
            </div>

            <!-- Occurred At -->
            <div class="grid gap-2 md:col-span-2">
                <Label for="occurred_at">Date & Time Occurred</Label>
                <Input
                    id="occurred_at"
                    type="datetime-local"
                    name="occurred_at"
                    :default-value="disaster?.occurred_at ?? undefined"
                    required
                />
                <InputError :message="errors.occurred_at" />
            </div>

            <!-- Latitude -->
            <div class="grid gap-2">
                <Label for="latitude">
                    Latitude
                    <span class="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                    id="latitude"
                    type="number"
                    step="any"
                    name="latitude"
                    :default-value="disaster?.latitude ?? undefined"
                    placeholder="e.g. 9.78440000"
                />
                <InputError :message="errors.latitude" />
            </div>

            <!-- Longitude -->
            <div class="grid gap-2">
                <Label for="longitude">
                    Longitude
                    <span class="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                    id="longitude"
                    type="number"
                    step="any"
                    name="longitude"
                    :default-value="disaster?.longitude ?? undefined"
                    placeholder="e.g. 125.49500000"
                />
                <InputError :message="errors.longitude" />
            </div>

            <!-- Description -->
            <div class="grid gap-2 md:col-span-2">
                <Label for="description">
                    Description / Situation Overview
                    <span class="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                    id="description"
                    name="description"
                    :default-value="disaster?.description ?? ''"
                    rows="3"
                    placeholder="Enter details about affected areas, initial impact, or response instructions..."
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

