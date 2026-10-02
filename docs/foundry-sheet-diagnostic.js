(() => {
  const root = [...document.querySelectorAll(".window-content")]
    .find(el => el.querySelector('[name="system.attributes.condition1.value"]'));
  if (!root) return { error: "Open the character sheet and run again." };

  const describe = el => ({
    tag: el.tagName,
    class: typeof el.className === "string" ? el.className : "",
    id: el.id || "",
    name: el.getAttribute("name"),
    children: [...el.children].map(child => ({
      tag: child.tagName,
      class: typeof child.className === "string" ? child.className : "",
      tab: child.dataset?.tab || "",
      group: child.dataset?.group || ""
    }))
  });

  const field = root.querySelector('[name="system.attributes.condition1.value"]');
  const conditionAncestors = [];
  for (let el = field, depth = 0; el && el !== root && depth < 8; el = el.parentElement, depth++) {
    conditionAncestors.push(describe(el));
  }

  const top = root.querySelector(".sheet-attributes-top");
  const nav = root.querySelector(".sheet-tabs.tabs");
  const body = root.querySelector(".sheet-body");

  return {
    top: top ? describe(top) : null,
    conditionAncestors,
    tabNavigation: nav ? {
      ...describe(nav),
      links: [...nav.querySelectorAll("[data-tab]")].map(el => ({
        text: el.textContent.trim(),
        tab: el.dataset.tab,
        group: el.dataset.group,
        class: el.className
      }))
    } : null,
    tabPanes: body ? [...body.querySelectorAll(".tab")].map(describe) : null
  };
})()
