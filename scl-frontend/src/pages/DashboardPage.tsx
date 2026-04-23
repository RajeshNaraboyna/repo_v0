import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../store/AuthContext'
import admissionService from '../services/admissionService'
import type { AdmissionStatus } from '../types'

type ChartType = 'bar' | 'line' | 'pie'

const CHART_COLORS = [
  '#0ea5e9', '#14b8a6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#10b981', '#f97316',
  '#6366f1', '#84cc16',
]

const statusColors: Record<AdmissionStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  under_review: { bg: 'bg-blue-100', text: 'text-blue-800' },
  documents_required: { bg: 'bg-orange-100', text: 'text-orange-800' },
  approved: { bg: 'bg-green-100', text: 'text-green-800' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800' },
  waitlisted: { bg: 'bg-purple-100', text: 'text-purple-800' },
  admitted: { bg: 'bg-teal-100', text: 'text-teal-800' },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [chartType, setChartType] = useState<ChartType>('bar')

  const { data: requests, isLoading } = useQuery({
    queryKey: ['admission-requests'],
    queryFn: () => admissionService.getAllRequests(),
  })

  const stats = requests
    ? {
        total: requests.length,
        pending: requests.filter((r) => r.status === 'pending').length,
        approved: requests.filter((r) => r.status === 'approved').length,
        admitted: requests.filter((r) => r.status === 'admitted').length,
        rejected: requests.filter((r) => r.status === 'rejected').length,
      }
    : { total: 0, pending: 0, approved: 0, admitted: 0, rejected: 0 }

  // Compute students per class from admitted requests
  const studentsPerClass = requests
    ? Object.entries(
        requests
          .filter((r) => r.status === 'admitted' && r.admitted_class)
          .reduce<Record<string, number>>((acc, r) => {
            const cls = r.admitted_class!
            acc[cls] = (acc[cls] ?? 0) + 1
            return acc
          }, {}),
      )
        .map(([className, count]) => ({ className, count }))
        .sort((a, b) => a.className.localeCompare(b.className))
    : []

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
        <p className="text-gray-600 mt-2">{t('dashboard.welcome')} {user?.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="card">
          <p className="text-sm text-gray-500">{t('dashboard.totalApplications')}</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">{t('dashboard.pendingReview')}</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">{t('dashboard.approved')}</p>
          <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">{t('dashboard.admitted')}</p>
          <p className="text-3xl font-bold text-teal-600">{stats.admitted}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">{t('dashboard.rejected')}</p>
          <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
        </div>
      </div>

      {/* Students per Class Chart */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{t('dashboard.studentsPerClass')}</h2>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(['bar', 'line', 'pie'] as ChartType[]).map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                  chartType === type
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
          </div>
        ) : studentsPerClass.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            {t('dashboard.noAdmittedStudents')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            {chartType === 'bar' ? (
              <BarChart data={studentsPerClass} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="className" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [v, 'Students']} />
                <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                  {studentsPerClass.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            ) : chartType === 'line' ? (
              <LineChart data={studentsPerClass} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="className" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [v, 'Students']} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Students"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ fill: '#0ea5e9', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            ) : (
              <PieChart>
                <Pie
                  data={studentsPerClass}
                  dataKey="count"
                  nameKey="className"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  label={({ className, percent }) =>
                    `${className} (${((percent ?? 0) * 100).toFixed(0)}%)`
                  }
                >
                  {studentsPerClass.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v, 'Students']} />
                <Legend />
              </PieChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent Applications Table */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('dashboard.recentApplications')}</h2>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading applications...</p>
          </div>
        ) : requests && requests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('dashboard.studentName')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('dashboard.grade')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('dashboard.status')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('dashboard.date')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">{t('dashboard.action')}</th>
                </tr>
              </thead>
              <tbody>
                {requests.slice(0, 10).map((request) => (
                  <tr key={request.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">{request.id}</td>
                    <td className="py-3 px-4">{request.student_name}</td>
                    <td className="py-3 px-4">{request.grade_applying_for}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          statusColors[request.status].bg
                        } ${statusColors[request.status].text}`}
                      >
                        {request.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(request.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/admission/view/${request.id}`}
                        className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                      >
                        {t('dashboard.view')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {t('dashboard.noApplications')}
          </div>
        )}
      </div>
    </div>
  )
}
