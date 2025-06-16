function customSeparator(editor) {
  editor.Components.addType("separator", {
    model: {
      defaults: {
        tagName: "hr",
        name: "Separator",
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
            name: "border-width-custom",
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
          "width": "100%",
          "margin": "10px auto",
          "display": "block",
        },
      },

      init() {
        this.listenTo(
          this,
          "change:border-style change:border-color change:border-width-custom change:width change:margin",
          this.updateStyle
        );
      },

      updateStyle() {
        const borderStyle = this.get("border-style") || "solid";
        const borderColor = this.get("border-color") || "#000000";
        const borderWidth = this.get("border-width-custom") || 1;
        const width = this.get("width") || "100%";
        const margin = this.get("margin") || "10px auto";

        this.addStyle({
          "border-top": `${borderWidth}px ${borderStyle} ${borderColor}`,
          "width": width,
          "margin": margin,
          "display": "block",
        });
      },
    },
  });
}