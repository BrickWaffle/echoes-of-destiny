const PAST_ECHO_QUESTIONS = [
  "Narrate a flashback to a time when someone from your past taught you a lesson, skill, or way of seeing the galaxy that you still depend on. What happened that made the lesson stick?",
  "Narrate a scene from your youth or early travels when you encountered something that challenged everything you thought you knew about the galaxy.",
  "Who from your past would you trust with your life? Narrate a moment when this person proved they could be trusted, especially when doing so put something important at risk.",
  "Who from your past would you never want to see again? Narrate the last time you encountered this person. Show what happened between you, and why neither of you could simply walk away.",
  "Narrate a scene when an experience, betrayal, or revelation forced you to question a belief you once held dear.",
  "Narrate the moment you walked away from a person, place, duty, or way of life. Show what made you leave and what it cost you."
];
const REFLECTION_QUESTIONS = [
  "Did you make a meaningful connection with another character?",
  "Did you learn something important about the galaxy?",
  "Did you take a risk or face danger?",
  "Did you pursue your personal goals or beliefs?",
  "Did you create trouble, complications, or consequences?",
  "Did you reveal something significant about your character?"
];
const ADVANCEMENT_LABELS = [
  "Increase an ability modifier by 1 (max +3)",
  "Increase an ability modifier by 1 (max +3)",
  "Increase an ability modifier by 1 (max +3)",
  "Choose an additional move from your playbook",
  "Choose an additional move from your playbook",
  "Create a custom move for your character",
  "Choose one optional move from another playbook"
];
const ATTRIBUTES = ["might", "agility", "wits", "presence", "force"];
function outcome(total) {
  if (total <= 6) return { key: "complications", label: "Complications..." };
  if (total <= 9) return { key: "partial", label: "Partial success" };
  if (total <= 11) return { key: "success", label: "Success!" };
  return { key: "critical", label: "Critical Success!" };
}
class EODActor extends Actor {
  async _preUpdate(changed, options, user) {
    if (this.type === "character" && changed.system?.attributes) {
      for (const key of ATTRIBUTES) {
        if (!Object.prototype.hasOwnProperty.call(changed.system.attributes, key)) continue;
        const raw = changed.system.attributes[key];
        const numeric = Number(raw);
        changed.system.attributes[key] = Number.isFinite(numeric)
          ? Math.max(-2, Math.min(3, Math.trunc(numeric)))
          : Number(this.system.attributes?.[key] ?? 0);
      }
    }
    for (const key of ATTRIBUTES) {
      const dotted = `system.attributes.${key}`;
      if (!Object.prototype.hasOwnProperty.call(changed, dotted)) continue;
      const numeric = Number(changed[dotted]);
      changed[dotted] = Number.isFinite(numeric)
        ? Math.max(-2, Math.min(3, Math.trunc(numeric)))
        : Number(this.system.attributes?.[key] ?? 0);
    }
    return super._preUpdate(changed, options, user);
  }
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
      width: 760, height: 940, resizable: true,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "details" }]
    });
  }
  getData(options = {}) {
    const data = super.getData(options);
    data.attributes = ATTRIBUTES.map(key => ({ key, label: key[0].toUpperCase() + key.slice(1), value: this.actor.system.attributes?.[key] ?? 0 }));
    data.isCharacter = this.actor.type === "character";
    data.isNpc = this.actor.type === "npc";
    data.hasSpecies = ["character", "npc"].includes(this.actor.type);
    data.showHiddenAgenda = game.user.isGM || this.actor.isOwner;
    data.selectedPlaybook = this.actor.items.find(item => item.type === "playbook")?.name ?? "";
    data.playbookChoices = (game.packs.get("echoes-of-destiny.playbooks")?.index?.contents ?? []).map(item => ({id:item._id,name:item.name}));
    data.isVehicle = this.actor.type === "vehicle";
    data.hasActorTags = ["character", "npc", "vehicle", "location", "organization"].includes(this.actor.type);
    data.actorTags = (this.actor.system.tags ?? []).map((name, index) => ({index, name, exhausted: (this.actor.system.exhaustedTags ?? []).includes(index)}));
    data.isOrganization = this.actor.type === "organization";
    data.isLocation = this.actor.type === "location";
    if (data.isCharacter) {
      const reflection = this.actor.system.reflections ?? {};
      const selected = Array.isArray(reflection.selected) ? reflection.selected : [];
      data.reflectionQuestions = REFLECTION_QUESTIONS.map((question, index) => ({
        index, question, selected: selected.includes(index)
      }));
      data.reflectionCount = selected.length;
      const echoRecords = this.actor.system.echoes ?? {};
      const echoRows = (questions, records) => questions.map((question, index) => ({
        index, question, answer: records?.[index]?.answer ?? "",
        resolved: Boolean(records?.[index]?.resolved)
      }));
      data.pastEchoes = echoRows(PAST_ECHO_QUESTIONS, echoRecords.past);
      const playbook = this.actor.items.find(item => item.type === "playbook");
      data.destinyEchoes = echoRows(playbook?.system.echoQuestions ?? [], echoRecords.destiny);
      data.hasDestinyEchoes = data.destinyEchoes.length > 0;
      data.advancementRows = ADVANCEMENT_LABELS.map((label, index) => ({
        index, label, completed: Boolean(this.actor.system.advancements?.[index])
      }));
      data.xpBoxes = Array.from({length: 5}, (_, index) => ({
        index, checked: index < Number(this.actor.system.xp || 0)
      }));
    }
    const moveRows = this.actor.items.filter(i => i.type === "move").map(item => ({
      id: item.id, name: item.name,
      description: item.system.description || item.system.trigger || "",
      basic: item.system.category === "basic" || ["The Careful Move", "The Risky Move", "The Vulnerable Move"].includes(item.name)
    }));
    data.basicMoves = moveRows.filter(item => item.basic);
    data.playbookMoves = moveRows.filter(item => !item.basic);
    data.equipment = this.actor.items.filter(i => i.type === "equipment").map(item => ({
      id: item.id, name: item.name,
      tags: (item.system.tags ?? []).map((tag, index) => ({
        index, name: tag, exhausted: (item.system.exhaustedTags ?? []).includes(index)
      }))
    }));
    data.playbooks = this.actor.items.filter(i => i.type === "playbook");
    return data;
  }
  activateListeners(html) {
    super.activateListeners(html);
    html.find('input[name^="system.attributes."]').on("change", event => {
      const input = event.currentTarget;
      const value = Number(input.value);
      if (!Number.isFinite(value)) {
        const key = input.name.split(".").pop();
        input.value = this.actor.system.attributes?.[key] ?? 0;
      } else {
        input.value = Math.max(-2, Math.min(3, Math.trunc(value)));
      }
    });
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
    const advanceHandler = async event => {
      event.preventDefault();
      if (this.actor.type !== "character") return;
      const index = Number(event.currentTarget.dataset.advance);
      if (!Number.isInteger(index) || index < 0 || index >= ADVANCEMENT_LABELS.length) return;
      const used = [...(this.actor.system.advancements ?? Array(7).fill(false))];
      if (used[index]) return ui.notifications.warn("This advancement has already been taken.");
      if (Number(this.actor.system.xp ?? 0) < 5) return ui.notifications.warn("Five XP are required.");
      const esc = foundry.utils.escapeHTML;
      let change = null;
      if (index < 3) {
        const eligible = ATTRIBUTES.filter(key => Number(this.actor.system.attributes?.[key] ?? 0) < 3);
        if (!eligible.length) return ui.notifications.warn("All Attributes are at the maximum.");
        const choice = await Dialog.prompt({
          title: "Increase an Attribute",
          content: `<p>Spend 5 XP to increase one Attribute by +1 (maximum +3).</p><select name="attribute">${eligible.map(key => `<option value="${key}">${key}</option>`).join("")}</select>`,
          callback: html => html.find('[name="attribute"]').val()
        });
        if (!eligible.includes(choice)) return;
        change = {attribute: choice};
      } else if (index === 3 || index === 4 || index === 6) {
        const playbook = this.actor.items.find(item => item.type === "playbook");
        if (!playbook) return ui.notifications.warn("Choose a playbook first.");
        const pack = game.packs.get("echoes-of-destiny.playbook-moves");
        if (!pack) return ui.notifications.error("Playbook Moves compendium is missing.");
        let sourceIds;
        if (index === 6) {
          const otherPack = game.packs.get("echoes-of-destiny.playbooks");
          if (!otherPack) return ui.notifications.error("Playbooks compendium is missing.");
          const otherIndex = await otherPack.getIndex();
          const otherBooks = await Promise.all(otherIndex.contents.map(entry => otherPack.getDocument(entry._id)));
          sourceIds = otherBooks.filter(book => book && book.system.slug !== playbook.system.slug)
            .flatMap(book => book.system.optionalMoves ?? []);
        } else sourceIds = playbook.system.optionalMoves ?? [];
        const owned = new Set(this.actor.items.filter(item => item.type === "move")
          .map(item => item.getFlag("echoes-of-destiny", "sourceId")));
        const moveIndex = await pack.getIndex();
        const all = await Promise.all(moveIndex.contents.map(entry => pack.getDocument(entry._id)));
        const choices = all.filter(item => item && sourceIds.includes(item.getFlag("echoes-of-destiny", "sourceId"))
          && !owned.has(item.getFlag("echoes-of-destiny", "sourceId")));
        if (!choices.length) return ui.notifications.warn("No eligible unowned moves remain.");
        const selected = await Dialog.prompt({
          title: "Choose Advancement Move",
          content: `<p>Spend 5 XP to learn one move.</p><select name="move">${choices.map(item => `<option value="${item.id}">${esc(item.name)} — ${esc(item.system.playbook || "")}</option>`).join("")}</select>`,
          callback: html => html.find('[name="move"]').val()
        });
        const item = choices.find(item => item.id === selected);
        if (!item) return;
        change = {item};
      } else if (index === 5) {
        const name = await Dialog.prompt({
          title: "Create a Custom Move",
          content: '<p>Spend 5 XP to create a custom move. Refine its mechanics with the Director.</p><label>Move name <input name="move-name" type="text" required></label>',
          callback: html => html.find('[name="move-name"]').val()?.trim()
        });
        if (!name) return;
        change = {customName: name};
      }
      if (!change || Number(this.actor.system.xp ?? 0) < 5 || this.actor.system.advancements?.[index]) return;
      if (change.attribute && Number(this.actor.system.attributes[change.attribute]) >= 3) return;
      if (change.item && this.actor.items.some(item => item.getFlag("echoes-of-destiny", "sourceId") === change.item.getFlag("echoes-of-destiny", "sourceId"))) return;
      if (change.item) await this.actor.createEmbeddedDocuments("Item", [change.item.toObject()]);
      if (change.customName) await this.actor.createEmbeddedDocuments("Item", [{
        name: change.customName, type: "move", system: {category: "custom", description: "Work with the Director to define this move."}
      }]);
      const completed = [...(this.actor.system.advancements ?? Array(7).fill(false))];
      completed[index] = true;
      const update = {"system.xp": 0, "system.advancements": completed};
      if (change.attribute) update[`system.attributes.${change.attribute}`] = Number(this.actor.system.attributes[change.attribute]) + 1;
      await this.actor.update(update);
      ui.notifications.info("Advancement completed; 5 XP spent.");
      this.render();
    };
    html.find("[data-open-advancement]").on("click", event => {
      event.preventDefault();
      const rows = ADVANCEMENT_LABELS.map((label, index) => {
        const completed = Boolean(this.actor.system.advancements?.[index]);
        return `<div class="eod-advancement-row"><span>${completed ? "✓ " : ""}${foundry.utils.escapeHTML(label)}</span><button type="button" data-advance="${index}" ${completed ? "disabled" : ""}>${completed ? "Taken" : "Spend 5 XP"}</button></div>`;
      }).join("");
      const dialog = new Dialog({
        title: "Character Advancement",
        content: `<div class="eod-advancement-dialog"><p>Each advancement costs 5 XP and may be selected once. Current XP: ${Number(this.actor.system.xp ?? 0)}</p>${rows}</div>`,
        buttons: {close: {label: "Close"}},
        render: dialogHtml => {
          dialogHtml.find("[data-advance]").on("click", async click => {
            await advanceHandler(click);
            dialog.close();
          });
        }
      }, {width: 620, classes: ["eod-advancement-window"]});
      dialog.render(true);
    });
    html.find("[data-echo-record]").on("click", async event => {
      event.preventDefault();
      const group = event.currentTarget.dataset.echoRecord;
      const index = Number(event.currentTarget.dataset.echoIndex);
      if (!["past", "destiny"].includes(group) || !Number.isInteger(index) || index < 0 || index >= 6) return;
      const questions = group === "past" ? PAST_ECHO_QUESTIONS :
        (this.actor.items.find(item => item.type === "playbook")?.system.echoQuestions ?? []);
      if (!questions[index]) return;
      const records = [...(this.actor.system.echoes?.[group] ?? [])];
      if (records[index]?.resolved) return ui.notifications.warn("This Echo has already been resolved.");
      const answer = await Dialog.prompt({
        title: "Resolve Echo",
        content: `<p>${foundry.utils.escapeHTML(questions[index])}</p><p>Record the scene narrated during play:</p><textarea name="answer" rows="7" style="width:100%"></textarea>`,
        callback: html => html.find('[name="answer"]').val()?.trim() ?? ""
      });
      if (!answer) return;
      records[index] = {answer, resolved: true};
      await this.actor.update({[`system.echoes.${group}`]: records});
    });
    html.find("[data-echo-view]").on("click", async event => {
      event.preventDefault();
      const group = event.currentTarget.dataset.echoView;
      const index = Number(event.currentTarget.dataset.echoIndex);
      const record = this.actor.system.echoes?.[group]?.[index];
      if (!record?.resolved) return;
      await Dialog.prompt({
        title: "Resolved Echo",
        content: `<p style="white-space:pre-wrap">${foundry.utils.escapeHTML(record.answer)}</p>`,
        callback: () => true
      });
    });
    html.find("[data-edit-actor-tags]").on("click", async event => {
      event.preventDefault();
      if (!["character", "npc", "vehicle", "location", "organization"].includes(this.actor.type)) return;
      const esc = foundry.utils.escapeHTML;
      const old = this.actor.system.tags ?? [];
      const value = await Dialog.prompt({
        title: "Edit Tags",
        content: `<p>Enter tags separated by commas.</p><input name="tags" style="width:100%" value="${esc(old.join(", "))}">`,
        callback: html => html.find('[name="tags"]').val()
      });
      if (value === null || value === undefined) return;
      const tags = [...new Set(String(value).split(",").map(tag => tag.trim()).filter(Boolean))];
      const exhaustedNames = new Set((this.actor.system.exhaustedTags ?? []).map(index => old[index]));
      const exhaustedTags = tags.flatMap((tag, index) => exhaustedNames.has(tag) ? [index] : []);
      await this.actor.update({"system.tags": tags, "system.exhaustedTags": exhaustedTags});
    });
    html.find("[data-actor-tag-toggle]").on("click", async event => {
      event.preventDefault();
      if (!["character", "npc", "vehicle"].includes(this.actor.type)) return;
      const index = Number(event.currentTarget.dataset.actorTagToggle);
      if (!Number.isInteger(index) || index < 0 || index >= (this.actor.system.tags?.length ?? 0)) return;
      const exhausted = new Set(this.actor.system.exhaustedTags ?? []);
      if (exhausted.has(index)) exhausted.delete(index);
      else exhausted.add(index);
      await this.actor.update({"system.exhaustedTags": [...exhausted].sort((a,b) => a-b)});
    });
    html.find("[data-echo-unmark]").on("click", async event => {
      event.preventDefault();
      const group = event.currentTarget.dataset.echoUnmark;
      const index = Number(event.currentTarget.dataset.echoIndex);
      if (!["past", "destiny"].includes(group) || !Number.isInteger(index) || index < 0 || index >= 6) return;
      const records = [...(this.actor.system.echoes?.[group] ?? [])];
      if (!records[index]?.resolved) return;
      const confirmed = await Dialog.confirm({
        title: "Unmark Echo",
        content: "<p>Clear the recorded scene and return this Echo to its unresolved state?</p>"
      });
      if (!confirmed) return;
      records[index] = {answer: "", resolved: false};
      await this.actor.update({[`system.echoes.${group}`]: records});
    });
    html.find("[data-tag-toggle]").on("click", async event => {
      event.preventDefault();
      const item = this.actor.items.get(event.currentTarget.dataset.tagItem);
      const index = Number(event.currentTarget.dataset.tagToggle);
      if (item?.type !== "equipment" || !Number.isInteger(index) || index < 0 || index >= (item.system.tags?.length ?? 0)) return;
      const exhausted = new Set(item.system.exhaustedTags ?? []);
      if (exhausted.has(index)) exhausted.delete(index);
      else exhausted.add(index);
      await item.update({"system.exhaustedTags": [...exhausted].sort((a,b) => a-b)});
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
    html.find("[data-select-playbook]").on("change", async event => {
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
      const chosen = event.currentTarget.value;
      if (!chosen) return;
      const playbook = await pack.getDocument(chosen);
      if (!playbook) return;
      // Playbook grants +1 to its designated Attribute, AND the player
      // chooses an additional +1 to any Attribute (including the same one).
      // Both increases must respect the +3 cap.
      const playbookAttribute = playbook.system.abilityIncrease;
      if (!ATTRIBUTES.includes(playbookAttribute)) {
        return ui.notifications.error("Playbook has an invalid designated Attribute.");
      }
      const base = Object.fromEntries(ATTRIBUTES.map(key =>
        [key, Number(this.actor.system.attributes?.[key] ?? 0)]
      ));
      if (base[playbookAttribute] >= 3) {
        return ui.notifications.warn("The playbook's designated Attribute is already at +3.");
      }
      const afterPlaybook = {...base, [playbookAttribute]: base[playbookAttribute] + 1};
      const eligibleAttributes = ATTRIBUTES.filter(key => afterPlaybook[key] < 3);
      if (!eligibleAttributes.length) {
        return ui.notifications.warn("No Attribute can receive the additional +1 without exceeding +3.");
      }
      const attribute = await Dialog.prompt({
        title: "Additional Starting Attribute Increase",
        content: `<p>${foundry.utils.escapeHTML(playbook.name)} grants +1 to ${playbookAttribute[0].toUpperCase() + playbookAttribute.slice(1)}.</p>
          <p>Choose another +1 to any eligible Attribute. You may choose the playbook Attribute again if it remains below +3.</p>
          <select name="attribute">${eligibleAttributes.map(key =>
            `<option value="${key}">${key[0].toUpperCase() + key.slice(1)} (${afterPlaybook[key]} → ${afterPlaybook[key] + 1})</option>`
          ).join("")}</select>`,
        callback: html => html.find('[name="attribute"]').val()
      });
      if (!eligibleAttributes.includes(attribute)) return;
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
      const increases = {[playbookAttribute]: afterPlaybook[playbookAttribute]};
      increases[attribute] = afterPlaybook[attribute] + 1;
      await this.actor.update({system: {attributes: {...base, ...increases}}});
      ui.notifications.info(`${playbook.name} selected; starting moves granted.`);
    });
    html.find("[data-playbook-init]").on("click", async event => {
      event.preventDefault();
      const pack = game.packs.get("echoes-of-destiny.playbooks");
      if (!pack) return ui.notifications.error("Playbooks compendium is missing.");
      await pack.getIndex();
      this.render();
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
    data.equipmentTagText = (this.item.system.tags ?? []).join(", ");
    return data;
  }
  activateListeners(html) {
    super.activateListeners(html);
    html.find("[data-save-tags]").on("click", async event => {
      event.preventDefault();
      const tags = [...new Set((html.find('[name="tag-list"]').val() ?? "")
        .split(",").map(tag => tag.trim()).filter(Boolean))];
      const old = this.item.system.tags ?? [];
      const exhaustedNames = new Set((this.item.system.exhaustedTags ?? []).map(index => old[index]));
      const exhaustedTags = tags.flatMap((tag, index) => exhaustedNames.has(tag) ? [index] : []);
      await this.item.update({"system.tags": tags, "system.exhaustedTags": exhaustedTags});
      ui.notifications.info("Equipment tags saved.");
    });
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

Hooks.once("ready", async () => {
  const pack = game.packs.get("echoes-of-destiny.playbooks");
  if (pack) {
    try { await pack.getIndex(); }
    catch (error) { console.warn("Echoes of Destiny | Unable to preload playbook choices", error); }
  }
});
