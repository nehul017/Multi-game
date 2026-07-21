'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flag, Check, X, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { adminService } from '@/services/admin.service';
import toast from 'react-hot-toast';

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const queryClient = useQueryClient();

  const { data: reportsRes, isLoading, isError, refetch } = useQuery({
    queryKey: ['adminReports', activeTab],
    queryFn: () => adminService.getReports(activeTab === 'all' ? undefined : activeTab),
  });

  const resolveReport = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => adminService.resolveReport(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReports'] });
      toast.success('Report resolved');
    },
    onError: () => toast.error('Failed to resolve report'),
  });

  const rawData = reportsRes?.data as unknown;
  const reports: any[] = Array.isArray(rawData)
    ? rawData
    : ((rawData as Record<string, unknown>)?.data as any[]) ?? [];

  const tabs = [
    { id: 'pending', label: 'Pending', count: reports.filter((r: any) => r.status === 'pending').length },
    { id: 'resolved', label: 'Resolved' },
    { id: 'dismissed', label: 'Dismissed' },
  ];

  if (isError) {
    return (
      <AdminLayout>
        <ErrorState title="Failed to load reports" message="Could not fetch report data." onRetry={refetch} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Flag className="w-7 h-7 text-red-400" />
            Reports
          </h1>
          <p className="text-gray-400 mt-1">Review and manage user reports</p>
        </motion.div>

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-surface/80 border border-surface-lighter/50 rounded-2xl p-6 flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            ))
          ) : reports.length === 0 ? (
            <EmptyState title="No reports" description={`No ${activeTab} reports found.`} />
          ) : (
            reports.map((report: any, i: number) => (
              <motion.div
                key={report._id || report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">Report against</span>
                      <span className="text-sm font-semibold text-red-400">
                        {report.reportedUser?.username || report.reported || '—'}
                      </span>
                      <Badge variant={report.status === 'pending' ? 'warning' : report.status === 'resolved' ? 'success' : 'default'}>
                        {report.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mb-1">{report.reason}</p>
                    <p className="text-xs text-gray-500">
                      Reported by <span className="text-gray-300">{report.reporter?.username || report.reporter || '—'}</span>
                      {' '}on {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  {report.status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Check className="w-4 h-4" />}
                        onClick={() => resolveReport.mutate({ id: report._id || report.id, action: 'resolve' })}
                        disabled={resolveReport.isPending}
                      >
                        Resolve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<X className="w-4 h-4" />}
                        onClick={() => resolveReport.mutate({ id: report._id || report.id, action: 'dismiss' })}
                        disabled={resolveReport.isPending}
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
