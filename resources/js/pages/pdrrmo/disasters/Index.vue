<script setup lang="ts">
/*
|--------------------------------------------------------------------------
| Imports
|--------------------------------------------------------------------------
*/

import { Head, router } from '@inertiajs/vue3';
import { ref } from 'vue';

import SimpleTable from '@kikiloaw/simple-table';
import { Pencil, Plus, Trash2 } from '@lucide/vue';

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

interface DisasterTypeOption {
    id: number;
    type_name: string;
}

interface Disaster {
    id: number;
    title: string;
    description: string | null;
    municipality_id: number;
    municipality_name: string;
    disaster_type_id: number;
    disaster_type_name: string;
    latitude: number | string | null;
    longitude: number | string | null;
    coordinates: string;
    occurred_at: string | null;
    occurred_at_formatted: string;
    severity: string;
    status: string;
    created_by_name: string;
}

defineProps<{
    municipalities: MunicipalityOption[];
    disasterTypes: DisasterTypeOption[];
}>();


/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

const indexUrl = '/pdrrmo/disasters';
const dataUrl = '/pdrrmo/disasters/data';
const storeAction = () => ({ url: '/pdrrmo/disasters', method: 'post' as const });
const updateAction = (id: number) => ({ url: `/pdrrmo/disasters/${id}`, method: 'put' as const });
const destroyUrl = (id: number) => `/pdrrmo/disasters/${id}`;


/*
|--------------------------------------------------------------------------
| State
|--------------------------------------------------------------------------
*/

const creating = ref(false);
const editingDisaster = ref<Disaster | null>(null);
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
        key: 'title',
        label: 'Disaster Title',
        sortable: true,
    },
    {
        key: 'disaster_type_name',
        label: 'Type',
        sortable: false,
    },
    {
        key: 'municipality_name',
        label: 'Municipality',
        sortable: false,
    },
    {
        key: 'severity',
        label: 'Severity',
        sortable: true,
    },
    {
        key: 'status',
        label: 'Status',
        sortable: true,
    },
    {
        key: 'occurred_at',
        label: 'Occurred At',
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

const severityVariant = (severity: string) => {
    switch (severity) {
        case 'Critical':
        case 'High':
            return 'destructive' as const;
        case 'Moderate':
            return 'default' as const;
        default:
            return 'secondary' as const;
    }
};

const statusVariant = (status: string) => {
    switch (status) {
        case 'Active':
            return 'destructive' as const;
        case 'Monitoring':
            return 'default' as const;
        case 'Contained':
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

const openEdit = (disaster: Disaster) => {
    editingDisaster.value = disaster;
};

const closeEdit = () => {
    editingDisaster.value = null;
};

const handleEditSuccess = () => {
    editingDisaster.value = null;
    tableRef.value?.clearCache('current');
};


/*
|--------------------------------------------------------------------------
| Delete Actions
|--------------------------------------------------------------------------
*/

const confirmDelete = async (disaster: Disaster) => {
    if (deleting.value) {
        return;
    }

    const Swal = await getSwal();

    const result = await Swal.fire({
        title: 'Delete disaster record?',
        html: `This will permanently delete <strong>${disaster.title}</strong> and its associated updates.<br>This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, delete record!',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
    });

    if (!result.isConfirmed) {
        return;
    }

    deleting.value = true;

    router.delete(destroyUrl(disaster.id), {
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
                title: 'Disasters',
            },
        ],
    },
});
</script>


<template>

    <Head title="Disasters" />

    <div class="px-4 py-6">

        <!-- ==========================================================
             Page Header
        =========================================================== -->

        <div class="flex items-center justify-between">

            <Heading
                title="Disasters"
                description="Record and manage disaster events, locations, severity levels, and statuses across Surigao del Norte."
            />

            <Button @click="openCreate">
                <Plus class="mr-2 h-4 w-4" />
                Record Disaster
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

                <!-- Title + Coordinates -->
                <template v-slot:[`cell-title`]="{ row }">
                    <div>
                        <div class="font-medium">{{ row.title }}</div>
                        <div class="text-xs text-muted-foreground">
                            Coords: {{ row.coordinates }}
                        </div>
                    </div>
                </template>

                <!-- Severity Column -->
                <template v-slot:[`cell-severity`]="{ row }">
                    <Badge :variant="severityVariant(row.severity)">
                        {{ row.severity }}
                    </Badge>
                </template>

                <!-- Status Column -->
                <template v-slot:[`cell-status`]="{ row }">
                    <Badge :variant="statusVariant(row.status)">
                        {{ row.status }}
                    </Badge>
                </template>

                <!-- Occurred At Column -->
                <template v-slot:[`cell-occurred_at`]="{ row }">
                    <span class="text-sm">
                        {{ row.occurred_at_formatted || 'N/A' }}
                    </span>
                </template>

                <!-- Actions Column -->
                <template v-slot:[`cell-actions`]="{ row }">

                    <div class="inline-flex items-center gap-2">

                        <!-- Edit -->
                        <Button
                            variant="outline"
                            size="icon"
                            title="Edit disaster"
                            @click="openEdit(row)"
                        >
                            <Pencil class="h-4 w-4" />
                        </Button>

                        <!-- Delete -->
                        <Button
                            variant="destructive"
                            size="icon"
                            title="Delete disaster"
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
            title="Record New Disaster"
            content-class="sm:max-w-2xl"
            description="Enter the details, affected municipality, coordinates, and status of the disaster event."
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
                    :disaster-types="disasterTypes"
                    :submit-action="storeAction()"
                    submit-label="Record Disaster"
                    :on-cancel="close"
                    @success="handleCreateSuccess"
                />

            </template>

        </FormDialog>


        <!-- ==========================================================
             Edit Dialog
        =========================================================== -->

        <FormDialog
            :open="!!editingDisaster"
            title="Edit Disaster Record"
            content-class="sm:max-w-2xl"
            :description="
                editingDisaster
                    ? `Update ${editingDisaster.title} details.`
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
                    v-if="editingDisaster"
                    :municipalities="municipalities"
                    :disaster-types="disasterTypes"
                    :disaster="editingDisaster"
                    :submit-action="updateAction(editingDisaster.id)"
                    submit-label="Save Changes"
                    :on-cancel="close"
                    @success="handleEditSuccess"
                />

            </template>

        </FormDialog>

    </div>

</template>
