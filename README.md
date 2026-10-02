# Echoes of Destiny

Foundry module ID: `echoes-of-destiny` (release 1.1.0).

A Foundry VTT module for the **Powered by the Apocalypse** system, combining the Echoes character-sheet tab with persistent equipment-tag availability.

## Target environment

- Foundry VTT v14 Stable, build 367
- Powered by the Apocalypse system 1.2.2

## Character sheet

Adds a dedicated **Echoes** tab with Echoes of the Past and playbook-specific Echoes of Destiny prompts. Prompt selections persist on the Actor. The native Description tab is hidden; Conditions and End-of-Session Reflections remain configured through the PbtA system's TOML.

The sheet preserves the selected tab when an Echo prompt update causes a sheet refresh. Existing prompt-selection data remains under the legacy `echoes-character-sheet-alpha` flag namespace.

## Equipment tags

Click a native PbtA equipment tag to toggle Available/Unavailable; unavailable tags are dimmed and struck through. State is stored on the owning equipment Item in `flags.echoes-tag-state.unavailableTagKeys` (legacy storage namespace retained for upgrade compatibility), so identical tag names on different items are independent. Configured tag data is not altered. Only Actor owners may toggle tags; keyboard Enter/Space is supported.

Availability is a visual/table-use aid. It does not change roll calculations; players and the Director apply the game's tag rules.

## Install and test

Back up the world before installing. Test prompt selection and persistence, tab preservation after edits, equipment-tag toggling and persistence, identical tags on separate items, item tag edits, and player/owner permissions.

Manifest URL:
`https://raw.githubusercontent.com/BrickWaffle/echoes-of-destiny-tag-state/main/module.json`
