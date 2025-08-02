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

// Toast notification function
function showToast(message, type = 'error') {
  console.log(message)
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${type === 'error' ? '#fee2e2' : '#d1fae5'};
    border: 1px solid ${type === 'error' ? '#fca5a5' : '#a7f3d0'};
    color: ${type === 'error' ? '#dc2626' : '#059669'};
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    animation: slideIn 0.3s ease-out;
    max-width: 350px;
    word-wrap: break-word;
  `;
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
  
  toast.innerHTML = `<strong>${type === 'error' ? '❌ Error:' : '✅ Success:'}</strong> ${message}`;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      document.body.removeChild(toast);
      document.head.removeChild(style);
    }, 300);
  }, 4000);
}

function showQRPopup(component, editor) {
  const modal = editor.Modal;
  const content = document.createElement('div');
  content.innerHTML = `
    <div style="padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; background: #fff; margin: 0 auto;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="margin: 0 0 8px 0; color: #1f2937; font-size: 24px; font-weight: 600;">Generate QR/Barcode</h2>
        <p style="margin: 0; color: #6b7280; font-size: 14px;">All industry standards supported</p>
      </div>

      <!-- Input Section -->
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 600; font-size: 14px;">
          📝 Text/Data to Encode
        </label>
        <input type="text" id="qr-text" placeholder="Enter URL, text, or data (e.g., https://example.com)" 
               style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; transition: border-color 0.2s; box-sizing: border-box;" />
      </div>
      
      <!-- Type Selection -->
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 600; font-size: 14px;">
          🏷️ Barcode Type
        </label>
        <select id="qr-type" style="width: 100%; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; background: white; box-sizing: border-box;">
          <optgroup label="🔲 2D Barcodes (High Capacity)">
            <option value="qr" selected>QR Code (Most Popular)</option>
            <option value="datamatrix">Data Matrix (Compact)</option>
            <option value="pdf417">PDF417 (Documents)</option>
            <option value="aztec">Aztec Code (Transport)</option>
          </optgroup>
          <optgroup label="📊 Linear - Numeric Only">
            <option value="upc">UPC-A (Products)</option>
            <option value="ean13">EAN-13 (International)</option>
            <option value="ean8">EAN-8 (Small Products)</option>
            <option value="upce">UPC-E (Compact)</option>
          </optgroup>
          <optgroup label="🔤 Linear - Alphanumeric">
            <option value="code128">Code 128 (Recommended)</option>
            <option value="code39">Code 39 (Standard)</option>
            <option value="code93">Code 93 (High Density)</option>
            <option value="codabar">Codabar (Libraries)</option>
            <option value="itf">ITF (Shipping)</option>
            <option value="msi">MSI Plessey (Inventory)</option>
          </optgroup>
          <optgroup label="📮 Postal Services">
            <option value="postnet">POSTNET (US Mail)</option>
            <option value="planet">PLANET (US Mail)</option>
          </optgroup>
          <optgroup label="🏭 Industry Specific">
            <option value="gs1_128">GS1-128 (Supply Chain)</option>
            <option value="pharmacode">Pharmacode (Pharmacy)</option>
          </optgroup>
        </select>
      </div>

      <!-- Advanced Options (Default Enabled) -->
      <div id="advanced-options" style="margin-bottom: 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
        <div style="display: flex; align-items: center; margin-bottom: 16px;">
          <span style="font-weight: 600; color: #374151; font-size: 14px;">⚙️ Advanced Options</span>
        </div>
        
        <!-- Size Controls -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <label style="display: block; margin-bottom: 6px; color: #4b5563; font-weight: 500; font-size: 13px;">
              📐 Width Scale
            </label>
            <div style="position: relative;">
              <input type="range" id="barcode-width" min="1" max="5" value="2" step="0.5" 
                     style="width: 100%; height: 6px; border-radius: 3px; background: #e5e7eb; outline: none; margin-bottom: 4px;" />
              <div style="display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af;">
                <span>1x</span>
                <span id="width-value" style="font-weight: 600; color: #374151;">2x</span>
                <span>5x</span>
              </div>
            </div>
          </div>
          <div>
            <label style="display: block; margin-bottom: 6px; color: #4b5563; font-weight: 500; font-size: 13px;">
              📏 Height (px)
            </label>
            <div style="position: relative;">
              <input type="range" id="barcode-height" min="40" max="200" value="100" step="10" 
                     style="width: 100%; height: 6px; border-radius: 3px; background: #e5e7eb; outline: none; margin-bottom: 4px;" />
              <div style="display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af;">
                <span>40px</span>
                <span id="height-value" style="font-weight: 600; color: #374151;">100px</span>
                <span>200px</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Additional Options -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start;">
          <div>
            <label style="display: flex; align-items: center; cursor: pointer; padding: 8px; border-radius: 6px; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='transparent'">
              <input type="checkbox" id="show-text" checked style="margin-right: 8px; transform: scale(1.1);" />
              <span style="font-size: 13px; color: #374151; font-weight: 500;">📝 Show Text Below</span>
            </label>
          </div>
          
          <div id="qr-options" style="display: none;">
            <label style="display: block; margin-bottom: 6px; color: #4b5563; font-weight: 500; font-size: 13px;">
              🛡️ Error Correction
            </label>
            <select id="qr-error-correction" style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; background: white;">
              <option value="L">Low (7%) - Basic</option>
              <option value="M" selected>Medium (15%) - Standard</option>
              <option value="Q">Quartile (25%) - Good</option>
              <option value="H">High (30%) - Best</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Format Requirements Info -->
      <div id="format-info" style="margin-bottom: 20px; padding: 12px 16px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; border-radius: 8px; display: none;">
        <div style="display: flex; align-items: start; gap: 8px;">
          <span style="font-size: 16px;">💡</span>
          <div>
            <strong style="color: #92400e; font-size: 13px; display: block; margin-bottom: 4px;">Format Requirements:</strong>
            <div id="format-details" style="color: #78350f; font-size: 12px; line-height: 1.4;"></div>
          </div>
        </div>
      </div>
      
      <!-- Generate Button -->
      <div style="text-align: center;">
        <button id="generate-btn" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 14px 32px; border: none; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: 600; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); display: flex; align-items: center; justify-content: center; gap: 8px; margin: 0 auto; min-width: 160px;" 
               onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 8px -1px rgba(0, 0, 0, 0.15)'" 
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px -1px rgba(0, 0, 0, 0.1)'">
          <span style="font-size: 16px;">✨</span>
          Generate Code
        </button>
      </div>
    </div>
  `;

  modal.setTitle('');
  modal.setContent(content);
  modal.open();

  // Get elements
  const typeSelect = content.querySelector('#qr-type');
  const qrOptions = content.querySelector('#qr-options');
  const formatInfo = content.querySelector('#format-info');
  const formatDetails = content.querySelector('#format-details');
  const widthSlider = content.querySelector('#barcode-width');
  const heightSlider = content.querySelector('#barcode-height');
  const widthValue = content.querySelector('#width-value');
  const heightValue = content.querySelector('#height-value');
  const textInput = content.querySelector('#qr-text');

  // Add input focus styles
  textInput.onfocus = () => {
    textInput.style.borderColor = '#3b82f6';
    textInput.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
  };
  textInput.onblur = () => {
    textInput.style.borderColor = '#e5e7eb';
    textInput.style.boxShadow = 'none';
  };

  // Update slider values
  widthSlider.oninput = () => {
    widthValue.textContent = widthSlider.value + 'x';
  };
  
  heightSlider.oninput = () => {
    heightValue.textContent = heightSlider.value + 'px';
  };

  // Show format requirements and QR options
  typeSelect.onchange = () => {
    const selectedType = typeSelect.value;
    const is2D = ['qr', 'datamatrix', 'pdf417', 'aztec'].includes(selectedType);
    
    // Show QR options only for QR codes
    qrOptions.style.display = selectedType === 'qr' ? 'block' : 'none';
    
    // Update placeholder based on type
    const placeholders = {
      'qr': 'https://example.com or any text',
      'upc': '123456789012 (12 digits)',
      'ean13': '1234567890123 (13 digits)',
      'ean8': '12345678 (8 digits)',
      'upce': '123456 (6-8 digits)',
      'code128': 'ABC123 (letters & numbers)',
      'code39': 'HELLO123 (uppercase + numbers)',
      'code93': 'Test123 (letters & numbers)',
      'codabar': '12345 (numbers + symbols)',
      'itf': '1234 (even number of digits)',
      'postnet': '12345 (ZIP code)',
      'planet': '12345678901 (11 or 13 digits)',
      'pharmacode': '12345 (number 3-131070)',
      'gs1_128': '(01)12345678901231',
      'msi': '123456789 (numbers only)',
      'datamatrix': 'Any text or data',
      'pdf417': 'Document text or data',
      'aztec': 'Transport or ticket data'
    };
    
    textInput.placeholder = placeholders[selectedType] || 'Enter data to encode';
    
    // Show format requirements
    const requirements = getFormatRequirements(selectedType);
    if (requirements) {
      formatDetails.innerHTML = requirements;
      formatInfo.style.display = 'block';
    } else {
      formatInfo.style.display = 'none';
    }
  };

  // Initialize QR options visibility
  typeSelect.onchange();

  content.querySelector('#generate-btn').onclick = async () => {
    const text = content.querySelector('#qr-text').value.trim();
    const type = content.querySelector('#qr-type').value;

    if (!text) {
      // Enhanced error styling
      textInput.style.borderColor = '#ef4444';
      textInput.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
      textInput.focus();
      showToast('Please enter text or data to encode', 'error');
      setTimeout(() => {
        textInput.style.borderColor = '#e5e7eb';
        textInput.style.boxShadow = 'none';
      }, 3000);
      return;
    }

    // Show loading state
    const btn = content.querySelector('#generate-btn');
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<span style="font-size: 16px;">⏳</span> Generating...';
    btn.disabled = true;
    btn.style.opacity = '0.7';

    try {
      let imgBase64 = '';
      const options = {
        width: parseFloat(content.querySelector('#barcode-width').value) || 2,
        height: parseInt(content.querySelector('#barcode-height').value) || 100,
        displayValue: content.querySelector('#show-text').checked
      };

      if (type === 'qr') {
        const errorCorrectionLevel = content.querySelector('#qr-error-correction').value;
        imgBase64 = await generateQRCodeBase64(text, { errorCorrectionLevel });
      } else if (['datamatrix', 'pdf417', 'aztec'].includes(type)) {
        imgBase64 = await generate2DBarcodeBase64(text, type);
      } else {
        imgBase64 = await generateBarcodeBase64(text, type, options);
      }

      // Render image inside canvas
      component.components().reset([{
        tagName: 'img',
        attributes: {
          src: imgBase64,
          alt: `${type.toUpperCase()} code for: ${text}`,
          style: 'max-width:100%; height:auto; padding: 7px;'
        }
      }]);

      showToast(`${type.toUpperCase()} code generated successfully!`, 'success');
      modal.close();
    } catch (error) {
      // Show error in toast
      showToast(error.message, 'error');
      console.log(error)
      
      // Reset button
      btn.innerHTML = originalContent;
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  };
}

function getFormatRequirements(type) {
  const requirements = {
    'upc': 'UPC-A: Exactly 12 digits (e.g., 123456789012)',
    'ean13': 'EAN-13: Exactly 13 digits (e.g., 1234567890123)',
    'ean8': 'EAN-8: Exactly 8 digits (e.g., 12345678)',
    'upce': 'UPC-E: 6, 7, or 8 digits (e.g., 123456)',
    'code39': 'Code 39: Letters, numbers, and symbols: - . $ / + % SPACE',
    'code93': 'Code 93: Letters, numbers, and symbols',
    'codabar': 'Codabar: Numbers 0-9 and symbols: - $ : / . +',
    'itf': 'ITF: Even number of digits only (e.g., 1234)',
    'postnet': 'POSTNET: 5, 9, or 11 digits (ZIP codes)',
    'planet': 'PLANET: 11 or 13 digits',
    'pharmacode': 'Pharmacode: Numbers 3-131070 only',
    'gs1_128': 'GS1-128: Use Application Identifiers (e.g., (01)12345678901231)',
    'msi': 'MSI: Numbers 0-9 only'
  };
  
  return requirements[type] || null;
}

async function generateQRCodeBase64(text, options = {}) {
  // Check if QRCode library is available
  if (typeof QRCode === 'undefined') {
    throw new Error('QRCode library not found. Please include qrcode.js library.');
  }
  
  const qrOptions = {
    errorCorrectionLevel: options.errorCorrectionLevel || 'M',
    type: 'image/png',
    quality: 0.92,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  };
  
  return await QRCode.toDataURL(text, qrOptions);
}

async function generate2DBarcodeBase64(text, type) {
  // Check if bwip-js library is available
  if (typeof bwipjs === 'undefined') {
    throw new Error(`${type.toUpperCase()} generation requires bwip-js library. Please include it in your project.`);
  }
  
  const canvas = document.createElement('canvas');
  
  try {
    switch (type) {
      case 'datamatrix':
        canvas.width = 200;
        canvas.height = 200;
        bwipjs.toCanvas(canvas, {
          bcid: 'datamatrix',
          text: text,
          scale: 3,
          includetext: false
        });
        break;
        
      case 'pdf417':
        canvas.width = 300;
        canvas.height = 100;
        bwipjs.toCanvas(canvas, {
          bcid: 'pdf417',
          text: text,
          scale: 2,
          includetext: false
        });
        break;
        
      case 'aztec':
        canvas.width = 200;
        canvas.height = 200;
        bwipjs.toCanvas(canvas, {
          bcid: 'azteccode',
          text: text,
          scale: 3,
          includetext: false
        });
        break;
        
      default:
        throw new Error(`Unsupported 2D barcode type: ${type}`);
    }
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    throw new Error(`Failed to generate ${type.toUpperCase()}: ${error.message}`);
  }
}

async function generateBarcodeBase64(text, format, options = {}) {
  // Check if JsBarcode library is available
  if (typeof JsBarcode === 'undefined') {
    throw new Error('JsBarcode library not found. Please include jsbarcode.js library.');
  }
  
  const canvas = document.createElement('canvas');
  
  // Format mapping for JsBarcode with correct format names
  const formatMap = {
    'code128': 'CODE128',
    'code39': 'CODE39',
    'code93': 'CODE93',
    'ean13': 'EAN-13',
    'ean8': 'EAN-8',
    'upc': 'UPC (A)',
    'upce': 'UPC (E)',
    'itf': 'ITF14',
    'msi': 'MSI',
    'codabar': 'codabar',
    'pharmacode': 'pharmacode',
    'gs1_128': 'CODE128', // GS1-128 is based on Code 128
    'postnet': 'CODE128', // Fallback for postal codes
    'planet': 'CODE128'   // Fallback for postal codes
  };

  const barcodeFormat = formatMap[format];
  
  if (!barcodeFormat) {
    throw new Error(`Unsupported barcode format: ${format}`);
  }
  
  try {
    // Validate input based on format
    validateBarcodeInput(text, format);
    
    // Special handling for postal codes
    if (format === 'postnet' || format === 'planet') {
      // Use Code 128 as fallback for postal formats
      JsBarcode(canvas, text, {
        format: 'CODE128',
        width: options.width || 2,
        height: options.height || 100,
        displayValue: options.displayValue !== false,
        fontSize: 12,
        textAlign: 'center',
        textPosition: 'bottom',
        textMargin: 2,
        fontOptions: '',
        font: 'monospace',
        background: '#ffffff',
        lineColor: '#000000',
        margin: 10
      });
    } else {
      JsBarcode(canvas, text, {
        format: barcodeFormat,
        width: options.width || 2,
        height: options.height || 100,
        displayValue: options.displayValue !== false,
        fontSize: 12,
        textAlign: 'center',
        textPosition: 'bottom',
        textMargin: 2,
        fontOptions: '',
        font: 'monospace',
        background: '#ffffff',
        lineColor: '#000000',
        margin: 10,
        marginTop: 10,
        marginBottom: 10,
        marginLeft: 10,
        marginRight: 10
      });
    }
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    throw new Error(`Failed to generate ${format.toUpperCase()}: ${error.message}`);
  }
}

function validateBarcodeInput(text, format) {
  switch (format) {
    case 'upc':
      if (!/^\d{11,12}$/.test(text)) {
        throw new Error('UPC-A requires 11-12 digits');
      }
      break;
    case 'ean13':
      if (!/^\d{12,13}$/.test(text)) {
        throw new Error('EAN-13 requires 12-13 digits');
      }
      break;
    case 'ean8':
      if (!/^\d{7,8}$/.test(text)) {
        throw new Error('EAN-8 requires 7-8 digits');
      }
      break;
    case 'upce':
      if (!/^\d{6,8}$/.test(text)) {
        throw new Error('UPC-E requires 6-8 digits');
      }
      break;
    case 'itf':
      if (!/^\d+$/.test(text) || text.length % 2 !== 0) {
        throw new Error('ITF requires an even number of digits');
      }
      break;
    case 'postnet':
      if (!/^\d{5}$|^\d{9}$|^\d{11}$/.test(text)) {
        throw new Error('POSTNET requires 5, 9, or 11 digits');
      }
      break;
    case 'planet':
      if (!/^\d{11}$|^\d{13}$/.test(text)) {
        throw new Error('PLANET requires 11 or 13 digits');
      }
      break;
    case 'pharmacode':
      const num = parseInt(text);
      if (isNaN(num) || num < 3 || num > 131070) {
        throw new Error('Pharmacode requires a number between 3 and 131070');
      }
      break;
    case 'msi':
      if (!/^\d+$/.test(text)) {
        throw new Error('MSI requires only digits');
      }
      break;
    case 'code39':
      // Code 39 allows uppercase letters, numbers, and some symbols
      if (!/^[A-Z0-9\-.\$\/+%\s]+$/.test(text)) {
        throw new Error('Code 39 supports uppercase letters, numbers, and symbols: - . $ / + % SPACE');
      }
      break;
  }
}
}