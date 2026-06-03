'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

export default function ClearJobsButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClear = async () => {
    if (!confirm('Are you sure you want to delete ALL scraped jobs? This action cannot be undone.')) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/jobs/clear', {
        method: 'POST',
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to clear jobs');
      }

      router.refresh(); // Refresh the page to update the list
    } catch (error) {
      console.error('Clear jobs error:', error);
      alert('An error occurred while clearing jobs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClear}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-md font-medium transition-colors disabled:opacity-50"
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
      <span>{loading ? 'Clearing...' : 'Clear All Jobs'}</span>
    </button>
  );
}
