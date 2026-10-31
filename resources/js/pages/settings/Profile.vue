<script setup lang="ts">
import { Form, Head, Link, usePage } from '@inertiajs/vue3';
import {
    Calendar,
    Mail,
    MapPin,
    Phone,
    Save,
    ShieldCheck,
    User as UserIcon,
} from '@lucide/vue';
import { computed } from 'vue';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/DeleteUser.vue';
import Heading from '@/components/Heading.vue';
import InputError from '@/components/InputError.vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useInitials } from '@/composables/useInitials';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';

defineOptions({
    layout: {
        breadcrumbs: [
            {
                title: 'Profile Settings',
                href: edit(),
            },
        ],
    },
});

const page = usePage();
const user = computed(() => page.props.auth.user);
const { getInitials } = useInitials();

const roleName = computed(() => user.value?.role?.name ?? 'GUEST');

const roleBadgeClass = computed(() => {
    switch (roleName.value) {
        case 'HEAD':
            return 'border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400';
        case 'PDRRMO':
            return 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400';
        default:
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
    }
});

const formatDate = (value?: string | null) => {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};
</script>

<template>
    <Head title="Profile settings" />

    <h1 class="sr-only">Profile settings</h1>

    <div class="flex flex-col space-y-8">
        <!-- ==========================================================
             Own Profile Details Overview Card
        =========================================================== -->
        <Card class="overflow-hidden border-sidebar-border/70 shadow-xs">
            <CardHeader class="border-b bg-muted/30 pb-5">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div class="flex items-center gap-4">
                        <div
                            class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary ring-1 ring-primary/20"
                        >
                            {{ getInitials(user.name) }}
                        </div>

                        <div>
                            <div class="flex flex-wrap items-center gap-2.5">
                                <CardTitle class="text-xl font-bold">
                                    {{ user.name }}
                                </CardTitle>
                                <Badge variant="outline" :class="roleBadgeClass">
                                    <ShieldCheck class="mr-1 h-3.5 w-3.5" />
                                    {{ roleName }}
                                </Badge>
                                <Badge
                                    v-if="user.is_protected"
                                    variant="secondary"
                                    class="text-xs"
                                >
                                    Protected Account
                                </Badge>
                            </div>
                            <p class="mt-1 text-sm text-muted-foreground">
                                Your current registered profile details in the Surigao del Norte Disaster Information System
                            </p>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent class="pt-5">
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div class="flex items-start gap-3 rounded-lg border bg-background p-3.5">
                        <div class="rounded-md bg-primary/10 p-2 text-primary">
                            <UserIcon class="h-4 w-4" />
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="text-xs font-medium text-muted-foreground">
                                Full Name
                            </p>
                            <p class="mt-0.5 truncate text-sm font-semibold">
                                {{ user.name }}
                            </p>
                        </div>
                    </div>

                    <div class="flex items-start gap-3 rounded-lg border bg-background p-3.5">
                        <div class="rounded-md bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
                            <Mail class="h-4 w-4" />
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="text-xs font-medium text-muted-foreground">
                                Email Address
                            </p>
                            <p class="mt-0.5 truncate text-sm font-semibold">
                                {{ user.email }}
                            </p>
                        </div>
                    </div>

                    <div class="flex items-start gap-3 rounded-lg border bg-background p-3.5">
                        <div class="rounded-md bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                            <Phone class="h-4 w-4" />
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="text-xs font-medium text-muted-foreground">
                                Contact Number
                            </p>
                            <p
                                class="mt-0.5 text-sm font-semibold"
                                :class="!user.contact_number ? 'italic font-normal text-muted-foreground' : ''"
                            >
                                {{ user.contact_number || 'Not provided yet' }}
                            </p>
                        </div>
                    </div>

                    <div class="flex items-start gap-3 rounded-lg border bg-background p-3.5">
                        <div class="rounded-md bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
                            <Calendar class="h-4 w-4" />
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="text-xs font-medium text-muted-foreground">
                                Member Since
                            </p>
                            <p class="mt-0.5 text-sm font-semibold">
                                {{ formatDate(user.created_at) }}
                            </p>
                        </div>
                    </div>

                    <div class="flex items-start gap-3 rounded-lg border bg-background p-3.5 sm:col-span-2">
                        <div class="rounded-md bg-rose-500/10 p-2 text-rose-600 dark:text-rose-400">
                            <MapPin class="h-4 w-4" />
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="text-xs font-medium text-muted-foreground">
                                Full Address
                            </p>
                            <p
                                class="mt-0.5 text-sm font-semibold leading-relaxed"
                                :class="!user.full_address ? 'italic font-normal text-muted-foreground' : ''"
                            >
                                {{ user.full_address || 'Not provided yet' }}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        <!-- ==========================================================
             Edit Profile Form Card
        =========================================================== -->
        <Card class="border-sidebar-border/70 shadow-xs">
            <CardHeader>
                <Heading
                    variant="small"
                    title="Edit Profile Information"
                    description="Update your full name, email address, contact number, and residential address"
                />
            </CardHeader>

            <CardContent>
                <Form
                    v-bind="ProfileController.update.form()"
                    class="space-y-6"
                    v-slot="{ errors, processing }"
                >
                    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div class="grid gap-2">
                            <Label for="name">Full Name</Label>
                            <Input
                                id="name"
                                class="mt-1 block w-full"
                                name="name"
                                :default-value="user.name"
                                required
                                autocomplete="name"
                                placeholder="e.g. Juan Dela Cruz"
                            />
                            <InputError class="mt-1" :message="errors.name" />
                        </div>

                        <div class="grid gap-2">
                            <Label for="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                class="mt-1 block w-full"
                                name="email"
                                :default-value="user.email"
                                required
                                autocomplete="username"
                                placeholder="name@example.com"
                            />
                            <InputError class="mt-1" :message="errors.email" />
                        </div>

                        <div class="grid gap-2 sm:col-span-2">
                            <Label for="contact_number">
                                Contact Number
                                <span class="text-xs font-normal text-muted-foreground">(Optional)</span>
                            </Label>
                            <Input
                                id="contact_number"
                                type="tel"
                                class="mt-1 block w-full"
                                name="contact_number"
                                :default-value="user.contact_number ?? ''"
                                autocomplete="tel"
                                maxlength="20"
                                placeholder="e.g. 0917 123 4567"
                            />
                            <InputError class="mt-1" :message="errors.contact_number" />
                        </div>

                        <div class="grid gap-2 sm:col-span-2">
                            <Label for="full_address">
                                Full Address
                                <span class="text-xs font-normal text-muted-foreground">(Optional)</span>
                            </Label>
                            <Textarea
                                id="full_address"
                                class="mt-1 block w-full"
                                name="full_address"
                                rows="3"
                                :default-value="user.full_address ?? ''"
                                autocomplete="street-address"
                                placeholder="e.g. Purok 1, Brgy. Washington, Surigao City, Surigao del Norte"
                            />
                            <InputError class="mt-1" :message="errors.full_address" />
                        </div>
                    </div>

                    <div v-if="page.props.mustVerifyEmail && !user.email_verified_at">
                        <p class="-mt-2 text-sm text-muted-foreground">
                            Your email address is unverified.
                            <Link
                                :href="send()"
                                as="button"
                                class="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                            >
                                Click here to re-send the verification email.
                            </Link>
                        </p>

                        <div
                            v-if="page.props.status === 'verification-link-sent'"
                            class="mt-2 text-sm font-medium text-green-600"
                        >
                            A new verification link has been sent to your email address.
                        </div>
                    </div>

                    <div class="flex items-center justify-end gap-4 border-t pt-4">
                        <Button :disabled="processing" data-test="update-profile-button">
                            <Spinner v-if="processing" />
                            <Save v-else class="mr-2 h-4 w-4" />
                            Save Profile Changes
                        </Button>
                    </div>
                </Form>
            </CardContent>
        </Card>

        <DeleteUser v-if="!user.is_protected && roleName !== 'HEAD'" />
    </div>
</template>
