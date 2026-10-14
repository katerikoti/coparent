"use client";
import { useState } from "react";
import { createInvitation } from "@/app/actions/families";
import { useTranslations, useLocale } from "next-intl";

export default function InviteButton({ familyId }: { familyId: string }) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const [link, setLink] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function invite() {
    const created = await createInvitation(familyId);
    const url = `${window.location.origin}/${locale}/auth/accept-invitation?token=${created.token}`;
    setLink(url);
    setToken(created.token);
    setCopied(false);
  }

  async function copyLink() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-2">
      <button onClick={invite} className="inline-flex h-12 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-medium hover:bg-slate-50">
        {t("inviteOther")}
      </button>
      {link && (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">
          <p className="mb-1 font-medium">{t("shareLink")}</p>
          <p className="break-all text-slate-700">{link}</p>
          <div className="mt-2 flex gap-2">
            <button onClick={copyLink} className="inline-flex h-10 items-center justify-center rounded-md bg-violet-600 px-3 text-white hover:bg-violet-700">
              {copied ? t("copied") : t("copyLink")}
            </button>
          </div>
          <p className="mt-2 text-slate-500">{t("inviteCode", { token: token ?? "" })}</p>
        </div>
      )}
    </div>
  );
}
