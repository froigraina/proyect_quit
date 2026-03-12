export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 md:gap-10 md:px-8 md:py-8">
      {children}
    </main>
  );
}
