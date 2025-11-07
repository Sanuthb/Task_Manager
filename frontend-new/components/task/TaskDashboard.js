"use client";
import { useEffect, useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";
import { TasksAPI } from "@/lib/api";
import { TaskCard } from "./TaskCard";
import { NewTaskModal } from "./NewTaskModal";
import ExportButtons from "./ExportButtons";

const STATUSES = [
  { key: 'pending', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

export function TaskDashboard() {
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({ priority: '', category: '' });
  const [open, setOpen] = useState(false);

  const load = async () => {
    const data = await TasksAPI.list({
      priority: filters.priority || undefined,
      category: filters.category || undefined,
    });
    setTasks(data);
  };

  useEffect(() => { load(); }, [filters]);

  // Browser reminder notifications
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timers = [];
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
    const now = Date.now();
    for (const t of tasks) {
      const reminder = t.reminder_date;
      if (!reminder || t.status === 'completed') continue;
      const ts = new Date(reminder).getTime();
      const delay = ts - now;
      if (delay > 0 && delay < 7 * 24 * 60 * 60 * 1000) {
        const id = setTimeout(() => {
          if (Notification.permission === 'granted') {
            const time = new Date(reminder).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            new Notification('Task Reminder', { body: `${t.title} at ${time}` });
          }
        }, delay);
        timers.push(id);
      }
    }
    return () => timers.forEach(clearTimeout);
  }, [tasks]);

  const columns = useMemo(() => {
    return STATUSES.reduce((acc, s) => {
      acc[s.key] = tasks.filter((t) => t.status === s.key);
      return acc;
    }, {});
  }, [tasks]);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;
    const id = parseInt(draggableId, 10);
    const newStatus = destination.droppableId;
    await TasksAPI.update(id, { status: newStatus });
    await load();
  };

  const onRecalc = async (task) => {
    await TasksAPI.update(task.id, { title: task.title });
    await load();
  };
  const onUpdateStatus = async (task, status) => {
    await TasksAPI.update(task.id, { status });
    await load();
  };
  const onDelete = async (task) => {
    await TasksAPI.remove(task.id);
    await load();
  };
  const onMarkDone = async (task) => {
    await TasksAPI.update(task.id, { status: 'completed' });
    await load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Priority</label>
            <Select value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </Select>
          </div>
          <div>
            <label className="block text-sm mb-1">Category</label>
            <input className="h-10 w-full rounded-md border bg-background px-2 text-sm" value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons />
          <Button onClick={() => setOpen(true)}>New Task</Button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {STATUSES.map((s) => (
            <div key={s.key} className="rounded-lg border p-3">
              <h3 className="mb-3 text-sm font-semibold">{s.label}</h3>
              <Droppable droppableId={s.key}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3 min-h-10">
                    {columns[s.key].map((t, idx) => (
                      <Draggable key={t.id} draggableId={`${t.id}`} index={idx}>
                        {(prov) => (
                          <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                            <TaskCard task={t} onRecalc={onRecalc} onUpdateStatus={onUpdateStatus} onDelete={onDelete} onMarkDone={onMarkDone} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      <NewTaskModal open={open} onOpenChange={setOpen} onCreated={load} />
    </div>
  );
}
