'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect instances to rental sessions
export default function InstancesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/rent/sessions');
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-gray-500">Redirecting...</div>
    </div>
  );
}
