'use client';

import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/use-user';

export function AuthNav() {
  const { user } = useUser();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  return (
    <div className='flex justify-end p-4'>
      {user && (
        <div className='flex items-center gap-4'>
          <span className='text-sm text-muted-foreground'>{user.email}</span>
          <Button variant='outline' onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      )}
    </div>
  );
}
