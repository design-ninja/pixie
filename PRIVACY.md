# Privacy Policy for Pixie

**Last updated:** February 23, 2026

## Overview

Pixie is a browser extension that allows users to pick, copy, and save colors in multiple formats. We are committed to protecting your privacy.

## Data Collection

**We do not collect any personal data.**

All information (saved colors, preferences) is stored **locally on your device** using Chrome's built-in storage (`chrome.storage.local`). This data never leaves your browser.

## Data Sharing

We do not:
- Transmit any data to external servers
- Share data with third parties
- Use analytics or tracking services
- Store any data outside your browser

## Permissions

The extension requires the following permissions:

- **activeTab**: To pick colors from the current webpage
- **scripting**: To inject the color-picker content script only into the active tab when you click "Pick color"
- **storage**: To save your color palette locally on your device
- **clipboardWrite**: To copy color values to your clipboard

## Content Script

The extension injects a content script only after you click "Pick color". It runs only in the active tab to open the EyeDropper, save the selected color locally, and copy the selected value to your clipboard. It does not collect or transmit page content.

## Data Security

Your data is stored locally in your browser profile via `chrome.storage.local`. We do not transmit this data externally. Uninstalling the extension removes extension-local data.

## Changes to This Policy

We may update this Privacy Policy from time to time. Any changes will be reflected in the "Last updated" date above.

## Contact

If you have questions about this Privacy Policy, please open an issue on our GitHub repository.
