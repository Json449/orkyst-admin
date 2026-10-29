"use client";

import { ChangeEvent, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FolderPlus,
  ImagePlus,
  Images,
  LoaderCircle,
  LockKeyhole,
  Pencil,
  Plus,
  ShieldCheck,
  Tags,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import {
  type AdminTemplate,
  type AdminTemplateAssignment,
  type AdminTemplateCategoryItem,
  type AdminTemplateSubcategoryItem,
  createAdminTemplateCategory,
  createAdminTemplateSubcategory,
  deleteAdminTemplate,
  deleteAdminTemplateCategory,
  deleteAdminTemplateSubcategory,
  fetchAdminTemplateCategories,
  fetchAdminTemplates,
  updateAdminTemplate,
  updateAdminTemplateCategory,
  updateAdminTemplateSubcategory,
  uploadAdminTemplates,
} from "@/lib/api";
import { DASH } from "@/components/dashboard/theme";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TemplateTaxonomyPicker } from "./template-taxonomy-picker";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_BATCH_SIZE = 50 * 1024 * 1024;
const MAX_BATCH_TEMPLATES = 20;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type PendingTemplateUpload = {
  id: string;
  name: string;
  description: string;
  imageData: string;
  previewUrl: string;
};

type SecurityAction =
  | "upload"
  | "edit-template"
  | "delete-template"
  | "create-category"
  | "edit-category"
  | "delete-category"
  | "save-subcategory"
  | "delete-subcategory";

type SubcategoryDraft = {
  categoryId: string;
  item: AdminTemplateSubcategoryItem | null;
  name: string;
  imageData: string;
  previewUrl: string;
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function legacyAssignments(
  template: AdminTemplate,
  categories: AdminTemplateCategoryItem[],
): AdminTemplateAssignment[] {
  if (template.taxonomyAssignments?.length) return template.taxonomyAssignments;
  const category = categories.find(
    (item) => item.name.toLowerCase() === template.category.toLowerCase(),
  );
  return category ? [{ categoryId: category.id, subcategoryIds: [] }] : [];
}

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const subcategoryImageRef = useRef<HTMLInputElement>(null);

  const [uploadItems, setUploadItems] = useState<PendingTemplateUpload[]>([]);
  const [uploadAssignments, setUploadAssignments] = useState<AdminTemplateAssignment[]>([]);
  const [fileError, setFileError] = useState("");

  const [editingTemplate, setEditingTemplate] = useState<AdminTemplate | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAssignments, setEditAssignments] = useState<AdminTemplateAssignment[]>([]);
  const [editImageData, setEditImageData] = useState("");
  const [editPreviewUrl, setEditPreviewUrl] = useState("");
  const [editError, setEditError] = useState("");

  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<AdminTemplateCategoryItem | null>(null);
  const [pendingCategory, setPendingCategory] = useState<AdminTemplateCategoryItem | null>(null);
  const [subcategoryDraft, setSubcategoryDraft] = useState<SubcategoryDraft | null>(null);
  const [pendingSubcategory, setPendingSubcategory] = useState<{
    categoryId: string;
    item: AdminTemplateSubcategoryItem;
  } | null>(null);

  const [pendingDelete, setPendingDelete] = useState<AdminTemplate | null>(null);
  const [pendingAction, setPendingAction] = useState<SecurityAction | null>(null);
  const [securityCode, setSecurityCode] = useState("");
  const [securityError, setSecurityError] = useState("");

  const templatesQuery = useQuery({
    queryKey: ["admin", "templates"],
    queryFn: fetchAdminTemplates,
  });
  const categoriesQuery = useQuery({
    queryKey: ["admin", "template-categories"],
    queryFn: fetchAdminTemplateCategories,
  });
  const templates = templatesQuery.data?.items || [];
  const categories = categoriesQuery.data?.items || [];

  const invalidateTemplateData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "templates"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "template-categories"] }),
    ]);
  };

  const uploadMutation = useMutation({
    mutationFn: uploadAdminTemplates,
    onSuccess: () => {
      setUploadItems([]);
      setUploadAssignments([]);
      setFileError("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      void invalidateTemplateData();
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: string; name: string; description: string; assignments: AdminTemplateAssignment[]; imageData?: string; code: string }) =>
      updateAdminTemplate(id, payload),
    onSuccess: () => {
      setEditingTemplate(null);
      void invalidateTemplateData();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: ({ id, code }: { id: string; code: string }) => deleteAdminTemplate(id, code),
    onSuccess: () => void invalidateTemplateData(),
  });
  const createCategoryMutation = useMutation({
    mutationFn: ({ name, code }: { name: string; code: string }) => createAdminTemplateCategory(name, code),
    onSuccess: () => {
      setCategoryName("");
      void invalidateTemplateData();
    },
  });
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, name, code }: { id: string; name: string; code: string }) => updateAdminTemplateCategory(id, name, code),
    onSuccess: () => {
      setEditingCategory(null);
      setCategoryName("");
      void invalidateTemplateData();
    },
  });
  const deleteCategoryMutation = useMutation({
    mutationFn: ({ id, code }: { id: string; code: string }) => deleteAdminTemplateCategory(id, code),
    onSuccess: () => void invalidateTemplateData(),
  });
  const saveSubcategoryMutation = useMutation({
    mutationFn: ({ draft, code }: { draft: SubcategoryDraft; code: string }) =>
      draft.item
        ? updateAdminTemplateSubcategory(draft.categoryId, draft.item.id, {
            name: draft.name,
            imageData: draft.imageData || undefined,
            code,
          })
        : createAdminTemplateSubcategory(draft.categoryId, {
            name: draft.name,
            imageData: draft.imageData || undefined,
            code,
          }),
    onSuccess: () => {
      setSubcategoryDraft(null);
      void invalidateTemplateData();
    },
  });
  const deleteSubcategoryMutation = useMutation({
    mutationFn: ({ categoryId, subcategoryId, code }: { categoryId: string; subcategoryId: string; code: string }) =>
      deleteAdminTemplateSubcategory(categoryId, subcategoryId, code),
    onSuccess: () => void invalidateTemplateData(),
  });

  const isMutationPending =
    uploadMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    createCategoryMutation.isPending ||
    updateCategoryMutation.isPending ||
    deleteCategoryMutation.isPending ||
    saveSubcategoryMutation.isPending ||
    deleteSubcategoryMutation.isPending;

  function openSecurity(action: SecurityAction) {
    setPendingAction(action);
    setSecurityCode("");
    setSecurityError("");
  }

  function closeSecurity() {
    if (isMutationPending) return;
    setPendingAction(null);
    setSecurityCode("");
    setSecurityError("");
  }

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files || []);
    setFileError("");
    uploadMutation.reset();
    if (!files.length) return;
    if (files.length > MAX_BATCH_TEMPLATES) {
      setFileError(`Choose no more than ${MAX_BATCH_TEMPLATES} images at once.`);
      input.value = "";
      return;
    }
    const invalid = files.find((file) => !IMAGE_TYPES.includes(file.type));
    const oversized = files.find((file) => file.size > MAX_FILE_SIZE);
    if (invalid || oversized || files.reduce((sum, file) => sum + file.size, 0) > MAX_BATCH_SIZE) {
      setFileError(
        invalid
          ? `${invalid.name} is not a PNG, JPEG, or WebP image.`
          : oversized
            ? `${oversized.name} is larger than 10 MB.`
            : "The combined selection must be 50 MB or smaller.",
      );
      input.value = "";
      return;
    }
    try {
      const selected = await Promise.all(
        files.map(async (file, index) => {
          const imageData = await readFileAsDataUrl(file);
          return {
            id: `${file.name}-${file.size}-${file.lastModified}-${index}`,
            name: file.name.replace(/\.[^.]+$/, ""),
            description: "",
            imageData,
            previewUrl: imageData,
          };
        }),
      );
      setUploadItems(selected);
    } catch (error) {
      setUploadItems([]);
      setFileError(error instanceof Error ? error.message : "The images could not be read.");
    }
    input.value = "";
  }

  function submitUpload(event: React.FormEvent) {
    event.preventDefault();
    if (!uploadItems.length) return setFileError("Choose at least one template image.");
    if (!uploadAssignments.length) return setFileError("Choose at least one category.");
    if (uploadItems.some((item) => !item.name.trim())) return setFileError("Every template needs a name.");
    openSecurity("upload");
  }

  function openEdit(template: AdminTemplate) {
    setEditingTemplate(template);
    setEditName(template.name);
    setEditDescription(template.description || "");
    setEditAssignments(legacyAssignments(template, categories));
    setEditImageData("");
    setEditPreviewUrl(template.imageUrl);
    setEditError("");
  }

  async function onSingleImageChange(event: ChangeEvent<HTMLInputElement>, target: "edit" | "subcategory") {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE) {
      const message = !IMAGE_TYPES.includes(file.type) ? "Use a PNG, JPEG, or WebP image." : "Image must be smaller than 10 MB.";
      target === "edit" ? setEditError(message) : setSecurityError(message);
      input.value = "";
      return;
    }
    const imageData = await readFileAsDataUrl(file);
    if (target === "edit") {
      setEditImageData(imageData);
      setEditPreviewUrl(imageData);
    } else {
      setSubcategoryDraft((current) => current ? { ...current, imageData, previewUrl: imageData } : current);
    }
    input.value = "";
  }

  function submitEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editName.trim()) return setEditError("Enter a template name.");
    if (!editAssignments.length) return setEditError("Choose at least one category.");
    openSecurity("edit-template");
  }

  function submitCategory(event: React.FormEvent) {
    event.preventDefault();
    if (!categoryName.trim()) return;
    openSecurity(editingCategory ? "edit-category" : "create-category");
  }

  function openSubcategory(categoryId: string, item: AdminTemplateSubcategoryItem | null = null) {
    setSubcategoryDraft({
      categoryId,
      item,
      name: item?.name || "",
      imageData: "",
      previewUrl: item?.imageUrl || "",
    });
    setSecurityError("");
  }

  function submitSubcategory(event: React.FormEvent) {
    event.preventDefault();
    if (!subcategoryDraft?.name.trim()) return;
    openSecurity("save-subcategory");
  }

  async function confirmAction() {
    if (!/^\d{6}$/.test(securityCode)) {
      setSecurityError("Enter the 6-digit security code.");
      return;
    }
    try {
      if (pendingAction === "upload") {
        await uploadMutation.mutateAsync({
          assignments: uploadAssignments,
          items: uploadItems.map(({ name, description, imageData }) => ({ name, description, imageData })),
          code: securityCode,
        });
      } else if (pendingAction === "edit-template" && editingTemplate) {
        await updateMutation.mutateAsync({
          id: editingTemplate.id,
          name: editName,
          description: editDescription,
          assignments: editAssignments,
          imageData: editImageData || undefined,
          code: securityCode,
        });
      } else if (pendingAction === "delete-template" && pendingDelete) {
        await deleteMutation.mutateAsync({ id: pendingDelete.id, code: securityCode });
      } else if (pendingAction === "create-category") {
        await createCategoryMutation.mutateAsync({ name: categoryName, code: securityCode });
      } else if (pendingAction === "edit-category" && editingCategory) {
        await updateCategoryMutation.mutateAsync({ id: editingCategory.id, name: categoryName, code: securityCode });
      } else if (pendingAction === "delete-category" && pendingCategory) {
        await deleteCategoryMutation.mutateAsync({ id: pendingCategory.id, code: securityCode });
      } else if (pendingAction === "save-subcategory" && subcategoryDraft) {
        await saveSubcategoryMutation.mutateAsync({ draft: subcategoryDraft, code: securityCode });
      } else if (pendingAction === "delete-subcategory" && pendingSubcategory) {
        await deleteSubcategoryMutation.mutateAsync({
          categoryId: pendingSubcategory.categoryId,
          subcategoryId: pendingSubcategory.item.id,
          code: securityCode,
        });
      }
      setPendingAction(null);
      setPendingDelete(null);
      setPendingCategory(null);
      setPendingSubcategory(null);
      setSecurityCode("");
      setSecurityError("");
    } catch (error) {
      setSecurityError(error instanceof Error ? error.message : "Unable to complete this action.");
    }
  }

  const actionLabel: Record<SecurityAction, string> = {
    upload: `upload ${uploadItems.length} ${uploadItems.length === 1 ? "template" : "templates"}`,
    "edit-template": "save template",
    "delete-template": "delete template",
    "create-category": "create category",
    "edit-category": "rename category",
    "delete-category": "delete category",
    "save-subcategory": subcategoryDraft?.item ? "save subcategory" : "create subcategory",
    "delete-subcategory": "delete subcategory",
  };
  const destructive = pendingAction === "delete-template" || pendingAction === "delete-category" || pendingAction === "delete-subcategory";
  const uploadError = fileError || (uploadMutation.error instanceof Error ? uploadMutation.error.message : "");

  return (
    <div className="max-w-[1400px]">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: DASH.heading }}>Template taxonomy</h1>
          <p className="mt-1.5 text-[15px]" style={{ color: DASH.muted }}>Manage gallery categories, visual subcategories, and reusable template assignments.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#FCE9F1] px-3 py-1.5 text-xs font-bold" style={{ color: DASH.plum }}><Images className="h-4 w-4" />{templates.length} saved</span>
      </header>

      <section className="mt-7 rounded-2xl border bg-white p-5 shadow-sm sm:p-6" style={{ borderColor: DASH.border }}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FCE9F1]" style={{ color: DASH.plum }}><Tags className="h-5 w-5" /></span>
            <div><h2 className="font-bold" style={{ color: DASH.heading }}>Categories and subcategories</h2><p className="text-xs" style={{ color: DASH.muted }}>These rows appear dynamically in the customer template gallery.</p></div>
          </div>
          <span className="rounded-full bg-[#F7F2F6] px-3 py-1.5 text-xs font-bold" style={{ color: DASH.plum }}>{categories.length} categories</span>
        </div>

        <form onSubmit={submitCategory} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} maxLength={60} placeholder="e.g. Automotive" className="h-11 min-w-0 flex-1 rounded-xl border px-3 text-sm outline-none focus:ring-2 focus:ring-[#8A1253]/15" style={{ borderColor: DASH.border }} />
          {editingCategory ? <button type="button" onClick={() => { setEditingCategory(null); setCategoryName(""); }} className="h-11 rounded-xl border px-4 text-sm font-bold" style={{ borderColor: DASH.border, color: DASH.muted }}>Cancel</button> : null}
          <button disabled={!categoryName.trim()} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white disabled:opacity-60" style={{ backgroundColor: DASH.plum }}><FolderPlus className="h-4 w-4" />{editingCategory ? "Rename category" : "Add category"}</button>
        </form>

        {categoriesQuery.isLoading ? (
          <div className="grid h-32 place-items-center"><LoaderCircle className="h-6 w-6 animate-spin" style={{ color: DASH.plum }} /></div>
        ) : categoriesQuery.isError ? (
          <p className="mt-5 text-sm font-medium text-rose-600">Unable to load template categories.</p>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {categories.map((category) => (
              <article key={category.id} className="rounded-2xl border p-4" style={{ borderColor: DASH.border }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><h3 className="truncate text-sm font-bold" style={{ color: DASH.heading }}>{category.name}</h3><p className="mt-0.5 text-xs" style={{ color: DASH.muted }}>{category.templateCount} templates · {category.subcategories.length} subcategories</p></div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" onClick={() => { setEditingCategory(category); setCategoryName(category.name); }} aria-label={`Rename ${category.name}`} className="rounded-lg p-2 hover:bg-[#FCF8FB]" style={{ color: DASH.plum }}><Pencil className="h-4 w-4" /></button>
                    <button type="button" disabled={category.templateCount > 0} onClick={() => { setPendingCategory(category); openSecurity("delete-category"); }} aria-label={`Delete ${category.name}`} title={category.templateCount ? "Remove category assignments first" : "Delete category"} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {category.subcategories.map((subcategory) => (
                    <div key={subcategory.id} className="group flex items-center gap-2 rounded-xl border bg-[#FCFAFC] p-1.5 pr-2" style={{ borderColor: DASH.border }}>
                      {subcategory.imageUrl ? <img src={subcategory.imageUrl} alt="" className="h-9 w-11 rounded-lg object-cover" /> : <span className="grid h-9 w-11 place-items-center rounded-lg bg-[#F6EAF2]" style={{ color: DASH.plum }}><Tags className="h-4 w-4" /></span>}
                      <span><span className="block max-w-32 truncate text-xs font-bold" style={{ color: DASH.heading }}>{subcategory.name}</span><span className="block text-[10px]" style={{ color: DASH.muted }}>{subcategory.templateCount} templates</span></span>
                      <button type="button" onClick={() => openSubcategory(category.id, subcategory)} aria-label={`Edit ${subcategory.name}`} className="rounded p-1 opacity-60 hover:bg-white hover:opacity-100"><Pencil className="h-3 w-3" /></button>
                      <button type="button" disabled={subcategory.templateCount > 0} onClick={() => { setPendingSubcategory({ categoryId: category.id, item: subcategory }); openSecurity("delete-subcategory"); }} aria-label={`Delete ${subcategory.name}`} className="rounded p-1 text-rose-600 opacity-60 hover:bg-white hover:opacity-100 disabled:opacity-20"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => openSubcategory(category.id)} className="inline-flex h-12 items-center gap-1.5 rounded-xl border border-dashed px-3 text-xs font-bold" style={{ borderColor: DASH.border, color: DASH.plum }}><Plus className="h-3.5 w-3.5" />Add subcategory</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="mt-7 grid items-start gap-6 xl:grid-cols-[430px_minmax(0,1fr)]">
        <form onSubmit={submitUpload} className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6" style={{ borderColor: DASH.border }}>
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FCE9F1]" style={{ color: DASH.plum }}><ImagePlus className="h-5 w-5" /></span><div><h2 className="font-bold" style={{ color: DASH.heading }}>Upload templates</h2><p className="text-xs" style={{ color: DASH.muted }}>Up to {MAX_BATCH_TEMPLATES} files, 10 MB each and 50 MB total.</p></div></div>

          <label className="mt-5 block cursor-pointer rounded-2xl border border-dashed p-4 hover:bg-[#FCF8FB]" style={{ borderColor: uploadItems.length ? "#D88ABA" : DASH.border }}><input ref={fileInputRef} type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={(event) => void onFileChange(event)} className="sr-only" /><span className="flex min-h-28 flex-col items-center justify-center rounded-xl bg-[#FAF7FA] text-center"><UploadCloud className="h-7 w-7" style={{ color: DASH.plum }} /><span className="mt-2 text-sm font-bold" style={{ color: DASH.heading }}>{uploadItems.length ? "Choose different images" : "Choose template images"}</span><span className="mt-1 text-xs" style={{ color: DASH.muted }}>Select one or several files</span></span></label>

          {uploadItems.length ? <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1"><div className="flex justify-between"><p className="text-sm font-bold" style={{ color: DASH.heading }}>{uploadItems.length} selected</p><button type="button" onClick={() => setUploadItems([])} className="text-xs font-bold text-rose-600">Clear all</button></div>{uploadItems.map((item) => <div key={item.id} className="rounded-xl border p-2.5" style={{ borderColor: DASH.border }}><div className="flex gap-3"><img src={item.previewUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" /><div className="min-w-0 flex-1 space-y-2"><input value={item.name} onChange={(event) => setUploadItems((current) => current.map((upload) => upload.id === item.id ? { ...upload, name: event.target.value } : upload))} aria-label="Template name" placeholder="Template name" className="h-8 w-full rounded-lg border px-2 text-xs font-semibold" style={{ borderColor: DASH.border }} /><input value={item.description} onChange={(event) => setUploadItems((current) => current.map((upload) => upload.id === item.id ? { ...upload, description: event.target.value } : upload))} aria-label="Template description" placeholder="Short design description (optional)" maxLength={180} className="h-8 w-full rounded-lg border px-2 text-xs" style={{ borderColor: DASH.border }} /></div><button type="button" onClick={() => setUploadItems((current) => current.filter((upload) => upload.id !== item.id))} className="p-1 text-rose-600"><X className="h-4 w-4" /></button></div></div>)}</div> : null}

          <div className="mt-5"><p className="mb-2 text-sm font-bold" style={{ color: DASH.heading }}>Gallery placement</p><TemplateTaxonomyPicker categories={categories} value={uploadAssignments} onChange={setUploadAssignments} /></div>
          {uploadError ? <p role="alert" className="mt-3 text-sm font-medium text-rose-600">{uploadError}</p> : null}
          <button disabled={!uploadItems.length || !uploadAssignments.length || isMutationPending} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white disabled:opacity-50" style={{ backgroundColor: DASH.plum }}><UploadCloud className="h-4 w-4" />Upload {uploadItems.length || ""} {uploadItems.length === 1 ? "template" : "templates"}</button>
        </form>

        <section className="rounded-2xl border bg-white shadow-sm" style={{ borderColor: DASH.border }}>
          <div className="border-b px-5 py-4 sm:px-6" style={{ borderColor: DASH.border }}><h2 className="font-bold" style={{ color: DASH.heading }}>Template library</h2><p className="mt-0.5 text-xs" style={{ color: DASH.muted }}>A template can appear in multiple categories and subcategories without duplication.</p></div>
          {templatesQuery.isLoading ? <div className="grid min-h-80 place-items-center"><LoaderCircle className="h-6 w-6 animate-spin" style={{ color: DASH.plum }} /></div> : templatesQuery.isError ? <div className="p-6 text-sm text-rose-600">Unable to load templates.</div> : templates.length ? <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">{templates.map((template) => {
            const assignments = legacyAssignments(template, categories);
            const categoryNames = assignments.map((assignment) => categories.find((category) => category.id === assignment.categoryId)?.name).filter(Boolean);
            return <article key={template.id} className="overflow-hidden rounded-xl border" style={{ borderColor: DASH.border }}><div className="aspect-[4/3] bg-[#FAF7FA]"><img src={template.imageUrl} alt={template.name} className="h-full w-full object-contain" /></div><div className="p-3"><h3 className="truncate text-sm font-bold" style={{ color: DASH.heading }}>{template.name}</h3><p className="mt-1 line-clamp-2 min-h-8 text-xs" style={{ color: DASH.muted }}>{template.description || categoryNames.join(" · ") || template.category}</p><div className="mt-2 flex flex-wrap gap-1">{categoryNames.slice(0, 3).map((name) => <span key={name} className="rounded-full bg-[#F8EAF3] px-2 py-0.5 text-[10px] font-bold" style={{ color: DASH.plum }}>{name}</span>)}</div><div className="mt-3 flex gap-2"><button type="button" onClick={() => openEdit(template)} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border text-xs font-bold" style={{ borderColor: DASH.border, color: DASH.plum }}><Pencil className="h-3.5 w-3.5" />Edit</button><button type="button" onClick={() => { setPendingDelete(template); openSecurity("delete-template"); }} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-rose-200 text-xs font-bold text-rose-600"><Trash2 className="h-3.5 w-3.5" />Delete</button></div></div></article>;
          })}</div> : <div className="grid min-h-80 place-items-center px-6 text-center"><div><Images className="mx-auto h-9 w-9" style={{ color: DASH.subtle }} /><h3 className="mt-3 font-bold" style={{ color: DASH.heading }}>No templates uploaded yet</h3></div></div>}
        </section>
      </div>

      {editingTemplate ? <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#151427]/45 p-4"><form onSubmit={submitEdit} className="my-8 w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:p-6"><div className="flex justify-between"><div><h2 className="text-lg font-bold" style={{ color: DASH.heading }}>Edit template</h2><p className="text-sm" style={{ color: DASH.muted }}>Update content, image, and all gallery placements.</p></div><button type="button" onClick={() => setEditingTemplate(null)}><X className="h-5 w-5" /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-[180px_1fr]"><label className="cursor-pointer"><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void onSingleImageChange(event, "edit")} className="sr-only" /><img src={editPreviewUrl} alt="" className="aspect-[4/3] w-full rounded-xl border object-contain" style={{ borderColor: DASH.border }} /><span className="mt-2 block text-center text-xs font-bold" style={{ color: DASH.plum }}>Replace image</span></label><div><label className="block text-sm font-semibold">Name<input value={editName} onChange={(event) => setEditName(event.target.value)} className="mt-1.5 h-10 w-full rounded-xl border px-3" style={{ borderColor: DASH.border }} /></label><label className="mt-3 block text-sm font-semibold">Description<textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} maxLength={180} rows={3} className="mt-1.5 w-full rounded-xl border p-3 text-sm" style={{ borderColor: DASH.border }} /></label></div></div><div className="mt-5"><p className="mb-2 text-sm font-bold">Gallery placement</p><div className="max-h-72 overflow-y-auto pr-1"><TemplateTaxonomyPicker categories={categories} value={editAssignments} onChange={setEditAssignments} /></div></div>{editError ? <p className="mt-3 text-sm font-medium text-rose-600">{editError}</p> : null}<div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setEditingTemplate(null)} className="h-10 px-4 text-sm font-bold" style={{ color: DASH.muted }}>Cancel</button><button className="h-10 rounded-xl px-5 text-sm font-bold text-white" style={{ backgroundColor: DASH.plum }}>Save changes</button></div></form></div> : null}

      {subcategoryDraft ? <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-[#151427]/45 p-4"><form onSubmit={submitSubcategory} className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><div className="flex justify-between"><div><h2 className="text-lg font-bold" style={{ color: DASH.heading }}>{subcategoryDraft.item ? "Edit" : "Add"} subcategory</h2><p className="text-sm" style={{ color: DASH.muted }}>Add a visual thumbnail or keep it text-only.</p></div><button type="button" onClick={() => setSubcategoryDraft(null)}><X className="h-5 w-5" /></button></div><label className="mt-5 block text-sm font-semibold">Name<input value={subcategoryDraft.name} onChange={(event) => setSubcategoryDraft({ ...subcategoryDraft, name: event.target.value })} maxLength={60} className="mt-1.5 h-10 w-full rounded-xl border px-3" style={{ borderColor: DASH.border }} /></label><label className="mt-4 block cursor-pointer rounded-xl border border-dashed p-3 text-center" style={{ borderColor: DASH.border }}><input ref={subcategoryImageRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void onSingleImageChange(event, "subcategory")} className="sr-only" />{subcategoryDraft.previewUrl ? <img src={subcategoryDraft.previewUrl} alt="" className="mx-auto h-24 w-full rounded-lg object-cover" /> : <span className="grid h-24 place-items-center rounded-lg bg-[#FAF7FA]"><ImagePlus className="h-6 w-6" style={{ color: DASH.plum }} /></span>}<span className="mt-2 block text-xs font-bold" style={{ color: DASH.plum }}>Choose thumbnail (optional)</span></label><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => setSubcategoryDraft(null)} className="px-4 text-sm font-bold" style={{ color: DASH.muted }}>Cancel</button><button disabled={!subcategoryDraft.name.trim()} className="h-10 rounded-xl px-5 text-sm font-bold text-white disabled:opacity-50" style={{ backgroundColor: DASH.plum }}>Continue</button></div></form></div> : null}

      <Dialog open={pendingAction !== null} onOpenChange={(open) => { if (!open) closeSecurity(); }}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#FCE9F3] text-[#A30D70]"><ShieldCheck className="h-5 w-5" /></span><div><DialogTitle>Confirm {pendingAction ? actionLabel[pendingAction] : "action"}</DialogTitle><DialogDescription>Enter the 6-digit admin security code.</DialogDescription></div></div></DialogHeader>
          <div><label className="block text-sm font-semibold" style={{ color: DASH.heading }}>Security code</label><div className="relative mt-2"><LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" /><Input value={securityCode} onChange={(event) => { setSecurityCode(event.target.value.replace(/\D/g, "").slice(0, 6)); setSecurityError(""); }} inputMode="numeric" maxLength={6} placeholder="000000" className="h-11 pl-10" /></div>{securityError ? <p className="mt-2 text-sm font-medium text-rose-600">{securityError}</p> : null}</div>
          <DialogFooter><button type="button" onClick={closeSecurity} disabled={isMutationPending} className="rounded-xl border px-4 py-2 text-sm font-semibold" style={{ borderColor: DASH.border }}>Cancel</button><button type="button" onClick={() => void confirmAction()} disabled={securityCode.length !== 6 || isMutationPending} className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: destructive ? "#E11D48" : DASH.plum }}>{isMutationPending ? "Confirming…" : `Confirm ${pendingAction ? actionLabel[pendingAction] : "action"}`}</button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
