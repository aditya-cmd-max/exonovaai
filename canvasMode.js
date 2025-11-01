// canvasMode.js - Visual Canvas for Clover AI
class CanvasMode {
    constructor() {
        this.isActive = false;
        this.canvas = null;
        this.context = null;
        this.elements = [];
        this.selectedElement = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.currentTool = 'select';
        this.colors = {
            primary: '#6750A4',
            secondary: '#EADDFF',
            background: '#FEF7FF',
            text: '#1C1B1F',
            accent: '#FF4F5A'
        };
        
        this.initializeCanvas();
    }

    initializeCanvas() {
        // Create canvas container
        this.container = document.createElement('div');
        this.container.className = 'canvas-container';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${this.colors.background};
            z-index: 2000;
            display: none;
            font-family: 'Product Sans', sans-serif;
        `;

        // Create toolbar
        this.createToolbar();

        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight - 60;
        this.canvas.style.cssText = `
            width: 100%;
            height: calc(100% - 60px);
            cursor: crosshair;
            background: transparent;
        `;

        this.context = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);

        // Add event listeners
        this.setupEventListeners();
        
        // Add to document
        document.body.appendChild(this.container);

        // Handle window resize
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'canvas-toolbar';
        toolbar.style.cssText = `
            height: 60px;
            background: ${this.colors.primary};
            display: flex;
            align-items: center;
            padding: 0 20px;
            gap: 15px;
            color: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        `;

        // Close button
        const closeBtn = this.createToolbarButton('close', 'Close Canvas', () => {
            this.hide();
        });

        // Tool buttons
        const selectBtn = this.createToolbarButton('ads_click', 'Select', () => {
            this.setTool('select');
        });

        const textBtn = this.createToolbarButton('title', 'Add Text', () => {
            this.setTool('text');
        });

        const noteBtn = this.createToolbarButton('sticky_note_2', 'Add Note', () => {
            this.setTool('note');
        });

        const shapeBtn = this.createToolbarButton('category', 'Add Shape', () => {
            this.setTool('shape');
        });

        const drawBtn = this.createToolbarButton('edit', 'Draw', () => {
            this.setTool('draw');
        });

        // Export button
        const exportBtn = this.createToolbarButton('download', 'Export', () => {
            this.exportCanvas();
        });

        // Clear button
        const clearBtn = this.createToolbarButton('delete', 'Clear', () => {
            this.clearCanvas();
        });

        toolbar.appendChild(closeBtn);
        toolbar.appendChild(this.createSeparator());
        toolbar.appendChild(selectBtn);
        toolbar.appendChild(textBtn);
        toolbar.appendChild(noteBtn);
        toolbar.appendChild(shapeBtn);
        toolbar.appendChild(drawBtn);
        toolbar.appendChild(this.createSeparator());
        toolbar.appendChild(exportBtn);
        toolbar.appendChild(clearBtn);

        this.container.appendChild(toolbar);
    }

    createToolbarButton(icon, title, onClick) {
        const button = document.createElement('button');
        button.innerHTML = `<span class="material-icons-round" style="font-size: 20px;">${icon}</span>`;
        button.title = title;
        button.style.cssText = `
            background: transparent;
            border: none;
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.background = 'rgba(255,255,255,0.1)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.background = 'transparent';
        });

        button.addEventListener('click', onClick);

        return button;
    }

    createSeparator() {
        const separator = document.createElement('div');
        separator.style.cssText = `
            width: 1px;
            height: 30px;
            background: rgba(255,255,255,0.3);
            margin: 0 5px;
        `;
        return separator;
    }

    setTool(tool) {
        this.currentTool = tool;
        
        // Update cursor
        const cursors = {
            select: 'default',
            text: 'text',
            note: 'crosshair',
            shape: 'crosshair',
            draw: 'crosshair'
        };
        
        this.canvas.style.cursor = cursors[tool] || 'crosshair';
        
        // Visual feedback for active tool
        document.querySelectorAll('.canvas-toolbar button').forEach(btn => {
            btn.style.background = 'transparent';
        });
        
        // Highlight active tool (simplified - in real implementation, you'd track active button)
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.currentTool === 'select') {
            this.selectedElement = this.getElementAt(x, y);
            if (this.selectedElement) {
                this.isDragging = true;
                this.dragOffset.x = x - this.selectedElement.x;
                this.dragOffset.y = y - this.selectedElement.y;
            }
        } else if (this.currentTool === 'draw') {
            this.isDrawing = true;
            this.lastX = x;
            this.lastY = y;
        }

        this.render();
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.isDragging && this.selectedElement) {
            this.selectedElement.x = x - this.dragOffset.x;
            this.selectedElement.y = y - this.dragOffset.y;
            this.render();
        } else if (this.isDrawing && this.currentTool === 'draw') {
            this.elements.push({
                type: 'line',
                x1: this.lastX,
                y1: this.lastY,
                x2: x,
                y2: y,
                color: this.colors.primary,
                width: 3
            });
            this.lastX = x;
            this.lastY = y;
            this.render();
        }
    }

    handleMouseUp() {
        this.isDragging = false;
        this.isDrawing = false;
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.currentTool === 'text') {
            this.addTextElement(x, y);
        } else if (this.currentTool === 'note') {
            this.addNoteElement(x, y);
        } else if (this.currentTool === 'shape') {
            this.addShapeElement(x, y);
        }
    }

    handleKeyDown(e) {
        if (e.key === 'Delete' && this.selectedElement) {
            this.elements = this.elements.filter(el => el !== this.selectedElement);
            this.selectedElement = null;
            this.render();
        }
    }

    handleResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight - 60;
        this.render();
    }

    getElementAt(x, y) {
        for (let i = this.elements.length - 1; i >= 0; i--) {
            const element = this.elements[i];
            if (this.isPointInElement(x, y, element)) {
                return element;
            }
        }
        return null;
    }

    isPointInElement(x, y, element) {
        switch (element.type) {
            case 'text':
            case 'note':
                return x >= element.x && x <= element.x + element.width &&
                       y >= element.y && y <= element.y + element.height;
            case 'shape':
                return x >= element.x && x <= element.x + element.width &&
                       y >= element.y && y <= element.y + element.height;
            case 'line':
                // Simple distance to line check (simplified)
                const distance = this.pointToLineDistance(x, y, element.x1, element.y1, element.x2, element.y2);
                return distance < 10;
            default:
                return false;
        }
    }

    pointToLineDistance(x, y, x1, y1, x2, y2) {
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) {
            param = dot / lenSq;
        }

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    addTextElement(x, y) {
        const text = prompt('Enter text:');
        if (text) {
            this.elements.push({
                type: 'text',
                x: x,
                y: y,
                text: text,
                color: this.colors.text,
                fontSize: 16,
                fontFamily: 'Product Sans, sans-serif'
            });
            this.render();
        }
    }

    addNoteElement(x, y) {
        const text = prompt('Enter note content:');
        if (text) {
            this.elements.push({
                type: 'note',
                x: x,
                y: y,
                text: text,
                color: this.colors.secondary,
                textColor: this.colors.text,
                width: 200,
                height: 150
            });
            this.render();
        }
    }

    addShapeElement(x, y) {
        this.elements.push({
            type: 'shape',
            x: x,
            y: y,
            width: 100,
            height: 100,
            color: this.colors.primary,
            shape: 'rectangle'
        });
        this.render();
    }

    render() {
        // Clear canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid (subtle background)
        this.drawGrid();

        // Draw all elements
        this.elements.forEach(element => {
            this.drawElement(element);
        });

        // Draw selection highlight
        if (this.selectedElement) {
            this.drawSelection(this.selectedElement);
        }
    }

    drawGrid() {
        this.context.strokeStyle = 'rgba(0,0,0,0.05)';
        this.context.lineWidth = 1;

        const gridSize = 20;
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.context.beginPath();
            this.context.moveTo(x, 0);
            this.context.lineTo(x, this.canvas.height);
            this.context.stroke();
        }

        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.context.beginPath();
            this.context.moveTo(0, y);
            this.context.lineTo(this.canvas.width, y);
            this.context.stroke();
        }
    }

    drawElement(element) {
        switch (element.type) {
            case 'text':
                this.drawText(element);
                break;
            case 'note':
                this.drawNote(element);
                break;
            case 'shape':
                this.drawShape(element);
                break;
            case 'line':
                this.drawLine(element);
                break;
        }
    }

    drawText(element) {
        this.context.fillStyle = element.color;
        this.context.font = `${element.fontSize}px ${element.fontFamily}`;
        this.context.fillText(element.text, element.x, element.y);
        
        // Store dimensions for selection
        const metrics = this.context.measureText(element.text);
        element.width = metrics.width;
        element.height = element.fontSize;
    }

    drawNote(element) {
        // Draw note background
        this.context.fillStyle = element.color;
        this.context.fillRect(element.x, element.y, element.width, element.height);
        
        // Draw note shadow
        this.context.shadowColor = 'rgba(0,0,0,0.1)';
        this.context.shadowBlur = 4;
        this.context.shadowOffsetX = 2;
        this.context.shadowOffsetY = 2;
        
        // Draw note content
        this.context.fillStyle = element.textColor;
        this.context.font = '14px Product Sans, sans-serif';
        this.context.fillText(element.text, element.x + 10, element.y + 25);
        
        // Reset shadow
        this.context.shadowColor = 'transparent';
        this.context.shadowBlur = 0;
        this.context.shadowOffsetX = 0;
        this.context.shadowOffsetY = 0;
    }

    drawShape(element) {
        this.context.fillStyle = element.color + '40'; // Add transparency
        this.context.strokeStyle = element.color;
        this.context.lineWidth = 2;

        if (element.shape === 'rectangle') {
            this.context.fillRect(element.x, element.y, element.width, element.height);
            this.context.strokeRect(element.x, element.y, element.width, element.height);
        } else if (element.shape === 'circle') {
            this.context.beginPath();
            this.context.arc(element.x + element.width/2, element.y + element.height/2, element.width/2, 0, 2 * Math.PI);
            this.context.fill();
            this.context.stroke();
        }
    }

    drawLine(element) {
        this.context.strokeStyle = element.color;
        this.context.lineWidth = element.width;
        this.context.lineCap = 'round';

        this.context.beginPath();
        this.context.moveTo(element.x1, element.y1);
        this.context.lineTo(element.x2, element.y2);
        this.context.stroke();
    }

    drawSelection(element) {
        this.context.strokeStyle = this.colors.accent;
        this.context.lineWidth = 2;
        this.context.setLineDash([5, 5]);

        let x, y, width, height;

        switch (element.type) {
            case 'text':
                x = element.x - 5;
                y = element.y - element.height - 5;
                width = element.width + 10;
                height = element.height + 10;
                break;
            case 'note':
            case 'shape':
                x = element.x - 5;
                y = element.y - 5;
                width = element.width + 10;
                height = element.height + 10;
                break;
            case 'line':
                // Draw bounding box around line
                x = Math.min(element.x1, element.x2) - 5;
                y = Math.min(element.y1, element.y2) - 5;
                width = Math.abs(element.x2 - element.x1) + 10;
                height = Math.abs(element.y2 - element.y1) + 10;
                break;
        }

        if (x !== undefined) {
            this.context.strokeRect(x, y, width, height);
        }

        this.context.setLineDash([]);
    }

    exportCanvas() {
        const link = document.createElement('a');
        link.download = 'clover-ai-canvas.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }

    clearCanvas() {
        if (confirm('Are you sure you want to clear the canvas? This cannot be undone.')) {
            this.elements = [];
            this.selectedElement = null;
            this.render();
        }
    }

    show() {
        this.container.style.display = 'block';
        this.isActive = true;
        this.render();
        
        // Add some sample elements for demonstration
        if (this.elements.length === 0) {
            this.addSampleElements();
        }
    }

    hide() {
        this.container.style.display = 'none';
        this.isActive = false;
    }

    toggle() {
        if (this.isActive) {
            this.hide();
        } else {
            this.show();
        }
    }

    addSampleElements() {
        // Add some sample elements to demonstrate the canvas
        this.elements.push(
            {
                type: 'text',
                x: 100,
                y: 100,
                text: 'Welcome to Canvas Mode!',
                color: this.colors.text,
                fontSize: 24,
                fontFamily: 'Product Sans, sans-serif'
            },
            {
                type: 'note',
                x: 100,
                y: 150,
                text: 'This is a sticky note. You can move it around and add your own content!',
                color: this.colors.secondary,
                textColor: this.colors.text,
                width: 250,
                height: 120
            },
            {
                type: 'shape',
                x: 400,
                y: 100,
                width: 120,
                height: 120,
                color: this.colors.primary,
                shape: 'rectangle'
            },
            {
                type: 'line',
                x1: 100,
                y1: 300,
                x2: 300,
                y2: 400,
                color: this.colors.accent,
                width: 3
            }
        );
        
        this.render();
    }

    // Method to convert chat content to canvas elements
    importFromChat(messages) {
        // Clear existing elements
        this.elements = [];
        
        let yOffset = 100;
        
        messages.forEach((message, index) => {
            if (message.role === 'user' || message.role === 'model') {
                const text = `${message.role === 'user' ? 'You' : 'Clover AI'}: ${message.parts[0].text}`;
                
                this.elements.push({
                    type: 'note',
                    x: 100,
                    y: yOffset,
                    text: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
                    color: message.role === 'user' ? '#E8DEF8' : '#EADDFF',
                    textColor: this.colors.text,
                    width: 300,
                    height: 120
                });
                
                yOffset += 140;
            }
        });
        
        this.render();
    }
}

// Create global instance
window.CloverCanvas = new CanvasMode();
