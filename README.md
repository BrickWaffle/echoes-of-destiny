# Echoes of Destiny

Foundry VTT module for Echoes of Destiny on PbtA (Foundry v14 / PbtA 1.2.2).

Includes the Echoes character-sheet tab, persistent equipment-tag availability, and two system-specific Item compendiums: Basic Moves and Playbook Moves.

## Build compendiums
Run `npm install`, then `npm run build:packs`. Source records are maintained in `src/compendium-moves.json`; the build emits Foundry LevelDB packs under `packs/`. The release workflow compiles packs before zipping the module.

## Test
Install in a disposable/backed-up Foundry world with PbtA 1.2.2. Confirm both compendiums open, move descriptions render, and imported moves can be used. The build validates that the CLI can re-extract the expected number of entries; it does not replace an in-world compatibility test.

Manifest: https://raw.githubusercontent.com/BrickWaffle/echoes-of-destiny/main/module.json


## Compendiums
The module includes Basic Moves, Playbook Moves (organized by playbook), and Playbooks. Each playbook grants its Signature Move through the PbtA playbook grant configuration; optional moves remain unselected and are available for later player/Director choice. Playbook entries also include their six Echoes of Destiny prompts.
