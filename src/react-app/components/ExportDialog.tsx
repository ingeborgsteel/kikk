import { useState } from "react";
import { Download, FileSpreadsheet, History } from "lucide-react";
import { Button } from "./ui/button";
import { Modal } from "./ui/Modal";
import { Observation } from "../types/observation";
import {
  getUnexportedObservations,
  useDownloadExport,
  useEmailExport,
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
  const [emailExport, setEmailExport] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const { mutate: exportObservations, isPending: isExporting } =
    useExportObservations();
  const { mutate: emailExportObservations, isPending: isEmailing } =
    useEmailExport();
  const { data: exportLogs = [], isLoading: isLoadingLogs } = useExportLogs();
  const { mutate: downloadExport, isPending: isDownloading } =
    useDownloadExport();
  const supabaseConfigured = isSupabaseConfigured();

  const unexportedObservations = getUnexportedObservations(observations);
  const observationsToExport =
    exportType === "new" ? unexportedObservations : observations;

  const isProcessing = isExporting || isEmailing;

  const handleExport = () => {
    if (observationsToExport.length === 0) {
      alert("Ingen observasjoner å eksportere");
      return;
    }

    // Validate email if email export is enabled
    if (emailExport && !emailAddress) {
      alert("Vennligst oppgi en e-postadresse");
      return;
    }

    // Perform regular export
    exportObservations(
      { observations: observationsToExport, saveToStorage: supabaseConfigured },
      {
        onSuccess: () => {
          // If email export is enabled, also send via email
          if (emailExport) {
            const workerUrl =
              import.meta.env.VITE_WORKER_URL || window.location.origin;
            const resendKey = import.meta.env.VITE_RESEND_API_KEY || "";
            const fromEmail =
              import.meta.env.VITE_EXPORT_EMAIL_FROM || "kikk@example.com";

            if (!resendKey) {
              alert("E-post eksport er konfigurert, men API-nøkkel mangler");
              onClose();
              return;
            }

            emailExportObservations(
              {
                observations: observationsToExport,
                toEmail: emailAddress,
                fromEmail,
                workerUrl,
                resendApiKey: resendKey,
              },
              {
                onSuccess: (result) => {
                  alert(
                    `${observationsToExport.length} observasjoner eksportert!\n\n${result.message}`,
                  );
                  onClose();
                },
                onError: (error) => {
                  alert(`Fil eksportert, men e-post feilet: ${error.message}`);
                  onClose();
                },
              },
            );
          } else {
            alert(`${observationsToExport.length} observasjoner eksportert!`);
            onClose();
          }
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

        {/* Email Export Option */}
        <div className="border-t-2 border-slate-border pt-lg">
          <label className="flex items-start gap-sm cursor-pointer">
            <input
              type="checkbox"
              checked={emailExport}
              onChange={(e) => setEmailExport(e.target.checked)}
              className="w-5 h-5 mt-0.5"
            />
            <div className="flex-1">
              <div className="font-medium text-bark dark:text-sand flex items-center gap-sm">
                <Mail size={18} />
                Send også på e-post
              </div>
              <div className="text-sm text-slate">
                Får en kopi på e-post i tillegg til nedlasting
              </div>
            </div>
          </label>

          {emailExport && (
            <div className="mt-md pl-7">
              <Input
                type="email"
                placeholder="din@epost.no"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Export Button */}
        <div>
          <Button
            onClick={handleExport}
            disabled={isProcessing || observationsToExport.length === 0}
            className="w-full"
            size="lg"
          >
            <Download size={20} className="mr-2" />
            {isProcessing
              ? emailExport
                ? "Eksporterer og sender e-post..."
                : "Eksporterer..."
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
