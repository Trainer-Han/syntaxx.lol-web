/**
 * Public, build-time configuration.
 *
 * The Discord application id is not a secret — it is visible in every invite
 * link and was already in wrangler.jsonc, which is public in this repo. It
 * lives here rather than in an environment variable because a static build has
 * no server to read one from: VITE_DISCORD_CLIENT_ID was never set in CI, so
 * the invite button silently pointed at "YOUR_CLIENT_ID" and did nothing.
 *
 * The env var still wins if it is set, which keeps a fork working without an
 * edit here.
 */
// Verify before changing this. A wrong id does not fail loudly — Discord's
// authorize page just refuses, which is how "1358071643238563932" (from
// wrangler.jsonc, and an application that does not exist) shipped:
//
//     curl https://discord.com/api/v10/applications/<id>/rpc
//
// should return {"name":"syntaxx", ...}, not {"message":"Unknown Application"}.
export const DISCORD_CLIENT_ID =
  import.meta.env.VITE_DISCORD_CLIENT_ID ?? "1055141641679290378";

/** `permissions=8` is Administrator, which is what the bot's setup expects. */
export const INVITE_URL =
  `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}` +
  `&permissions=8&scope=bot%20applications.commands`;
