"use client";

import type {
  AdminTemplateAssignment,
  AdminTemplateCategoryItem,
} from "@/lib/api";
import { DASH } from "@/components/dashboard/theme";

export function TemplateTaxonomyPicker({
  categories,
  value,
  onChange,
  disabled = false,
}: {
  categories: AdminTemplateCategoryItem[];
  value: AdminTemplateAssignment[];
  onChange: (value: AdminTemplateAssignment[]) => void;
  disabled?: boolean;
}) {
  const selectedByCategory = new Map(
    value.map((assignment) => [assignment.categoryId, assignment]),
  );

  function toggleCategory(categoryId: string) {
    if (selectedByCategory.has(categoryId)) {
      onChange(value.filter((assignment) => assignment.categoryId !== categoryId));
      return;
    }
    onChange([...value, { categoryId, subcategoryIds: [] }]);
  }

  function toggleSubcategory(categoryId: string, subcategoryId: string) {
    onChange(
      value.map((assignment) => {
        if (assignment.categoryId !== categoryId) return assignment;
        const selected = assignment.subcategoryIds.includes(subcategoryId);
        return {
          ...assignment,
          subcategoryIds: selected
            ? assignment.subcategoryIds.filter((id) => id !== subcategoryId)
            : [...assignment.subcategoryIds, subcategoryId],
        };
      }),
    );
  }

  return (
    <div className="space-y-2.5">
      {categories.map((category) => {
        const assignment = selectedByCategory.get(category.id);
        const selected = Boolean(assignment);
        return (
          <div
            key={category.id}
            className={`rounded-xl border p-3 transition ${selected ? "bg-[#FFF7FC]" : "bg-white"}`}
            style={{ borderColor: selected ? "#D88ABA" : DASH.border }}
          >
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={selected}
                disabled={disabled}
                onChange={() => toggleCategory(category.id)}
                className="h-4 w-4 accent-[#8A1253]"
              />
              <span className="min-w-0 flex-1 text-sm font-bold" style={{ color: DASH.heading }}>
                {category.name}
              </span>
              <span className="text-[11px]" style={{ color: DASH.muted }}>
                {category.templateCount} templates
              </span>
            </label>

            {selected && category.subcategories.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5 border-t pt-3" style={{ borderColor: DASH.border }}>
                {category.subcategories.map((subcategory) => {
                  const active = assignment?.subcategoryIds.includes(subcategory.id) || false;
                  return (
                    <button
                      key={subcategory.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleSubcategory(category.id, subcategory.id)}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition disabled:opacity-50 ${active ? "text-white" : "bg-white"}`}
                      style={{
                        backgroundColor: active ? DASH.plum : undefined,
                        borderColor: active ? DASH.plum : DASH.border,
                        color: active ? "white" : DASH.muted,
                      }}
                    >
                      {subcategory.name}
                    </button>
                  );
                })}
              </div>
            ) : selected ? (
              <p className="mt-2 text-[11px]" style={{ color: DASH.muted }}>
                This category has no subcategories yet. The template will still appear under the category.
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
