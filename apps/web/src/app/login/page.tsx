import { PublicOnlyRoute } from "@/features/auth/auth-guard";
import { AuthForm } from "@/features/auth/components/auth-form";

export default function LoginPage() {
  return (
    <PublicOnlyRoute>
      <AuthForm mode="login" />
    </PublicOnlyRoute>
  );
}
