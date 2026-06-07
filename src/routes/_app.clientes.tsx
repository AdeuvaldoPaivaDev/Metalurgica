import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase, type Cliente } from "@/lib/db";
import { safeSearchText, safeText } from "@/lib/safe-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_app/clientes")({
  component: ClientesPage,
});

const EMPTY: Partial<Cliente> = {
  nome: "", cpf_cnpj: "", rg_ie: "", telefone: "", endereco: "",
  numero: "", bairro: "", cidade: "", estado: "", observacoes: "",
};

const FIELDS: { key: keyof Cliente; label: string; full?: boolean }[] = [
  { key: "nome", label: "Nome", full: true },
  { key: "cpf_cnpj", label: "CPF / CNPJ" },
  { key: "rg_ie", label: "RG / Inscrição Estadual" },
  { key: "telefone", label: "Telefone" },
  { key: "endereco", label: "Endereço" },
  { key: "numero", label: "Número" },
  { key: "bairro", label: "Bairro" },
  { key: "cidade", label: "Cidade" },
  { key: "estado", label: "Estado (UF)" },
];

function ClientesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Cliente>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Cliente | null>(null);

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clientes").select("*").order("nome");
      if (error) {
        console.error(error);
        toast.error("Erro ao carregar clientes", { description: error.message });
        return [];
      }
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter(
      (c) =>
        safeSearchText(c.nome).includes(q) ||
        safeSearchText(c.cpf_cnpj).includes(q) ||
        safeSearchText(c.cidade).includes(q),
    );
  }, [clientes, search]);

  const openNew = () => { setForm(EMPTY); setOpen(true); };
  const openEdit = (c: Cliente) => {
    setForm({
      ...c,
      nome: safeText(c.nome),
      cpf_cnpj: safeText(c.cpf_cnpj),
      rg_ie: safeText(c.rg_ie),
      telefone: safeText(c.telefone),
      endereco: safeText(c.endereco),
      numero: safeText(c.numero),
      bairro: safeText(c.bairro),
      cidade: safeText(c.cidade),
      estado: safeText(c.estado),
      observacoes: safeText(c.observacoes),
    });
    setOpen(true);
  };
  const set = (key: keyof Cliente, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!form.nome?.trim()) {
      toast.error("Informe o nome do cliente");
      return;
    }
    setSaving(true);
    const payload = {
      nome: form.nome?.trim() ?? "",
      cpf_cnpj: form.cpf_cnpj ?? "",
      rg_ie: form.rg_ie ?? "",
      telefone: form.telefone ?? "",
      endereco: form.endereco ?? "",
      numero: form.numero ?? "",
      bairro: form.bairro ?? "",
      cidade: form.cidade ?? "",
      estado: form.estado ?? "",
      observacoes: form.observacoes ?? "",
    };
    try {
      const { error } = form.id
        ? await supabase.from("clientes").update(payload).eq("id", form.id)
        : await supabase.from("clientes").insert(payload);
      if (error) { toast.error("Erro ao salvar", { description: error.message }); return; }
      toast.success(form.id ? "Cliente atualizado" : "Cliente cadastrado");
      setOpen(false);
      await qc.invalidateQueries({ queryKey: ["clientes"] });
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
      const { error } = await supabase.from("clientes").delete().eq("id", toDelete.id);
      if (error) { toast.error("Erro ao excluir", { description: error.message }); return; }
      toast.success("Cliente excluído");
      setToDelete(null);
      await qc.invalidateQueries({ queryKey: ["clientes"] });
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
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">Cadastre e gerencie seus clientes.</p>
        </div>
        <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Novo cliente</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Pesquisar por nome, documento ou cidade..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">CPF/CNPJ</TableHead>
              <TableHead className="hidden md:table-cell">Telefone</TableHead>
              <TableHead className="hidden sm:table-cell">Cidade</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              </TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                Nenhum cliente encontrado.
              </TableCell></TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{safeText(c.nome, "-")}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{safeText(c.cpf_cnpj, "-")}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{safeText(c.telefone, "-")}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {c.cidade ? `${safeText(c.cidade)}${c.estado ? "/" + safeText(c.estado) : ""}` : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setToDelete(c)}>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.key} className={`space-y-1.5 ${f.full ? "sm:col-span-2" : ""}`}>
                <Label htmlFor={f.key}>{f.label}</Label>
                <Input id={f.key} value={(form[f.key] as string) ?? ""} onChange={(e) => set(f.key, e.target.value)} />
              </div>
            ))}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea id="observacoes" rows={2} value={form.observacoes ?? ""} onChange={(e) => set("observacoes", e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{safeText(toDelete?.nome, "-")}</strong>? Esta ação não pode ser desfeita.
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
