import jsPDF from "jspdf";
import type { Empresa, Cliente } from "@/lib/db";
import { formatDateTime, formatNumber } from "@/lib/format";

export interface PdfItem {
  codigo: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

export interface PdfOrdem {
  numero: string;
  data_emissao: string;
  subtotal: number;
  desconto: number;
  acrescimo: number;
  total: number;
  vendedor: string;
  observacoes: string;
  cliente_nome: string;
}

const M = 6;
const PAGE_W = 210;
const PAGE_H = 297;
const INNER_W = PAGE_W - M * 2;
const BOTTOM_Y = 285;

const COLS = [
  { key: "codigo", label: "CÓDIGO", x: M, w: 16, align: "left" as const },
  { key: "descricao", label: "DESCRIÇÃO PRODUTO", x: M + 16, w: 96, align: "left" as const },
  { key: "unidade", label: "UN", x: M + 112, w: 8, align: "center" as const },
  { key: "quantidade", label: "QTDE", x: M + 120, w: 15, align: "right" as const },
  { key: "valor_unitario", label: "VALOR UNIT.", x: M + 135, w: 22, align: "right" as const },
  { key: "valor_total", label: "VALOR TOTAL", x: M + 157, w: 24, align: "right" as const },
  { key: "total_liq", label: "TOTAL LIQ.", x: M + 181, w: 17, align: "right" as const },
];

function fallback(value?: string | null) {
  return value?.trim() || "-";
}

function joinParts(parts: Array<string | null | undefined>, separator = " ") {
  return parts
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(separator);
}

function text(
  doc: jsPDF,
  value: string,
  x: number,
  y: number,
  options?: Parameters<jsPDF["text"]>[2],
) {
  doc.text(value, x, y, options);
}

function fittedText(
  doc: jsPDF,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  options?: Parameters<jsPDF["text"]>[2],
) {
  const originalSize = doc.getFontSize();
  let size = originalSize;
  while (doc.getTextWidth(value) > maxWidth && size > 6.5) {
    size -= 0.5;
    doc.setFontSize(size);
  }

  let output = value;
  while (doc.getTextWidth(output) > maxWidth && output.length > 1) {
    output = `${output.slice(0, -2)}…`;
  }

  text(doc, output, x, y, options);
  doc.setFontSize(originalSize);
}

function labelValue(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  valueMaxWidth?: number,
) {
  doc.setFont("helvetica", "bold");
  text(doc, label, x, y);
  const labelW = doc.getTextWidth(label);
  doc.setFont("helvetica", "normal");
  if (valueMaxWidth) {
    fittedText(doc, value, x + labelW + 1, y, valueMaxWidth);
  } else {
    text(doc, value, x + labelW + 1, y);
  }
}

function drawPageNumber(doc: jsPDF, pageNumber: number) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  text(doc, "Página:", PAGE_W - 36, PAGE_H - 10);
  text(doc, String(pageNumber), PAGE_W - 10, PAGE_H - 10, { align: "right" });
}

function drawHeader(doc: jsPDF, empresa: Empresa | null) {
  const top = 10;
  const headerH = 25;

  doc.setDrawColor(0);
  doc.setLineWidth(0.35);
  doc.rect(M, top, INNER_W, headerH);
  doc.line(M + 40, top, M + 40, top + headerH);

  if (empresa?.logo) {
    try {
      const fmt = empresa.logo.includes("image/png") ? "PNG" : "JPEG";
      doc.addImage(empresa.logo, fmt, M + 3, top + 1, 31, 23, undefined, "FAST");
    } catch {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      text(doc, "LOGO", M + 20, top + 14, { align: "center" });
    }
  }

  const titleX = M + 40;
  const titleW = INNER_W - 40;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  text(doc, "DOCUMENTO AUXILIAR DE VENDA - ORÇAMENTO", titleX + titleW / 2, top + 7, {
    align: "center",
  });
  doc.setFontSize(11);
  text(doc, "NÃO É DOCUMENTO FISCAL - NÃO É VALIDO COMO", titleX + titleW / 2, top + 13, {
    align: "center",
  });
  text(doc, "RECIBO E COMO GARANTIA DE MERCADORIA", titleX + titleW / 2, top + 18, {
    align: "center",
  });
  text(doc, "NÃO COMPROVA PAGAMENTO", titleX + titleW / 2, top + 24, { align: "center" });

  doc.rect(M, top + headerH, INNER_W, 7);
  doc.setFontSize(12);
  text(
    doc,
    fallback(empresa?.nome_fantasia || empresa?.razao_social).toUpperCase(),
    PAGE_W / 2,
    top + headerH + 5,
    { align: "center" },
  );
}

function drawEmpresaBlock(doc: jsPDF, empresa: Empresa | null) {
  const y = 42;
  doc.rect(M, y, INNER_W, 17);
  doc.setFontSize(10);
  const emitente = fallback(empresa?.razao_social || empresa?.nome_fantasia);
  const endereco = fallback(joinParts([empresa?.endereco, empresa?.numero, empresa?.bairro]));

  labelValue(doc, "Emitente:", emitente, M + 2, y + 5, 104);
  labelValue(doc, "IE:", fallback(empresa?.inscricao_estadual), M + 125, y + 5, 25);
  labelValue(doc, "CNPJ:", fallback(empresa?.cnpj), M + 160, y + 5, 28);
  labelValue(doc, "Endereço:", endereco, M + 2, y + 11, 116);
  labelValue(doc, "FONE:", fallback(empresa?.telefone || empresa?.whatsapp), M + 125, y + 11, 66);
}

function drawClienteBlock(doc: jsPDF, cliente: Cliente | null, ordem: PdfOrdem) {
  const y = 59;
  doc.rect(M, y, INNER_W, 26);
  doc.setFontSize(10);

  const clienteNome = fallback(cliente?.nome || ordem.cliente_nome);
  const endereco = fallback(joinParts([cliente?.endereco, cliente?.numero]));

  labelValue(doc, "Cliente:", clienteNome, M + 2, y + 5, 112);
  labelValue(doc, "Cód.:", cliente?.id ? cliente.id.slice(0, 8) : "-", M + 126, y + 5, 20);
  labelValue(doc, "CPF/CNPJ:", fallback(cliente?.cpf_cnpj), M + 148, y + 5, 42);

  labelValue(doc, "Endereço:", endereco, M + 2, y + 11, 102);
  labelValue(doc, "Fone:", fallback(cliente?.telefone), M + 126, y + 11, 42);
  doc.setFont("helvetica", "normal");
  text(doc, "/", M + 169, y + 11);

  labelValue(doc, "IE/RG:", fallback(cliente?.rg_ie), M + 2, y + 17, 38);
  labelValue(doc, "Cep:", "-", M + 52, y + 17, 22);
  labelValue(doc, "Bairro:", fallback(cliente?.bairro), M + 96, y + 17, 46);
  labelValue(doc, "N°.:", fallback(cliente?.numero), M + 167, y + 17, 22);

  labelValue(doc, "Nome Fantasia:", "-", M + 2, y + 23, 52);
  labelValue(doc, "Cidade:", fallback(cliente?.cidade), M + 109, y + 23, 45);
  labelValue(doc, "UF.:", fallback(cliente?.estado), M + 172, y + 23, 16);
}

function drawDocumentRow(doc: jsPDF, ordem: PdfOrdem) {
  const y = 85;
  doc.rect(M, y, INNER_W, 7);
  doc.setFontSize(8);
  labelValue(doc, "NR DO DOCUMENTO:", ordem.numero || "-", M + 2, y + 5, 28);
  labelValue(doc, "NR DO DOCUMENTO FISCAL:", "0", M + 69, y + 5, 20);
  labelValue(doc, "DATA EMISSÃO:", formatDateTime(ordem.data_emissao), M + 131, y + 5, 45);
}

function drawTableHeader(doc: jsPDF, y: number) {
  doc.rect(M, y, INNER_W, 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);

  COLS.forEach((col, index) => {
    if (index > 0) doc.line(col.x, y, col.x, y + 6);
    const tx =
      col.align === "right"
        ? col.x + col.w - 1
        : col.align === "center"
          ? col.x + col.w / 2
          : col.x + 1;
    fittedText(doc, col.label, tx, y + 4, col.w - 2, { align: col.align });
  });
}

function drawItemRow(doc: jsPDF, item: PdfItem, y: number, rowH: number) {
  doc.rect(M, y, INNER_W, rowH);
  COLS.forEach((col, index) => {
    if (index > 0) doc.line(col.x, y, col.x, y + rowH);
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const values = {
    codigo: item.codigo,
    descricao: item.descricao,
    unidade: item.unidade,
    quantidade: formatNumber(item.quantidade),
    valor_unitario: formatNumber(item.valor_unitario),
    valor_total: formatNumber(item.valor_total),
    total_liq: formatNumber(item.valor_total),
  };

  COLS.forEach((col) => {
    const raw = values[col.key as keyof typeof values] || "";
    const value = col.key === "descricao" ? doc.splitTextToSize(raw, col.w - 2)[0] : raw;
    const tx =
      col.align === "right"
        ? col.x + col.w - 1
        : col.align === "center"
          ? col.x + col.w / 2
          : col.x + 1;
    fittedText(doc, value, tx, y + 4.2, col.w - 2, { align: col.align });
  });
}

function drawTotals(doc: jsPDF, ordem: PdfOrdem, y: number) {
  doc.line(M, y, M + INNER_W, y);
  doc.line(M, y + 8, M + INNER_W, y + 8);
  doc.setFontSize(9);

  doc.setFont("helvetica", "bold");
  text(doc, "SUB-TOTAL:", M + 2, y + 5);
  doc.setFont("helvetica", "normal");
  text(doc, formatNumber(ordem.subtotal), M + 23, y + 5);

  doc.setTextColor(255, 0, 0);
  doc.setFont("helvetica", "bold");
  text(doc, "DESCONTO:", M + 56, y + 5);
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  text(doc, formatNumber(ordem.desconto), M + 76, y + 5);

  doc.setTextColor(0, 0, 255);
  doc.setFont("helvetica", "bold");
  text(doc, "ACRESCIMO:", M + 102, y + 5);
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  text(doc, formatNumber(ordem.acrescimo), M + 123, y + 5);

  doc.setFont("helvetica", "bold");
  text(doc, "VLR TOTAL:", M + 145, y + 5);
  doc.setFont("helvetica", "normal");
  text(doc, formatNumber(ordem.total), M + 165, y + 5);
}

function drawFooter(doc: jsPDF, empresa: Empresa | null, ordem: PdfOrdem, y: number) {
  doc.setDrawColor(0);
  doc.line(M + 1, y + 10, M + 86, y + 10);
  doc.line(M + 112, y + 10, M + INNER_W - 3, y + 10);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  text(doc, "Vendedor:", M + 15, y + 15);
  doc.setFont("helvetica", "normal");
  text(doc, ordem.vendedor || empresa?.vendedor || "-", M + 35, y + 15);

  doc.setFont("helvetica", "bold");
  text(doc, "ASS. CLIENTE", M + 154, y + 15, { align: "center" });

  text(doc, "Cliente Caixa..:", M + 3, y + 25);
  text(doc, "Referencia......:", M + 3, y + 31);
  text(doc, "Observação....:", M + 3, y + 37);
  text(doc, "Pagto Negociado..:", M + 105, y + 25);

  const obs = ordem.observacoes || empresa?.observacao_padrao || "";
  if (obs) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    text(doc, doc.splitTextToSize(obs, 96), M + 33, y + 37);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  text(doc, "E VEDADA A AUTENTICAÇÃO DESTE DOCUMENTO", PAGE_W / 2, y + 53, {
    align: "center",
  });
}

function drawStaticBlocks(
  doc: jsPDF,
  empresa: Empresa | null,
  cliente: Cliente | null,
  ordem: PdfOrdem,
) {
  drawHeader(doc, empresa);
  drawEmpresaBlock(doc, empresa);
  drawClienteBlock(doc, cliente, ordem);
  drawDocumentRow(doc, ordem);
  drawTableHeader(doc, 92);
}

export function buildOrdemPdf(
  empresa: Empresa | null,
  cliente: Cliente | null,
  ordem: PdfOrdem,
  itens: PdfItem[],
): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  let pageNumber = 1;

  drawStaticBlocks(doc, empresa, cliente, ordem);

  let y = 98;
  const rowH = 5.5;
  const footerSpace = 74;
  const maxItemsY = BOTTOM_Y - footerSpace;

  itens.forEach((item) => {
    if (y + rowH > maxItemsY) {
      drawPageNumber(doc, pageNumber);
      doc.addPage();
      pageNumber += 1;
      drawStaticBlocks(doc, empresa, cliente, ordem);
      y = 98;
    }
    drawItemRow(doc, item, y, rowH);
    y += rowH;
  });

  if (itens.length === 0) {
    drawItemRow(
      doc,
      {
        codigo: "",
        descricao: "Nenhum item informado",
        unidade: "",
        quantidade: 0,
        valor_unitario: 0,
        valor_total: 0,
      },
      y,
      rowH,
    );
    y += rowH;
  }

  y += 5;
  drawTotals(doc, ordem, y);
  drawFooter(doc, empresa, ordem, y + 8);
  drawPageNumber(doc, pageNumber);

  return doc;
}

export function getOrdemPdfUrl(
  empresa: Empresa | null,
  cliente: Cliente | null,
  ordem: PdfOrdem,
  itens: PdfItem[],
): string {
  const doc = buildOrdemPdf(empresa, cliente, ordem, itens);
  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
}

export function printOrdemPdf(
  empresa: Empresa | null,
  cliente: Cliente | null,
  ordem: PdfOrdem,
  itens: PdfItem[],
) {
  const doc = buildOrdemPdf(empresa, cliente, ordem, itens);
  doc.autoPrint();
  const url = String(doc.output("bloburl"));
  const win = window.open(url, "_blank");
  if (!win) doc.save(`${ordem.numero || "orcamento"}.pdf`);
}
