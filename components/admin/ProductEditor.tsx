import type { FC } from "react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { SlideOver } from "./SlideOver";
import { ImageUploader } from "./ImageUploader";
import { formatInr } from "../../lib/formatInr";
import { supabase } from "../../src/lib/supabase";

type Cat = { id: string; name: string; slug: string };
type Sub = { id: string; name: string; slug: string; category_id: string };
type Variant = {
  id: string;
  size: string;
  color: string;
  color_hex: string | null;
  stock_quantity: number | null;
  sku: string | null;
  additional_price: number | null;
};
type Img = {
  id: string;
  image_url: string;
  is_primary: boolean | null;
  sort_order: number | null;
};

type Props = {
  open: boolean;
  productId: string | null;
  draftId: string;
  categories: Cat[];
  onClose: () => void;
  onSaved: () => void;
};

const emptyForm = {
  name: "",
  description: "",
  brand: "",
  category_id: "" as string,
  subcategory_id: "" as string,
  gender_target: "unisex" as string,
  base_price: 0,
  discount_percent: 0,
  tags: "",
  is_featured: false,
  is_active: true,
};

export const ProductEditor: FC<Props> = ({
  open,
  productId,
  draftId,
  categories,
  onClose,
  onSaved,
}) => {
  const id = productId ?? draftId;
  const [form, setForm] = useState(emptyForm);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [images, setImages] = useState<Img[]>([]);
  const [vForm, setVForm] = useState({
    size: "",
    color: "",
    color_hex: "#000000",
    stock_quantity: 0,
    sku: "",
    additional_price: 0,
  });
  const [editingVariant, setEditingVariant] = useState<string | null>(null);

  const finalPrice = useMemo(() => {
    const b = Number(form.base_price) || 0;
    const d = Number(form.discount_percent) || 0;
    return Math.round(b * (1 - d / 100) * 100) / 100;
  }, [form.base_price, form.discount_percent]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      if (!productId) {
        setForm(emptyForm);
        setVariants([]);
        setImages([]);
        return;
      }
      const { data: p, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();
      if (error || !p) {
        toast.error(error?.message ?? "Load failed");
        return;
      }
      setForm({
        name: p.name,
        description: p.description ?? "",
        brand: p.brand ?? "",
        category_id: p.category_id ?? "",
        subcategory_id: p.subcategory_id ?? "",
        gender_target: p.gender_target ?? "unisex",
        base_price: Number(p.base_price),
        discount_percent: Number(p.discount_percent ?? 0),
        tags: (p.tags as string[] | null)?.join(", ") ?? "",
        is_featured: Boolean(p.is_featured),
        is_active: Boolean(p.is_active),
      });
      const { data: vs } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId);
      setVariants((vs ?? []) as Variant[]);
      const { data: ims } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", productId)
        .order("sort_order", { ascending: true });
      setImages((ims ?? []) as Img[]);
    })();
  }, [open, productId]);

  useEffect(() => {
    if (!form.category_id) {
      setSubs([]);
      return;
    }
    void (async () => {
      const { data } = await supabase
        .from("fashion_subcategories")
        .select("id, name, slug, category_id")
        .eq("category_id", form.category_id);
      setSubs((data ?? []) as Sub[]);
    })();
  }, [form.category_id]);

  const saveProduct = async () => {
    const tagsArr = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const row = {
      id,
      name: form.name,
      description: form.description || null,
      brand: form.brand || null,
      category_id: form.category_id || null,
      subcategory_id: form.subcategory_id || null,
      gender_target: form.gender_target,
      base_price: form.base_price,
      discount_percent: form.discount_percent,
      tags: tagsArr.length ? tagsArr : null,
      is_featured: form.is_featured,
      is_active: form.is_active,
    };
    const { error } = await supabase.from("products").upsert(row);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Product saved");
    onSaved();
  };

  const addVariant = async () => {
    if (!vForm.size || !vForm.color) {
      toast.error("Size and color required");
      return;
    }
    const payload = {
      product_id: id,
      size: vForm.size,
      color: vForm.color,
      color_hex: vForm.color_hex,
      stock_quantity: vForm.stock_quantity,
      sku: vForm.sku || null,
      additional_price: vForm.additional_price,
    };
    if (editingVariant) {
      const { error } = await supabase
        .from("product_variants")
        .update(payload)
        .eq("id", editingVariant);
      if (error) toast.error(error.message);
      else {
        toast.success("Variant updated");
        setEditingVariant(null);
      }
    } else {
      const { error } = await supabase.from("product_variants").insert(payload);
      if (error) toast.error(error.message);
      else toast.success("Variant added");
    }
    const { data: vs } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", id);
    setVariants((vs ?? []) as Variant[]);
    setVForm({
      size: "",
      color: "",
      color_hex: "#000000",
      stock_quantity: 0,
      sku: "",
      additional_price: 0,
    });
  };

  const delVariant = async (vid: string) => {
    const { error } = await supabase.from("product_variants").delete().eq("id", vid);
    if (error) toast.error(error.message);
    else setVariants((prev) => prev.filter((v) => v.id !== vid));
  };

  const setPrimary = async (imgId: string) => {
    await supabase
      .from("product_images")
      .update({ is_primary: false })
      .eq("product_id", id);
    const { error } = await supabase
      .from("product_images")
      .update({ is_primary: true })
      .eq("id", imgId);
    if (error) toast.error(error.message);
    else
      setImages((prev) =>
        prev.map((i) => ({ ...i, is_primary: i.id === imgId }))
      );
  };

  const delImage = async (img: Img) => {
    const marker = "/product-images/";
    const idx = img.image_url.indexOf(marker);
    const path = idx >= 0 ? img.image_url.slice(idx + marker.length) : "";
    if (path) {
      await supabase.storage.from("product-images").remove([path]);
    }
    await supabase.from("product_images").delete().eq("id", img.id);
    setImages((prev) => prev.filter((i) => i.id !== img.id));
  };

  const onImageUploaded = async (publicUrl: string) => {
    const maxSort = images.reduce((m, i) => Math.max(m, i.sort_order ?? 0), -1);
    const { data, error } = await supabase
      .from("product_images")
      .insert({
        product_id: id,
        image_url: publicUrl,
        is_primary: images.length === 0,
        sort_order: maxSort + 1,
      })
      .select("*")
      .single();
    if (error) toast.error(error.message);
    else if (data) setImages((prev) => [...prev, data as Img]);
  };

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={productId ? "Edit product" : "New product"}
      widthClass="max-w-2xl"
    >
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs text-[#9ca3af] sm:col-span-2">
            Name
            <input
              className="mt-1 w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </label>
          <label className="block text-xs text-[#9ca3af] sm:col-span-2">
            Description
            <textarea
              rows={3}
              className="mt-1 w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </label>
          <label className="text-xs text-[#9ca3af]">
            Brand
            <input
              className="mt-1 w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white"
              value={form.brand}
              onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
            />
          </label>
          <label className="text-xs text-[#9ca3af]">
            Gender
            <select
              className="mt-1 w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white"
              value={form.gender_target}
              onChange={(e) =>
                setForm((f) => ({ ...f, gender_target: e.target.value }))
              }
            >
              {["male", "female", "unisex", "kids"].map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-[#9ca3af]">
            Category
            <select
              className="mt-1 w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white"
              value={form.category_id}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  category_id: e.target.value,
                  subcategory_id: "",
                }))
              }
            >
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-[#9ca3af]">
            Subcategory
            <select
              className="mt-1 w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white"
              value={form.subcategory_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, subcategory_id: e.target.value }))
              }
            >
              <option value="">—</option>
              {subs.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-[#9ca3af]">
            Base price (INR)
            <input
              type="number"
              step="0.01"
              min={0}
              className="mt-1 w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white"
              value={form.base_price}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  base_price: parseFloat(e.target.value) || 0,
                }))
              }
            />
          </label>
          <label className="text-xs text-[#9ca3af]">
            Discount %
            <input
              type="number"
              min={0}
              max={100}
              className="mt-1 w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white"
              value={form.discount_percent}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  discount_percent: parseFloat(e.target.value) || 0,
                }))
              }
            />
          </label>
          <div className="text-xs text-[#9ca3af]">
            Final price (computed, INR)
            <div className="mt-2 rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] px-3 py-2 text-sm text-indigo-300">
              {formatInr(finalPrice)}
            </div>
          </div>
          <label className="text-xs text-[#9ca3af] sm:col-span-2">
            Tags (comma-separated)
            <input
              className="mt-1 w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-2 text-sm text-white"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-[#9ca3af]">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_featured: e.target.checked }))
              }
            />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm text-[#9ca3af]">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_active: e.target.checked }))
              }
            />
            Active
          </label>
        </div>

        <button
          type="button"
          onClick={() => void saveProduct()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Save product
        </button>

        <div className="border-t border-[#2a2a2a] pt-6">
          <h4 className="text-sm font-semibold text-white">Images</h4>
          <div className="mt-3">
            <ImageUploader productId={id} onUploaded={(url) => void onImageUploaded(url)} />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {images.map((im) => (
              <div
                key={im.id}
                className="relative w-24 overflow-hidden rounded-lg border border-[#2a2a2a]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={im.image_url} alt="" className="h-24 w-full object-cover" />
                <div className="flex gap-1 p-1">
                  <button
                    type="button"
                    className="flex-1 rounded bg-[#1a1a1a] px-1 py-0.5 text-[10px] text-indigo-300"
                    onClick={() => void setPrimary(im.id)}
                  >
                    Primary
                  </button>
                  <button
                    type="button"
                    className="rounded bg-red-600/80 px-1 py-0.5 text-[10px] text-white"
                    onClick={() => void delImage(im)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[#2a2a2a] pt-6">
          <h4 className="text-sm font-semibold text-white">Variants</h4>
          <p className="mt-1 text-xs text-[#6b7280]">
            Enter size codes (e.g. UK 10, US 9), color name, stock units, and any
            extra amount in INR added on top of the product final price.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className="block text-xs text-[#9ca3af] sm:col-span-1">
              Size (UK, US, or other size variants)
              <input
                className="mt-1 w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-2 text-sm text-white"
                placeholder="e.g. UK 10 / US 9"
                value={vForm.size}
                onChange={(e) =>
                  setVForm((v) => ({ ...v, size: e.target.value }))
                }
              />
            </label>
            <label className="block text-xs text-[#9ca3af] sm:col-span-1">
              Color (variant name)
              <input
                className="mt-1 w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-2 text-sm text-white"
                placeholder="e.g. Navy"
                value={vForm.color}
                onChange={(e) =>
                  setVForm((v) => ({ ...v, color: e.target.value }))
                }
              />
            </label>
            <label className="block text-xs text-[#9ca3af] sm:col-span-1">
              Color swatch (hex)
              <input
                type="color"
                title="Pick color for this variant"
                className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-1 py-1"
                value={vForm.color_hex}
                onChange={(e) =>
                  setVForm((v) => ({ ...v, color_hex: e.target.value }))
                }
              />
            </label>
            <label className="block text-xs text-[#9ca3af] sm:col-span-1">
              Stock number
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-2 text-sm text-white"
                placeholder="Units in stock"
                value={vForm.stock_quantity}
                onChange={(e) =>
                  setVForm((v) => ({
                    ...v,
                    stock_quantity: parseInt(e.target.value, 10) || 0,
                  }))
                }
              />
            </label>
            <label className="block text-xs text-[#9ca3af] sm:col-span-1">
              <span className="text-[#d1d5db]">
                SKU — Stock Keeping Unit
              </span>
              <span className="mt-0.5 block max-w-md text-[11px] leading-snug text-[#6b7280]">
                A unique code for this exact variant (size + color) so you can
                track it in inventory, on shelves, or in barcodes. Optional.
              </span>
              <input
                className="mt-1.5 w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-2 text-sm text-white"
                placeholder="e.g. SHRT-NVY-M-001"
                value={vForm.sku}
                onChange={(e) => setVForm((v) => ({ ...v, sku: e.target.value }))}
              />
            </label>
            <label className="block text-xs text-[#9ca3af] sm:col-span-1">
              Additional price (INR)
              <input
                type="number"
                step="0.01"
                min={0}
                className="mt-1 w-full rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-2 text-sm text-white"
                placeholder="0.00"
                value={vForm.additional_price}
                onChange={(e) =>
                  setVForm((v) => ({
                    ...v,
                    additional_price: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </label>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => void addVariant()}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white"
            >
              {editingVariant ? "Update variant" : "Add variant"}
            </button>
            {editingVariant && (
              <button
                type="button"
                onClick={() => {
                  setEditingVariant(null);
                  setVForm({
                    size: "",
                    color: "",
                    color_hex: "#000000",
                    stock_quantity: 0,
                    sku: "",
                    additional_price: 0,
                  });
                }}
                className="rounded-lg border border-[#2a2a2a] px-3 py-2 text-xs text-[#9ca3af]"
              >
                Cancel edit
              </button>
            )}
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs text-[#9ca3af]">
              <thead>
                <tr className="border-b border-[#2a2a2a]">
                  <th className="py-2">Size (UK/US…)</th>
                  <th className="py-2">Color</th>
                  <th className="py-2">Stock #</th>
                  <th className="py-2">Stock Keeping Unit (SKU)</th>
                  <th className="py-2">Add. price (INR)</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr key={v.id} className="border-b border-[#2a2a2a]">
                    <td className="py-2 text-white">{v.size}</td>
                    <td className="py-2">{v.color}</td>
                    <td className="py-2">{v.stock_quantity ?? "—"}</td>
                    <td className="py-2">{v.sku ?? "—"}</td>
                    <td className="py-2 text-white">
                      {formatInr(Number(v.additional_price ?? 0))}
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        className="text-indigo-400"
                        onClick={() => {
                          setEditingVariant(v.id);
                          setVForm({
                            size: v.size,
                            color: v.color,
                            color_hex: v.color_hex ?? "#000000",
                            stock_quantity: v.stock_quantity ?? 0,
                            sku: v.sku ?? "",
                            additional_price: Number(v.additional_price ?? 0),
                          });
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="ml-2 text-red-400"
                        onClick={() => void delVariant(v.id)}
                      >
                        Del
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SlideOver>
  );
};
