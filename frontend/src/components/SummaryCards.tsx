'use client';

import type { SummaryData, ScoringMode } from '@/types/hierarchy';

interface SummaryCardsProps {
  summary: SummaryData;
  scoringMode?: ScoringMode;
}

function getScoreLabel(mode: ScoringMode): string {
  switch (mode) {
    case 'team_readiness':
      return 'Team Readiness';
    case 'coverage':
      return 'Coverage %';
    default:
      return 'Average Score';
  }
}

interface CardDef {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

function buildCards(
  data: { totalEmployees: number; totalSkills: number; totalAssessments: number; score: number | null },
  scoringMode: ScoringMode,
): CardDef[] {
  return [
    { title: 'Employees', value: data.totalEmployees, icon: '👥', color: 'bg-blue-500' },
    { title: 'Skills', value: data.totalSkills, icon: '🎯', color: 'bg-green-500' },
    { title: 'Assessments', value: data.totalAssessments, icon: '📊', color: 'bg-purple-500' },
    { title: getScoreLabel(scoringMode), value: data.score !== null ? `${Math.round(data.score)}%` : '—', icon: '⭐', color: 'bg-yellow-500' },
  ];
}

function CardRow({ label, cards }: { label?: string; cards: CardDef[] }) {
  return (
    <div>
      {label && (
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.title} className="bg-white rounded-lg shadow p-5 flex items-center">
            <div className={`${card.color} w-10 h-10 rounded-lg flex items-center justify-center text-xl`}>
              {card.icon}
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">{card.title}</p>
              <p className="text-xl font-bold text-gray-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SummaryCards({ summary, scoringMode = 'average' }: SummaryCardsProps) {
  const hasFilters = summary.hasFilters;

  if (!hasFilters) {
    // Single row — show overall metrics only
    const cards = buildCards(summary.overall, scoringMode);
    return <CardRow cards={cards} />;
  }

  // Two rows: Overall (company-wide) + Filtered View
  const overallCards = buildCards(summary.overall, scoringMode);
  const filteredCards = buildCards(summary.filtered, scoringMode);

  return (
    <div className="space-y-4">
      <CardRow label="Overall" cards={overallCards} />
      <CardRow label="Filtered View" cards={filteredCards} />
    </div>
  );
}
