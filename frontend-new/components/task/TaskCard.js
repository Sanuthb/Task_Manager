"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TasksAPI } from "@/lib/api";

export function TaskCard({ task, onRecalc, onUpdateStatus, onDelete, onMarkDone }) {
  const completedCount = task.subtasks?.filter((s) => s.status === 'completed').length || 0;
  const totalCount = task.subtasks?.length || 0;

  return (
    <Card className="space-y-2">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{task.title}</CardTitle>
          <span className="text-xs rounded bg-muted px-2 py-1">AI {Math.round(task.priority_score ?? 0)}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {task.category || 'uncategorized'} · {task.priority}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {task.description ? (
          <p className="text-sm text-muted-foreground line-clamp-3">{task.description}</p>
        ) : null}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground items-center">
          <span>Subtasks {completedCount}/{totalCount}</span>
          {task.reminder_date ? (
            <span className="rounded border px-2 py-0.5">Reminder {new Date(task.reminder_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onRecalc(task)}>Recalc</Button>
          <Button size="sm" variant="outline" onClick={() => onUpdateStatus(task, 'pending')}>To Do</Button>
          <Button size="sm" variant="outline" onClick={() => onUpdateStatus(task, 'in_progress')}>In Progress</Button>
          <Button size="sm" variant="outline" onClick={() => onUpdateStatus(task, 'completed')}>Done</Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(task)}>Delete</Button>
          {task.status !== 'completed' && (
            <Button size="sm" variant="secondary" onClick={() => onMarkDone(task)}>Mark Done</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
