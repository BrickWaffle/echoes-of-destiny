# Character Sheet Extension Prototype

Target: Foundry VTT v14.367, Powered by the Apocalypse 1.2.2.

## Confirmed native sheet structure

- `.sheet-top` contains `.sheet-attributes` and `.sheet-attributes-top`.
- `.sheet-bottom` contains the Condition sidebar and `.sheet-main`.
- `.sheet-main` contains `.sheet-tabs.tabs[data-group="primary"]` and `.sheet-body`.
- Native tab panes use `.tab[data-group="primary"][data-tab="..."]`.
- Condition fields are `system.attributes.condition1.value`, `condition2.value`, and `condition3.value`.
- Vice is `system.attributes.vice.value`.
- The native XP widgets are `.attr-xp` radio inputs and do not expose a `name` in the inspected DOM.

## Design target

Reflow the existing three Condition text fields into a panel beside Look/Vice/XP while preserving their native form bindings. Add an Echoes tab with Past prompts, Destiny prompts, used-state controls, and independent end-of-session reflection selections. Persist custom Echo data on the Actor under this module's namespace. Do not alter the PbtA roll engine or playbook item data.

## Implementation status

Diagnostic and layout discovery only. No sheet DOM changes have been enabled yet. The exact condition field wrapper structure, native tab activation behavior, and playbook data source must be verified before implementing the live extension.
