import { type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/proxy-client";

export async function proxy(request: NextRequest) {
  const { supabaseResponse } = createClient(request);
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
