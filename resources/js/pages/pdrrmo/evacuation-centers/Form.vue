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

type EvacuationCenterFormValues = {
    id?: number;
    municipality_id: number | string | null;
    center_name: string;
    address: string;
    image: string | null;
    latitude: number | string | null;
    longitude: number | string | null;
    capacity: number | string;
    current_occupancy: number | string;
    status: string;
};

const props = defineProps<{
    municipalities: MunicipalityOption[];
    evacuationCenter?: EvacuationCenterFormValues;
    submitAction: { url: string; method: 'post' | 'put' };
    submitLabel: string;
    cancelHref?: string;
    onCancel?: () => void;
}>();

const emit = defineEmits<{ success: [] }>();

const statuses = ['Open', 'Full', 'Closed', 'Maintenance'];

const selectedMunicipalityId = ref<string | undefined>(
    props.evacuationCenter?.municipality_id
        ? String(props.evacuationCenter.municipality_id)
        : undefined
);
const selectedStatus = ref<string | undefined>(
    props.evacuationCenter?.status || 'Open'
);
const imagePreview = ref<string | null>(props.evacuationCenter?.image ?? null);

watch(
    () => props.evacuationCenter,
    (newCenter) => {
        selectedMunicipalityId.value = newCenter?.municipality_id
            ? String(newCenter.municipality_id)
            : undefined;
        selectedStatus.value = newCenter?.status || 'Open';
        imagePreview.value = newCenter?.image ?? null;
    },
    { immediate: true }
);

const toStringOrUndefined = (value: AcceptableValue): string | undefined => {
    if (value === null || value === undefined) {
        return undefined;
    }
    return String(value);
};

const handleImageChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
        imagePreview.value = URL.createObjectURL(file);
    } else {
        imagePreview.value = props.evacuationCenter?.image ?? null;
    }
};
</script>

<template>
    <Form
        :action="submitAction.url"
        method="post"
        class="flex flex-col gap-6"
        v-slot="{ errors, processing }"
        @success="emit('success')"
    >
        <input
            v-if="submitAction.method === 'put'"
            type="hidden"
            name="_method"
            value="PUT"
        />

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <!-- Center Name -->
            <div class="grid gap-2 md:col-span-2">
                <Label for="center_name">Evacuation Center Name</Label>
                <Input
                    id="center_name"
                    name="center_name"
                    :default-value="evacuationCenter?.center_name"
                    required
                    placeholder="e.g. Surigao City Provincial Gymnasium"
                />
                <InputError :message="errors.center_name" />
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

            <!-- Status -->
            <div class="grid gap-2">
                <Label for="status">Center Status</Label>
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

            <!-- Capacity -->
            <div class="grid gap-2">
                <Label for="capacity">Total Capacity (Persons)</Label>
                <Input
                    id="capacity"
                    type="number"
                    min="1"
                    name="capacity"
                    :default-value="evacuationCenter?.capacity ?? 100"
                    required
                    placeholder="e.g. 500"
                />
                <InputError :message="errors.capacity" />
            </div>

            <!-- Current Occupancy -->
            <div class="grid gap-2">
                <Label for="current_occupancy">Current Occupancy (Persons)</Label>
                <Input
                    id="current_occupancy"
                    type="number"
                    min="0"
                    name="current_occupancy"
                    :default-value="evacuationCenter?.current_occupancy ?? 0"
                    required
                    placeholder="e.g. 0"
                />
                <InputError :message="errors.current_occupancy" />
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
                    :default-value="evacuationCenter?.latitude ?? undefined"
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
                    :default-value="evacuationCenter?.longitude ?? undefined"
                    placeholder="e.g. 125.49500000"
                />
                <InputError :message="errors.longitude" />
            </div>

            <!-- Address -->
            <div class="grid gap-2 md:col-span-2">
                <Label for="address">Full Address / Landmark</Label>
                <Textarea
                    id="address"
                    name="address"
                    :default-value="evacuationCenter?.address ?? ''"
                    required
                    rows="2"
                    placeholder="Enter street address, barangay, or nearby landmark..."
                />
                <InputError :message="errors.address" />
            </div>

            <!-- Image Upload -->
            <div class="grid gap-2 md:col-span-2">
                <Label for="image">
                    Center Image
                    <span class="text-muted-foreground">
                        (optional, JPG/PNG/WEBP up to 5MB)
                    </span>
                </Label>
                <Input
                    id="image"
                    type="file"
                    name="image"
                    accept="image/jpeg,image/png,image/webp"
                    @change="handleImageChange"
                />
                <InputError :message="errors.image" />

                <div v-if="imagePreview" class="mt-2">
                    <img
                        :src="imagePreview"
                        alt="Evacuation Center Preview"
                        class="h-32 w-48 rounded-md border object-cover"
                    />
                </div>
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

