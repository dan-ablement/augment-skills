'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { ScoringMode, NotAssessedHandling } from '@/hooks/useFilterState';

interface Skill {
  id: number;
  name: string;
  category: string;
}

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
}: FilterPanelProps) {
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');

  // Fetch available skills and roles
  useEffect(() => {
    if (!isOpen) return;
    const fetchOptions = async () => {
      try {
        const [skillsRes, employeesRes] = await Promise.all([
          api.get('/skills', { params: { limit: 200 } }),
          api.get('/dashboard/heatmap'),
        ]);
        setAvailableSkills(skillsRes.data.data?.skills || skillsRes.data.skills || []);
        // Extract unique departments from employees
        const employees = employeesRes.data.data?.employees || [];
        const deptSet = new Set<string>(employees.map((e: any) => e.department).filter(Boolean));
        const depts = Array.from(deptSet);
        setAvailableRoles(depts.sort());
      } catch (err) {
        console.error('Failed to fetch filter options:', err);
      }
    };
    fetchOptions();
  }, [isOpen]);

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

            {/* Not Assessed Handling (admin section) */}
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                &quot;Not Assessed&quot; Handling
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="notAssessed"
                    value="exclude"
                    checked={notAssessed === 'exclude'}
                    onChange={() => onSetNotAssessed('exclude')}
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
                    onChange={() => onSetNotAssessed('count_as_zero')}
                    className="h-3.5 w-3.5 text-blue-600 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Count as zero</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

