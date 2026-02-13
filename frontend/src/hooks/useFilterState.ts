'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export type ScoringMode = 'average' | 'team_readiness' | 'coverage';
export type NotAssessedHandling = 'exclude' | 'count_as_zero';

export interface FilterState {
  scoringMode: ScoringMode;
  skills: number[];
  roles: string[];
  managerId: number | null;
  notAssessed: NotAssessedHandling;
  filterPanelOpen: boolean;
  collapseAll: boolean;
}

export interface FilterActions {
  setScoringMode: (mode: ScoringMode) => void;
  setSkills: (skills: number[]) => void;
  addSkill: (skillId: number) => void;
  removeSkill: (skillId: number) => void;
  setRoles: (roles: string[]) => void;
  addRole: (role: string) => void;
  removeRole: (role: string) => void;
  setManagerId: (id: number | null) => void;
  setNotAssessed: (handling: NotAssessedHandling) => void;
  toggleFilterPanel: () => void;
  setFilterPanelOpen: (open: boolean) => void;
  triggerCollapseAll: () => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
}

export function useFilterState(): FilterState & FilterActions {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state = useMemo<FilterState>(() => {
    const scoringMode = (searchParams.get('scoring_mode') as ScoringMode) || 'average';
    const skillsParam = searchParams.get('skills');
    const rolesParam = searchParams.get('roles');
    const managerIdParam = searchParams.get('manager_id');
    const notAssessed = (searchParams.get('not_assessed') as NotAssessedHandling) || 'exclude';
    const filterPanelOpen = searchParams.get('filters') === 'open';
    const collapseAll = searchParams.get('collapse_all') === 'true';

    return {
      scoringMode,
      skills: skillsParam ? skillsParam.split(',').map(Number).filter(n => !isNaN(n)) : [],
      roles: rolesParam ? rolesParam.split(',').filter(Boolean) : [],
      managerId: managerIdParam ? parseInt(managerIdParam, 10) : null,
      notAssessed,
      filterPanelOpen,
      collapseAll,
    };
  }, [searchParams]);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const setScoringMode = useCallback(
    (mode: ScoringMode) => updateParams({ scoring_mode: mode === 'average' ? null : mode }),
    [updateParams]
  );

  const setSkills = useCallback(
    (skills: number[]) => updateParams({ skills: skills.length ? skills.join(',') : null }),
    [updateParams]
  );

  const addSkill = useCallback(
    (skillId: number) => {
      if (state.skills.includes(skillId)) return;
      setSkills([...state.skills, skillId]);
    },
    [state.skills, setSkills]
  );

  const removeSkill = useCallback(
    (skillId: number) => setSkills(state.skills.filter(id => id !== skillId)),
    [state.skills, setSkills]
  );

  const setRoles = useCallback(
    (roles: string[]) => updateParams({ roles: roles.length ? roles.join(',') : null }),
    [updateParams]
  );

  const addRole = useCallback(
    (role: string) => {
      if (state.roles.includes(role)) return;
      setRoles([...state.roles, role]);
    },
    [state.roles, setRoles]
  );

  const removeRole = useCallback(
    (role: string) => setRoles(state.roles.filter(r => r !== role)),
    [state.roles, setRoles]
  );

  const setManagerId = useCallback(
    (id: number | null) => updateParams({ manager_id: id !== null ? String(id) : null }),
    [updateParams]
  );

  const setNotAssessed = useCallback(
    (handling: NotAssessedHandling) =>
      updateParams({ not_assessed: handling === 'exclude' ? null : handling }),
    [updateParams]
  );

  const toggleFilterPanel = useCallback(
    () => updateParams({ filters: state.filterPanelOpen ? null : 'open' }),
    [updateParams, state.filterPanelOpen]
  );

  const setFilterPanelOpen = useCallback(
    (open: boolean) => updateParams({ filters: open ? 'open' : null }),
    [updateParams]
  );

  const triggerCollapseAll = useCallback(() => {
    // Set collapse_all=true briefly, then remove it (it's a trigger, not persistent state)
    updateParams({ collapse_all: 'true' });
    setTimeout(() => updateParams({ collapse_all: null }), 100);
  }, [updateParams]);

  const clearAllFilters = useCallback(
    () =>
      updateParams({
        scoring_mode: null,
        skills: null,
        roles: null,
        manager_id: null,
        not_assessed: null,
      }),
    [updateParams]
  );

  const hasActiveFilters = state.skills.length > 0 || state.roles.length > 0 || state.managerId !== null;

  return { ...state, setScoringMode, setSkills, addSkill, removeSkill, setRoles, addRole, removeRole, setManagerId, setNotAssessed, toggleFilterPanel, setFilterPanelOpen, triggerCollapseAll, clearAllFilters, hasActiveFilters };
}

