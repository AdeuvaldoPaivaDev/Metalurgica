import { useEffect } from "react";
import { Download, Printer, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string | null;
  filename: string;
}

export function PdfPreviewDialog({ open, onOpenChange, url, filename }: Props) {
  // Revoke blob URL when dialog actually closes (not just hidden).
  useEffect(() => {
    return () => {
      if (url) setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
  }, [url]);

  const handlePrint = () => {
    if (!url) return;
    const w = window.open(url, "_blank");
    if (w) w.addEventListener("load", () => w.print());
  };

  const handleDownload = () => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        className="max-w-5xl p-0 sm:max-w-5xl h-[90vh] flex flex-col gap-0"
      >
        <DialogHeader className="flex flex-row items-center justify-between border-b px-4 py-3 space-y-0">
          <DialogTitle className="text-base">Visualização do orçamento</DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" /> Baixar
            </Button>
            <Button size="sm" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 bg-muted">
          {url && <iframe src={url} title="PDF" className="h-full w-full border-0" />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
