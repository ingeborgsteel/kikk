import { useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "./ui/button";
import { Modal } from "./ui/Modal";
import { Observation } from "../types/observation";
import {
  getUnexportedObservations,
  useExportObservations,
} from "../queries/useExports";

interface ExportDialogProps {
  observations: Observation[];
  onClose: () => void;
  isOpen: boolean;
}

function ExportDialog({ observations, onClose, isOpen }: ExportDialogProps) {
  const [exportType, setExportType] = useState<"all" | "new">("new");
  const { mutate: exportObservations, isPending: isExporting } =
    useExportObservations();

  const unexportedObservations = getUnexportedObservations(observations);
  const observationsToExport =
    exportType === "new" ? unexportedObservations : observations;

  const handleExport = () => {
    if (observationsToExport.length === 0) {
      alert("Ingen observasjoner å eksportere");
      return;
    }

    exportObservations(
      { observations: observationsToExport },
      {
        onSuccess: () => {
          alert(`${observationsToExport.length} observasjoner eksportert!`);
          onClose();
        },
        onError: (error) => {
          alert(`Feil ved eksport: ${error.message}`);
        },
      },
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Eksporter Observasjoner"
      icon={<FileSpreadsheet size={24} />}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-lg">
        {/* Export Options */}
        <div>
          <h3 className="text-lg font-semibold text-bark dark:text-sand mb-md">
            Velg hva som skal eksporteres
          </h3>
          <div className="space-y-sm">
            <label className="flex items-center gap-sm cursor-pointer p-md border-2 border-slate-border rounded-lg hover:bg-moss hover:bg-opacity-10">
              <input
                type="radio"
                name="exportType"
                value="new"
                checked={exportType === "new"}
                onChange={() => setExportType("new")}
                className="w-5 h-5"
              />
              <div className="flex-1">
                <div className="font-medium text-bark dark:text-sand">
                  Kun nye observasjoner
                </div>
                <div className="text-sm text-slate">
                  {unexportedObservations.length} observasjoner som ikke er
                  eksportert tidligere
                </div>
              </div>
            </label>
            <label className="flex items-center gap-sm cursor-pointer p-md border-2 border-slate-border rounded-lg hover:bg-moss hover:bg-opacity-10">
              <input
                type="radio"
                name="exportType"
                value="all"
                checked={exportType === "all"}
                onChange={() => setExportType("all")}
                className="w-5 h-5"
              />
              <div className="flex-1">
                <div className="font-medium text-bark dark:text-sand">
                  Alle observasjoner
                </div>
                <div className="text-sm text-slate">
                  {observations.length} observasjoner totalt
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Export Button */}
        <div>
          <Button
            onClick={handleExport}
            disabled={isExporting || observationsToExport.length === 0}
            className="w-full"
            size="lg"
          >
            <Download size={20} className="mr-2" />
            {isExporting
              ? "Eksporterer..."
              : `Eksporter ${observationsToExport.length} observasjoner`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ExportDialog;
