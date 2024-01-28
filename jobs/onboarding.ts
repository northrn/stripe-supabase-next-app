import { client } from "@/trigger";
import { Database } from "@/supabase-types";
import { SupabaseManagement } from "@trigger.dev/supabase";
import { Resend } from "@trigger.dev/resend";

// Use OAuth to authenticate with Supabase Management API
const supabaseManagement = new SupabaseManagement({
  id: "supabase-management",
});

const supabaseTriggers = supabaseManagement.db<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!
);

const resend = new Resend({
  id: "resend",
  apiKey: process.env.RESEND_API_KEY!,
});

client.defineJob({
  id: "welcome-email-campaign",
  name: "Welcome Email Campaign",
  version: "1.0.0",
  trigger: supabaseTriggers.onUpdated({
    // Trigger this job whenever a user is confirmed
    schema: "auth",
    table: "users",
    filter: {
      old_record: {
        email_confirmed_at: [{ $isNull: true }],
      },
      record: {
        email_confirmed_at: [{ $isNull: false }],
      },
    },
  }),
  integrations: {
    resend,
  },
  run: async (payload, io, ctx) => {
    if (!payload.record.email) {
      return;
    }

    const isTestOrDev =
      ctx.run.isTest || ctx.environment.type === "DEVELOPMENT";

    // Only wait for 10 seconds when running in as a test or in the development environment
    await io.wait("wait-1", isTestOrDev ? 10 : 60 * 60); // 1 hour

    const email1 = await io.resend.emails.send("email-1", {
      to: payload.record.email,
      subject: `Thanks for joining Acme Inc`,
      text: `Hi there, welcome to our community! This is the first email we send you to help you get started.`,
      from: process.env.RESEND_FROM_EMAIL!,
    });

    await io.wait("wait-2", isTestOrDev ? 10 : 60 * 60 * 12); // 12 hours

    const email2 = await io.resend.emails.send("email-2", {
      to: payload.record.email,
      subject: `Here are some tips to get started`,
      text: `Hi there, welcome to our community! This is the second email we send you to help you get started.`,
      from: process.env.RESEND_FROM_EMAIL!,
    });

    await io.wait("wait-3", isTestOrDev ? 10 : 60 * 60 * 24); // 24 hours

    const email3 = await io.resend.emails.send("email-3", {
      to: payload.record.email,
      subject: "Do you have any questions?",
      text: `Hi there, welcome to our community! This is the third email we send you to help you get started.`,
      from: process.env.RESEND_FROM_EMAIL!,
    });

    return {
      email1,
      email2,
      email3,
    };
  },
});