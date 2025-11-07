'use client';
import { useEffect, useState } from 'react';
import { TasksAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AnalyticsPage() {
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, in_progress: 0 });

  useEffect(() => {
    TasksAPI.stats().then(setStats).catch(() => {});
  }, []);

  const tiles = [
    { key: 'total', label: 'Total Tasks' },
    { key: 'completed', label: 'Completed' },
    { key: 'pending', label: 'Pending' },
    { key: 'in_progress', label: 'In Progress' },
  ];

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Analytics</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {tiles.map(t => (
          <Card key={t.key}>
            <CardHeader>
              <CardTitle className="text-base">{t.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats[t.key] ?? 0}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
