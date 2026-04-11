import type { FC } from "react";
import { useRef, useState } from "react";
import { Upload } from "lucide-react";

import { supabase } from "../../src/lib/supabase";

type Props = {
  productId: string;
  onUploaded: (publicUrl: string, path: string) => void;
  disabled?: boolean;
};

export const ImageUploader: FC<Props> = ({
  productId,
  onUploaded,
  disabled,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || disabled) return;
    setBusy(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${productId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from("product-images")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (error) throw error;
        const { data } = supabase.storage
          .from("product-images")
          .getPublicUrl(path);
        onUploaded(data.publicUrl, path);
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
        disabled={disabled || busy}
      />
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[#2a2a2a] bg-[#1a1a1a] px-4 py-3 text-sm text-[#9ca3af] transition hover:border-indigo-500/50 hover:text-white disabled:opacity-50"
      >
        <Upload className="h-4 w-4" />
        {busy ? "Uploading…" : "Upload images"}
      </button>
    </div>
  );
};
