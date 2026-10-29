<script setup lang="ts">
/*
|--------------------------------------------------------------------------
| Imports
|--------------------------------------------------------------------------
*/

import { Head, router } from '@inertiajs/vue3';
import { ref } from 'vue';

import SimpleTable from '@kikiloaw/simple-table';
import { Trash2 } from '@lucide/vue';

import Heading from '@/components/Heading.vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getSwal } from '@/lib/swal';


/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

interface AccessLog {
    id: number;
    user_id: number | null;
    user_name: string;
    user_email: string | null;
    user_role: string | null;
    event_type: string;
    ip_address: string;
    accessed_at: string;
}


/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

const indexUrl = '/pdrrmo/access-logs';
const dataUrl = '/pdrrmo/access-logs/data';
const destroyUrl = (id: number) => `/pdrrmo/access-logs/${id}`;


/*
|--------------------------------------------------------------------------
| State
|--------------------------------------------------------------------------
*/

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
        key: 'user_name',
        label: 'User / Visitor',
        sortable: false,
    },
    {
        key: 'event_type',
        label: 'Event Type',
        sortable: true,
    },
    {
        key: 'ip_address',
        label: 'IP Address',
        sortable: true,
    },
    {
        key: 'accessed_at',
        label: 'Accessed At',
        sortable: true,
    },
    {
        key: 'actions',
        label: 'Actions',
        sortable: false,
        width: '90px',
    },
];


/*
|--------------------------------------------------------------------------
| Badge Helpers
|--------------------------------------------------------------------------
*/

const eventVariant = (eventType: string) => {
    switch (eventType) {
        case 'LOGIN':
            return 'default' as const;
        case 'LOGOUT':
            return 'secondary' as const;
        default:
            return 'outline' as const;
    }
};


/*
|--------------------------------------------------------------------------
| Delete Actions
|--------------------------------------------------------------------------
*/

const confirmDelete = async (log: AccessLog) => {
    if (deleting.value) {
        return;
    }

    const Swal = await getSwal();

    const result = await Swal.fire({
        title: 'Delete access log?',
        html: `This will permanently delete log entry <strong>#${log.id}</strong> (${log.event_type}).<br>This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, delete log!',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
    });

    if (!result.isConfirmed) {
        return;
    }

    deleting.value = true;

    router.delete(destroyUrl(log.id), {
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
                title: 'Access Logs',
            },
        ],
    },
});
</script>


<template>

    <Head title="Access Logs" />

    <div class="px-4 py-6">

        <!-- ==========================================================
             Page Header
        =========================================================== -->

        <div class="flex items-center justify-between">

            <Heading
                title="Access Logs"
                description="Audit trail of user logins, logouts, and anonymous guest visits across the system."
            />

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

                <!-- User / Visitor Column -->
                <template v-slot:[`cell-user_name`]="{ row }">
                    <div v-if="row.user_id">
                        <div class="flex items-center gap-2">
                            <span class="font-medium">{{ row.user_name }}</span>
                            <Badge v-if="row.user_role" variant="secondary">
                                {{ row.user_role }}
                            </Badge>
                        </div>
                        <div class="text-xs text-muted-foreground">
                            {{ row.user_email }}
                        </div>
                    </div>
                    <div v-else>
                        <Badge variant="outline">Anonymous Visitor</Badge>
                    </div>
                </template>

                <!-- Event Type Column -->
                <template v-slot:[`cell-event_type`]="{ row }">
                    <Badge :variant="eventVariant(row.event_type)">
                        {{ row.event_type }}
                    </Badge>
                </template>

                <!-- IP Address Column -->
                <template v-slot:[`cell-ip_address`]="{ row }">
                    <code class="rounded bg-muted px-2 py-0.5 text-xs">
                        {{ row.ip_address }}
                    </code>
                </template>

                <!-- Accessed At Column -->
                <template v-slot:[`cell-accessed_at`]="{ row }">
                    <span class="text-sm">
                        {{ row.accessed_at }}
                    </span>
                </template>

                <!-- Actions Column -->
                <template v-slot:[`cell-actions`]="{ row }">

                    <div class="inline-flex items-center gap-2">

                        <!-- Delete -->
                        <Button
                            variant="destructive"
                            size="icon"
                            title="Delete access log"
                            :disabled="deleting"
                            @click="confirmDelete(row)"
                        >
                            <Trash2 class="h-4 w-4" />
                        </Button>

                    </div>

                </template>

            </SimpleTable>

        </div>

    </div>

</template>
