(function (ALB) {
  const CHECKBOX_CLASS = "alb-product-checkbox";
  const WRAP_CLASS = "alb-checkbox-wrap";

  ALB.createCheckboxInjector = function createCheckboxInjector({ onSelectionChange }) {
    const selected = new Map();
    let disabled = false;

    function getSelection() {
      return Array.from(selected.values());
    }

    function inject(product) {
      if (!product.element || product.element.querySelector(`.${WRAP_CLASS}`)) {
        return;
      }

      const wrap = document.createElement("label");
      wrap.className = WRAP_CLASS;
      wrap.title = "Select for affiliate link batch";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.className = CHECKBOX_CLASS;
      input.dataset.productId = product.id;
      if (selected.has(product.id)) {
        input.checked = true;
      }
      input.addEventListener("change", () => {
        if (input.checked) {
          selected.set(product.id, product);
        } else {
          selected.delete(product.id);
        }
        onSelectionChange(getSelection());
      });

      wrap.appendChild(input);

      const mount = product.mount || product.element;
      mount.style.position = mount.style.position || "relative";
      mount.prepend(wrap);
    }

    return {
      inject,
      injectAll(products, { notify = true } = {}) {
        for (const product of products) {
          inject(product);
        }
        if (notify) {
          onSelectionChange(getSelection());
        }
      },
      setDisabled(next) {
        disabled = next;
        document.querySelectorAll(`.${CHECKBOX_CLASS}`).forEach((el) => {
          el.disabled = disabled;
        });
      },
      selectAll(products) {
        if (disabled) {
          return;
        }
        for (const product of products) {
          selected.set(product.id, product);
          const input = product.element?.querySelector(`.${CHECKBOX_CLASS}`);
          if (input) {
            input.checked = true;
          }
        }
        onSelectionChange(getSelection());
      },
      clearAll() {
        if (disabled) {
          return;
        }
        selected.clear();
        document.querySelectorAll(`.${CHECKBOX_CLASS}`).forEach((el) => {
          el.checked = false;
        });
        onSelectionChange(getSelection());
      },
      getSelection,
    };
  };
})(window.ALB);