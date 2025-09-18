function ttsPlugin(editor) {
  editor.on('load', () => {
    const wrapper = editor.getWrapper();

    // Prevent duplicates
    if (wrapper.find('.global-tts-box').length) return;

    // Add floating button + script as a GrapesJS component
    wrapper.append(`
      <div class="global-tts-box">
        <button class="global-tts-btn">🔊</button>
        <script>
          (function(){
            if (!('speechSynthesis' in window)) return;
            var btn = document.querySelector('.global-tts-btn');
            var lastSelectedText = '';
            document.addEventListener('mouseup', () => {
              var sel = window.getSelection();
              if (sel && sel.toString().trim()) {
                lastSelectedText = sel.toString().trim();
              }
            });
            var isSpeaking = false;
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
                var utterance = new SpeechSynthesisUtterance(lastSelectedText);
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
          })();
        </script>
      </div>
    `);

    // Export-safe floating CSS
    editor.Css.add(`
      .global-tts-box {
        position: fixed;
        top: 15px;
        left: 15px;
        z-index: 99999;
      }
      .global-tts-btn {
        font-size: 22px;
        background: #007bff;
        color: #fff;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        padding: 10px 12px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
      }
    `);
  });
}
