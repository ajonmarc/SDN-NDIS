const SWAL_CDN_URL =
    'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.esm.all.min.js';

export const SWAL_SESSION_KEY = 'sweetalert2-message';

const CALLBACK_OPTIONS = [
    'didOpen',
    'didClose',
    'didDestroy',
    'willOpen',
    'willClose',
    'didRender',
    'preDeny',
    'preConfirm',
    'inputValidator',
    'inputOptions',
];

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Swal?: any;
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getSwal(): Promise<any> {
    if (typeof window !== 'undefined' && window.Swal) {
        return window.Swal;
    }

    try {
        const mod = await import(/* @vite-ignore */ SWAL_CDN_URL);
        if (typeof window !== 'undefined') {
            window.Swal = mod.default;
        }
        return mod.default;
    } catch (error) {
        console.error('Failed to load SweetAlert2:', error);
        return { fire: async () => ({ isConfirmed: false }) };
    }
}

const isValidCallback = (callback: string): boolean =>
    /^\s*(?:async\s+)?function\b|^\s*(?:async\s*)?\([^)]*\)\s*=>|^\s*(?:async\s*)?[A-Za-z_$][A-Za-z0-9_$]*\s*=>/.test(
        callback,
    );

export async function fireSwalOptions(
    sweetalert2Data: Record<string, unknown>,
): Promise<void> {
    const Swal = await getSwal();
    const options: Record<string, unknown> = { ...sweetalert2Data };

    CALLBACK_OPTIONS.forEach((callback) => {
        if (typeof options[callback] === 'string') {
            const raw = options[callback] as string;
            if (!isValidCallback(raw)) {
                delete options[callback];
                return;
            }

            try {
                const sanitized = raw
                    .replace(/<\/script/gi, '<\\/script')
                    .replace(/<\/style/gi, '<\\/style');
                options[callback] = new Function('return ' + sanitized)();
            } catch (e) {
                console.error(`Failed to parse ${callback} callback:`, e);
                delete options[callback];
            }
        }
    });

    await Swal.fire(options);
}

