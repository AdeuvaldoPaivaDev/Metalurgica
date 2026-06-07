import { createFileRoute } from "@tanstack/react-router";
import { OrdemEditor } from "@/components/ordem-editor";

export const Route = createFileRoute("/_app/ordens/nova")({
  component: () => <OrdemEditor />,
});
