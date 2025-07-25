// Create new js file and add this code

function drawingTool(editor) {
    // Inject styles into document head
    const styles = `
        /* Drawing Modal Styles */
        #drawing-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            z-index: 10000;
            align-items: center;
            justify-content: center;
        }
        
        .modal-content {
            background: white;
            width: 90%;
            height: 90%;
            border-radius: 10px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .modal-header {
            background: #f1f1f1;
            padding: 15px;
            border-bottom: 1px solid #ccc;
            position: sticky;
            top: 0;
            z-index: 10;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .tool-btn {
            padding: 8px 12px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        }
        
        .tool-btn:hover {
            background: #e9e9e9;
        }
        
        .tool-btn.active {
            background: #007bff;
            color: white;
        }
        
        .tool-input {
            padding: 5px;
            border: 1px solid #ddd;
            border-radius: 3px;
            width: 60px;
        }
        
        .color-input {
            width: 40px;
            height: 30px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }
        
        .canvas-container {
            flex: 1;
            overflow: auto;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f9f9f9;
        }
        
        #modal-canvas {
            border: 1px solid #ccc;
            background: white;
            border-radius: 4px;
        }
        
        .modal-footer {
            padding: 15px;
            text-align: right;
            border-top: 1px solid #ccc;
            background: #f9f9f9;
        }
        
        .footer-btn {
            padding: 10px 20px;
            margin-left: 10px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
        }
        
        .ok-btn {
            background: #28a745;
            color: white;
        }
        
        .cancel-btn {
            background: #dc3545;
            color: white;
        }
        
        .footer-btn:hover {
            opacity: 0.9;
        }
        
        /* Custom block style */
        .drawing-canvas-block {
            min-height: 200px;
            border: 2px dashed #ccc;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #999;
            font-size: 16px;
            cursor: pointer;
        }
    `;

    // Create and inject style element
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);

    // Create and inject modal HTML
    const modalHTML = `
        <div id="drawing-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <button class="tool-btn" id="select-btn">🔲 Select</button>
                    <button class="tool-btn" id="move-btn">✋ Move</button>
                    <button class="tool-btn" id="pencil-btn">✏️ Brush</button>
                    <button class="tool-btn" id="eraser-btn">🧽 Eraser</button>
                    <button class="tool-btn" id="line-btn">📏 Line</button>
                    <button class="tool-btn" id="rect-btn">⬜ Rectangle</button>
                    <button class="tool-btn" id="circle-btn">🔵 Circle</button>
                    <button class="tool-btn" id="text-btn">📝 Text</button>
                    
                    <label style="display: flex; align-items: center; gap: 5px;">
                        Color: <input type="color" id="tool-color" value="#000000" class="color-input">
                    </label>
                    
                    <label style="display: flex; align-items: center; gap: 5px;">
                        Width: <input type="number" id="brush-size" value="5" min="1" max="100" class="tool-input">
                    </label>
                    
                    <button class="tool-btn" id="clear-btn">🗑️ Clear</button>
                    <button class="tool-btn" id="undo-btn">↶ Undo</button>
                    <button class="tool-btn" id="redo-btn">↷ Redo</button>
                    <button class="tool-btn" id="load-image-btn">🖼️ Add Image</button>
                    
                    <div style="display: flex; align-items: center; gap: 10px; margin-left: 20px;">
                        <label style="display: flex; align-items: center; gap: 5px;">
                            Canvas Width: <input type="number" id="canvas-width" value="600" min="200" max="2000" class="tool-input" style="width: 80px;">
                        </label>
                        <label style="display: flex; align-items: center; gap: 5px;">
                            Canvas Height: <input type="number" id="canvas-height" value="300" min="200" max="1500" class="tool-input" style="width: 80px;">
                        </label>
                        <button class="tool-btn" id="resize-canvas-btn">📐 Resize</button>
                    </div>
                </div>
                
                <div class="canvas-container">
                    <canvas id="modal-canvas" width="600" height="300"></canvas>
                </div>
                
                <div class="modal-footer">
                    <button class="footer-btn ok-btn" id="drawing-ok-btn">✅ OK</button>
                    <button class="footer-btn cancel-btn" id="drawing-cancel-btn">❌ Cancel</button>
                </div>
            </div>
        </div>
    `;

    // Create modal element and append to body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);

    editor.DomComponents.addType('drawing-canvas', {
        model: {
            defaults: {
                tagName: 'div',
                classes: ['drawing-canvas-block'],
                content: '🖌️ Click to draw',
                draggable: true,
                droppable: false,
                editable: false,
                removable: true,
                copyable: true,
                traits: [],
            }
        },
        view: {
            events: {
                click: 'openDrawingModal'
            },
            
            openDrawingModal() {
                const model = this.model;
                showDrawingModal(model);
            }
        }
    });

    // Add block to block manager
    editor.BlockManager.add('drawing-canvas-block', {
        label: '🖌️ Drawing Canvas',
        category: 'Media',
        content: {
            type: 'drawing-canvas'
        }
    });

    // Initialize fabric canvas
    const modal = document.getElementById('drawing-modal');
    const fabricCanvas = new fabric.Canvas('modal-canvas', { 
        selection: true,
        preserveObjectStacking: true 
    });
    
    let history = [];
    let historyIndex = -1;
    let currentTool = 'select';
    let isDrawing = false;
    let startX, startY, activeObject;

    // Save state for undo/redo
    function saveState() {
        const state = JSON.stringify(fabricCanvas.toJSON());
        history = history.slice(0, historyIndex + 1);
        history.push(state);
        historyIndex++;
        
        // Limit history size
        if (history.length > 50) {
            history.shift();
            historyIndex--;
        }
    }

    // Tool button references
    const toolButtons = {
        select: document.getElementById('select-btn'),
        move: document.getElementById('move-btn'),
        pencil: document.getElementById('pencil-btn'),
        eraser: document.getElementById('eraser-btn'),
        line: document.getElementById('line-btn'),
        rect: document.getElementById('rect-btn'),
        circle: document.getElementById('circle-btn'),
        text: document.getElementById('text-btn')
    };

    const colorPicker = document.getElementById('tool-color');
    const sizeInput = document.getElementById('brush-size');

    // Set active tool
    function setActiveTool(tool) {
        // Remove active class from all tools
        Object.values(toolButtons).forEach(btn => btn.classList.remove('active'));
        
        // Add active class to current tool
        if (toolButtons[tool]) {
            toolButtons[tool].classList.add('active');
        }
        
        currentTool = tool;
        fabricCanvas.isDrawingMode = false;
        fabricCanvas.selection = true;
        
        // Configure canvas based on tool
        switch(tool) {
            case 'select':
            case 'move':
                fabricCanvas.defaultCursor = 'default';
                break;
            case 'pencil':
                fabricCanvas.isDrawingMode = true;
                fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
                fabricCanvas.freeDrawingBrush.color = colorPicker.value;
                fabricCanvas.freeDrawingBrush.width = parseInt(sizeInput.value, 10);
                break;
            case 'eraser':
                fabricCanvas.isDrawingMode = true;
                fabricCanvas.freeDrawingBrush = new fabric.EraserBrush(fabricCanvas);
                fabricCanvas.freeDrawingBrush.width = parseInt(sizeInput.value, 10);
                break;
            default:
                fabricCanvas.defaultCursor = 'crosshair';
                fabricCanvas.selection = false;
        }
    }

    // Tool event listeners
    toolButtons.select.onclick = () => setActiveTool('select');
    toolButtons.move.onclick = () => setActiveTool('move');
    toolButtons.pencil.onclick = () => setActiveTool('pencil');
    toolButtons.eraser.onclick = () => setActiveTool('eraser');
    toolButtons.line.onclick = () => setActiveTool('line');
    toolButtons.rect.onclick = () => setActiveTool('rect');
    toolButtons.circle.onclick = () => setActiveTool('circle');
    toolButtons.text.onclick = () => setActiveTool('text');

    // Color and size changes
    colorPicker.onchange = () => {
        if (fabricCanvas.freeDrawingBrush) {
            fabricCanvas.freeDrawingBrush.color = colorPicker.value;
        }
    };

    sizeInput.onchange = () => {
        if (fabricCanvas.freeDrawingBrush) {
            fabricCanvas.freeDrawingBrush.width = parseInt(sizeInput.value, 10);
        }
    };

    // Clear canvas
    document.getElementById('clear-btn').onclick = () => {
        fabricCanvas.clear();
        saveState();
    };

    // Undo functionality
    document.getElementById('undo-btn').onclick = () => {
        if (historyIndex > 0) {
            historyIndex--;
            fabricCanvas.loadFromJSON(history[historyIndex], () => {
                fabricCanvas.renderAll();
            });
        }
    };

    // Redo functionality
    document.getElementById('redo-btn').onclick = () => {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            fabricCanvas.loadFromJSON(history[historyIndex], () => {
                fabricCanvas.renderAll();
            });
        }
    };

    // Load image
    document.getElementById('load-image-btn').onclick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    fabric.Image.fromURL(event.target.result, (img) => {
                        img.scale(0.5);
                        fabricCanvas.add(img);
                        fabricCanvas.centerObject(img);
                        saveState();
                    });
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };

    // Canvas resize functionality
    document.getElementById('resize-canvas-btn').onclick = () => {
        const newWidth = parseInt(document.getElementById('canvas-width').value, 10);
        const newHeight = parseInt(document.getElementById('canvas-height').value, 10);
        
        if (newWidth && newHeight && newWidth >= 200 && newHeight >= 200) {
            fabricCanvas.setDimensions({
                width: newWidth,
                height: newHeight
            });
            
            // Update canvas element attributes
            const canvasElement = document.getElementById('modal-canvas');
            canvasElement.width = newWidth;
            canvasElement.height = newHeight;
            
            fabricCanvas.renderAll();
            saveState();
        } else {
            alert('Please enter valid dimensions (minimum 200px)');
        }
    };

    // Canvas mouse events for shape drawing
    fabricCanvas.on('mouse:down', (e) => {
        if (['line', 'rect', 'circle', 'text'].includes(currentTool)) {
            isDrawing = true;
            const pointer = fabricCanvas.getPointer(e.e);
            startX = pointer.x;
            startY = pointer.y;

            if (currentTool === 'text') {
                const text = new fabric.IText('Type here...', {
                    left: startX,
                    top: startY,
                    fontFamily: 'Arial',
                    fontSize: parseInt(sizeInput.value, 10) * 2,
                    fill: colorPicker.value
                });
                fabricCanvas.add(text);
                fabricCanvas.setActiveObject(text);
                text.enterEditing();
                saveState();
                return;
            }

            let shape;
            switch(currentTool) {
                case 'line':
                    shape = new fabric.Line([startX, startY, startX, startY], {
                        stroke: colorPicker.value,
                        strokeWidth: parseInt(sizeInput.value, 10)
                    });
                    break;
                case 'rect':
                    shape = new fabric.Rect({
                        left: startX,
                        top: startY,
                        width: 1,
                        height: 1,
                        fill: 'transparent',
                        stroke: colorPicker.value,
                        strokeWidth: parseInt(sizeInput.value, 10)
                    });
                    break;
                case 'circle':
                    shape = new fabric.Circle({
                        left: startX,
                        top: startY,
                        radius: 1,
                        fill: 'transparent',
                        stroke: colorPicker.value,
                        strokeWidth: parseInt(sizeInput.value, 10)
                    });
                    break;
            }

            if (shape) {
                fabricCanvas.add(shape);
                activeObject = shape;
            }
        }
    });

    fabricCanvas.on('mouse:move', (e) => {
        if (!isDrawing || !activeObject) return;

        const pointer = fabricCanvas.getPointer(e.e);

        switch(currentTool) {
            case 'line':
                activeObject.set({
                    x2: pointer.x,
                    y2: pointer.y
                });
                break;
            case 'rect':
                const width = Math.abs(pointer.x - startX);
                const height = Math.abs(pointer.y - startY);
                activeObject.set({
                    width: width,
                    height: height,
                    left: Math.min(startX, pointer.x),
                    top: Math.min(startY, pointer.y)
                });
                break;
            case 'circle':
                const radius = Math.sqrt(Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2)) / 2;
                activeObject.set({
                    radius: radius,
                    left: startX - radius,
                    top: startY - radius
                });
                break;
        }
        fabricCanvas.renderAll();
    });

    fabricCanvas.on('mouse:up', () => {
        if (isDrawing) {
            isDrawing = false;
            activeObject = null;
            saveState();
        }
    });

    // Save state when path is created (for brush tool)
    fabricCanvas.on('path:created', () => {
        saveState();
    });

    // Initialize with select tool
    setActiveTool('select');
    saveState(); // Initial state

    // Modal functions
    function showDrawingModal(model) {
        modal.style.display = 'flex';
        fabricCanvas.clear();
        history = [];
        historyIndex = -1;
        saveState();

        // Handle OK button
        document.getElementById('drawing-ok-btn').onclick = () => {
            const dataURL = fabricCanvas.toDataURL({
                format: 'png',
                quality: 1,
                multiplier: 1
            });
            
            // Create img element and replace the drawing block
            const imgElement = `<img src="${dataURL}" style="max-width: 100%; height: auto; display: block;">`;
            model.replaceWith(imgElement);
            
            modal.style.display = 'none';
        };

        // Handle Cancel button - Don't remove the component, just close modal
        document.getElementById('drawing-cancel-btn').onclick = () => {
            modal.style.display = 'none';
            // Keep the drawing block so user can try again
        };
    }

    // Close modal when clicking outside
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };
}