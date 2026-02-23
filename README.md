# Pixie — A Simple Color Picker

A lightweight Chrome extension for picking, copying, and saving colors in multiple formats with a single click.

## Features

- 🎨 **Pick colors** from any webpage using the native EyeDropper API
- 📋 **One-click copy** — click any saved color to copy it to clipboard
- 💾 **Persistent storage** — your color palette is saved locally
- 🎛️ **Multiple color formats** — work with HEX, RGB, HSL, OKLCH, OKLab, Lab, LCH, and Display-P3

## Installation

### Chrome Web Store

Install directly from the [Chrome Web Store](https://chromewebstore.google.com/detail/nbfoiiglmnkmdhhaenkekmodabpcfnhc).

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
2. Select your preferred output format in the format dropdown (default: **HEX**)
3. Press **"Pick a color"** button
4. Click anywhere on the page to capture the color
5. Pixie saves the picked color with values in all supported formats and copies the selected format value
6. Open a history item to copy any specific format value

## Color Formats And Copying

- Supported formats: **HEX**, **RGB**, **HSL**, **OKLCH**, **OKLab**, **Lab**, **LCH**, **Display-P3**
- The dropdown format controls which value is copied immediately after picking a color
- Each history entry stores all format variants, so you can expand it and copy any format on demand
- Use the quick **copy** action on a history card to copy the originally picked value

## Permissions

- **activeTab** — to pick colors from the current webpage
- **scripting** — to inject the picker script into the active tab only when you click **Pick color**
- **storage** — to save your color palette locally
- **clipboardWrite** — to copy color values to clipboard

## Privacy

All data is stored locally on your device. We do not collect or transmit any personal data. See [PRIVACY.md](PRIVACY.md) for details.

## Support

- ⭐ [Leave a review](https://chromewebstore.google.com/detail/nbfoiiglmnkmdhhaenkekmodabpcfnhc)
- ☕ [Buy me a coffee](https://www.buymeacoffee.com/design_ninja)

## License

MIT
