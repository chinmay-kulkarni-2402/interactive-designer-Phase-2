// Enhanced Print Plugin for GrapesJS with Custom Sections
function initializePrintPlugin(editor) {
  
  // Add the main container component
  editor.Components.addType("Print Container", {
    model: {
      defaults: {
        tagName: "div",
        name: "Print Container",
        attributes: { class: "print-container" },
        selectable: true,
        highlightable: true,
        style: {
          "width": "800px",
          "min-height": "600px",
          "margin": "20px auto",
          "padding": "0",
          "background": "#ffffff",
          "border": "1px solid #ddd",
          "position": "relative"
        },
        components: []
      }
    }
  });

  // Add Section component that can be added to container
  editor.Components.addType("Print Section", {
    model: {
      defaults: {
        tagName: "div",
        name: "Print Section",
        attributes: { class: "print-section" },
        selectable: true,
        highlightable: true,
        components: [
          {
            tagName: "div",
            name: "Header",
            attributes: {
              class: "section-header print-header",
              'data-section-type': 'header'
            },
            style: {
              "padding": "15px",
              "min-height": "60px",
              "background": "#f8f9fa",
              "border-bottom": "1px solid #dee2e6",
              "position": "relative"
            },
            components: [{
              tagName: "div",
              content: "Header Area - Add your content here",
              style: {
                "text-align": "center",
                "color": "#666"
              }
            }]
          },
          {
            tagName: "div",
            name: "Content",
            attributes: {
              class: "section-content print-content",
              'data-section-type': 'content'
            },
            style: {
              "padding": "20px",
              "min-height": "400px",
              "position": "relative",
              "background": "#ffffff"
            },
            components: [{
              tagName: "div",
              content: "Content Area - Add your main content here",
              style: {
                "color": "#333"
              }
            }]
          },
          {
            tagName: "div",
            name: "Footer",
            attributes: {
              class: "section-footer print-footer",
              'data-section-type': 'footer'
            },
            style: {
              "padding": "15px",
              "min-height": "60px",
              "background": "#f8f9fa",
              "border-top": "1px solid #dee2e6",
              "position": "relative"
            },
            components: [{
              tagName: "div",
              content: "Footer Area - Add your content here",
              style: {
                "text-align": "center",
                "color": "#666"
              }
            }]
          }
        ],
        style: {
          "width": "100%",
          "margin": "10px 0",
          "border": "1px solid #e9ecef",
          "border-radius": "4px"
        }
      }
    }
  });

  // Add Page Break component
  editor.Components.addType("Page Break", {
    model: {
      defaults: {
        tagName: "div",
        name: "Page Break",
        attributes: { 
          class: "page-break-component",
          'data-page-break': 'true'
        },
        selectable: true,
        highlightable: true,
        style: {
          "width": "100%",
          "height": "20px",
          "background": "linear-gradient(90deg, #007bff 50%, transparent 50%)",
          "background-size": "20px 2px",
          "background-repeat": "repeat-x",
          "background-position": "center",
          "margin": "10px 0",
          "position": "relative",
          "cursor": "pointer",
          "border": "1px dashed #007bff"
        },
        components: [{
          tagName: "div",
          content: "📄 Page Break",
          style: {
            "text-align": "center",
            "color": "#007bff",
            "font-size": "12px",
            "line-height": "18px",
            "font-weight": "bold"
          }
        }]
      }
    }
  });

  // Add print button to toolbar
  editor.Panels.addButton('options', {
    id: 'print-document',
    className: 'fa fa-print',
    command: 'open-print-dialog',
    attributes: { title: 'Print Document' }
  });

  // Print settings dialog HTML
  const printDialogHTML = `
    <div class="print-dialog-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000;">
      <div class="print-dialog" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border-radius: 8px; width: 600px; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
        <div class="print-dialog-header" style="padding: 20px; border-bottom: 1px solid #eee; background: #f8f9fa; border-radius: 8px 8px 0 0;">
          <h3 style="margin: 0; color: #333;">Print Settings</h3>
        </div>
        <div class="print-dialog-content" style="padding: 20px;">
          
          <!-- Page Format Section -->
          <div class="setting-group" style="margin-bottom: 20px;">
            <h4 style="margin-bottom: 10px; color: #555;">Page Format</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Paper Size</label>
                <select id="paper-size" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                  <option value="a4">A4 (210 × 297 mm)</option>
                  <option value="a3">A3 (297 × 420 mm)</option>
                  <option value="a5">A5 (148 × 210 mm)</option>
                  <option value="letter">Letter (8.5 × 11 in)</option>
                  <option value="legal">Legal (8.5 × 14 in)</option>
                  <option value="custom">Custom Size</option>
                </select>
              </div>
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Orientation</label>
                <select id="orientation" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>
            <div id="custom-size" style="display: none; margin-top: 15px; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Width (mm)</label>
                <input type="number" id="custom-width" value="210" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              </div>
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Height (mm)</label>
                <input type="number" id="custom-height" value="297" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              </div>
            </div>
          </div>

          <!-- Page Numbers Section -->
          <div class="setting-group" style="margin-bottom: 20px;">
            <h4 style="margin-bottom: 10px; color: #555;">Page Numbers</h4>
            <div style="margin-bottom: 15px;">
              <label style="display: flex; align-items: center; margin-bottom: 10px;">
                <input type="checkbox" id="enable-page-numbers" checked style="margin-right: 8px;">
                <span>Enable Page Numbers</span>
              </label>
            </div>
            <div id="page-number-settings" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Format</label>
                <select id="page-number-format" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                  <option value="1">1, 2, 3...</option>
                  <option value="i">i, ii, iii...</option>
                  <option value="I">I, II, III...</option>
                  <option value="a">a, b, c...</option>
                  <option value="A">A, B, C...</option>
                </select>
              </div>
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Position</label>
                <select id="page-number-position" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                  <option value="bottom-center">Bottom Center</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="top-center">Top Center</option>
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                </select>
              </div>
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Starting Number</label>
                <input type="number" id="page-start-number" value="1" min="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              </div>
            </div>
          </div>

          <!-- Watermark Section -->
          <div class="setting-group" style="margin-bottom: 20px;">
            <h4 style="margin-bottom: 10px; color: #555;">Watermark</h4>
            <div style="margin-bottom: 15px;">
              <label style="display: flex; align-items: center; margin-bottom: 10px;">
                <input type="checkbox" id="enable-watermark" style="margin-right: 8px;">
                <span>Enable Watermark</span>
              </label>
            </div>
            <div id="watermark-settings" style="display: none;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div>
                  <label style="display: block; margin-bottom: 5px; font-weight: 500;">Type</label>
                  <select id="watermark-type" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="text">Text</option>
                    <option value="image">Image</option>
                  </select>
                </div>
                <div>
                  <label style="display: block; margin-bottom: 5px; font-weight: 500;">Position</label>
                  <select id="watermark-position" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="center">Center</option>
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                  </select>
                </div>
              </div>
              
              <div id="watermark-text-settings" style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Watermark Text</label>
                <input type="text" id="watermark-text" placeholder="Enter watermark text" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 10px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                  <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Font Size</label>
                    <input type="number" id="watermark-font-size" value="48" min="12" max="200" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                  </div>
                  <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Opacity</label>
                    <input type="range" id="watermark-opacity" min="0" max="100" value="30" style="width: 100%;">
                    <span id="opacity-value">30%</span>
                  </div>
                  <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Rotation (degrees)</label>
                    <input type="number" id="watermark-rotation" value="-45" min="-180" max="180" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                  </div>
                </div>
              </div>
              
              <div id="watermark-image-settings" style="display: none; margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Upload Image</label>
                <input type="file" id="watermark-image" accept="image/*" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 10px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Size (%)</label>
                    <input type="number" id="watermark-image-size" value="50" min="10" max="200" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                  </div>
                  <div>
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Opacity</label>
                    <input type="range" id="watermark-image-opacity" min="0" max="100" value="50" style="width: 100%;">
                    <span id="image-opacity-value">50%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Page Background Section -->
          <div class="setting-group" style="margin-bottom: 20px;">
            <h4 style="margin-bottom: 10px; color: #555;">Page Background</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Background Color</label>
                <input type="color" id="page-background-color" value="#ffffff" style="width: 100%; height: 40px; border: 1px solid #ddd; border-radius: 4px;">
              </div>
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Background Image</label>
                <input type="file" id="page-background-image" accept="image/*" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              </div>
            </div>
          </div>

          <!-- Custom Margins Section -->
          <div class="setting-group" style="margin-bottom: 20px;">
            <h4 style="margin-bottom: 10px; color: #555;">Page Margins (mm)</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px;">
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Top</label>
                <input type="number" id="margin-top" value="20" min="0" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              </div>
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Right</label>
                <input type="number" id="margin-right" value="20" min="0" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              </div>
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Bottom</label>
                <input type="number" id="margin-bottom" value="20" min="0" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              </div>
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Left</label>
                <input type="number" id="margin-left" value="20" min="0" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              </div>
            </div>
          </div>

          <!-- Additional Options -->
          <div class="setting-group" style="margin-bottom: 20px;">
            <h4 style="margin-bottom: 10px; color: #555;">Additional Options</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <label style="display: flex; align-items: center; margin-bottom: 10px;">
                  <input type="checkbox" id="print-headers-footers" checked style="margin-right: 8px;">
                  <span>Include Headers & Footers</span>
                </label>
                <label style="display: flex; align-items: center; margin-bottom: 10px;">
                  <input type="checkbox" id="print-backgrounds" checked style="margin-right: 8px;">
                  <span>Print Backgrounds</span>
                </label>
              </div>
              <div>
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Scale (%)</label>
                <input type="number" id="print-scale" value="100" min="50" max="200" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              </div>
            </div>
          </div>

        </div>
        
        <div class="print-dialog-footer" style="padding: 20px; border-top: 1px solid #eee; background: #f8f9fa; border-radius: 0 0 8px 8px; text-align: right;">
          <button id="cancel-print" style="padding: 10px 20px; margin-right: 10px; border: 1px solid #ddd; background: #fff; color: #666; border-radius: 4px; cursor: pointer;">Cancel</button>
          <button id="preview-print" style="padding: 10px 20px; border: none; background: #007bff; color: white; border-radius: 4px; cursor: pointer;">Preview & Print</button>
        </div>
      </div>
    </div>
  `;

  // Add dialog to body
  document.body.insertAdjacentHTML('beforeend', printDialogHTML);

  // Dialog event handlers
  function setupDialogEvents() {
    const dialog = document.querySelector('.print-dialog-overlay');
    const cancelBtn = document.getElementById('cancel-print');
    const previewBtn = document.getElementById('preview-print');
    
    // Paper size change handler
    document.getElementById('paper-size').addEventListener('change', function() {
      const customSize = document.getElementById('custom-size');
      customSize.style.display = this.value === 'custom' ? 'grid' : 'none';
    });

    // Page numbers checkbox
    document.getElementById('enable-page-numbers').addEventListener('change', function() {
      document.getElementById('page-number-settings').style.display = this.checked ? 'grid' : 'none';
    });

    // Watermark checkbox and type
    document.getElementById('enable-watermark').addEventListener('change', function() {
      document.getElementById('watermark-settings').style.display = this.checked ? 'block' : 'none';
    });

    document.getElementById('watermark-type').addEventListener('change', function() {
      const textSettings = document.getElementById('watermark-text-settings');
      const imageSettings = document.getElementById('watermark-image-settings');
      
      if (this.value === 'text') {
        textSettings.style.display = 'block';
        imageSettings.style.display = 'none';
      } else {
        textSettings.style.display = 'none';
        imageSettings.style.display = 'block';
      }
    });

    // Opacity sliders
    document.getElementById('watermark-opacity').addEventListener('input', function() {
      document.getElementById('opacity-value').textContent = this.value + '%';
    });

    document.getElementById('watermark-image-opacity').addEventListener('input', function() {
      document.getElementById('image-opacity-value').textContent = this.value + '%';
    });

    cancelBtn.addEventListener('click', () => {
      dialog.style.display = 'none';
    });

    previewBtn.addEventListener('click', () => {
      const settings = collectPrintSettings();
      dialog.style.display = 'none';
      generatePrintPreview(settings);
    });

    // Close on overlay click
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        dialog.style.display = 'none';
      }
    });
  }

  function collectPrintSettings() {
    return {
      paperSize: document.getElementById('paper-size').value,
      customWidth: document.getElementById('custom-width').value,
      customHeight: document.getElementById('custom-height').value,
      orientation: document.getElementById('orientation').value,
      enablePageNumbers: document.getElementById('enable-page-numbers').checked,
      pageNumberFormat: document.getElementById('page-number-format').value,
      pageNumberPosition: document.getElementById('page-number-position').value,
      pageStartNumber: parseInt(document.getElementById('page-start-number').value),
      enableWatermark: document.getElementById('enable-watermark').checked,
      watermarkType: document.getElementById('watermark-type').value,
      watermarkPosition: document.getElementById('watermark-position').value,
      watermarkText: document.getElementById('watermark-text').value,
      watermarkFontSize: document.getElementById('watermark-font-size').value,
      watermarkOpacity: document.getElementById('watermark-opacity').value,
      watermarkRotation: document.getElementById('watermark-rotation').value,
      watermarkImageSize: document.getElementById('watermark-image-size').value,
      watermarkImageOpacity: document.getElementById('watermark-image-opacity').value,
      pageBackgroundColor: document.getElementById('page-background-color').value,
      marginTop: document.getElementById('margin-top').value,
      marginRight: document.getElementById('margin-right').value,
      marginBottom: document.getElementById('margin-bottom').value,
      marginLeft: document.getElementById('margin-left').value,
      printHeadersFooters: document.getElementById('print-headers-footers').checked,
      printBackgrounds: document.getElementById('print-backgrounds').checked,
      printScale: document.getElementById('print-scale').value
    };
  }

  function generatePrintPreview(settings) {
    const content = extractPrintContent();
    const pages = paginateContent(content, settings);
    
    // Create preview window
    const previewWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
    
    const previewHTML = generatePreviewHTML(pages, settings);
    previewWindow.document.write(previewHTML);
    previewWindow.document.close();
    
    // Add print functionality to preview window
    previewWindow.addEventListener('load', () => {
      const printBtn = previewWindow.document.getElementById('print-pdf');
      printBtn.addEventListener('click', () => {
        previewWindow.print();
      });
    });
  }

function extractPrintContent() {
  // Try multiple methods to get the canvas document
  let canvasDoc;
  
  try {
    // Method 1: Try getDocument()
    canvasDoc = editor.Canvas.getDocument();
  } catch (e) {
    try {
      // Method 2: Try getFrameEl()
      const frameEl = editor.Canvas.getFrameEl();
      canvasDoc = frameEl ? frameEl.contentDocument || frameEl.contentWindow.document : null;
    } catch (e2) {
      try {
        // Method 3: Try getBody() parent document
        const bodyEl = editor.Canvas.getBody();
        canvasDoc = bodyEl ? bodyEl.ownerDocument : null;
      } catch (e3) {
        console.error('Could not access canvas document:', e3);
        canvasDoc = null;
      }
    }
  }
  
  if (!canvasDoc) {
    alert('Cannot access canvas content. Please make sure the editor is fully loaded.');
    return null;
  }

  const container = canvasDoc.querySelector('.print-container');
  if (!container) {
    alert('Please add a Print Container first');
    return null;
  }

  const sections = container.querySelectorAll('.print-section');
  const content = {
    header: null,
    footer: null,
    contentSections: []
  };

  sections.forEach(section => {
    const header = section.querySelector('.print-header');
    const footer = section.querySelector('.print-footer');
    const contentArea = section.querySelector('.print-content');

    if (header && header.innerHTML.trim()) {
      content.header = header.cloneNode(true);
    }
    if (footer && footer.innerHTML.trim()) {
      content.footer = footer.cloneNode(true);
    }
    if (contentArea) {
      content.contentSections.push(contentArea.cloneNode(true));
    }
  });

  return content;
}


  function paginateContent(content, settings) {
    const pages = [];
    const pageHeight = getPageHeight(settings);
    const headerHeight = content.header ? 100 : 0; // Approximate header height
    const footerHeight = content.footer ? 60 : 0; // Approximate footer height
    const availableHeight = pageHeight - headerHeight - footerHeight - 
                           (settings.marginTop + settings.marginBottom);

    let currentPage = {
      header: content.header,
      footer: content.footer,
      content: [],
      pageNumber: settings.pageStartNumber
    };

    let currentHeight = 0;

    content.contentSections.forEach(section => {
      const elements = Array.from(section.children);
      
      elements.forEach(element => {
        // Check for page break
        if (element.hasAttribute('data-page-break')) {
          if (currentPage.content.length > 0) {
            pages.push({ ...currentPage });
            currentPage = {
              header: content.header,
              footer: content.footer,
              content: [],
              pageNumber: pages.length + settings.pageStartNumber
            };
            currentHeight = 0;
          }
          return;
        }

        const elementHeight = estimateElementHeight(element);
        
        // Check if element fits on current page
        if (currentHeight + elementHeight > availableHeight && currentPage.content.length > 0) {
          // Move to next page
          pages.push({ ...currentPage });
          currentPage = {
            header: content.header,
            footer: content.footer,
            content: [],
            pageNumber: pages.length + settings.pageStartNumber
          };
          currentHeight = 0;
        }

        // Check if element can be split (text elements, tables)
        if (canBeSplit(element) && elementHeight > availableHeight) {
          const splitElements = splitElement(element, availableHeight - currentHeight);
          
          if (splitElements.first) {
            currentPage.content.push(splitElements.first);
            pages.push({ ...currentPage });
            currentHeight = 0;
          }
          
          if (splitElements.remaining) {
            currentPage = {
              header: content.header,
              footer: content.footer,
              content: [splitElements.remaining],
              pageNumber: pages.length + settings.pageStartNumber
            };
            currentHeight = estimateElementHeight(splitElements.remaining);
          }
        } else {
          currentPage.content.push(element.cloneNode(true));
          currentHeight += elementHeight;
        }
      });
    });

    if (currentPage.content.length > 0) {
      pages.push(currentPage);
    }

    return pages.length > 0 ? pages : [currentPage];
  }

  function getPageHeight(settings) {
    const sizes = {
      a4: { width: 210, height: 297 },
      a3: { width: 297, height: 420 },
      a5: { width: 148, height: 210 },
      letter: { width: 215.9, height: 279.4 },
      legal: { width: 215.9, height: 355.6 },
      custom: { width: settings.customWidth, height: settings.customHeight }
    };

    const size = sizes[settings.paperSize];
    return settings.orientation === 'landscape' ? size.width : size.height;
  }

  function estimateElementHeight(element) {
    // Rough estimation based on element type and content
    const style = window.getComputedStyle(element);
    const fontSize = parseInt(style.fontSize) || 16;
    const lineHeight = parseFloat(style.lineHeight) || 1.4;
    
    if (element.tagName === 'IMG') {
      return element.offsetHeight || 200; // Default image height
    }
    
    if (element.tagName === 'TABLE') {
      const rows = element.querySelectorAll('tr');
      return rows.length * 30; // Approximate row height
    }
    
    // For text elements
    const text = element.textContent || '';
    const wordsPerLine = 80; // Approximate
    const lines = Math.ceil(text.length / wordsPerLine);
    return lines * fontSize * lineHeight + 20; // Add some padding
  }

  function canBeSplit(element) {
    const splittableElements = ['DIV', 'P', 'SPAN', 'TABLE', 'UL', 'OL'];
    const nonSplittableElements = ['IMG', 'VIDEO', 'CANVAS', 'SVG', 'IFRAME'];
    
    return splittableElements.includes(element.tagName) && 
           !nonSplittableElements.includes(element.tagName);
  }

  function splitElement(element, availableHeight) {
    // Simple text splitting logic
    if (element.tagName === 'P' || element.tagName === 'DIV') {
      const text = element.textContent;
      const words = text.split(' ');
      const wordsPerLine = 80;
      const linesAvailable = Math.floor(availableHeight / 20); // Approximate line height
      const wordsToKeep = Math.max(1, linesAvailable * wordsPerLine);
      
      if (words.length <= wordsToKeep) {
        return { first: element.cloneNode(true), remaining: null };
      }
      
      const firstPart = element.cloneNode(false);
      firstPart.textContent = words.slice(0, wordsToKeep).join(' ') + '...';
      
      const remainingPart = element.cloneNode(false);
      remainingPart.textContent = words.slice(wordsToKeep).join(' ');
      
      return { first: firstPart, remaining: remainingPart };
    }
    
    // For tables, try to split by rows
    if (element.tagName === 'TABLE') {
      const rows = Array.from(element.querySelectorAll('tr'));
      const rowHeight = 30; // Approximate
      const rowsToKeep = Math.floor(availableHeight / rowHeight);
      
      if (rows.length <= rowsToKeep) {
        return { first: element.cloneNode(true), remaining: null };
      }
      
      const firstTable = element.cloneNode(false);
      const tbody = firstTable.querySelector('tbody') || firstTable;
      rows.slice(0, rowsToKeep).forEach(row => tbody.appendChild(row.cloneNode(true)));
      
      const remainingTable = element.cloneNode(false);
      const remainingTbody = remainingTable.querySelector('tbody') || remainingTable;
      rows.slice(rowsToKeep).forEach(row => remainingTbody.appendChild(row.cloneNode(true)));
      
      return { first: firstTable, remaining: remainingTable };
    }
    
    return { first: element.cloneNode(true), remaining: null };
  }

  function generatePreviewHTML(pages, settings) {
    const pageWidth = getPageWidth(settings);
    const pageHeight = getPageHeight(settings);
    
    const watermarkHTML = settings.enableWatermark ? generateWatermarkHTML(settings) : '';
    const pageNumberHTML = settings.enablePageNumbers ? generatePageNumberHTML(settings) : '';
    
    const pagesHTML = pages.map((page, index) => `
      <div class="preview-page" style="
        width: ${pageWidth}mm;
        height: ${pageHeight}mm;
        margin: 10mm auto;
        padding: ${settings.marginTop}mm ${settings.marginRight}mm ${settings.marginBottom}mm ${settings.marginLeft}mm;
        background: ${settings.pageBackgroundColor};
        box-shadow: 0 0 10px rgba(0,0,0,0.3);
        position: relative;
        page-break-after: always;
        box-sizing: border-box;
        overflow: hidden;
      ">
        ${watermarkHTML}
        ${settings.printHeadersFooters && page.header ? `
          <div class="page-header" style="margin-bottom: 10mm;">
            ${page.header.innerHTML}
          </div>
        ` : ''}
        
        <div class="page-content" style="flex: 1; overflow: hidden;">
          ${page.content.map(el => el.outerHTML).join('')}
        </div>
        
        ${settings.printHeadersFooters && page.footer ? `
          <div class="page-footer" style="margin-top: 10mm;">
            ${page.footer.innerHTML}
          </div>
        ` : ''}
        
        ${settings.enablePageNumbers ? `
          <div class="page-number" style="
            position: absolute;
            ${getPageNumberPosition(settings.pageNumberPosition)};
            font-size: 10pt;
            color: #666;
          ">
            ${formatPageNumber(page.pageNumber, settings.pageNumberFormat)}
          </div>
        ` : ''}
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Print Preview</title>
        <style>
          * {
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
          }
          
          .preview-container {
            max-width: ${pageWidth + 40}mm;
            margin: 0 auto;
          }
          
          .preview-header {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
          }
          
          .preview-page {
            background: white;
            display: flex;
            flex-direction: column;
          }
          
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 1;
          }
          
          .watermark.top-left {
            top: 20%;
            left: 20%;
            transform: none;
          }
          
          .watermark.top-right {
            top: 20%;
            right: 20%;
            left: auto;
            transform: none;
          }
          
          .watermark.bottom-left {
            bottom: 20%;
            left: 20%;
            top: auto;
            transform: none;
          }
          
          .watermark.bottom-right {
            bottom: 20%;
            right: 20%;
            left: auto;
            top: auto;
            transform: none;
          }
          
          @media print {
            body {
              background: white;
              padding: 0;
            }
            
            .preview-container {
              max-width: none;
            }
            
            .preview-header {
              display: none;
            }
            
            .preview-page {
              margin: 0;
              box-shadow: none;
              page-break-after: always;
            }
            
            .preview-page:last-child {
              page-break-after: auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="preview-container">
          <div class="preview-header">
            <h2 style="margin: 0 0 10px 0;">Print Preview</h2>
            <p style="margin: 0 0 15px 0; color: #666;">
              ${pages.length} page(s) • ${settings.paperSize.toUpperCase()} ${settings.orientation}
            </p>
            <button id="print-pdf" style="
              background: #007bff;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
            ">
              📄 Print PDF
            </button>
          </div>
          
          ${pagesHTML}
        </div>
      </body>
      </html>
    `;
  }

  function getPageWidth(settings) {
    const sizes = {
      a4: { width: 210, height: 297 },
      a3: { width: 297, height: 420 },
      a5: { width: 148, height: 210 },
      letter: { width: 215.9, height: 279.4 },
      legal: { width: 215.9, height: 355.6 },
      custom: { width: settings.customWidth, height: settings.customHeight }
    };

    const size = sizes[settings.paperSize];
    return settings.orientation === 'landscape' ? size.height : size.width;
  }

  function generateWatermarkHTML(settings) {
    if (settings.watermarkType === 'text') {
      return `
        <div class="watermark ${settings.watermarkPosition}" style="
          font-size: ${settings.watermarkFontSize}px;
          opacity: ${settings.watermarkOpacity / 100};
          color: #999;
          font-weight: bold;
          transform: rotate(${settings.watermarkRotation}deg);
          white-space: nowrap;
          user-select: none;
        ">
          ${settings.watermarkText}
        </div>
      `;
    } else {
      // Image watermark would require base64 conversion
      return `
        <div class="watermark ${settings.watermarkPosition}" style="
          opacity: ${settings.watermarkImageOpacity / 100};
          width: ${settings.watermarkImageSize}%;
        ">
          <!-- Image watermark placeholder -->
        </div>
      `;
    }
  }

  function getPageNumberPosition(position) {
    const positions = {
      'bottom-center': 'bottom: 10mm; left: 50%; transform: translateX(-50%);',
      'bottom-left': 'bottom: 10mm; left: 0;',
      'bottom-right': 'bottom: 10mm; right: 0;',
      'top-center': 'top: 10mm; left: 50%; transform: translateX(-50%);',
      'top-left': 'top: 10mm; left: 0;',
      'top-right': 'top: 10mm; right: 0;'
    };
    return positions[position] || positions['bottom-center'];
  }

  function formatPageNumber(pageNum, format) {
    switch (format) {
      case 'i':
        return toRomanNumerals(pageNum).toLowerCase();
      case 'I':
        return toRomanNumerals(pageNum);
      case 'a':
        return toAlphabetic(pageNum).toLowerCase();
      case 'A':
        return toAlphabetic(pageNum);
      default:
        return pageNum.toString();
    }
  }

  function toRomanNumerals(num) {
    const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const symbols = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
    let result = '';
    
    for (let i = 0; i < values.length; i++) {
      while (num >= values[i]) {
        result += symbols[i];
        num -= values[i];
      }
    }
    return result;
  }

  function toAlphabetic(num) {
    let result = '';
    while (num > 0) {
      num--;
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26);
    }
    return result;
  }

  // Add file to base64 conversion for images
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  // Command to open print dialog
  editor.Commands.add('open-print-dialog', {
    run() {
      const dialog = document.querySelector('.print-dialog-overlay');
      dialog.style.display = 'block';
    }
  });

  // Add components to blocks panel
  editor.BlockManager.add('print-container', {
    label: 'Print Container',
    category: 'Print',
    content: {
      type: 'Print Container'
    },
    attributes: {
      class: 'fa fa-file-o'
    }
  });

  editor.BlockManager.add('print-section', {
    label: 'Print Section',
    category: 'Print',
    content: {
      type: 'Print Section'
    },
    attributes: {
      class: 'fa fa-columns'
    }
  });

  editor.BlockManager.add('page-break', {
    label: 'Page Break',
    category: 'Print',
    content: {
      type: 'Page Break'
    },
    attributes: {
      class: 'fa fa-scissors'
    }
  });

  // Enhanced section management
  editor.on('component:add', (component) => {
    // Auto-setup for print sections
    if (component.get('type') === 'Print Section') {
      // Add drag and drop capabilities for section content
      setTimeout(() => {
        setupSectionDragAndDrop(component);
      }, 100);
    }
  });

  function setupSectionDragAndDrop(sectionComponent) {
    const sectionEl = sectionComponent.getEl();
    if (!sectionEl) return;

    const contentArea = sectionEl.querySelector('.print-content');
    if (!contentArea) return;

    // Make content area droppable
    contentArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    contentArea.addEventListener('drop', (e) => {
      e.preventDefault();
      // Handle dropped components
    });
  }

  // JSON data integration
  editor.Commands.add('load-json-data', {
    run(editor, sender, options = {}) {
      const jsonData = options.data || {};
      
      // Find content areas and populate with JSON data
      const contentAreas = editor.Canvas.getDocument().querySelectorAll('.print-content');
      
      contentAreas.forEach((area, index) => {
        if (jsonData[`content_${index}`]) {
          // Create components from JSON data
          const dataComponent = editor.Components.create({
            tagName: 'div',
            content: formatJsonData(jsonData[`content_${index}`]),
            style: {
              'width': '100%',
              'padding': '10px'
            }
          });
          
          // Add to content area
          const sectionComponent = editor.Components.getByEl(area.closest('.print-section'));
          const contentComponent = sectionComponent.find('.print-content')[0];
          contentComponent.append(dataComponent);
        }
      });
    }
  });

  function formatJsonData(data) {
    if (Array.isArray(data)) {
      // Create table from array data
      return createTableFromArray(data);
    } else if (typeof data === 'object') {
      // Create key-value pairs
      return Object.entries(data)
        .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
        .join('');
    } else {
      return `<p>${data}</p>`;
    }
  }

  function createTableFromArray(data) {
    if (data.length === 0) return '<p>No data available</p>';
    
    const headers = Object.keys(data[0]);
    const headerRow = headers.map(h => `<th>${h}</th>`).join('');
    const rows = data.map(row => 
      `<tr>${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>`
    ).join('');
    
    return `
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
        <thead style="background: #f8f9fa;">
          <tr>${headerRow}</tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  // Initialize dialog events
  setupDialogEvents();

  // Add custom CSS for print components
  const printStyles = `
    .print-container {
      border: 2px dashed #007bff !important;
      position: relative;
    }
    
    .print-container::before {
      content: "📄 Print Container";
      position: absolute;
      top: -20px;
      left: 0;
      background: #007bff;
      color: white;
      padding: 2px 8px;
      font-size: 11px;
      border-radius: 3px;
      z-index: 10;
    }
    
    .print-section {
      border: 1px solid #28a745 !important;
      margin: 10px 0;
      position: relative;
    }
    
    .print-section::before {
      content: "📑 Print Section";
      position: absolute;
      top: -18px;
      right: 0;
      background: #28a745;
      color: white;
      padding: 2px 8px;
      font-size: 11px;
      border-radius: 3px;
      z-index: 10;
    }
    
    .page-break-component {
      border: 2px dashed #ffc107 !important;
      position: relative;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .page-break-component:hover {
      background: rgba(255, 193, 7, 0.1) !important;
      transform: scale(1.02);
    }
    
    .print-header,
    .print-footer {
      min-height: 40px;
      position: relative;
    }
    
    .print-content {
      min-height: 200px;
      position: relative;
    }
    
    .print-header::after {
      content: "Header";
      position: absolute;
      top: 5px;
      right: 5px;
      background: rgba(0,123,255,0.1);
      color: #007bff;
      padding: 2px 6px;
      font-size: 10px;
      border-radius: 2px;
    }
    
    .print-footer::after {
      content: "Footer";
      position: absolute;
      bottom: 5px;
      right: 5px;
      background: rgba(0,123,255,0.1);
      color: #007bff;
      padding: 2px 6px;
      font-size: 10px;
      border-radius: 2px;
    }
    
    .print-content::after {
      content: "Content Area";
      position: absolute;
      top: 5px;
      right: 5px;
      background: rgba(40,167,69,0.1);
      color: #28a745;
      padding: 2px 6px;
      font-size: 10px;
      border-radius: 2px;
    }
    
    @media print {
      .print-container::before,
      .print-section::before,
      .print-header::after,
      .print-footer::after,
      .print-content::after {
        display: none !important;
      }
      
      .print-container,
      .print-section,
      .page-break-component {
        border: none !important;
      }
    }
  `;

  // Inject styles
  const styleEl = document.createElement('style');
  styleEl.innerHTML = printStyles;
  document.head.appendChild(styleEl);

  console.log('Enhanced Print Plugin initialized successfully!');
}

// Usage: initializePrintPlugin(editor);