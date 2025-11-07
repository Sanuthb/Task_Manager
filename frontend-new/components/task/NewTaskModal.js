"use client";
import { useEffect, useRef, useState } from "react";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";
import { TasksAPI } from "@/lib/api";

export function NewTaskModal({ open, onOpenChange, onCreated }) {
  const [text, setText] = useState("");
  const [form, setForm] = useState({ title: "", description: "", category: "", priority: "medium", due_date: "", reminder_date: "" });
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const Rec = window.webkitSpeechRecognition;
      const rec = new Rec();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';
      rec.onresult = (e) => {
        const transcript = Array.from(e.results).map(r => r[0].transcript).join(' ');
        setText((prev) => `${prev} ${transcript}`.trim());
        setListening(false);
      };
      rec.onend = () => setListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) return;
    try { setListening(true); recognitionRef.current.start(); } catch {}
  };
  const stopListening = () => {
    try { recognitionRef.current?.stop(); } catch {}
  };

  const parse = async () => {
    const parsed = await TasksAPI.parse(text);
    setForm((f) => ({
      ...f,
      title: parsed.title || f.title,
      description: f.description,
      category: parsed.category || f.category || "",
      priority: parsed.priority || f.priority || "medium",
      due_date: parsed.due_date || f.due_date || "",
      reminder_date: parsed.reminder_date || f.reminder_date || "",
    }));
  };

  const create = async () => {
    const payload = { ...form };
    if (!payload.title) return;
    await TasksAPI.create(payload);
    onCreated?.();
    onOpenChange(false);
    setText("");
    setForm({ title: "", description: "", category: "", priority: "medium", due_date: "", reminder_date: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>New Task</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">NLP</label>
            <textarea className="w-full h-20 rounded-md border bg-background p-2 text-sm" value={text} onChange={(e) => setText(e.target.value)} />
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={parse}>Parse</Button>
              <Button size="sm" variant={listening ? 'destructive' : 'secondary'} onClick={listening ? stopListening : startListening}>{listening ? 'Stop' : 'Start'} Voice</Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Title</label>
              <input className="w-full h-10 rounded-md border bg-background px-2 text-sm" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm mb-1">Category</label>
              <input className="w-full h-10 rounded-md border bg-background px-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm mb-1">Priority</label>
              <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </Select>
            </div>
            <div>
              <label className="block text-sm mb-1">Due Date</label>
              <input type="datetime-local" className="w-full h-10 rounded-md border bg-background px-2 text-sm" value={form.due_date || ""} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm mb-1">Reminder Date</label>
              <input type="datetime-local" className="w-full h-10 rounded-md border bg-background px-2 text-sm" value={form.reminder_date || ""} onChange={(e) => setForm({ ...form, reminder_date: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Description</label>
            <textarea className="w-full h-24 rounded-md border bg-background p-2 text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
      </DialogContent>
      <DialogFooter>
        <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={create}>Create</Button>
      </DialogFooter>
    </Dialog>
  );
}
