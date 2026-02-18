'use client';

import { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Header } from '@/components/Header';

interface CompetencyScore {
  competency: string;
  score: number;
  context: string | null;
}

interface ValidationEvent {
  id: string;
  employee_id: number;
  employee_name: string;
  employee_email: string;
  event_type: string;
  event_source: string;
  event_timestamp: string;
  overall_score: number;
  passed: boolean;
  details_url: string | null;
  session_metadata: Record<string, unknown> | null;
  competency_scores: CompetencyScore[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  role_play: 'Role Play',
  multiple_choice_test: 'Multiple Choice Test',
  certification_exam: 'Certification Exam',
  hands_on_lab: 'Hands-On Lab',
};

const EVENT_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'role_play', label: 'Role Play' },
  { value: 'multiple_choice_test', label: 'Multiple Choice Test' },
  { value: 'certification_exam', label: 'Certification Exam' },
  { value: 'hands_on_lab', label: 'Hands-On Lab' },
];

function formatEventType(type: string): string {
  return EVENT_TYPE_LABELS[type] || type;
}

function formatCompetency(competency: string): string {
  return competency
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatTimestamp(ts: string): string {
  const date = new Date(ts);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function ValidationEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<ValidationEvent[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventSource, setEventSource] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const fetchEvents = async (page: number = 1, search: string = '', type: string = '', source: string = '') => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '50');
      if (search) params.append('search', search);
      if (type) params.append('event_type', type);
      if (source) params.append('event_source', source);

      const response = await api.get(`/validation-events?${params.toString()}`);
      setEvents(response.data.data);
      setPagination(response.data.pagination);
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/login');
      } else {
        setError('Failed to load validation events');
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const authResponse = await api.get('/auth/me');
        if (!authResponse.data.isAuthenticated) {
          router.push('/login');
          return;
        }
        await fetchEvents(currentPage, searchQuery, eventType, eventSource);
      } catch (err: any) {
        if (err.response?.status === 401) {
          router.push('/login');
        } else {
          setError('Failed to load validation events');
        }
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [router]);

  useEffect(() => {
    if (!isLoading) {
      fetchEvents(currentPage, searchQuery, eventType, eventSource);
    }
  }, [currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchEvents(1, searchQuery, eventType, eventSource);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Incoming Results</h2>
          <p className="mt-1 text-sm text-gray-500">View validation events from external applications</p>
        </div>

        {/* Filters */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex space-x-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by employee name..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              {EVENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={eventSource}
              onChange={(e) => setEventSource(e.target.value)}
              placeholder="Filter by source..."
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-48"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium"
            >
              Search
            </button>
          </div>
        </form>

        {/* Table */}
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                    No validation events found
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <Fragment key={event.id}>
                    <tr
                      onClick={() => toggleRow(event.id)}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTimestamp(event.event_timestamp)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{event.employee_name}</div>
                        <div className="text-sm text-gray-500">{event.employee_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatEventType(event.event_type)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.event_source}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{event.overall_score}%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${event.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {event.passed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {event.details_url ? (
                          <a
                            href={event.details_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                    {expandedRow === event.id && event.competency_scores && event.competency_scores.length > 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 bg-gray-50">
                          <div className="ml-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Competency Scores</h4>
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead>
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Competency</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Context</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {event.competency_scores.map((cs, idx) => (
                                  <tr key={idx}>
                                    <td className="px-4 py-2 text-sm text-gray-900">{formatCompetency(cs.competency)}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900">{cs.score}%</td>
                                    <td className="px-4 py-2 text-sm text-gray-500">
                                      {cs.context ? JSON.stringify(cs.context) : '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total events)
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 border rounded-md text-sm ${currentPage === page ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
