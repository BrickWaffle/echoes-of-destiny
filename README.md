# Echoes of Destiny — Tag State Tracker

A prototype Foundry VTT module for the **Powered by the Apocalypse** system.

## Target environment

- Foundry VTT v14 Stable, build 367
- Powered by the Apocalypse system 1.2.2

## Current prototype behavior

Adds a **Tag Availability** panel to actor sheets. It supports creating named entries, toggling Available/Unavailable, restoring, and removing entries. State persists in actor flags under `flags.echoes-tag-state.tags`. Unavailable tags are visually dimmed and struck through, not erased.

## Important scope limitation

This is a standalone tracker prototype. It does **not yet read or synchronize PbtA's native configured tags, item tags, or system tag controls**. It currently targets actor sheets; items represented separately do not get their own tracker. Live compatibility with the specified Foundry/PbtA versions remains to be verified.

## Development install

Copy this repository's module files into a folder named `echoes-tag-state` inside Foundry's `Data/modules` directory, then enable the module in Manage Modules.

## Manifest install

Manifest URL:

`https://raw.githubusercontent.com/BrickWaffle/echoes-of-destiny-tag-state/main/module.json`

The download currently points to the GitHub source archive. A versioned Foundry-ready release ZIP should replace that source archive URL before treating this as a stable one-click installation.

## Safety

Back up your world before testing. Removing a tracker entry removes only the module's tracked entry, not a native PbtA tag or document. Only actor owners can edit entries.
