# Foundry Character Sheet Alpha — DOM Findings

Target: Foundry VTT v14.367, Powered by the Apocalypse 1.2.2.

## Verified by live sheet inspection

- The native top section is `.sheet-top`; `.sheet-attributes-top` contains one `.cell--attributes-top` wrapper.
- Condition inputs are native inputs named `system.attributes.condition1.value`, `condition2.value`, and `condition3.value`.
- Each Condition input is inside a `.cell--conditionN.cell--attr-conditionN` cell. All three cells are children of `.cell--attributes-left`, nested under `.cell--aesthetics` in the left section of `.sheet-bottom`.
- `.sheet-bottom` has two children: the left-side section and `.sheet-main`.
- `.sheet-main` contains `.sheet-tabs.tabs` and `.sheet-body`.
- Existing tabs are Description, Moves, Equipment. Their panes use `.tab[data-tab]`; navigation uses `a.item[data-tab]`.
- Vice is `system.attributes.vice.value`; XP uses five native radio inputs with class `.attr-xp`.

## Implementation constraints

1. Move native Condition cell wrappers rather than cloning or rebuilding their form controls.
2. Keep the existing primary tab group and use a unique Echoes tab key.
3. Persist prompt-used and reflection selections separately from the prompt text and from each other.
4. Do not assume the actor's playbook prompt list is available from the sheet's current DOM. Prompt data should be supplied through a deliberate configuration/data source.
5. Preserve current equipment tag toggles and their item-level flags.

## Status

Live DOM inspection complete. Functional sheet extension and installable Alpha package are not yet complete; do not install this branch as an Alpha until a package is explicitly produced and tested.
