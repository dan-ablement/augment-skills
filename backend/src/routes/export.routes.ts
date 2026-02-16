import { Router, Request, Response, NextFunction } from 'express';
import PDFDocument from 'pdfkit';
import { requireAuth } from '../middleware/auth.middleware';
import { hierarchyService, HierarchyNode, HierarchyQueryParams } from '../services/hierarchy.service';
import type { ScoringMode, NotAssessedHandling } from '../services/scoring.utils';

const router = Router();

// All export routes require authentication
router.use(requireAuth);

// ── Helpers ──────────────────────────────────────────────────────────

/** Parse common filter query params shared by CSV and PDF endpoints. */
function parseFilterParams(req: Request): HierarchyQueryParams {
  const scoringMode = (req.query.scoring_mode as string) || 'average';
  const skillsParam = req.query.skills as string | undefined;
  const rolesParam = req.query.roles as string | undefined;
  const managerIdParam = req.query.manager_id as string | undefined;
  const notAssessedParam = req.query.not_assessed as string | undefined;

  const skills = skillsParam
    ? skillsParam.split(',').map(Number).filter(n => !isNaN(n))
    : undefined;
  const roles = rolesParam
    ? rolesParam.split(',').map(r => r.trim()).filter(Boolean)
    : undefined;
  const managerId = managerIdParam ? parseInt(managerIdParam, 10) : undefined;

  return {
    scoring_mode: scoringMode as ScoringMode,
    skills: skills?.length ? skills : undefined,
    roles: roles?.length ? roles : undefined,
    manager_id: managerId,
    not_assessed: notAssessedParam as NotAssessedHandling | undefined,
  };
}

/** Flatten hierarchy tree depth-first, tracking indent level. */
function flattenTree(nodes: HierarchyNode[], depth = 0): { node: HierarchyNode; depth: number }[] {
  const result: { node: HierarchyNode; depth: number }[] = [];
  for (const node of nodes) {
    result.push({ node, depth });
    result.push(...flattenTree(node.children, depth + 1));
  }
  return result;
}

/** Collect unique skill names (ordered) from the first node that has scores. */
function collectSkillNames(nodes: HierarchyNode[]): string[] {
  for (const flat of flattenTree(nodes)) {
    if (flat.node.skillScores.length > 0) {
      return flat.node.skillScores.map(s => s.skillName);
    }
  }
  return [];
}

function formatDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Escape a CSV field value. */
function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ── CSV Export ────────────────────────────────────────────────────────

router.get('/csv', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = parseFilterParams(req);
    const tree = await hierarchyService.getHierarchy(params);
    const skillNames = collectSkillNames(tree);
    const rows = flattenTree(tree);
    const date = formatDate();

    // Build CSV
    const header = ['Employee Name', 'Manager', 'Department', 'Title', ...skillNames];
    const lines: string[] = [header.map(csvEscape).join(',')];

    // Build a quick id→name map for manager lookup
    const idToName = new Map<number, string>();
    for (const { node } of rows) {
      idToName.set(node.id, node.name);
    }

    for (const { node, depth } of rows) {
      const indent = '  '.repeat(depth);
      const name = `${indent}${node.name}`;
      // Find manager name by walking up (parent is whoever has this node as child)
      const managerName = findManagerName(tree, node.id) ?? '';
      const dept = node.department ?? '';
      const title = node.title ?? '';

      const scores = skillNames.map(skillName => {
        const ss = node.skillScores.find(s => s.skillName === skillName);
        return ss?.score != null ? String(Math.round(ss.score)) : '';
      });

      lines.push([name, managerName, dept, title, ...scores].map(csvEscape).join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="skills-export-${date}.csv"`);
    res.send(lines.join('\n'));
  } catch (error) {
    next(error);
  }
});

/** Walk tree to find the parent (manager) name for a given employee id. */
function findManagerName(roots: HierarchyNode[], targetId: number): string | null {
  for (const root of roots) {
    const result = findParent(root, targetId);
    if (result) return result;
  }
  return null;
}

function findParent(node: HierarchyNode, targetId: number): string | null {
  for (const child of node.children) {
    if (child.id === targetId) return node.name;
    const found = findParent(child, targetId);
    if (found) return found;
  }
  return null;
}

// ── PDF helpers ──────────────────────────────────────────────────────

/** Score → color mapping matching frontend CSS classes. */
function scoreColor(score: number | null): [number, number, number] {
  if (score == null) return [156, 163, 175]; // gray #9ca3af
  if (score >= 90) return [34, 197, 94];      // green #22c55e
  if (score >= 70) return [59, 130, 246];     // blue #3b82f6
  if (score >= 40) return [234, 179, 8];      // yellow #eab308
  return [239, 68, 68];                        // red #ef4444
}

function scoreLabel(score: number | null): string {
  if (score == null) return 'N/A';
  return String(Math.round(score));
}

// ── PDF Export ────────────────────────────────────────────────────────

router.get('/pdf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = parseFilterParams(req);
    const tree = await hierarchyService.getHierarchy(params);
    const skillNames = collectSkillNames(tree);
    const rows = flattenTree(tree);
    const date = formatDate();

    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="skills-report-${date}.pdf"`);
    doc.pipe(res);

    // ── Title ──
    doc.fontSize(18).font('Helvetica-Bold').text('Augment Skills Report', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(`Generated: ${date}`, { align: 'center' });
    doc.moveDown(0.5);

    // ── Filter summary ──
    const activeFilters: string[] = [];
    if (params.scoring_mode && params.scoring_mode !== 'average') {
      activeFilters.push(`Scoring: ${params.scoring_mode}`);
    }
    if (params.skills?.length) activeFilters.push(`Skills: ${params.skills.join(', ')}`);
    if (params.roles?.length) activeFilters.push(`Roles: ${params.roles.join(', ')}`);
    if (params.manager_id) activeFilters.push(`Manager ID: ${params.manager_id}`);
    if (params.not_assessed) activeFilters.push(`Not Assessed: ${params.not_assessed}`);

    if (activeFilters.length > 0) {
      doc.fontSize(9).font('Helvetica-Bold').text('Active Filters: ', { continued: true });
      doc.font('Helvetica').text(activeFilters.join(' | '));
    } else {
      doc.fontSize(9).font('Helvetica').text('Filters: None (showing all data)');
    }
    doc.moveDown(0.5);

    // ── Summary metrics ──
    const totalEmployees = rows.length;
    const totalSkills = skillNames.length;
    doc.fontSize(9).font('Helvetica-Bold').text(
      `Employees: ${totalEmployees}  |  Skills tracked: ${totalSkills}`,
    );
    doc.moveDown(0.5);

    // ── Heatmap table ──
    if (rows.length > 0 && skillNames.length > 0) {
      const nameColWidth = 140;
      const skillColWidth = Math.min(
        60,
        (doc.page.width - doc.page.margins.left - doc.page.margins.right - nameColWidth) / skillNames.length,
      );
      const tableWidth = nameColWidth + skillColWidth * skillNames.length;
      const rowHeight = 16;
      const headerHeight = 28;
      const startX = doc.page.margins.left;
      let y = doc.y;

      // Header row
      doc.fontSize(7).font('Helvetica-Bold');
      doc.rect(startX, y, tableWidth, headerHeight).fill('#f3f4f6').stroke('#d1d5db');
      doc.fillColor('#111827').text('Employee', startX + 4, y + 4, { width: nameColWidth - 8 });

      for (let i = 0; i < skillNames.length; i++) {
        const x = startX + nameColWidth + i * skillColWidth;
        doc.text(
          skillNames[i].length > 8 ? skillNames[i].slice(0, 7) + '…' : skillNames[i],
          x + 2, y + 4,
          { width: skillColWidth - 4, align: 'center' },
        );
      }
      y += headerHeight;

      // Data rows
      doc.font('Helvetica').fontSize(7);
      const maxRows = Math.min(rows.length, 40); // Limit to prevent overflow
      for (let r = 0; r < maxRows; r++) {
        if (y + rowHeight > doc.page.height - doc.page.margins.bottom - 40) {
          doc.addPage();
          y = doc.page.margins.top;
        }

        const { node, depth } = rows[r];
        const bgColor = r % 2 === 0 ? '#ffffff' : '#f9fafb';
        doc.rect(startX, y, nameColWidth, rowHeight).fill(bgColor);
        doc.fillColor('#111827');
        const indent = '  '.repeat(depth);
        const displayName = `${indent}${node.name}`;
        doc.text(
          displayName.length > 22 ? displayName.slice(0, 21) + '…' : displayName,
          startX + 4, y + 3,
          { width: nameColWidth - 8 },
        );

        for (let i = 0; i < skillNames.length; i++) {
          const x = startX + nameColWidth + i * skillColWidth;
          const ss = node.skillScores.find(s => s.skillName === skillNames[i]);
          const score = ss?.score ?? null;
          const [cr, cg, cb] = scoreColor(score);
          doc.rect(x, y, skillColWidth, rowHeight).fill(`#${cr.toString(16).padStart(2, '0')}${cg.toString(16).padStart(2, '0')}${cb.toString(16).padStart(2, '0')}`);
          // Use white text on dark backgrounds, black on light
          const textColor = (score != null && score < 70 && score >= 40) ? '#111827' : '#ffffff';
          doc.fillColor(textColor).text(scoreLabel(score), x + 2, y + 3, { width: skillColWidth - 4, align: 'center' });
        }
        y += rowHeight;
      }

      if (rows.length > maxRows) {
        doc.fillColor('#6b7280').fontSize(8).text(
          `... and ${rows.length - maxRows} more employees`,
          startX, y + 4,
        );
        y += 20;
      }

      doc.y = y + 10;
    }

    // ── Legend ──
    doc.moveDown(0.5);
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#111827').text('Legend:');
    doc.fontSize(8).font('Helvetica');
    const legendItems: [string, [number, number, number]][] = [
      ['Expert (90-100)', [34, 197, 94]],
      ['Proficient (70-89)', [59, 130, 246]],
      ['Developing (40-69)', [234, 179, 8]],
      ['Beginner (1-39)', [239, 68, 68]],
      ['Not Assessed', [156, 163, 175]],
    ];
    const legendY = doc.y;
    let legendX = doc.page.margins.left;
    for (const [label, [cr, cg, cb]] of legendItems) {
      doc.rect(legendX, legendY, 10, 10).fill(`#${cr.toString(16).padStart(2, '0')}${cg.toString(16).padStart(2, '0')}${cb.toString(16).padStart(2, '0')}`);
      doc.fillColor('#111827').text(label, legendX + 14, legendY + 1, { continued: false });
      legendX += 120;
    }

    doc.end();
  } catch (error) {
    next(error);
  }
});

export default router;

