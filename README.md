# Echoes of Destiny — Tag State Tracker

A prototype Foundry VTT module for the **Powered by the Apocalypse** system.

## Target environment

- Foundry VTT v14 Stable, build 367
- Powered by the Apocalypse system 1.2.2

## Alpha behavior

Adds availability interaction directly to native PbtA equipment tags in an item's expanded description. Click a tag to toggle Available/Unavailable; unavailable tags are dimmed and struck through. The state is stored on the owning equipment Item in `flags.echoes-tag-state.unavailableTagKeys`, so identical tag names on different items are independent. The module does not alter the item's configured tag data.

Only users with ownership of the Actor may toggle tags. Keyboard Enter/Space is supported on focused tag controls.

## Compatibility status

This alpha targets the PbtA actor sheet's native equipment markup and has not yet been live-tested in Foundry. It currently handles equipment tags only; it does not change move tags, actor tags, or mechanical roll calculations. Availability is a visual/table-use aid: the Director and players still apply the game's tag rules.

## Upgrade note

The previous 0.1.x prototype stored manually entered actor-level tags in `flags.echoes-tag-state.tags`. This alpha no longer displays that standalone tracker and does not migrate those prototype entries. Existing native PbtA equipment and tags are not deleted or rewritten.

## Install and test

Install only in a backed-up development world until compatibility is confirmed. Expand an equipment entry, then click one of its existing tags. Close/reopen the sheet and verify the unavailable state persists. Test two separate items sharing a tag name, item tag edits, and player/owner permissions.

Manifest URL:
`https://raw.githubusercontent.com/BrickWaffle/echoes-of-destiny-tag-state/main/module.json`
