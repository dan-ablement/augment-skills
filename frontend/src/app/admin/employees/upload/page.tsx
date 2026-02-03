'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Header } from '@/components/Header';

interface ParsedEmployeeRow {
  first_name: string;
  last_name: string;
  email: string;
  title?: string;
  department?: string;
  manager_email?: string;
  rowNumber: number;
}

interface PreviewResult {
  valid: boolean;
  rows: ParsedEmployeeRow[];
  errors: string[];
}

interface ImportResult {
  imported: number;
  errors: string[];
}

export default function EmployeeUploadPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isImportLoading, setIsImportLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/auth/me');
        if (!response.data.isAuthenticated) {
          router.push('/login');
          return;
        }
      } catch {
        router.push('/login');
        return;
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file || null);
    setPreviewResult(null);
    setImportResult(null);
    setError('');
  };

  const handlePreview = async () => {
    if (!selectedFile) return;

    setIsPreviewLoading(true);
    setError('');
    setPreviewResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const response = await api.post('/import/employees/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreviewResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Preview failed');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !previewResult?.valid) return;

    setIsImportLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const response = await api.post('/import/employees', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(response.data);

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Import failed');
    } finally {
      setIsImportLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.open('/api/v1/import/employees/template', '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Upload Employees CSV</h2>
          <p className="mt-1 text-sm text-gray-600">
            Import employees from a CSV file. The file should include first_name, last_name, email, title, department, and manager_email columns.
          </p>
        </div>

        {/* Download Template */}
        <div className="mb-6">
          <button
            onClick={handleDownloadTemplate}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
          >
            Download CSV Template
          </button>
        </div>

        {/* CSV Format Reference */}
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">CSV Format:</h3>
          <pre className="text-xs text-gray-600 overflow-x-auto">
{`first_name,last_name,email,title,department,manager_email
Scott,Dietzen,scott@augmentcode.com,CEO,Executive,
Igor,Ostrovsky,igor@augmentcode.com,CTO,Engineering,scott@augmentcode.com`}
          </pre>
        </div>

        {/* File Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={handlePreview}
            disabled={!selectedFile || isPreviewLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isPreviewLoading ? 'Previewing...' : 'Preview'}
          </button>
          <button
            onClick={handleImport}
            disabled={!previewResult?.valid || isImportLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isImportLoading ? 'Importing...' : 'Import'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Import Success Message */}
        {importResult && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            <p className="font-medium">Import successful!</p>
            <p>{importResult.imported} employees imported.</p>
            {importResult.errors.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Warnings:</p>
                <ul className="list-disc list-inside">
                  {importResult.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-2 text-sm">Redirecting to dashboard...</p>
          </div>
        )}

        {/* Preview Results */}
        {previewResult && !importResult && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Preview Results
              {previewResult.valid ? (
                <span className="ml-2 text-green-600">(Valid)</span>
              ) : (
                <span className="ml-2 text-red-600">(Has Errors)</span>
              )}
            </h3>

            {/* Errors */}
            {previewResult.errors.length > 0 && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <p className="font-medium mb-2">Errors:</p>
                <ul className="list-disc list-inside">
                  {previewResult.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preview Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Row</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager Email</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewResult.rows.map((row) => {
                    const hasError = previewResult.errors.some((err) => err.includes(`Row ${row.rowNumber}:`));
                    return (
                      <tr key={row.rowNumber} className={hasError ? 'bg-red-50' : 'bg-green-50'}>
                        <td className="px-4 py-2 text-sm text-gray-900">{row.rowNumber}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{row.first_name}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{row.last_name}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{row.email}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{row.title || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{row.department || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{row.manager_email || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

