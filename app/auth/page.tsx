import { AuthForm } from '@/components/auth/auth-form';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function AuthPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect('/');
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <AuthForm />
    </div>
  );
}
