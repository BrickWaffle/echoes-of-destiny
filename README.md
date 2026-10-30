# Star Wars: Echoes of Destiny

A **standalone** narrative Star Wars roleplaying **Game System** for **Foundry VTT v14**. Version **3.0.0** does **not** require the PbtA system or the older Echoes of Destiny module.

> **Major-version transition:** v2.x was an add-on module requiring PbtA; v3.x is a standalone Foundry Game System. Existing v2 worlds are not automatically migrated. Back up worlds before changing systems and create a new v3 world for initial use.

## Installation

In Foundry VTT, choose **Game Systems → Install System** and enter:

```text
https://raw.githubusercontent.com/BrickWaffle/echoes-of-destiny/main/system.json
```

Or install the release ZIP from [GitHub Releases](https://github.com/BrickWaffle/echoes-of-destiny/releases) into the Foundry `Data/systems/` directory. The ZIP contains the `echoes-of-destiny/` folder.

## System features

- Five Attributes (Might, Agility, Wits, Presence, Force) ranging from −2 to +3, and 2d6 resolution with Advantage and Disadvantage.
- Character creation with seven playbooks, their designated +1 Attribute, an additional player-chosen +1 Attribute, and starting moves.
- Three Basic Moves and 42 Playbook Moves in compendiums; Playbook Moves are grouped into seven folders.
- Editable and exhaustible Tags on Characters, Equipment, NPCs, Vehicles, Locations, and Organizations.
- Echoes of the Past and playbook-specific Echoes of Destiny, with recorded scenes, one-time resolution, and an Unmark option.
- Reflections, manual XP tracking, and seven one-time Advancement options at 5 XP each.
- Native Actor sheets for Characters, NPCs, Vehicles, Locations, and Organizations.
- Dark datapad-inspired interface.

## Actor permissions

Organization Hidden Agenda is shown only to the GM or Actor owners; Observer-level users do not see it on the sheet. Use Foundry permissions appropriately when assigning ownership.

## Development

The native compendium sources are `src/compendium-moves.json` and `src/compendium-playbooks.json`. To compile the standalone packs:

```bash
npm install --ignore-scripts
node tools/build-system-packs.mjs
```

The `feature/standalone-system-v3` branch builds a test artifact on each push. The dedicated `release-standalone-system.yml` workflow packages the Game System for v3 tags after changes are merged to `main`. The legacy `package.yml` workflow is restricted to v2 tags.

## License

MIT; see [LICENSE](LICENSE).
