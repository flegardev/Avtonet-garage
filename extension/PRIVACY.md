# Privacy Policy for AvtoNetGaraza

Last updated: April 11, 2026

AvtoNetGaraza is a Chrome extension for saving vehicle listings from avto.net, monitoring price changes, and showing notifications about saved listings.

## What data the extension accesses

The extension only works on `avto.net` pages selected in the extension manifest.

When you choose to save a vehicle listing, the extension may access and store:

- listing title
- listing URL
- listing price and detected price changes
- listing status, such as active, sold, or removed
- listing images
- listing description and vehicle specifications shown on the page
- seller information shown on the listing page
- folders, settings, and notification history created inside the extension
- personal buying notes, checklist selections, manual ownership expenses and service dates

## How data is used

The data is used only to provide the extension's core features:

- saving vehicle listings into your local garage
- organizing saved vehicles into folders
- checking saved avto.net listings for price or status changes
- showing local Chrome notifications about relevant changes

## Storage and transfer

- Data is stored locally in your browser using `chrome.storage.local`.
- The extension does not require account creation or sign-in.
- The extension does not sell user data.
- The extension does not transfer user data to third parties for advertising or marketing.
- The extension does not use user data for creditworthiness, lending, or data brokerage purposes.

## Network access

The extension may request pages from `avto.net` in order to check saved listings for updates. This access is limited to the extension's declared host permissions for `*://*.avto.net/*`.

The extension does not load remote code. All executable code is packaged with the extension.

## Notifications

If notifications are enabled, the extension may show local browser notifications when:

- a saved listing price changes
- a saved listing is marked sold
- a saved listing is removed
- a vehicle is saved to the garage

## Your choices

You can:

- remove saved vehicles at any time
- clear notifications inside the extension
- disable notifications in the extension settings
- export or clear local extension data from the extension settings
- uninstall the extension to stop all future access and monitoring

## Contact

If you have questions about this privacy policy, contact the developer through the Chrome Web Store support channel listed for the extension.

## Candidate 1.1.0
Ownership notes, expenses and service dates are stored locally under ag_ownership and included in JSON export. Listing checks access saved avto.net URLs; image requests may reach the original image hosts. No valuation data service or tracking backend is added.
