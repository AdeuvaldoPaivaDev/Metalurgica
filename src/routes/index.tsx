import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OrçaMetal" },
      { name: "description", content: "Sistema de orçamentos e ordens de serviço." },
    ],
  }),
  component: Index,
});

function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  return <Navigate to={session ? "/ordens" : "/auth"} />;
}
