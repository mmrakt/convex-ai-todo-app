import { useQuery } from 'convex/react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  getPriorityBadgeProps,
  getStatusBadgeProps,
} from '@/components/ui';
import { api } from '../../convex/_generated/api';

export function Dashboard() {
  const stats = useQuery(api.tasks.getTaskStats);
  const recentTasks = useQuery(api.tasks.getTasks, { limit: 5 });

  if (stats === undefined || recentTasks === undefined) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          おはようございます！
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{today}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="全タスク" value={stats.total} icon="📝" color="bg-blue-500" />
        <StatsCard title="進行中" value={stats.inProgress} icon="⚡" color="bg-yellow-500" />
        <StatsCard title="完了" value={stats.completed} icon="✅" color="bg-green-500" />
        <StatsCard title="完了率" value={`${completionRate}%`} icon="📊" color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>優先度別サマリー</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <PriorityItem priority="urgent" count={stats.urgent || 0} />
              <PriorityItem priority="high" count={stats.high} />
              <PriorityItem priority="medium" count={stats.medium} />
              <PriorityItem priority="low" count={stats.low} />
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle>最近のタスク</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTasks.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                まだタスクがありません
              </p>
            ) : (
              <div className="space-y-3">
                {recentTasks.slice(0, 5).map((task) => (
                  <div
                    key={task._id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge {...getStatusBadgeProps(task.status)} size="sm" />
                        <Badge {...getPriorityBadgeProps(task.priority)} size="sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button size="lg" className="flex-1">
          新しいタスクを作成
        </Button>
        <Button variant="secondary" size="lg" className="flex-1">
          タスク一覧を表示
        </Button>
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

function StatsCard({ title, value, icon, color }: StatsCardProps) {
  return (
    <Card variant="elevated" className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`p-3 rounded-lg ${color} text-white text-2xl mr-4`}>{icon}</div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PriorityItemProps {
  priority: string;
  count: number;
}

function PriorityItem({ priority, count }: PriorityItemProps) {
  const { variant, children } = getPriorityBadgeProps(priority);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Badge variant={variant} size="sm">
          {children}
        </Badge>
        <span className="text-sm text-gray-600 dark:text-gray-400">優先度</span>
      </div>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{count}件</span>
    </div>
  );
}
