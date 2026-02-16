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

export default function ArchivedSkillsPage() {
  const router = useRouter();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchArchivedSkills = async () => {
    try {
      const response = await api.get('/skills?include_archived=true&limit=1000');
      const all: Skill[] = response.data.data;
      setSkills(all.filter((s) => !s.is_active));
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/login');
      } else {
        setError('Failed to load archived skills');
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
        await fetchArchivedSkills();
      } catch (err: any) {
        if (err.response?.status === 401) {
          router.push('/login');
        } else {
          setError('Failed to load archived skills');
        }
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [router]);

  const handleRestore = async (id: number) => {
    if (!confirm('Are you sure you want to restore this skill?')) return;
    try {
      await api.put(`/skills/${id}/restore`);
      fetchArchivedSkills();
    } catch {
      alert('Failed to restore skill');
    }
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
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/skills')}
            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
          >
            ← Back to Skills
          </button>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Archived Skills</h2>

        {skills.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center text-gray-500">
            No archived skills found.
          </div>
        ) : (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleRestore(skill.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

