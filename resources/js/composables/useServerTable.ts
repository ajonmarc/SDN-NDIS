import { computed, ref, type Ref } from 'vue';
import { router } from '@inertiajs/vue3';
import { useTable, type ColumnDef, type SortingState, type RowSelectionState, type RowData } from '@tanstack/vue-table';
import { appTableFeatures, type AppTableFeatures } from '@/lib/tableFeatures';

type ServerTableOptions<T extends RowData> = {
    data: Ref<T[]>;
    columns: ColumnDef<AppTableFeatures, T>[];
    filterUrl: string;
    sort: Ref<string | undefined>;
    search: Ref<string | undefined>;
    sortableColumns: string[];
    only?: string[];
};

const SORT_PATTERN = /^-?[a-zA-Z]+(,-?[a-zA-Z]+)*$/;

function parseSorting(sort: string | undefined, allowed: string[]): SortingState {
    if (!sort || !SORT_PATTERN.test(sort)) return [];
    return sort
        .split(',')
        .map((part) => ({
            id: part.startsWith('-') ? part.slice(1) : part,
            desc: part.startsWith('-'),
        }))
        .filter((s) => allowed.includes(s.id));
}

function serializeSorting(sorting: SortingState, allowed: string[]): string | undefined {
    const clean = sorting.filter((s) => allowed.includes(s.id));
    return clean.length ? clean.map((s) => (s.desc ? `-${s.id}` : s.id)).join(',') : undefined;
}

export function useServerTable<T extends RowData>({
    data,
    columns,
    filterUrl,
    sort,
    search,
    sortableColumns,
    only,
}: ServerTableOptions<T>) {
    const sorting = computed<SortingState>(() => parseSorting(sort.value, sortableColumns));
    const rowSelection = ref<RowSelectionState>({});

    const table = useTable({
        features: appTableFeatures,
        data,
        columns,
        state: {
            get sorting() {
                return sorting.value;
            },
            get rowSelection() {
                return rowSelection.value;
            },
        },
        enableMultiSort: true,
        manualSorting: true,
        enableRowSelection: true,
        getRowId: (row: T) => String((row as { id: number | string }).id),
        onSortingChange: (updater) => {
            const next = typeof updater === 'function' ? updater(sorting.value) : updater;

            router.post(
                filterUrl,
                { sort: serializeSorting(next, sortableColumns), search: search.value, page: 1 },
                { preserveScroll: true, preserveUrl: true, only }, // ← added preserveUrl: true
            );
        },
        onRowSelectionChange: (updater) => {
            rowSelection.value = typeof updater === 'function' ? updater(rowSelection.value) : updater;
        },
    });

    const runSearch = (value: string) => {
        router.post(filterUrl, { sort: sort.value, search: value || undefined, page: 1 }, {
            preserveScroll: true,
            preserveUrl: true, // ← added
            only,
        });
    };

    return { table, runSearch, rowSelection };
}