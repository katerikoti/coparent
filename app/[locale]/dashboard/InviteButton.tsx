"use client";
import { useState } from "react";
import { createInvitation } from "@/app/actions/families";

export default function InviteButton({ familyId }: { familyId: string }) {
  const [link, setLink] = useState<string | null>(null);
  async function invite() {
    const { token } = await createInvitation(familyId);
    const url = `${window.location.origin}/fi/auth/accept-invitation?token=${token}`;
    setLink(url);
  }
  return (
    <div>
      <button onClick={invite} className="rounded border px-3 py-2 text-sm">Invite other parent</button>
      {link && <p className="mt-2 break-all text-xs text-slate-600">{link}</p>}
    </div>
  );
}
