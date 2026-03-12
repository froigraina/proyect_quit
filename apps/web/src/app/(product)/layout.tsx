import { ProtectedRoute } from "@/features/auth/auth-guard";
import { ProductShell } from "@/components/product-shell";

export default function ProductLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute>
      <ProductShell>{children}</ProductShell>
    </ProtectedRoute>
  );
}
