const REFLECTION_QUESTIONS = [
  "Did you make a meaningful connection with another character?",
  "Did you learn something important about the galaxy?",
  "Did you take a risk or face danger?",
  "Did you pursue your personal goals or beliefs?",
  "Did you create trouble, complications, or consequences?",
  "Did you reveal something significant about your character?"
];
const ATTRIBUTES = ["might", "agility", "wits", "presence", "force"];
function outcome(total) {
  if (total <= 6) return { key: "complications", label: "Complications..." };
  if (total <= 9) return { key: "partial", label: "Partial success" };
  if (total <= 11) return { key: "success", label: "Success!" };
  return { key: "critical", label: "Critical Success!" };
}
class EODActor extends Actor {
  async rollAttribute(attribute, { advantage = 0 } = {}) {
    if (!ATTRIBUTES.includes(attribute)) throw new Error("Unknown Echoes of Destiny attribute");
    const modifier = Number(this.system.attributes?.[attribute] ?? 0);
    const formula = advantage > 0 ? "3d6kh2" : advantage < 0 ? "3d6kl2" : "2d6";
    const roll = await new Roll(`${formula} + @mod`, { mod: modifier }).evaluate();
    const result = outcome(roll.total);
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `${this.name} — ${attribute[0].toUpperCase() + attribute.slice(1)}: ${result.label}`
    });
    return { roll, ...result };
  }
}
class EODCharacterSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["eod", "sheet", "actor"],
      template: "systems/echoes-of-destiny/templates/actor-sheet.hbs",
      width: 760, height: 700, resizable: true,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "details" }]
    });
  }
  getData(options = {}) {
    const data = super.getData(options);
    data.attributes = ATTRIBUTES.map(key => ({ key, label: key[0].toUpperCase() + key.slice(1), value: this.actor.system.attributes?.[key] ?? 0 }));
    data.isCharacter = this.actor.type === "character";
    data.isVehicle = this.actor.type === "vehicle";
    data.isOrganization = this.actor.type === "organization";
    data.isLocation = this.actor.type === "location";
    if (data.isCharacter) {
      const reflection = this.actor.system.reflections ?? {};
      const selected = Array.isArray(reflection.selected) ? reflection.selected : [];
      data.reflectionQuestions = REFLECTION_QUESTIONS.map((question, index) => ({
        index, question, selected: selected.includes(index)
      }));
      data.reflectionCount = selected.length;
      data.xpBoxes = Array.from({length: 5}, (_, index) => ({
        index, checked: index < Number(this.actor.system.xp || 0)
      }));
    }
    data.moves = this.actor.items.filter(i => i.type === "move");
    data.equipment = this.actor.items.filter(i => i.type === "equipment");
    return data;
  }
  activateListeners(html) {
    super.activateListeners(html);
    html.find("[data-reflection-select]").on("change", async event => {
      const index = Number(event.currentTarget.dataset.reflectionSelect);
      const selected = [...(this.actor.system.reflections?.selected ?? [])];
      const next = event.currentTarget.checked
        ? [...selected, index]
        : selected.filter(value => value !== index);
      if (next.length > 3) {
        ui.notifications.warn("Choose no more than three Reflection Questions.");
        return this.render();
      }
      await this.actor.update({"system.reflections.selected": next});
    });
    html.find("[data-xp-box]").on("change", async event => {
      const index = Number(event.currentTarget.dataset.xpBox);
      await this.actor.update({"system.xp": event.currentTarget.checked ? index + 1 : index});
    });
    html.find("[data-roll-attribute]").on("click", event => {
      event.preventDefault();
      const attribute = event.currentTarget.dataset.rollAttribute;
      const advantage = event.shiftKey ? 1 : event.altKey ? -1 : 0;
      this.actor.rollAttribute(attribute, { advantage });
    });
  }
}
class EODItemSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["eod", "sheet", "item"],
      template: "systems/echoes-of-destiny/templates/item-sheet.hbs",
      width: 520, height: 450, resizable: true
    });
  }
  getData(options = {}) {
    const data = super.getData(options);
    data.isMove = this.item.type === "move";
    data.isEquipment = this.item.type === "equipment";
    data.isPlaybook = this.item.type === "playbook";
    return data;
  }
}
Hooks.once("init", () => {
  CONFIG.Actor.documentClass = EODActor;
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("echoes-of-destiny", EODCharacterSheet, {
    types: ["character", "npc", "vehicle", "location", "organization"],
    makeDefault: true,
    label: "Echoes of Destiny Sheet"
  });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("echoes-of-destiny", EODItemSheet, {
    types: ["move", "equipment", "playbook"], makeDefault: true,
    label: "Echoes of Destiny Item Sheet"
  });
  console.info("Echoes of Destiny | Standalone system initialized");
});
