import { router } from '@inertiajs/vue3';
import { toast } from 'vue-sonner';
import { fireSwalOptions, getSwal, SWAL_SESSION_KEY } from '@/lib/swal';
import type { FlashToast } from '@/types/ui';

export function initializeFlashToast(): void {
    // Preload SweetAlert2 so confirmation modals open instantaneously
    void getSwal();

    // Handle SweetAlert2 flash messages on all successful Inertia responses
    // (including same-URL form submissions like /settings/profile where inertia:navigate does not fire)
    document.addEventListener('inertia:success', (event) => {
        const page = (event as CustomEvent).detail?.page;
        const sweetalert2Data = page?.props?.flash?.[SWAL_SESSION_KEY];

        if (sweetalert2Data && typeof sweetalert2Data === 'object') {
            // Remove key after reading so inertia:navigate does not fire a duplicate popup
            delete page.props.flash[SWAL_SESSION_KEY];
            void fireSwalOptions(sweetalert2Data as Record<string, unknown>);
        }
    });

    router.on('flash', (event) => {
        const flash = (event as CustomEvent).detail?.flash;
        const data = flash?.toast as FlashToast | undefined;

        if (!data) return;

        toast[data.type](data.message, {
            description: data.description,
            duration: data.duration ?? 4000,
            class: 'my-custom-toast', // hook for your own CSS
        });
    });
}
