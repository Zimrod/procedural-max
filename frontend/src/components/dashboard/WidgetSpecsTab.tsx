"use client";

import { useMemo, useState } from "react";
import { getWidgetDefinition } from "../../core/widgetRegistry";

interface WidgetSpecsTabProps {
  filteredWidgets: string[];
}

export function WidgetSpecsTab({ filteredWidgets }: WidgetSpecsTabProps) {
  const [specSearch, setSpecSearch] = useState("");
  const [selectedWidget, setSelectedWidget] = useState(filteredWidgets[0] || "");

  const specificationMatches = useMemo(() => {
    const query = specSearch.trim().toLowerCase();
    return (filteredWidgets || []).filter((widget) => {
      if (!query) return true;
      const definition = getWidgetDefinition(widget);
      return [
        widget,
        definition?.purpose,
        ...(definition?.bestFor ?? []),
        ...(definition?.editorFields?.map((field) => field.label) ?? []),
      ].some((value) => String(value).toLowerCase().includes(query));
    });
  }, [filteredWidgets, specSearch]);

  const activeSpecificationWidget = specificationMatches.includes(selectedWidget)
    ? selectedWidget
    : specificationMatches[0] || "";
  const activeSpecification = activeSpecificationWidget
    ? getWidgetDefinition(activeSpecificationWidget)
    : undefined;

  return (
    <section aria-labelledby="widget-specifications-heading">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 id="widget-specifications-heading" className="text-sm font-bold text-slate-800">Widget Specifications</h3>
          <p className="mt-0.5 text-xs text-slate-500">Inspect inputs and target use-cases for registered widgets.</p>
        </div>
        <input
          type="search"
          placeholder="Search specifications..."
          value={specSearch}
          onChange={(e) => setSpecSearch(e.target.value)}
          className="w-full lg:w-72 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-xs"
        />
      </div>

      {specificationMatches.length > 0 && activeSpecification ? (
        <div className="mt-4 grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
          <div className="space-y-1 rounded-xl border border-slate-200 bg-white p-2">
            {specificationMatches.map((widget) => (
              <button
                key={widget}
                type="button"
                onClick={() => setSelectedWidget(widget)}
                className={`w-full rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
                  activeSpecificationWidget === widget
                    ? "bg-emerald-600 text-white"
                    : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
              >
                {widget.replaceAll("_", " ")}
              </button>
            ))}
          </div>

          <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-base font-bold uppercase text-slate-800">
                  {activeSpecificationWidget.replaceAll("_", " ")}
                </h4>
                <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-600">{activeSpecification.purpose}</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                {activeSpecification.category.replaceAll("_", " ")}
              </span>
            </div>

            <div className="grid gap-4 py-4 md:grid-cols-2">
              <div>
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Applications</h5>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {activeSpecification.bestFor.map((app) => (
                    <span key={app} className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-700">{app}</span>
                  ))}
                </div>
              </div>
              {activeSpecification.avoidFor && activeSpecification.avoidFor.length > 0 && (
                <div>
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Use with caution</h5>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {activeSpecification.avoidFor.map((avoid) => (
                      <span key={avoid} className="rounded-md bg-amber-50 px-2 py-1 text-[11px] text-amber-700">{avoid}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between gap-3">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Props</h5>
                <span className="text-[10px] text-slate-400">{activeSpecification.editorFields.length} configurable</span>
              </div>
              <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[560px] text-left text-[11px]">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-3 py-2 font-bold">Prop</th>
                      <th className="px-3 py-2 font-bold">Type</th>
                      <th className="px-3 py-2 font-bold">Possible values</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeSpecification.editorFields.map((field) => (
                      <tr key={field.key}>
                        <td className="px-3 py-2 font-mono font-semibold text-slate-700">{field.key}</td>
                        <td className="px-3 py-2 text-slate-500">{field.kind}</td>
                        <td className="px-3 py-2 text-slate-500">
                          {field.options?.join(", ") || (field.defaultValue !== undefined ? `Default: ${String(field.defaultValue)}` : "Free input")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </article>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
          No specifications match "{specSearch}".
        </div>
      )}
    </section>
  );
}