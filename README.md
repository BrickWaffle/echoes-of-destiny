# Echoes of Destiny

**Echoes of Destiny** is a Foundry VTT module for running the Echoes of Destiny Star Wars narrative RPG using the [Powered by the Apocalypse system for Foundry VTT](https://github.com/asacolips-projects/pbta).

The module turns the general-purpose PbtA system into a ready-to-play Echoes of Destiny implementation, providing the game's sheet configuration, playbooks, moves, Echo mechanics, equipment support, custom actor types, and a unified galactic datapad-inspired visual theme.

## Requirements

- **Foundry VTT:** v14 (verified with build 367)
- **Game System:** PbtA 1.2.2

The PbtA game system must be installed separately.

## Installation

In Foundry VTT, open **Add-on Modules → Install Module**, paste the following URL into the **Manifest URL** field, and choose **Install**:

**[Echoes of Destiny Manifest](https://raw.githubusercontent.com/BrickWaffle/echoes-of-destiny/main/module.json)**

```text
https://raw.githubusercontent.com/BrickWaffle/echoes-of-destiny/main/module.json
```

The manifest always points Foundry to the current released package.

## What the Module Adds

### Complete Echoes of Destiny Sheet Configuration

The module automatically configures PbtA for Echoes of Destiny, including the five core Attributes:

- Might
- Agility
- Wits
- Presence
- Force

It also adds the game's character fields, Conditions, Reflections, Advancements, equipment categories, move categories, and other system-specific sheet configuration.

### Echoes

Character sheets include a dedicated **Echoes** tab for **Echoes of the Past** and **Echoes of Destiny**. Echo questions can be tracked directly on the character sheet as they are revealed and resolved during play.

### Playbooks

The included **Playbooks** compendium contains the seven Echoes of Destiny playbooks:

- Scoundrel
- Soldier
- Pilot
- Force User
- Engineer
- Diplomat
- Scout

Playbooks grant their Signature Move through PbtA's playbook system, apply their starting ability increase, provide their optional moves for later selection, and include their Echoes of Destiny prompts.

### Moves

Two move compendiums provide the rules content needed during play:

- **Basic Moves** — the core moves available to all characters.
- **Playbook Moves** — Signature and optional moves organized by playbook.

Move descriptions are formatted for direct use from Foundry character sheets and compendiums.

### Equipment Tags

Equipment supports persistent tag availability. Tags can be pushed or made unavailable during play and their state remains tracked on the sheet, supporting Echoes of Destiny's fiction-first equipment system without requiring separate bookkeeping.

### Custom Actor Types

In addition to characters and standard NPCs, the module provides dedicated sheet configurations for:

- **Vehicles** — including Conditions and Cargo.
- **Locations** — including descriptions, Location Events, and Resources.
- **Organizations** — including Influence, Resources, Reputation, Hidden Agenda, Political Moves, Covert Operations, and Assets.

Character-only features such as Moves and Echoes are kept off sheets where they do not apply.

### Echoes of Destiny Theme

All supported sheets use a shared galactic datapad-inspired interface with dark instrument panels, amber highlights, restrained cockpit blue accents, and system-specific styling designed to feel at home in a Star Wars game while remaining readable at the table.

## Compendiums

Installing the module provides three Foundry compendium packs:

| Compendium | Contents |
| --- | --- |
| **Echoes of Destiny: Basic Moves** | Core moves used by every character |
| **Echoes of Destiny: Playbook Moves** | Signature and optional moves for all seven playbooks |
| **Echoes of Destiny: Playbooks** | Complete playbook definitions and Echo prompts |

## Development

The authoritative PbtA sheet configuration is maintained in `config/sheet-config.toml`. Running:

```bash
python3 tools/build-sheet-config.py
```

generates `scripts/sheet-config.js`, which applies the configuration through PbtA's `pbtaSheetConfig` module override hook. The generated JavaScript should not be edited directly.

Compendium source records are maintained in `src/compendium-moves.json` and `src/compendium-playbooks.json`. To rebuild the Foundry LevelDB packs:

```bash
npm install
npm run build:packs
```

The GitHub release workflow regenerates the sheet configuration and compendium packs before packaging each release.

## License

Released under the [MIT License](LICENSE).
