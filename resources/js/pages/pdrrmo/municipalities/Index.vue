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

interface Municipality {
    id: number;
    municipality_name: string;
    disasters_count: number;
    evacuation_centers_count: number;
}


/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

const indexUrl = '/pdrrmo/municipalities';
const dataUrl = '/pdrrmo/municipalities/data';
const storeAction = () => ({ url: '/pdrrmo/municipalities', method: 'post' as const });
const updateAction = (id: number) => ({ url: `/pdrrmo/municipalities/${id}`, method: 'put' as const });
const destroyUrl = (id: number) => `/pdrrmo/municipalities/${id}`;


/*
|--------------------------------------------------------------------------
| State
|--------------------------------------------------------------------------
*/

const creating = ref(false);
const editingMunicipality = ref<Municipality | null>(null);
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
        key: 'municipality_name',
        label: 'Municipality Name',
        sortable: true,
    },
    {
        key: 'disasters_count',
        label: 'Recorded Disasters',
        sortable: true,
    },
    {
        key: 'evacuation_centers_count',
        label: 'Evacuation Centers',
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

const openEdit = (item: Municipality) => {
    editingMunicipality.value = item;
};

const closeEdit = () => {
    editingMunicipality.value = null;
};

const handleEditSuccess = () => {
    editingMunicipality.value = null;
    tableRef.value?.clearCache('current');
};


/*
|--------------------------------------------------------------------------
| Delete Actions
|--------------------------------------------------------------------------
*/

const confirmDelete = async (item: Municipality) => {
    if (deleting.value) {
        return;
    }

    const Swal = await getSwal();

    const result = await Swal.fire({
        title: 'Delete municipality?',
        html: `This will permanently delete <strong>${item.municipality_name}</strong> and its associated records.<br>This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, delete municipality!',
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
                title: 'Municipalities',
            },
        ],
    },
});
</script>


<template>

    <Head title="Municipalities" />

    <div class="px-4 py-6">

        <!-- ==========================================================
             Page Header
        =========================================================== -->

        <div class="flex items-center justify-between">

            <Heading
                title="Municipalities"
                description="Manage Surigao del Norte municipalities linked to disasters and evacuation centers."
            />

            <Button @click="openCreate">
                <Plus class="mr-2 h-4 w-4" />
                New Municipality
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

                <!-- Disasters Count Column -->
                <template v-slot:[`cell-disasters_count`]="{ row }">
                    <Badge variant="secondary">
                        {{ row.disasters_count }}
                    </Badge>
                </template>

                <!-- Evacuation Centers Count Column -->
                <template v-slot:[`cell-evacuation_centers_count`]="{ row }">
                    <Badge variant="outline">
                        {{ row.evacuation_centers_count }}
                    </Badge>
                </template>

                <!-- Actions Column -->
                <template v-slot:[`cell-actions`]="{ row }">

                    <div class="inline-flex items-center gap-2">

                        <!-- Edit -->
                        <Button
                            variant="outline"
                            size="icon"
                            title="Edit municipality"
                            @click="openEdit(row)"
                        >
                            <Pencil class="h-4 w-4" />
                        </Button>

                        <!-- Delete -->
                        <Button
                            variant="destructive"
                            size="icon"
                            title="Delete municipality"
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
            title="Create Municipality"
            content-class="sm:max-w-lg"
            description="Add a new municipality or city in Surigao del Norte."
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
                    submit-label="Create Municipality"
                    :on-cancel="close"
                    @success="handleCreateSuccess"
                />

            </template>

        </FormDialog>


        <!-- ==========================================================
             Edit Dialog
        =========================================================== -->

        <FormDialog
            :open="!!editingMunicipality"
            title="Edit Municipality"
            content-class="sm:max-w-lg"
            :description="
                editingMunicipality
                    ? `Update ${editingMunicipality.municipality_name} details.`
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
                    v-if="editingMunicipality"
                    :municipality="editingMunicipality"
                    :submit-action="updateAction(editingMunicipality.id)"
                    submit-label="Save Changes"
                    :on-cancel="close"
                    @success="handleEditSuccess"
                />

            </template>

        </FormDialog>

    </div>

</template>
