import React, { useState } from "react";
import { Plus, CheckSquare, Clock, User, AlertCircle } from "lucide-react";
import { useGetTasksQuery, useCreateTaskMutation, useUpdateTaskStatusMutation } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { TaskRecord, TaskStatus, TaskPriority } from "@ca-saas/shared-types";

export const TaskKanbanPage: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("a1b2c3d4-e5f6-7890-abcd-ef1234567890");
  const [dueDate, setDueDate] = useState("2026-09-25");
  const [priority, setPriority] = useState<TaskPriority>("HIGH");

  const { data, isLoading } = useGetTasksQuery({});
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTaskStatus] = useUpdateTaskStatusMutation();

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTask({ title, clientId, dueDate, priority }).unwrap();
      setIsCreateOpen(false);
      setTitle("");
    } catch (err: any) {
      alert(err.data?.error?.message || "Task creation failed");
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTaskStatus({ id: taskId, status: newStatus }).unwrap();
    } catch (err: any) {
      alert("Failed to update status");
    }
  };

  const tasks = data?.data || [];
  const todoTasks = tasks.filter((t: any) => t.status === "TODO");
  const inProgressTasks = tasks.filter((t: any) => t.status === "IN_PROGRESS");
  const doneTasks = tasks.filter((t: any) => t.status === "DONE");

  const renderColumn = (colTitle: string, taskList: TaskRecord[], colStatus: TaskStatus) => (
    <div className="bg-slate-100/70 p-4 rounded-xl border border-slate-200 flex flex-col space-y-3 min-h-[500px]">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{colTitle}</h3>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-700 shadow-2xs">
          {taskList.length}
        </span>
      </div>

      <div className="space-y-3 flex-1">
        {taskList.map((task) => (
          <Card key={task.id} className="bg-white shadow-2xs hover:shadow-md transition-smooth">
            <div className="flex items-start justify-between">
              <h4 className="text-xs font-bold text-slate-900 leading-snug">{task.title}</h4>
              <StatusBadge status={task.priority} />
            </div>

            <p className="text-[11px] text-slate-500 mt-1">{task.clientName}</p>

            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-1 text-slate-500">
                <Clock className="w-3 h-3 text-slate-400" />
                {task.dueDate}
              </span>

              {/* Status Toggle Buttons */}
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                className="text-[10px] font-semibold border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50 focus:outline-none"
              >
                <option value="TODO">TO DO</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="DONE">DONE</option>
              </select>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Task & Operational Kanban</h1>
          <p className="text-xs text-slate-500 mt-1">Workflow automation tasks auto-generated from statutory deadlines and document checklist completion.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Create Task
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderColumn("To Do", todoTasks, "TODO")}
        {renderColumn("In Progress", inProgressTasks, "IN_PROGRESS")}
        {renderColumn("Completed", doneTasks, "DONE")}
      </div>

      {/* Create Task Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Operational Task">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input label="Task Title" placeholder="e.g. Verify Tax Audit Financials" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Input label="Target Due Date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          <Select
            label="Priority Level"
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            options={[
              { value: "LOW", label: "Low Priority" },
              { value: "MEDIUM", label: "Medium Priority" },
              { value: "HIGH", label: "High Priority" },
              { value: "URGENT", label: "Urgent Priority" }
            ]}
          />
          <Button type="submit" className="w-full" isLoading={isCreating}>
            Create Task
          </Button>
        </form>
      </Modal>
    </div>
  );
};
