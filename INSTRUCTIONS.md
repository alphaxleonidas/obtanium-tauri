# Obtanium for Ubuntu — Tauri Desktop App

A native Linux desktop app for tracking, discovering, and managing Linux applications by source URL (GitHub, GitLab). Data is stored locally in SQLite — no server required.

---

## What You Need

- Ubuntu 20.04+ (or any modern Debian-based distro)
- Node.js 18+ → install via: `curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs`
- Rust → install via: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh` then restart your terminal

---

## Step 1: Install System Libraries (one-time)

```bash
sudo apt update
sudo apt install -y \
  libwebkit2gtk-4.1-dev \
  libssl-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf
```

---

## Step 2: Install Node.js Dependencies

```bash
npm install
```

---

## Step 3: Add App Icons (optional but recommended)

Place your icon files in `src-tauri/icons/`:
- `32x32.png`
- `128x128.png`
- `128x128@2x.png`
- `icon.icns` (macOS, can skip)
- `icon.ico` (Windows, can skip)

You can generate these from any PNG using the Tauri CLI after installing:
```bash
npx @tauri-apps/cli icon path/to/your-icon.png
```

Or just remove the icon references from `src-tauri/tauri.conf.json` under `bundle.icon` to skip icons entirely.

---

## Step 4: Build the App

```bash
npm run tauri build
```

This will:
1. Build the React frontend (fast, ~30 seconds)
2. Compile the Rust backend (slow on first run: **20-40 minutes**)
3. Package everything into an AppImage, .deb, and .rpm

After it finishes, find your packages in:
```
src-tauri/target/release/bundle/
├── appimage/   → Obtanium_0.1.0_amd64.AppImage
├── deb/        → obtanium_0.1.0_amd64.deb
└── rpm/        → obtanium-0.1.0-1.x86_64.rpm
```

---

## Step 5: Install

**AppImage** (no install needed, just run):
```bash
chmod +x Obtanium_0.1.0_amd64.AppImage
./Obtanium_0.1.0_amd64.AppImage
```

**Debian/Ubuntu (.deb)**:
```bash
sudo dpkg -i obtanium_0.1.0_amd64.deb
```

**Fedora/openSUSE (.rpm)**:
```bash
sudo rpm -i obtanium-0.1.0-1.x86_64.rpm
```

---

## Development Mode (live preview without building)

```bash
npm run tauri dev
```

This opens the app in a window with hot-reload. Changes to the React code are reflected instantly. Rust changes require a recompile (~1-2 min).

---

## How It Works

| Feature | Details |
|---|---|
| Data storage | SQLite file at `~/.local/share/com.obtanium.ubuntu/obtanium.db` |
| GitHub updates | Direct API calls using `fetch` — no server needed |
| GitLab updates | Direct API calls using `fetch` |
| API tokens | Stored in the same SQLite file (encrypted by OS keyring in future) |
| System WebView | Uses your distro's WebKitGTK — security patches come via `apt upgrade` |

---

## File Structure

```
obtanium-tauri/
├── src/                          # React frontend
│   ├── lib/
│   │   ├── db.ts                 # SQLite database layer
│   │   ├── api.ts                # App CRUD + stats operations
│   │   ├── release-checker.ts    # GitHub/GitLab API calls
│   │   └── types.ts              # TypeScript types
│   ├── components/
│   │   ├── Layout.tsx            # Sidebar + main layout
│   │   ├── AppCard.tsx           # App list card
│   │   ├── StatusBadge.tsx       # Status pill badge
│   │   └── ui/                   # shadcn/ui components
│   ├── pages/
│   │   ├── Dashboard.tsx         # Stats + recent apps
│   │   ├── AppLibrary.tsx        # Full app list + filters
│   │   ├── AddApp.tsx            # Add new tracked app
│   │   ├── AppDetail.tsx         # Single app detail + update
│   │   └── Settings.tsx          # GitHub/GitLab tokens
│   ├── hooks/use-toast.ts
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/                    # Rust/Tauri backend
│   ├── src/
│   │   ├── main.rs               # Entry point
│   │   └── lib.rs                # Tauri builder + plugins
│   ├── capabilities/
│   │   └── default.json          # App permissions
│   ├── Cargo.toml                # Rust dependencies
│   ├── build.rs
│   └── tauri.conf.json           # Tauri configuration
├── package.json
├── vite.config.ts
├── tsconfig.json
└── index.html
```

---

## Troubleshooting

**`libwebkit2gtk-4.1-dev` not found**
Some distros ship `libwebkit2gtk-4.0-dev` instead. Try:
```bash
sudo apt install libwebkit2gtk-4.0-dev
```
Then update `Cargo.toml` if needed.

**First build is very slow**
Normal — Rust compiles ~200 crates from scratch. Subsequent builds are 2-5 minutes.

**`cargo: command not found`**
Rust was installed but not loaded. Run: `source ~/.cargo/env`

**App opens but shows blank screen**
Run `npm run tauri dev` instead of the built version to see console errors.

---

## Adding GitHub API Token

1. Go to `github.com/settings/tokens`
2. Click "Generate new token (classic)"
3. Name it "Obtanium", set no expiry, select **no scopes** (public repo access is default)
4. Copy the `ghp_...` token
5. Open Obtanium → Settings → paste in the GitHub Token field → Save

This upgrades your rate limit from 60 to 5,000 requests/hour.
