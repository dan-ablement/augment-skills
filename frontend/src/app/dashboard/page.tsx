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
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import type { HierarchyNode, SummaryData } from '@/types/hierarchy';
import type { ViewState } from '@/components/SavedViewsDropdown';

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
  const [isAdmin, setIsAdmin] = useState(true);
  const [showUpdatedToast, setShowUpdatedToast] = useState(false);

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

      // Extract user role info
      const userRole = authResponse.data.user?.role;
      setIsAdmin(userRole === 'admin');

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

  // Auto-refresh with idle detection
  const { hasNewData, dismissBanner, manualRefresh } = useAutoRefresh({
    refresh: async () => {
      await fetchData();
      setShowUpdatedToast(true);
      setTimeout(() => setShowUpdatedToast(false), 3000);
    },
    intervalMs: 60000,
    idleThresholdMs: 180000,
  });

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

  // Load a saved view by restoring all filter state
  const handleLoadView = useCallback((state: ViewState) => {
    filters.setScoringMode(state.scoringMode);
    filters.setSkills(state.skills);
    filters.setRoles(state.roles);
    filters.setManagerId(state.managerId);
    filters.setNotAssessed(state.notAssessed);
  }, [filters]);

  // Team isolation: set managerId in filter state
  const handleIsolateManager = useCallback((managerId: number | null) => {
    filters.setManagerId(managerId);
  }, [filters]);

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

  // Build current view state for saved views
  const currentViewState: ViewState = {
    scoringMode: filters.scoringMode,
    skills: filters.skills,
    roles: filters.roles,
    managerId: filters.managerId,
    notAssessed: filters.notAssessed,
  };

  const handleManualRefresh = useCallback(() => {
    dismissBanner();
    manualRefresh();
  }, [dismissBanner, manualRefresh]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        scoringMode={filters.scoringMode}
        onScoringModeChange={filters.setScoringMode}
        onCollapseAll={filters.triggerCollapseAll}
        filterPanelOpen={filters.filterPanelOpen}
        onToggleFilterPanel={filters.toggleFilterPanel}
        hasActiveFilters={filters.hasActiveFilters}
        onExportCsv={() => {
          const qs = buildApiParams({ scoringMode: filters.scoringMode, skills: filters.skills, roles: filters.roles, managerId: filters.managerId, notAssessed: filters.notAssessed });
          window.open(`/api/v1/export/csv${qs}`, '_blank');
        }}
        onExportPdf={() => {
          const qs = buildApiParams({ scoringMode: filters.scoringMode, skills: filters.skills, roles: filters.roles, managerId: filters.managerId, notAssessed: filters.notAssessed });
          window.open(`/api/v1/export/pdf${qs}`, '_blank');
        }}
        currentViewState={currentViewState}
        onLoadView={handleLoadView}
        onManualRefresh={handleManualRefresh}
        isAdmin={isAdmin}
      />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* New data available banner */}
        {hasNewData && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-blue-800">New data available — click to refresh</span>
            <button
              onClick={handleManualRefresh}
              className="ml-4 px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
            >
              Refresh
            </button>
          </div>
        )}

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
        {summary && <SummaryCards summary={summary} scoringMode={filters.scoringMode} />}

        {/* Heatmap */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Skills Heatmap
          </h2>
          {hierarchyData && (
            <Heatmap
              data={hierarchyData}
              collapseAll={filters.collapseAll}
              isolatedManagerId={filters.managerId}
              onIsolateManager={handleIsolateManager}
            />
          )}
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
        isAdmin={isAdmin}
      />

      {/* Auto-refresh toast */}
      {showUpdatedToast && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50 animate-fade-in">
          Dashboard updated
        </div>
      )}
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

