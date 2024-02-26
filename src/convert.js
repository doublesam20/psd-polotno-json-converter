const fs = require('fs');
const { createCanvas, Image } = require('canvas');
const { readPsd, initializeCanvas } = require('ag-psd');
const path = require('path');

// Initialize ag-psd with node-canvas
initializeCanvas(createCanvas, Image);

function convertLayerToBase64(layer) {
    if (layer.canvas) {
        // Convert canvas to buffer
        const buffer = layer.canvas.toBuffer('image/png');
        // Convert buffer to base64 string
        const base64 = buffer.toString('base64');
        // Return a data URI
        return `data:image/png;base64,${base64}`;
    }
    return null;
}

function processLayers(layers) {
    layers.forEach(layer => {
        // Process child layers recursively if it's a group
        if (layer.children) {
            processLayers(layer.children);
        }

        // Convert image data to base64 string
        layer.imageBase64 = convertLayerToBase64(layer);
        // Remove canvas object to avoid serialization issues
        delete layer.canvas;
    });
}

function safeStringify(obj) {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                // Duplicate reference found, skip it
                return;
            }
            seen.add(value);
        }
        return value;
    });
}

const convertPsdToJson = (psdFilePath) => {
    try {
        const buffer = fs.readFileSync(psdFilePath);
        const psd = readPsd(buffer);

        // Process layers to include base64-encoded images
        if (psd.children) {
            processLayers(psd.children);
        }

        const psdJson = safeStringify(psd);

        // const filename = `raw.json`;
        // const outputPath = path.join('src/converted', filename);
        // fs.writeFileSync(outputPath, psdJson);

        console.log(`Converted PSD to JSON successfully.`);

        return psdJson;
    } catch (error) {
        console.error('Error converting PSD to JSON:', error);
    }
}

function generatePolotnoJsonOutput(input) {
    let output = {
        "width": input.width,
        "height": input.height,
        "fonts": [],
        "pages": [],
        "unit": "px",
        "dpi": 72
    };

    input.children.forEach(child => {
        // let page = {
        //     "id": child.id.toString(),
        //     "name": child.name,
        //     "width": output.width,
        //     "height": output.height,
        //     "x": 0,
        //     "y": 0,
        //     "type": "image",
        //     "src": child.imageBase64
        // };

        let page = {
            "id": child.id.toString(),
            "name": child.name,
            "width": input.width - (child.left + child.right),
            "height": input.height - (child.top + child.bottom),
            "x": child.referencePoint.x,
            "y": child.referencePoint.y,
            "type": "image",
            "src": child.imageBase64
        };

        output.pages.push(page);
    });

    return output;
}


module.exports = { convertPsdToJson, generatePolotnoJsonOutput };

// Example usage
// const psdFilePath = 'logo.psd';
// const outputJsonFilePath = 'output77.json';
// const psdJson = convertPsdToJson(psdFilePath);
// const output = generateOutput(JSON.parse(psdJson));
// fs.writeFileSync(outputJsonFilePath, JSON.stringify(output, null, 2));
