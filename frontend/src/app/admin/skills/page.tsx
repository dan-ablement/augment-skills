'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Header } from '@/components/Header';

interface Skill {
  id: number;
  name: string;
  category: string | null;
  description: string | null;
  is_active: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function SkillsPage() {
  const router = useRouter();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [archivedCount, setArchivedCount] = useState(0);

  const fetchSkills = async (page: number = 1, search: string = '', category: string = '') => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '50');
      if (category) params.append('category', category);

      const response = await api.get(`/skills?${params.toString()}`);
      let data: Skill[] = response.data.data;

      // Client-side search filter by name
      if (search) {
        const q = search.toLowerCase();
        data = data.filter((s) => s.name.toLowerCase().includes(q));
      }

      setSkills(data);
      setPagination(response.data.pagination);
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/login');
      } else {
        setError('Failed to load skills');
      }
    }
  };

  const fetchArchivedCount = async () => {
    try {
      const response = await api.get('/skills?include_archived=true&limit=1000');
      const all: Skill[] = response.data.data;
      setArchivedCount(all.filter((s) => !s.is_active).length);
    } catch {
      // ignore
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/skills/categories');
      setCategories(response.data.data || []);
    } catch {
      // ignore
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
        await Promise.all([
          fetchSkills(currentPage, searchQuery, selectedCategory),
          fetchCategories(),
          fetchArchivedCount(),
        ]);
      } catch (err: any) {
        if (err.response?.status === 401) {
          router.push('/login');
        } else {
          setError('Failed to load skills');
        }
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [router]);

  useEffect(() => {
    if (!isLoading) {
      fetchSkills(currentPage, searchQuery, selectedCategory);
    }
  }, [currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSkills(1, searchQuery, selectedCategory);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
    fetchSkills(1, searchQuery, cat);
  };

  const handleArchive = async (id: number) => {
    if (!confirm('Are you sure you want to archive this skill?')) return;
    try {
      await api.delete(`/skills/${id}`);
      fetchSkills(currentPage, searchQuery, selectedCategory);
      fetchArchivedCount();
    } catch {
      alert('Failed to archive skill');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const truncate = (text: string | null, max: number) => {
    if (!text) return '-';
    return text.length > max ? text.slice(0, max) + '…' : text;
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Skills</h2>
          <div className="flex space-x-3">
            <button
              onClick={() => router.push('/admin/skills/new')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Add Skill
            </button>
            <button
              onClick={() => router.push('/admin/skills/archived')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium"
            >
              View Archived{archivedCount > 0 ? ` (${archivedCount})` : ''}
            </button>
          </div>
        </div>

        {/* Search and Category Filter */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex space-x-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium"
            >
              Search
            </button>
          </div>
        </form>

        {/* Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {skills.map((skill) => (
                <tr key={skill.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{skill.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{skill.category || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{truncate(skill.description, 60)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => router.push(`/admin/skills/${skill.id}`)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleArchive(skill.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Archive
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total skills)
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
