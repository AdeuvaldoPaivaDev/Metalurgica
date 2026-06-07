import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, Save, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase, type Empresa } from "@/lib/db";
import { safeText } from "@/lib/safe-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_app/configuracoes")({
  component: ConfiguracoesPage,
});

type Form = Partial<Empresa>;

const FIELDS: { key: keyof Empresa; label: string; full?: boolean }[] = [
  { key: "nome_fantasia", label: "Nome fantasia", full: true },
  { key: "razao_social", label: "Razão social", full: true },
  { key: "cnpj", label: "CNPJ" },
  { key: "inscricao_estadual", label: "Inscrição estadual" },
  { key: "telefone", label: "Telefone" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "endereco", label: "Endereço" },
  { key: "numero", label: "Número" },
  { key: "bairro", label: "Bairro" },
  { key: "cep", label: "CEP" },
  { key: "cidade", label: "Cidade" },
  { key: "estado", label: "Estado (UF)" },
  { key: "vendedor", label: "Vendedor padrão" },
];

function ConfiguracoesPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Form>({});
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["empresa"],
    queryFn: async () => {
      const { data, error } = await supabase.from("empresas").select("*").maybeSingle();
      if (error) {
        console.error(error);
        toast.error("Erro ao carregar empresa", { description: error.message });
        return null;
      }
      return data;
    },
  });

  useEffect(() => {
    if (data) {
      setForm({
        ...data,
        nome_fantasia: safeText(data.nome_fantasia),
        razao_social: safeText(data.razao_social),
        cnpj: safeText(data.cnpj),
        inscricao_estadual: safeText(data.inscricao_estadual),
        telefone: safeText(data.telefone),
        whatsapp: safeText(data.whatsapp),
        endereco: safeText(data.endereco),
        numero: safeText(data.numero),
        bairro: safeText(data.bairro),
        cidade: safeText(data.cidade),
        estado: safeText(data.estado),
        cep: safeText(data.cep),
        logo: safeText(data.logo),
        observacao_padrao: safeText(data.observacao_padrao),
        vendedor: safeText(data.vendedor),
      });
    }
  }, [data]);

  const set = (key: keyof Empresa, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast.error("Logo muito grande", { description: "Escolha uma imagem de até 1 MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set("logo", reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      nome_fantasia: form.nome_fantasia ?? "",
      razao_social: form.razao_social ?? "",
      cnpj: form.cnpj ?? "",
      inscricao_estadual: form.inscricao_estadual ?? "",
      telefone: form.telefone ?? "",
      whatsapp: form.whatsapp ?? "",
      endereco: form.endereco ?? "",
      numero: form.numero ?? "",
      bairro: form.bairro ?? "",
      cidade: form.cidade ?? "",
      estado: form.estado ?? "",
      cep: form.cep ?? "",
      logo: form.logo ?? "",
      observacao_padrao: form.observacao_padrao ?? "",
      vendedor: form.vendedor ?? "",
    };
    try {
      const { error } = data?.id
        ? await supabase.from("empresas").update(payload).eq("id", data.id)
        : await supabase.from("empresas").insert(payload);
      if (error) {
        toast.error("Erro ao salvar", { description: error.message });
        return;
      }
      toast.success("Dados da empresa salvos");
      await qc.invalidateQueries({ queryKey: ["empresa"] });
    } catch (error) {
      toast.error("Erro ao salvar", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações da Empresa</h1>
        <p className="text-sm text-muted-foreground">
          Estes dados aparecem automaticamente em todos os documentos gerados.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border bg-muted">
              {form.logo ? (
                <img src={form.logo} alt="Logo da empresa" className="h-full w-full object-contain" />
              ) : (
                <span className="text-xs text-muted-foreground">Sem logo</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> Enviar logo
              </Button>
              {form.logo && (
                <Button type="button" variant="ghost" size="sm" onClick={() => set("logo", "")}>
                  <Trash2 className="mr-2 h-4 w-4" /> Remover
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados cadastrais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.key} className={`space-y-1.5 ${f.full ? "sm:col-span-2" : ""}`}>
                <Label htmlFor={f.key}>{f.label}</Label>
                <Input
                  id={f.key}
                  value={(form[f.key] as string) ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              </div>
            ))}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="observacao_padrao">Observação padrão</Label>
              <Textarea
                id="observacao_padrao"
                rows={3}
                value={form.observacao_padrao ?? ""}
                onChange={(e) => set("observacao_padrao", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar
        </Button>
      </div>
    </div>
  );
}
