"use client";

import { useRouter } from "next/navigation";

export default function PortalLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/portal/logout", { method: "POST" });
    router.replace("/login?portal=1");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-surface-hover hover:text-foreground"
    >
      Sair
    </button>
  );
}
