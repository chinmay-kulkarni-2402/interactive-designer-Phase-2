function ttsPlugin(editor) {
  editor.Components.addType('tts-box', {
    model: {
      defaults: {
        tagName: 'div',
        droppable: false,
        draggable: true,
        attributes: { class: 'tts-box' },
        components: [
          {
            tagName: 'button',
            attributes: { class: 'tts-btn' },
            content: '🔊',
          },
        ],
        script: function () {
          if ('speechSynthesis' in window) {
            let lastSelectedText = '';
            document.addEventListener('mouseup', () => {
              const sel = window.getSelection();
              if (sel && sel.toString().trim()) {
                lastSelectedText = sel.toString().trim();
              }
            });

            const btn = this.querySelector('.tts-btn');
            if (!btn) return;

            let isSpeaking = false;
            btn.addEventListener('click', () => {
              if (!lastSelectedText) {
                alert('Please select some text to read.');
                return;
              }
              if (isSpeaking) {
                window.speechSynthesis.cancel();
                isSpeaking = false;
                btn.innerHTML = '🔊';
              } else {
                const utterance = new SpeechSynthesisUtterance(lastSelectedText);
                utterance.lang = 'en-US';
                utterance.rate = 1;
                utterance.pitch = 1;
                utterance.onend = () => {
                  isSpeaking = false;
                  btn.innerHTML = '🔊';
                };
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(utterance);
                isSpeaking = true;
                btn.innerHTML = '⏹️';
              }
            });
          }
        },
        styles: `
          .tts-box {
            display: inline-block;
            padding: 5px;
          }
          .tts-btn {
            font-size: 20px;
            background: #007bff;
            color: #fff;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            padding: 10px 12px;
          }
        `,
      },
    },
  });

  // Add block in block manager
  editor.Blocks.add('tts-box', {
    label: '🔊 TTS',
    category: 'Basic',
    content: { type: 'tts-box' },
  });
}
