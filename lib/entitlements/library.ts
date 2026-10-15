import { getAccessToken } from "@/lib/auth/session";
import { supabaseConfig } from "@/lib/supabase/config";
import type { Sku } from "@/lib/catalog";

/**
 * Content metadata for the member library.
 *
 * Read with the USER'S token, so RLS decides what comes back: the policy on
 * content_items only exposes rows whose sku the caller actively owns. A
 * non-owner cannot even enumerate the titles of what they have not bought.
 *
 * This returns metadata only. The bytes come from /api/content/[id], which
 * re-checks ownership before signing anything.
 */
export type ContentItem = {
  id: string;
  sku: Sku;
  kind: "file" | "interactive";
  title: string;
  description: string | null;
  page_count: number | null;
  sort_order: number;
};

export async function getLibraryContent(): Promise<ContentItem[]> {
  const token = await getAccessToken();
  if (!token) return [];

  let url: string;
  let publishableKey: string;
  try {
    ({ url, publishableKey } = supabaseConfig());
  } catch {
    return [];
  }

  try {
    const response = await fetch(
      `${url}/rest/v1/content_items` +
        `?select=id,sku,kind,title,description,page_count,sort_order` +
        `&is_published=eq.true&order=sort_order.asc`,
      {
        headers: { apikey: publishableKey, Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    if (!response.ok) {
      console.error("[library] content read failed", response.status);
      return [];
    }
    return (await response.json()) as ContentItem[];
  } catch (error) {
    console.error("[library] content read threw", error);
    return [];
  }
}

export function contentForSku(items: ContentItem[], sku: Sku): ContentItem[] {
  return items.filter((item) => item.sku === sku);
}
