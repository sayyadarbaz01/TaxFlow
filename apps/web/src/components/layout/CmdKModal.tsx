import React, { useState } from "react";
import { Search, User, FileText, Calendar, CreditCard, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../ui/Modal";
import { useGetClientsQuery, useGetItrFilingsQuery, useGetInvoicesQuery } from "../../lib/api";

export interface CmdKModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CmdKModal: React.FC<CmdKModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const { data: clientsData } = useGetClientsQuery({ search: searchTerm }, { skip: !isOpen });
  const { data: itrData } = useGetItrFilingsQuery({}, { skip: !isOpen });
  const { data: invoiceData } = useGetInvoicesQuery({}, { skip: !isOpen });

  if (!isOpen) return null;

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Global Quick Search" maxWidth="lg">
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            autoFocus
            placeholder="Type client name, PAN, GSTIN, or invoice number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="max-h-72 overflow-y-auto space-y-4 pr-1">
          {/* Clients Section */}
          <div>
            <h4 className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Clients</h4>
            <div className="space-y-1">
              {clientsData?.data.slice(0, 4).map((c: any) => (
                <div
                  key={c.id}
                  onClick={() => handleSelect(`/clients/${c.id}`)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-smooth group"
                >
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">{c.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">PAN: {c.pan} | GSTIN: {c.gstin || "N/A"}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-smooth" />
                </div>
              ))}
            </div>
          </div>

          {/* ITR Filings Section */}
          <div>
            <h4 className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">ITR Filings</h4>
            <div className="space-y-1">
              {itrData?.data.slice(0, 3).map((itr: any) => (
                <div
                  key={itr.id}
                  onClick={() => handleSelect("/itr")}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-smooth group"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">{itr.clientName} — {itr.assessmentYear}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Form: {itr.itrFormType} | Status: {itr.status}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-smooth" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

