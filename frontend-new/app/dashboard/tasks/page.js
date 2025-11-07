import { TaskDashboard } from "@/components/task/TaskDashboard";

export default function TasksPage() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">My Tasks</h1>
      <TaskDashboard />
    </main>
  );
}
