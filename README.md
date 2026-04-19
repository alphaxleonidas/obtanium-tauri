# obtanium-tauri
Obtanium for ubuntu
### Installtion
# 1. Install Rust (if you don't have it)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# 2. Install system libraries
sudo apt install -y libwebkit2gtk-4.1-dev libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev patchelf

# 3. Install JS dependencies
npm install

# 4. Build the app (first time: 20-40 min due to Rust compilation)
npm run tauri build
