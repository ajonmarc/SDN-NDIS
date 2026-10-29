<script setup lang="ts">
import { Form, Head } from '@inertiajs/vue3';
import { CheckCircle2, LogIn } from '@lucide/vue';
import InputError from '@/components/InputError.vue';
import PasswordInput from '@/components/PasswordInput.vue';
import TextLink from '@/components/TextLink.vue';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

defineOptions({
    layout: {
        title: 'Sign in to SDN-NDIS',
        description: 'Enter your credentials to access your disaster management portal',
    },
});

defineProps<{
    status?: string;
    canResetPassword: boolean;
}>();
</script>

<template>
    <Head title="Log in" />

    <Alert v-if="status" class="mb-5 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 class="h-4 w-4" />
        <AlertDescription>{{ status }}</AlertDescription>
    </Alert>

    <Form
        v-bind="store.form()"
        :reset-on-success="['password']"
        v-slot="{ errors, processing }"
        class="flex flex-col gap-5"
    >
        <div class="grid gap-5">
            <div class="grid gap-2">
                <Label for="email">Email Address</Label>
                <Input
                    id="email"
                    type="email"
                    name="email"
                    required
                    autofocus
                    :tabindex="1"
                    autocomplete="email"
                    placeholder="name@example.com"
                />
                <InputError :message="errors.email" />
            </div>

            <div class="grid gap-2">
                <div class="flex items-center justify-between">
                    <Label for="password">Password</Label>
                    <TextLink
                        v-if="canResetPassword"
                        :href="request()"
                        class="text-xs"
                        :tabindex="5"
                    >
                        Forgot password?
                    </TextLink>
                </div>
                <PasswordInput
                    id="password"
                    name="password"
                    required
                    :tabindex="2"
                    autocomplete="current-password"
                    placeholder="Enter your password"
                />
                <InputError :message="errors.password" />
            </div>

            <div class="flex items-center justify-between">
                <Label for="remember" class="flex items-center space-x-2.5 text-sm font-normal cursor-pointer">
                    <Checkbox id="remember" name="remember" :tabindex="3" />
                    <span>Keep me signed in</span>
                </Label>
            </div>

            <Button
                type="submit"
                class="mt-1 w-full"
                size="lg"
                :tabindex="4"
                :disabled="processing"
                data-test="login-button"
            >
                <Spinner v-if="processing" />
                <LogIn v-else class="mr-2 h-4 w-4" />
                Sign In
            </Button>
        </div>

        <Separator />

        <div class="text-center text-sm text-muted-foreground">
            Don't have an account yet?
            <TextLink :href="register()" :tabindex="5" class="font-medium">
                Create a Guest Account
            </TextLink>
        </div>
    </Form>
</template>
