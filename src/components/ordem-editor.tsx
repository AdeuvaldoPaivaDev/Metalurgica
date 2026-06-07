import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Trash2,
  Save,
  FileText,
  Printer,
  Loader2,
  ArrowLeft,
  Check,
  ChevronsUpDown,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { supabase, type Cliente, type Produto, type Empresa } from "@/lib/db";
import { formatCurrency, parseNumber, formatNumber } from "@/lib/format";
import { getOrdemPdfUrl, printOrdemPdf, type PdfItem, type PdfOrdem } from "@/lib/pdf";
import { safeSearchText, safeText } from "@/lib/safe-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { PdfPreviewDialog } from "@/components/pdf-preview-dialog";

interface ItemRow {
  key: string;
  produto_id: string | null;
  codigo: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
}

let counter = 0;
const newKey = () => `row-${Date.now()}-${counter++}`;

const clienteSubtitle = (c: Cliente) =>
  [safeText(c.cpf_cnpj), safeText(c.telefone), [safeText(c.cidade), safeText(c.estado)].filter(Boolean).join("/")]
    .filter(Boolean)
    .join(" · ");

export function OrdemEditor({ ordemId }: { ordemId?: string }) {
  const navigate = useNavigate();
  const [clienteId, setClienteId] = useState<string>("");
  const [clienteOpen, setClienteOpen] = useState(false);
  const [vendedor, setVendedor] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [descontoStr, setDescontoStr] = useState("");
  const [acrescimoStr, setAcrescimoStr] = useState("");
  const [items, setItems] = useState<ItemRow[]>([]);
  const [addProdutoId, setAddProdutoId] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | undefined>(ordemId);
  const [numero, setNumero] = useState<string>("");
  const [dataEmissao, setDataEmissao] = useState<string>(new Date().toISOString());
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfFilename, setPdfFilename] = useState<string>("orcamento.pdf");

  const { data: empresa } = useQuery({
    queryKey: ["empresa"],
    queryFn: async () => {
      const { data, error } = await supabase.from("empresas").select("*").maybeSingle();
      if (error) {
        console.error(error);
        toast.error("Erro ao carregar empresa", { description: error.message });
        return null;
      }
      return data as Empresa | null;
    },
  });
  const { data: clientes = [] } = useQuery({
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
  const { data: produtos = [] } = useQuery({
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

  useEffect(() => {
    if (!ordemId && empresa?.vendedor && !vendedor) setVendedor(empresa.vendedor);
  }, [empresa, ordemId, vendedor]);

  const { data: existing } = useQuery({
    queryKey: ["ordem", ordemId],
    enabled: !!ordemId,
    queryFn: async () => {
      const { data: ordem, error: ordemError } = await supabase
        .from("ordens_servico")
        .select("*")
        .eq("id", ordemId!)
        .maybeSingle();
      const { data: itens, error: itensError } = await supabase
        .from("ordem_servico_itens")
        .select("*")
        .eq("ordem_servico_id", ordemId!)
        .order("created_at");
      if (ordemError) {
        console.error(ordemError);
        toast.error("Erro ao carregar ordem", { description: ordemError.message });
      }
      if (itensError) {
        console.error(itensError);
        toast.error("Erro ao carregar itens", { description: itensError.message });
      }
      return { ordem, itens: itens ?? [] };
    },
  });

  useEffect(() => {
    if (!existing?.ordem) return;
    const o = existing.ordem;
    setClienteId(o.cliente_id ?? "");
    setVendedor(o.vendedor ?? "");
    setObservacoes(o.observacoes ?? "");
    setDescontoStr(o.desconto ? formatNumber(o.desconto) : "");
    setAcrescimoStr(o.acrescimo ? formatNumber(o.acrescimo) : "");
    setNumero(o.numero);
    setDataEmissao(o.data_emissao);
    setItems(
      existing.itens.map((it) => ({
        key: newKey(),
        produto_id: it.produto_id,
        codigo: safeText(it.codigo),
        descricao: safeText(it.descricao),
        unidade: safeText(it.unidade, "UN"),
        quantidade: Number(it.quantidade),
        valor_unitario: Number(it.valor_unitario),
      })),
    );
  }, [existing]);

  const desconto = parseNumber(descontoStr);
  const acrescimo = parseNumber(acrescimoStr);
  const subtotal = useMemo(
    () => items.reduce((s, it) => s + it.quantidade * it.valor_unitario, 0),
    [items],
  );
  const total = Math.max(0, subtotal - desconto + acrescimo);

  const addProduto = (id: string) => {
    const p = produtos.find((x) => x.id === id);
    if (!p) return;
    setItems((rows) => [
      ...rows,
      {
        key: newKey(),
        produto_id: p.id,
        codigo: safeText(p.codigo),
        descricao: safeText(p.descricao),
        unidade: safeText(p.unidade, "UN"),
        quantidade: 1,
        valor_unitario: Number(p.valor_unitario),
      },
    ]);
    setAddProdutoId("");
  };

  const updateItem = (key: string, patch: Partial<ItemRow>) =>
    setItems((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const removeItem = (key: string) => setItems((rows) => rows.filter((r) => r.key !== key));

  const cliente = clientes.find((c) => c.id === clienteId) ?? null;

  const persist = async (): Promise<{ id: string; numero: string } | null> => {
    if (!clienteId) {
      toast.error("Selecione um cliente");
      return null;
    }
    if (items.length === 0) {
      toast.error("Adicione ao menos um produto");
      return null;
    }

    const itensPayload = items.map((it) => ({
      produto_id: it.produto_id,
      codigo: it.codigo,
      descricao: it.descricao,
      unidade: it.unidade,
      quantidade: it.quantidade,
      valor_unitario: it.valor_unitario,
      valor_total: it.quantidade * it.valor_unitario,
    }));

    const { data, error } = await supabase
      .rpc("save_ordem_servico", {
        p_ordem_id: savedId ?? null,
        p_cliente_id: clienteId,
        p_cliente_nome: safeText(cliente?.nome),
        p_subtotal: subtotal,
        p_desconto: desconto,
        p_acrescimo: acrescimo,
        p_total: total,
        p_vendedor: safeText(vendedor),
        p_observacoes: safeText(observacoes),
        p_itens: itensPayload,
      })
      .single();

    if (error || !data) {
      toast.error("Erro ao salvar", { description: error?.message });
      return null;
    }

    setSavedId(data.id);
    setNumero(data.numero);
    return { id: data.id, numero: data.numero };
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await persist();
    setSaving(false);
    if (res) {
      toast.success(`Ordem ${res.numero} salva`);
      if (!ordemId) navigate({ to: "/ordens/$id", params: { id: res.id } });
    }
  };

  const buildPdfData = (num: string): { ordem: PdfOrdem; itens: PdfItem[] } => ({
    ordem: {
      numero: num,
      data_emissao: dataEmissao,
      subtotal,
      desconto,
      acrescimo,
      total,
      vendedor: vendedor || empresa?.vendedor || "",
      observacoes: observacoes || empresa?.observacao_padrao || "",
      cliente_nome: cliente?.nome ?? "",
    },
    itens: items.map((it) => ({
      codigo: it.codigo,
      descricao: it.descricao,
      unidade: it.unidade,
      quantidade: it.quantidade,
      valor_unitario: it.valor_unitario,
      valor_total: it.quantidade * it.valor_unitario,
    })),
  });

  const handlePdf = async (mode: "view" | "print") => {
    setSaving(true);
    try {
      const res = await persist();
      if (!res) return;
      const { ordem, itens } = buildPdfData(res.numero);
      if (mode === "view") {
        const url = getOrdemPdfUrl(empresa ?? null, cliente, ordem, itens);
        setPdfFilename(`${res.numero}.pdf`);
        setPdfUrl(url);
      } else {
        printOrdemPdf(empresa ?? null, cliente, ordem, itens);
      }
    } catch (error) {
      toast.error("Erro ao gerar PDF", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  const closePdf = (open: boolean) => {
    if (!open) {
      setPdfUrl(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/ordens" })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {numero ? `Ordem ${numero}` : "Nova Ordem de Serviço"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Selecione o cliente e adicione os produtos.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dados gerais</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <Popover open={clienteOpen} onOpenChange={setClienteOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={clienteOpen}
                  className="w-full justify-between font-normal"
                >
                  {cliente ? (
                    <span className="flex min-w-0 items-center gap-2">
                      <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{cliente.nome}</span>
                      {(cliente.cpf_cnpj || cliente.telefone) && (
                        <span className="truncate text-xs text-muted-foreground">
                          · {cliente.cpf_cnpj || cliente.telefone}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Selecione um cliente...</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command
                  filter={(value, search) => {
                    const c = clientes.find((x) => x.id === value);
                    if (!c) return 0;
                    const hay =
                      `${c.nome} ${c.cpf_cnpj} ${c.telefone} ${c.cidade} ${c.bairro}`.toLowerCase();
                    return hay.includes(search.toLowerCase()) ? 1 : 0;
                  }}
                >
                  <CommandInput placeholder="Buscar por nome, CPF/CNPJ, telefone..." />
                  <CommandList>
                    <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                    <CommandGroup>
                      {clientes.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={c.id}
                          onSelect={(v) => {
                            setClienteId(v);
                            setClienteOpen(false);
                          }}
                          className="flex items-start gap-2"
                        >
                          <Check
                            className={cn(
                              "mt-0.5 h-4 w-4",
                              clienteId === c.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{c.nome}</div>
                            {clienteSubtitle(c) && (
                              <div className="truncate text-xs text-muted-foreground">
                                {clienteSubtitle(c)}
                              </div>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {cliente && (
              <p className="text-xs text-muted-foreground">
                {clienteSubtitle(cliente) || "Sem dados adicionais cadastrados"}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Vendedor</Label>
            <Input
              value={vendedor}
              onChange={(e) => setVendedor(e.target.value)}
              placeholder="Nome do vendedor"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Produtos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[240px] flex-1 space-y-1.5">
              <Label>Adicionar produto</Label>
              <Select value={addProdutoId} onValueChange={addProduto}>
                <SelectTrigger>
                  <SelectValue placeholder="Buscar produto..." />
                </SelectTrigger>
                <SelectContent>
                  {produtos.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Nenhum produto cadastrado
                    </div>
                  )}
                  {(produtos as Produto[]).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.codigo} — {p.descricao} ({formatCurrency(p.valor_unitario)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Código</TableHead>
                  <TableHead className="min-w-[160px]">Descrição</TableHead>
                  <TableHead className="w-16">UN</TableHead>
                  <TableHead className="w-24">Qtde</TableHead>
                  <TableHead className="w-28">Valor Unit.</TableHead>
                  <TableHead className="w-28 text-right">Total</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">
                      Nenhum item adicionado. Selecione um produto acima.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((it) => (
                    <TableRow key={it.key}>
                      <TableCell className="font-mono text-xs">{it.codigo}</TableCell>
                      <TableCell>{it.descricao}</TableCell>
                      <TableCell className="text-muted-foreground">{it.unidade}</TableCell>
                      <TableCell>
                        <Input
                          className="h-8 w-20"
                          inputMode="decimal"
                          defaultValue={formatNumber(it.quantidade)}
                          onBlur={(e) =>
                            updateItem(it.key, { quantidade: parseNumber(e.target.value) })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          className="h-8 w-24"
                          inputMode="decimal"
                          defaultValue={formatNumber(it.valor_unitario)}
                          onBlur={(e) =>
                            updateItem(it.key, { valor_unitario: parseNumber(e.target.value) })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(it.quantidade * it.valor_unitario)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeItem(it.key)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={4}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações do orçamento..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Totais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label className="text-muted-foreground" htmlFor="desc">
                Desconto
              </Label>
              <Input
                id="desc"
                className="h-8 w-28 text-right"
                inputMode="decimal"
                placeholder="0,00"
                value={descontoStr}
                onChange={(e) => setDescontoStr(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label className="text-muted-foreground" htmlFor="acr">
                Acréscimo
              </Label>
              <Input
                id="acr"
                className="h-8 w-28 text-right"
                inputMode="decimal"
                placeholder="0,00"
                value={acrescimoStr}
                onChange={(e) => setAcrescimoStr(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between border-t pt-3 text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar
        </Button>
        <Button variant="secondary" onClick={() => handlePdf("view")} disabled={saving}>
          <FileText className="mr-2 h-4 w-4" />
          Visualizar PDF
        </Button>
        <Button onClick={() => handlePdf("print")} disabled={saving}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
      </div>

      <PdfPreviewDialog
        open={!!pdfUrl}
        onOpenChange={closePdf}
        url={pdfUrl}
        filename={pdfFilename}
      />
    </div>
  );
}
