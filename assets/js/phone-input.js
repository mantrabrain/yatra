/**
 * Yatra international phone input.
 *
 * Enhances every `[data-yatra-phone]` control rendered by
 * yatra_render_form_field(): a searchable country selector (flag + dial code)
 * on the left, the national number on the right. Pasting a full international
 * number ("+9779806015400") auto-selects the country (Nepal) and splits the
 * number. A hidden `<field>_country` input carries the chosen ISO; the server
 * combines dial code + national number on submit, so this script degrades
 * gracefully (no JS → the plain number + default country still submit).
 *
 * Pure vanilla JS, no dependencies. Country data comes from
 * window.yatraPhoneData.countries ([{iso,name,dial}]) +
 * window.yatraPhoneData.priority ({dial: iso}).
 */
(function () {
  "use strict";

  var DATA = window.yatraPhoneData || {};
  var COUNTRIES = Array.isArray(DATA.countries) ? DATA.countries : [];
  var PRIORITY = DATA.priority || {};
  var I18N = DATA.i18n || {};
  var SEARCH_PLACEHOLDER = I18N.search || "Search country";
  var NO_RESULTS = I18N.noResults || "No matches";

  if (!COUNTRIES.length) {
    return; // nothing to build without country data
  }

  // iso (lowercase) -> {iso,name,dial}
  var BY_ISO = {};
  COUNTRIES.forEach(function (c) {
    BY_ISO[String(c.iso).toLowerCase()] = c;
  });

  /** Detect country from a raw value that starts with "+". Mirrors FormatHelper::detectPhoneCountry. */
  function detectCountry(raw) {
    raw = (raw || "").trim();
    if (!raw || raw.charAt(0) !== "+") return null;
    var digits = raw.replace(/\D+/g, "");
    if (!digits) return null;
    for (var len = Math.min(4, digits.length); len >= 1; len--) {
      var prefix = digits.slice(0, len);
      var matches = COUNTRIES.filter(function (c) {
        return c.dial === prefix;
      });
      if (matches.length) {
        var iso = PRIORITY[prefix] || matches[0].iso;
        return { iso: iso, dial: prefix, national: digits.slice(len) };
      }
    }
    return null;
  }

  function flagUrl(base, iso) {
    return base + String(iso).toLowerCase() + ".svg";
  }

  function closeAll(except) {
    document
      .querySelectorAll(".yatra-phone-field.is-open")
      .forEach(function (f) {
        if (f !== except) {
          f.classList.remove("is-open");
          var btn = f.querySelector(".yatra-phone-country");
          if (btn) btn.setAttribute("aria-expanded", "false");
        }
      });
  }

  function initField(field) {
    if (!field || field.dataset.yatraPhoneReady === "1") return;
    field.dataset.yatraPhoneReady = "1";

    var button = field.querySelector(".yatra-phone-country");
    var flagImg = field.querySelector(".yatra-phone-flag");
    var dialSpan = field.querySelector(".yatra-phone-dial");
    var numberInput = field.querySelector(".yatra-phone-number");
    var isoInput = field.querySelector(".yatra-phone-iso");
    var flagBase = field.getAttribute("data-flag-base") || "";
    if (!button || !numberInput || !isoInput) return;

    var dropdown = null;
    var listEl = null;
    var searchEl = null;

    function setCountry(iso) {
      var c = BY_ISO[String(iso).toLowerCase()];
      if (!c) return;
      isoInput.value = c.iso;
      if (dialSpan) dialSpan.textContent = "+" + c.dial;
      if (flagImg) {
        flagImg.setAttribute("src", flagUrl(flagBase, c.iso));
        flagImg.setAttribute("alt", c.name);
      }
      // reflect selection in an open list
      if (listEl) {
        listEl
          .querySelectorAll(".yatra-phone-option.is-active")
          .forEach(function (o) {
            o.classList.remove("is-active");
          });
        var active = listEl.querySelector(
          '.yatra-phone-option[data-iso="' + c.iso + '"]',
        );
        if (active) active.classList.add("is-active");
      }
    }

    function buildDropdown() {
      if (dropdown) return;
      dropdown = document.createElement("div");
      dropdown.className = "yatra-phone-dropdown";

      var searchWrap = document.createElement("div");
      searchWrap.className = "yatra-phone-search-wrap";
      searchEl = document.createElement("input");
      searchEl.type = "text";
      searchEl.className = "yatra-phone-search";
      searchEl.setAttribute("placeholder", SEARCH_PLACEHOLDER);
      searchEl.setAttribute("autocomplete", "off");
      searchEl.setAttribute("aria-label", SEARCH_PLACEHOLDER);
      searchWrap.appendChild(searchEl);

      listEl = document.createElement("ul");
      listEl.className = "yatra-phone-list";
      listEl.setAttribute("role", "listbox");

      COUNTRIES.forEach(function (c) {
        var li = document.createElement("li");
        li.className = "yatra-phone-option";
        li.setAttribute("role", "option");
        li.setAttribute("data-iso", c.iso);
        li.setAttribute(
          "data-search",
          (c.name + " " + c.dial + " " + c.iso).toLowerCase(),
        );
        li.innerHTML =
          '<img class="yatra-phone-flag" loading="lazy" width="22" height="16" alt="" src="' +
          flagUrl(flagBase, c.iso) +
          '">' +
          '<span class="yatra-phone-option-name"></span>' +
          '<span class="yatra-phone-option-dial">+' +
          c.dial +
          "</span>";
        li.querySelector(".yatra-phone-option-name").textContent = c.name;
        li.addEventListener("click", function () {
          setCountry(c.iso);
          close();
          numberInput.focus();
        });
        listEl.appendChild(li);
      });

      dropdown.appendChild(searchWrap);
      dropdown.appendChild(listEl);
      field.appendChild(dropdown);

      searchEl.addEventListener("input", function () {
        var q = searchEl.value.trim().toLowerCase();
        var anyVisible = false;
        listEl.querySelectorAll(".yatra-phone-option").forEach(function (o) {
          var match = !q || o.getAttribute("data-search").indexOf(q) !== -1;
          o.style.display = match ? "" : "none";
          if (match) anyVisible = true;
        });
        var empty = listEl.querySelector(".yatra-phone-empty");
        if (!anyVisible) {
          if (!empty) {
            empty = document.createElement("li");
            empty.className = "yatra-phone-empty";
            empty.textContent = NO_RESULTS;
            listEl.appendChild(empty);
          }
          empty.style.display = "";
        } else if (empty) {
          empty.style.display = "none";
        }
      });

      searchEl.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          close();
          button.focus();
        }
      });
    }

    function open() {
      buildDropdown();
      closeAll(field);
      field.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
      setCountry(isoInput.value); // highlight current
      if (searchEl) {
        searchEl.value = "";
        searchEl.dispatchEvent(new Event("input"));
        searchEl.focus();
      }
      // ensure active option is visible
      if (listEl) {
        var active = listEl.querySelector(".yatra-phone-option.is-active");
        if (active) active.scrollIntoView({ block: "nearest" });
      }
    }

    function close() {
      field.classList.remove("is-open");
      button.setAttribute("aria-expanded", "false");
    }

    button.addEventListener("click", function (e) {
      e.preventDefault();
      if (field.classList.contains("is-open")) {
        close();
      } else {
        open();
      }
    });

    // Live flag feedback while typing an international number; final split on
    // blur/paste so digits don't jump around mid-keystroke.
    numberInput.addEventListener("input", function () {
      var v = numberInput.value;
      if (v.charAt(0) === "+") {
        var d = detectCountry(v);
        if (d) setCountry(d.iso);
      }
    });

    function splitIfInternational() {
      var v = numberInput.value.trim();
      if (v.charAt(0) !== "+") return;
      var d = detectCountry(v);
      if (d) {
        setCountry(d.iso);
        numberInput.value = d.national;
      }
    }
    numberInput.addEventListener("blur", splitIfInternational);
    numberInput.addEventListener("paste", function () {
      setTimeout(splitIfInternational, 0);
    });
  }

  function initAll(root) {
    (root || document)
      .querySelectorAll("[data-yatra-phone]")
      .forEach(initField);
  }

  // Close on outside click / Escape.
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".yatra-phone-field")) closeAll(null);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeAll(null);
  });

  // Initial + dynamically-added traveler rows (booking.js clones them).
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initAll(document);
    });
  } else {
    initAll(document);
  }
  if (typeof MutationObserver !== "undefined") {
    var mo = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        m.addedNodes &&
          m.addedNodes.forEach(function (n) {
            if (n.nodeType !== 1) return;
            if (n.matches && n.matches("[data-yatra-phone]")) initField(n);
            initAll(n);
          });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  // Expose for explicit re-init if a theme/integration needs it.
  window.yatraInitPhoneInputs = initAll;
})();
