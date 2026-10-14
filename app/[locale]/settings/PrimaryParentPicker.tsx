"use client";

import { useState } from "react";
import { setPrimaryParent } from "@/app/actions/families";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function PrimaryParentPicker({
  familyId,
  members,
  currentPrimaryId,
}: {
  familyId: string;
  members: { id: string; name: string }[];
  currentPrimaryId: string | null;
}) {
  const t = useTranslations("settings");
  const [selected, setSelected] = useState(currentPrimaryId ?? members[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function save() {
    setSaving(true);
    await setPrimaryParent(familyId, selected);
    setSaving(false);
    router.refresh();
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">{t("primaryParentTitle")}</h2>
      <p className="mt-1 text-sm text-slate-500">{t("primaryParentHelp")}</p>
      <div className="mt-3 space-y-2">
        {members.map((m) => (
          <label key={m.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50">
            <input
              type="radio"
              name="primary"
              checked={selected === m.id}
              onChange={() => setSelected(m.id)}
              className="h-4 w-4 text-violet-600"
            />
            <span className="font-medium text-slate-800">{m.name}</span>
          </label>
        ))}
      </div>
      <button
        onClick={save}
        disabled={saving || selected === currentPrimaryId}
        className="mt-4 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
      >
        {saving ? "..." : t("savePrimary")}
      </button>
    </div>
  );
}
