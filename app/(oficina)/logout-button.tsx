"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-muted hover:bg-surface-hover hover:text-foreground"
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 8.5V5.5a1 1 0 0 0-1-1h-8a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-3" />
        <path d="M10 12h10m0 0-3-3m3 3-3 3" />
      </svg>
      Sair
    </button>
  );
}
