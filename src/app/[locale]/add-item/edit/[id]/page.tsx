// src/app/add-item/edit/[id]/page.tsx - Redirect to correct edit listing URL
'use client';

import { useRouter } from '@/i18n/navigation';
import { useEffect, use } from 'react';

export default function RedirectToEditListing({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: listingId } = use(params);

  useEffect(() => {
    // Redirect to the correct edit listing URL
    if (listingId) {
      router.replace(`/edit-listing/${listingId}`);
    } else {
      router.replace('/');
    }
  }, [listingId, router]);

  return (
    <div className="min-h-screen bg-[#F5F4F2] flex items-center justify-center">
      <div className="text-gray-800 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700 mx-auto mb-4"></div>
        <p>Redirecting to edit listing...</p>
      </div>
    </div>
  );
}
