const BlockType = require('../../extension-support/block-type.js')
const formatMessage = require('format-message');
const ArgumentType = require('../../extension-support/argument-type');
const Cast = require('../../util/cast.js');
const MathUtil = require('../../util/math-util');
const Timer = require('../../util/timer');
const VirtualMachine = require('../../virtual-machine.js');
const Distributions = require('./distributions.js')
const Data = require('./data.js')
const Color = require('../../util/color.js')
// const GUI = require('scratch-gui')

const palette = [
    "#4D97FF",
    "#9966FF",
    "#D957D9",
    "#FFAB1A",
    "#45BDE5",
    "#00B295",
    "#4CBF56",
    "#FF5959"
  ];

  
const PRIOR_INDEX = 0
const POSTERIOR_INDEX = 1
const OBSERVED_INDEX = 2
  
class Scratch3Turing {
    constructor (runtime, extensionId) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this._runtime = runtime;
        this.state = {
            expectation: 0,
            feature: 0,
            unit: '%',
            mode: 'HUE_BASED'
        }

        this._extensionId = 'turing'
        this.features = ['likelihood', 'time', 'proportion']
        this.units = ['%', 'sec', '%']

        this.modes = ['HUE_BASED', 'TIME_BASED', 'HUE_BASED']

        this.lineList = []
        this._runtime.registerBayesExtension(this._extensionId, this);

        this.samples = []
        this.lastSampleTime = 0;
        /**
         * The timer utility.
         * @type {Timer}
         */
        this._timer = new Timer();
        this._timer.start();
        this.palette_idx = 0;

        // Build line list
        this._addCurve(0, 0.02, 'prior') // standard normal
        this._addCurve(0.5, 10, 'posterior') // standard normal
        this._addCurve(-0.2, 1, 'observed') // standard normal
    }

    _getColorFromPalette() {
        this.palette_idx = (this.palette_idx + 1) % palette.length
        return palette[this.palette_idx]
    }

    /**
     * Create data for a menu in scratch-blocks format, consisting of an array of objects with text and
     * value properties. The text is a translated string, and the value is one-indexed.
     * @param  {object[]} info - An array of info objects each having a name property.
     * @return {array} - An array of objects with text and value properties.
     * @private
     */
    _buildMenu (info) {
        return info.map((entry, index) => {
            const obj = {};
            obj.text = entry.name;
            obj.value = String(index + 1);
            return obj;
        });
    }

    /**
     * An array of info about each model type.
     * @type {object[]}
     * @param {string} name - the translatable name to display in the drums menu.
     * @param {string} fileName - the name of the audio file containing the drum sound.
     */
    get MODEL_INFO () {
        return [
            {
                name: formatMessage({
                    id: 'turing.models.bernoulli',
                    default: 'bernoulli',
                    description: 'Success or failure in a single trial'
                }),
            },
            {
                name: formatMessage({
                    id: 'turing.models.binomial',
                    default: 'binomial',
                    description: 'Discrete data, # successes in fixed number of independent trials.'
                }),
            },
            {
                name: formatMessage({
                    id: 'turing.models.gaussian',
                    default: 'gaussian',
                    description: 'Cts data, characterised by a bell-shaped curve and mean-variance parameters.'
                }),
            },
           ]
        }

        get FEATURE_INFO () {
            return [
                {
                    name: formatMessage({
                        id: 'turing.features.likelihood',
                        default: 'likelihood (%)',
                        description: 'likelihood'
                    }),
                },
                {
                    name: formatMessage({
                        id: 'turing.models.timeTaken',
                        default: 'time (s)',
                        description: 'Amount of time taken.'
                    }),
                },
                {
                    name: formatMessage({
                        id: 'turing.models.proportion',
                        default: 'proportion (%)',
                        description: 'proportion'
                    }),
                },
               ]
            }
    
    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: 'turing',
            name: 'Turing',

            blocks: [
                {
                    opcode: 'expectation',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'turing.expectation',
                        default:  'we expect',
                        description: 'turing.pinLocation'
                    })
                },
                {
                    opcode: 'actualValue',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'turing.actual',
                        default:  'actual value',
                        description: 'turing.actualValue'
                    })
                },
                {
                    opcode: 'setExpectation',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'turing.setExpectation',
                        default:  'I think [FEATURE] will be [EXP]',
                        description: 'turing.setExpectation'
                    }),
                    arguments: {
                        FEATURE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1,
                            menu: 'FEATURES',
                        },
                        EXP: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                },
                {
                    opcode: 'sample',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'turing.sample',
                        default:  '📌 Take Sample',
                        description: 'turing.sample'
                    })
                },
                {
                    opcode: 'clearPins',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'turing.clearPins',
                        default:  '📌 Clear Pins',
                        description: 'turing.clearPins'
                    })
                },
            ],
            menus: {
                FEATURES: {
                    acceptReporters: true,
                    items: this._buildMenu(this.FEATURE_INFO)
                },
            }
        };
    }

    // openPanel() {
    //     panelCallback = this._runtime.bayesCallbacks[this._extensionId]
    //     panelCallback(this._extensionId)
    // }

    actualValue(args, util) {
        if (this.state.unit == "sec") {
            return this.getTimer(args, util).toFixed(2) + ' ' + this.state.unit
        } else if (this.state.feature == "proportion") {
            return "todo: prop"
        } else {
            return "todo: likelihood"
        }
    }

    expectation(args, util) {
        return this.state.expectation+' '+ this.state.unit // cast to string
    }

    setExpectation(args, util) {
        expectation = args.EXP
        featureIndex = args.FEATURE - 1
        this.state.expectation = expectation
        this.state.feature = this.features[featureIndex]
        this.state.unit = this.units[featureIndex]
        this.state.mode = this.modes[featureIndex]

        // Clear visualised data 
        this.samples = [] 
        data = this._toJSON(this.samples, this._getBarChart('mean'), this._getDistribution())
        this._runtime.emit('BAYES_DATA', data)
        return "Set " + this.state.feature + " to " + this.state.expectation  + " " + this.state.unit
    }

    /* Prepare a JSON of relevant data */
    _toJSON(samples, bcD, pdfD, x, y) {
        return {
            state: this.state, // type of problem (ie. time taken, proportion, likelihood - affects visualisations)
            samples: samples, // updates the samples list
            barData: bcD, // plots bar chart data
            distData: pdfD, // plots normal distribution
            distLines: this.lineList,
            spriteX: x,
            spriteY: y,
            mode: this.state.mode
        }
    }

    generateHexCode() {
        // Generate a random integer representing a 24-bit color value (3 bytes)
        const randomColor = Math.floor(Math.random() * 16777215);
        // Convert the random number to a hexadecimal string with padding
        const hexCode = randomColor.toString(16).padStart(6, '0');
        return `#${hexCode}`; // Add '#' prefix for a valid hex color code
      }

    getBackdrop1() {
        this._runtime.renderer.draw();
        var canvas = this._getStageCanvas();
        var jpegdata = canvas.toDataURL('image/jpeg');
        if (jpegdata.indexOf('data:image/jpeg;base64,') === 0) {
          jpegdata = jpegdata.substr('data:image/jpeg;base64,'.length);
        }
        return jpegdata;
    }

    getBackdrop2() {
        // where is the sprite's top left corner and how big is it?
        var target = util.target;
        var costume = target.getCurrentCostume();
        var sizeRatio = target.size / 100;
        var width = costume.size[0] / costume.bitmapResolution * sizeRatio;
        var height = costume.size[1] / costume.bitmapResolution * sizeRatio;
        var x = target.x - costume.rotationCenterX / costume.bitmapResolution;
        var y = target.y + costume.rotationCenterY / costume.bitmapResolution;
        var originalCanvas = this._getStageCanvas();
        // assume that the factor will be the same for both width and height
        var scaleFactor = originalCanvas.width / 480;
        x = scaleFactor * (x + 240);
        y = -scaleFactor * (y - 180);
        width *= scaleFactor;
        height *= scaleFactor;

        // make a new off-screen canvas to copy to
        console.log('[mlforkids] Resizing backdrop to dimensions needed for classifying');
        var RESIZE_WIDTH = 224;
        var RESIZE_HEIGHT = 224;
        var copyCanvas = document.createElement('canvas');
        copyCanvas.width = RESIZE_WIDTH;
        copyCanvas.height = RESIZE_HEIGHT;
        var copyContext = copyCanvas.getContext('2d');

        // get the backdrop image
        this._runtime.renderer.draw();

        // copy a section of the backdrop to the copy canvas
        copyContext.drawImage(originalCanvas, x, y, width, height, 0, 0, RESIZE_WIDTH, RESIZE_HEIGHT);

        // get the base64-encoded version of the copy canvas
        var jpegdata = copyCanvas.toDataURL('image/jpeg');
        if (jpegdata.indexOf('data:image/jpeg;base64,') === 0) {
        jpegdata = jpegdata.substr('data:image/jpeg;base64,'.length);
        }
        return jpegdata;
    }

    downloadImage(jpegdata) {
        // Assuming jpegdata is the base64 encoded string
        var byteArray = atob(jpegdata);

        // Convert the byte array to a Uint8Array (an array of 8-bit unsigned integers)
        var uint8Array = new Uint8Array(byteArray.length);
        for (var i = 0; i < byteArray.length; i++) {
        uint8Array[i] = byteArray.charCodeAt(i);
        }

        var blob = new Blob([uint8Array], { type: 'image/jpeg' });
        link.href = URL.createObjectURL(blob);
        link.download = 'image.jpg'; // Set your desired filename      
    }
    
    _getStageCanvas() {
        var allCanvases = document.getElementsByTagName('canvas');
        for (var i = 0; i < allCanvases.length; i++) {
          var canvas = allCanvases[i];
          if (canvas.width > 0 && canvas.className.indexOf('paper-canvas_paper-canvas') === -1) {
            return canvas;
          }
        }
    }

    getStageCanvas() {
        var allCanvases = document.getElementsByTagName('canvas');
        if (allCanvases.length > 0) {
            return allCanvases[0] // we assume that the stage is the first canvas
        }
    }

    interpolate(x, oldMin, oldMax, newMin, newMax) {
        // Check for invalid ranges
        if (oldMin >= oldMax || newMin >= newMax) {
          throw new Error("Invalid ranges provided!");
        }
      
        // Calculate the ratio within the old range
        const oldRange = oldMax - oldMin;
        const relativeX = x - oldMin;
        const ratio = relativeX / oldRange;
      
        // Calculate the new value within the new range
        const newRange = newMax - newMin;
        const newX = ratio * newRange + newMin;
      
        return newX;
      }
      
    sample(args, util) {
        const currentTime = Date.now(); 
        if (currentTime - this.lastSampleTime < 800) {
          return; 
        }
        this.lastSampleTime = currentTime;
        this.sendData(util)
    }
    sendData(util) {
        console.log("---------->")
        var newSample;

        if (this.state.mode == "HUE_BASED") {
            var x = util.target.x
            var y = util.target.y 
            // Get current stage dimensions
            const canvas = this.getStageCanvas() 
            var width = canvas.clientWidth
            const height = canvas.clientHeight
            // interpolate sprite co-ordinates
            var yy = y / (height / 360) + 180
            var xx = x / (width / 480) + 240
            var new_X = Math.round(width - this.interpolate(x, -240, 240, 0, width))
            var new_Y = Math.round(height - this.interpolate(y, -180, 180, 0, height))
            console.log("NewX: 0 < " + new_X + "(" + typeof new_X + ") < " + width + "(" + typeof width + ")")
            console.log("XX: 0 < " + new_X + "(" + typeof xx + ") < " + width + "(" + typeof width + ")")
            console.log("NewY: 0 < " + new_Y + "(" + typeof new_Y + ") < " + height + "(" + typeof height + ")")
            console.log("YY: 0 < " + yy + "(" + typeof yy + ") < " + height + "(" + typeof height + ")")
            // extract colour
            color = util.target.renderer.extractColor(new_X, new_Y, 1).color // ????????????????????   
            newSample = Color.rgbToHex(color)
            this.samples.push(newSample)
        } else {
            newSample = this._timer.timeElapsed() / 1000
            this.samples.push(newSample) 
            this._timer.start(); // start a new timer
        }
        this.updateObservedData(newSample)
        data = this._toJSON(this.samples, this._getBarChart('mean'), this._getDistribution())
        this._runtime.emit('BAYES_DATA', data)
    }
      
    updateObservedData() {
        var m, s

        if (this.state.mode === "HUE_BASED") {
          m = 10
          s = 4
        } else {
          [m, s] = this.getMeanAndVariance(this.samples); // Numeric random variables here
          console.log("new mean: " + m + ", new stdv: " + s)
        }
        const updatedLineList = [...this.lineList]; 
        updatedLineList[OBSERVED_INDEX] = { ...updatedLineList[OBSERVED_INDEX], mean: m, stdv: s };
        this.lineList = updatedLineList // update line list
        console.log("UPDATED LINE LIST")
        console.log(this.lineList)
      }

    getMeanAndVariance(numbers) {
        if (!Array.isArray(numbers)) {
          throw new Error("Input must be an array of numbers");
        }
        console.log(numbers)
        const sum = numbers.reduce((acc, num) => acc + num, 0);
        const mean = sum / numbers.length;
        const squaredDeviations = numbers.reduce((acc, num) => {
          const diff = num - mean;
          return acc + Math.pow(diff, 2);
        }, 0);
        const stdv = squaredDeviations / numbers.length;
        console.log(mean)
        console.log(stdv)
        return [mean, stdv];
    }
      
    // Add multiple curves for different samples to our distribution?
    _addCurve(mu, sigma, id) {
        newCurve = {
            id: id,
            name: id,
            mean: mu,
            stdv: sigma,
            zScore: 0,
            pValue: 0, 
            stroke: this._getColorFromPalette(),
          }
        this.lineList.push(newCurve)
    }

    _getDistribution() {
        return Distributions.generateProbabilityData(this.lineList)
    }

    _getBarChart(param) {
        console.log("Data for bar chart --> " + param)
        console.log(this.lineList[OBSERVED_INDEX][param])
        return [
            { type: "prior", value: 1},
            { type: "observed", value: this.lineList[OBSERVED_INDEX][param] },
            { type: "posterior", value: 1},
            ];
    }

    _dummyDist(x,y) {
        return [
            {
                prior: x*100,
                observed: y*100,
                amt: 200,
            },
            {
        
                prior: x*300,
                observed: 1398,
                amt: 2210,
            },
            {
                prior: 2000,
                observed: 9800,
                amt: 2290,
            },
            {
                prior: 2780,
                observed: 3908,
                amt: 2000,
            },
            {
                prior: 1890,
                observed: 4800,
                amt: 2181,
            },
            {
                prior: 2390,
                observed: 3800,
                amt: 2500,
            },
            {
                prior: 3490,
                observed: 4300,
                amt: 2100,
            }
        ];
    }

    clearPins(args, util) {
        return "done"
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives () {
        return {
            motion_movesteps: this.moveSteps,
            motion_gotoxy: this.goToXY,
            motion_goto: this.goTo,
            motion_turnright: this.turnRight,
            motion_turnleft: this.turnLeft,
            motion_pointindirection: this.pointInDirection,
            motion_pointtowards: this.pointTowards,
            motion_glidesecstoxy: this.glide,
            motion_glideto: this.glideTo,
            motion_ifonedgebounce: this.ifOnEdgeBounce,
            motion_setrotationstyle: this.setRotationStyle,
            motion_changexby: this.changeX,
            motion_setx: this.setX,
            motion_changeyby: this.changeY,
            motion_sety: this.setY,
            motion_xposition: this.getX,
            motion_yposition: this.getY,
            motion_direction: this.getDirection,
            sensing_timer: this.getTimer,
            // Legacy no-op blocks:
            motion_scroll_right: () => {},
            motion_scroll_up: () => {},
            motion_align_scene: () => {},
            motion_xscroll: () => {},
            motion_yscroll: () => {}
        };
    }

    getTimer (args, util) {
        return util.ioQuery('clock', 'projectTimer');
    }

    getMonitored () {
        return {
            motion_xposition: {
                isSpriteSpecific: true,
                getId: targetId => `${targetId}_xposition`
            },
            motion_yposition: {
                isSpriteSpecific: true,
                getId: targetId => `${targetId}_yposition`
            },
            motion_direction: {
                isSpriteSpecific: true,
                getId: targetId => `${targetId}_direction`
            },
            sensing_timer: {
                getId: () => 'timer'
            },
        };
    }

    moveSteps (args, util) {
        const steps = Cast.toNumber(args.STEPS);
        const radians = MathUtil.degToRad(90 - util.target.direction);
        const dx = steps * Math.cos(radians);
        const dy = steps * Math.sin(radians);
        util.target.setXY(util.target.x + dx, util.target.y + dy);
    }

    goToXY (args, util) {
        const x = Cast.toNumber(args.X);
        const y = Cast.toNumber(args.Y);
        util.target.setXY(x, y);
    }

    getTargetXY (targetName, util) {
        let targetX = 0;
        let targetY = 0;
        if (targetName === '_mouse_') {
            targetX = util.ioQuery('mouse', 'getScratchX');
            targetY = util.ioQuery('mouse', 'getScratchY');
        } else if (targetName === '_random_') {
            const stageWidth = this.runtime.constructor.STAGE_WIDTH;
            const stageHeight = this.runtime.constructor.STAGE_HEIGHT;
            targetX = Math.round(stageWidth * (Math.random() - 0.5));
            targetY = Math.round(stageHeight * (Math.random() - 0.5));
        } else {
            targetName = Cast.toString(targetName);
            const goToTarget = this.runtime.getSpriteTargetByName(targetName);
            if (!goToTarget) return;
            targetX = goToTarget.x;
            targetY = goToTarget.y;
        }
        return [targetX, targetY];
    }

    goTo (args, util) {
        const targetXY = this.getTargetXY(args.TO, util);
        if (targetXY) {
            util.target.setXY(targetXY[0], targetXY[1]);
        }
    }

    turnRight (args, util) {
        const degrees = Cast.toNumber(args.DEGREES);
        util.target.setDirection(util.target.direction + degrees);
    }

    turnLeft (args, util) {
        const degrees = Cast.toNumber(args.DEGREES);
        util.target.setDirection(util.target.direction - degrees);
    }

    pointInDirection (args, util) {
        const direction = Cast.toNumber(args.DIRECTION);
        util.target.setDirection(direction);
    }

    pointTowards (args, util) {
        let targetX = 0;
        let targetY = 0;
        if (args.TOWARDS === '_mouse_') {
            targetX = util.ioQuery('mouse', 'getScratchX');
            targetY = util.ioQuery('mouse', 'getScratchY');
        } else if (args.TOWARDS === '_random_') {
            util.target.setDirection(Math.round(Math.random() * 360) - 180);
            return;
        } else {
            args.TOWARDS = Cast.toString(args.TOWARDS);
            const pointTarget = this.runtime.getSpriteTargetByName(args.TOWARDS);
            if (!pointTarget) return;
            targetX = pointTarget.x;
            targetY = pointTarget.y;
        }

        const dx = targetX - util.target.x;
        const dy = targetY - util.target.y;
        const direction = 90 - MathUtil.radToDeg(Math.atan2(dy, dx));
        util.target.setDirection(direction);
    }

    glide (args, util) {
        if (util.stackFrame.timer) {
            const timeElapsed = util.stackFrame.timer.timeElapsed();
            if (timeElapsed < util.stackFrame.duration * 1000) {
                // In progress: move to intermediate position.
                const frac = timeElapsed / (util.stackFrame.duration * 1000);
                const dx = frac * (util.stackFrame.endX - util.stackFrame.startX);
                const dy = frac * (util.stackFrame.endY - util.stackFrame.startY);
                util.target.setXY(
                    util.stackFrame.startX + dx,
                    util.stackFrame.startY + dy
                );
                util.yield();
            } else {
                // Finished: move to final position.
                util.target.setXY(util.stackFrame.endX, util.stackFrame.endY);
            }
        } else {
            // First time: save data for future use.
            util.stackFrame.timer = new Timer();
            util.stackFrame.timer.start();
            util.stackFrame.duration = Cast.toNumber(args.SECS);
            util.stackFrame.startX = util.target.x;
            util.stackFrame.startY = util.target.y;
            util.stackFrame.endX = Cast.toNumber(args.X);
            util.stackFrame.endY = Cast.toNumber(args.Y);
            if (util.stackFrame.duration <= 0) {
                // Duration too short to glide.
                util.target.setXY(util.stackFrame.endX, util.stackFrame.endY);
                return;
            }
            util.yield();
        }
    }

    glideTo (args, util) {
        const targetXY = this.getTargetXY(args.TO, util);
        if (targetXY) {
            this.glide({SECS: args.SECS, X: targetXY[0], Y: targetXY[1]}, util);
        }
    }

    ifOnEdgeBounce (args, util) {
        const bounds = util.target.getBounds();
        if (!bounds) {
            return;
        }
        // Measure distance to edges.
        // Values are positive when the sprite is far away,
        // and clamped to zero when the sprite is beyond.
        const stageWidth = this.runtime.constructor.STAGE_WIDTH;
        const stageHeight = this.runtime.constructor.STAGE_HEIGHT;
        const distLeft = Math.max(0, (stageWidth / 2) + bounds.left);
        const distTop = Math.max(0, (stageHeight / 2) - bounds.top);
        const distRight = Math.max(0, (stageWidth / 2) - bounds.right);
        const distBottom = Math.max(0, (stageHeight / 2) + bounds.bottom);
        // Find the nearest edge.
        let nearestEdge = '';
        let minDist = Infinity;
        if (distLeft < minDist) {
            minDist = distLeft;
            nearestEdge = 'left';
        }
        if (distTop < minDist) {
            minDist = distTop;
            nearestEdge = 'top';
        }
        if (distRight < minDist) {
            minDist = distRight;
            nearestEdge = 'right';
        }
        if (distBottom < minDist) {
            minDist = distBottom;
            nearestEdge = 'bottom';
        }
        if (minDist > 0) {
            return; // Not touching any edge.
        }
        // Point away from the nearest edge.
        const radians = MathUtil.degToRad(90 - util.target.direction);
        let dx = Math.cos(radians);
        let dy = -Math.sin(radians);
        if (nearestEdge === 'left') {
            dx = Math.max(0.2, Math.abs(dx));
        } else if (nearestEdge === 'top') {
            dy = Math.max(0.2, Math.abs(dy));
        } else if (nearestEdge === 'right') {
            dx = 0 - Math.max(0.2, Math.abs(dx));
        } else if (nearestEdge === 'bottom') {
            dy = 0 - Math.max(0.2, Math.abs(dy));
        }
        const newDirection = MathUtil.radToDeg(Math.atan2(dy, dx)) + 90;
        util.target.setDirection(newDirection);
        // Keep within the stage.
        const fencedPosition = util.target.keepInFence(util.target.x, util.target.y);
        util.target.setXY(fencedPosition[0], fencedPosition[1]);
    }

    setRotationStyle (args, util) {
        util.target.setRotationStyle(args.STYLE);
    }

    changeX (args, util) {
        const dx = Cast.toNumber(args.DX);
        util.target.setXY(util.target.x + dx, util.target.y);
    }

    setX (args, util) {
        const x = Cast.toNumber(args.X);
        util.target.setXY(x, util.target.y);
    }

    changeY (args, util) {
        const dy = Cast.toNumber(args.DY);
        util.target.setXY(util.target.x, util.target.y + dy);
    }

    setY (args, util) {
        const y = Cast.toNumber(args.Y);
        util.target.setXY(util.target.x, y);
    }

    getX (args, util) {
        return this.limitPrecision(util.target.x);
    }

    getY (args, util) {
        return this.limitPrecision(util.target.y);
    }

    getDirection (args, util) {
        return util.target.direction;
    }

    // This corresponds to snapToInteger in Scratch 2
    limitPrecision (coordinate) {
        const rounded = Math.round(coordinate);
        const delta = coordinate - rounded;
        const limitedCoord = (Math.abs(delta) < 1e-9) ? rounded : coordinate;

        return limitedCoord;
    }
}

module.exports = Scratch3Turing;

