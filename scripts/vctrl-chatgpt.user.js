// ==UserScript==
// @name         VCTRL — ChatGPT Logger
// @namespace    https://github.com/vctrl
// @version      1.0.1
// @description  Log ChatGPT conversations to your VCTRL knowledge base
// @author       VCTRL
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      supabase.co
// @connect      *
// ==/UserScript==

(function () {
  "use strict";

  const ENDPOINT = GM_getValue(
    "vctrl_endpoint",
    "https://rqllybmpigqeydscigxb.supabase.co/functions/v1/ingest-chatgpt"
  );
  const TOKEN = GM_getValue(
    "vctrl_token",
    "E7FPAkHhdrpcKtMYisRqN5TBv9e6m3QwXz1JljDLWGyOnIxSuCo042VfZb8gaU"
  );

  const EVENT_TYPES = [
    "log",
    "insight",
    "decision",
    "feedback",
    "blocker",
    "bug_note",
    "update",
    "reference",
  ];

  const CATEGORIES  = ['chat_log','general','product_decision','bug','auth_oauth','launch_blocker','beta_feedback','competitor_insight','pricing','roadmap','app_store','marketing'];

  function debug(...args) {
    console.log("[VCTRL Logger]", ...args);
  }

  function extractConversation() {
    const titleEl =
      document.querySelector('[aria-current="page"] .truncate') ||
      document.querySelector("nav li.active .truncate");

    let title =
      (titleEl ? (titleEl.textContent || "").trim() : "") ||
      document.title.replace(" - ChatGPT", "").trim();

    if (!title || title === "ChatGPT") {
      title = "ChatGPT Conversation — " + new Date().toLocaleDateString();
    }

    let messageEls = document.querySelectorAll("[data-message-author-role]");
    const messages = [];

    messageEls.forEach((el) => {
      const role = el.getAttribute("data-message-author-role") || "unknown";
      const proseEl = el.querySelector(".prose, .markdown, [class*='prose']");
      const text = (proseEl ? proseEl.textContent : el.textContent || "").trim();

      if (text) {
        messages.push({
          role: role === "user" ? "USER" : "ASSISTANT",
          text,
        });
      }
    });

    if (messages.length === 0) {
      document.querySelectorAll("article").forEach((el) => {
        const text = (el.textContent || "").trim();
        if (text.length > 10) {
          messages.push({ role: "UNKNOWN", text });
        }
      });
    }

    if (messages.length === 0) return null;

    const sep = "\n\n" + "─".repeat(40) + "\n\n";
    const rawText = messages
      .map((m) => `${m.role}:\n${m.text}`)
      .join(sep);

    const firstAssistant = messages.find((m) => m.role === "ASSISTANT");
    const summary = firstAssistant ? firstAssistant.text.slice(0, 400) : undefined;

    return {
      title,
      raw_text: rawText,
      summary,
      msgCount: messages.length,
    };
  }

  function injectStyles() {
    if (document.getElementById("vctrl-styles")) return;

    const style = document.createElement("style");
    style.id = "vctrl-styles";
    style.textContent = [
      "#vctrl-fab{position:fixed;bottom:24px;right:24px;z-index:9998;background:#18181b;border:1px solid #3f3f46;color:#e4e4e7;padding:8px 14px;border-radius:8px;font-size:12px;font-family:monospace;cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(0,0,0,.5);}",
      "#vctrl-fab:hover{background:#27272a;}",
      "#vctrl-fab .dot{width:6px;height:6px;border-radius:50%;background:#22c55e;}",
      "#vctrl-overlay{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;}",
      "#vctrl-modal{background:#18181b;border:1px solid #3f3f46;border-radius:12px;padding:24px;width:420px;max-width:90vw;font-family:system-ui,sans-serif;color:#e4e4e7;}",
      "#vctrl-modal h2{margin:0 0 4px;font-size:14px;font-weight:600;color:#f4f4f5;}",
      "#vctrl-modal .sub{margin:0 0 16px;font-size:12px;color:#71717a;}",
      "#vctrl-modal label{display:block;font-size:11px;font-weight:500;color:#a1a1aa;margin:12px 0 4px;}",
      "#vctrl-modal input,#vctrl-modal select{width:100%;box-sizing:border-box;background:#09090b;border:1px solid #3f3f46;border-radius:6px;color:#e4e4e7;padding:6px 8px;font-size:12px;outline:none;}",
      "#vctrl-modal input:focus,#vctrl-modal select:focus{border-color:#6366f1;}",
      "#vctrl-modal .row{display:flex;gap:8px;}",
      "#vctrl-modal .row>*{flex:1;}",
      "#vctrl-modal .actions{display:flex;gap:8px;justify-content:flex-end;margin-top:20px;}",
      "#vctrl-btn-cancel{background:transparent;border:1px solid #3f3f46;color:#a1a1aa;padding:7px 14px;border-radius:6px;font-size:12px;cursor:pointer;}",
      "#vctrl-btn-cancel:hover{background:#27272a;}",
      "#vctrl-btn-log{background:#6366f1;border:none;color:#fff;padding:7px 16px;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;}",
      "#vctrl-btn-log:hover{background:#4f46e5;}",
      "#vctrl-btn-log:disabled{background:#3f3f46;cursor:not-allowed;}",
      "#vctrl-status{margin-top:10px;font-size:12px;text-align:center;min-height:16px;}",
    ].join("\n");

    document.head.appendChild(style);
  }

  function closeModal() {
    const el = document.getElementById("vctrl-overlay");
    if (el) el.remove();
  }

  function setStatus(msg, color) {
    const el = document.getElementById("vctrl-status");
    if (el) {
      el.textContent = msg;
      el.style.color = color || "#a1a1aa";
    }
  }

  function buildSelect(id, options, defaultVal) {
    return (
      `<select id="${id}">` +
      options
        .map(
          (o) =>
            `<option value="${o}"${o === defaultVal ? " selected" : ""}>${o}</option>`
        )
        .join("") +
      `</select>`
    );
  }

  function showModal(conv) {
    if (document.getElementById("vctrl-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "vctrl-overlay";
    overlay.innerHTML =
      `<div id="vctrl-modal">` +
      `<h2>Log to VCTRL</h2>` +
      `<p class="sub">${conv.msgCount} message(s) &bull; ${new Date().toLocaleDateString()}</p>` +
      `<label>Title</label><input id="vctrl-title" type="text" />` +
      `<div class="row">` +
      `<div><label>Event type</label>${buildSelect("vctrl-type", EVENT_TYPES, "log")}</div>` +
      `<div><label>Category</label>${buildSelect("vctrl-cat", CATEGORIES, "engineering")}</div>` +
      `</div>` +
      `<label>Tags (comma-separated)</label><input id="vctrl-tags" type="text" value="chatgpt" />` +
      `<div class="actions">` +
      `<button id="vctrl-btn-cancel">Cancel</button>` +
      `<button id="vctrl-btn-log">Log to VCTRL</button>` +
      `</div>` +
      `<div id="vctrl-status"></div>` +
      `</div>`;

    document.body.appendChild(overlay);
    document.getElementById("vctrl-title").value = conv.title;

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });

    document.getElementById("vctrl-btn-cancel").addEventListener("click", closeModal);
    document.getElementById("vctrl-btn-log").addEventListener("click", () => submitLog(conv));
  }

  function submitLog(conv) {
    const titleEl = document.getElementById("vctrl-title");
    const typeEl = document.getElementById("vctrl-type");
    const catEl = document.getElementById("vctrl-cat");
    const tagsEl = document.getElementById("vctrl-tags");
    const submitEl = document.getElementById("vctrl-btn-log");

    const title = (titleEl && titleEl.value.trim()) || conv.title;
    const tags = (tagsEl ? tagsEl.value : "chatgpt")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title,
      raw_text: conv.raw_text,
      summary: conv.summary,
      event_type: typeEl ? typeEl.value : "log",
      category: catEl ? catEl.value : "engineering",
      severity: "info",
      source_url: window.location.href,
      source_name: "ChatGPT",
      tags,
      event_timestamp: new Date().toISOString(),
    };

    if (submitEl) {
      submitEl.disabled = true;
      submitEl.textContent = "Logging...";
    }

    setStatus("Sending to VCTRL...");

    GM_xmlhttpRequest({
      method: "POST",
      url: ENDPOINT,
      headers: {
        "Content-Type": "application/json",
        "x-ingest-token": TOKEN,
      },
      data: JSON.stringify(payload),
      onload: function (res) {
        if (res.status >= 200 && res.status < 300) {
          let data = {};
          try {
            data = JSON.parse(res.responseText);
          } catch {}

          setStatus("Logged! Event: " + (data.eventId || "ok"), "#22c55e");
          if (submitEl) submitEl.textContent = "Done!";
          setTimeout(closeModal, 1500);
        } else {
          let errMsg = "Error " + res.status;
          try {
            const parsed = JSON.parse(res.responseText);
            errMsg += ": " + (parsed.error || parsed.message || res.responseText.slice(0, 120));
          } catch { errMsg += ": " + res.responseText.slice(0, 120); }
          setStatus(errMsg, "#ef4444");
          if (submitEl) {
            submitEl.disabled = false;
            submitEl.textContent = "Log to VCTRL";
          }
        }
      },
      onerror: function () {
        setStatus("Network error — check ENDPOINT and auth", "#ef4444");
        if (submitEl) {
          submitEl.disabled = false;
          submitEl.textContent = "Log to VCTRL";
        }
      },
    });
  }

  function injectFAB() {
    if (document.getElementById("vctrl-fab")) return;

    injectStyles();

    const btn = document.createElement("button");
    btn.id = "vctrl-fab";
    btn.innerHTML = '<span class="dot"></span> Log to VCTRL';
    btn.addEventListener("click", function () {
      const conv = extractConversation();
      if (!conv) {
        alert("VCTRL: No conversation messages found on this page.");
        return;
      }
      showModal(conv);
    });

    document.body.appendChild(btn);
    debug("FAB injected");
  }

  let lastUrl = location.href;

  const observer = new MutationObserver(function () {
    injectFAB();

    if (location.href !== lastUrl) {
      lastUrl = location.href;
      closeModal();
      debug("URL changed", lastUrl);
    }
  });

  function init() {
    alert("VCTRL logger loaded");
    debug("Init running", location.href);
    injectFAB();

    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
      debug("Observer started");
    } else {
      debug("document.body not ready");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    setTimeout(init, 1500);
  }
})();