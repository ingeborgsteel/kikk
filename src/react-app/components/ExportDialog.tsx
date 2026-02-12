import { useState } from "react";
import { Download, FileSpreadsheet, History } from "lucide-react";
import { Button } from "./ui/button";
import { Modal } from "./ui/Modal";
import { Observation } from "../types/observation";
import {
  getUnexportedObservations,
  useDownloadExport,
  useExportLogs,
  useExportObservations,
} from "../queries/useExports";
import { isSupabaseConfigured } from "../lib/supabase";

interface ExportDialogProps {
  observations: Observation[];
  onClose: () => void;
  isOpen: boolean;
}

function ExportDialog({ observations, onClose, isOpen }: ExportDialogProps) {
  const [exportType, setExportType] = useState<"all" | "new">("new");
  const { mutate: exportObservations, isPending: isExporting } =
    useExportObservations();
  const { data: exportLogs = [], isLoading: isLoadingLogs } = useExportLogs();
  const { mutate: downloadExport, isPending: isDownloading } =
    useDownloadExport();
  const supabaseConfigured = isSupabaseConfigured();

  const unexportedObservations = getUnexportedObservations(observations);
  const observationsToExport =
    exportType === "new" ? unexportedObservations : observations;

  const handleExport = () => {
    if (observationsToExport.length === 0) {
      alert("Ingen observasjoner å eksportere");
      return;
    }

    exportObservations(
      { observations: observationsToExport, saveToStorage: supabaseConfigured },
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

  const handleDownloadPrevious = (filePath: string, fileName: string) => {
    downloadExport(
      { filePath, fileName },
      {
        onSuccess: () => {
          alert("Tidligere eksport lastet ned!");
        },
        onError: (error) => {
          alert(`Feil ved nedlasting: ${error.message}`);
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

        {/* Previous Exports */}
        {supabaseConfigured && (
          <div>
            <h3 className="text-lg font-semibold text-bark dark:text-sand mb-md flex items-center gap-sm">
              <History size={20} />
              Tidligere Eksporter
            </h3>
            {isLoadingLogs ? (
              <p className="text-sm text-slate">Laster...</p>
            ) : exportLogs.length === 0 ? (
              <p className="text-sm text-slate">Ingen tidligere eksporter</p>
            ) : (
              <div className="space-y-sm max-h-60 overflow-y-auto">
                {exportLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-md border-2 border-slate-border rounded-lg flex justify-between items-center bg-white dark:bg-bark"
                  >
                    <div>
                      <div className="font-medium text-bark dark:text-sand">
                        {log.fileName}
                      </div>
                      <div className="text-sm text-slate">
                        {new Date(log.createdAt).toLocaleString("no-NO")} •{" "}
                        {log.observationIds.length} observasjoner
                      </div>
                    </div>
                    {log.filePath && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDownloadPrevious(log.filePath!, log.fileName)
                        }
                        disabled={isDownloading}
                      >
                        <Download size={16} className="mr-1" />
                        Last ned
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!supabaseConfigured && (
          <div className="p-md bg-moss bg-opacity-20 rounded-lg text-sm text-bark dark:text-sand">
            <p className="font-medium mb-1">Merk:</p>
            <p>
              Supabase er ikke konfigurert. Eksporter vil kun lastes ned lokalt
              og vil ikke bli lagret eller logget.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default ExportDialog;
