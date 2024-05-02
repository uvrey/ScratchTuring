const EventEmitter = require('events');

const hull = require('hull.js');
const twgl = require('twgl.js');

const BitmapSkin = require('./rendering/BitmapSkin');
const Drawable = require('./rendering/Drawable');
const Rectangle = require('./rendering/Rectangle');
const PenSkin = require('./rendering/PenSkin');
const RenderConstants = require('./rendering/RenderConstants');
const ShaderManager = require('./rendering/ShaderManager');
const SVGSkin = require('./rendering/SVGSkin');
const TextBubbleSkin = require('./rendering/TextBubbleSkin');
const EffectTransform = require('./rendering/EffectTransform');
const log = require('./rendering/util/log');

const __isTouchingDrawablesPoint = twgl.v3.create();
const __candidatesBounds = new Rectangle();
const __fenceBounds = new Rectangle();
const __touchingColor = new Uint8ClampedArray(4);
const __blendColor = new Uint8ClampedArray(4);

/**
 * Return drawable pixel data and color at a given position
 * @param {int} x The client x coordinate of the picking location.
 * @param {int} y The client y coordinate of the picking location.
 * @param {int} radius The client radius to extract pixels with.
 * @return {?ColorExtraction} Data about the picked color
 */
function turingExtractColor(renderer, x, y, radius, debug = false) {
    renderer._doExitDrawRegion();

    console.log("Before sprite coordinate conversion!")
    console.log("x: " + x)
    console.log("y: " + y)

    console.log("Native size?")
    console.log(renderer._nativeSize)

    console.log("Canvas width?")
    console.log(renderer._gl.canvas.clientWidth)

    console.log("Canvas height?")
    console.log(renderer._gl.canvas.clientHeight)

    const scratchX = Math.round(renderer._nativeSize[0] * ((x / renderer._gl.canvas.clientWidth) - 0.5));
    const scratchY = Math.round(-renderer._nativeSize[1] * ((y / renderer._gl.canvas.clientHeight) - 0.5));

    console.log("After sprite coordinate conversion!")
    console.log("x: " + scratchX)
    console.log("y: " + scratchY)

    const gl = renderer._gl;
    twgl.bindFramebufferInfo(gl, renderer._queryBufferInfo);

    const bounds = new Rectangle();
    bounds.initFromBounds(scratchX - radius, scratchX + radius, scratchY - radius, scratchY + radius);

    const pickX = scratchX - bounds.left;
    const pickY = bounds.top - scratchY;

    console.log("Pick X,Y coords?")
    console.log(pickX + ", " + pickY)

    gl.viewport(0, 0, bounds.width, bounds.height);
    const projection = twgl.m4.ortho(bounds.left, bounds.right, bounds.top, bounds.bottom, -1, 1);

    gl.clearColor(...renderer._backgroundColor4f);
    gl.clear(gl.COLOR_BUFFER_BIT);
    renderer._drawThese(renderer._drawList, ShaderManager.DRAW_MODE.default, projection);

    const data = new Uint8Array(Math.floor(bounds.width * bounds.height * 4));
    gl.readPixels(0, 0, bounds.width, bounds.height, gl.RGBA, gl.UNSIGNED_BYTE, data);

    const pixelBase = Math.floor(4 * ((pickY * bounds.width) + pickX));
    const color = {
        r: data[pixelBase],
        g: data[pixelBase + 1],
        b: data[pixelBase + 2],
        a: data[pixelBase + 3]
    };

    if (debug && !renderer._debugCanvas) {
        console.log("debugging - making a render canvas")
        const debugCanvas = /** @type {canvas} */ document.getElementById('debug-canvas');
        renderer.setDebugCanvas(debugCanvas);
    }

    if (debug && renderer._debugCanvas) {
        renderer._debugCanvas.width = bounds.width;
        renderer._debugCanvas.height = bounds.height;
        const ctx = renderer._debugCanvas.getContext('2d');
        const imageData = ctx.createImageData(bounds.width, bounds.height);
        imageData.data.set(data);
        ctx.putImageData(imageData, 0, 0);
        ctx.strokeStyle = 'black';
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
        ctx.rect(pickX - 4, pickY - 4, 8, 8);
        ctx.fill();
        ctx.stroke();
    }

    return {
        data: data,
        width: bounds.width,
        height: bounds.height,
        color: color
    };
}

// More pixels than renderer and we give up to the GPU and take the cost of readPixels
// Width * Height * Number of drawables at location
const __cpuTouchingColorPixelCount = 4e4;

/**
 * @callback #idFilterFunc
 * @param {int} drawableID The ID to filter.
 * @return {bool} True if the ID passes the filter, otherwise false.
 */

/**
 * Maximum touch size for a picking check.
 * @todo Figure out a reasonable max size. Maybe renderer should be configurable?
 * @type {Array<int>}
 * @memberof 
 */
const MAX_TOUCH_SIZE = [3, 3];

/**
 * Passed to the uniforms for mask in touching color
 */
const MASK_TOUCHING_COLOR_TOLERANCE = 2;

/**
 * Maximum number of pixels in either dimension of "extracted drawable" data
 * @type {int}
 */
const MAX_EXTRACTED_DRAWABLE_DIMENSION = 2048;

/**
 * Determines if the mask color is "close enough" (only test the 6 top bits for
 * each color).  These bit masks are what scratch 2 used to use, so we do the same.
 * @param {Uint8Array} a A color3b or color4b value.
 * @param {Uint8Array} b A color3b or color4b value.
 * @returns {boolean} If the colors match within the parameters.
 */
const maskMatches = (a, b) => (
    // has some non-alpha component to test against
    a[3] > 0 &&
    (a[0] & 0b11111100) === (b[0] & 0b11111100) &&
    (a[1] & 0b11111100) === (b[1] & 0b11111100) &&
    (a[2] & 0b11111100) === (b[2] & 0b11111100)
);

/**
 * Determines if the given color is "close enough" (only test the 5 top bits for
 * red and green, 4 bits for blue).  These bit masks are what scratch 2 used to use,
 * so we do the same.
 * @param {Uint8Array} a A color3b or color4b value.
 * @param {Uint8Array} b A color3b or color4b value / or a larger array when used with offsets
 * @param {number} offset An offset into the `b` array, which lets you use a larger array to test
 *                  multiple values at the same time.
 * @returns {boolean} If the colors match within the parameters.
 */
const colorMatches = (a, b, offset) => (
    (a[0] & 0b11111000) === (b[offset + 0] & 0b11111000) &&
    (a[1] & 0b11111000) === (b[offset + 1] & 0b11111000) &&
    (a[2] & 0b11110000) === (b[offset + 2] & 0b11110000)
);

/**
 * Sprite Fencing - The number of pixels a sprite is required to leave remaining
 * onscreen around the edge of the staging area.
 * @type {number}
 */
const FENCE_WIDTH = 15;


/**
 * Ask TWGL to create a rendering context with the attributes used by renderer renderer.
 * @param {canvas} canvas - attach the context to renderer canvas.
 * @returns {WebGLRenderingContext} - a TWGL rendering context (backed by either WebGL 1.0 or 2.0).
 * @private
 */
function _getContext(canvas) {
    const contextAttribs = { alpha: false, stencil: true, antialias: false };
    // getWebGLContext = try WebGL 1.0 only
    // getContext = try WebGL 2.0 and if that doesn't work, try WebGL 1.0
    // getWebGLContext || getContext = try WebGL 1.0 and if that doesn't work, try WebGL 2.0
    return twgl.getWebGLContext(canvas, contextAttribs) ||
        twgl.getContext(canvas, contextAttribs);
}

    /**
     * @returns {WebGLRenderingContext} the WebGL rendering context associated with renderer renderer.
     */
function gl() {
    return renderer._gl;
}

    /**
     * @returns {HTMLCanvasElement} the canvas of the WebGL rendering context associated with renderer renderer.
     */
function canvas() {
    return renderer._gl && renderer._gl.canvas;
}

/**
 * Set the physical size of the stage in device-independent pixels.
 * This will be multiplied by the device's pixel ratio on high-DPI displays.
 * @param {int} pixelsWide The desired width in device-independent pixels.
 * @param {int} pixelsTall The desired height in device-independent pixels.
 */
function resize(pixelsWide, pixelsTall) {
    const { canvas } = renderer._gl;
    const pixelRatio = window.devicePixelRatio || 1;
    const newWidth = pixelsWide * pixelRatio;
    const newHeight = pixelsTall * pixelRatio;

    // Certain operations, such as moving the color picker, call `resize` once per frame, even though the canvas
    // size doesn't change. To avoid unnecessary canvas updates, check that we *really* need to resize the canvas.
    if (canvas.width !== newWidth || canvas.height !== newHeight) {
        canvas.width = newWidth;
        canvas.height = newHeight;
        // Resizing the canvas causes it to be cleared, so redraw it.
        renderer.draw();
    }

}

/**
 * Set the background color for the stage. The stage will be cleared with renderer
 * color each frame.
 * @param {number} red The red component for the background.
 * @param {number} green The green component for the background.
 * @param {number} blue The blue component for the background.
 */
function setBackgroundColor(red, green, blue) {
    renderer._backgroundColor4f[0] = red;
    renderer._backgroundColor4f[1] = green;
    renderer._backgroundColor4f[2] = blue;

    renderer._backgroundColor3b[0] = red * 255;
    renderer._backgroundColor3b[1] = green * 255;
    renderer._backgroundColor3b[2] = blue * 255;

}

/**
 * Tell the renderer to draw various debug information to the provided canvas
 * during certain operations.
 * @param {canvas} canvas The canvas to use for debug output.
 */
function setDebugCanvas(canvas) {
    renderer._debugCanvas = canvas;
}

/**
 * Control the use of the GPU or CPU paths in `isTouchingColor`.
 * @param {UseGpuModes} useGpuMode - automatically decide, force CPU, or force GPU.
 */
function setUseGpuMode(useGpuMode) {
    renderer._useGpuMode = useGpuMode;
}

/**
 * Set logical size of the stage in Scratch units.
 * @param {int} xLeft The left edge's x-coordinate. Scratch 2 uses -240.
 * @param {int} xRight The right edge's x-coordinate. Scratch 2 uses 240.
 * @param {int} yBottom The bottom edge's y-coordinate. Scratch 2 uses -180.
 * @param {int} yTop The top edge's y-coordinate. Scratch 2 uses 180.
 */
function setStageSize(xLeft, xRight, yBottom, yTop) {
    renderer._xLeft = xLeft;
    renderer._xRight = xRight;
    renderer._yBottom = yBottom;
    renderer._yTop = yTop;

    // swap yBottom & yTop to fit Scratch convention of +y=up
    renderer._projection = twgl.m4.ortho(xLeft, xRight, yBottom, yTop, -1, 1);

    renderer._setNativeSize(Math.abs(xRight - xLeft), Math.abs(yBottom - yTop));
}

/**
 * @return {Array<int>} the "native" size of the stage, which is used for pen, query renders, etc.
 */
function getNativeSize() {
    return [renderer._nativeSize[0], renderer._nativeSize[1]];
}

/**
 * Set the "native" size of the stage, which is used for pen, query renders, etc.
 * @param {int} width - the new width to set.
 * @param {int} height - the new height to set.
 * @private
 * @fires #event:NativeSizeChanged
 */
function _setNativeSize(width, height) {
    renderer._nativeSize = [width, height];
    renderer.emit(RenderConstants.Events.NativeSizeChanged, { newSize: renderer._nativeSize });
}

/**
 * Create a new bitmap skin from a snapshot of the provided bitmap data.
 * @param {ImageData|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} bitmapData - new contents for renderer skin.
 * @param {!int} [costumeResolution=1] - The resolution to use for renderer bitmap.
 * @param {?Array<number>} [rotationCenter] Optional: rotation center of the skin. If not supplied, the center of
 * the skin will be used.
 * @returns {!int} the ID for the new skin.
 */
function createBitmapSkin(bitmapData, costumeResolution, rotationCenter) {
    const skinId = renderer._nextSkinId++;
    const newSkin = new BitmapSkin(skinId, renderer);
    newSkin.setBitmap(bitmapData, costumeResolution, rotationCenter);
    renderer._allSkins[skinId] = newSkin;
    return skinId;
}

/**
 * Create a new SVG skin.
 * @param {!string} svgData - new SVG to use.
 * @param {?Array<number>} rotationCenter Optional: rotation center of the skin. If not supplied, the center of the
 * skin will be used
 * @returns {!int} the ID for the new skin.
 */
function createSVGSkin(svgData, rotationCenter) {
    const skinId = renderer._nextSkinId++;
    const newSkin = new SVGSkin(skinId, renderer);
    newSkin.setSVG(svgData, rotationCenter);
    renderer._allSkins[skinId] = newSkin;
    return skinId;
}

/**
 * Create a new PenSkin - a skin which implements a Scratch pen layer.
 * @returns {!int} the ID for the new skin.
 */
function createPenSkin() {
    const skinId = renderer._nextSkinId++;
    const newSkin = new PenSkin(skinId, renderer);
    renderer._allSkins[skinId] = newSkin;
    return skinId;
}

/**
 * Create a new SVG skin using the text bubble svg creator. The rotation center
 * is always placed at the top left.
 * @param {!string} type - either "say" or "think".
 * @param {!string} text - the text for the bubble.
 * @param {!boolean} pointsLeft - which side the bubble is pointing.
 * @returns {!int} the ID for the new skin.
 */
function createTextSkin(type, text, pointsLeft) {
    const skinId = renderer._nextSkinId++;
    const newSkin = new TextBubbleSkin(skinId, renderer);
    newSkin.setTextBubble(type, text, pointsLeft);
    renderer._allSkins[skinId] = newSkin;
    return skinId;
}

/**
 * Update an existing SVG skin, or create an SVG skin if the previous skin was not SVG.
 * @param {!int} skinId the ID for the skin to change.
 * @param {!string} svgData - new SVG to use.
 * @param {?Array<number>} rotationCenter Optional: rotation center of the skin. If not supplied, the center of the
 * skin will be used
 */
function updateSVGSkin(skinId, svgData, rotationCenter) {
    if (renderer._allSkins[skinId] instanceof SVGSkin) {
        renderer._allSkins[skinId].setSVG(svgData, rotationCenter);
        return;
    }

    const newSkin = new SVGSkin(skinId, renderer);
    newSkin.setSVG(svgData, rotationCenter);
    renderer._reskin(skinId, newSkin);
}

/**
 * Update an existing bitmap skin, or create a bitmap skin if the previous skin was not bitmap.
 * @param {!int} skinId the ID for the skin to change.
 * @param {!ImageData|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} imgData - new contents for renderer skin.
 * @param {!number} bitmapResolution - the resolution scale for a bitmap costume.
 * @param {?Array<number>} rotationCenter Optional: rotation center of the skin. If not supplied, the center of the
 * skin will be used
 */
function updateBitmapSkin(skinId, imgData, bitmapResolution, rotationCenter) {
    if (renderer._allSkins[skinId] instanceof BitmapSkin) {
        renderer._allSkins[skinId].setBitmap(imgData, bitmapResolution, rotationCenter);
        return;
    }

    const newSkin = new BitmapSkin(skinId, renderer);
    newSkin.setBitmap(imgData, bitmapResolution, rotationCenter);
    renderer._reskin(skinId, newSkin);
}

function _reskin(skinId, newSkin) {
    const oldSkin = renderer._allSkins[skinId];
    renderer._allSkins[skinId] = newSkin;

    // Tell drawables to update
    for (const drawable of renderer._allDrawables) {
        if (drawable && drawable.skin === oldSkin) {
            drawable.skin = newSkin;
        }
    }
    oldSkin.dispose();
}

/**
 * Update a skin using the text bubble svg creator.
 * @param {!int} skinId the ID for the skin to change.
 * @param {!string} type - either "say" or "think".
 * @param {!string} text - the text for the bubble.
 * @param {!boolean} pointsLeft - which side the bubble is pointing.
 */
function updateTextSkin(skinId, type, text, pointsLeft) {
    if (renderer._allSkins[skinId] instanceof TextBubbleSkin) {
        renderer._allSkins[skinId].setTextBubble(type, text, pointsLeft);
        return;
    }

    const newSkin = new TextBubbleSkin(skinId, renderer);
    newSkin.setTextBubble(type, text, pointsLeft);
    renderer._reskin(skinId, newSkin);
}


/**
 * Destroy an existing skin. Do not use the skin or its ID after calling renderer.
 * @param {!int} skinId - The ID of the skin to destroy.
 */
function destroySkin(skinId) {
    const oldSkin = renderer._allSkins[skinId];
    oldSkin.dispose();
    delete renderer._allSkins[skinId];
}

/**
 * Create a new Drawable and add it to the scene.
 * @param {string} group Layer group to add the drawable to
 * @returns {int} The ID of the new Drawable.
 */
function createDrawable(group) {
    if (!group || !Object.prototype.hasOwnProperty.call(renderer._layerGroups, group)) {
        log.warn('Cannot create a drawable without a known layer group');
        return;
    }
    const drawableID = renderer._nextDrawableId++;
    const drawable = new Drawable(drawableID);
    renderer._allDrawables[drawableID] = drawable;
    renderer._addToDrawList(drawableID, group);

    drawable.skin = null;

    return drawableID;
}

/**
 * Set the layer group ordering for the renderer.
 * @param {Array<string>} groupOrdering The ordered array of layer group
 * names
 */
function setLayerGroupOrdering(groupOrdering) {
    renderer._groupOrdering = groupOrdering;
    for (let i = 0; i < renderer._groupOrdering.length; i++) {
        renderer._layerGroups[renderer._groupOrdering[i]] = {
            groupIndex: i,
            drawListOffset: 0
        };
    }
}

function _addToDrawList(drawableID, group) {
    const currentLayerGroup = renderer._layerGroups[group];
    const currentGroupOrderingIndex = currentLayerGroup.groupIndex;

    const drawListOffset = renderer._endIndexForKnownLayerGroup(currentLayerGroup);
    renderer._drawList.splice(drawListOffset, 0, drawableID);

    renderer._updateOffsets('add', currentGroupOrderingIndex);
}

function _updateOffsets(updateType, currentGroupOrderingIndex) {
    for (let i = currentGroupOrderingIndex + 1; i < renderer._groupOrdering.length; i++) {
        const laterGroupName = renderer._groupOrdering[i];
        if (updateType === 'add') {
            renderer._layerGroups[laterGroupName].drawListOffset++;
        } else if (updateType === 'delete') {
            renderer._layerGroups[laterGroupName].drawListOffset--;
        }
    }
}

function _visibleDrawList() {
    return renderer._drawList.filter(id => renderer._allDrawables[id]._visible);
}

// Given a layer group, return the index where it ends (non-inclusive),
// e.g. the returned index does not have a drawable from renderer layer group in it)
function _endIndexForKnownLayerGroup(layerGroup) {
    const groupIndex = layerGroup.groupIndex;
    if (groupIndex === renderer._groupOrdering.length - 1) {
        return renderer._drawList.length;
    }
    return renderer._layerGroups[renderer._groupOrdering[groupIndex + 1]].drawListOffset;
}

/**
 * Destroy a Drawable, removing it from the scene.
 * @param {int} drawableID The ID of the Drawable to remove.
 * @param {string} group Group name that the drawable belongs to
 */
function destroyDrawable(drawableID, group) {
    if (!group || !Object.prototype.hasOwnProperty.call(renderer._layerGroups, group)) {
        log.warn('Cannot destroy drawable without known layer group.');
        return;
    }
    const drawable = renderer._allDrawables[drawableID];
    drawable.dispose();
    delete renderer._allDrawables[drawableID];

    const currentLayerGroup = renderer._layerGroups[group];
    const endIndex = renderer._endIndexForKnownLayerGroup(currentLayerGroup);

    let index = currentLayerGroup.drawListOffset;
    while (index < endIndex) {
        if (renderer._drawList[index] === drawableID) {
            break;
        }
        index++;
    }
    if (index < endIndex) {
        renderer._drawList.splice(index, 1);
        renderer._updateOffsets('delete', currentLayerGroup.groupIndex);
    } else {
        log.warn('Could not destroy drawable that could not be found in layer group.');
        return;
    }
}

/**
 * Returns the position of the given drawableID in the draw list. This is
 * the absolute position irrespective of layer group.
 * @param {number} drawableID The drawable ID to find.
 * @return {number} The postion of the given drawable ID.
 */
function getDrawableOrder(drawableID) {
    return renderer._drawList.indexOf(drawableID);
}

/**
 * Set a drawable's order in the drawable list (effectively, z/layer).
 * Can be used to move drawables to absolute positions in the list,
 * or relative to their current positions.
 * "go back N layers": setDrawableOrder(id, -N, true, 1); (assuming stage at 0).
 * "go to back": setDrawableOrder(id, 1); (assuming stage at 0).
 * "go to front": setDrawableOrder(id, Infinity);
 * @param {int} drawableID ID of Drawable to reorder.
 * @param {number} order New absolute order or relative order adjusment.
 * @param {string=} group Name of layer group drawable belongs to.
 * Reordering will not take place if drawable cannot be found within the bounds
 * of the layer group.
 * @param {boolean=} optIsRelative If set, `order` refers to a relative change.
 * @param {number=} optMin If set, order constrained to be at least `optMin`.
 * @return {?number} New order if changed, or null.
 */
function setDrawableOrder(drawableID, order, group, optIsRelative, optMin) {
    if (!group || !Object.prototype.hasOwnProperty.call(renderer._layerGroups, group)) {
        log.warn('Cannot set the order of a drawable without a known layer group.');
        return;
    }

    const currentLayerGroup = renderer._layerGroups[group];
    const startIndex = currentLayerGroup.drawListOffset;
    const endIndex = renderer._endIndexForKnownLayerGroup(currentLayerGroup);

    let oldIndex = startIndex;
    while (oldIndex < endIndex) {
        if (renderer._drawList[oldIndex] === drawableID) {
            break;
        }
        oldIndex++;
    }

    if (oldIndex < endIndex) {
        // Remove drawable from the list.
        if (order === 0) {
            return oldIndex;
        }

        const _ = renderer._drawList.splice(oldIndex, 1)[0];
        // Determine new index.
        let newIndex = order;
        if (optIsRelative) {
            newIndex += oldIndex;
        }

        const possibleMin = (optMin || 0) + startIndex;
        const min = (possibleMin >= startIndex && possibleMin < endIndex) ? possibleMin : startIndex;
        newIndex = Math.max(newIndex, min);

        newIndex = Math.min(newIndex, endIndex);

        // Insert at new index.
        renderer._drawList.splice(newIndex, 0, drawableID);
        return newIndex;
    }

    return null;
}

/**
 * Draw all current drawables and present the frame on the canvas.
 */
function draw() {
    renderer._doExitDrawRegion();

    const gl = renderer._gl;

    twgl.bindFramebufferInfo(gl, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(...renderer._backgroundColor4f);
    gl.clear(gl.COLOR_BUFFER_BIT);

    renderer._drawThese(renderer._drawList, ShaderManager.DRAW_MODE.default, renderer._projection, {
        framebufferWidth: gl.canvas.width,
        framebufferHeight: gl.canvas.height
    });
    if (renderer._snapshotCallbacks.length > 0) {
        const snapshot = gl.canvas.toDataURL();
        renderer._snapshotCallbacks.forEach(cb => cb(snapshot));
        renderer._snapshotCallbacks = [];
    }
}

/**
 * Get the precise bounds for a Drawable.
 * @param {int} drawableID ID of Drawable to get bounds for.
 * @return {object} Bounds for a tight box around the Drawable.
 */
function getBounds(drawableID) {
    const drawable = renderer._allDrawables[drawableID];
    // Tell the Drawable about its updated convex hull, if necessary.
    if (drawable.needsConvexHullPoints()) {
        const points = renderer._getConvexHullPointsForDrawable(drawableID);
        drawable.setConvexHullPoints(points);
    }
    const bounds = drawable.getFastBounds();
    // In debug mode, draw the bounds.
    if (renderer._debugCanvas) {
        const gl = renderer._gl;
        renderer._debugCanvas.width = gl.canvas.width;
        renderer._debugCanvas.height = gl.canvas.height;
        const context = renderer._debugCanvas.getContext('2d');
        context.drawImage(gl.canvas, 0, 0);
        context.strokeStyle = '#FF0000';
        const pr = window.devicePixelRatio;
        context.strokeRect(
            pr * (bounds.left + (renderer._nativeSize[0] / 2)),
            pr * (-bounds.top + (renderer._nativeSize[1] / 2)),
            pr * (bounds.right - bounds.left),
            pr * (-bounds.bottom + bounds.top)
        );
    }
    return bounds;
}

/**
 * Get the precise bounds for a Drawable around the top slice.
 * Used for positioning speech bubbles more closely to the sprite.
 * @param {int} drawableID ID of Drawable to get bubble bounds for.
 * @return {object} Bounds for a tight box around the Drawable top slice.
 */
function getBoundsForBubble(drawableID) {
    const drawable = renderer._allDrawables[drawableID];
    // Tell the Drawable about its updated convex hull, if necessary.
    if (drawable.needsConvexHullPoints()) {
        const points = renderer._getConvexHullPointsForDrawable(drawableID);
        drawable.setConvexHullPoints(points);
    }
    const bounds = drawable.getBoundsForBubble();
    // In debug mode, draw the bounds.
    if (renderer._debugCanvas) {
        const gl = renderer._gl;
        renderer._debugCanvas.width = gl.canvas.width;
        renderer._debugCanvas.height = gl.canvas.height;
        const context = renderer._debugCanvas.getContext('2d');
        context.drawImage(gl.canvas, 0, 0);
        context.strokeStyle = '#FF0000';
        const pr = window.devicePixelRatio;
        context.strokeRect(
            pr * (bounds.left + (renderer._nativeSize[0] / 2)),
            pr * (-bounds.top + (renderer._nativeSize[1] / 2)),
            pr * (bounds.right - bounds.left),
            pr * (-bounds.bottom + bounds.top)
        );
    }
    return bounds;
}

/**
 * Get the current skin (costume) size of a Drawable.
 * @param {int} drawableID The ID of the Drawable to measure.
 * @return {Array<number>} Skin size, width and height.
 */
function getCurrentSkinSize(drawableID) {
    const drawable = renderer._allDrawables[drawableID];
    return renderer.getSkinSize(drawable.skin.id);
}

/**
 * Get the size of a skin by ID.
 * @param {int} skinID The ID of the Skin to measure.
 * @return {Array<number>} Skin size, width and height.
 */
function getSkinSize(skinID) {
    const skin = renderer._allSkins[skinID];
    return skin.size;
}

/**
 * Get the rotation center of a skin by ID.
 * @param {int} skinID The ID of the Skin
 * @return {Array<number>} The rotationCenterX and rotationCenterY
 */
function getSkinRotationCenter(skinID) {
    const skin = renderer._allSkins[skinID];
    return skin.calculateRotationCenter();
}

/**
 * Check if a particular Drawable is touching a particular color.
 * Unlike touching drawable, if the "tester" is invisble, we will still test.
 * @param {int} drawableID The ID of the Drawable to check.
 * @param {Array<int>} color3b Test if the Drawable is touching renderer color.
 * @param {Array<int>} [mask3b] Optionally mask the check to renderer part of Drawable.
 * @returns {boolean} True iff the Drawable is touching the color.
 */
function fetchColor(target, mask3b) {
    console.log("fetching color around the bounds of a target sprite.") // check if background is stage, dont allow this!

    var renderer = target.renderer
    var drawableID = target.drawableID

    const candidates = renderer._candidatesTouching(drawableID, renderer._visibleDrawList); // isolate the stage background

    console.log("Candidates: ")
    console.log(candidates)

    let bounds;
   
    bounds = renderer._candidatesBounds(candidates);

    console.log("the bounds we are checking are...")
    console.log(bounds)

    const debugCanvasContext = renderer._debugCanvas && renderer._debugCanvas.getContext('2d');

    if (debugCanvasContext) {
        renderer._debugCanvas.width = bounds.width;
        renderer._debugCanvas.height = bounds.height;
    }

    const drawable = renderer._allDrawables[drawableID];
    const point = __isTouchingDrawablesPoint;
    const color = __touchingColor;
    const hasMask = Boolean(mask3b);

    drawable.updateCPURenderAttributes();

    // Masked drawable ignores ghost effect
    const effectMask = ~ShaderManager.EFFECT_INFO.ghost.mask;

    try {
        for (let y = bounds.bottom; y <= bounds.top; y++) {
            for (let x = bounds.left; x <= bounds.right; x++) {
                point[1] = y;
                point[0] = x;
                // if we use a mask, check our sample color...
                if (hasMask ?
                    maskMatches(Drawable.sampleColor4b(point, drawable, color, effectMask), mask3b) :
                    drawable.isTouching(point)) {
                    sampleColor3b(point, candidates, color);
                    if (debugCanvasContext) {
                        debugCanvasContext.fillRect(x - bounds.left, bounds.bottom - y, 1, 1);
                    }
                    return {r: color[0], g: color[1], b: color[2]}
                }
            }
        }
        return {r: color[0], g: color[1], b: color[2]}
    } catch (error) {
        return {r: 255, g: 255, b: 255}
    }

    // // Scratch Space - +y is top
    // for (let y = bounds.bottom; y <= bounds.top; y++) {
    //     for (let x = bounds.left; x <= bounds.right; x++) {
    //         point[1] = y;
    //         point[0] = x;
    //         // if we use a mask, check our sample color...
    //         if (hasMask ?
    //             maskMatches(Drawable.sampleColor4b(point, drawable, color, effectMask), mask3b) :
    //             drawable.isTouching(point)) {
    //             sampleColor3b(point, candidates, color);
    //             if (debugCanvasContext) {
    //                 debugCanvasContext.fillRect(x - bounds.left, bounds.bottom - y, 1, 1);
    //             }
    //             return {r: color[0], g: color[1], b: color[2]}
    //         }
    //     }
    // }
    // return {r: color[0], g: color[1], b: color[2]}
}

function _getMaxPixelsForCPU() {
    switch (renderer._useGpuMode) {
        case UseGpuModes.ForceCPU:
            return Infinity;
        case UseGpuModes.ForceGPU:
            return 0;
        case UseGpuModes.Automatic:
        default:
            return __cpuTouchingColorPixelCount;
    }
}

function _enterDrawBackground() {
    const gl = renderer.gl;
    const currentShader = renderer._shaderManager.getShader(ShaderManager.DRAW_MODE.background, 0);
    gl.disable(gl.BLEND);
    gl.useProgram(currentShader.program);
    twgl.setBuffersAndAttributes(gl, currentShader, renderer._bufferInfo);
}

function _exitDrawBackground() {
    const gl = renderer.gl;
    gl.enable(gl.BLEND);
}

function _isTouchingColorGpuStart(drawableID, candidateIDs, bounds, color3b, mask3b) {
    console.log("Doing _isTouchingColorGPUStart")
    renderer._doExitDrawRegion();

    const gl = renderer._gl;
    twgl.bindFramebufferInfo(gl, renderer._queryBufferInfo);

    // Limit size of viewport to the bounds around the target Drawable,
    // and create the projection matrix for the draw.
    gl.viewport(0, 0, bounds.width, bounds.height);
    const projection = twgl.m4.ortho(bounds.left, bounds.right, bounds.top, bounds.bottom, -1, 1);

    // Clear the query buffer to fully transparent. This will be the color of pixels that fail the stencil test.
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

    let extraUniforms;
    if (mask3b) {
        extraUniforms = {
            u_colorMask: [mask3b[0] / 255, mask3b[1] / 255, mask3b[2] / 255],
            u_colorMaskTolerance: MASK_TOUCHING_COLOR_TOLERANCE / 255
        };
    }

    try {
        // Using the stencil buffer, mask out the drawing to either the drawable's alpha channel
        // or pixels of the drawable which match the mask color, depending on whether a mask color is given.
        // Masked-out pixels will not be checked.
        gl.enable(gl.STENCIL_TEST);
        gl.stencilFunc(gl.ALWAYS, 1, 1);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
        gl.colorMask(false, false, false, false);
        renderer._drawThese(
            [drawableID],
            mask3b ?
                ShaderManager.DRAW_MODE.colorMask :
                ShaderManager.DRAW_MODE.silhouette,
            projection,
            {
                extraUniforms,
                ignoreVisibility: true, // Touching color ignores sprite visibility,
                effectMask: ~ShaderManager.EFFECT_INFO.ghost.mask
            });

        gl.stencilFunc(gl.EQUAL, 1, 1);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
        gl.colorMask(true, true, true, true);

        // Draw the background as a quad. Drawing a background with gl.clear will not mask to the stenciled area.
        renderer.enterDrawRegion(renderer._backgroundDrawRegionId);

        const uniforms = {
            u_backgroundColor: renderer._backgroundColor4f
        };

        const currentShader = renderer._shaderManager.getShader(ShaderManager.DRAW_MODE.background, 0);
        twgl.setUniforms(currentShader, uniforms);
        twgl.drawBufferInfo(gl, renderer._bufferInfo, gl.TRIANGLES);

        // Draw the candidate drawables on top of the background.
        renderer._drawThese(candidateIDs, ShaderManager.DRAW_MODE.default, projection,
            { idFilterFunc: testID => testID !== drawableID }
        );
    } finally {
        gl.colorMask(true, true, true, true);
        gl.disable(gl.STENCIL_TEST);
        renderer._doExitDrawRegion();
    }
}

function _isTouchingColorGpuFin(bounds, color3b, stop) {
    const gl = renderer._gl;
    const pixels = new Uint8Array(Math.floor(bounds.width * (bounds.height - stop) * 4));
    gl.readPixels(0, 0, bounds.width, (bounds.height - stop), gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    if (renderer._debugCanvas) {
        renderer._debugCanvas.width = bounds.width;
        renderer._debugCanvas.height = bounds.height;
        const context = renderer._debugCanvas.getContext('2d');
        const imageData = context.getImageData(0, 0, bounds.width, bounds.height - stop);
        imageData.data.set(pixels);
        context.putImageData(imageData, 0, 0);
    }

    for (let pixelBase = 0; pixelBase < pixels.length; pixelBase += 4) {
        // Transparent pixels are masked (either by the drawable's alpha channel or color mask).
        if (pixels[pixelBase + 3] !== 0 && colorMatches(color3b, pixels, pixelBase)) {
            return true;
        }
    }

    return false;
}

/**
 * Check if a particular Drawable is touching any in a set of Drawables.
 * @param {int} drawableID The ID of the Drawable to check.
 * @param {?Array<int>} candidateIDs The Drawable IDs to check, otherwise all visible drawables in the renderer
 * @returns {boolean} True if the Drawable is touching one of candidateIDs.
 */
function isTouchingDrawables(drawableID, candidateIDs = renderer._drawList) {
    const candidates = renderer._candidatesTouching(drawableID,
        // even if passed an invisible drawable, we will NEVER touch it!
        candidateIDs.filter(id => renderer._allDrawables[id]._visible));
    // if we are invisble we don't touch anything.
    if (candidates.length === 0 || !renderer._allDrawables[drawableID]._visible) {
        return false;
    }

    // Get the union of all the candidates intersections.
    const bounds = renderer._candidatesBounds(candidates);

    const drawable = renderer._allDrawables[drawableID];
    const point = __isTouchingDrawablesPoint;

    drawable.updateCPURenderAttributes();

    // This is an EXTREMELY brute force collision detector, but it is
    // still faster than asking the GPU to give us the pixels.
    for (let x = bounds.left; x <= bounds.right; x++) {
        // Scratch Space - +y is top
        point[0] = x;
        for (let y = bounds.bottom; y <= bounds.top; y++) {
            point[1] = y;
            if (drawable.isTouching(point)) {
                for (let index = 0; index < candidates.length; index++) {
                    if (candidates[index].drawable.isTouching(point)) {
                        return true;
                    }
                }
            }
        }
    }

    return false;
}

/**
 * Convert a client based x/y position on the canvas to a Scratch 3 world space
 * Rectangle.  This creates recangles with a radius to cover selecting multiple
 * scratch pixels with touch / small render areas.
 *
 * @param {int} centerX The client x coordinate of the picking location.
 * @param {int} centerY The client y coordinate of the picking location.
 * @param {int} [width] The client width of the touch event (optional).
 * @param {int} [height] The client width of the touch event (optional).
 * @returns {Rectangle} Scratch world space rectangle, iterate bottom <= top,
 *                      left <= right.
 */
function clientSpaceToScratchBounds(centerX, centerY, width = 1, height = 1) {
    const gl = renderer._gl;

    const clientToScratchX = renderer._nativeSize[0] / gl.canvas.clientWidth;
    const clientToScratchY = renderer._nativeSize[1] / gl.canvas.clientHeight;

    width *= clientToScratchX;
    height *= clientToScratchY;

    width = Math.max(1, Math.min(Math.round(width), MAX_TOUCH_SIZE[0]));
    height = Math.max(1, Math.min(Math.round(height), MAX_TOUCH_SIZE[1]));
    const x = (centerX * clientToScratchX) - ((width - 1) / 2);
    // + because scratch y is inverted
    const y = (centerY * clientToScratchY) + ((height - 1) / 2);

    const xOfs = (width % 2) ? 0 : -0.5;
    // y is offset +0.5
    const yOfs = (height % 2) ? 0 : -0.5;

    const bounds = new Rectangle();
    bounds.initFromBounds(Math.floor(renderer._xLeft + x + xOfs), Math.floor(renderer._xLeft + x + xOfs + width - 1),
        Math.ceil(renderer._yTop - y + yOfs), Math.ceil(renderer._yTop - y + yOfs + height - 1));
    return bounds;
}

/**
 * Determine if the drawable is touching a client based x/y.  Helper method for sensing
 * touching mouse-pointer.  Ignores visibility.
 *
 * @param {int} drawableID The ID of the drawable to check.
 * @param {int} centerX The client x coordinate of the picking location.
 * @param {int} centerY The client y coordinate of the picking location.
 * @param {int} [touchWidth] The client width of the touch event (optional).
 * @param {int} [touchHeight] The client height of the touch event (optional).
 * @returns {boolean} If the drawable has any pixels that would draw in the touch area
 */
function drawableTouching(drawableID, centerX, centerY, touchWidth, touchHeight) {
    const drawable = renderer._allDrawables[drawableID];
    if (!drawable) {
        return false;
    }
    const bounds = renderer.clientSpaceToScratchBounds(centerX, centerY, touchWidth, touchHeight);
    const worldPos = twgl.v3.create();

    drawable.updateCPURenderAttributes();

    for (worldPos[1] = bounds.bottom; worldPos[1] <= bounds.top; worldPos[1]++) {
        for (worldPos[0] = bounds.left; worldPos[0] <= bounds.right; worldPos[0]++) {
            if (drawable.isTouching(worldPos)) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Detect which sprite, if any, is at the given location.
 * This function will pick all drawables that are visible, unless specific
 * candidate drawable IDs are provided.  Used for determining what is clicked
 * or dragged.  Will not select hidden / ghosted sprites.
 *
 * @param {int} centerX The client x coordinate of the picking location.
 * @param {int} centerY The client y coordinate of the picking location.
 * @param {int} [touchWidth] The client width of the touch event (optional).
 * @param {int} [touchHeight] The client height of the touch event (optional).
 * @param {Array<int>} [candidateIDs] The Drawable IDs to pick from, otherwise all visible drawables.
 * @returns {int} The ID of the topmost Drawable under the picking location, or
 * RenderConstants.ID_NONE if there is no Drawable at that location.
 */
function pick(centerX, centerY, touchWidth, touchHeight, candidateIDs) {
    const bounds = renderer.clientSpaceToScratchBounds(centerX, centerY, touchWidth, touchHeight);
    if (bounds.left === -Infinity || bounds.bottom === -Infinity) {
        return false;
    }

    candidateIDs = (candidateIDs || renderer._drawList).filter(id => {
        const drawable = renderer._allDrawables[id];
        // default pick list ignores visible and ghosted sprites.
        if (drawable.getVisible() && drawable.getUniforms().u_ghost !== 0) {
            const drawableBounds = drawable.getFastBounds();
            const inRange = bounds.intersects(drawableBounds);
            if (!inRange) return false;

            drawable.updateCPURenderAttributes();
            return true;
        }
        return false;
    });
    if (candidateIDs.length === 0) {
        return false;
    }

    const hits = [];
    const worldPos = twgl.v3.create(0, 0, 0);
    // Iterate over the scratch pixels and check if any candidate can be
    // touched at that point.
    for (worldPos[1] = bounds.bottom; worldPos[1] <= bounds.top; worldPos[1]++) {
        for (worldPos[0] = bounds.left; worldPos[0] <= bounds.right; worldPos[0]++) {

            // Check candidates in the reverse order they would have been
            // drawn. This will determine what candiate's silhouette pixel
            // would have been drawn at the point.
            for (let d = candidateIDs.length - 1; d >= 0; d--) {
                const id = candidateIDs[d];
                const drawable = renderer._allDrawables[id];
                if (drawable.isTouching(worldPos)) {
                    hits[id] = (hits[id] || 0) + 1;
                    break;
                }
            }
        }
    }

    // Bias toward selecting anything over nothing
    hits[RenderConstants.ID_NONE] = 0;

    let hit = RenderConstants.ID_NONE;
    for (const hitID in hits) {
        if (Object.prototype.hasOwnProperty.call(hits, hitID) && (hits[hitID] > hits[hit])) {
            hit = hitID;
        }
    }

    return Number(hit);
}

/**
 * @typedef DrawableExtraction
 * @property {ImageData} data Raw pixel data for the drawable
 * @property {number} x The x coordinate of the drawable's bounding box's top-left corner, in 'CSS pixels'
 * @property {number} y The y coordinate of the drawable's bounding box's top-left corner, in 'CSS pixels'
 * @property {number} width The drawable's bounding box width, in 'CSS pixels'
 * @property {number} height The drawable's bounding box height, in 'CSS pixels'
 */

/**
 * Return a drawable's pixel data and bounds in screen space.
 * @param {int} drawableID The ID of the drawable to get pixel data for
 * @return {DrawableExtraction} Data about the picked drawable
 */
function extractDrawableScreenSpace(drawableID) {
    const drawable = renderer._allDrawables[drawableID];
    if (!drawable) throw new Error(`Could not extract drawable with ID ${drawableID}; it does not exist`);

    renderer._doExitDrawRegion();

    const nativeCenterX = renderer._nativeSize[0] * 0.5;
    const nativeCenterY = renderer._nativeSize[1] * 0.5;

    const scratchBounds = drawable.getFastBounds();

    const canvas = renderer.canvas;
    // Ratio of the screen-space scale of the stage's canvas to the "native size" of the stage
    const scaleFactor = canvas.width / renderer._nativeSize[0];

    // Bounds of the extracted drawable, in "canvas pixel space"
    // (origin is 0, 0, destination is the canvas width, height).
    const canvasSpaceBounds = new Rectangle();
    canvasSpaceBounds.initFromBounds(
        (scratchBounds.left + nativeCenterX) * scaleFactor,
        (scratchBounds.right + nativeCenterX) * scaleFactor,
        // in "canvas space", +y is down, but Rectangle methods assume bottom < top, so swap them
        (nativeCenterY - scratchBounds.top) * scaleFactor,
        (nativeCenterY - scratchBounds.bottom) * scaleFactor
    );
    canvasSpaceBounds.snapToInt();

    // undo the transformation to transform the bounds, snapped to "canvas-pixel space", back to "Scratch space"
    // We have to transform -> snap -> invert transform so that the "Scratch-space" bounds are snapped in
    // "canvas-pixel space".
    scratchBounds.initFromBounds(
        (canvasSpaceBounds.left / scaleFactor) - nativeCenterX,
        (canvasSpaceBounds.right / scaleFactor) - nativeCenterX,
        nativeCenterY - (canvasSpaceBounds.top / scaleFactor),
        nativeCenterY - (canvasSpaceBounds.bottom / scaleFactor)
    );

    const gl = renderer._gl;

    // Set a reasonable max limit width and height for the bufferInfo bounds
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const clampedWidth = Math.min(MAX_EXTRACTED_DRAWABLE_DIMENSION, canvasSpaceBounds.width, maxTextureSize);
    const clampedHeight = Math.min(MAX_EXTRACTED_DRAWABLE_DIMENSION, canvasSpaceBounds.height, maxTextureSize);

    // Make a new bufferInfo since renderer._queryBufferInfo is limited to 480x360
    const bufferInfo = twgl.createFramebufferInfo(gl, [{ format: gl.RGBA }], clampedWidth, clampedHeight);

    try {
        twgl.bindFramebufferInfo(gl, bufferInfo);

        // Limit size of viewport to the bounds around the target Drawable,
        // and create the projection matrix for the draw.
        gl.viewport(0, 0, clampedWidth, clampedHeight);
        const projection = twgl.m4.ortho(
            scratchBounds.left,
            scratchBounds.right,
            scratchBounds.top,
            scratchBounds.bottom,
            -1, 1
        );

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        renderer._drawThese([drawableID], ShaderManager.DRAW_MODE.straightAlpha, projection,
            {
                // Don't apply the ghost effect. TODO: is renderer an intentional design decision?
                effectMask: ~ShaderManager.EFFECT_INFO.ghost.mask,
                // We're doing renderer in screen-space, so the framebuffer dimensions should be those of the canvas in
                // screen-space. This is used to ensure SVG skins are rendered at the proper resolution.
                framebufferWidth: canvas.width,
                framebufferHeight: canvas.height
            });

        const data = new Uint8Array(Math.floor(clampedWidth * clampedHeight * 4));
        gl.readPixels(0, 0, clampedWidth, clampedHeight, gl.RGBA, gl.UNSIGNED_BYTE, data);
        // readPixels can only read into a Uint8Array, but ImageData has to take a Uint8ClampedArray.
        // We can share the same underlying buffer between them to avoid having to copy any data.
        const imageData = new ImageData(new Uint8ClampedArray(data.buffer), clampedWidth, clampedHeight);

        // On high-DPI devices, the canvas' width (in canvas pixels) will be larger than its width in CSS pixels.
        // We want to return the CSS-space bounds,
        // so take into account the ratio between the canvas' pixel dimensions and its layout dimensions.
        // This is usually the same as 1 / window.devicePixelRatio, but if e.g. you zoom your browser window without
        // the canvas resizing, then it'll differ.
        const ratio = canvas.getBoundingClientRect().width / canvas.width;

        return {
            imageData,
            x: canvasSpaceBounds.left * ratio,
            y: canvasSpaceBounds.bottom * ratio,
            width: canvasSpaceBounds.width * ratio,
            height: canvasSpaceBounds.height * ratio
        };
    } finally {
        gl.deleteFramebuffer(bufferInfo.framebuffer);
    }
}

/**
 * @typedef ColorExtraction
 * @property {Uint8Array} data Raw pixel data for the drawable
 * @property {int} width Drawable bounding box width
 * @property {int} height Drawable bounding box height
 * @property {object} color Color object with RGBA properties at picked location
 */

/**
 * Return drawable pixel data and color at a given position
 * @param {int} x The client x coordinate of the picking location.
 * @param {int} y The client y coordinate of the picking location.
 * @param {int} radius The client radius to extract pixels with.
 * @return {?ColorExtraction} Data about the picked color
 */
function extractColor(x, y, radius) {
    renderer._doExitDrawRegion();

    const scratchX = Math.round(renderer._nativeSize[0] * ((x / renderer._gl.canvas.clientWidth) - 0.5));
    const scratchY = Math.round(-renderer._nativeSize[1] * ((y / renderer._gl.canvas.clientHeight) - 0.5));

    const gl = renderer._gl;
    twgl.bindFramebufferInfo(gl, renderer._queryBufferInfo);

    const bounds = new Rectangle();
    bounds.initFromBounds(scratchX - radius, scratchX + radius, scratchY - radius, scratchY + radius);

    const pickX = scratchX - bounds.left;
    const pickY = bounds.top - scratchY;

    gl.viewport(0, 0, bounds.width, bounds.height);
    const projection = twgl.m4.ortho(bounds.left, bounds.right, bounds.top, bounds.bottom, -1, 1);

    gl.clearColor(...renderer._backgroundColor4f);
    gl.clear(gl.COLOR_BUFFER_BIT);
    renderer._drawThese(renderer._drawList, ShaderManager.DRAW_MODE.default, projection);

    const data = new Uint8Array(Math.floor(bounds.width * bounds.height * 4));
    gl.readPixels(0, 0, bounds.width, bounds.height, gl.RGBA, gl.UNSIGNED_BYTE, data);

    const pixelBase = Math.floor(4 * ((pickY * bounds.width) + pickX));
    const color = {
        r: data[pixelBase],
        g: data[pixelBase + 1],
        b: data[pixelBase + 2],
        a: data[pixelBase + 3]
    };

    if (renderer._debugCanvas) {
        renderer._debugCanvas.width = bounds.width;
        renderer._debugCanvas.height = bounds.height;
        const ctx = renderer._debugCanvas.getContext('2d');
        const imageData = ctx.createImageData(bounds.width, bounds.height);
        imageData.data.set(data);
        ctx.putImageData(imageData, 0, 0);
        ctx.strokeStyle = 'black';
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
        ctx.rect(pickX - 4, pickY - 4, 8, 8);
        ctx.fill();
        ctx.stroke();
    }

    return {
        data: data,
        width: bounds.width,
        height: bounds.height,
        color: color
    };
}

/**
 * Get the candidate bounding box for a touching query.
 * @param {int} drawableID ID for drawable of query.
 * @return {?Rectangle} Rectangle bounds for touching query, or null.
 */
function _touchingBounds(drawableID) {
    const drawable = renderer._allDrawables[drawableID];

    /** @todo remove renderer once URL-based skin setting is removed. */
    if (!drawable.skin || !drawable.skin.getTexture([100, 100])) return null;

    const bounds = drawable.getFastBounds();

    // Limit queries to the stage size.
    bounds.clamp(renderer._xLeft, renderer._xRight, renderer._yBottom, renderer._yTop);

    // Use integer coordinates for queries - weird things happen
    // when you provide float width/heights to gl.viewport and projection.
    bounds.snapToInt();

    if (bounds.width === 0 || bounds.height === 0) {
        // No space to query.
        return null;
    }
    return bounds;
}

/**
 * Filter a list of candidates for a touching query into only those that
 * could possibly intersect the given bounds.
 * @param {int} drawableID - ID for drawable of query.
 * @param {Array<int>} candidateIDs - Candidates for touching query.
 * @return {?Array< {id, drawable, intersection} >} Filtered candidates with useful data.
 */
function _candidatesTouching(drawableID, candidateIDs) {
    const bounds = renderer._touchingBounds(drawableID);
    const result = [];
    if (bounds === null) {
        return result;
    }
    // iterate through the drawables list BACKWARDS - we want the top most item to be the first we check
    for (let index = candidateIDs.length - 1; index >= 0; index--) {
        const id = candidateIDs[index];
        if (id !== drawableID) {
            const drawable = renderer._allDrawables[id];
            // Text bubbles aren't considered in "touching" queries
            if (drawable.skin instanceof TextBubbleSkin) continue;
            if (drawable.skin && drawable._visible) {
                // Update the CPU position data
                drawable.updateCPURenderAttributes();
                const candidateBounds = drawable.getFastBounds();

                // Push bounds out to integers. If a drawable extends out into half a pixel, that half-pixel still
                // needs to be tested. Plus, in some areas we construct another rectangle from the union of these,
                // and iterate over its pixels (width * height). Turns out that doesn't work so well when the
                // width/height aren't integers.
                candidateBounds.snapToInt();

                if (bounds.intersects(candidateBounds)) {
                    result.push({
                        id,
                        drawable,
                        intersection: Rectangle.intersect(bounds, candidateBounds)
                    });
                }
            }
        }
    }
    return result;
}

/**
 * Helper to get the union bounds from a set of candidates returned from the above method
 * @private
 * @param {Array<object>} candidates info from _candidatesTouching
 * @return {Rectangle} the outer bounding box union
 */
function _candidatesBounds(candidates) {
    return candidates.reduce((memo, { intersection }) => {
        if (!memo) {
            return intersection;
        }
        // store the union of the two rectangles in our function rectangle instance
        return Rectangle.union(memo, intersection, __candidatesBounds);
    }, null);
}

/**
 * Update a drawable's skin.
 * @param {number} drawableID The drawable's id.
 * @param {number} skinId The skin to update to.
 */
function updateDrawableSkinId(drawableID, skinId) {
    const drawable = renderer._allDrawables[drawableID];
    // TODO: https://github.com/LLK/scratch-vm/issues/2288
    if (!drawable) return;
    drawable.skin = renderer._allSkins[skinId];
}

/**
 * Update a drawable's position.
 * @param {number} drawableID The drawable's id.
 * @param {Array.<number>} position The new position.
 */
function updateDrawablePosition(drawableID, position) {
    const drawable = renderer._allDrawables[drawableID];
    // TODO: https://github.com/LLK/scratch-vm/issues/2288
    if (!drawable) return;
    drawable.updatePosition(position);
}

/**
 * Update a drawable's direction.
 * @param {number} drawableID The drawable's id.
 * @param {number} direction A new direction.
 */
function updateDrawableDirection(drawableID, direction) {
    const drawable = renderer._allDrawables[drawableID];
    // TODO: https://github.com/LLK/scratch-vm/issues/2288
    if (!drawable) return;
    drawable.updateDirection(direction);
}

/**
 * Update a drawable's scale.
 * @param {number} drawableID The drawable's id.
 * @param {Array.<number>} scale A new scale.
 */
function updateDrawableScale(drawableID, scale) {
    const drawable = renderer._allDrawables[drawableID];
    // TODO: https://github.com/LLK/scratch-vm/issues/2288
    if (!drawable) return;
    drawable.updateScale(scale);
}

/**
 * Update a drawable's direction and scale together.
 * @param {number} drawableID The drawable's id.
 * @param {number} direction A new direction.
 * @param {Array.<number>} scale A new scale.
 */
function updateDrawableDirectionScale(drawableID, direction, scale) {
    const drawable = renderer._allDrawables[drawableID];
    // TODO: https://github.com/LLK/scratch-vm/issues/2288
    if (!drawable) return;
    drawable.updateDirection(direction);
    drawable.updateScale(scale);
}

/**
 * Update a drawable's visibility.
 * @param {number} drawableID The drawable's id.
 * @param {boolean} visible Will the drawable be visible?
 */
function updateDrawableVisible(drawableID, visible) {
    const drawable = renderer._allDrawables[drawableID];
    // TODO: https://github.com/LLK/scratch-vm/issues/2288
    if (!drawable) return;
    drawable.updateVisible(visible);
}

/**
 * Update a drawable's visual effect.
 * @param {number} drawableID The drawable's id.
 * @param {string} effectName The effect to change.
 * @param {number} value A new effect value.
 */
function updateDrawableEffect(drawableID, effectName, value) {
    const drawable = renderer._allDrawables[drawableID];
    // TODO: https://github.com/LLK/scratch-vm/issues/2288
    if (!drawable) return;
    drawable.updateEffect(effectName, value);
}

/**
 * Update the position, direction, scale, or effect properties of renderer Drawable.
 * @deprecated Use specific updateDrawable* methods instead.
 * @param {int} drawableID The ID of the Drawable to update.
 * @param {object.<string,*>} properties The new property values to set.
 */
function updateDrawableProperties(drawableID, properties) {
    const drawable = renderer._allDrawables[drawableID];
    if (!drawable) {
        /**
         * @todo(https://github.com/LLK/scratch-vm/issues/2288) fix whatever's wrong in the VM which causes renderer, then add a warning or throw here.
         * Right now renderer happens so much on some projects that a warning or exception here can hang the browser.
         */
        return;
    }
    if ('skinId' in properties) {
        renderer.updateDrawableSkinId(drawableID, properties.skinId);
    }
    drawable.updateProperties(properties);
}

/**
 * Update the position object's x & y members to keep the drawable fenced in view.
 * @param {int} drawableID - The ID of the Drawable to update.
 * @param {Array.<number, number>} position to be fenced - An array of type [x, y]
 * @return {Array.<number, number>} The fenced position as an array [x, y]
 */
function getFencedPositionOfDrawable(drawableID, position) {
    let x = position[0];
    let y = position[1];

    const drawable = renderer._allDrawables[drawableID];
    if (!drawable) {
        // @todo(https://github.com/LLK/scratch-vm/issues/2288) fix whatever's wrong in the VM which causes renderer, then add a warning or throw here.
        // Right now renderer happens so much on some projects that a warning or exception here can hang the browser.
        return [x, y];
    }

    const dx = x - drawable._position[0];
    const dy = y - drawable._position[1];
    const aabb = drawable._skin.getFenceBounds(drawable, __fenceBounds);
    const inset = Math.floor(Math.min(aabb.width, aabb.height) / 2);

    const sx = renderer._xRight - Math.min(FENCE_WIDTH, inset);
    if (aabb.right + dx < -sx) {
        x = Math.ceil(drawable._position[0] - (sx + aabb.right));
    } else if (aabb.left + dx > sx) {
        x = Math.floor(drawable._position[0] + (sx - aabb.left));
    }
    const sy = renderer._yTop - Math.min(FENCE_WIDTH, inset);
    if (aabb.top + dy < -sy) {
        y = Math.ceil(drawable._position[1] - (sy + aabb.top));
    } else if (aabb.bottom + dy > sy) {
        y = Math.floor(drawable._position[1] + (sy - aabb.bottom));
    }
    return [x, y];
}

/**
 * Clear a pen layer.
 * @param {int} penSkinID - the unique ID of a Pen Skin.
 */
function penClear(penSkinID) {
    const skin = /** @type {PenSkin} */ renderer._allSkins[penSkinID];
    skin.clear();
}

/**
 * Draw a point on a pen layer.
 * @param {int} penSkinID - the unique ID of a Pen Skin.
 * @param {PenAttributes} penAttributes - how the point should be drawn.
 * @param {number} x - the X coordinate of the point to draw.
 * @param {number} y - the Y coordinate of the point to draw.
 */
function penPoint(penSkinID, penAttributes, x, y) {
    const skin = /** @type {PenSkin} */ renderer._allSkins[penSkinID];
    skin.drawPoint(penAttributes, x, y);
}

/**
 * Draw a line on a pen layer.
 * @param {int} penSkinID - the unique ID of a Pen Skin.
 * @param {PenAttributes} penAttributes - how the line should be drawn.
 * @param {number} x0 - the X coordinate of the beginning of the line.
 * @param {number} y0 - the Y coordinate of the beginning of the line.
 * @param {number} x1 - the X coordinate of the end of the line.
 * @param {number} y1 - the Y coordinate of the end of the line.
 */
function penLine(penSkinID, penAttributes, x0, y0, x1, y1) {
    const skin = /** @type {PenSkin} */ renderer._allSkins[penSkinID];
    skin.drawLine(penAttributes, x0, y0, x1, y1);
}

/**
 * Stamp a Drawable onto a pen layer.
 * @param {int} penSkinID - the unique ID of a Pen Skin.
 * @param {int} stampID - the unique ID of the Drawable to use as the stamp.
 */
function penStamp(penSkinID, stampID) {
    const stampDrawable = renderer._allDrawables[stampID];
    if (!stampDrawable) {
        return;
    }

    const bounds = renderer._touchingBounds(stampID);
    if (!bounds) {
        return;
    }

    renderer._doExitDrawRegion();

    const skin = /** @type {PenSkin} */ renderer._allSkins[penSkinID];

    const gl = renderer._gl;
    twgl.bindFramebufferInfo(gl, skin._framebuffer);

    // Limit size of viewport to the bounds around the stamp Drawable and create the projection matrix for the draw.
    gl.viewport(
        (renderer._nativeSize[0] * 0.5) + bounds.left,
        (renderer._nativeSize[1] * 0.5) - bounds.top,
        bounds.width,
        bounds.height
    );
    const projection = twgl.m4.ortho(bounds.left, bounds.right, bounds.top, bounds.bottom, -1, 1);

    // Draw the stamped sprite onto the PenSkin's framebuffer.
    renderer._drawThese([stampID], ShaderManager.DRAW_MODE.default, projection, { ignoreVisibility: true });
    skin._silhouetteDirty = true;
}

/* ******
 * Truly internal functions: these support the functions above.
 ********/

/**
 * Build geometry (vertex and index) buffers.
 * @private
 */
function _createGeometry() {
    const quad = {
        a_position: {
            numComponents: 2,
            data: [
                -0.5, -0.5,
                0.5, -0.5,
                -0.5, 0.5,
                -0.5, 0.5,
                0.5, -0.5,
                0.5, 0.5
            ]
        },
        a_texCoord: {
            numComponents: 2,
            data: [
                1, 0,
                0, 0,
                1, 1,
                1, 1,
                0, 0,
                0, 1
            ]
        }
    };
    renderer._bufferInfo = twgl.createBufferInfoFromArrays(renderer._gl, quad);
}

/**
 * Respond to a change in the "native" rendering size. The native size is used by buffers which are fixed in size
 * regardless of the size of the main render target. This includes the buffers used for queries such as picking and
 * color-touching. The fixed size allows (more) consistent behavior across devices and presentation modes.
 * @param {object} event - The change event.
 * @private
 */
function onNativeSizeChanged(event) {
    const [width, height] = event.newSize;

    const gl = renderer._gl;
    const attachments = [
        { format: gl.RGBA },
        { format: gl.DEPTH_STENCIL }
    ];

    if (!renderer._pickBufferInfo) {
        renderer._pickBufferInfo = twgl.createFramebufferInfo(gl, attachments, MAX_TOUCH_SIZE[0], MAX_TOUCH_SIZE[1]);
    }

    /** @todo should we create renderer on demand to save memory? */
    // A 480x360 32-bpp buffer is 675 KiB.
    if (renderer._queryBufferInfo) {
        twgl.resizeFramebufferInfo(gl, renderer._queryBufferInfo, attachments, width, height);
    } else {
        renderer._queryBufferInfo = twgl.createFramebufferInfo(gl, attachments, width, height);
    }
}

/**
 * Enter a draw region.
 *
 * A draw region is where multiple draw operations are performed with the
 * same GL state. WebGL performs poorly when it changes state like blend
 * mode. Marking a collection of state values as a "region" the renderer
 * can skip superfluous extra state calls when it is already in that
 * region. Since one region may be entered from within another a exit
 * handle can also be registered that is called when a new region is about
 * to be entered to restore a common inbetween state.
 *
 * @param {any} regionId - id of the region to enter
 * @param {function} enter - handle to call when first entering a region
 * @param {function} exit - handle to call when leaving a region
 */
function enterDrawRegion(regionId, enter = regionId.enter, exit = regionId.exit) {
    if (renderer._regionId !== regionId) {
        renderer._doExitDrawRegion();
        renderer._regionId = regionId;
        enter();
        renderer._exitRegion = exit;
    }
}

/**
 * Forcefully exit the current region returning to a common inbetween GL
 * state.
 */
function _doExitDrawRegion() {
    if (renderer._exitRegion !== null) {
        renderer._exitRegion();
    }
    renderer._exitRegion = null;
    renderer._regionId = null;
}

/**
 * Draw a set of Drawables, by drawable ID
 * @param {Array<int>} drawables The Drawable IDs to draw, possibly renderer._drawList.
 * @param {ShaderManager.DRAW_MODE} drawMode Draw normally, silhouette, etc.
 * @param {module:twgl/m4.Mat4} projection The projection matrix to use.
 * @param {object} [opts] Options for drawing
 * @param {idFilterFunc} opts.filter An optional filter function.
 * @param {object.<string,*>} opts.extraUniforms Extra uniforms for the shaders.
 * @param {int} opts.effectMask Bitmask for effects to allow
 * @param {boolean} opts.ignoreVisibility Draw all, despite visibility (e.g. stamping, touching color)
 * @param {int} opts.framebufferWidth The width of the framebuffer being drawn onto. Defaults to "native" width
 * @param {int} opts.framebufferHeight The height of the framebuffer being drawn onto. Defaults to "native" height
 * @private
 */
function _drawThese(drawables, drawMode, projection, opts = {}) {

    const gl = renderer._gl;
    let currentShader = null;

    const framebufferSpaceScaleDiffers = (
        'framebufferWidth' in opts && 'framebufferHeight' in opts &&
        opts.framebufferWidth !== renderer._nativeSize[0] && opts.framebufferHeight !== renderer._nativeSize[1]
    );

    const numDrawables = drawables.length;
    for (let drawableIndex = 0; drawableIndex < numDrawables; ++drawableIndex) {
        const drawableID = drawables[drawableIndex];

        // If we have a filter, check whether the ID fails
        if (opts.filter && !opts.filter(drawableID)) continue;

        const drawable = renderer._allDrawables[drawableID];
        /** @todo check if drawable is inside the viewport before anything else */

        // Hidden drawables (e.g., by a "hide" block) are not drawn unless
        // the ignoreVisibility flag is used (e.g. for stamping or touchingColor).
        if (!drawable.getVisible() && !opts.ignoreVisibility) continue;

        // drawableScale is the "framebuffer-pixel-space" scale of the drawable, as percentages of the drawable's
        // "native size" (so 100 = same as skin's "native size", 200 = twice "native size").
        // If the framebuffer dimensions are the same as the stage's "native" size, there's no need to calculate it.
        const drawableScale = framebufferSpaceScaleDiffers ? [
            drawable.scale[0] * opts.framebufferWidth / renderer._nativeSize[0],
            drawable.scale[1] * opts.framebufferHeight / renderer._nativeSize[1]
        ] : drawable.scale;

        // If the skin or texture isn't ready yet, skip it.
        if (!drawable.skin || !drawable.skin.getTexture(drawableScale)) continue;

        const uniforms = {};

        let effectBits = drawable.enabledEffects;
        effectBits &= Object.prototype.hasOwnProperty.call(opts, 'effectMask') ? opts.effectMask : effectBits;
        const newShader = renderer._shaderManager.getShader(drawMode, effectBits);

        // Manually perform region check. Do not create functions inside a
        // loop.
        if (renderer._regionId !== newShader) {
            renderer._doExitDrawRegion();
            renderer._regionId = newShader;

            currentShader = newShader;
            gl.useProgram(currentShader.program);
            twgl.setBuffersAndAttributes(gl, currentShader, renderer._bufferInfo);
            Object.assign(uniforms, {
                u_projectionMatrix: projection
            });
        }

        Object.assign(uniforms,
            drawable.skin.getUniforms(drawableScale),
            drawable.getUniforms());

        // Apply extra uniforms after the Drawable's, to allow overwriting.
        if (opts.extraUniforms) {
            Object.assign(uniforms, opts.extraUniforms);
        }

        if (uniforms.u_skin) {
            twgl.setTextureParameters(
                gl, uniforms.u_skin, {
                minMag: drawable.skin.useNearest(drawableScale, drawable) ? gl.NEAREST : gl.LINEAR
            }
            );
        }

        twgl.setUniforms(currentShader, uniforms);
        twgl.drawBufferInfo(gl, renderer._bufferInfo, gl.TRIANGLES);
    }

    renderer._regionId = null;
}

/**
 * Get the convex hull points for a particular Drawable.
 * To do renderer, calculate it based on the drawable's Silhouette.
 * @param {int} drawableID The Drawable IDs calculate convex hull for.
 * @return {Array<Array<number>>} points Convex hull points, as [[x, y], ...]
 */
function _getConvexHullPointsForDrawable(drawableID) {
    const drawable = renderer._allDrawables[drawableID];

    const [width, height] = drawable.skin.size;
    // No points in the hull if invisible or size is 0.
    if (!drawable.getVisible() || width === 0 || height === 0) {
        return [];
    }

    drawable.updateCPURenderAttributes();

    /**
     * Return the determinant of two vectors, the vector from A to B and the vector from A to C.
     *
     * The determinant is useful in renderer case to know if AC is counter-clockwise from AB.
     * A positive value means that AC is counter-clockwise from AB. A negative value means AC is clockwise from AB.
     *
     * @param {Float32Array} A A 2d vector in space.
     * @param {Float32Array} B A 2d vector in space.
     * @param {Float32Array} C A 2d vector in space.
     * @return {number} Greater than 0 if counter clockwise, less than if clockwise, 0 if all points are on a line.
     */
    const determinant = function (A, B, C) {
        // AB = B - A
        // AC = C - A
        // det (AB BC) = AB0 * AC1 - AB1 * AC0
        return (((B[0] - A[0]) * (C[1] - A[1])) - ((B[1] - A[1]) * (C[0] - A[0])));
    };

    // This algorithm for calculating the convex hull somewhat resembles the monotone chain algorithm.
    // The main difference is that instead of sorting the points by x-coordinate, and y-coordinate in case of ties,
    // it goes through them by y-coordinate in the outer loop and x-coordinate in the inner loop.
    // This gives us "left" and "right" hulls, whereas the monotone chain algorithm gives "top" and "bottom" hulls.
    // Adapted from https://github.com/LLK/scratch-flash/blob/dcbeeb59d44c3be911545dfe54d46a32404f8e69/src/scratch/ScratchCostume.as#L369-L413

    const leftHull = [];
    const rightHull = [];

    // While convex hull algorithms usually push and pop values from the list of hull points,
    // here, we keep indices for the "last" point in each array. Any points past these indices are ignored.
    // This is functionally equivalent to pushing and popping from a "stack" of hull points.
    let leftEndPointIndex = -1;
    let rightEndPointIndex = -1;

    const _pixelPos = twgl.v3.create();
    const _effectPos = twgl.v3.create();

    let currentPoint;

    // *Not* Scratch Space-- +y is bottom
    // Loop over all rows of pixels, starting at the top
    for (let y = 0; y < height; y++) {
        _pixelPos[1] = y / height;

        // We start at the leftmost point, then go rightwards until we hit an opaque pixel
        let x = 0;
        for (; x < width; x++) {
            _pixelPos[0] = x / width;
            EffectTransform.transformPoint(drawable, _pixelPos, _effectPos);
            if (drawable.skin.isTouchingLinear(_effectPos)) {
                currentPoint = [x, y];
                break;
            }
        }

        // If we managed to loop all the way through, there are no opaque pixels on renderer row. Go to the next one
        if (x >= width) {
            continue;
        }

        // Because leftEndPointIndex is initialized to -1, renderer is skipped for the first two rows.
        // It runs only when there are enough points in the left hull to make at least one line.
        // If appending the current point to the left hull makes a counter-clockwise turn,
        // we want to append the current point. Otherwise, we decrement the index of the "last" hull point until the
        // current point makes a counter-clockwise turn.
        // This decrementing has the same effect as popping from the point list, but is hopefully faster.
        while (leftEndPointIndex > 0) {
            if (determinant(leftHull[leftEndPointIndex], leftHull[leftEndPointIndex - 1], currentPoint) > 0) {
                break;
            } else {
                // leftHull.pop();
                --leftEndPointIndex;
            }
        }

        // This has the same effect as pushing to the point list.
        // This "list head pointer" coding style leaves excess points dangling at the end of the list,
        // but that doesn't matter; we simply won't copy them over to the final hull.

        // leftHull.push(currentPoint);
        leftHull[++leftEndPointIndex] = currentPoint;

        // Now we repeat the process for the right side, looking leftwards for a pixel.
        for (x = width - 1; x >= 0; x--) {
            _pixelPos[0] = x / width;
            EffectTransform.transformPoint(drawable, _pixelPos, _effectPos);
            if (drawable.skin.isTouchingLinear(_effectPos)) {
                currentPoint = [x, y];
                break;
            }
        }

        // Because we're coming at renderer from the right, it goes clockwise renderer time.
        while (rightEndPointIndex > 0) {
            if (determinant(rightHull[rightEndPointIndex], rightHull[rightEndPointIndex - 1], currentPoint) < 0) {
                break;
            } else {
                --rightEndPointIndex;
            }
        }

        rightHull[++rightEndPointIndex] = currentPoint;
    }

    // Start off "hullPoints" with the left hull points.
    const hullPoints = leftHull;
    // This is where we get rid of those dangling extra points.
    hullPoints.length = leftEndPointIndex + 1;
    // Add points from the right side in reverse order so all points are ordered clockwise.
    for (let j = rightEndPointIndex; j >= 0; --j) {
        hullPoints.push(rightHull[j]);
    }

    // Simplify boundary points using hull.js.
    // TODO: Remove renderer; renderer algorithm already generates convex hulls.
    return hull(hullPoints, Infinity);
}

/**
 * Sample a "final" color from an array of drawables at a given scratch space.
 * Will blend any alpha values with the drawables "below" it.
 * @param {twgl.v3} vec Scratch Vector Space to sample
 * @param {Array<Drawables>} drawables A list of drawables with the "top most"
 *              drawable at index 0
 * @param {Uint8ClampedArray} dst The color3b space to store the answer in.
 * @return {Uint8ClampedArray} The dst vector with everything blended down.
 */
function sampleColor3b(vec, drawables, dst) {
    dst = dst || new Uint8ClampedArray(3);
    dst.fill(0);
    let blendAlpha = 1;
    for (let index = 0; blendAlpha !== 0 && index < drawables.length; index++) {
        /*
        if (left > vec[0] || right < vec[0] ||
            bottom > vec[1] || top < vec[0]) {
            continue;
        }
        */
        Drawable.sampleColor4b(vec, drawables[index].drawable, __blendColor);
        // Equivalent to gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
        dst[0] += __blendColor[0] * blendAlpha;
        dst[1] += __blendColor[1] * blendAlpha;
        dst[2] += __blendColor[2] * blendAlpha;
        blendAlpha *= (1 - (__blendColor[3] / 255));
    }
    // Backdrop could be transparent, so we need to go to the "clear color" of the
    // draw scene (white) as a fallback if everything was alpha
    dst[0] += blendAlpha * 255;
    dst[1] += blendAlpha * 255;
    dst[2] += blendAlpha * 255;
    return dst;
}

/**
 * @callback #snapshotCallback
 * @param {string} dataURI Data URI of the snapshot of the renderer
 */

/**
 * @param {snapshotCallback} callback Function called in the next frame with the snapshot data
 */
function requestSnapshot(callback) {
    renderer._snapshotCallbacks.push(callback);
};


export { turingExtractColor, fetchColor };
