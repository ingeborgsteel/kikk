import { Hono } from "hono";

// Type definitions for bindings
interface Bindings {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  RESEND_API_KEY: string;
  BACKUP_EMAIL_FROM: string;
}

// User type from Supabase Auth
interface User {
  id: string;
  email: string;
}

const app = new Hono<{ Bindings: Bindings }>();

// Observation type (subset needed for export)
interface Species {
  species: {
    PrefferedPopularname: string;
  };
  count?: number;
  gender?: string;
  age?: string;
  method?: string;
  activity?: string;
  comment?: string;
}

interface Observation {
  id: string;
  location: { lat: number; lng: number };
  locationName?: string;
  uncertaintyRadius: number;
  species: Species[];
  startDate: string;
  endDate?: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch users with email from Supabase Auth
 */
async function fetchUsersWithEmail(
  supabaseUrl: string,
  supabaseKey: string,
): Promise<User[]> {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    headers: {
      Authorization: `Bearer ${supabaseKey}`,
      apikey: supabaseKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Supabase auth error: ${response.status} ${await response.text()}`,
    );
  }

  const data = (await response.json()) as {
    users: Array<{ id: string; email: string }>;
  };
  return data.users.filter((user) => user.email);
}

/**
 * Fetch observations from Supabase created since a given date, optionally filtered by userId
 */
async function fetchObservationsSince(
  supabaseUrl: string,
  supabaseKey: string,
  sinceDate: Date,
  userId?: string,
): Promise<Observation[]> {
  const sinceIso = sinceDate.toISOString();

  // Build query URL
  let url = `${supabaseUrl}/rest/v1/observations?select=*,species(*)&createdAt=gte.${sinceIso}`;
  if (userId) {
    url += `&userId=eq.${userId}`;
  }
  url += "&order=createdAt.desc";

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${supabaseKey}`,
      apikey: supabaseKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Supabase error: ${response.status} ${await response.text()}`,
    );
  }

  return response.json();
}

/**
 * Generate CSV content from observations (lightweight for email)
 */
function generateCSVFromObservations(observations: Observation[]): string {
  const headers = [
    "Lokalitet",
    "Latitude",
    "Longitude",
    "Usikkerhet (m)",
    "Start",
    "Slutt",
    "Art",
    "Antall",
    "Kjønn",
    "Alder",
    "Metode",
    "Aktivitet",
    "Kommentar",
  ];

  const rows: string[] = [headers.join(",")];

  observations.forEach((obs) => {
    const baseRow = [
      escapeCsv(obs.locationName || ""),
      obs.location.lat,
      obs.location.lng,
      obs.uncertaintyRadius,
      escapeCsv(
        obs.startDate ? new Date(obs.startDate).toLocaleString("no-NO") : "",
      ),
      escapeCsv(
        obs.endDate ? new Date(obs.endDate).toLocaleString("no-NO") : "",
      ),
    ];

    if (obs.species.length === 0) {
      rows.push(
        [...baseRow, "", "", "", "", "", escapeCsv(obs.comment || "")].join(
          ",",
        ),
      );
    } else {
      obs.species.forEach((spec) => {
        rows.push(
          [
            ...baseRow,
            escapeCsv(spec.species.PrefferedPopularname),
            spec.count ?? "",
            escapeCsv(spec.gender || ""),
            escapeCsv(spec.age || ""),
            escapeCsv(spec.method || ""),
            escapeCsv(spec.activity || ""),
            escapeCsv(spec.comment || ""),
          ].join(","),
        );
      });
    }
  });

  return rows.join("\n");
}

function escapeCsv(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Send email with CSV attachment via Resend
 */
async function sendBackupEmail(
  resendApiKey: string,
  to: string,
  from: string,
  subject: string,
  csvContent: string,
  fileName: string,
): Promise<void> {
  // Create multipart form data for email with attachment
  const boundary = "----FormBoundary" + Math.random().toString(36).substring(2);

  const bodyParts = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="from"`,
    "",
    from,
    `--${boundary}`,
    `Content-Disposition: form-data; name="to"`,
    "",
    to,
    `--${boundary}`,
    `Content-Disposition: form-data; name="subject"`,
    "",
    subject,
    `--${boundary}`,
    `Content-Disposition: form-data; name="text"`,
    "",
    `Hei!\n\nHer er din daglige backup av observasjoner fra Kikk.\n\nVedlagt finner du en CSV-fil med observasjoner du har registrert de siste 24 timene.\n\nDette er en automatisk sikkerhetskopi - observasjonene er fortsatt trygt lagret i Kikk.`,
    `--${boundary}`,
    `Content-Disposition: form-data; name="attachment"; filename="${fileName}"`,
    "Content-Type: text/csv",
    "",
    csvContent,
    `--${boundary}--`,
  ];

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body: bodyParts.join("\r\n"),
  });

  if (!response.ok) {
    throw new Error(
      `Resend error: ${response.status} ${await response.text()}`,
    );
  }
}

/**
 * API endpoint to manually trigger email export
 */
app.post("/api/export/email", async (c) => {
  const { supabaseUrl, supabaseKey, resendKey, to, from, since } =
    await c.req.json<{
      supabaseUrl: string;
      supabaseKey: string;
      resendKey: string;
      to: string;
      from: string;
      since?: string; // ISO date string, defaults to 24h ago
    }>();

  try {
    const sinceDate = since
      ? new Date(since)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const observations = await fetchObservationsSince(
      supabaseUrl,
      supabaseKey,
      sinceDate,
    );

    if (observations.length === 0) {
      return c.json({
        success: true,
        message: "Ingen nye observasjoner å eksportere",
        count: 0,
      });
    }

    const csv = generateCSVFromObservations(observations);
    const fileName = `kikk-observasjoner-${new Date().toISOString().split("T")[0]}.csv`;
    const subject = `Kikk observasjoner - ${observations.length} nye`;

    await sendBackupEmail(resendKey, to, from, subject, csv, fileName);

    return c.json({
      success: true,
      message: `Epost sendt med ${observations.length} observasjoner`,
      count: observations.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.json({ success: false, error: message }, 500);
  }
});

// Health check endpoint
app.get("/api/", (c) => c.json({ name: "Kikk Worker", version: "1.0.0" }));

// Export the Hono app as default
export default {
  async fetch(
    request: Request,
    env: Bindings,
    ctx: ExecutionContext,
  ): Promise<Response> {
    return app.fetch(request, env, ctx);
  },

  /**
   * Scheduled handler for daily backup email
   * Runs via Cloudflare Cron Triggers
   * Sends individual emails to each user with their own observations
   */
  async scheduled(
    _event: ScheduledEvent,
    env: Bindings,
    _ctx: ExecutionContext,
  ): Promise<void> {
    // Only run if email is configured
    if (!env.RESEND_API_KEY || !env.BACKUP_EMAIL_FROM) {
      console.log("Backup email not configured, skipping");
      return;
    }

    try {
      // Get all users with email addresses
      const users = await fetchUsersWithEmail(
        env.SUPABASE_URL,
        env.SUPABASE_SERVICE_KEY,
      );

      if (users.length === 0) {
        console.log("No users found, skipping backup emails");
        return;
      }

      console.log(`Found ${users.length} users to check for backup`);

      // Get yesterday's date (24h window)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const fileNameDate = new Date().toISOString().split("T")[0];

      // Send individual backup to each user
      let emailsSent = 0;
      for (const user of users) {
        try {
          // Fetch only this user's observations since yesterday
          const observations = await fetchObservationsSince(
            env.SUPABASE_URL,
            env.SUPABASE_SERVICE_KEY,
            yesterday,
            user.id,
          );

          // Skip if user has no new observations
          if (observations.length === 0) {
            console.log(`No new observations for user ${user.email}, skipping`);
            continue;
          }

          // Generate CSV for this user's observations
          const csv = generateCSVFromObservations(observations);
          const fileName = `kikk-observasjoner-${fileNameDate}.csv`;
          const subject = `Dine Kikk observasjoner - ${observations.length} nye`;

          // Send email to this user
          await sendBackupEmail(
            env.RESEND_API_KEY,
            user.email,
            env.BACKUP_EMAIL_FROM,
            subject,
            csv,
            fileName,
          );

          console.log(
            `Backup email sent to ${user.email} with ${observations.length} observations`,
          );
          emailsSent++;
        } catch (userError) {
          const message =
            userError instanceof Error ? userError.message : "Unknown error";
          console.error(`Failed to send backup to ${user.email}:`, message);
          // Continue to next user even if one fails
        }
      }

      console.log(
        `Backup complete. Sent ${emailsSent} emails to ${users.length} users`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to process backup emails:", message);
      throw error;
    }
  },
};
