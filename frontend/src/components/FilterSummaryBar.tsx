'use client';

import type { ScoringMode, NotAssessedHandling } from '@/hooks/useFilterState';

interface SkillInfo {
  id: number;
  name: string;
}

interface FilterSummaryBarProps {
  scoringMode: ScoringMode;
  selectedSkills: number[];
  selectedRoles: string[];
  managerId: number | null;
  notAssessed: NotAssessedHandling;
  hasActiveFilters: boolean;
  // Resolved names for display
  skillNames?: SkillInfo[];
  // Actions
  onRemoveSkill: (id: number) => void;
  onRemoveRole: (role: string) => void;
  onClearManagerId: () => void;
  onClearAll: () => void;
}

const SCORING_MODE_LABELS: Record<ScoringMode, string> = {
  average: 'Average',
  team_readiness: 'Team Readiness',
  coverage: 'Coverage %',
};

export function FilterSummaryBar({
  scoringMode,
  selectedSkills,
  selectedRoles,
  managerId,
  notAssessed,
  hasActiveFilters,
  skillNames = [],
  onRemoveSkill,
  onRemoveRole,
  onClearManagerId,
  onClearAll,
}: FilterSummaryBarProps) {
  if (!hasActiveFilters && scoringMode === 'average') {
    return null;
  }

  const getSkillName = (id: number) => {
    const skill = skillNames.find((s) => s.id === id);
    return skill?.name ?? `Skill #${id}`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 flex items-center flex-wrap gap-2">
      {/* Viewing section */}
      <span className="text-xs font-medium text-gray-500 mr-1">Viewing:</span>
      <span className="text-xs text-gray-700">
        {SCORING_MODE_LABELS[scoringMode]} scores
        {managerId !== null && ` · Manager #${managerId}'s team`}
      </span>

      {/* Filters section */}
      {hasActiveFilters && (
        <>
          <div className="w-px h-4 bg-gray-300 mx-1" />
          <span className="text-xs font-medium text-gray-500 mr-1">Filters:</span>

          {/* Skill chips */}
          {selectedSkills.map((skillId) => (
            <span
              key={`skill-${skillId}`}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
            >
              {getSkillName(skillId)}
              <button
                onClick={() => onRemoveSkill(skillId)}
                className="ml-1 text-blue-600 hover:text-blue-800"
                aria-label={`Remove skill filter ${getSkillName(skillId)}`}
              >
                ×
              </button>
            </span>
          ))}

          {/* Role chips */}
          {selectedRoles.map((role) => (
            <span
              key={`role-${role}`}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
            >
              {role}
              <button
                onClick={() => onRemoveRole(role)}
                className="ml-1 text-green-600 hover:text-green-800"
                aria-label={`Remove department filter ${role}`}
              >
                ×
              </button>
            </span>
          ))}

          {/* Manager chip */}
          {managerId !== null && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
              Manager #{managerId}
              <button
                onClick={onClearManagerId}
                className="ml-1 text-purple-600 hover:text-purple-800"
                aria-label="Remove manager filter"
              >
                ×
              </button>
            </span>
          )}

          {/* Not assessed chip (only if non-default) */}
          {notAssessed === 'count_as_zero' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
              Not assessed = 0
            </span>
          )}

          {/* Clear All */}
          <button
            onClick={onClearAll}
            className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear All Filters
          </button>
        </>
      )}
    </div>
  );
}

