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
    <button onClick={handleLogout} className="text-sm text-muted hover:text-foreground">
      Sair
    </button>
  );
}
