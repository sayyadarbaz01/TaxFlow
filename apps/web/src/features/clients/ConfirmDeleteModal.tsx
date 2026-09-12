import React, { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { ClientRecord } from "@ca-saas/shared-types";
import { useDeleteClientMutation } from "../../lib/api";

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientRecord | null;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  client
}) => {
  const [errorMsg, setErrorMsg] = useState("");
  const [deleteClient, { isLoading }] = useDeleteClientMutation();

  const handleConfirm = async () => {
    if (!client) return;
    setErrorMsg("");
    try {
      await deleteClient(client.id).unwrap();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.data?.error?.message || "Failed to delete client. Please try again.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Client Confirmation" maxWidth="md">
      <div className="space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Are you sure you want to delete this client?
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              This action is permanent and will cascade to remove all associated filings, returns, tasks, invoices, and documents.
            </p>
          </div>
        </div>

        {client && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Client Name:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{client.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">PAN:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">{client.pan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Scope of Work:</span>
              <span className="font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800/60 text-[11px]">
                {client.workType || "ITR"}
              </span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-lg font-medium">
            {errorMsg}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleConfirm}
            isLoading={isLoading}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Delete Client
          </Button>
        </div>
      </div>
    </Modal>
  );
};
