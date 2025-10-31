'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, loginFormType } from '@/types/login/loginSchema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { useLogin } from '@/app/hooks/useAuth';
import { AuthCard } from '@/app/components/AuthCard';
import { PasswordInput } from '@/app/components/PasswordInput';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login, isPending, error } = useLogin();

  const form = useForm<loginFormType>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: loginFormType) => {
    await login(data, {
      onSuccess: () => {
        toast.success('Welcome back 👋 You have logged in successfully.');
      },
      onError: (err: any) => {
        toast.error(err?.message || 'Invalid credentials. Try again.');
      },
    });
  };

  return (
    <AuthCard
      title="Welcome back 👋"
      footerText="Don't have an account?"
      footerLink={{ label: 'Sign up', href: '/signup' }}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <Label>Email</Label>
                <FormControl>
                  <Input placeholder="email@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <Label>Password</Label>
                <FormControl>
                  <PasswordInput placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Logging in...' : 'Login'}
          </Button>

          {error && (
            <p className="text-destructive mt-2 text-center text-sm">
              {error.message}
            </p>
          )}
        </form>
      </Form>
    </AuthCard>
  );
}
