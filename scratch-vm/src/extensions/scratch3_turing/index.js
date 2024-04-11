const BlockType = require('../../extension-support/block-type.js')
const formatMessage = require('format-message');
const ArgumentType = require('../../extension-support/argument-type');
const Cast = require('../../util/cast.js');
const MathUtil = require('../../util/math-util');
const Timer = require('../../util/timer');
const VirtualMachine = require('../../virtual-machine.js');
const Distributions = require('./distributions.js')
const Color = require('../../util/color.js');
const TuringSensing = require('./turing-sensing.js');
// const { codePayload } = require('../../../../scratch-gui/src/lib/backpack-api.js');
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

const messagesOfAffirmation = []


const TIME = 0
const SIZE = 1
const X = 2
const Y = 3
const LOUDNESS = 4
const COLOR = 5
const NONE = 6

const MODES = ['NUMERIC', 'NUMERIC', 'NUMERIC', 'NUMERIC', 'NUMERIC', 'COLOR', 'NONE']
const UNITS = ['sec', '', '', '', 'sec', 'decibals', '',, '']
const RANDOM_VAR_NAMES = ['TIME', 'SIZE', 'X', 'Y', 'LOUDNESS', 'COLOR', 'NONE']

class Scratch3Turing {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this._runtime = runtime;
        this.state = {
            prior: 0,
            observed: 0,
            posterior: 0,
            random_var: NONE,
            unit: NONE,
            mode: NONE
        }

        this._extensionId = 'turing'

        this._runtime.emit('TURING_ACTIVE')
        this._runtime.registerTuringExtension(this._extensionId, this);

        this.samples = []
        this.lastSampleTime = 0;
        this._timer = new Timer();
        this._timer.start(); // TODO start this when the program's runtim begins (green flag)
        this.palette_idx = 0;

        // Build line list
        this.lineList = []
        this._addCurve(0, 0, 'prior') // standard normal
        this._addCurve(0, 0, 'posterior') // standard normal
        this._addCurve(0, 0, 'observed') // standard normal
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

    get NUMERIC_MENU_INFO () {
        return [
            {
                name: formatMessage({
                    id: 'turing.randomVarsMenu.timeTaken',
                    default: 'TIME',
                    description: 'Amount of time taken.'
                }),
            },
            {
                name: formatMessage({
                    id: 'turing.randomVarsMenu.size',
                    default: 'SIZE',
                    description: 'size'
                }),
            },
            {
                name: formatMessage({
                    id: 'turing.randomVarsMenu.x',
                    default: 'X',
                    description: 'x'
                }),
            },
            {
                name: formatMessage({
                    id: 'turing.randomVarsMenu.y',
                    default: 'Y',
                    description: 'y'
                }),
            },
            {
                name: formatMessage({
                    id: 'turing.randomVarsMenu.loudness',
                    default: 'LOUDNESS',
                    description: 'loudness'
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
                    opcode: 'showPrior',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'turing.showPrior',
                        default:  'our expectation',
                        description: 'turing.pinLocation'
                    })
                },
                {
                    opcode: 'showLastSample',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'turing.lastSample',
                        default:  'most recent sample',
                        description: 'turing.lastSample'
                    })
                },
                {
                    opcode: 'showRandomVariable',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'turing.showRandomVariable',
                        default:  'random variable',
                        description: 'turing.showRandomVariable'
                    })
                },
                {
                    opcode: 'setPrior',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'turing.setPrior',
                        default:  'I think [RANDOM_VAR] will be [PRIOR]',
                        description: 'turing.setPrior'
                    }),
                    arguments: {
                        RANDOM_VAR: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1,
                            menu: 'NUMERIC_MENU',
                        },
                        PRIOR: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                },
                {
                    opcode: 'setColourPrior',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'turing.setColourPrior',
                        default:  'I think [SOMETHING] is [COLOR]',
                        description: 'turing.setRandomVariable'
                    }),
                    arguments: {
                        SOMETHING: {
                            type: ArgumentType.STRING,
                            defaultValue: 'a field',
                        },
                        COLOR: {
                            type: ArgumentType.COLOR,
                        }
                    }
                },
                {
                    opcode: 'takeSample',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'turing.sample',
                        default:  'take sample',
                        description: 'turing.takeSample'
                    })
                },
                {
                    opcode: 'clearSamples',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'turing.clearSamples',
                        default:  'clear samples',
                        description: 'turing.clearSamples'
                    })
                },
            ],
            menus: {
                NUMERIC_MENU: {
                    acceptReporters: true,
                    items: this._buildMenu(this.NUMERIC_MENU_INFO)
                },
            }
        };
    }

    showRandomVariable() {
        return RANDOM_VAR_NAMES[this.state.random_var]
    }

    showLastSample() {
        if (this.samples.length < 1) {
            return "No samples yet..."
        } 
        return this.state.observed + ' ' + this.state.unit
    }

    showPrior() {
        if (this.state.prior == 0) {
            return "Not sure yet..."
        }
        return this.state.prior+' '+ this.state.unit // cast to string
    }

    setColourRandomVariable(args, util) {
        this.state.random_var = COLOR
        this.state.unit = UNITS[COLOR]
        this.state.mode = MODES[COLOR]
        this.state.type = RANDOM_VAR_NAMES[COLOR]
        return this._getAffirmation()
    }

    _setRandomVariable(rv) {
        this.state.random_var = rv
        this.state.unit = UNITS[rv]
        this.state.mode = MODES[rv]
        this.state.type = RANDOM_VAR_NAMES[rv]
    }

    setColourPrior(args, util) {
        this._setRandomVariable(COLOR)
        return this._getAffirmation()
    }

    setPrior(args, util) {
        var prior = args.PRIOR
        var random_var_idx = args.RANDOM_VAR - 1

        console.log("Setting prior to " + RANDOM_VAR_NAMES[prior])

        if (this.state.random_var != random_var_idx) {
            this._setRandomVariable(random_var_idx)
        }

        // Compatibility checks with type of random variable chosen
        if (!this._checkCompatibility(prior)) {
            return this._getCaution()
        }

        // set the new prior in the line charts
        this.state.prior = Number(prior)
        this._updatePrior(prior)
        
        // Clear visualised data 
        this.samples = []  // TODO also reset charts
        data = this._toJSON(this.samples, this._getBarChartData('mean'), this._getDistributionData())
        this._runtime.emit('TURING_DATA', data)
        return  this._getAffirmation()
    }

    takeSample (args, util) {
        console.log("Taking a sample!")
        // Slightly buffer requests
        const currentTime = Date.now(); 
        if (currentTime - this.lastSampleTime < 400) {
          return; 
        }
        this.lastSampleTime = currentTime;

        // Check if we can get a sample
        console.log(util.target)

        if (typeof util.target != undefined) {
            this._getThenSendSample(args, util)
        } else {
            return "I can't do this alone ;) Add me to your code!"
        }
    }

    // This may belong inside backdrop action menu!
    downloadBackdrop(jpegdata, filename) {
        var byteArray = atob(jpegdata);
        var uint8Array = new Uint8Array(byteArray.length);
        for (var i = 0; i < byteArray.length; i++) {
        uint8Array[i] = byteArray.charCodeAt(i);
        }
        var blob = new Blob([uint8Array], { type: 'image/jpeg' });
        link.href = URL.createObjectURL(blob);
        link.download = filename + '.jpg';   
    }


    /* Helper Utilities */

    _getAffirmation() {
        const randomWords = ["Epic! ^_^", "Okay!", "Done!", "Noted :))", "Excellent!", "Got it :)", "Awesome! :D", "Okey dokey!", "Splendid!", "Looks good!"];
        const randomWord = randomWords[Math.floor(Math.random() * randomWords.length)];
        return randomWord; // Output a random word or phrase
    }

    _getCaution() {
        const cautionaryMessages = [
            "Hmm... that doesn't look right!",
            "Are you sure about that?",
            "Something's fishy here...",
            "Double check your input!",
            "Something seems off...",
            "Oops, that might be a mistake!",
            "Hold on, that's not quite right...",
            "Hmm... let's rethink this!",
            "Check your inputs!",
        ];
        
        // Get a random cautionary message from the array
        const randomCautionaryMessage = cautionaryMessages[Math.floor(Math.random() * cautionaryMessages.length)];
        return randomCautionaryMessage; // Output a random cautionary message
    }

    _getThenSendSample(args, util) {
        console.log("---------->")
        var newSample;

        if (this.state.mode == "COLOR") {
            color = TuringSensing.fetchColor(util.target)
            console.log("we extracted this color: ")
            console.log(color)
            newSample = Color.rgbToHex(color)
            console.log(            )
            this.samples.push(newSample)
        } else {
            newSample = this._timer.timeElapsed() / 1000
            this.samples.push(newSample) 
            this._timer.start(); // start a new timer
        }
        this._updateObservedData(newSample)
        data = this._toJSON(this.samples, this._getBarChartData('mean'), this._getDistributionData())
        this._runtime.emit('TURING_DATA', data)
    }

    _checkCompatibility(prior) {
        switch (RANDOM_VAR_NAMES[this.state.random_var]) {
            case 'X':
                return !isNaN(Number(prior)) && Number(prior) >= -240 && Number(prior) <= 240;
            case 'Y':
                return !isNaN(Number(prior)) && Number(prior) >= -180 && Number(prior) <= 180;
            case 'SIZE':
                return !isNaN(Number(prior)) && Number(prior) > 0 && Number(prior) < 500;
            case 'TIME':
                return !isNaN(Number(prior)) && Number(prior) > 0;
            case 'LOUDNESS':
                return !isNaN(Number(prior)) && Number(prior) > 0  && Number(prior) < 100;
            case 'COLOR':
                return true;
            default:
                return false; 
        }
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

    _generateRandomHexCode() {
        const randomColor = Math.floor(Math.random() * 16777215);
        const hexCode = randomColor.toString(16).padStart(6, '0');
        return `#${hexCode}`; 
    }

    _getPictureFromBackdrop() {
        this._runtime.renderer.draw();
        var canvas = this._getStageCanvas();
        var jpegdata = canvas.toDataURL('image/jpeg');
        if (jpegdata.indexOf('data:image/jpeg;base64,') === 0) {
          jpegdata = jpegdata.substr('data:image/jpeg;base64,'.length);
        }
        return jpegdata;
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
      
    _updateObservedData() {
        var m, s

        if (this.state.mode === "COLOR") {
          m = 10
          s = 4
        } else {
          [m, s] = this._getMeanAndVariance(this.samples); // Numeric random variables here
        }
        this.state.observed = m

        const updatedLineList = [...this.lineList]; 
        updatedLineList[OBSERVED_INDEX] = { ...updatedLineList[OBSERVED_INDEX], mean: m, stdv: s };
        this.lineList = updatedLineList // update line list
        console.log("UPDATED LINE LIST")
        console.log(this.lineList)
      }

    _updatePrior(newPrior) {
        console.log("setting prior to ZERO")
        const updatedLineList = [...this.lineList]; 
        updatedLineList[PRIOR_INDEX] = { ...updatedLineList[PRIOR_INDEX], mean: newPrior};
        this.lineList = updatedLineList // update line list
    }

    _getMeanAndVariance(numbers) {
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
            pValue: 0, // TODO add some way to see our last sample
            stroke: this._getColorFromPalette(),
          }
        this.lineList.push(newCurve)
    }

    _getDistributionData() {
        return Distributions.generateProbabilityData(this.lineList)
    }

    _getBarChartData(param) {
        return [
            { type: "prior", value: this.state.prior},
            { type: "observed", value: this.state.observed}, // this.lineList[OBSERVED_INDEX][param] 
            { type: "posterior", value: this.state.posterior},
            ];
    }
}
module.exports = Scratch3Turing;

