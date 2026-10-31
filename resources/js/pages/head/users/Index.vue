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

import {
    index,
    store,
    update,
    destroy,
    data,
} from '@/routes/head/users';


/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

interface RoleOption {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    contact_number: string | null;
    full_address: string | null;
    role_id: number | null;
    role_name: string;
}

defineProps<{
    roles: RoleOption[];
}>();


/*
|--------------------------------------------------------------------------
| State
|--------------------------------------------------------------------------
*/

/**
 * User currently being created.
 */
const creating = ref(false);

/**
 * User currently being edited.
 */
const editingUser = ref<User | null>(null);

/**
 * SimpleTable reference.
 */
const tableRef = ref();

/**
 * Prevent duplicate delete requests.
 */
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
        key: 'name',
        label: 'Name',
        sortable: true,
    },
    {
        key: 'email',
        label: 'Email',
        sortable: true,
    },
    {
        key: 'contact_number',
        label: 'Contact No.',
        sortable: false,
    },
    {
        key: 'role_name',
        label: 'Role',
        sortable: false,
    },
    {
        key: 'actions',
        label: 'Actions',
        sortable: false,
    },
];


/*
|--------------------------------------------------------------------------
| Create Actions
|--------------------------------------------------------------------------
*/

/**
 * Open create modal.
 */
const openCreate = () => {
    creating.value = true;
};

/**
 * Close create modal.
 */
const closeCreate = () => {
    creating.value = false;
};

/**
 * Called after successful creation.
 */
const handleCreateSuccess = () => {
    creating.value = false;

    // Refresh SimpleTable data
    tableRef.value?.clearCache('current');
};


/*
|--------------------------------------------------------------------------
| Edit Actions
|--------------------------------------------------------------------------
*/

/**
 * Open edit modal.
 */
const openEdit = (user: User) => {
    editingUser.value = user;
};

/**
 * Close edit modal.
 */
const closeEdit = () => {
    editingUser.value = null;
};

/**
 * Called after successful update.
 */
const handleEditSuccess = () => {
    editingUser.value = null;

    // Refresh SimpleTable data
    tableRef.value?.clearCache('current');
};


/*
|--------------------------------------------------------------------------
| Delete Actions
|--------------------------------------------------------------------------
*/

/**
 * Open the SweetAlert2 delete confirmation modal and delete if confirmed.
 */
const confirmDelete = async (user: User) => {
    if (deleting.value) {
        return;
    }

    const Swal = await getSwal();

    const result = await Swal.fire({
        title: 'Delete user?',
        html: `This will permanently delete <strong>${user.name}</strong>.<br>This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, delete user!',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
    });

    if (!result.isConfirmed) {
        return;
    }

    deleting.value = true;

    router.delete(destroy(user.id).url, {
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
                href: index(),
                title: 'Users',
            },
        ],
    },
});
</script>


<template>

    <Head title="Users" />

    <div class="px-4 py-6">

        <!-- ==========================================================
             Page Header
        =========================================================== -->

        <div class="flex items-center justify-between">

            <Heading
                title="Users"
                description="Manage users"
            />

            <Button @click="openCreate">
                <Plus class="mr-2 h-4 w-4" />
                New User
            </Button>

        </div>


        <!-- ==========================================================
             Data Table
        =========================================================== -->

        <div class="mt-6">

            <SimpleTable
                ref="tableRef"
                :fetch-url="data().url"
                :columns="columns"
                searchable
                enable-cache
            >

                <!-- ==================================================
                     Actions Column
                =================================================== -->

                <template v-slot:[`cell-actions`]="{ row }">

                    <div class="inline-flex items-center gap-2">

                        <!-- Edit -->
                        <Button
                            variant="outline"
                            size="icon"
                            title="Edit user"
                            @click="openEdit(row)"
                        >
                            <Pencil class="h-4 w-4" />
                        </Button>


                        <!-- Delete -->
                        <Button
                            variant="destructive"
                            size="icon"
                            title="Delete user"
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
            title="Create New User"
            content-class="sm:max-w-2xl"
            description="Add a new user to the system."
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
                    :roles="roles"
                    :submit-action="store()"
                    submit-label="Create User"
                    :on-cancel="close"
                    @success="handleCreateSuccess"
                />

            </template>

        </FormDialog>


        <!-- ==========================================================
             Edit Dialog
        =========================================================== -->

        <FormDialog
            :open="!!editingUser"
            title="Edit User"
            content-class="sm:max-w-2xl"
            :description="
                editingUser
                    ? `Update ${editingUser.name} details.`
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
                    v-if="editingUser"
                    :roles="roles"
                    :user="editingUser"
                    :submit-action="update(editingUser.id)"
                    submit-label="Save Changes"
                    :on-cancel="close"
                    @success="handleEditSuccess"
                />

            </template>

        </FormDialog>

    </div>

</template>
