'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface WebFormActionButtonsProps {
  jobId: string;
  url: string;
}

export default function WebFormActionButtons({ jobId, url }: WebFormActionButtonsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleMarkApplied = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/jobs/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: jobId, status: 'applied' }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      router.refresh();
    } catch (error) {
      console.error('Error marking as applied:', error);
      alert('Failed to mark as applied.');
      setLoading(false); // only stop loading if it failed, otherwise it unmounts anyway on refresh
    }
  };

  return (
    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex justify-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
      >
        Apply Manually
      </a>
      <button
        onClick={handleMarkApplied}
        disabled={loading}
        className="inline-flex justify-center px-3 py-1.5 border border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-300 bg-transparent hover:bg-gray-700 focus:outline-none disabled:opacity-50"
      >
        {loading ? 'Updating...' : 'Mark Applied'}
      </button>
    </div>
  );
}
