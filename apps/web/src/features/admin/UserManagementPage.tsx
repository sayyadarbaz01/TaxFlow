import React, { useState } from "react";
import { ShieldCheck, Plus, User, Key, Mail } from "lucide-react";
import { useGetAdminUsersQuery, useRegisterUserMutation } from "../../lib/api";
import { Table, Column } from "../../components/ui/Table";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { SystemRole } from "@ca-saas/shared-types";

export const UserManagementPage: React.FC = () => {
  const { data, isLoading } = useGetAdminUsersQuery({});
  const [registerUser, { isLoading: isCreating }] = useRegisterUserMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleName, setRoleName] = useState<SystemRole>("Admin");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name.trim() || name.trim().length < 2) {
      return setErrorMsg("Full Name must be at least 2 characters");
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return setErrorMsg("Valid email address is required");
    }
    if (!password || password.length < 6) {
      return setErrorMsg("Password must be at least 6 characters");
    }

    try {
      await registerUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        roleName
      }).unwrap();

      setSuccessMsg(`User ${name} successfully created with ${roleName} role.`);
      setName("");
      setEmail("");
      setPassword("");
      setRoleName("Admin");
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMsg("");
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.data?.error?.message || "Failed to create user");
    }
  };

  const columns: Column<any>[] = [
    {
      header: "User Name",
      cell: (row) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-xs">
            {row.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-xs">{row.name}</p>
            <span className="text-[10px] text-slate-500">{row.email}</span>
          </div>
        </div>
      )
    },
    {
      header: "System Role",
      cell: (row) => <StatusBadge status={row.role} />
    },
    {
      header: "Joined Date",
      cell: (row) => <span className="font-mono text-xs text-slate-700">{new Date(row.createdAt).toLocaleDateString()}</span>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">User Administration</h1>
          <p className="text-xs text-slate-500 mt-1">Manage firm user accounts with SuperAdmin and Admin roles.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Add User
        </Button>
      </div>

      <Table columns={columns} data={data?.data || []} isLoading={isLoading} emptyText="No users found." />

      {/* Add User Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Firm User" maxWidth="md">
        <form onSubmit={handleCreateUser} className="space-y-4">
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg font-medium">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-2.5 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-medium">
              {successMsg}
            </div>
          )}

          <Input
            label="Full Name"
            placeholder="e.g. Rahul Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="rahul@taxflow.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Select
            label="System Role"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value as SystemRole)}
            options={[
              { value: "Admin", label: "Admin - Tax operations, filings, CRM, and billing" },
              { value: "SuperAdmin", label: "SuperAdmin - Full system & user administration" }
            ]}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" isLoading={isCreating}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
