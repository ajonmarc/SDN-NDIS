<script setup lang="ts">
/*
|--------------------------------------------------------------------------
| Imports
|--------------------------------------------------------------------------
*/

import { Head, Link, router } from '@inertiajs/vue3';
import { ref } from 'vue';

import SimpleTable from '@kikiloaw/simple-table';
import { Pencil, Plus, Trash2 } from '@lucide/vue';

import Heading from '@/components/Heading.vue';
import { Button } from '@/components/ui/button';
import { getSwal } from '@/lib/swal';

import {
    index,
    create,
    edit,
    destroy,
    data,
} from '@/routes/pdrrmo/users';


/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

interface User {
    id: number;
    name: string;
    email: string;
    role: {
        id: number;
        name: string;
    } | null;
}


/*
|--------------------------------------------------------------------------
| State
|--------------------------------------------------------------------------
*/

// SimpleTable reference
const tableRef = ref();

// Prevent duplicate delete requests
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
            // Refresh SimpleTable data
            tableRef.value?.clearCache('current');
        },

        onFinish: () => {
            // Allow another delete request
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

            <Heading title="Users" description="Manage users" />

            <!-- Create -->
            <Button as-child>
                <Link :href="create()">
                    <Plus class="mr-2 h-4 w-4" />
                    New User
                </Link>
            </Button>

        </div>


        <!-- ==========================================================
             Data Table
        =========================================================== -->

        <div class="mt-6">

            <SimpleTable ref="tableRef" :fetch-url="data().url" :columns="columns" searchable enable-cache>

                <!-- ==================================================
                     Actions Column
                =================================================== -->

                <template v-slot:[`cell-actions`]="{ row }">

                    <div class="inline-flex items-center gap-2">
                        <!-- Edit -->
                        <Button as-child variant="outline" size="icon" title="Edit user">
                            <Link :href="edit(row.id).url">
                                <Pencil class="h-4 w-4" />
                            </Link>
                        </Button>

                        <!-- Delete -->
                        <Button variant="destructive" size="icon" title="Delete user" :disabled="deleting"
                            @click="confirmDelete(row)">
                            <Trash2 class="h-4 w-4" />
                        </Button>

                    </div>

                </template>

            </SimpleTable>

        </div>

    </div>
</template>
