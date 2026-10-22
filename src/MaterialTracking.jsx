
import { useMemo, useState } from "react";
import {
  Search,
  Trash2,
  Recycle,
  RefreshCw,
  Leaf,
  Package,
  Trophy,
} from "lucide-react";

import {
  getMaterials,
  addMaterial,
  updateMaterialStatus,
  deleteMaterial,
  getImpactSummary,
} from "./utils/materialTracker";

const statuses = [
  "Pending",
  "Reused",
  "Recycled",
  "Composted",
  "Disposed",
];

const categoryLabels = {
  recyclable: "Recyclable",
  reusable: "Reusable",
  biodegradable: "Biodegradable",
  hazardous: "Hazardous",
};

export default function MaterialTracking() {
  const [materials, setMaterials] = useState(() => getMaterials());
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [name, setName] = useState("");
  const [category, setCategory] = useState("recyclable");
  const [weightKg, setWeightKg] = useState("");

  const impact = useMemo(() => getImpactSummary(), [materials]);

  function addManualRecord(event) {
    event.preventDefault();

    if (!name.trim()) return;

    const updated = addMaterial({
      name: name.trim(),
      category,
      weightKg,
      recommendation:
        "Check the item condition and local waste-disposal guidance.",
    });

    setMaterials((previous) => [updated, ...previous]);
    setName("");
    setWeightKg("");
  }

  function changeStatus(id, status) {
    setMaterials(updateMaterialStatus(id, status));
  }

  function removeRecord(id) {
    if (!window.confirm("Delete this material record?")) return;

    setMaterials(deleteMaterial(id));
  }

  const filtered = materials.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;

    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const cardClass =
    "rounded-2xl border border-[#e3ebe3] bg-white p-4";

  const inputClass =
    "w-full rounded-xl border border-[#dce6dc] bg-white px-3 py-2.5 text-sm text-[#294333] outline-none focus:border-[#399565]";

  return (
    <main className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[2px] text-[#278354]">
          EcoTwin AI · Circular economy
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-[#193b2a]">
          Material Tracking
        </h1>
        <p className="mt-2 text-sm text-[#78877d]">
          Record materials, monitor their next step, and track your eco activity.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Items tracked", value: impact.totalScanned, icon: Package },
          { label: "Completed actions", value: impact.completedActions, icon: Recycle },
          { label: "Pending items", value: impact.pending, icon: RefreshCw },
          { label: "EcoPoints", value: impact.ecoPoints, icon: Trophy },
        ].map(({ label, value, icon: Icon }) => (
          <div className={cardClass} key={label}>
            <Icon size={21} className="text-[#278354]" />
            <p className="mt-4 text-2xl font-extrabold text-[#244330]">
              {value}
            </p>
            <p className="mt-1 text-xs text-[#78877d]">{label}</p>
          </div>
        ))}
      </section>

      <section className={cardClass}>
        <h2 className="font-extrabold text-[#254330]">
          Add a material record
        </h2>

        <form
          onSubmit={addManualRecord}
          className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <input
            className={inputClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Item name, e.g. plastic bottle"
            required
          />

          <select
            className={inputClass}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <input
            className={inputClass}
            type="number"
            min="0"
            step="0.01"
            value={weightKg}
            onChange={(event) => setWeightKg(event.target.value)}
            placeholder="Estimated weight (kg)"
          />

          <button
            className="rounded-xl bg-[#176b48] px-4 py-3 text-sm font-bold text-white hover:bg-[#105638]"
            type="submit"
          >
            Add record
          </button>
        </form>
      </section>

      <section className={cardClass}>
        <h2 className="font-extrabold text-[#254330]">Material history</h2>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-3 text-[#78877d]"
            />
            <input
              className={`${inputClass} pl-9`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search materials"
            />
          </div>

          <select
            className={inputClass}
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="all">All categories</option>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <select
            className={inputClass}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Package size={34} className="mx-auto text-[#91a095]" />
            <p className="mt-3 font-bold text-[#355441]">
              No material records found
            </p>
            <p className="mt-1 text-xs text-[#89968c]">
              Add a record or adjust your filters.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {filtered.map((item) => (
              <article
                key={item.id}
                className="flex flex-col gap-3 rounded-xl border border-[#edf1ed] p-4 sm:flex-row sm:items-center"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eaf5ed] text-[#278354]">
                  {item.category === "biodegradable" ? (
                    <Leaf size={20} />
                  ) : item.category === "reusable" ? (
                    <RefreshCw size={20} />
                  ) : (
                    <Recycle size={20} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-[#355441]">{item.name}</h3>
                  <p className="mt-1 text-xs text-[#89968c]">
                    {categoryLabels[item.category] || item.category}
                    {" · "}
                    {new Date(item.createdAt).toLocaleString()}
                    {item.weightKg > 0 && ` · ${item.weightKg} kg`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label={`Status for ${item.name}`}
                    className={`${inputClass} min-w-32 sm:w-auto`}
                    value={item.status}
                    onChange={(event) =>
                      changeStatus(item.id, event.target.value)
                    }
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => removeRecord(item.id)}
                    aria-label={`Delete ${item.name}`}
                    className="rounded-xl border border-[#f0d8d4] p-3 text-[#b63f38] hover:bg-[#fff4f1]"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[#dcebdd] bg-[#edf7ef] p-5">
        <div className="flex items-center gap-2 font-extrabold text-[#247748]">
          <Leaf size={19} />
          Your tracked impact
        </div>
        <p className="mt-2 text-sm leading-6 text-[#617a67]">
          You have recorded {impact.totalScanned} items and completed{" "}
          {impact.completedActions} reuse, recycling, or composting actions.
          Estimated weight tracked: {impact.trackedWeightKg.toFixed(2)} kg.
          These totals reflect records you entered; they are not independently
          verified environmental savings.
        </p>
      </section>
    </main>
  );
}
