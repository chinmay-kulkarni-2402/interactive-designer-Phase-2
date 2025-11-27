function customSeparator(editor) {
  // -------- local logger shim (uses DesignerLogger if present) --------
  const DL = (window && window.DesignerLogger) ? window.DesignerLogger : {
    info: (m, c) => console.log(m, c || ''),
    warn: (m, c) => console.warn(m, c || ''),
    error: (m, c) => console.error(m, c || ''),
    success: (m, c) => console.log(m, c || ''),
    try(fn, ctx, onError) { try { return fn(); } catch (err) { console.error(err); if (onError) onError(err); } }
  };

  // Custom debounce function
  function debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        fn.apply(this, args);
      }, delay);
    };
  }

  editor.Components.addType("separator", {
    model: {
      defaults: {
        tagName: "hr",
        name: "Separator",
        "border-style": "solid",
        "border-color": "#000000",
        "border-thickness": 1,
        "width": "99.5%",
        "margin": "10px auto",
        traits: [
          {
            type: "select",
            label: "Line Style",
            name: "border-style",
            changeProp: 1,
            options: [
              { value: "solid", name: "Solid" },
              { value: "dashed", name: "Dashed" },
              { value: "dotted", name: "Dotted" },
            ],
            default: "solid",
          },
          {
            type: "color",
            label: "Color",
            name: "border-color",
            changeProp: 1,
            default: "#000000",
          },
          {
            type: "number",
            label: "Thickness",
            name: "border-thickness",
            placeholder: "e.g. 1",
            changeProp: 1,
            default: 1,
          },
          {
            type: "text",
            label: "Width",
            name: "width",
            placeholder: "100%, 400px",
            changeProp: 1,
            default: "100%",
          },
          {
            type: "select",
            label: "Alignment",
            name: "margin",
            options: [
              { value: "10px auto", name: "Center" },
              { value: "10px 0 10px auto", name: "Right" },
              { value: "10px auto 10px 0", name: "Left" },
            ],
            changeProp: 1,
            default: "10px auto",
          },
        ],
        style: {
          "border-top": "1px solid #000000",
          "width": "99.5%",
          "margin": "10px auto",
          "display": "block",
          "padding": "2.5px",
        },
      },

      init() {
        const compId = (this.getId && this.getId()) || this.cid || null;

        const traitNames = [
          "border-style",
          "border-color",
          "border-thickness",
          "width",
          "margin",
        ];

        traitNames.forEach((tName) => {
          const debouncedHandle = debounce(this.handleTraitChange.bind(this, tName), 300);
          this.listenTo(this, "change:" + tName, debouncedHandle);
        });
      },

      handleTraitChange(tName) {
        const compId = (this.getId && this.getId()) || this.cid || null;
        let value = this.get(tName);
        let isValid = true;
        let validatedValue = value;

        switch (tName) {
          case "border-thickness":
            let numericValue = Number(value);
            if (Number.isNaN(numericValue)) {
              validatedValue = 1;
              isValid = false;
            } else if (numericValue < 0) {
              validatedValue = Math.abs(numericValue);
              isValid = false;
            } else if (numericValue > 20) {
              validatedValue = 20;
              isValid = false;
            } else {
              validatedValue = numericValue;
            }
            break;

          case "border-style":
            const allowedStyles = ['solid', 'dashed', 'dotted'];
            if (!allowedStyles.includes(value)) {
              validatedValue = 'solid';
              isValid = false;
            }
            break;

          case "border-color":
            if (value === '') {
              validatedValue = '#000000';
              isValid = false;
            } else {
              const isHex = typeof value === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
              if (!isHex) {
                validatedValue = '#000000';
                isValid = false;
              }
            }
            break;

          case "width":
            if (typeof value !== 'string' || !/^\d+(\.\d+)?(%|px|rem|vw)$/.test(value)) {
              validatedValue = '99.5%';
              isValid = false;
            }
            break;

          case "margin":
            const allowedMargins = ['10px auto', '10px 0 10px auto', '10px auto 10px 0'];
            if (!allowedMargins.includes(value)) {
              validatedValue = '10px auto';
              isValid = false;
            }
            break;
        }

        if (!isValid) {
          const trait = this.getTraits().find(tr => tr.get('name') === tName);
          if (trait) {
            trait.setValue(validatedValue, { silent: true });
          }
        } 

        this.updateStyle();
      },

      updateStyle() {
        const compId = (this.getId && this.getId()) || this.cid || null;

        const borderStyle = this.get("border-style");
        const borderColor = this.get("border-color");
        const borderWidth = this.get("border-thickness");
        const width = this.get("width");
        const margin = this.get("margin");

        const borderTop = `${borderWidth}px ${borderStyle} ${borderColor}`;

        try {
          this.addStyle({
            "border-top": borderTop,
            "width": width,
            "margin": margin,
            "display": "block",
          });
        } catch (err) {
          
        }
      },
    },
  });
}