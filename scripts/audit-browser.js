import http from "node:http";

const DEFAULT_CDP_URL = "http://127.0.0.1:9226";
const DEFAULT_APP_URL = "http://127.0.0.1:5177/";
const VIEWPORTS = [320, 375, 390, 414, 430, 768, 1024, 1280, 1440, 1920];

const cdpUrl = process.env.CDP_URL ?? DEFAULT_CDP_URL;
const appUrl = process.env.APP_URL ?? DEFAULT_APP_URL;
const resetProjectAfterQa = process.env.RESET_PROJECT_AFTER_QA === "1";
const storageKey = "boothbuilder/project-v4-reference-exact";

function readJson(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (response) => {
        let body = "";
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function connectToPage() {
  const targets = await readJson(`${cdpUrl}/json`);
  const page = targets.find((target) => target.type === "page");
  if (!page) throw new Error(`No Chrome page target was found at ${cdpUrl}.`);

  const socket = new WebSocket(page.webSocketDebuggerUrl);
  const pending = new Map();
  const events = [];
  let sequence = 0;

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const request = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
      return;
    }
    if (message.method) events.push(message);
  });

  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  const call = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++sequence;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });

  return { socket, events, call };
}

async function evaluate(call, expression) {
  const response = await call("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.text ?? "Browser evaluation failed.");
  }
  return response.result.value;
}

async function waitForReady(call) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const ready = await evaluate(
      call,
      `document.readyState === "complete" && Boolean(document.querySelector(".studio-shell"))`,
    );
    if (ready) {
      await delay(600);
      return;
    }
    await delay(100);
  }
  throw new Error("The Spatial Studio shell did not become ready.");
}

async function waitForValue(call, expression, timeout = 5000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await evaluate(call, expression);
    if (value) return value;
    await delay(100);
  }
  return false;
}

async function setViewport(call, width) {
  await call("Emulation.setDeviceMetricsOverride", {
    width,
    height: width <= 430 ? 900 : 960,
    deviceScaleFactor: 1,
    mobile: width <= 430,
  });
  await call("Page.navigate", { url: appUrl });
  await waitForReady(call);
}

async function auditViewport(call, width) {
  await setViewport(call, width);
  return evaluate(
    call,
    `(() => {
      const root = document.documentElement;
      const interactiveSelector = [
        "button:not([disabled])",
        "a[href]",
        "input:not([disabled])",
        "select:not([disabled])",
        "summary",
        '[role="button"]:not([aria-disabled="true"])',
      ].join(",");
      const visible = (element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          !element.closest("details:not([open])")
        );
      };
      const label = (element) =>
        (element.getAttribute("aria-label") || element.title || element.textContent || element.value || element.tagName)
          .trim()
          .replace(/\\s+/g, " ")
          .slice(0, 60);
      const interactive = [...document.querySelectorAll(interactiveSelector)].filter(visible);
      const intentionallyScrollable = (element) => {
        let ancestor = element.parentElement;
        while (ancestor && ancestor !== document.body) {
          const style = getComputedStyle(ancestor);
          if (["auto", "scroll"].includes(style.overflowX) && ancestor.scrollWidth > ancestor.clientWidth) return true;
          ancestor = ancestor.parentElement;
        }
        return false;
      };
      const clipped = interactive
        .map((element) => ({ element, rect: element.getBoundingClientRect() }))
        .filter(({ element, rect }) => (rect.left < -1 || rect.right > innerWidth + 1) && !intentionallyScrollable(element))
        .map(({ element, rect }) => ({ label: label(element), left: Math.round(rect.left), right: Math.round(rect.right) }));
      const undersized = interactive
        .map((element) => ({ element, rect: element.getBoundingClientRect() }))
        .filter(({ element, rect }) => element.type !== "range" && !element.readOnly && (rect.width < 44 || rect.height < 44))
        .map(({ element, rect }) => ({ label: label(element), width: Math.round(rect.width), height: Math.round(rect.height) }));
      const canvas = document.querySelector("canvas");
      const canvasRect = canvas?.getBoundingClientRect();
      return {
        width: innerWidth,
        documentWidth: root.scrollWidth,
        horizontalOverflow: root.scrollWidth > innerWidth + 1,
        clipped,
        undersized,
        hasCanvas: Boolean(canvas),
        canvasSize: canvasRect ? [Math.round(canvasRect.width), Math.round(canvasRect.height)] : null,
        hasViteOverlay: Boolean(document.querySelector("vite-error-overlay")),
      };
    })()`,
  );
}

async function exerciseEditor(call, events) {
  await setViewport(call, 1440);
  const result = {
    spaceTypes: 0,
    templates: 0,
    addedAsset: false,
    libraryToggle: false,
    floorPlanMode: false,
    gridToggle: false,
    arModal: false,
    profilePopover: false,
    allAssetsRendered: false,
    assetsRendered: 0,
    shareAction: false,
    exportAction: false,
  };

  const spaceTypes = await evaluate(
    call,
    `[...document.querySelectorAll('.studio-projectbar select[aria-label="Space type"] option')].map((option) => option.value)`,
  );
  for (const spaceType of spaceTypes) {
    await evaluate(
      call,
      `(() => { const select = document.querySelector('.studio-projectbar select[aria-label="Space type"]'); select.value = ${JSON.stringify(spaceType)}; select.dispatchEvent(new Event("change", { bubbles: true })); })()`,
    );
    await delay(120);
    result.spaceTypes += 1;

    const templates = await evaluate(
      call,
      `[...document.querySelectorAll('.studio-projectbar select[aria-label="Starting layout"] option')].map((option) => option.value).filter((value) => value !== "custom")`,
    );
    for (const template of templates) {
      await evaluate(
        call,
        `(() => { const select = document.querySelector('.studio-projectbar select[aria-label="Starting layout"]'); select.value = ${JSON.stringify(template)}; select.dispatchEvent(new Event("change", { bubbles: true })); })()`,
      );
      await delay(90);
      result.templates += 1;
    }
  }

  const renderedAssets = new Set();
  for (const spaceType of spaceTypes) {
    await evaluate(
      call,
      `(() => { const select = document.querySelector('.studio-projectbar select[aria-label="Space type"]'); select.value = ${JSON.stringify(spaceType)}; select.dispatchEvent(new Event("change", { bubbles: true })); })()`,
    );
    await delay(120);
    const cards = await evaluate(
      call,
      `[...document.querySelectorAll(".component-card")].map((card) => ({ name: card.querySelector("strong")?.textContent, title: card.title }))`,
    );
    for (const card of cards) {
      if (!card.name || renderedAssets.has(card.name)) continue;
      const clicked = await evaluate(
        call,
        `(() => { const card = [...document.querySelectorAll(".component-card")].find((button) => button.title === ${JSON.stringify(card.title)}); card?.click(); return Boolean(card); })()`,
      );
      await delay(80);
      const selectedName = await evaluate(call, `document.querySelector('.inspector-field input')?.value`);
      if (clicked && selectedName === card.name) renderedAssets.add(card.name);
    }
  }
  result.assetsRendered = renderedAssets.size;
  result.allAssetsRendered = renderedAssets.size === 33;

  await evaluate(
    call,
    `(() => { const select = document.querySelector('.studio-projectbar select[aria-label="Space type"]'); select.value = "office"; select.dispatchEvent(new Event("change", { bubbles: true })); })()`,
  );
  await delay(200);
  result.addedAsset = await evaluate(
    call,
    `(() => { const card = [...document.querySelectorAll(".component-card")].find((button) => button.textContent.includes("Work Desk")); if (!card) return false; card.click(); return true; })()`,
  );
  await delay(150);
  result.addedAsset =
    result.addedAsset &&
    (await evaluate(call, `document.querySelector('.inspector-field input')?.value === "Work Desk"`));

  result.libraryToggle = await evaluate(
    call,
    `(() => { const close = document.querySelector('button[aria-label="Hide component library"]'); close?.click(); return Boolean(close); })()`,
  );
  await delay(100);
  result.libraryToggle =
    result.libraryToggle && (await evaluate(call, `document.querySelector(".studio-workspace")?.classList.contains("is-library-collapsed")`));
  await evaluate(call, `document.querySelector('button[aria-label="Open component library"]')?.click()`);

  await evaluate(
    call,
    `([...document.querySelectorAll(".studio-mode-tabs button")].find((button) => button.textContent.includes("Floor Plan")))?.click()`,
  );
  await delay(100);
  result.floorPlanMode = await evaluate(
    call,
    `Boolean(document.querySelector(".studio-mode-panel")) && document.querySelector('.studio-mode-tabs button.is-active')?.textContent.includes("Floor Plan")`,
  );

  const gridBefore = await evaluate(call, `document.querySelector('.studio-bottombar button:nth-child(3)')?.textContent`);
  await evaluate(call, `document.querySelector('.studio-bottombar button:nth-child(3)')?.click()`);
  const gridAfter = await evaluate(call, `document.querySelector('.studio-bottombar button:nth-child(3)')?.textContent`);
  result.gridToggle = gridBefore !== gridAfter;

  await evaluate(call, `document.querySelector(".studio-actions .outline-action")?.click()`);
  result.arModal = Boolean(
    await waitForValue(call, `Boolean(document.querySelector('[role="dialog"].modal-backdrop'))`),
  );
  await evaluate(call, `document.querySelector('[role="dialog"] button[aria-label="Close AR panel"]')?.click()`);
  await delay(80);
  result.arModal = result.arModal && (await evaluate(call, `!document.querySelector('[role="dialog"].modal-backdrop')`));

  await evaluate(call, `document.querySelector('summary[aria-label="Workspace profile"]')?.click()`);
  result.profilePopover = await evaluate(call, `Boolean(document.querySelector('.top-popover--profile[open]'))`);

  await evaluate(
    call,
    `([...document.querySelectorAll(".studio-actions .outline-action")].find((button) => button.textContent.trim() === "Share"))?.click()`,
  );
  await delay(120);
  result.shareAction = await evaluate(
    call,
    `([...document.querySelectorAll(".studio-actions .outline-action")].some((button) => ["Copied", "Copy failed"].includes(button.textContent.trim())))`,
  );

  const downloadsBefore = events.filter((event) => event.method === "Page.downloadWillBegin").length;
  await evaluate(call, `document.querySelector(".export-action")?.click()`);
  await delay(150);
  result.exportAction = events.filter((event) => event.method === "Page.downloadWillBegin").length > downloadsBefore;

  return result;
}

async function main() {
  const { socket, events, call } = await connectToPage();
  let savedProject;
  try {
    await call("Runtime.enable");
    await call("Page.enable");
    await call("Log.enable");
    await call("Page.navigate", { url: appUrl });
    await waitForReady(call);
    savedProject = await evaluate(call, `window.localStorage.getItem(${JSON.stringify(storageKey)})`);

    const viewportResults = [];
    for (const width of VIEWPORTS) viewportResults.push(await auditViewport(call, width));
    const editorResult = await exerciseEditor(call, events);

    const runtimeErrors = events
      .filter((event) => event.method === "Runtime.exceptionThrown" || event.method === "Log.entryAdded")
      .filter((event) => event.method === "Runtime.exceptionThrown" || ["error", "warning"].includes(event.params.entry?.level))
      .map((event) => event.params.exceptionDetails?.text ?? event.params.entry?.text ?? event.method)
      .filter((message) => !message.includes("GPU stall due to ReadPixels"));

    process.stdout.write(`${JSON.stringify({ viewportResults, editorResult, runtimeErrors }, null, 2)}\n`);

    const failedViewport = viewportResults.some(
      (result) =>
        result.horizontalOverflow ||
        result.clipped.length ||
        result.undersized.length ||
        !result.hasCanvas ||
        result.hasViteOverlay,
    );
    const failedInteraction = Object.values(editorResult).some((value) => value === false || value === 0);
    if (failedViewport || failedInteraction || runtimeErrors.length) process.exitCode = 1;
  } finally {
    if (savedProject !== undefined) {
      if (resetProjectAfterQa || savedProject === null) {
        await evaluate(call, `window.localStorage.removeItem(${JSON.stringify(storageKey)})`);
      } else {
        await evaluate(
          call,
          `window.localStorage.setItem(${JSON.stringify(storageKey)}, ${JSON.stringify(savedProject)})`,
        );
      }
      await call("Page.navigate", { url: appUrl });
      await waitForReady(call);
    }
    socket.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
