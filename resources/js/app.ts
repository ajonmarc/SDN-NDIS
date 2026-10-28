import { createInertiaApp } from '@inertiajs/vue3';
import { initializeTheme as initializeAppearance } from '@/composables/useAppearance';
import { initializeTheme as initializeColorTheme } from '@/composables/useTheme';
import AppLayout from '@/layouts/AppLayout.vue';
import AuthLayout from '@/layouts/AuthLayout.vue';
import SettingsLayout from '@/layouts/settings/Layout.vue';
import { initializeFlashToast } from '@/lib/flashToast';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'Welcome':
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    progress: {
        color: '#4B5563',
    },
});

// Client-only setup - never runs during SSR
if (typeof window !== 'undefined') {
    // This will set light / dark mode on page load...
    initializeAppearance();

    // This will set the color theme (Surigao, Sunburst, etc.) on page load...
    initializeColorTheme();

    // This will listen for flash toast data from the server...
    initializeFlashToast();
}