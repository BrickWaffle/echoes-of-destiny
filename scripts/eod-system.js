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
    data.playbooks = this.actor.items.filter(i => i.type === "playbook");
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
    html.find("[data-create-item]").on("click", async event => {
      event.preventDefault();
      const type = event.currentTarget.dataset.createItem;
      if (!["move", "equipment", "playbook"].includes(type)) return;
      const item = await this.actor.createEmbeddedDocuments("Item", [{
        name: type === "move" ? "New Move" : type === "equipment" ? "New Equipment" : "New Playbook",
        type
      }]);
      item[0]?.sheet.render(true);
    });
    html.find("[data-edit-item]").on("click", event => {
      event.preventDefault();
      this.actor.items.get(event.currentTarget.dataset.editItem)?.sheet.render(true);
    });
    html.find("[data-delete-item]").on("click", async event => {
      event.preventDefault();
      const item = this.actor.items.get(event.currentTarget.dataset.deleteItem);
      if (!item) return;
      const confirmed = await Dialog.confirm({
        title: "Remove Item", content: `<p>Remove ${foundry.utils.escapeHTML(item.name)} from ${foundry.utils.escapeHTML(this.actor.name)}?</p>`
      });
      if (confirmed) await item.delete();
    });
    html.find("[data-choose-playbook]").on("click", async event => {
      event.preventDefault();
      if (this.actor.type !== "character") return;
      if (this.actor.items.some(item => item.type === "playbook")) {
        return ui.notifications.warn("This character already has a playbook.");
      }
      const pack = game.packs.get("echoes-of-destiny.playbooks");
      const movePack = game.packs.get("echoes-of-destiny.playbook-moves");
      const basicPack = game.packs.get("echoes-of-destiny.basic-moves");
      if (!pack || !movePack || !basicPack) {
        return ui.notifications.error("Required Echoes of Destiny compendiums are missing.");
      }
      const index = await pack.getIndex();
      const options = index.contents.map(item =>
        `<option value="${foundry.utils.escapeHTML(item._id)}">${foundry.utils.escapeHTML(item.name)}</option>`
      ).join("");
      const chosen = await Dialog.prompt({
        title: "Choose Playbook",
        content: `<form><label>Playbook <select name="playbook">${options}</select></label></form>`,
        callback: html => html.find('[name="playbook"]').val()
      });
      if (!chosen) return;
      const playbook = await pack.getDocument(chosen);
      if (!playbook) return;
      const attribute = playbook.system.abilityIncrease;
      if (!ATTRIBUTES.includes(attribute)) return ui.notifications.error("Playbook has an invalid starting Attribute.");
      const value = Number(this.actor.system.attributes?.[attribute] ?? 0);
      if (value >= 3) return ui.notifications.warn("Starting Attribute increase would exceed +3.");
      const moveIndex = await movePack.getIndex();
      const basicIndex = await basicPack.getIndex();
      const signatureId = playbook.system.signatureMove;
      const signatureEntry = moveIndex.contents.find(item =>
        item.flags?.["echoes-of-destiny"]?.sourceId === signatureId
      );
      // Pack indexes may not include custom flags. Resolve from full documents when needed.
      const resolve = async (sourcePack, sourceIndex, sourceId) => {
        for (const entry of sourceIndex.contents) {
          const doc = await sourcePack.getDocument(entry._id);
          if (doc?.getFlag("echoes-of-destiny", "sourceId") === sourceId) return doc;
        }
        return null;
      };
      const signature = signatureEntry
        ? await movePack.getDocument(signatureEntry._id)
        : await resolve(movePack, moveIndex, signatureId);
      if (!signature) return ui.notifications.error("Signature Move is missing from the compendium.");
      const basicMoves = await Promise.all(basicIndex.contents.map(entry => basicPack.getDocument(entry._id)));
      if (basicMoves.some(item => !item) || basicMoves.length !== 3) {
        return ui.notifications.error("The Basic Moves compendium is incomplete.");
      }
      const optionalMoves = [];
      for (const sourceId of playbook.system.optionalMoves ?? []) {
        const doc = await resolve(movePack, moveIndex, sourceId);
        if (!doc) return ui.notifications.error("A playbook optional move is missing.");
        optionalMoves.push(doc);
      }
      const optionHtml = optionalMoves.map((item, index) =>
        `<option value="${index}">${foundry.utils.escapeHTML(item.name)}</option>`
      ).join("");
      const optionalChoice = await Dialog.prompt({
        title: "Starting Optional Move",
        content: `<p>Choose one optional move for ${foundry.utils.escapeHTML(playbook.name)}.</p><select name="optional">${optionHtml}</select>`,
        callback: html => Number(html.find('[name="optional"]').val())
      });
      if (optionalChoice === null || optionalChoice === undefined || !optionalMoves[optionalChoice]) return;
      if (this.actor.items.some(item => item.type === "playbook")) return;
      const existing = new Set(this.actor.items.filter(item => item.type === "move")
        .map(item => item.getFlag("echoes-of-destiny", "sourceId")));
      const granted = [signature, ...basicMoves, optionalMoves[optionalChoice]]
        .filter(item => !existing.has(item.getFlag("echoes-of-destiny", "sourceId")));
      await this.actor.createEmbeddedDocuments("Item", [
        playbook.toObject(), ...granted.map(item => item.toObject())
      ]);
      await this.actor.update({[`system.attributes.${attribute}`]: value + 1});
      ui.notifications.info(`${playbook.name} selected; starting moves granted.`);
    });
    html.find("[data-open-compendium]").on("click", event => {
      event.preventDefault();
      const pack = game.packs.get(event.currentTarget.dataset.openCompendium);
      if (pack) pack.render(true);
      else ui.notifications.warn("This compendium is not installed yet.");
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
