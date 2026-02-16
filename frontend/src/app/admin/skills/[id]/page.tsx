'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Header } from '@/components/Header';

interface SkillForm {
  name: string;
  category: string;
  description: string;
}

export default function SkillEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === 'new';

  const [form, setForm] = useState<SkillForm>({
    name: '',
    category: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check auth first
        const authResponse = await api.get('/auth/me');
        if (!authResponse.data.isAuthenticated) {
          router.push('/login');
          return;
        }

        // If editing, fetch skill data
        if (!isNew) {
          const skillRes = await api.get(`/skills/${id}`);
          const skill = skillRes.data.data;
          setForm({
            name: skill.name || '',
            category: skill.category || '',
            description: skill.description || '',
          });
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          router.push('/login');
        } else {
          setError('Failed to load data');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router, id, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const payload = {
        name: form.name,
        category: form.category || null,
        description: form.description || null,
      };

      if (isNew) {
        await api.post('/skills', payload);
      } else {
        await api.put(`/skills/${id}`, payload);
      }

      router.push('/admin/skills');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save skill');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/skills');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <main className="max-w-2xl mx-auto py-8 px-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isNew ? 'Create Skill' : 'Edit Skill'}
        </h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <input
              type="text"
              id="category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
