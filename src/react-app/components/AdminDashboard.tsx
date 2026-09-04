import { Shield, Eye, KeyRound, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  useAdminUsers,
  useImpersonateUser,
  useSendAdminPasswordReset,
} from "../queries/useAdmin";
import { Button } from "./ui/button";
import Header from "./Header";

interface AdminDashboardProps {
  onBack: () => void;
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("no-NO");
}

export function AdminDashboard({ onBack }: AdminDashboardProps) {
  const { isAdmin, user } = useAuth();
  const { data: users, isPending, error } = useAdminUsers();
  const reset = useSendAdminPasswordReset();
  const impersonate = useImpersonateUser();

  if (!isAdmin) {
    return (
      <div className="w-full min-h-screen bg-sand dark:bg-bark pb-16 md:pb-0">
        <Header title="admin" />
        <div className="max-w-4xl mx-auto p-lg md:p-xl">
          <p className="text-bark dark:text-sand">
            Du har ikke tilgang til denne siden.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-sand dark:bg-bark pb-16 md:pb-0">
      <Header title="admin" />

      <div className="max-w-4xl mx-auto p-lg md:p-xl space-y-lg">
        <div className="hidden md:block">
          <Button onClick={onBack} variant="outline">
            ← Tilbake til kart
          </Button>
        </div>

        <div className="bg-white dark:bg-[#2c2c2c] rounded-lg border-2 border-moss/30 p-md">
          <h2 className="text-lg font-bold text-bark dark:text-sand mb-md flex items-center gap-sm">
            <Shield size={20} className="text-moss" />
            Brukere
          </h2>

          {isPending && (
            <div className="flex items-center gap-sm text-bark/70 dark:text-sand/70">
              <Loader2 size={20} className="animate-spin" />
              Laster brukere...
            </div>
          )}

          {error && (
            <p className="text-bark dark:text-sand">
              Kunne ikke laste brukere: {error.message}
            </p>
          )}

          {users && users.length === 0 && (
            <p className="text-bark/70 dark:text-sand/70">
              Ingen brukere funnet.
            </p>
          )}

          {users && users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-moss/30 text-bark/70 dark:text-sand/70">
                    <th className="py-2 pr-4">Navn</th>
                    <th className="py-2 pr-4">E-post</th>
                    <th className="py-2 pr-4">Rolle</th>
                    <th className="py-2 pr-4 text-right">Obs.</th>
                    <th className="py-2 pr-4 text-right">Arter</th>
                    <th className="py-2 pr-4 text-right">Individer</th>
                    <th className="py-2 pr-4">Siste obs.</th>
                    <th className="py-2">Handlinger</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-moss/10 last:border-0"
                    >
                      <td className="py-3 pr-4 text-bark dark:text-sand font-medium">
                        {u.name}
                        {u.id === user?.id && (
                          <span className="ml-2 text-xs text-moss">(deg)</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-bark dark:text-sand">
                        {u.email}
                      </td>
                      <td className="py-3 pr-4 text-bark dark:text-sand capitalize">
                        {u.role ?? "user"}
                      </td>
                      <td className="py-3 pr-4 text-right text-bark dark:text-sand">
                        {u.observationCount}
                      </td>
                      <td className="py-3 pr-4 text-right text-bark dark:text-sand">
                        {u.speciesCount}
                      </td>
                      <td className="py-3 pr-4 text-right text-bark dark:text-sand">
                        {u.individualCount}
                      </td>
                      <td className="py-3 pr-4 text-bark dark:text-sand">
                        {formatDate(u.lastObservationAt)}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => reset.mutate(u.id)}
                            disabled={reset.isPending}
                            variant="outline"
                            size="sm"
                            title="Send tilbakestillingslenke"
                          >
                            <KeyRound size={16} />
                          </Button>
                          <Button
                            onClick={() => impersonate.mutate(u.id)}
                            disabled={impersonate.isPending}
                            variant="secondary"
                            size="sm"
                            title="Se som denne brukeren"
                          >
                            <Eye size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reset.isSuccess && (
            <p className="mt-md text-sm text-moss">
              Tilbakestillingslenke sendt.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
