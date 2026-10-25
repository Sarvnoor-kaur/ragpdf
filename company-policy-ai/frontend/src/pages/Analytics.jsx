import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import {
  FileText,
  MessageSquare,
  Users,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import * as analyticsService from '../services/analyticsService';

const Analytics = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('all'); // days or 'all'
  const [metrics, setMetrics] = useState(null);
  const [queryTrends, setQueryTrends] = useState([]);
  const [documentsByDept, setDocumentsByDept] = useState([]);
  const [mostAccessed, setMostAccessed] = useState([]);

  const COLORS = ['#635BFF', '#8B5CF6', '#16A34A', '#F59E0B', '#DC2626', '#3B82F6'];

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      let params = {};

      // Only add date filter if not "all time"
      if (dateRange !== 'all') {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(dateRange));

        params = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        };
      }

      console.log('Fetching analytics with params:', params);

      // Fetch all data
      const [metricsRes, trendsRes, deptRes, accessedRes] = await Promise.all([
        analyticsService.getOverviewMetrics(params),
        analyticsService.getQueryTrends({ ...params, interval: 'day' }),
        analyticsService.getDocumentsByDepartment(),
        analyticsService.getMostAccessedDocuments({ limit: 10 }),
      ]);

      console.log('Metrics Response:', metricsRes.data);
      console.log('Trends Response:', trendsRes.data);
      console.log('Dept Response:', deptRes.data);
      console.log('Accessed Response:', accessedRes.data);

      setMetrics(metricsRes.data.data);
      setQueryTrends(trendsRes.data.data);
      setDocumentsByDept(deptRes.data.data);
      setMostAccessed(accessedRes.data.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      console.error('Error details:', error.response?.data);
      setError(error.response?.data?.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const KPICard = ({ title, value, icon: Icon, trend, color = 'primaryAccent' }) => (
    <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-${color}/10 flex items-center justify-center`}>
          <Icon className={`w-6 h-6 text-${color}`} style={{ color: color === 'primaryAccent' ? '#635BFF' : undefined }} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${trend > 0 ? 'text-success' : 'text-red-600'}`}>
            {trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <h3 className="text-secondaryText text-sm font-medium mb-2">{title}</h3>
      <p className="text-3xl font-bold text-primaryText">{value?.toLocaleString() || 0}</p>
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout user={user} logout={logout}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-primaryAccent animate-spin mx-auto mb-4" />
            <p className="text-secondaryText">Loading analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout user={user} logout={logout}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-primaryText mb-2">Failed to Load Analytics</h2>
            <p className="text-secondaryText mb-4">{error}</p>
            <button
              onClick={fetchAnalyticsData}
              className="px-6 py-3 bg-primaryAccent text-white rounded-xl hover:shadow-lg transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user} logout={logout}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-primaryText mb-2">Policy Intelligence Analytics</h1>
            <p className="text-secondaryText">
              Monitor policy usage, AI performance, document health, and compliance activity.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-border rounded-xl text-sm font-medium text-primaryText bg-white focus:outline-none focus:ring-2 focus:ring-primaryAccent/20"
            >
              <option value="all">All Time</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
            <button
              onClick={fetchAnalyticsData}
              className="px-4 py-2 bg-primaryAccent text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total Documents"
          value={metrics?.totalDocuments}
          icon={FileText}
          color="#635BFF"
        />
        <KPICard
          title="AI Queries"
          value={metrics?.totalQueries}
          icon={MessageSquare}
          color="#8B5CF6"
        />
        <KPICard
          title="Queries with Sources"
          value={metrics?.queriesWithSources}
          icon={CheckCircle2}
          color="#16A34A"
        />
        <KPICard
          title="Active Users"
          value={metrics?.activeUsers}
          icon={Users}
          color="#F59E0B"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Query Trends Line Chart */}
        <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-primaryText mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primaryAccent" />
            AI Query Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={queryTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EAF2" />
              <XAxis dataKey="_id.period" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E8EAF2',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="totalQueries"
                stroke="#635BFF"
                strokeWidth={2}
                name="Total Queries"
              />
              <Line
                type="monotone"
                dataKey="queriesWithSources"
                stroke="#16A34A"
                strokeWidth={2}
                name="With Sources"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Documents by Department Pie Chart */}
        <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-primaryText mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primaryAccent" />
            Documents by Department
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={documentsByDept}
                dataKey="count"
                nameKey="_id"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry._id}: ${entry.count}`}
              >
                {documentsByDept.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E8EAF2',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Most Accessed Documents */}
      <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-primaryText mb-4">Most Accessed Policies</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={mostAccessed} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EAF2" />
            <XAxis type="number" stroke="#6B7280" />
            <YAxis dataKey="documentName" type="category" width={200} stroke="#6B7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E8EAF2',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="accessCount" fill="#635BFF" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
