"use client";

import { useState, useCallback, useRef } from "react";
import { Plus, Trash2, Loader2, Pencil } from "lucide-react";
import { useHubData } from "@/hooks/useHubData";
import { useHubDataStore } from "@/stores/hubDataStore";
import { api } from "@/lib/api";
import { GlowCard } from "@/components/shared";
import { cn } from "@/lib/utils";

import type { Company } from "@/types";

type EditingCell = { id: string; field: keyof Company } | null;

function generateId(): string {
  return `company-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyCompany(): Company {
  return {
    id: generateId(),
    name: "",
    shortName: "",
    sector: "",
    description: "",
    color: "#64748b",
    icon: "🏭",
    coordinates: [0, 0],
    annualEnergyGWh: 0,
    annualWasteTonnes: 0,
    employeeCount: 0,
  };
}

interface EditableCellProps {
  value: string | number;
  isEditing: boolean;
  onStartEdit: () => void;
  onChange: (val: string) => void;
  onBlur: () => void;
  type?: "text" | "number";
  className?: string;
}

function EditableCell({
  value,
  isEditing,
  onStartEdit,
  onChange,
  onBlur,
  type = "text",
  className,
}: EditableCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleStartEdit = () => {
    onStartEdit();
    // Focus after state update
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "Escape") {
            onBlur();
          }
        }}
        className={cn(
          "w-full bg-slate-700 border border-emerald-500/60 rounded px-2 py-0.5",
          "text-slate-100 text-sm outline-none focus:border-emerald-400",
          "min-w-0",
          className
        )}
        autoFocus
      />
    );
  }

  return (
    <button
      type="button"
      onClick={handleStartEdit}
      className={cn(
        "w-full text-left px-2 py-0.5 rounded text-sm text-slate-200",
        "hover:bg-slate-700/60 transition-colors cursor-text group/cell",
        "flex items-center gap-1 min-w-0",
        className
      )}
    >
      <span className="truncate flex-1">{value === 0 && type === "number" ? "0" : value || "—"}</span>
      <Pencil className="w-3 h-3 text-slate-500 opacity-0 group-hover/cell:opacity-100 flex-shrink-0" />
    </button>
  );
}

export function CompanyEditor() {
  const hub = useHubData();
  const setActiveHub = useHubDataStore((s) => s.setActiveHub);
  const activeHub = useHubDataStore((s) => s.activeHub);

  const [companies, setCompanies] = useState<Company[]>(() =>
    Object.values(hub.companies as Record<string, Company>)
  );
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const isMock = hub.id === "mock";

  const saveToHub = useCallback(
    async (updatedCompanies: Company[]) => {
      if (!activeHub) return;
      const companiesRecord = Object.fromEntries(updatedCompanies.map((c) => [c.id, c]));
      const updatedHub = { ...activeHub, companies: companiesRecord };

      // Update local store immediately
      setActiveHub(updatedHub);

      if (isMock) return;

      setSaving(true);
      try {
        await api.updateHub(activeHub.id, { companies: companiesRecord });
      } catch (err) {
        console.error("Failed to save companies:", err);
      } finally {
        setSaving(false);
      }
    },
    [activeHub, setActiveHub, isMock]
  );

  const updateField = useCallback(
    (id: string, field: keyof Company, value: string | number) => {
      setCompanies((prev) => {
        const updated = prev.map((c) => {
          if (c.id !== id) return c;
          const coerced =
            field === "annualEnergyGWh" || field === "annualWasteTonnes" || field === "employeeCount"
              ? Number(value) || 0
              : value;
          return { ...c, [field]: coerced };
        });
        return updated;
      });
    },
    []
  );

  const commitEdit = useCallback(
    (_id: string) => {
      setEditingCell(null);
      setCompanies((current) => {
        saveToHub(current);
        return current;
      });
    },
    [saveToHub]
  );

  const addCompany = useCallback(() => {
    const newCompany = emptyCompany();
    setCompanies((prev) => {
      const updated = [...prev, newCompany];
      saveToHub(updated);
      return updated;
    });
    setEditingCell({ id: newCompany.id, field: "name" });
  }, [saveToHub]);

  const deleteCompany = useCallback(
    (id: string) => {
      setCompanies((prev) => {
        const updated = prev.filter((c) => c.id !== id);
        saveToHub(updated);
        return updated;
      });
      setDeleteConfirm(null);
    },
    [saveToHub]
  );

  const isEditing = (id: string, field: keyof Company) =>
    editingCell?.id === id && editingCell?.field === field;

  const startEdit = (id: string, field: keyof Company) => setEditingCell({ id, field });

  return (
    <GlowCard className="p-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          <h2 className="text-slate-100 font-semibold text-sm">Selskaper / Aktører</h2>
          <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full">
            {companies.length}
          </span>
          {saving && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              Lagrer...
            </span>
          )}
        </div>
        {isMock && (
          <span className="text-xs text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
            Demo-modus — endringer lagres ikke
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/60 bg-slate-800/60">
              <th className="text-left px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wide w-[180px]">
                Navn
              </th>
              <th className="text-left px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wide w-[100px]">
                Kortnavn
              </th>
              <th className="text-left px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wide w-[140px]">
                Sektor
              </th>
              <th className="text-left px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wide w-[110px]">
                Energi (GWh/år)
              </th>
              <th className="text-left px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wide w-[120px]">
                Avfall (tonn/år)
              </th>
              <th className="text-left px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wide w-[90px]">
                Ansatte
              </th>
              <th className="text-left px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wide w-[70px]">
                Farge
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {companies.map((company) => (
              <tr
                key={company.id}
                className="group hover:bg-slate-700/20 transition-colors"
              >
                {/* Navn */}
                <td className="px-1 py-1">
                  <EditableCell
                    value={company.name}
                    isEditing={isEditing(company.id, "name")}
                    onStartEdit={() => startEdit(company.id, "name")}
                    onChange={(v) => updateField(company.id, "name", v)}
                    onBlur={() => commitEdit(company.id)}
                  />
                </td>

                {/* Kortnavn */}
                <td className="px-1 py-1">
                  <EditableCell
                    value={company.shortName}
                    isEditing={isEditing(company.id, "shortName")}
                    onStartEdit={() => startEdit(company.id, "shortName")}
                    onChange={(v) => updateField(company.id, "shortName", v)}
                    onBlur={() => commitEdit(company.id)}
                  />
                </td>

                {/* Sektor */}
                <td className="px-1 py-1">
                  <EditableCell
                    value={company.sector}
                    isEditing={isEditing(company.id, "sector")}
                    onStartEdit={() => startEdit(company.id, "sector")}
                    onChange={(v) => updateField(company.id, "sector", v)}
                    onBlur={() => commitEdit(company.id)}
                  />
                </td>

                {/* Energi */}
                <td className="px-1 py-1">
                  <EditableCell
                    value={company.annualEnergyGWh}
                    isEditing={isEditing(company.id, "annualEnergyGWh")}
                    onStartEdit={() => startEdit(company.id, "annualEnergyGWh")}
                    onChange={(v) => updateField(company.id, "annualEnergyGWh", v)}
                    onBlur={() => commitEdit(company.id)}
                    type="number"
                  />
                </td>

                {/* Avfall */}
                <td className="px-1 py-1">
                  <EditableCell
                    value={company.annualWasteTonnes}
                    isEditing={isEditing(company.id, "annualWasteTonnes")}
                    onStartEdit={() => startEdit(company.id, "annualWasteTonnes")}
                    onChange={(v) => updateField(company.id, "annualWasteTonnes", v)}
                    onBlur={() => commitEdit(company.id)}
                    type="number"
                  />
                </td>

                {/* Ansatte */}
                <td className="px-1 py-1">
                  <EditableCell
                    value={company.employeeCount}
                    isEditing={isEditing(company.id, "employeeCount")}
                    onStartEdit={() => startEdit(company.id, "employeeCount")}
                    onChange={(v) => updateField(company.id, "employeeCount", v)}
                    onBlur={() => commitEdit(company.id)}
                    type="number"
                  />
                </td>

                {/* Farge */}
                <td className="px-1 py-1">
                  <label className="flex items-center gap-2 px-2 py-0.5 rounded hover:bg-slate-700/60 cursor-pointer transition-colors">
                    <span
                      className="w-5 h-5 rounded border border-slate-600 flex-shrink-0"
                      style={{ backgroundColor: company.color }}
                    />
                    <input
                      type="color"
                      value={company.color}
                      onChange={(e) => {
                        updateField(company.id, "color", e.target.value);
                      }}
                      onBlur={() => commitEdit(company.id)}
                      className="w-0 h-0 opacity-0 absolute"
                    />
                  </label>
                </td>

                {/* Delete */}
                <td className="px-1 py-1 text-center">
                  {deleteConfirm === company.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => deleteCompany(company.id)}
                        className="text-xs text-red-400 hover:text-red-300 font-medium px-1"
                        title="Bekreft sletting"
                      >
                        Slett
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="text-xs text-slate-400 hover:text-slate-300 px-1"
                      >
                        Avbryt
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(company.id)}
                      className={cn(
                        "p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-400/10",
                        "opacity-0 group-hover:opacity-100 transition-all"
                      )}
                      title="Slett selskap"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {companies.length === 0 && (
          <div className="py-10 text-center text-slate-500 text-sm">
            Ingen selskaper lagt til ennå
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-slate-700/60">
        <button
          onClick={addCompany}
          className={cn(
            "flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300",
            "px-3 py-1.5 rounded border border-emerald-500/30 hover:border-emerald-500/60",
            "bg-emerald-500/5 hover:bg-emerald-500/10 transition-all"
          )}
        >
          <Plus className="w-4 h-4" />
          Legg til selskap
        </button>
      </div>
    </GlowCard>
  );
}
