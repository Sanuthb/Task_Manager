"use client";
import { Button } from "@/components/ui/button";
import { TasksAPI } from "@/lib/api";

export default function ExportButtons() {
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={() => TasksAPI.export('excel')}>Export Excel</Button>
      <Button size="sm" variant="outline" onClick={() => TasksAPI.export('pdf')}>Export PDF</Button>
    </div>
  );
}
