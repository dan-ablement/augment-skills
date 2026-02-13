'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { ScoringMode, NotAssessedHandling } from '@/hooks/useFilterState';

interface Skill {
  id: number;
  name: string;
  category: string;
}

interface ColorThresholds {
  expert: number;
  proficient: number;
  developing: number;
  novice: number;
}

const DEFAULT_THRESHOLDS: ColorThresholds = {
  expert: 90,
  proficient: 70,
  developing: 50,
  novice: 25,
};

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  // Filter values
  selectedSkills: number[];
  selectedRoles: string[];
  managerId: number | null;
  notAssessed: NotAssessedHandling;
  // Filter setters
  onAddSkill: (id: number) => void;
  onRemoveSkill: (id: number) => void;
  onAddRole: (role: string) => void;
  onRemoveRole: (role: string) => void;
  onSetManagerId: (id: number | null) => void;
  onSetNotAssessed: (handling: NotAssessedHandling) => void;
  onClearAll: () => void;
  isAdmin?: boolean;
}

export function FilterPanel({
  isOpen,
  onClose,
  selectedSkills,
  selectedRoles,
  managerId,
  notAssessed,
  onAddSkill,
  onRemoveSkill,
  onAddRole,
  onRemoveRole,
  onSetManagerId,
  onSetNotAssessed,
  onClearAll,
  isAdmin = true,
}: FilterPanelProps) {
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [thresholds, setThresholds] = useState<ColorThresholds>(DEFAULT_THRESHOLDS);
  const [thresholdSaved, setThresholdSaved] = useState(false);
  const [notAssessedSaved, setNotAssessedSaved] = useState(false);

  // Fetch available skills, roles, and settings
  useEffect(() => {
    if (!isOpen) return;
    const fetchOptions = async () => {
      try {
        const [skillsRes, employeesRes, settingsRes] = await Promise.all([
          api.get('/skills', { params: { limit: 200 } }),
          api.get('/dashboard/heatmap'),
          api.get('/settings'),
        ]);
        setAvailableSkills(skillsRes.data.data?.skills || skillsRes.data.skills || []);
        // Extract unique departments from employees
        const employees = employeesRes.data.data?.employees || [];
        const deptSet = new Set<string>(employees.map((e: any) => e.department).filter(Boolean));
        const depts = Array.from(deptSet);
        setAvailableRoles(depts.sort());

        // Load settings
        const settings = settingsRes.data.settings || {};
        if (settings.color_thresholds?.value) {
          setThresholds(settings.color_thresholds.value as ColorThresholds);
        }
      } catch (err) {
        console.error('Failed to fetch filter options:', err);
      }
    };
    fetchOptions();
  }, [isOpen]);

  // Save color thresholds to backend (admin only)
  const saveThresholds = useCallback(async (newThresholds: ColorThresholds) => {
    try {
      await api.put('/settings/color_thresholds', { value: newThresholds });
      setThresholdSaved(true);
      setTimeout(() => setThresholdSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save thresholds:', err);
    }
  }, []);

  // Save not_assessed setting to backend (admin only)
  const saveNotAssessed = useCallback(async (value: NotAssessedHandling) => {
    try {
      await api.put('/settings/not_assessed_default', { value });
      setNotAssessedSaved(true);
      setTimeout(() => setNotAssessedSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save not assessed setting:', err);
    }
  }, []);

  const handleThresholdChange = useCallback((key: keyof ColorThresholds, val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 0 || num > 100) return;
    const updated = { ...thresholds, [key]: num };
    setThresholds(updated);
    saveThresholds(updated);
  }, [thresholds, saveThresholds]);

  const handleNotAssessedChange = useCallback((value: NotAssessedHandling) => {
    onSetNotAssessed(value);
    if (isAdmin) {
      saveNotAssessed(value);
    }
  }, [onSetNotAssessed, isAdmin, saveNotAssessed]);

  const filteredSkills = availableSkills.filter(
    (s) => s.name.toLowerCase().includes(skillSearch.toLowerCase()) && !selectedSkills.includes(s.id)
  );

  const filteredRoles = availableRoles.filter(
    (r) => r.toLowerCase().includes(roleSearch.toLowerCase()) && !selectedRoles.includes(r)
  );

  const selectedSkillObjects = availableSkills.filter((s) => selectedSkills.includes(s.id));

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-25 z-40" onClick={onClose} />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Advanced Filters</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={onClearAll}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Clear All
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
            {/* Skills Multi-Select */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Skills</label>
              {/* Selected skills */}
              {selectedSkillObjects.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedSkillObjects.map((skill) => (
                    <span
                      key={skill.id}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {skill.name}
                      <button onClick={() => onRemoveSkill(skill.id)} className="ml-1 text-blue-600 hover:text-blue-800">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                type="text"
                placeholder="Search skills..."
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              {skillSearch && filteredSkills.length > 0 && (
                <div className="mt-1 max-h-32 overflow-y-auto border border-gray-200 rounded-md">
                  {filteredSkills.slice(0, 10).map((skill) => (
                    <button
                      key={skill.id}
                      onClick={() => { onAddSkill(skill.id); setSkillSearch(''); }}
                      className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-blue-50"
                    >
                      <span>{skill.name}</span>
                      <span className="text-xs text-gray-400 ml-1">({skill.category})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Roles/Department Multi-Select */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Departments</label>
              {selectedRoles.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedRoles.map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                    >
                      {role}
                      <button onClick={() => onRemoveRole(role)} className="ml-1 text-green-600 hover:text-green-800">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                type="text"
                placeholder="Search departments..."
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              {roleSearch && filteredRoles.length > 0 && (
                <div className="mt-1 max-h-32 overflow-y-auto border border-gray-200 rounded-md">
                  {filteredRoles.map((role) => (
                    <button
                      key={role}
                      onClick={() => { onAddRole(role); setRoleSearch(''); }}
                      className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-green-50"
                    >
                      {role}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Manager / Team Selector */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Manager / Team</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Manager ID"
                  value={managerId ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    onSetManagerId(val ? parseInt(val, 10) : null);
                  }}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                {managerId !== null && (
                  <button
                    onClick={() => onSetManagerId(null)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-400">Enter a manager ID to filter to their team</p>
            </div>

            {/* Not Assessed Handling */}
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                &quot;Not Assessed&quot; Handling
                {notAssessedSaved && (
                  <span className="ml-2 text-green-600 text-xs">Saved ✓</span>
                )}
              </label>
              {isAdmin ? (
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="notAssessed"
                      value="exclude"
                      checked={notAssessed === 'exclude'}
                      onChange={() => handleNotAssessedChange('exclude')}
                      className="h-3.5 w-3.5 text-blue-600 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Exclude from calculations</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="notAssessed"
                      value="count_as_zero"
                      checked={notAssessed === 'count_as_zero'}
                      onChange={() => handleNotAssessedChange('count_as_zero')}
                      className="h-3.5 w-3.5 text-blue-600 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Count as zero</span>
                  </label>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  {notAssessed === 'exclude' ? 'Excluded from calculations' : 'Counted as zero'}
                </p>
              )}
            </div>

            {/* Color Threshold Editor */}
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Color Thresholds
                {thresholdSaved && (
                  <span className="ml-2 text-green-600 text-xs">Saved ✓</span>
                )}
              </label>
              {isAdmin ? (
                <div className="space-y-2">
                  {([
                    { key: 'expert' as const, label: 'Expert', color: 'bg-green-100 text-green-800' },
                    { key: 'proficient' as const, label: 'Proficient', color: 'bg-blue-100 text-blue-800' },
                    { key: 'developing' as const, label: 'Developing', color: 'bg-yellow-100 text-yellow-800' },
                    { key: 'novice' as const, label: 'Novice', color: 'bg-red-100 text-red-800' },
                  ]).map(({ key, label, color }) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${color}`}>{label}</span>
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 mr-1">≥</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={thresholds[key]}
                          onChange={(e) => handleThresholdChange(key, e.target.value)}
                          className="w-14 px-2 py-1 text-xs border border-gray-300 rounded-md text-center focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {([
                    { label: 'Expert', value: thresholds.expert, color: 'bg-green-100 text-green-800' },
                    { label: 'Proficient', value: thresholds.proficient, color: 'bg-blue-100 text-blue-800' },
                    { label: 'Developing', value: thresholds.developing, color: 'bg-yellow-100 text-yellow-800' },
                    { label: 'Novice', value: thresholds.novice, color: 'bg-red-100 text-red-800' },
                  ]).map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${color}`}>{label}</span>
                      <span className="text-xs text-gray-500">≥ {value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Non-admin team limitation notice */}
            {!isAdmin && (
              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs text-gray-400 italic">View limited to your team</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

