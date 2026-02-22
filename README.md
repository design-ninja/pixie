# #hexPicker — A Simple HEX Color Picker

A lightweight Chrome extension for picking, copying, and saving colors in HEX format with a single click.

## Features

- 🎨 **Pick colors** from any webpage using the native EyeDropper API
- 📋 **One-click copy** — click any saved color to copy it to clipboard
- 💾 **Persistent storage** — your color palette is saved locally
- 🌗 **Smart contrast** — text adapts to light/dark backgrounds
- 📂 **Expandable palette** — show more/less toggle for large collections

## Installation

### Chrome Web Store

Install directly from the [Chrome Web Store](https://chrome.google.com/webstore/detail/hexpicker-%E2%80%94-a-simple-hex/nbfoiiglmnkmdhhaenkekmodabpcfnhc).

### Manual Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/design-ninja/hex-picker.git
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Build the extension:
   ```bash
   pnpm build
   ```
4. Open Chrome and go to `chrome://extensions/`
5. Enable **Developer mode** (toggle in top right)
6. Click **Load unpacked** and select the `dist` folder

## Development

- `pnpm typecheck` — runs TypeScript checks without emitting files
- `pnpm build` — builds scripts and copies static assets into `dist/`

## Usage

1. Click the extension icon in your browser toolbar
2. Press **"Pick a color"** button
3. Click anywhere on the page to capture the color
4. Your picked colors are saved and displayed in the popup
5. Click any color swatch to copy the HEX code to clipboard

## Permissions

- **activeTab** — to pick colors from the current webpage
- **storage** — to save your color palette locally
- **clipboardWrite** — to copy color values to clipboard

## Privacy

All data is stored locally on your device. We do not collect or transmit any personal data. See [PRIVACY.md](PRIVACY.md) for details.

## Support

- ⭐ [Leave a review](https://chrome.google.com/webstore/detail/hexpicker-%E2%80%94-a-simple-hex/nbfoiiglmnkmdhhaenkekmodabpcfnhc)
- ☕ [Buy me a coffee](https://www.buymeacoffee.com/design_ninja)

## License

MIT
