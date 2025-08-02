function addBackgroundAudioComponent(editor) {
  const domc = editor.DomComponents;
  const defaultType = domc.getType('default');
  const defaultModel = defaultType.model;
  const defaultView = defaultType.view;

  // Define the component
  domc.addType('background-audio', {
    model: {
      defaults: Object.assign({}, defaultModel.prototype.defaults, {
        tagName: 'div',
        droppable: false,
        resizable: false,
        copyable: true,
        removable: true,
        draggable: true,
        stylable: true,
        attributes: {
          class: 'gjs-audio-component',
          'data-gjs-type': 'background-audio'
        },
        traits: [
          {
            type: 'text',
            name: 'id',
            label: 'ID',
            placeholder: 'audio-component-id'
          },
          {
            type: 'text',
            name: 'audio-name',
            label: 'Audio Name',
            placeholder: 'Enter audio name'
          },
          {
            type: 'text',
            name: 'audio-link',
            label: 'Audio Link',
            placeholder: 'Enter audio URL'
          },
          {
            type: 'checkbox',
            name: 'loop',
            label: 'Loop Audio',
            value: false
          }
        ],
        components: [
          {
            tagName: 'button',
            type: 'text',
            editable: false,
            selectable: false,
            hoverable: false,
            draggable: false,
            droppable: false,
            removable: false,
            copyable: false,
            attributes: {
              class: 'gjs-audio-btn gjs-play-btn',
              type: 'button',
              'data-audio-control': 'true'
            },
            components: [
              {
                tagName: 'i',
                type: 'text',
                editable: false,
                selectable: false,
                hoverable: false,
                draggable: false,
                attributes: {
                  class: 'gjs-toggle-icon fa fa-play'
                }
              }
            ]
          },
          {
            tagName: 'span',
            type: 'text',
            editable: false,
            selectable: false,
            hoverable: false,
            draggable: false,
            attributes: {
              class: 'gjs-audio-name'
            },
            components: 'Background Audio'
          },
          {
            tagName: 'audio',
            type: 'text',
            editable: false,
            selectable: false,
            hoverable: false,
            draggable: false,
            droppable: false,
            removable: false,
            copyable: false,
            stylable: false,
            attributes: {
              class: 'gjs-audio-element',
              preload: 'none'
            }
          }
        ],
        style: {
          'display': 'flex',
          'align-items': 'center',
          'gap': '12px',
          'border-radius': '8px',
          'padding': '12px',
          'margin': '8px',
          'font-family': 'system-ui, -apple-system, sans-serif'
        }
      }),

      init() {
        this.on('change:attributes', this.updateAudio);
        this.updateAudio();
      },

      updateAudio() {
        const audioLink = this.get('attributes')['audio-link'];
        const audioName = this.get('attributes')['audio-name'];
        const loop = this.get('attributes')['loop'];
        
        if (this.view) {
          this.view.updateAudioElement(audioLink, audioName, loop);
        }
      }
    },

    view: {
      events: {
        'click .gjs-play-btn': 'toggleAudio'
      },

      init() {
        this.listenTo(this.model, 'change:attributes', this.updateFromModel);
        this.addGlobalStyles();
      },

      onRender() {
        this.updateFromModel();
        this.setupAudioElement();
      },

      addGlobalStyles() {
        if (!document.getElementById('gjs-audio-styles')) {
          const style = document.createElement('style');
          style.id = 'gjs-audio-styles';
          style.textContent = `
            .gjs-audio-btn {
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              width: 40px !important;
              height: 40px !important;
              border: none !important;
              border-radius: 50% !important;
              background: #007bff !important;
              color: white !important;
              cursor: pointer !important;
              transition: all 0.2s ease !important;
              flex-shrink: 0 !important;
            }
            
            .gjs-audio-btn:hover {
              background: #0056b3 !important;
              transform: scale(1.05) !important;
            }
            
            .gjs-audio-btn:active {
              transform: scale(0.95) !important;
            }
            
            .gjs-audio-name {
              font-size: 14px !important;
              font-weight: 500 !important;
              color: #343a40 !important;
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
              flex: 1 !important;
            }
            
            .gjs-audio-element {
              display: none !important;
            }
            
            .gjs-hidden {
              display: none !important;
            }
            
            @media (max-width: 768px) {
              .gjs-audio-component {
                min-width: 150px !important;
                padding: 8px !important;
              }
              
              .gjs-audio-btn {
                width: 36px !important;
                height: 36px !important;
              }
              
              .gjs-audio-name {
                font-size: 12px !important;
              }
            }
            
            @media (max-width: 480px) {
              .gjs-audio-component {
                min-width: 120px !important;
                padding: 6px !important;
              }
            }
          `;
          document.head.appendChild(style);
        }
      },

      setupAudioElement() {
        const audioElement = this.el.querySelector('.gjs-audio-element');
        if (audioElement) {
          audioElement.addEventListener('ended', () => {
            this.resetPlayButton();
          });

          audioElement.addEventListener('pause', () => {
            this.resetPlayButton();
          });

          audioElement.addEventListener('error', (e) => {
            console.warn('Audio failed to load:', e);
            this.resetPlayButton();
          });
        }
      },

      updateFromModel() {
        const attrs = this.model.get('attributes');
        const audioLink = attrs['audio-link'];
        const audioName = attrs['audio-name'];
        const loop = attrs['loop'];
        
        this.updateAudioElement(audioLink, audioName, loop);
      },

      updateAudioElement(audioLink, audioName, loop) {
        const audioElement = this.el.querySelector('.gjs-audio-element');
        const nameElement = this.el.querySelector('.gjs-audio-name');
        
        if (audioElement && audioLink) {
          audioElement.src = audioLink;
          audioElement.loop = loop === true || loop === 'true';
          audioElement.preload = 'none';
        }
        
        if (nameElement) {
          nameElement.textContent = audioName || 'Background Audio';
        }
      },

      toggleAudio(e) {
        e.preventDefault();
        e.stopPropagation();

        const audioElement = this.el.querySelector('.gjs-audio-element');
        const toggleIcon = this.el.querySelector('.gjs-toggle-icon');

        if (!audioElement || !audioElement.src) {
          alert('Please set an audio link in the component traits');
          return;
        }

        if (audioElement.paused) {
          this.stopAllOtherAudio();

          audioElement.play().then(() => {
            if (toggleIcon) {
              toggleIcon.classList.remove('fa-play');
              toggleIcon.classList.add('fa-pause');
            }
          }).catch((error) => {
            console.error('Failed to play audio:', error);
            alert('Failed to play audio. Please check the audio URL.');
          });
        } else {
          audioElement.pause();
          this.resetPlayButton();
        }
      },

      stopAllOtherAudio() {
        const allAudioComponents = document.querySelectorAll('.gjs-audio-component');
        allAudioComponents.forEach(component => {
          if (component !== this.el) {
            const audioElement = component.querySelector('.gjs-audio-element');
            if (audioElement && !audioElement.paused) {
              audioElement.pause();
              const otherToggle = component.querySelector('.gjs-toggle-icon');
              if (otherToggle) {
                otherToggle.classList.remove('fa-pause');
                otherToggle.classList.add('fa-play');
              }
            }
          }
        });
      },

      resetPlayButton() {
        const toggleIcon = this.el.querySelector('.gjs-toggle-icon');
        if (toggleIcon) {
          toggleIcon.classList.remove('fa-pause');
          toggleIcon.classList.add('fa-play');
        }
      }
    }
  });

  // Override getHtml to inject runtime code only when audio components are present
  const originalGetHtml = editor.getHtml;
  editor.getHtml = function() {
    let html = originalGetHtml.call(this);
    
    // Only add runtime code if audio components are present
    if (html.includes('gjs-audio-component')) {
      // Get all audio components and add their data attributes
      const components = editor.DomComponents.getWrapper().find('[data-gjs-type="background-audio"]');
      
      components.forEach(component => {
        const attrs = component.getAttributes();
        const audioLink = attrs['audio-link'] || '';
        const loop = attrs['loop'];
        const audioName = attrs['audio-name'] || 'Background Audio';
        
        // Update the audio element with proper attributes in the HTML
        const componentHtml = component.toHTML();
        const updatedHtml = componentHtml.replace(
          /<audio([^>]*class="gjs-audio-element"[^>]*)>/,
          `<audio$1 src="${audioLink}"${loop ? ' loop' : ''}>`
        ).replace(
          /<span([^>]*class="gjs-audio-name"[^>]*)>[^<]*<\/span>/,
          `<span$1>${audioName}</span>`
        );
        
        html = html.replace(componentHtml, updatedHtml);
      });

      const runtimeScript = `
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />
<style>
  .gjs-audio-component {
    display: flex;
    align-items: center;
    gap: 12px;
    border-radius: 8px;
    padding: 12px;
    margin: 8px;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .gjs-audio-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 50%;
    background: #007bff;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .gjs-audio-btn:hover {
    background: #0056b3;
    transform: scale(1.05);
  }

  .gjs-audio-btn:active {
    transform: scale(0.95);
  }

  .gjs-audio-name {
    font-size: 14px;
    font-weight: 500;
    color: #343a40;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }

  .gjs-audio-element {
    display: none;
  }

  .gjs-hidden {
    display: none;
  }

  .gjs-toggle-icon {
    font-size: 16px;
    pointer-events: none;
  }

  @media (max-width: 768px) {
    .gjs-audio-component {
      min-width: 150px;
      padding: 8px;
    }

    .gjs-audio-btn {
      width: 36px;
      height: 36px;
    }

    .gjs-audio-name {
      font-size: 12px;
    }
  }

  @media (max-width: 480px) {
    .gjs-audio-component {
      min-width: 120px;
      padding: 6px;
    }
  }
</style>

<script>
document.addEventListener('DOMContentLoaded', function() {
  function initAudioComponents() {
    const audioComponents = document.querySelectorAll('.gjs-audio-component');

    audioComponents.forEach(component => {
      const playBtn = component.querySelector('.gjs-audio-btn');
      const audioElement = component.querySelector('.gjs-audio-element');
      const toggleIcon = component.querySelector('.gjs-toggle-icon');

      if (playBtn && audioElement && !playBtn.dataset.initialized) {
        playBtn.dataset.initialized = 'true';

        const resetIcon = () => {
          if (toggleIcon) {
            toggleIcon.classList.remove('fa-pause');
            toggleIcon.classList.add('fa-play');
          }
        };

        playBtn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();

          if (!audioElement.src) {
            alert('Audio source not found');
            return;
          }

          if (audioElement.paused) {
            // Stop all other audio elements
            document.querySelectorAll('.gjs-audio-element').forEach(audio => {
              if (audio !== audioElement && !audio.paused) {
                audio.pause();
                const otherComponent = audio.closest('.gjs-audio-component');
                if (otherComponent) {
                  const otherToggle = otherComponent.querySelector('.gjs-toggle-icon');
                  if (otherToggle) {
                    otherToggle.classList.remove('fa-pause');
                    otherToggle.classList.add('fa-play');
                  }
                }
              }
            });

            audioElement.play().then(() => {
              if (toggleIcon) {
                toggleIcon.classList.remove('fa-play');
                toggleIcon.classList.add('fa-pause');
              }
            }).catch(error => {
              console.error('Failed to play audio:', error);
              alert('Failed to play audio. Please check the audio URL.');
              resetIcon();
            });
          } else {
            audioElement.pause();
            resetIcon();
          }
        });

        audioElement.addEventListener('ended', resetIcon);
        audioElement.addEventListener('pause', resetIcon);
        audioElement.addEventListener('error', function(e) {
          console.warn('Audio failed to load:', e);
          resetIcon();
        });
      }
    });
  }

  // Initialize existing components
  initAudioComponents();

  // Watch for dynamically added components
  const observer = new MutationObserver(function(mutations) {
    let shouldInit = false;
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1 && 
              (node.classList?.contains('gjs-audio-component') || 
               node.querySelector?.('.gjs-audio-component'))) {
            shouldInit = true;
          }
        });
      }
    });
    if (shouldInit) {
      setTimeout(initAudioComponents, 100);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});
</script>`;
      
      // Insert the runtime script before the closing body tag or at the end
      if (html.includes('</body>')) {
        html = html.replace('</body>', runtimeScript + '\n</body>');
      } else {
        html = html + runtimeScript;
      }
    }
    
    return html;
  };

  // Add to blocks panel
  editor.BlockManager.add('background-audio', {
    label: 'Background Audio',
    category: 'Media',
    content: {
      type: 'background-audio',
      attributes: {
        'audio-name': 'My Audio',
        'audio-link': '',
        'loop': false
      }
    },
    media: `
      <svg viewBox="0 0 24 24" width="100%" height="100%">
        <path fill="currentColor" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
      </svg>
    `
  });

  return 'background-audio';
}

// Usage example:
// addBackgroundAudioComponent(editor);