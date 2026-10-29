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

import { Button } from '@/components/ui/button';
import { getSwal } from '@/lib/swal';


/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

interface DisasterType {
    id: number;
    type_name: string;
    description: string | null;
}


/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

const indexUrl = '/pdrrmo/disaster-types';
const dataUrl = '/pdrrmo/disaster-types/data';
const storeAction = () => ({ url: '/pdrrmo/disaster-types', method: 'post' as const });
const updateAction = (id: number) => ({ url: `/pdrrmo/disaster-types/${id}`, method: 'put' as const });
const destroyUrl = (id: number) => `/pdrrmo/disaster-types/${id}`;


/*
|--------------------------------------------------------------------------
| State
|--------------------------------------------------------------------------
*/

const creating = ref(false);
const editingDisasterType = ref<DisasterType | null>(null);
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
        width: '80px',
    },
    {
        key: 'type_name',
        label: 'Type Name',
        sortable: true,
    },
    {
        key: 'description',
        label: 'Description',
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

const openEdit = (item: DisasterType) => {
    editingDisasterType.value = item;
};

const closeEdit = () => {
    editingDisasterType.value = null;
};

const handleEditSuccess = () => {
    editingDisasterType.value = null;
    tableRef.value?.clearCache('current');
};


/*
|--------------------------------------------------------------------------
| Delete Actions
|--------------------------------------------------------------------------
*/

const confirmDelete = async (item: DisasterType) => {
    if (deleting.value) {
        return;
    }

    const Swal = await getSwal();

    const result = await Swal.fire({
        title: 'Delete disaster type?',
        html: `This will permanently delete <strong>${item.type_name}</strong>.<br>This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
    });

    if (!result.isConfirmed) {
        return;
    }

    deleting.value = true;

    router.delete(destroyUrl(item.id), {
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
                title: 'Disaster Types',
            },
        ],
    },
});
</script>


<template>

    <Head title="Disaster Types" />

    <div class="px-4 py-6">

        <!-- ==========================================================
             Page Header
        =========================================================== -->

        <div class="flex items-center justify-between">

            <Heading
                title="Disaster Types"
                description="Classify and manage disaster categories such as Typhoon, Flood, Earthquake, and Landslide."
            />

            <Button @click="openCreate">
                <Plus class="mr-2 h-4 w-4" />
                New Disaster Type
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

                <!-- Description Column -->
                <template v-slot:[`cell-description`]="{ row }">
                    <span class="text-muted-foreground">
                        {{ row.description || 'No description provided' }}
                    </span>
                </template>

                <!-- Actions Column -->
                <template v-slot:[`cell-actions`]="{ row }">

                    <div class="inline-flex items-center gap-2">

                        <!-- Edit -->
                        <Button
                            variant="outline"
                            size="icon"
                            title="Edit disaster type"
                            @click="openEdit(row)"
                        >
                            <Pencil class="h-4 w-4" />
                        </Button>

                        <!-- Delete -->
                        <Button
                            variant="destructive"
                            size="icon"
                            title="Delete disaster type"
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
            title="Create Disaster Type"
            content-class="sm:max-w-xl"
            description="Add a new disaster category to the system."
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
                    :submit-action="storeAction()"
                    submit-label="Create Disaster Type"
                    :on-cancel="close"
                    @success="handleCreateSuccess"
                />

            </template>

        </FormDialog>


        <!-- ==========================================================
             Edit Dialog
        =========================================================== -->

        <FormDialog
            :open="!!editingDisasterType"
            title="Edit Disaster Type"
            content-class="sm:max-w-xl"
            :description="
                editingDisasterType
                    ? `Update ${editingDisasterType.type_name} details.`
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
                    v-if="editingDisasterType"
                    :disaster-type="editingDisasterType"
                    :submit-action="updateAction(editingDisasterType.id)"
                    submit-label="Save Changes"
                    :on-cancel="close"
                    @success="handleEditSuccess"
                />

            </template>

        </FormDialog>

    </div>

</template>
