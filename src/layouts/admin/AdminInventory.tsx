// src/layouts/admin/AdminInventory.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Package as PackageIcon,
  Filter as FilterIcon,
  AlertTriangle as AlertTriangleIcon,
  X as XIcon,
  Search as SearchIcon,
  Loader2 as Loader2Icon,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const ADMIN_API = `${API_BASE}/api/admin`;

function getAuthHeaders() {
  const token = localStorage.getItem("authToken");
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

type InventoryItem = {
  id: string;
  name: string;
  category: string;
  stock: number;
  status: "Healthy" | "Reorder soon" | "Low" | string;
  reorderThreshold?: number;
  expiryDate?: string | null;
};

type CreateInventoryPayload = {
  itemCode: string;
  name: string;
  category: string;
  stock: number;
  reorderThreshold: number;
  expiryDate?: string | null;
};

function computeStatus(stock: number, reorderThreshold?: number) {
  const rt = typeof reorderThreshold === "number" ? reorderThreshold : null;
  if (rt == null) return "Healthy";
  if (stock <= rt) return "Low";
  if (stock <= Math.ceil(rt * 1.5)) return "Reorder soon";
  return "Healthy";
}

export const AdminInventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI helpers
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [itemCode, setItemCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Consumables");
  const [stock, setStock] = useState<number>(0);
  const [reorderThreshold, setReorderThreshold] = useState<number>(10);
  const [expiryDate, setExpiryDate] = useState<string>(""); // YYYY-MM-DD

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) {
      if (it.category) set.add(it.category);
    }
    return ["ALL", ...Array.from(set).sort()];
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      const matchesQuery =
        !q ||
        it.name.toLowerCase().includes(q) ||
        it.id.toLowerCase().includes(q) ||
        (it.category || "").toLowerCase().includes(q);

      const matchesCategory =
        categoryFilter === "ALL" || it.category === categoryFilter;

      return matchesQuery && matchesCategory;
    });
  }, [items, query, categoryFilter]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${ADMIN_API}/inventory`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();

      const normalized: InventoryItem[] = (data.items || []).map((r: any) => {
        const stockNum = Number(r.stock ?? 0);
        const rtNum =
          r.reorderThreshold != null ? Number(r.reorderThreshold) : undefined;

        const status =
          r.status && String(r.status).trim().length
            ? r.status
            : computeStatus(stockNum, rtNum);

        return {
          id: String(r.id),
          name: String(r.name || "—"),
          category: String(r.category || "Uncategorized"),
          stock: stockNum,
          status,
          reorderThreshold: rtNum,
          expiryDate: r.expiryDate ?? null,
        };
      });

      setItems(normalized);
    } catch (err) {
      console.error("AdminInventory error:", err);
      setError("Failed to load inventory.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setItemCode("");
    setName("");
    setCategory("Consumables");
    setStock(0);
    setReorderThreshold(10);
    setExpiryDate("");
    setFormError(null);
  };

  const openModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
  };

  const submitNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const code = itemCode.trim();
    const nm = name.trim();
    const cat = category.trim() || "Uncategorized";

    if (!code) return setFormError("Item Code is required (e.g., GAUZE-001).");
    if (!nm) return setFormError("Name is required.");
    if (!Number.isFinite(stock) || stock < 0)
      return setFormError("Stock must be 0 or greater.");
    if (!Number.isFinite(reorderThreshold) || reorderThreshold < 0)
      return setFormError("Reorder threshold must be 0 or greater.");

    const payload: CreateInventoryPayload = {
      itemCode: code,
      name: nm,
      category: cat,
      stock: Math.floor(stock),
      reorderThreshold: Math.floor(reorderThreshold),
      expiryDate: expiryDate ? expiryDate : null,
    };

    try {
      setSubmitting(true);

      const res = await fetch(`${ADMIN_API}/inventory`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.json().catch(() => null);
        const serverMsg = msg?.message ? String(msg.message) : `Status ${res.status}`;
        throw new Error(serverMsg);
      }

      // refresh list
      await fetchInventory();
      setModalOpen(false);
    } catch (err: any) {
      console.error("Create inventory item error:", err);
      setFormError(err?.message || "Failed to create item.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <PackageIcon size={14} />
              <span>Inventory</span>
            </div>
            <h1 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-50">
              Inventory overview
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Track stock levels, identify low items, and keep your clinic prepared.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 px-3 py-1.5 text-slate-700 dark:text-slate-200"
            >
              <FilterIcon size={14} />
              Filters
            </button>
            <button
              onClick={openModal}
              className="inline-flex items-center gap-1 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 px-3 py-1.5 font-semibold"
            >
              + New item
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <SearchIcon
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, ID, category..."
              className="w-full rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 px-9 py-2 text-sm text-slate-900 dark:text-slate-50 outline-none"
            />
          </div>

          {filtersOpen && (
            <div className="sm:w-64">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === "ALL" ? "All categories" : c}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-rose-500 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        {/* Items */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-900 bg-white/90 dark:bg-slate-950/90 shadow-sm divide-y divide-slate-100/80 dark:divide-slate-900/80">
          {loading ? (
            <div className="px-4 py-4 text-xs text-slate-400 text-center">
              Loading inventory...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="px-4 py-4 text-xs text-slate-400 text-center">
              No inventory items found.
            </div>
          ) : (
            filteredItems.map((item) => {
              const status = item.status || computeStatus(item.stock, item.reorderThreshold);
              const badgeClass =
                status === "Healthy"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-200 border border-emerald-500/30"
                  : status === "Reorder soon"
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-200 border border-amber-500/30"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-200 border border-rose-500/30";

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/80 dark:hover:bg-slate-900/80"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.category || "Uncategorized"} • ID: {item.id}
                    </p>
                    {item.reorderThreshold != null && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Reorder threshold: {item.reorderThreshold}
                      </p>
                    )}
                    {item.expiryDate && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Expiry: {String(item.expiryDate).slice(0, 10)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-600 dark:text-slate-300">
                      Stock:{" "}
                      <span className="font-semibold text-slate-900 dark:text-slate-50">
                        {item.stock}
                      </span>
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 ${badgeClass}`}
                    >
                      {(status === "Low" || status === "Reorder soon") && (
                        <AlertTriangleIcon size={12} />
                      )}
                      {status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-950 shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-900">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Add inventory item
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Create a new stock item for your clinic.
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900"
                aria-label="Close"
              >
                <XIcon size={16} className="text-slate-600 dark:text-slate-300" />
              </button>
            </div>

            <form onSubmit={submitNewItem} className="px-5 py-4 space-y-3">
              {formError && (
                <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-300">
                    Item Code *
                  </label>
                  <input
                    value={itemCode}
                    onChange={(e) => setItemCode(e.target.value)}
                    placeholder="GAUZE-001"
                    className="mt-1 w-full rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-300">
                    Category
                  </label>
                  <input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Consumables"
                    className="mt-1 w-full rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-slate-300">
                  Name *
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sterile gauze pads"
                  className="mt-1 w-full rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-300">
                    Stock *
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    min={0}
                    className="mt-1 w-full rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-300">
                    Reorder threshold *
                  </label>
                  <input
                    type="number"
                    value={reorderThreshold}
                    onChange={(e) => setReorderThreshold(Number(e.target.value))}
                    min={0}
                    className="mt-1 w-full rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-300">
                    Expiry date (optional)
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 px-3 py-2 text-xs font-semibold inline-flex items-center gap-2"
                  disabled={submitting}
                >
                  {submitting && <Loader2Icon size={14} className="animate-spin" />}
                  Create item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
