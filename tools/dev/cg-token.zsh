set -euo pipefail

cd /Users/axm/dev/CommonGround

LAN_IP="$(ipconfig getifaddr en0 || ipconfig getifaddr en1)"
if [ -z "$LAN_IP" ]; then
  echo "Could not detect LAN IP"
  exit 1
fi

print -n "EMAIL: "
read -r EMAIL

print -n "PASSWORD: "
stty -echo
read -r PASSWORD
stty echo
print

TOKEN="$(EMAIL="$EMAIL" PASSWORD="$PASSWORD" node <<'NODE'
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const env = fs.readFileSync("apps/mobile/.env","utf8");
const grab = (k) => ((env.match(new RegExp("^"+k+"=(.*)$","m"))||[])[1]||"").trim();

const url = grab("EXPO_PUBLIC_SUPABASE_URL");
const anon = grab("EXPO_PUBLIC_SUPABASE_ANON_KEY");

(async () => {
  const supabase = createClient(url, anon);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: (process.env.EMAIL || "").trim(),
    password: (process.env.PASSWORD || "").trim(),
  });
  if (error) {
    console.error(error.message);
    process.exit(2);
  }
  if (!data?.session?.access_token) {
    console.error("No session returned");
    process.exit(2);
  }
  process.stdout.write(data.session.access_token.trim());
})();
NODE
)"

export TOKEN
echo "tokenLen=${#TOKEN}"
echo "LAN_IP=$LAN_IP"
