/**
 * Country selector with flags.
 *
 * Upgrades any `<select data-yatra-country-select>` into the same searchable,
 * flag-bearing dropdown the phone widget uses (assets/js/phone-input.js), so
 * every country field in the plugin looks and behaves alike.
 *
 * Progressive enhancement on purpose: the original <select> stays in the DOM as
 * the value holder. The widget writes the chosen ISO code back to it and fires a
 * `change` event, so form submission, required-field validation and any existing
 * listener keep working exactly as before. If this script fails to load — or the
 * browser is very old — the untouched native select is still fully usable.
 *
 * Reads flag URLs from the field's own `data-flag-base`, matching the phone
 * widget, so there is a single place that knows where the SVGs live.
 */
(function () {
  "use strict";

  var DATA = window.yatraCountrySelectData || {};
  var I18N = DATA.i18n || {};
  var SEARCH_PLACEHOLDER = I18N.search || "Search country";
  var NO_RESULTS = I18N.noResults || "No matches";

  /** Native pickers are better on touch devices, so leave those alone. */
  function prefersNativePicker() {
    return (
      window.matchMedia &&
      window.matchMedia("(max-width: 640px), (pointer: coarse)").matches
    );
  }

  function flagUrl(base, iso) {
    if (!base || !iso) return "";
    return base + String(iso).toLowerCase() + ".svg";
  }

  function closeAll(except) {
    document
      .querySelectorAll(".yatra-country-field.is-open")
      .forEach(function (f) {
        if (f === except) return;
        f.classList.remove("is-open");
        var btn = f.querySelector(".yatra-country-trigger");
        if (btn) btn.setAttribute("aria-expanded", "false");
      });
  }

  function enhance(select) {
    if (!select || select.dataset.yatraCountryReady === "1") return;
    // A disabled or readonly field gains nothing from the widget.
    if (select.disabled) return;

    select.dataset.yatraCountryReady = "1";

    var flagBase = select.getAttribute("data-flag-base") || "";

    // Build the option model straight from the existing <select>, so whatever
    // list, order or filtering the server rendered is preserved verbatim.
    var options = [];
    Array.prototype.forEach.call(select.options, function (opt) {
      options.push({
        value: opt.value,
        label: opt.textContent.trim(),
        isPlaceholder: opt.value === "",
      });
    });

    if (options.length === 0) return;

    var field = document.createElement("div");
    field.className = "yatra-country-field";

    var trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "yatra-country-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.innerHTML =
      '<img class="yatra-country-flag" width="22" height="16" alt="" src="">' +
      '<span class="yatra-country-label"></span>' +
      '<svg class="yatra-country-caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

    var flagImg = trigger.querySelector(".yatra-country-flag");
    var labelEl = trigger.querySelector(".yatra-country-label");

    var dropdown = null;
    var listEl = null;
    var searchEl = null;
    var emptyEl = null;

    function syncFromSelect() {
      var opt = select.options[select.selectedIndex];
      var value = opt ? opt.value : "";
      var label = opt ? opt.textContent.trim() : "";

      labelEl.textContent = label;

      var url = value ? flagUrl(flagBase, value) : "";
      if (url) {
        flagImg.setAttribute("src", url);
        flagImg.setAttribute("alt", label);
        flagImg.style.visibility = "visible";
      } else {
        // Placeholder ("Select Country") has no flag to show.
        flagImg.removeAttribute("src");
        flagImg.setAttribute("alt", "");
        flagImg.style.visibility = "hidden";
      }

      if (listEl) {
        listEl
          .querySelectorAll(".yatra-country-option")
          .forEach(function (li) {
            li.classList.toggle("is-active", li.getAttribute("data-value") === value);
            li.setAttribute(
              "aria-selected",
              li.getAttribute("data-value") === value ? "true" : "false",
            );
          });
      }
    }

    function choose(value) {
      select.value = value;
      // Let anything already listening (validation, pricing, Pro modules) react
      // exactly as it would to a real user picking from the native control.
      select.dispatchEvent(new Event("change", { bubbles: true }));
      syncFromSelect();
    }

    function filter(term) {
      var needle = String(term || "").trim().toLowerCase();
      var visible = 0;

      listEl.querySelectorAll(".yatra-country-option").forEach(function (li) {
        var hay = li.getAttribute("data-search") || "";
        var show = needle === "" || hay.indexOf(needle) !== -1;
        li.style.display = show ? "" : "none";
        if (show) visible++;
      });

      emptyEl.style.display = visible === 0 ? "" : "none";
    }

    function buildDropdown() {
      if (dropdown) return;

      dropdown = document.createElement("div");
      dropdown.className = "yatra-country-dropdown";

      var searchWrap = document.createElement("div");
      searchWrap.className = "yatra-country-search-wrap";
      searchEl = document.createElement("input");
      searchEl.type = "text";
      searchEl.className = "yatra-country-search";
      searchEl.setAttribute("placeholder", SEARCH_PLACEHOLDER);
      searchEl.setAttribute("aria-label", SEARCH_PLACEHOLDER);
      searchEl.setAttribute("autocomplete", "off");
      searchWrap.appendChild(searchEl);

      listEl = document.createElement("ul");
      listEl.className = "yatra-country-list";
      listEl.setAttribute("role", "listbox");

      options.forEach(function (o) {
        if (o.isPlaceholder) return;

        var li = document.createElement("li");
        li.className = "yatra-country-option";
        li.setAttribute("role", "option");
        li.setAttribute("data-value", o.value);
        li.setAttribute(
          "data-search",
          (o.label + " " + o.value).toLowerCase(),
        );
        li.innerHTML =
          '<img class="yatra-country-flag" loading="lazy" width="22" height="16" alt="" src="' +
          flagUrl(flagBase, o.value) +
          '">' +
          '<span class="yatra-country-option-name"></span>';
        li.querySelector(".yatra-country-option-name").textContent = o.label;

        li.addEventListener("click", function () {
          choose(o.value);
          close();
          trigger.focus();
        });

        listEl.appendChild(li);
      });

      emptyEl = document.createElement("div");
      emptyEl.className = "yatra-country-empty";
      emptyEl.textContent = NO_RESULTS;
      emptyEl.style.display = "none";

      dropdown.appendChild(searchWrap);
      dropdown.appendChild(listEl);
      dropdown.appendChild(emptyEl);
      field.appendChild(dropdown);

      searchEl.addEventListener("input", function () {
        filter(searchEl.value);
      });

      searchEl.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          close();
          trigger.focus();
        }
      });
    }

    function open() {
      buildDropdown();
      closeAll(field);
      field.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
      syncFromSelect();
      filter("");
      searchEl.value = "";
      searchEl.focus();

      var active = listEl.querySelector(".yatra-country-option.is-active");
      if (active && active.scrollIntoView) {
        active.scrollIntoView({ block: "nearest" });
      }
    }

    function close() {
      field.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
    }

    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (field.classList.contains("is-open")) {
        close();
      } else {
        open();
      }
    });

    trigger.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });

    // Keep the widget in step if other code sets the value programmatically
    // (e.g. a saved profile prefilling the checkout).
    select.addEventListener("change", syncFromSelect);

    // Wrap the original control: field takes the select's place, the select
    // moves inside it (hidden, still the value holder) and the trigger renders
    // in front of it.
    select.parentNode.insertBefore(field, select);
    field.appendChild(select);
    select.classList.add("yatra-country-native");
    field.insertBefore(trigger, select);

    syncFromSelect();
  }

  function initAll(root) {
    if (prefersNativePicker()) return;

    (root || document)
      .querySelectorAll("select[data-yatra-country-select]")
      .forEach(enhance);
  }

  document.addEventListener("click", function () {
    closeAll(null);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeAll(null);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initAll(document);
    });
  } else {
    initAll(document);
  }

  // Re-scan when fields arrive later (traveler rows, AJAX-rendered checkout).
  window.yatraInitCountrySelects = initAll;
  document.addEventListener("yatra:content-updated", function (e) {
    initAll((e && e.detail && e.detail.root) || document);
  });
})();
