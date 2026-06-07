import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase, type Produto, UNIDADES } from "@/lib/db";
import { formatCurrency, parseNumber } from "@/lib/format";
import { safeSearchText, safeText } from "@/lib/safe-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_app/produtos")({
  component: ProdutosPage,
});

interface Form {
  id?: string;
  codigo?: string;
  descricao: string;
  unidade: string;
  valor_unitario: string;
}

const EMPTY: Form = { descricao: "", unidade: "UN", valor_unitario: "" };

function ProdutosPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Produto | null>(null);

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ["produtos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("produtos").select("*").order("codigo");
      if (error) {
        console.error(error);
        toast.error("Erro ao carregar produtos", { description: error.message });
        return [];
      }
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return produtos;
    return produtos.filter(
      (p) => safeSearchText(p.descricao).includes(q) || safeSearchText(p.codigo).includes(q),
    );
  }, [produtos, search]);

  const openNew = () => { setForm(EMPTY); setOpen(true); };
  const openEdit = (p: Produto) => {
    setForm({ id: p.id, codigo: safeText(p.codigo), descricao: safeText(p.descricao), unidade: safeText(p.unidade, "UN"), valor_unitario: String(p.valor_unitario ?? "") });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.descricao.trim()) { toast.error("Informe a descrição"); return; }
    setSaving(true);
    const base = {
      descricao: form.descricao.trim(),
      unidade: form.unidade,
      valor_unitario: parseNumber(form.valor_unitario),
    };
    // codigo is generated automatically by the database trigger when blank.
    try {
      const { error } = form.id
        ? await supabase.from("produtos").update(base).eq("id", form.id)
        : await supabase.from("produtos").insert({ ...base, codigo: "" });
      if (error) { toast.error("Erro ao salvar", { description: error.message }); return; }
      toast.success(form.id ? "Produto atualizado" : "Produto cadastrado");
      setOpen(false);
      await qc.invalidateQueries({ queryKey: ["produtos"] });
    } catch (error) {
      toast.error("Erro ao salvar", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      const { error } = await supabase.from("produtos").delete().eq("id", toDelete.id);
      if (error) { toast.error("Erro ao excluir", { description: error.message }); return; }
      toast.success("Produto excluído");
      setToDelete(null);
      await qc.invalidateQueries({ queryKey: ["produtos"] });
    } catch (error) {
      toast.error("Erro ao excluir", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
          <p className="text-sm text-muted-foreground">Código gerado automaticamente pelo sistema.</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Novo produto</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Pesquisar por código ou descrição..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Código</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="hidden sm:table-cell w-24">Unidade</TableHead>
              <TableHead className="w-32 text-right">Valor Unit.</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Nenhum produto encontrado.</TableCell></TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm">{safeText(p.codigo, "-")}</TableCell>
                  <TableCell className="font-medium">{safeText(p.descricao, "-")}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">{safeText(p.unidade, "-")}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(p.valor_unitario))}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setToDelete(p)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar produto" : "Novo produto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Código</Label>
              <Input value={form.codigo ?? "Gerado automaticamente"} disabled readOnly className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="descricao">Descrição</Label>
              <Input id="descricao" value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Unidade</Label>
                <Select value={form.unidade} onValueChange={(v) => setForm((f) => ({ ...f, unidade: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNIDADES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="valor">Valor unitário</Label>
                <Input id="valor" inputMode="decimal" placeholder="0,00" value={form.valor_unitario} onChange={(e) => setForm((f) => ({ ...f, valor_unitario: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{toDelete?.descricao}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
