// Helper functions for badge variants based on task priority and status

export const getPriorityBadgeProps = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return { variant: 'destructive' as const, children: 'Urgent' };
    case 'high':
      return { variant: 'outline' as const, children: 'High' };
    case 'medium':
      return { variant: 'default' as const, children: 'Medium' };
    case 'low':
      return { variant: 'secondary' as const, children: 'Low' };
    default:
      return { variant: 'secondary' as const, children: 'Unknown' };
  }
};

export const getStatusBadgeProps = (status: string) => {
  switch (status) {
    case 'completed':
      return { variant: 'default' as const, children: 'Completed' };
    case 'in_progress':
      return { variant: 'outline' as const, children: 'In Progress' };
    case 'todo':
      return { variant: 'secondary' as const, children: 'To Do' };
    case 'on_hold':
      return { variant: 'outline' as const, children: 'On Hold' };
    default:
      return { variant: 'secondary' as const, children: 'Unknown' };
  }
};
