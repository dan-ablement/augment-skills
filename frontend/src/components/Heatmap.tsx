'use client';

import { useState, useCallback, useMemo } from 'react';
import type { HierarchyNode, SkillScore } from '@/types/hierarchy';

// ── Types ──────────────────────────────────────────────────────────────

export interface HierarchyHeatmapProps {
  /** Root nodes of the org hierarchy tree */
  data: HierarchyNode[];
  /** Callback when "Collapse All" is triggered externally */
  onCollapseAll?: () => void;
}

/** A flattened column representing one node in the visible heatmap */
interface FlatColumn {
  node: HierarchyNode;
  depth: number;
  parentId: number | null;
}

// ── Helpers ────────────────────────────────────────────────────────────

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

/** Get the score for a specific skill from a node's skillScores array */
function getNodeSkillScore(node: HierarchyNode, skillId: number): SkillScore | undefined {
  return node.skillScores.find((s) => s.skillId === skillId);
}

/** Collect all unique skill entries across the tree (preserving order from first root) */
function collectSkills(nodes: HierarchyNode[]): Array<{ skillId: number; skillName: string }> {
  const seen = new Set<number>();
  const skills: Array<{ skillId: number; skillName: string }> = [];

  const walk = (node: HierarchyNode) => {
    for (const ss of node.skillScores) {
      if (!seen.has(ss.skillId)) {
        seen.add(ss.skillId);
        skills.push({ skillId: ss.skillId, skillName: ss.skillName });
      }
    }
    for (const child of node.children) walk(child);
  };

  for (const root of nodes) walk(root);
  return skills;
}

/**
 * Find the ancestor chain from a node up to a root.
 * Returns array of node IDs from root → target (inclusive).
 */
function findAncestorChain(
  roots: HierarchyNode[],
  targetId: number,
): number[] {
  const search = (node: HierarchyNode, chain: number[]): number[] | null => {
    const current = [...chain, node.id];
    if (node.id === targetId) return current;
    for (const child of node.children) {
      const result = search(child, current);
      if (result) return result;
    }
    return null;
  };
  for (const root of roots) {
    const result = search(root, []);
    if (result) return result;
  }
  return [];
}

// ── Component ──────────────────────────────────────────────────────────

export function Heatmap({ data, onCollapseAll }: HierarchyHeatmapProps) {
  // Expansion state: set of expanded node IDs
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const [hoveredCell, setHoveredCell] = useState<{
    name: string;
    skill: string;
    score: number | null;
    assessedCount?: number;
    totalCount?: number;
    isManager: boolean;
  } | null>(null);

  // Collect all skills from the tree
  const skills = useMemo(() => collectSkills(data), [data]);

  /**
   * Toggle expansion of a manager node.
   * Auto-collapse: when expanding at depth ≥ 2, collapse sibling branches
   * to prevent horizontal sprawl.
   */
  const toggleExpand = useCallback(
    (nodeId: number) => {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(nodeId)) {
          // Collapse: remove this node and all its descendants
          next.delete(nodeId);
          const removeDescendants = (nodes: HierarchyNode[]) => {
            for (const n of nodes) {
              if (n.id === nodeId) {
                const removeAll = (children: HierarchyNode[]) => {
                  for (const c of children) {
                    next.delete(c.id);
                    removeAll(c.children);
                  }
                };
                removeAll(n.children);
                return true;
              }
              if (removeDescendants(n.children)) return true;
            }
            return false;
          };
          removeDescendants(data);
        } else {
          // Expand: add this node
          next.add(nodeId);

          // Auto-collapse siblings at depth ≥ 2
          const chain = findAncestorChain(data, nodeId);
          if (chain.length >= 3) {
            // chain = [root, ..., parent, nodeId]
            // Find the parent node and collapse its other expanded children
            const parentId = chain[chain.length - 2];
            const findNode = (nodes: HierarchyNode[]): HierarchyNode | null => {
              for (const n of nodes) {
                if (n.id === parentId) return n;
                const found = findNode(n.children);
                if (found) return found;
              }
              return null;
            };
            const parent = findNode(data);
            if (parent) {
              for (const sibling of parent.children) {
                if (sibling.id !== nodeId && next.has(sibling.id)) {
                  // Collapse sibling and its descendants
                  next.delete(sibling.id);
                  const removeAll = (children: HierarchyNode[]) => {
                    for (const c of children) {
                      next.delete(c.id);
                      removeAll(c.children);
                    }
                  };
                  removeAll(sibling.children);
                }
              }
            }
          }
        }
        return next;
      });
    },
    [data],
  );

  /** Collapse all expanded nodes */
  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
    onCollapseAll?.();
  }, [onCollapseAll]);

  /**
   * Flatten the hierarchy tree into visible columns based on expansion state.
   * Each expanded manager shows itself + its direct children.
   * Non-expanded managers show only themselves.
   */
  const flatColumns = useMemo((): FlatColumn[] => {
    const columns: FlatColumn[] = [];

    const walk = (nodes: HierarchyNode[], depth: number, parentId: number | null) => {
      for (const node of nodes) {
        columns.push({ node, depth, parentId });
        if (node.isManager && expandedIds.has(node.id)) {
          walk(node.children, depth + 1, node.id);
        }
      }
    };

    walk(data, 0, null);
    return columns;
  }, [data, expandedIds]);

  // Empty state
  if (data.length === 0 || skills.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        No data available. Import some data to see the heatmap.
      </div>
    );
  }

  const hasExpanded = expandedIds.size > 0;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Toolbar */}
      {hasExpanded && (
        <div className="px-4 py-2 bg-gray-50 border-b flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {expandedIds.size} manager{expandedIds.size !== 1 ? 's' : ''} expanded
          </span>
          <button
            onClick={collapseAll}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            Collapse All
          </button>
        </div>
      )}

      {/* Tooltip */}
      {hoveredCell && (
        <div className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded shadow-lg text-sm pointer-events-none"
             style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <p className="font-medium">{hoveredCell.name}</p>
          <p>{hoveredCell.skill}</p>
          <p>Score: {hoveredCell.score !== null ? `${Math.round(hoveredCell.score)}%` : 'Not assessed'}</p>
          {hoveredCell.isManager && hoveredCell.assessedCount !== undefined && (
            <p className="text-gray-300 text-xs">
              {hoveredCell.assessedCount}/{hoveredCell.totalCount} assessed
            </p>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              {/* Sticky skill name column header */}
              <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-r min-w-[160px]">
                Skill
              </th>
              {/* Person/manager column headers */}
              {flatColumns.map(({ node, depth }) => {
                const isExpanded = expandedIds.has(node.id);
                const canExpand = node.isManager && node.children.length > 0;
                return (
                  <th
                    key={node.id}
                    className={`px-2 py-3 text-center text-xs font-medium tracking-wider border-b ${
                      depth > 0 ? 'bg-gray-100' : 'bg-gray-50'
                    } ${canExpand ? 'cursor-pointer hover:bg-blue-50' : ''}`}
                    style={{ minWidth: '80px' }}
                    onClick={canExpand ? () => toggleExpand(node.id) : undefined}
                    title={canExpand ? (isExpanded ? 'Click to collapse' : 'Click to expand team') : undefined}
                  >
                    <div className="whitespace-nowrap flex items-center justify-center gap-1">
                      {/* Depth indicator */}
                      {depth > 0 && (
                        <span className="text-gray-300" style={{ marginLeft: `${(depth - 1) * 4}px` }}>
                          {'└'}
                        </span>
                      )}
                      {/* Expand/collapse icon for managers */}
                      {canExpand && (
                        <span className={`inline-block transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                          ▶
                        </span>
                      )}
                      <span className={node.isManager ? 'font-semibold text-gray-700' : 'text-gray-500'}>
                        {node.name}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 normal-case">
                      {node.department ?? ''}
                      {node.isManager && (
                        <span className="ml-1">
                          ({node.directReportCount} direct)
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Skills as rows */}
            {skills.map((skill) => (
              <tr key={skill.skillId}>
                {/* Sticky skill name cell */}
                <td className="sticky left-0 z-10 bg-white px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 border-r">
                  {skill.skillName}
                </td>
                {/* Score cells for each visible column */}
                {flatColumns.map(({ node, depth }) => {
                  const ss = getNodeSkillScore(node, skill.skillId);
                  const score = ss?.score ?? null;
                  const hasPartialCoverage =
                    node.isManager && ss && ss.assessedCount < ss.totalCount && ss.assessedCount > 0;

                  return (
                    <td
                      key={node.id}
                      className={`px-1 py-1 text-center ${depth > 0 ? 'bg-gray-50/50' : ''}`}
                      onMouseEnter={() =>
                        setHoveredCell({
                          name: node.name,
                          skill: skill.skillName,
                          score,
                          assessedCount: ss?.assessedCount,
                          totalCount: ss?.totalCount,
                          isManager: node.isManager,
                        })
                      }
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <div className={`heatmap-cell mx-auto ${getScoreColor(score)}`}>
                        <span>{getScoreLabel(score)}</span>
                        {hasPartialCoverage && (
                          <span className="text-[9px] ml-0.5 opacity-75" title={`${ss!.assessedCount}/${ss!.totalCount} assessed`}>
                            ⚠️
                          </span>
                        )}
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
        <span className="flex items-center"><span className="text-[9px] mr-1">⚠️</span> Partial Coverage</span>
      </div>
    </div>
  );
}
