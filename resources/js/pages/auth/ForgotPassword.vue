<script setup lang="ts">
import { Form, Head } from '@inertiajs/vue3';
import { CheckCircle2, Mail } from '@lucide/vue';
import InputError from '@/components/InputError.vue';
import TextLink from '@/components/TextLink.vue';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { login } from '@/routes';
import { email } from '@/routes/password';

defineOptions({
    layout: {
        title: 'Forgot Password',
        description: 'Enter your registered email address to receive a password reset link',
    },
});

defineProps<{
    status?: string;
}>();
</script>

<template>
    <Head title="Forgot password" />

    <Alert v-if="status" class="mb-5 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 class="h-4 w-4" />
        <AlertDescription>{{ status }}</AlertDescription>
    </Alert>

    <div class="space-y-5">
        <Form v-bind="email.form()" v-slot="{ errors, processing }" class="space-y-5">
            <div class="grid gap-2">
                <Label for="email">Email Address</Label>
                <Input
                    id="email"
                    type="email"
                    name="email"
                    autocomplete="off"
                    autofocus
                    placeholder="name@example.com"
                />
                <InputError :message="errors.email" />
            </div>

            <Button
                class="w-full"
                size="lg"
                :disabled="processing"
                data-test="email-password-reset-link-button"
            >
                <Spinner v-if="processing" />
                <Mail v-else class="mr-2 h-4 w-4" />
                Send Password Reset Link
            </Button>
        </Form>

        <Separator />

        <div class="space-x-1 text-center text-sm text-muted-foreground">
            <span>Remembered your password?</span>
            <TextLink :href="login()" class="font-medium">Return to sign in</TextLink>
        </div>
    </div>
</template>
