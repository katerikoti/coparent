"use client";
import { useState } from "react";
import { createInvitation } from "@/app/actions/families";

export default function InviteButton({ familyId }: { familyId: string }) {
  const [link, setLink] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function invite() {
    const created = await createInvitation(familyId);
    const url = `${window.location.origin}/fi/auth/accept-invitation?token=${created.token}`;
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
      <button onClick={invite} className="rounded border px-3 py-2 text-sm">Invite other parent</button>
      {link && (
        <div className="rounded border bg-slate-50 p-3 text-xs">
          <p className="mb-1 font-medium">Share this secure link (single-use, expires in 7 days):</p>
          <p className="break-all text-slate-700">{link}</p>
          <div className="mt-2 flex gap-2">
            <button onClick={copyLink} className="rounded bg-blue-600 px-2 py-1 text-white">
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
          <p className="mt-2 text-slate-500">Invite code (if needed): {token}</p>
        </div>
      )}
    </div>
  );
}
