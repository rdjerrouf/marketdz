// src/app/add-item/edit/[id]/page.tsx - Redirect to correct edit listing URL
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RedirectToEditListing() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;

  useEffect(() => {
    // Redirect to the correct edit listing URL
    if (listingId) {
      router.replace(`/edit-listing/${listingId}`);
    } else {
      router.replace('/');
    }
  }, [listingId, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p>Redirecting to edit listing...</p>
      </div>
    </div>
  );
}
