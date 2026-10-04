# Echoes of Destiny

Foundry VTT module for Echoes of Destiny on PbtA (Foundry v14 / PbtA 1.2.2).

Includes the Echoes character-sheet tab, persistent equipment-tag availability, the authoritative EoD PbtA sheet configuration, and three system-specific Item compendiums: Basic Moves, Playbook Moves, and Playbooks.

## Sheet configuration
The authoritative PbtA configuration is `config/sheet-config.toml`. Run `python3 tools/build-sheet-config.py` after changing it. The generator writes `scripts/sheet-config.js`, which applies the parsed configuration through PbtA's `pbtaSheetConfig` module override hook. Do not edit the generated JavaScript directly.

The release workflow regenerates the JavaScript from TOML before packaging and includes the TOML source in the ZIP.

## Build compendiums
Run `npm install`, then `npm run build:packs`. Source records are maintained in `src/compendium-moves.json` and `src/compendium-playbooks.json`; the build emits Foundry LevelDB packs under `packs/`. The release workflow compiles packs before zipping the module.

## Test
Install in a disposable/backed-up Foundry world with PbtA 1.2.2. Confirm the EoD sheet configuration is applied automatically, custom actor types are available, all three compendiums open, move descriptions render, imported moves can be used, starting ability increases are applied, Echoes work, and equipment tag availability persists.

Manifest: https://raw.githubusercontent.com/BrickWaffle/echoes-of-destiny/main/module.json

## Compendiums
The module includes Basic Moves, Playbook Moves (organized by playbook), and Playbooks. Each playbook grants its Signature Move through the PbtA playbook grant configuration; optional moves remain unselected and are available for later player/Director choice. Playbook entries also include their six Echoes of Destiny prompts.
