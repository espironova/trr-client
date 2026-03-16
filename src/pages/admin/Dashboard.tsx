import { useMemo } from 'react';
import { FolderOpen, Activity, MessageSquare, Star, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCategories } from '@/hooks/useCategories';
import { useActivities } from '@/hooks/useActivities';
import { useInquiries } from '@/hooks/useInquiries';
import { useFeedback } from '@/hooks/useFeedback';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from 'recharts';

const CHART_COLORS = [
  'hsl(120, 40%, 30%)',
  'hsl(75, 60%, 50%)',
  'hsl(30, 40%, 35%)',
  'hsl(0, 84%, 60%)',
  'hsl(200, 50%, 50%)',
];

export default function AdminDashboard() {
  const { data: categories = [] } = useCategories();
  const { data: activities = [] } = useActivities();
  const { data: inquiries = [] } = useInquiries();
  const { data: feedback = [] } = useFeedback();
  
  const unreadInquiries = inquiries.filter(i => !i.is_read).length;
  const unreviewedFeedback = feedback.filter(f => f.status === 'not_reviewed').length;

  // Rating distribution
  const ratingDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    feedback.forEach(f => { if (f.rating) dist[f.rating - 1]++; });
    return dist.map((count, i) => ({ stars: `${i + 1}★`, count }));
  }, [feedback]);

  // Feedback type breakdown
  const typeBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    feedback.forEach(f => { map[f.feedback_type] = (map[f.feedback_type] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [feedback]);

  // Average rating over time (by month)
  const ratingOverTime = useMemo(() => {
    const monthMap: Record<string, { total: number; count: number }> = {};
    feedback.forEach(f => {
      if (!f.rating) return;
      const month = f.created_at.slice(0, 7); // YYYY-MM
      if (!monthMap[month]) monthMap[month] = { total: 0, count: 0 };
      monthMap[month].total += f.rating;
      monthMap[month].count++;
    });
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, { total, count }]) => ({
        month,
        avg: parseFloat((total / count).toFixed(1)),
      }));
  }, [feedback]);

  const avgRating = useMemo(() => {
    const rated = feedback.filter(f => f.rating);
    if (rated.length === 0) return null;
    return (rated.reduce((sum, f) => sum + (f.rating || 0), 0) / rated.length).toFixed(1);
  }, [feedback]);

  const stats = [
    { label: 'Categories', value: categories.length, icon: FolderOpen, href: '/admin/categories', color: 'bg-primary/10 text-primary' },
    { label: 'Activities', value: activities.length, icon: Activity, href: '/admin/activities', color: 'bg-accent/20 text-accent-foreground' },
    { label: 'New Inquiries', value: unreadInquiries, icon: MessageSquare, href: '/admin/inquiries', color: 'bg-secondary/20 text-secondary' },
    { label: 'Unreviewed Feedback', value: unreviewedFeedback, icon: Star, href: '/admin/feedback', color: 'bg-accent/20 text-accent-foreground' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
          <Link to="/" target="_blank" className="flex items-center gap-2 text-sm text-primary hover:underline">
            <Eye className="w-4 h-4" />
            View Guest Menu
          </Link>
        </div>
        
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link key={stat.label} to={stat.href}>
              <Card className="hover:shadow-card transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-display">{stat.value}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Feedback Analytics */}
        {feedback.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Rating Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-base">
                  Rating Distribution
                  {avgRating && <span className="text-sm font-normal text-muted-foreground ml-2">(Avg: {avgRating}★)</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={ratingDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="stars" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(120, 40%, 30%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Feedback Type Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-base">Feedback Types</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={typeBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                      {typeBreakdown.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Average Rating Over Time */}
            {ratingOverTime.length > 1 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="font-display text-base">Average Rating Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={ratingOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="avg" stroke="hsl(120, 40%, 30%)" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Link to="/admin/activities" className="p-4 rounded-lg border border-border hover:bg-muted transition-colors">
              <h3 className="font-medium text-foreground">Manage Activities</h3>
              <p className="text-sm text-muted-foreground mt-1">Add, edit, or remove activities and prices</p>
            </Link>
            <Link to="/admin/categories" className="p-4 rounded-lg border border-border hover:bg-muted transition-colors">
              <h3 className="font-medium text-foreground">Manage Categories</h3>
              <p className="text-sm text-muted-foreground mt-1">Organize activities into categories</p>
            </Link>
            <Link to="/admin/inquiries" className="p-4 rounded-lg border border-border hover:bg-muted transition-colors">
              <h3 className="font-medium text-foreground">View Inquiries</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {unreadInquiries > 0 ? `${unreadInquiries} new message(s)` : 'Check guest messages'}
              </p>
            </Link>
            <Link to="/admin/settings" className="p-4 rounded-lg border border-border hover:bg-muted transition-colors">
              <h3 className="font-medium text-foreground">Settings</h3>
              <p className="text-sm text-muted-foreground mt-1">Update contact info and preferences</p>
            </Link>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
