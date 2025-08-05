// standalone-audio-component.js
function SourceAudioPlugin(editor) {
  const idTrait = {
    changeProp: 1,
    name: "id",
    label: "Id",
    type: "text",
    placeholder: "audio-1",
  };
  const nameTrait = {
    changeProp: 1,
    type: "text",
    name: "name",
    label: "Name",
    placeholder: "Audio Name",
  };
  const audioPathTrait = {
    changeProp: 1,
    type: "text",
    name: "audiopath",
    label: "Audio Link",
    placeholder: "Enter Audio URL",
  };

  const allTraits = [idTrait, nameTrait, audioPathTrait];

  editor.Components.addType("CustomAudio", {
    model: {
      defaults: {
        tagName: "div",
        droppable: 0,
        stylable: 1,
        traits: allTraits,
        attributes: { role: "region" },
        components: [
          {
            type: "text",
            tagName: "div",
            content: "", // placeholder if needed
            attributes: { class: "audio-wrapper" },
          },
        ],
        style: {
          display: "inline-flex",
          "align-items": "center",
          gap: "8px",
          padding: "6px",
          "background-color": "#f5f5f5",
          "border-radius": "6px",
          "font-family": "system-ui, sans-serif",
        },
        script: `
          (function() {
            const container = this;
            // Avoid re-initializing if already done
            if (container.__customAudioInit) return;
            container.__customAudioInit = true;

            // Get trait values (GrapesJS interpolation)
            const getAttr = (name) => {
              try {
                // GrapesJS interpolates traits into {[ name ]}
                const raw = container.getAttribute(name) || "";
                return raw;
              } catch (e) {
                return "";
              }
            };

            // Create audio element (hidden)
            const audiopathTrait = "{[ audiopath ]}";
            let audioSrc = 'https://commondatastorage.googleapis.com/codeskulptor-demos/pyman_assets/intromusic.ogg';
            if (audiopathTrait && audiopathTrait.trim()) {
              audioSrc = audiopathTrait.trim();
            }

            const audio = document.createElement("audio");
            audio.src = audioSrc;
            audio.preload = "auto";
            audio.style.display = "none";
            container.appendChild(audio);

            // Create button
            const btn = document.createElement("button");
            btn.setAttribute("type", "button");
            btn.setAttribute("aria-label", "Play audio");
            btn.style.cursor = "pointer";
            btn.style.padding = "6px 12px";
            btn.style.border = "none";
            btn.style["border-radius"] = "4px";
            btn.style["background-color"] = "#1f6feb";
            btn.style.color = "#fff";
            btn.style["font-size"] = "14px";
            btn.textContent = "Play";

            // Update label based on state
            const updateLabel = () => {
              btn.textContent = audio.paused ? "Play" : "Pause";
              btn.setAttribute("aria-label", audio.paused ? "Play audio" : "Pause audio");
            };

            btn.addEventListener("click", (e) => {
              e.preventDefault();
              if (audio.paused) {
                audio.play().catch(() => {
                  // handle autoplay blocking silently
                });
              } else {
                audio.pause();
              }
              updateLabel();
            });

            // Sync when audio ends
            audio.addEventListener("ended", () => {
              updateLabel();
            });

            // If audio source trait changes, we need to update src
            const observer = new MutationObserver((mutations) => {
              for (const m of mutations) {
                if (m.type === "attributes" && m.attributeName === "data-gjs-__traits__") {
                  // GrapesJS doesn't expose trait changes simply; safe fallback: reload src
                  const newPath = "{[ audiopath ]}";
                  if (newPath && newPath.trim() && newPath.trim() !== audio.src) {
                    audio.src = newPath.trim();
                    audio.load();
                  }
                }
              }
            });
            observer.observe(container, { attributes: true });

            container.appendChild(btn);
            updateLabel();
          })();
        `,
        // So that changing traits re-evaluates script (GrapesJS workaround)
        scriptProps: ["audiopath"],
      },

      init() {
        // Trigger re-render of script when relevant traits change
        this.on("change:audiopath", () => {
          this.trigger("change:script");
        });
        this.on("change:id", () => {
          this.trigger("change:script");
        });
        this.on("change:name", () => {
          this.trigger("change:script");
        });
      },
    },

    view: {
      // Optional: you can customize how it's rendered in the canvas preview if needed
    },
  });

  // Block to insert the custom audio
  editor.Blocks.add("custom_audio_block", {
    label: "Custom Audio", 
    category: "Media",
    content: {
      type: "CustomAudio",
      attributes: { id: "custom-audio-1", name: "My Audio" },
    },
  });
}
