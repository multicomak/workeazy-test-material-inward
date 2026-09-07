import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SetupNotice() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Supabase is not configured</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Set <code className="font-mono text-foreground">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
          <code className="font-mono text-foreground">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{' '}
          <code className="font-mono text-foreground">.env.local</code>, then apply the
          migrations in <code className="font-mono text-foreground">supabase/migrations/</code>.
        </p>
        <p>
          See <code className="font-mono text-foreground">.env.example</code> and{' '}
          <Link href="https://supabase.com/docs/guides/local-development" className="underline">
            the Supabase CLI docs
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  );
}

export function ErrorNotice({ title, message }: { title: string; message: string }) {
  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
