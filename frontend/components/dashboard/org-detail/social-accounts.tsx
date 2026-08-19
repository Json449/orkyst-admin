import { DASH } from "../theme";
import type { OrgDetail } from "./detail-data";

export function SocialAccounts({ detail }: { detail: OrgDetail }) {
  const connected = detail.socials.filter((account) => account.connected).length;

  return (
    <div
      className="flex h-full flex-col rounded-2xl border bg-white"
      style={{ borderColor: DASH.border }}
    >
      <div className="flex items-center justify-between gap-4 px-6 py-5">
        <h2 className="text-[18px] font-bold" style={{ color: DASH.heading }}>
          Social Accounts
        </h2>
        <span className="shrink-0 text-[15px]" style={{ color: DASH.muted }}>
          {connected} of {detail.socials.length}
        </span>
      </div>

      <ul className="border-t" style={{ borderColor: DASH.border }}>
        {detail.socials.map((account) => (
          <li
            key={account.name}
            className="flex items-center justify-between gap-4 border-b px-6 py-4 last:border-b-0"
            style={{ borderColor: DASH.border }}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: account.color }}
              />
              <span
                className="truncate text-[16px] font-bold"
                style={{ color: account.connected ? DASH.heading : DASH.subtle }}
              >
                {account.name}
              </span>
            </span>

            {account.connected ? (
              <span
                className="flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-semibold"
                style={{ backgroundColor: DASH.greenBg, color: DASH.green }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                Connected
              </span>
            ) : (
              <span
                className="shrink-0 rounded-full px-3 py-1.5 text-[13px] font-semibold"
                style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}
              >
                Not connected
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
