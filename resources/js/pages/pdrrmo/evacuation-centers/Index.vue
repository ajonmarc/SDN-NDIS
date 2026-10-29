<script setup lang="ts">
/*
|--------------------------------------------------------------------------
| Imports
|--------------------------------------------------------------------------
*/

import { Head, router } from '@inertiajs/vue3';
import { ref } from 'vue';

import SimpleTable from '@kikiloaw/simple-table';
import { Building2, Pencil, Plus, Trash2 } from '@lucide/vue';

import Heading from '@/components/Heading.vue';
import FormDialog from '@/components/crud/FormDialog.vue';
import Form from './Form.vue';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getSwal } from '@/lib/swal';


/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

interface MunicipalityOption {
    id: number;
    municipality_name: string;
}

interface EvacuationCenter {
    id: number;
    center_name: string;
    address: string;
    municipality_id: number;
    municipality_name: string;
    image: string | null;
    latitude: number | string | null;
    longitude: number | string | null;
    coordinates: string;
    capacity: number;
    current_occupancy: number;
    occupancy_display: string;
    status: string;
    created_by_name: string;
}

defineProps<{
    municipalities: MunicipalityOption[];
}>();


/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

const indexUrl = '/pdrrmo/evacuation-centers';
const dataUrl = '/pdrrmo/evacuation-centers/data';
const storeAction = () => ({ url: '/pdrrmo/evacuation-centers', method: 'post' as const });
const updateAction = (id: number) => ({ url: `/pdrrmo/evacuation-centers/${id}`, method: 'put' as const });
const destroyUrl = (id: number) => `/pdrrmo/evacuation-centers/${id}`;


/*
|--------------------------------------------------------------------------
| State
|--------------------------------------------------------------------------
*/

const creating = ref(false);
const editingCenter = ref<EvacuationCenter | null>(null);
const tableRef = ref();
const deleting = ref(false);


/*
|--------------------------------------------------------------------------
| Table Configuration
|--------------------------------------------------------------------------
*/

const columns = [
    {
        key: 'id',
        label: 'ID',
        sortable: true,
        width: '70px',
    },
    {
        key: 'image',
        label: 'Image',
        sortable: false,
        width: '80px',
    },
    {
        key: 'center_name',
        label: 'Evacuation Center',
        sortable: true,
    },
    {
        key: 'municipality_name',
        label: 'Municipality',
        sortable: false,
    },
    {
        key: 'capacity',
        label: 'Occupancy / Capacity',
        sortable: true,
    },
    {
        key: 'status',
        label: 'Status',
        sortable: true,
    },
    {
        key: 'actions',
        label: 'Actions',
        sortable: false,
        width: '120px',
    },
];


/*
|--------------------------------------------------------------------------
| Badge Helpers
|--------------------------------------------------------------------------
*/

const statusVariant = (status: string) => {
    switch (status) {
        case 'Open':
            return 'default' as const;
        case 'Full':
            return 'destructive' as const;
        case 'Maintenance':
            return 'secondary' as const;
        default:
            return 'outline' as const;
    }
};


/*
|--------------------------------------------------------------------------
| Create Actions
|--------------------------------------------------------------------------
*/

const openCreate = () => {
    creating.value = true;
};

const closeCreate = () => {
    creating.value = false;
};

const handleCreateSuccess = () => {
    creating.value = false;
    tableRef.value?.clearCache('current');
};


/*
|--------------------------------------------------------------------------
| Edit Actions
|--------------------------------------------------------------------------
*/

const openEdit = (center: EvacuationCenter) => {
    editingCenter.value = center;
};

const closeEdit = () => {
    editingCenter.value = null;
};

const handleEditSuccess = () => {
    editingCenter.value = null;
    tableRef.value?.clearCache('current');
};


/*
|--------------------------------------------------------------------------
| Delete Actions
|--------------------------------------------------------------------------
*/

const confirmDelete = async (center: EvacuationCenter) => {
    if (deleting.value) {
        return;
    }

    const Swal = await getSwal();

    const result = await Swal.fire({
        title: 'Delete evacuation center?',
        html: `This will permanently delete <strong>${center.center_name}</strong>.<br>This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, delete center!',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
    });

    if (!result.isConfirmed) {
        return;
    }

    deleting.value = true;

    router.delete(destroyUrl(center.id), {
        preserveScroll: true,

        onSuccess: () => {
            tableRef.value?.clearCache('current');
        },

        onFinish: () => {
            deleting.value = false;
        },
    });
};


/*
|--------------------------------------------------------------------------
| Page Options
|--------------------------------------------------------------------------
*/

defineOptions({
    layout: {
        breadcrumbs: [
            {
                href: indexUrl,
                title: 'Evacuation Centers',
            },
        ],
    },
});
</script>


<template>

    <Head title="Evacuation Centers" />

    <div class="px-4 py-6">

        <!-- ==========================================================
             Page Header
        =========================================================== -->

        <div class="flex items-center justify-between">

            <Heading
                title="Evacuation Centers"
                description="Manage evacuation center locations, photos, capacities, current occupancy, and operational status."
            />

            <Button @click="openCreate">
                <Plus class="mr-2 h-4 w-4" />
                New Evacuation Center
            </Button>

        </div>


        <!-- ==========================================================
             Data Table
        =========================================================== -->

        <div class="mt-6">

            <SimpleTable
                ref="tableRef"
                :fetch-url="dataUrl"
                :columns="columns"
                searchable
                enable-cache
            >

                <!-- Image Thumbnail -->
                <template v-slot:[`cell-image`]="{ row }">
                    <img
                        v-if="row.image"
                        :src="row.image"
                        :alt="row.center_name"
                        class="h-10 w-14 rounded border object-cover"
                    />
                    <div
                        v-else
                        class="flex h-10 w-14 items-center justify-center rounded border bg-muted text-muted-foreground"
                    >
                        <Building2 class="h-4 w-4" />
                    </div>
                </template>

                <!-- Center Name + Address + Coordinates -->
                <template v-slot:[`cell-center_name`]="{ row }">
                    <div>
                        <div class="font-medium">{{ row.center_name }}</div>
                        <div class="text-xs text-muted-foreground line-clamp-1">
                            {{ row.address }}
                        </div>
                        <div class="text-xs text-muted-foreground">
                            Coords: {{ row.coordinates }}
                        </div>
                    </div>
                </template>

                <!-- Capacity / Occupancy Column -->
                <template v-slot:[`cell-capacity`]="{ row }">
                    <div class="text-sm font-medium">
                        {{ row.occupancy_display }}
                    </div>
                </template>

                <!-- Status Column -->
                <template v-slot:[`cell-status`]="{ row }">
                    <Badge :variant="statusVariant(row.status)">
                        {{ row.status }}
                    </Badge>
                </template>

                <!-- Actions Column -->
                <template v-slot:[`cell-actions`]="{ row }">

                    <div class="inline-flex items-center gap-2">

                        <!-- Edit -->
                        <Button
                            variant="outline"
                            size="icon"
                            title="Edit evacuation center"
                            @click="openEdit(row)"
                        >
                            <Pencil class="h-4 w-4" />
                        </Button>

                        <!-- Delete -->
                        <Button
                            variant="destructive"
                            size="icon"
                            title="Delete evacuation center"
                            :disabled="deleting"
                            @click="confirmDelete(row)"
                        >
                            <Trash2 class="h-4 w-4" />
                        </Button>

                    </div>

                </template>

            </SimpleTable>

        </div>


        <!-- ==========================================================
             Create Dialog
        =========================================================== -->

        <FormDialog
            :open="creating"
            title="Create Evacuation Center"
            content-class="sm:max-w-2xl"
            description="Add a new evacuation center with location coordinates, capacity, and photo."
            @update:open="
                (value) => {
                    if (!value) {
                        closeCreate();
                    }
                }
            "
        >

            <template #default="{ close }">

                <Form
                    :municipalities="municipalities"
                    :submit-action="storeAction()"
                    submit-label="Create Center"
                    :on-cancel="close"
                    @success="handleCreateSuccess"
                />

            </template>

        </FormDialog>


        <!-- ==========================================================
             Edit Dialog
        =========================================================== -->

        <FormDialog
            :open="!!editingCenter"
            title="Edit Evacuation Center"
            content-class="sm:max-w-2xl"
            :description="
                editingCenter
                    ? `Update ${editingCenter.center_name} details.`
                    : undefined
            "
            @update:open="
                (value) => {
                    if (!value) {
                        closeEdit();
                    }
                }
            "
        >

            <template #default="{ close }">

                <Form
                    v-if="editingCenter"
                    :municipalities="municipalities"
                    :evacuation-center="editingCenter"
                    :submit-action="updateAction(editingCenter.id)"
                    submit-label="Save Changes"
                    :on-cancel="close"
                    @success="handleEditSuccess"
                />

            </template>

        </FormDialog>

    </div>

</template>
