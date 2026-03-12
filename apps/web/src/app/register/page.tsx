import { PublicOnlyRoute } from "@/features/auth/auth-guard";
import { AuthForm } from "@/features/auth/components/auth-form";

export default function RegisterPage() {
  return (
    <PublicOnlyRoute>
      <AuthForm mode="register" />
    </PublicOnlyRoute>
  );
}
