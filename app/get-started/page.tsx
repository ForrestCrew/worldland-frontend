'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect to GPU marketplace
export default function GetStartedPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/rent');
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-gray-500">Redirecting...</div>
    </div>
  );
}
