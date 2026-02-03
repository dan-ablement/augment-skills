'use client';

import { useState } from 'react';

interface Skill {
  id: number;
  name: string;
  category: string;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  role: string;
}

interface SkillScore {
  skillId: number;
  skillName: string;
  category: string;
  score: number | null;
  assessmentDate: string | null;
}

interface HeatmapRow {
  employee: Employee;
  skills: SkillScore[];
}

interface HeatmapData {
  employees: Employee[];
  skills: Skill[];
  heatmap: HeatmapRow[];
}

interface HeatmapProps {
  data: HeatmapData;
}

function getScoreColor(score: number | null): string {
  if (score === null) return 'score-empty';
  if (score >= 90) return 'score-expert';
  if (score >= 70) return 'score-proficient';
  if (score >= 50) return 'score-developing';
  if (score >= 25) return 'score-beginner';
  return 'score-none';
}

function getScoreLabel(score: number | null): string {
  if (score === null) return '-';
  return Math.round(score).toString();
}

export function Heatmap({ data }: HeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    employee: string;
    skill: string;
    score: number | null;
    date: string | null;
  } | null>(null);

  if (data.heatmap.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        No data available. Import some data to see the heatmap.
      </div>
    );
  }

  // Helper to get score for a specific employee and skill
  const getScoreForCell = (employeeId: number, skillId: number): { score: number | null; date: string | null } => {
    const employeeRow = data.heatmap.find(row => row.employee.id === employeeId);
    if (!employeeRow) return { score: null, date: null };
    const skillData = employeeRow.skills.find(s => s.skillId === skillId);
    return { score: skillData?.score ?? null, date: skillData?.assessmentDate ?? null };
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Tooltip */}
      {hoveredCell && (
        <div className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded shadow-lg text-sm pointer-events-none"
             style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <p className="font-medium">{hoveredCell.employee}</p>
          <p>{hoveredCell.skill}</p>
          <p>Score: {hoveredCell.score !== null ? `${hoveredCell.score}%` : 'Not assessed'}</p>
          {hoveredCell.date && <p>Date: {hoveredCell.date}</p>}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="sticky left-0 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r">
                Skill
              </th>
              {/* Employee names as column headers */}
              {data.employees.map((employee) => (
                <th
                  key={employee.id}
                  className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
                  style={{ minWidth: '80px' }}
                >
                  <div className="whitespace-nowrap">{employee.name}</div>
                  <div className="text-[10px] text-gray-400 normal-case">{employee.department}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Skills as rows */}
            {data.skills.map((skill) => (
              <tr key={skill.id}>
                <td className="sticky left-0 bg-white px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 border-r">
                  <div>{skill.name}</div>
                  <div className="text-xs text-gray-500">{skill.category}</div>
                </td>
                {/* Score cells for each employee */}
                {data.employees.map((employee) => {
                  const { score, date } = getScoreForCell(employee.id, skill.id);
                  return (
                    <td
                      key={employee.id}
                      className="px-1 py-1 text-center"
                      onMouseEnter={() =>
                        setHoveredCell({
                          employee: employee.name,
                          skill: skill.name,
                          score,
                          date,
                        })
                      }
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <div className={`heatmap-cell mx-auto ${getScoreColor(score)}`}>
                        {getScoreLabel(score)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-center space-x-4 text-xs">
        <span className="flex items-center"><span className="w-4 h-4 rounded score-expert mr-1"></span> Expert (90+)</span>
        <span className="flex items-center"><span className="w-4 h-4 rounded score-proficient mr-1"></span> Proficient (70-89)</span>
        <span className="flex items-center"><span className="w-4 h-4 rounded score-developing mr-1"></span> Developing (50-69)</span>
        <span className="flex items-center"><span className="w-4 h-4 rounded score-beginner mr-1"></span> Beginner (25-49)</span>
        <span className="flex items-center"><span className="w-4 h-4 rounded score-none mr-1"></span> None (0-24)</span>
        <span className="flex items-center"><span className="w-4 h-4 rounded score-empty mr-1"></span> Not Assessed</span>
      </div>
    </div>
  );
}

