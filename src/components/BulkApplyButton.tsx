'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface BulkApplyButtonProps {
  jobIds: string[];
}

export default function BulkApplyButton({ jobIds }: BulkApplyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ total: number; successful: number; failed: number } | null>(null);
  const router = useRouter();

  const handleBulkApply = async () => {
    if (jobIds.length === 0) return;
    
    if (!confirm(`Are you sure you want to bulk apply to ${jobIds.length} jobs? This will generate cover letters and send emails automatically.`)) {
      return;
    }

    setLoading(true);
    setProgress({ total: jobIds.length, successful: 0, failed: 0 });

    try {
      const res = await fetch('/api/bulk-dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobIds }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch bulk application');
      }

      setProgress({
        total: jobIds.length,
        successful: data.successful?.length || 0,
        failed: data.failed?.length || 0
      });

      alert(`Bulk apply completed! Successful: ${data.successful?.length || 0}, Failed: ${data.failed?.length || 0}`);
      router.refresh(); // Refresh the page to update the list
    } catch (error) {
      console.error('Bulk apply error:', error);
      alert('An error occurred during bulk apply. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  if (jobIds.length === 0) {
    return (
      <button disabled className="px-4 py-2 bg-gray-500 text-white rounded-md cursor-not-allowed">
        No Pending Applications
      </button>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={handleBulkApply}
        disabled={loading}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processing {jobIds.length} jobs...</span>
          </>
        ) : (
          <span>⚡ Bulk Apply ({jobIds.length})</span>
        )}
      </button>
      
      {progress && loading && (
        <span className="text-sm text-gray-400">
          Please wait... Do not close this page.
        </span>
      )}
    </div>
  );
}
