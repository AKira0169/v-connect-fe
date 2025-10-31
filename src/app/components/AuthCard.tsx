'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface AuthCardProps {
  title: string;
  children: React.ReactNode;
  footerText?: string;
  footerLink?: { label: string; href: string };
}

export function AuthCard({
  title,
  children,
  footerText,
  footerLink,
}: AuthCardProps) {
  return (
    <div className="bg-muted/30 flex min-h-screen w-full items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
        {footerText && footerLink && (
          <p className="text-muted-foreground mt-6 text-center text-sm">
            {footerText}{' '}
            <Link
              href={footerLink.href}
              className="text-primary hover:underline"
            >
              {footerLink.label}
            </Link>
          </p>
        )}
      </Card>
    </div>
  );
}
