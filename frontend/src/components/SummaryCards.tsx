interface Summary {
  totalEmployees: number;
  totalSkills: number;
  totalAssessments: number;
  averageScore: number;
}

interface SummaryCardsProps {
  summary: Summary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      title: 'Total Employees',
      value: summary.totalEmployees,
      icon: '👥',
      color: 'bg-blue-500',
    },
    {
      title: 'Total Skills',
      value: summary.totalSkills,
      icon: '🎯',
      color: 'bg-green-500',
    },
    {
      title: 'Assessments',
      value: summary.totalAssessments,
      icon: '📊',
      color: 'bg-purple-500',
    },
    {
      title: 'Average Score',
      value: `${summary.averageScore}%`,
      icon: '⭐',
      color: 'bg-yellow-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white rounded-lg shadow p-6 flex items-center"
        >
          <div
            className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl`}
          >
            {card.icon}
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">{card.title}</p>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

