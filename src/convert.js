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

        // const filename = `raw3.json`;
        // const outputPath = path.join('src/converted', filename);
        // fs.writeFileSync(outputPath, psdJson);
        //
        // console.log(`Converted PSD to JSON successfully.`);

        return psdJson;
    } catch (error) {
        console.error('Error converting PSD to JSON:', error);
    }
}

function generatePolotnoJsonOutput(input) {
    let outputPolotnoFormat = {
        "width": input.width,
        "height": input.height,
        "fonts": [],
        "pages": [
            {
                "id": "page_1",
                "children": [],
                "width": "auto",
                "height": "auto",
                "background": "#FFFFFF",
                "bleed": 0,
                "duration": 5000
            }
        ],
        "unit": "px",
        "dpi": 72
    };

    input.children.forEach(layer => {
        let width = layer.right - layer.left;
        let height = layer.bottom - layer.top;
        // let x = child.left + width / 2;
        // let y = input.height - (child.top + height / 2);
        let x = layer.left;
        let y = layer.top;

        let children = {
            "id": layer.id.toString(),
            "name": layer.name,
            "width": width,
            "height": height,
            "x": x,
            "y": y,
            "opacity": 1,
            "visible": true,
        };

        if (layer.hasOwnProperty('text')) {
            children = assembleTextFormat(layer, children);
        } else {
            children = assembleImageFormat(layer, children);
        }

        if (!layer.hidden){
            outputPolotnoFormat.pages[0].children.push(children);
        }
    });

    return outputPolotnoFormat;
}

function assembleImageFormat(layer, layerChildren) {
    let output = {
        "type": "image",
        "src": layer.imageBase64
    }

    return {...layerChildren, ...output};
}

function assembleTextFormat(layer, layerChildren) {
    const dropShadowEffect = layer?.effects?.dropShadow[0];
    const strokeEffect = layer?.effects?.stroke[0];
    const layerText = layer.text;

    let output = {
        "type": "text",
        "rotation": 0,
        "locked": false,
        "blurEnabled": false,
        "blurRadius": 10,
        "brightnessEnabled": false,
        "brightness": 0,
        "shadowEnabled": dropShadowEffect?.enabled,
        "shadowBlur": dropShadowEffect?.enabled ? dropShadowEffect?.size.value : 0,
        "shadowOffsetX": dropShadowEffect?.enabled ? dropShadowEffect?.distance.value : 0,
        "shadowOffsetY": dropShadowEffect?.enabled ? dropShadowEffect?.distance.value : 0,
        "shadowColor": dropShadowEffect?.enabled ? rgbToHex(dropShadowEffect?.color) : '',
        "shadowOpacity": dropShadowEffect?.enabled ? dropShadowEffect?.opacity : 1,
        "text": layerText?.text,
        "placeholder": layerText.text,
        "fontSize": Math.round(layerText.style.fontSize),
        "fontFamily": layerText.style.font.name,
        "fontStyle": layerText.style.fauxItalic ? "italic" : "normal",
        "fontWeight": layerText.style.fauxBold ? "bold" : "normal",
        "textDecoration": "",
        "fill": rgbToHex(layerText.style.fillColor),
        "align": layerText.paragraphStyle.justification,
        "strokeWidth": strokeEffect?.enabled ? strokeEffect?.size.value : 0,
        "stroke": strokeEffect?.enabled ? rgbToHex(strokeEffect.color) : '',
        "lineHeight": 0.1,
        // "letterSpacing": layerText?.paragraphStyle.letterSpacing[0],
        "letterSpacing": 0.00,
        "backgroundEnabled": false,
        "backgroundColor": "#7ED321",
        "backgroundOpacity": 1,
        "backgroundCornerRadius": 0.5,
        "backgroundPadding": 0.5,
        "selectable": true,
        "alwaysOnTop": false,
        "showInExport": true,
        "draggable": true,
        "contentEditable": true,
        "removable": true,
        "resizable": true,
        "styleEditable": true
    };

    return {...layerChildren, ...output};

    // const originalObject = {
    //     // Original object here
    // };
    //
    // const transformedObject = {
    //     type: 'Text',
    //     x: originalObject.text.transform[4],
    //     y: originalObject.text.transform[5],
    //     rotation: 0,
    //     locked: false,
    //     blurEnabled: false,
    //     blurRadius: 0,
    //     brightnessEnabled: false,
    //     brightness: 0,
    //     shadowEnabled: true,
    //     shadowBlur: originalObject.effects.dropShadow[0].size.value,
    //     shadowOffsetX: originalObject.effects.dropShadow[0].distance.value,
    //     shadowOffsetY: originalObject.effects.dropShadow[0].distance.value,
    //     shadowColor: `rgba(${originalObject.effects.dropShadow[0].color.r}, ${originalObject.effects.dropShadow[0].color.g}, ${originalObject.effects.dropShadow[0].color.b}, ${originalObject.effects.dropShadow[0].opacity})`,
    //     shadowOpacity: 1,
    //     name: originalObject.name,
    //     text: originalObject.text.text,
    //     placeholder: '',
    //     fontSize: originalObject.text.style.fontSize,
    //     fontFamily: originalObject.text.style.font.name,
    //     fontStyle: originalObject.text.style.font.type === 1 ? 'normal' : 'italic',
    //     fontWeight: originalObject.text.style.font.synthetic === 2 ? 'bold' : 'normal',
    //     textDecoration: 'none',
    //     fill: `#${Math.floor(originalObject.text.style.fillColor.r).toString(16).padStart(2, '0')}${Math.floor(originalObject.text.style.fillColor.g).toString(16).padStart(2, '0')}${Math.floor(originalObject.text.style.fillColor.b).toString(16).padStart(2, '0')}`,
    //     align: originalObject.text.paragraphStyle.justification === 'center' ? 'center' : 'left',
    //     width: originalObject.text.bounds.right.value - originalObject.text.bounds.left.value,
    //     strokeWidth: 0,
    //     stroke: '#000000',
    //     lineHeight: 1.2,
    //     letterSpacing: originalObject.text.style.tracking,
    //     backgroundEnabled: false,
    //     backgroundColor: '#ffffff',
    //     backgroundOpacity: 1,
    //     backgroundCornerRadius: 0,
    //     backgroundPadding: 0
    // };
    //
    // console.log(transformedObject);


//     const sourceJson = {
//         // ... (the provided JSON object)
//     };
//
// // Function to transform the source JSON into the desired format
//     function transformJson(source) {
//         return {
//             type: "Text",
//             x: source.text.transform[4],
//             y: source.text.transform[5],
//             rotation: 0,
//             locked: false,
//             blurEnabled: false,
//             blurRadius: 0,
//             brightnessEnabled: false,
//             brightness: 0,
//             shadowEnabled: source.effects.dropShadow[0].enabled,
//             shadowBlur: source.effects.dropShadow[0].size.value,
//             shadowOffsetX: source.effects.dropShadow[0].distance.value,
//             shadowOffsetY: source.effects.dropShadow[0].distance.value,
//             shadowColor: `rgba(${source.effects.dropShadow[0].color.r}, ${source.effects.dropShadow[0].color.g}, ${source.effects.dropShadow[0].color.b}, ${source.effects.dropShadow[0].opacity})`,
//             shadowOpacity: 1,
//             name: source.name,
//             text: source.text.text,
//             placeholder: "",
//             fontSize: source.text.style.fontSize,
//             fontFamily: source.text.style.font.name,
//             fontStyle: "normal",
//             fontWeight: source.text.style.fauxBold ? "bold" : "normal",
//             textDecoration: "none",
//             fill: `#${Math.round(source.text.style.fillColor.r).toString(16).padStart(2, '0')}${Math.round(source.text.style.fillColor.g).toString(16).padStart(2, '0')}${Math.round(source.text.style.fillColor.b).toString(16).padStart(2, '0')}`,
//             align: "center",
//             width: source.text.bounds.right.value - source.text.bounds.left.value,
//             strokeWidth: 0,
//             stroke: "#000000",
//             lineHeight: 1.2,
//             letterSpacing: source.text.style.tracking,
//             backgroundEnabled: false,
//             backgroundColor: "#ffffff",
//             backgroundOpacity: 1,
//             backgroundCornerRadius: 0,
//             backgroundPadding: 0,
//         };
//     }
//
// // Transform the source JSON
//     const transformedJson = transformJson(sourceJson);
//
// // Output the transformed JSON
//     console.log(JSON.stringify(transformedJson, null, 2));



}

function rgbToHex(colorObject) {
    function componentToHex(c) {
        const rounded = Math.round(c);
        const hex = rounded.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }

    const hexR = componentToHex(colorObject.r);
    const hexG = componentToHex(colorObject.g);
    const hexB = componentToHex(colorObject.b);

    return "#" + hexR + hexG + hexB;
}

module.exports = { convertPsdToJson, generatePolotnoJsonOutput };
