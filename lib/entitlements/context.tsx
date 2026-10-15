"use client";

import { createContext, useContext, type ReactNode } from "react";
import { domainSku, examSku, type Sku } from "@/lib/catalog";

/**
 * Ownership, made available to client components.
 *
 * Seeded ONCE from the server in app/layout.tsx, so the first paint already
 * knows what you own — no "Unlock" flashing into "Open" after hydration.
 *
 * This is a rendering convenience, not a security boundary. Anything that
 * actually releases paid content re-checks ownership on the server; see
 * app/api/content/[id]/route.ts.
 */
type OwnershipValue = {
  signedIn: boolean;
  email: string | null;
  ownedSkus: Sku[];
};

const OwnershipContext = createContext<OwnershipValue>({
  signedIn: false,
  email: null,
  ownedSkus: [],
});

export function OwnershipProvider({
  value,
  children,
}: {
  value: OwnershipValue;
  children: ReactNode;
}) {
  return (
    <OwnershipContext.Provider value={value}>
      {children}
    </OwnershipContext.Provider>
  );
}

export function useOwnership() {
  const ctx = useContext(OwnershipContext);

  return {
    ...ctx,
    owns: (sku: Sku) => ctx.ownedSkus.includes(sku),
    ownsDomain: (slug: string) => ctx.ownedSkus.includes(domainSku(slug)),
    ownsExam: (id: string) => ctx.ownedSkus.includes(examSku(id)),
  };
}
