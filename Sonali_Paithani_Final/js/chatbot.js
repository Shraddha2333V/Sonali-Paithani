/**
 * SONALI PAITHANI — Conversational AI Stylist & Store Assistant
 * -------------------------------------------------------------
 * Fully integrated with backend POST /api/stylist/chat & /recommend
 * Handles conversational inquiries (e.g. "hii", "where is your shop",
 * "pricing", "authenticity") as well as guided saree recommendation flows.
 */

(function () {
  const state = { occasion: null, budget: null, color: null };

  const budgetRanges = {
    "Under ₹15k": [0, 15000],
    "₹15k–₹35k": [15000, 35000],
    "₹35k–₹60k": [35000, 60000],
    "₹60k+": [60000, Infinity],
  };

  function score(saree) {
    let s = 0;
    if (state.occasion && saree.occasion.includes(state.occasion)) s += 3;
    if (state.budget) {
      const [lo, hi] = budgetRanges[state.budget] || [0, Infinity];
      if (saree.price >= lo && saree.price <= hi) s += 2;
      else s -= 1;
    }
    if (state.color && saree.color === state.color) s += 2;
    return s;
  }

  function recommend() {
    if (typeof SAREES === "undefined") return [];
    return SAREES.map((s) => ({ saree: s, score: score(s) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((r) => r.saree);
  }

  function reasonFor(saree) {
    const bits = [];
    if (state.occasion && saree.occasion.includes(state.occasion)) {
      bits.push((typeof OCCASION_GUIDE !== "undefined" && OCCASION_GUIDE[state.occasion]?.note) || "a strong match for the occasion");
    }
    if (state.color && saree.color === state.color) bits.push(`in the ${state.color} tones you asked for`);
    return bits.length ? bits.join(", ") : "a versatile handloom pick from our loom";
  }

  /* ---------------- DOM plumbing ---------------- */
  let body, launcher, panel;

  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstChild;
  }

  function addBotMessage(text) {
    body.appendChild(el(`<div class="msg msg-bot">${text}</div>`));
    scrollDown();
  }

  function addUserMessage(text) {
    body.appendChild(el(`<div class="msg msg-user">${text}</div>`));
    scrollDown();
  }

  function showTypingIndicator() {
    removeTypingIndicator();
    const ind = el(`<div class="msg msg-bot msg-typing" id="chat-typing"><span></span><span></span><span></span></div>`);
    body.appendChild(ind);
    scrollDown();
  }

  function removeTypingIndicator() {
    const ind = document.getElementById("chat-typing");
    if (ind) ind.remove();
  }

  function addChoices(options, onPick) {
    if (!options || !options.length) return;
    const wrap = el(`<div class="msg-choices"></div>`);
    options.forEach((opt) => {
      const b = el(`<button type="button">${opt}</button>`);
      b.addEventListener("click", () => {
        wrap.remove();
        onPick(opt);
      });
      wrap.appendChild(b);
    });
    body.appendChild(wrap);
    scrollDown();
  }

  function scrollDown() {
    body.scrollTop = body.scrollHeight;
  }

  function addRecommendations(items) {
    if (!items || !items.length) return;
    const wrap = el(`<div class="chat-reco"></div>`);
    items.forEach((p) => {
      const swatchGradient = p.swatch ? `linear-gradient(155deg, ${p.swatch[0]}, ${p.swatch[1]})` : '#6B1E2B';
      const card = el(`
        <a class="reco-card" href="product.html?id=${p.id}">
          <div class="reco-swatch" style="background:${swatchGradient}"></div>
          <div class="reco-info">
            <strong>${p.name}</strong>
            <span>${p.recommendationReason || reasonFor(p)}</span>
            <span class="reco-price">₹${Number(p.price).toLocaleString("en-IN")}</span>
          </div>
        </a>
      `);
      wrap.appendChild(card);
    });
    body.appendChild(wrap);
    scrollDown();
  }

  /* ---------------- Main Conversation & Guided Flows ---------------- */
  function startFlow() {
    body.innerHTML = "";
    addBotMessage(
      `Namaste! 🙏 I'm your <strong>Sonali Paithani</strong> personal assistant & stylist.<br><br>How can I help you today? Feel free to ask me anything (like <em>"hii"</em>, <em>"where is your shop"</em>, or <em>"what is your price range"</em>), or choose an option below:`
    );
    addChoices(
      ["Find a Saree", "Bridal Collection", "Shop Location", "What are the prices?"],
      (choice) => handleChoice(choice)
    );
  }

  function askOccasion() {
    addBotMessage("What's the occasion for the saree?");
    const options = typeof OCCASION_GUIDE !== "undefined"
      ? Object.values(OCCASION_GUIDE).map((o) => o.label)
      : ["Wedding", "Reception", "Haldi", "Festive", "Office", "Gifting"];

    addChoices(options, (label) => {
      addUserMessage(label);
      if (typeof OCCASION_GUIDE !== "undefined") {
        const key = Object.keys(OCCASION_GUIDE).find((k) => OCCASION_GUIDE[k].label === label);
        state.occasion = key || label.toLowerCase();
      } else {
        state.occasion = label.toLowerCase();
      }
      askBudget();
    });
  }

  function askBudget() {
    addBotMessage("What budget range do you have in mind?");
    addChoices(Object.keys(budgetRanges), (label) => {
      addUserMessage(label);
      state.budget = label;
      askColor();
    });
  }

  function askColor() {
    addBotMessage("Any preferred colour you're drawn to? (Or skip)");
    addChoices(["Maroon", "Green", "Blue", "Yellow", "Black", "Skip"], (label) => {
      addUserMessage(label);
      state.color = label === "Skip" ? null : label.toLowerCase();
      showResults();
    });
  }

  async function showResults() {
    showTypingIndicator();
    let results = [];

    if (window.Api) {
      try {
        const apiRes = await window.Api.getStylistRecommendations({
          occasion: state.occasion,
          budget: state.budget,
          color: state.color
        });
        if (apiRes && apiRes.recommendations) {
          results = apiRes.recommendations;
        }
      } catch (err) {
        console.warn("[Chatbot] API recommendation fallback:", err);
      }
    }

    if (!results.length) {
      results = recommend();
    }

    removeTypingIndicator();
    const occasionLabel = (typeof OCCASION_GUIDE !== "undefined" && OCCASION_GUIDE[state.occasion]?.label) || state.occasion || "your event";
    addBotMessage(`Here are our top handloom matches for <strong>${occasionLabel}</strong>${state.budget ? ` around <strong>${state.budget}</strong>` : ''}:`);
    addRecommendations(results);

    addBotMessage(`Would you like to explore more, book a viewing, or message us on WhatsApp?`);
    addChoices(["Start over", "Book a Viewing", "Chat on WhatsApp"], (choice) => handleChoice(choice));
  }

  /* ---------------- Free-Text & Choice Handler ---------------- */
  async function handleChoice(choice) {
    if (choice === "Start over") {
      state.occasion = state.budget = state.color = null;
      startFlow();
      return;
    }
    if (choice === "Find a Saree") {
      addUserMessage(choice);
      askOccasion();
      return;
    }
    if (choice === "Chat on WhatsApp" || choice === "Message on WhatsApp") {
      const phone = (typeof SHOP_INFO !== "undefined" && SHOP_INFO.whatsapp) || "911234567890";
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent("Hi Sonali Paithani! I was chatting with your online stylist and would like to know more.")}`, "_blank");
      return;
    }
    if (choice === "Book an in-shop Viewing" || choice === "Book a Viewing") {
      addUserMessage(choice);
      window.location.href = "collections.html";
      return;
    }

    // Default to natural conversational response
    addUserMessage(choice);
    await processMessage(choice);
  }

  async function processMessage(text) {
    showTypingIndicator();

    if (window.Api) {
      try {
        const res = await window.Api.chat(text);
        removeTypingIndicator();
        if (res && res.reply) {
          addBotMessage(res.reply);
          if (res.recommendations && res.recommendations.length) {
            addRecommendations(res.recommendations);
          }
          if (res.suggestions && res.suggestions.length) {
            addChoices(res.suggestions, (suggestion) => handleChoice(suggestion));
          }
          return;
        }
      } catch (e) {
        console.warn("[Chatbot] Chat API error, using client logic:", e);
      }
    }

    // Client-side fallback if server is offline
    removeTypingIndicator();
    const lower = text.toLowerCase();

    if (/^(hi|hii|hello|hey|namaste)\b/i.test(lower)) {
      addBotMessage("Namaste! 🙏 Hello! Welcome to Sonali Paithani. How can I help you today?");
      addChoices(["Find a Saree", "Bridal Sarees", "Shop Location", "What are the prices?"], (c) => handleChoice(c));
      return;
    }

    if (lower.includes("where") || lower.includes("location") || lower.includes("shop")) {
      addBotMessage("📍 We are located in <strong>Yeola, Nashik District, Maharashtra</strong> — the historic home of authentic Paithani weaving!");
      addChoices(["Chat on WhatsApp", "Browse Collections"], (c) => handleChoice(c));
      return;
    }

    if (lower.includes("price") || lower.includes("cost")) {
      addBotMessage("💎 Our sarees range from ₹9,800 (gifting & everyday silk) up to ₹89,000 for heavy real gold zari bridal Paithani.");
      addChoices(["Under ₹15k", "₹15k–₹35k", "₹35k–₹60k", "₹60k+"], (c) => handleChoice(c));
      return;
    }

    // Fallback search in catalog
    const results = recommend();
    addBotMessage(`Here are a few recommended pieces from our catalog:`);
    addRecommendations(results);
    addChoices(["Start over", "Chat on WhatsApp"], (c) => handleChoice(c));
  }

  function handleFreeText(text) {
    addUserMessage(text);
    processMessage(text);
  }

  /* ---------------- Init ---------------- */
  document.addEventListener("DOMContentLoaded", () => {
    launcher = document.querySelector(".chat-launcher");
    panel = document.querySelector(".chat-panel");
    body = document.querySelector(".chat-body");
    if (!launcher || !panel || !body) return;

    const closeBtn = panel.querySelector(".chat-close");
    const input = panel.querySelector('input[type="text"]');
    const sendBtn = panel.querySelector(".chat-input-row button");

    let started = false;
    launcher.addEventListener("click", () => {
      panel.classList.add("open");
      if (!started) {
        started = true;
        startFlow();
      }
    });
    closeBtn.addEventListener("click", () => panel.classList.remove("open"));

    function submitText() {
      const val = input.value.trim();
      if (!val) return;
      input.value = "";
      handleFreeText(val);
    }

    if (sendBtn) sendBtn.addEventListener("click", submitText);
    if (input) {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") submitText();
      });
    }
  });
})();
