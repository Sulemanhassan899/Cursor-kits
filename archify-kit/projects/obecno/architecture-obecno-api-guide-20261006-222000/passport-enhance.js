/* Injects APIs + bottom-sheets into Archify's Semantic Passport card. */
(function () {
  if (window.__OBECNO_PASSPORT_ENHANCED__) return;
  window.__OBECNO_PASSPORT_ENHANCED__ = true;

  var STYLE_ID = "obecno-passport-enhance-style";
  var PANEL_ID = "obecno-api-panel";

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      "#" + PANEL_ID + "{margin-top:12px;padding-top:10px;border-top:1px solid rgba(148,163,184,.28);display:grid;gap:10px;max-width:min(420px,72vw);}",
      "#" + PANEL_ID + "[hidden]{display:none!important;}",
      "#" + PANEL_ID + " .obecno-sec{display:grid;gap:6px;}",
      "#" + PANEL_ID + " .obecno-sec-title{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#93a1b0;font-weight:700;}",
      "#" + PANEL_ID + " .obecno-purpose{font-size:12.5px;line-height:1.45;color:#e8eef4;}",
      "#" + PANEL_ID + " .obecno-row{border:1px solid rgba(94,177,255,.28);background:rgba(15,23,32,.72);border-radius:10px;padding:8px 10px;display:grid;gap:4px;}",
      "#" + PANEL_ID + " .obecno-row code{font-size:11.5px;color:#7dd3fc;word-break:break-all;}",
      "#" + PANEL_ID + " .obecno-row strong{font-size:10px;letter-spacing:.04em;text-transform:uppercase;color:#5eead4;}",
      "#" + PANEL_ID + " .obecno-row span{font-size:12px;line-height:1.4;color:#cbd5e1;}",
      "#" + PANEL_ID + " .obecno-empty{font-size:12px;color:#94a3b8;font-style:italic;}",
      "#" + PANEL_ID + " .obecno-note{font-size:11.5px;line-height:1.4;color:#a5b4c4;}"
    ].join("");
    document.head.appendChild(style);
  }

  function ensurePanel() {
    var existing = document.getElementById(PANEL_ID);
    if (existing) return existing;
    var copy = document.querySelector(".relationship-lens-copy");
    if (!copy) return null;
    var panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.hidden = true;
    var reach = document.getElementById("focus-reach");
    if (reach && reach.parentNode === copy) {
      copy.insertBefore(panel, reach.nextSibling);
    } else {
      copy.appendChild(panel);
    }
    return panel;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderApiRows(apis) {
    if (!apis || !apis.length) {
      return '<div class="obecno-empty">No remote API for this screen (local UI / navigation only).</div>';
    }
    return apis
      .map(function (a) {
        return (
          '<div class="obecno-row">' +
          "<strong>" +
          esc(a.method || "API") +
          "</strong>" +
          "<code>" +
          esc(a.path || "") +
          "</code>" +
          "<span>" +
          esc(a.purpose || "") +
          "</span>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderSheetRows(sheets) {
    if (!sheets || !sheets.length) {
      return '<div class="obecno-empty">No bottom sheets opened from this screen.</div>';
    }
    return sheets
      .map(function (s) {
        return (
          '<div class="obecno-row">' +
          "<strong>Sheet</strong>" +
          "<code>" +
          esc(s.name || "") +
          "</code>" +
          "<span>" +
          esc(s.purpose || "") +
          "</span>" +
          "</div>"
        );
      })
      .join("");
  }

  function update() {
    ensureStyle();
    var chip = document.getElementById("focus-chip");
    var idEl = document.getElementById("focus-id");
    var panel = ensurePanel();
    if (!panel) return;

    if (!chip || chip.hidden || !idEl || !idEl.textContent) {
      panel.hidden = true;
      panel.innerHTML = "";
      return;
    }

    var id = idEl.textContent.trim();
    var catalog = window.OBECNO_SCREEN_CATALOG || {};
    var data = catalog[id];
    if (!data) {
      panel.hidden = true;
      panel.innerHTML = "";
      return;
    }

    panel.hidden = false;
    panel.innerHTML =
      '<div class="obecno-sec"><div class="obecno-sec-title">Purpose</div>' +
      '<div class="obecno-purpose">' +
      esc(data.purpose || "") +
      "</div></div>" +
      '<div class="obecno-sec"><div class="obecno-sec-title">APIs this screen uses</div>' +
      renderApiRows(data.apis) +
      "</div>" +
      '<div class="obecno-sec"><div class="obecno-sec-title">Bottom sheets</div>' +
      renderSheetRows(data.sheets) +
      "</div>" +
      (data.notes
        ? '<div class="obecno-sec"><div class="obecno-sec-title">Notes</div><div class="obecno-note">' +
          esc(data.notes) +
          "</div></div>"
        : "");
  }

  function bind() {
    var chip = document.getElementById("focus-chip");
    var idEl = document.getElementById("focus-id");
    if (!chip || !idEl) {
      setTimeout(bind, 200);
      return;
    }
    var obs = new MutationObserver(update);
    obs.observe(chip, { attributes: true, attributeFilter: ["hidden", "class"] });
    obs.observe(idEl, { childList: true, characterData: true, subtree: true });
    document.addEventListener("click", function () {
      setTimeout(update, 0);
    });
    update();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
