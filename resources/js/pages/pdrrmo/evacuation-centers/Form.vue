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

const MUNICIPALITY_COORDS: Record<string, [string, string]> = {
    'Surigao City': ['9.78440000', '125.49500000'],
    'Alegria': ['9.46860000', '125.57690000'],
    'Bacuag': ['9.60830000', '125.63780000'],
    'Burgos': ['10.02110000', '126.07360000'],
    'Claver': ['9.57250000', '125.73310000'],
    'Dapa': ['9.75940000', '126.05310000'],
    'Del Carmen': ['9.86940000', '125.97080000'],
    'General Luna': ['9.78250000', '126.15580000'],
    'Gigaquit': ['9.59580000', '125.69750000'],
    'Mainit': ['9.53720000', '125.52310000'],
    'Malimono': ['9.61940000', '125.40280000'],
    'Pilar': ['9.86500000', '126.09890000'],
    'Placer': ['9.65420000', '125.60250000'],
    'San Benito': ['9.95750000', '126.00560000'],
    'San Francisco (Anao-Aon)': ['9.71360000', '125.43060000'],
    'San Isidro': ['9.93670000', '126.08580000'],
    'Santa Monica (Sapao)': ['10.01970000', '126.03810000'],
    'Sison': ['9.66170000', '125.52940000'],
    'Socorro': ['9.62140000', '125.96670000'],
    'Tagana-an': ['9.69720000', '125.58190000'],
    'Tubod': ['9.56670000', '125.56670000'],
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
const latitudeValue = ref<string>(
    props.evacuationCenter?.latitude !== null &&
        props.evacuationCenter?.latitude !== undefined
        ? String(props.evacuationCenter.latitude)
        : ''
);
const longitudeValue = ref<string>(
    props.evacuationCenter?.longitude !== null &&
        props.evacuationCenter?.longitude !== undefined
        ? String(props.evacuationCenter.longitude)
        : ''
);

watch(
    () => props.evacuationCenter,
    (newCenter) => {
        selectedMunicipalityId.value = newCenter?.municipality_id
            ? String(newCenter.municipality_id)
            : undefined;
        selectedStatus.value = newCenter?.status || 'Open';
        imagePreview.value = newCenter?.image ?? null;
        latitudeValue.value =
            newCenter?.latitude !== null && newCenter?.latitude !== undefined
                ? String(newCenter.latitude)
                : '';
        longitudeValue.value =
            newCenter?.longitude !== null && newCenter?.longitude !== undefined
                ? String(newCenter.longitude)
                : '';
    },
    { immediate: true }
);

const toStringOrUndefined = (value: AcceptableValue): string | undefined => {
    if (value === null || value === undefined) {
        return undefined;
    }
    return String(value);
};

const handleMunicipalitySelect = (value: AcceptableValue) => {
    const idStr = toStringOrUndefined(value);
    selectedMunicipalityId.value = idStr;

    if (idStr) {
        const muni = props.municipalities.find((m) => String(m.id) === idStr);
        if (muni && MUNICIPALITY_COORDS[muni.municipality_name]) {
            const [lat, lng] = MUNICIPALITY_COORDS[muni.municipality_name];
            latitudeValue.value = lat;
            longitudeValue.value = lng;
        }
    }
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
                    @update:model-value="handleMunicipalitySelect"
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
                    <span class="text-muted-foreground">(auto-filled by municipality)</span>
                </Label>
                <Input
                    id="latitude"
                    v-model="latitudeValue"
                    type="number"
                    step="any"
                    name="latitude"
                    placeholder="e.g. 9.78440000"
                />
                <InputError :message="errors.latitude" />
            </div>

            <!-- Longitude -->
            <div class="grid gap-2">
                <Label for="longitude">
                    Longitude
                    <span class="text-muted-foreground">(auto-filled by municipality)</span>
                </Label>
                <Input
                    id="longitude"
                    v-model="longitudeValue"
                    type="number"
                    step="any"
                    name="longitude"
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
