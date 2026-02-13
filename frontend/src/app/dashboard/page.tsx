'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Heatmap } from '@/components/Heatmap';
import { SummaryCards } from '@/components/SummaryCards';
import { Header } from '@/components/Header';
import { FilterPanel } from '@/components/FilterPanel';
import { FilterSummaryBar } from '@/components/FilterSummaryBar';
import { useFilterState } from '@/hooks/useFilterState';
import type { HierarchyNode, SummaryData } from '@/types/hierarchy';

/**
 * Build query string from filter state for the hierarchy & summary APIs.
 */
function buildApiParams(filters: {
  scoringMode: string;
  skills: number[];
  roles: string[];
  managerId: number | null;
  notAssessed: string;
}): string {
  const params = new URLSearchParams();
  if (filters.scoringMode !== 'average') {
    params.set('scoring_mode', filters.scoringMode);
  }
  if (filters.skills.length > 0) {
    params.set('skills', filters.skills.join(','));
  }
  if (filters.roles.length > 0) {
    params.set('roles', filters.roles.join(','));
  }
  if (filters.managerId !== null) {
    params.set('manager_id', String(filters.managerId));
  }
  if (filters.notAssessed !== 'exclude') {
    params.set('not_assessed', filters.notAssessed);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

function DashboardContent() {
  const router = useRouter();
  const filters = useFilterState();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [hierarchyData, setHierarchyData] = useState<HierarchyNode[] | null>(null);
  const [skillNames, setSkillNames] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Track previous filter values to detect changes
  const prevFiltersRef = useRef<string>('');

  const fetchData = useCallback(async () => {
    try {
      // Check auth first
      const authResponse = await api.get('/auth/me');
      if (!authResponse.data.isAuthenticated) {
        router.push('/login');
        return;
      }

      const qs = buildApiParams({
        scoringMode: filters.scoringMode,
        skills: filters.skills,
        roles: filters.roles,
        managerId: filters.managerId,
        notAssessed: filters.notAssessed,
      });

      // Fetch dashboard data from hierarchy + summary APIs (+ skills for filter labels)
      const [summaryRes, hierarchyRes, skillsRes] = await Promise.all([
        api.get(`/dashboard/summary${qs}`),
        api.get(`/dashboard/hierarchy${qs}`),
        api.get('/skills', { params: { limit: 200 } }),
      ]);

      setSummary(summaryRes.data.data);
      setHierarchyData(hierarchyRes.data.data);
      const skills = skillsRes.data.data?.skills || skillsRes.data.skills || [];
      setSkillNames(skills.map((s: any) => ({ id: s.id, name: s.name })));
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/login');
      } else {
        setError('Failed to load dashboard data');
      }
    } finally {
      setIsLoading(false);
    }
  }, [router, filters.scoringMode, filters.skills, filters.roles, filters.managerId, filters.notAssessed]);

  // Fetch on mount and when filters change
  useEffect(() => {
    const filterKey = JSON.stringify({
      scoringMode: filters.scoringMode,
      skills: filters.skills,
      roles: filters.roles,
      managerId: filters.managerId,
      notAssessed: filters.notAssessed,
    });

    if (filterKey !== prevFiltersRef.current) {
      prevFiltersRef.current = filterKey;
      setIsLoading(true);
      fetchData();
    }
  }, [fetchData, filters.scoringMode, filters.skills, filters.roles, filters.managerId, filters.notAssessed]);

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

  // Map summary data to the shape SummaryCards expects
  const summaryForCards = summary
    ? {
        totalEmployees: summary.filtered.totalEmployees,
        totalSkills: summary.filtered.totalSkills,
        totalAssessments: summary.filtered.totalAssessments,
        averageScore: summary.filtered.score ?? 0,
      }
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        scoringMode={filters.scoringMode}
        onScoringModeChange={filters.setScoringMode}
        onCollapseAll={filters.triggerCollapseAll}
        filterPanelOpen={filters.filterPanelOpen}
        onToggleFilterPanel={filters.toggleFilterPanel}
        hasActiveFilters={filters.hasActiveFilters}
      />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Filter Summary Bar */}
        <div className="mb-4">
          <FilterSummaryBar
            scoringMode={filters.scoringMode}
            selectedSkills={filters.skills}
            selectedRoles={filters.roles}
            managerId={filters.managerId}
            notAssessed={filters.notAssessed}
            hasActiveFilters={filters.hasActiveFilters}
            skillNames={skillNames}
            onRemoveSkill={filters.removeSkill}
            onRemoveRole={filters.removeRole}
            onClearManagerId={() => filters.setManagerId(null)}
            onClearAll={filters.clearAllFilters}
          />
        </div>

        {/* Summary Cards */}
        {summaryForCards && <SummaryCards summary={summaryForCards} />}

        {/* Heatmap */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Skills Heatmap
          </h2>
          {hierarchyData && <Heatmap data={hierarchyData} />}
        </div>
      </main>

      {/* Filter Panel (slides in from right) */}
      <FilterPanel
        isOpen={filters.filterPanelOpen}
        onClose={() => filters.setFilterPanelOpen(false)}
        selectedSkills={filters.skills}
        selectedRoles={filters.roles}
        managerId={filters.managerId}
        notAssessed={filters.notAssessed}
        onAddSkill={filters.addSkill}
        onRemoveSkill={filters.removeSkill}
        onAddRole={filters.addRole}
        onRemoveRole={filters.removeRole}
        onSetManagerId={filters.setManagerId}
        onSetNotAssessed={filters.setNotAssessed}
        onClearAll={filters.clearAllFilters}
      />
    </div>
  );
}

/**
 * Dashboard page wrapped in Suspense for useSearchParams compatibility.
 * Next.js App Router requires Suspense around components using useSearchParams.
 */
export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

