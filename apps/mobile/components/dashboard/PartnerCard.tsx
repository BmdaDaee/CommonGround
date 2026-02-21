import React from "react";
import { View } from "react-native";
import { CGText, Button, Row, Stack, Badge } from "./primitives";

function shortId(id?: string | null): string {
  const s = String(id || "").trim();
  if (!s) return "";
  if (s.length <= 10) return s;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

function formatRelativeTime(iso?: string | null): string | null {
  const raw = String(iso || "").trim();
  if (!raw) return null;

  const t = Date.parse(raw);
  if (!Number.isFinite(t)) return null;

  const diffMs = Date.now() - t;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export function PartnerCard({
  paired,
  status,
  partnerId,
  onPairNow,
  pulseMood,
  pulseUpdatedAt,
  pulseUserId,
  currentUserId,
}: {
  paired: boolean;
  status: "NOT_PAIRED" | "WAITING" | "CONNECTED";
  partnerId?: string | null;
  onPairNow?: () => void;

  pulseMood?: string | null;
  pulseUpdatedAt?: string | null;
  pulseUserId?: string | null;
  currentUserId?: string | null;
}) {
  const title =
    status === "NOT_PAIRED" ? "Not paired" :
    status === "WAITING" ? "Waiting for partner" :
    "Connected";

  const badgeText =
    status === "NOT_PAIRED" ? "Setup" :
    status === "WAITING" ? "Pending" :
    "Paired ✓";

  const partnerLine =
    status === "CONNECTED" && partnerId ? `Partner ID: ${shortId(partnerId)}` :
    status === "WAITING" ? "Share your code or have them join." :
    "Pair to start building your shared space.";

  const rel = formatRelativeTime(pulseUpdatedAt);
  const hasPulse = Boolean(String(pulseMood || "").trim()) && Boolean(rel);

  const who =
    !pulseUserId || !currentUserId ? null :
    pulseUserId === currentUserId ? "You" :
    "Partner";

  const pulseLine =
    status === "CONNECTED"
      ? (hasPulse
          ? `Latest pulse: ${pulseMood} · ${rel}${who ? ` · ${who}` : ""}`
          : "Latest pulse: none yet")
      : null;

  return (
    <View
      style={{
        borderWidth: 1,
        borderRadius: 16,
        padding: 14,
      }}
    >
      <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
        <Stack gap={4}>
          <CGText style={{ fontSize: 16, fontWeight: "700" }}>{title}</CGText>
          <CGText style={{ opacity: 0.8 }}>{partnerLine}</CGText>
          {pulseLine ? <CGText style={{ opacity: 0.75 }}>{pulseLine}</CGText> : null}
        </Stack>

        <Badge>
          <CGText style={{ fontWeight: "700" }}>{badgeText}</CGText>
        </Badge>
      </Row>

      {!paired && (
        <View style={{ marginTop: 12 }}>
          <Button title="Pair now" onPress={onPairNow} />
        </View>
      )}
    </View>
  );
}
