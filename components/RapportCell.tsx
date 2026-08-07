"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText } from "lucide-react";

interface RapportCellProps {
  texte: string | null;
  pdfUrl: string | null;
  pdfNom: string | null;
}

export function RapportCell({ texte, pdfUrl, pdfNom }: RapportCellProps) {
  if (!texte) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="cursor-pointer gap-1.5" />
        }
      >
        <FileText className="h-3.5 w-3.5" />
        Voir
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rapport de fin de journée</DialogTitle>
          <DialogDescription className="whitespace-pre-wrap text-foreground">{texte}</DialogDescription>
        </DialogHeader>
        {pdfUrl && (
          <DialogFooter>
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full cursor-pointer">
                Télécharger le PDF{pdfNom ? ` (${pdfNom})` : ""}
              </Button>
            </a>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
