import React, { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import Button from "../Buttons/Button";
import Input from "../Input/Input";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

export type SavedAddressRow = {
  id: string;
  label: string | null;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string | null;
  is_default: boolean | null;
};

type Props = {
  userId: string;
  profileFullName: string;
  profilePhone: string;
};

const emptyAdd = {
  label: "Home",
  full_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  setDefault: true,
};

export const AddressBookPanel: React.FC<Props> = ({
  userId,
  profileFullName,
  profilePhone,
}) => {
  const t = useTranslations("LoginRegister");
  const [rows, setRows] = useState<SavedAddressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(emptyAdd);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      setRows((data ?? []) as SavedAddressRow[]);
    } catch (e) {
      console.error(e);
      toast.error(t("address_load_error"));
    } finally {
      setLoading(false);
    }
  }, [userId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (addOpen) {
      setForm((f) => ({
        ...emptyAdd,
        full_name: profileFullName || f.full_name,
        phone: profilePhone || f.phone,
      }));
    }
  }, [addOpen, profileFullName, profilePhone]);

  const clearOtherDefaults = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", userId);
  };

  const setDefault = async (id: string) => {
    try {
      const supabase = getSupabaseBrowserClient();
      await clearOtherDefaults();
      const { error } = await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", id)
        .eq("user_id", userId);
      if (error) throw error;
      toast.success(t("address_default_updated"));
      void load();
    } catch {
      toast.error(t("address_error"));
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm(t("address_delete_confirm"))) return;
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("addresses")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (error) throw error;
      toast.success(t("address_deleted"));
      void load();
    } catch {
      toast.error(t("address_error"));
    }
  };

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.address_line1.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.pincode.trim() ||
      !form.phone.trim() ||
      !form.full_name.trim()
    ) {
      toast.error(t("address_required_fields"));
      return;
    }
    try {
      const supabase = getSupabaseBrowserClient();
      if (form.setDefault) await clearOtherDefaults();
      const { error } = await supabase.from("addresses").insert({
        user_id: userId,
        label: form.label.trim() || "Home",
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        address_line1: form.address_line1.trim(),
        address_line2: form.address_line2.trim() || null,
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        country: form.country.trim() || "India",
        is_default: form.setDefault,
      });
      if (error) throw error;
      toast.success(t("address_saved"));
      setAddOpen(false);
      setForm(emptyAdd);
      void load();
    } catch {
      toast.error(t("address_error"));
    }
  };

  const formatLine = (a: SavedAddressRow) =>
    [
      a.address_line1,
      a.address_line2,
      `${a.city}, ${a.state} ${a.pincode}`,
      a.country,
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <div className="mt-4 border-t border-gray200 pt-4">
      <p className="text-sm font-semibold text-gray-900">{t("saved_addresses")}</p>
      <p className="text-xs text-gray400 mt-1 mb-3">{t("saved_addresses_hint")}</p>

      {loading ? (
        <p className="text-sm text-gray400">{t("address_loading")}…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray400 mb-3">{t("no_addresses_yet")}</p>
      ) : (
        <ul className="space-y-3 mb-4 max-h-56 overflow-y-auto pr-1">
          {rows.map((a) => (
            <li
              key={a.id}
              className="rounded-lg border border-gray200 bg-gray100/40 p-3 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="font-medium text-gray-900">
                    {a.label || "Home"}
                  </span>
                  {a.is_default && (
                    <span className="ml-2 rounded bg-haru-accent/10 px-2 py-0.5 text-xs text-haru-accent">
                      {t("default_badge")}
                    </span>
                  )}
                  <p className="text-gray500 mt-1">{a.full_name}</p>
                  <p className="text-gray400 text-xs">{a.phone}</p>
                  <p className="text-gray500 mt-1">{formatLine(a)}</p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {!a.is_default && (
                    <button
                      type="button"
                      className="text-xs text-haru-accent hover:underline"
                      onClick={() => void setDefault(a.id)}
                    >
                      {t("set_as_default")}
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-xs text-red hover:underline"
                    onClick={() => void remove(a.id)}
                  >
                    {t("delete_address")}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!addOpen ? (
        <button
          type="button"
          className="text-sm font-medium text-haru-accent hover:underline"
          onClick={() => setAddOpen(true)}
        >
          + {t("add_address")}
        </button>
      ) : (
        <form onSubmit={submitAdd} className="mt-3 space-y-3 rounded-lg border border-gray200 p-3">
          <p className="text-sm font-medium text-gray-900">{t("add_address")}</p>
          <Input
            name="address_label"
            type="text"
            placeholder={`${t("address_label")} *`}
            extraClass="w-full"
            border="border-2 border-gray300"
            value={form.label}
            onChange={(e) =>
              setForm((f) => ({ ...f, label: (e.target as HTMLInputElement).value }))
            }
            required
          />
          <Input
            name="full_name"
            type="text"
            placeholder={`${t("name")} *`}
            extraClass="w-full"
            border="border-2 border-gray300"
            value={form.full_name}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                full_name: (e.target as HTMLInputElement).value,
              }))
            }
            required
          />
          <Input
            name="phone"
            type="text"
            placeholder={`${t("phone")} *`}
            extraClass="w-full"
            border="border-2 border-gray300"
            value={form.phone}
            onChange={(e) =>
              setForm((f) => ({ ...f, phone: (e.target as HTMLInputElement).value }))
            }
            required
          />
          <Input
            name="address_line1"
            type="text"
            placeholder={`${t("address_line1")} *`}
            extraClass="w-full"
            border="border-2 border-gray300"
            value={form.address_line1}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                address_line1: (e.target as HTMLInputElement).value,
              }))
            }
            required
          />
          <Input
            name="address_line2"
            type="text"
            placeholder={t("address_line2_optional")}
            extraClass="w-full"
            border="border-2 border-gray300"
            value={form.address_line2}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                address_line2: (e.target as HTMLInputElement).value,
              }))
            }
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              name="city"
              type="text"
              placeholder={`${t("city")} *`}
              extraClass="w-full"
              border="border-2 border-gray300"
              value={form.city}
              onChange={(e) =>
                setForm((f) => ({ ...f, city: (e.target as HTMLInputElement).value }))
              }
              required
            />
            <Input
              name="state"
              type="text"
              placeholder={`${t("state")} *`}
              extraClass="w-full"
              border="border-2 border-gray300"
              value={form.state}
              onChange={(e) =>
                setForm((f) => ({ ...f, state: (e.target as HTMLInputElement).value }))
              }
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              name="pincode"
              type="text"
              placeholder={`${t("pincode")} *`}
              extraClass="w-full"
              border="border-2 border-gray300"
              value={form.pincode}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  pincode: (e.target as HTMLInputElement).value,
                }))
              }
              required
            />
            <Input
              name="country"
              type="text"
              placeholder={t("country")}
              extraClass="w-full"
              border="border-2 border-gray300"
              value={form.country}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  country: (e.target as HTMLInputElement).value,
                }))
              }
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-gray500">
            <input
              type="checkbox"
              checked={form.setDefault}
              onChange={(e) =>
                setForm((f) => ({ ...f, setDefault: e.target.checked }))
              }
            />
            {t("set_as_default_new")}
          </label>
          <div className="flex gap-2">
            <Button type="submit" value={t("save_address")} />
            <button
              type="button"
              className="text-sm text-gray500 underline"
              onClick={() => setAddOpen(false)}
            >
              {t("cancel")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
