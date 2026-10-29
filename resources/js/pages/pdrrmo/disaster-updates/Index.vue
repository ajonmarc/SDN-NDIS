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

interface DisasterOption {
    id: number;
    title: string;
}

interface DisasterUpdate {
    id: number;
    disaster_id: number;
    disaster_title: string;
    message: string;
    published_at: string | null;
    published_at_formatted: string;
    created_by_name: string;
}

defineProps<{
    disasters: DisasterOption[];
}>();


/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

const indexUrl = '/pdrrmo/disaster-updates';
const dataUrl = '/pdrrmo/disaster-updates/data';
const storeAction = () => ({ url: '/pdrrmo/disaster-updates', method: 'post' as const });
const updateAction = (id: number) => ({ url: `/pdrrmo/disaster-updates/${id}`, method: 'put' as const });
const destroyUrl = (id: number) => `/pdrrmo/disaster-updates/${id}`;


/*
|--------------------------------------------------------------------------
| State
|--------------------------------------------------------------------------
*/

const creating = ref(false);
const editingDisasterUpdate = ref<DisasterUpdate | null>(null);
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
        key: 'disaster_title',
        label: 'Disaster Event',
        sortable: false,
    },
    {
        key: 'message',
        label: 'Update Message / Advisory',
        sortable: false,
    },
    {
        key: 'published_at',
        label: 'Published At',
        sortable: true,
    },
    {
        key: 'created_by_name',
        label: 'Published By',
        sortable: false,
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

const openEdit = (item: DisasterUpdate) => {
    editingDisasterUpdate.value = item;
};

const closeEdit = () => {
    editingDisasterUpdate.value = null;
};

const handleEditSuccess = () => {
    editingDisasterUpdate.value = null;
    tableRef.value?.clearCache('current');
};


/*
|--------------------------------------------------------------------------
| Delete Actions
|--------------------------------------------------------------------------
*/

const confirmDelete = async (item: DisasterUpdate) => {
    if (deleting.value) {
        return;
    }

    const Swal = await getSwal();

    const result = await Swal.fire({
        title: 'Delete disaster update?',
        html: `This will permanently delete this advisory for <strong>${item.disaster_title}</strong>.<br>This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, delete update!',
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
                title: 'Disaster Updates',
            },
        ],
    },
});
</script>


<template>

    <Head title="Disaster Updates" />

    <div class="px-4 py-6">

        <!-- ==========================================================
             Page Header
        =========================================================== -->

        <div class="flex items-center justify-between">

            <Heading
                title="Disaster Updates"
                description="Publish and manage official situation reports, advisories, and public updates for ongoing disasters."
            />

            <Button @click="openCreate">
                <Plus class="mr-2 h-4 w-4" />
                Publish Update
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

                <!-- Disaster Title Column -->
                <template v-slot:[`cell-disaster_title`]="{ row }">
                    <span class="font-medium">{{ row.disaster_title }}</span>
                </template>

                <!-- Message Column -->
                <template v-slot:[`cell-message`]="{ row }">
                    <p class="max-w-lg line-clamp-2 text-sm text-muted-foreground">
                        {{ row.message }}
                    </p>
                </template>

                <!-- Published At Column -->
                <template v-slot:[`cell-published_at`]="{ row }">
                    <span class="text-sm">
                        {{ row.published_at_formatted }}
                    </span>
                </template>

                <!-- Actions Column -->
                <template v-slot:[`cell-actions`]="{ row }">

                    <div class="inline-flex items-center gap-2">

                        <!-- Edit -->
                        <Button
                            variant="outline"
                            size="icon"
                            title="Edit disaster update"
                            @click="openEdit(row)"
                        >
                            <Pencil class="h-4 w-4" />
                        </Button>

                        <!-- Delete -->
                        <Button
                            variant="destructive"
                            size="icon"
                            title="Delete disaster update"
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
            title="Publish Disaster Update"
            content-class="sm:max-w-2xl"
            description="Post a new official situation report or public advisory for a disaster event."
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
                    :disasters="disasters"
                    :submit-action="storeAction()"
                    submit-label="Publish Update"
                    :on-cancel="close"
                    @success="handleCreateSuccess"
                />

            </template>

        </FormDialog>


        <!-- ==========================================================
             Edit Dialog
        =========================================================== -->

        <FormDialog
            :open="!!editingDisasterUpdate"
            title="Edit Disaster Update"
            content-class="sm:max-w-2xl"
            :description="
                editingDisasterUpdate
                    ? `Update advisory for ${editingDisasterUpdate.disaster_title}.`
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
                    v-if="editingDisasterUpdate"
                    :disasters="disasters"
                    :disaster-update="editingDisasterUpdate"
                    :submit-action="updateAction(editingDisasterUpdate.id)"
                    submit-label="Save Changes"
                    :on-cancel="close"
                    @success="handleEditSuccess"
                />

            </template>

        </FormDialog>

    </div>

</template>
