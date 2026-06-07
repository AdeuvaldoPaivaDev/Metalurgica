import { createFileRoute, useParams } from "@tanstack/react-router";
import { OrdemEditor } from "@/components/ordem-editor";

export const Route = createFileRoute("/_app/ordens/$id")({
  component: EditOrdem,
});

function EditOrdem() {
  const { id } = useParams({ from: "/_app/ordens/$id" });
  return <OrdemEditor ordemId={id} />;
}
