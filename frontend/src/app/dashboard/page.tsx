'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Heatmap } from '@/components/Heatmap';
import { SummaryCards } from '@/components/SummaryCards';
import { Header } from '@/components/Header';

interface Summary {
  totalEmployees: number;
  totalSkills: number;
  totalAssessments: number;
  averageScore: number;
}

interface HeatmapData {
  employees: any[];
  skills: any[];
  heatmap: any[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check auth first
        const authResponse = await api.get('/auth/me');
        if (!authResponse.data.isAuthenticated) {
          router.push('/login');
          return;
        }

        // Fetch dashboard data
        const [summaryRes, heatmapRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/heatmap'),
        ]);

        setSummary(summaryRes.data.data);
        setHeatmapData(heatmapRes.data.data);
      } catch (err: any) {
        if (err.response?.status === 401) {
          router.push('/login');
        } else {
          setError('Failed to load dashboard data');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Summary Cards */}
        {summary && <SummaryCards summary={summary} />}

        {/* Heatmap */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Skills Heatmap
          </h2>
          {heatmapData && <Heatmap data={heatmapData} />}
        </div>
      </main>
    </div>
  );
}

