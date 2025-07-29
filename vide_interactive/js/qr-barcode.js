function addQRBarcodeComponent(editor) {
editor.BlockManager.add('qr-barcode-block', {
  label: 'QR/Barcode',
  category: 'Basic',
  attributes: { class: 'fa fa-qrcode' },
  content: {
    type: 'qr-barcode-component'
  }
});


editor.DomComponents.addType('qr-barcode-component', {
  model: {
     defaults: {
      tagName: 'div',
      components: [],
      droppable: false,
      traits: [],
      script: function () {
        // optional inline script
      },
    },
    init() {
      const component = this;

      setTimeout(() => {
        showQRPopup(component, editor);
      }, 10);
    }
  }
}); 

function showQRPopup(component, editor) {
  const modal = editor.Modal;
  const content = document.createElement('div');
  content.innerHTML = `
    <div style="padding:10px;">
      <label>Text:</label><br/>
      <input type="text" id="qr-text" style="width:100%; margin-bottom:10px;" /><br/>
      
      <label>Type:</label><br/>
      <select id="qr-type" style="width:100%; margin-bottom:10px;">
        <option value="qr">QR Code</option>
        <option value="barcode">Barcode</option>
      </select><br/>
      
      <button id="generate-btn">Generate</button>
    </div>
  `;

  modal.setTitle('Generate QR/Barcode');
  modal.setContent(content);
  modal.open();

  content.querySelector('#generate-btn').onclick = async () => {
    const text = content.querySelector('#qr-text').value;
    const type = content.querySelector('#qr-type').value;

    let imgBase64 = '';

    if (type === 'qr') {
      imgBase64 = await generateQRCodeBase64(text);
    } else {
      imgBase64 = await generateBarcodeBase64(text);
    }

    // ✅ This will actually render image inside canvas
    component.components().reset([{
      tagName: 'img',
      attributes: {
        src: imgBase64,
        // style: 'width:150px;height:150px;'
      }
    }]);

    modal.close();
  };
} 

async function generateQRCodeBase64(text) {
  return await QRCode.toDataURL(text);
}

async function generateBarcodeBase64(text) {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, text, {
    format: 'CODE128',
    // width: 2,
    // height: 100,
    displayValue: false,
  });
  return canvas.toDataURL('image/png');
}
}