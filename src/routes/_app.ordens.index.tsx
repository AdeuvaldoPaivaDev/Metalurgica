import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Loader2, FileText, Pencil, Trash2, Printer } from "lucide-react";
import { toast } from "sonner";
import { supabase, type OrdemServico, type Empresa, type Cliente } from "@/lib/db";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { getOrdemPdfUrl, printOrdemPdf, type PdfItem } from "@/lib/pdf";
import { safeSearchText, safeText } from "@/lib/safe-data";
import { PdfPreviewDialog } from "@/components/pdf-preview-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_app/ordens/")({
  component: OrdensPage,
});

function OrdensPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [toDelete, setToDelete] = useState<OrdemServico | null>(null);
  const [busy, setBusy] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfFilename, setPdfFilename] = useState<string>("orcamento.pdf");

  const { data: ordens = [], isLoading } = useQuery({
    queryKey: ["ordens"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordens_servico")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.error(error);
        toast.error("Erro ao carregar ordens", { description: error.message });
        return [];
      }
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ordens;
    return ordens.filter(
      (o) => safeSearchText(o.numero).includes(q) || safeSearchText(o.cliente_nome).includes(q),
    );
  }, [ordens, search]);

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      const { error } = await supabase.from("ordens_servico").delete().eq("id", toDelete.id);
      if (error) {
        toast.error("Erro ao excluir", { description: error.message });
        return;
      }
      toast.success("Ordem excluída");
      setToDelete(null);
      await qc.invalidateQueries({ queryKey: ["ordens"] });
    } catch (error) {
      toast.error("Erro ao excluir", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    }
  };

  const generate = async (o: OrdemServico, mode: "view" | "print") => {
    setBusy(true);
    try {
      const [empresaRes, itensRes, clienteRes] = await Promise.all([
        supabase.from("empresas").select("*").maybeSingle(),
        supabase
          .from("ordem_servico_itens")
          .select("*")
          .eq("ordem_servico_id", o.id)
          .order("created_at"),
        o.cliente_id
          ? supabase.from("clientes").select("*").eq("id", o.cliente_id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (empresaRes.error) throw empresaRes.error;
      if (itensRes.error) throw itensRes.error;
      if (clienteRes.error) throw clienteRes.error;

      const pdfItens: PdfItem[] = (itensRes.data ?? []).map((it) => ({
        codigo: safeText(it.codigo),
        descricao: safeText(it.descricao),
        unidade: safeText(it.unidade, "UN"),
        quantidade: Number(it.quantidade),
        valor_unitario: Number(it.valor_unitario),
        valor_total: Number(it.valor_total),
      }));
      const pdfOrdem = {
        numero: safeText(o.numero),
        data_emissao: o.data_emissao,
        subtotal: Number(o.subtotal),
        desconto: Number(o.desconto),
        acrescimo: Number(o.acrescimo),
        total: Number(o.total),
        vendedor: safeText(o.vendedor),
        observacoes: safeText(o.observacoes),
        cliente_nome: safeText(o.cliente_nome),
      };
      if (mode === "view") {
        const url = getOrdemPdfUrl(
          (empresaRes.data as Empresa) ?? null,
          (clienteRes.data as Cliente) ?? null,
          pdfOrdem,
          pdfItens,
        );
        setPdfFilename(`${safeText(o.numero, "orcamento")}.pdf`);
        setPdfUrl(url);
      } else {
        printOrdemPdf(
          (empresaRes.data as Empresa) ?? null,
          (clienteRes.data as Cliente) ?? null,
          pdfOrdem,
          pdfItens,
        );
      }
    } catch (error) {
      toast.error("Erro ao gerar PDF", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ordens de Serviço</h1>
          <p className="text-sm text-muted-foreground">Crie, gere e imprima seus orçamentos.</p>
        </div>
        <Button asChild>
          <Link to="/ordens/nova">
            <Plus className="mr-2 h-4 w-4" /> Nova OS
          </Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por número ou cliente..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden md:table-cell">Data</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-40 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Nenhuma ordem encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((o) => (
                <TableRow
                  key={o.id}
                  className="cursor-pointer"
                  onClick={() => navigate({ to: "/ordens/$id", params: { id: o.id } })}
                >
                  <TableCell className="font-mono text-sm font-medium">
                    {safeText(o.numero, "-")}
                  </TableCell>
                  <TableCell className="font-medium">{safeText(o.cliente_nome, "-")}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {o.data_emissao ? formatDateTime(o.data_emissao) : "-"}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(Number(o.total))}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={busy}
                        title="Gerar PDF"
                        onClick={() => generate(o, "view")}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={busy}
                        title="Imprimir"
                        onClick={() => generate(o, "print")}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Editar"
                        onClick={() => navigate({ to: "/ordens/$id", params: { id: o.id } })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Excluir"
                        onClick={() => setToDelete(o)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ordem?</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir a ordem <strong>{safeText(toDelete?.numero, "-")}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PdfPreviewDialog
        open={!!pdfUrl}
        onOpenChange={(o) => {
          if (!o) setPdfUrl(null);
        }}
        url={pdfUrl}
        filename={pdfFilename}
      />
    </div>
  );
}
