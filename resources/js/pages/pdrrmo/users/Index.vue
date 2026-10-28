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

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

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

// Selected record for delete confirmation
const deleteTarget = ref<User | null>(null);

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
 * Open the delete confirmation dialog.
 */
const confirmDelete = (user: User) => {
    deleteTarget.value = user;
};


/**
 * Delete the selected user.
 */
const performDelete = () => {
    // Stop if there is no selected user
    // or a delete request is already running.
    if (!deleteTarget.value || deleting.value) {
        return;
    }

    const userId = deleteTarget.value.id;

    deleting.value = true;

    router.delete(destroy(userId).url, {
        preserveScroll: true,

        onSuccess: () => {
            // Close the confirmation dialog
            deleteTarget.value = null;

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


        <!-- ==========================================================
             Delete Confirmation
        =========================================================== -->

        <Dialog :open="!!deleteTarget" @update:open="(value) => {
            if (!value && !deleting) {
                deleteTarget = null;
            }
        }">

            <DialogContent>

                <!-- Dialog Header -->
                <DialogHeader>

                    <DialogTitle>
                        Delete user?
                    </DialogTitle>

                    <DialogDescription>
                        This will permanently delete
                        <strong>
                            {{ deleteTarget?.name }}
                        </strong>.
                        This action cannot be undone.
                    </DialogDescription>

                </DialogHeader>


                <!-- Dialog Footer -->
                <DialogFooter>

                    <!-- Cancel -->
                    <Button variant="outline" :disabled="deleting" @click="deleteTarget = null">
                        Cancel
                    </Button>


                    <!-- Delete -->
                    <Button variant="destructive" :disabled="deleting" @click="performDelete">

                        <Trash2 v-if="!deleting" class="mr-2 h-4 w-4" />

                        {{ deleting ? 'Deleting...' : 'Delete' }}

                    </Button>

                </DialogFooter>

            </DialogContent>

        </Dialog>

    </div>
</template>