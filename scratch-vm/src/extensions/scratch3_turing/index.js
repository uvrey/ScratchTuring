const BlockType = require('../../extension-support/block-type.js')
const formatMessage = require('format-message');
const ArgumentType = require('../../extension-support/argument-type');
const Timer = require('../../util/timer');
const Distributions = require('./distributions.js')
const Color = require('../../util/color.js');
const TuringSensing = require('./turing-sensing.js');
const { random } = require('gsap');

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

const TIME = 0
const SIZE = 1
const X = 2
const Y = 3
const COLOR = 4
const RHYTHM = 5
const NONE = 6
const CUSTOM = 7


const MODES = ['NUMERIC', 'NUMERIC', 'NUMERIC', 'NUMERIC', 'COLOR', 'NUMERIC', 'NONE', 'NUMERIC']
const UNITS = ['s', '', '', '', '', '', '', '', '', '']
const RANDOM_VAR_NAMES = ['TIME TAKEN', 'SIZE', 'X', 'Y', 'COLOR', 'RHYTHM', 'NONE', 'CUSTOM']
const DISTRIBUTIONS = ['gaussian', 'hue', 'rhythm']

window.addEventListener("beforeunload", (event) => {
    console.log("Session might have ended");
    // Send session end signal or handle cleanup here
});

class Scratch3Turing {
    constructor(runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this._runtime = runtime;

        //   this.api_host = "http://165.232.101.180:443"
        this.api_host = "http://127.0.0.1:2222" // local server
        // this.api_host = "https://46c3-131-111-184-91.ngrok-free.app"
        // this.api_host = "https://8c36-131-111-184-91.ngrok-free.app"

        this._extensionId = 'turing'

        this.TARGET_PROPERTIES = [
            (util, model) => model.timer.timeElapsed() / 1000, // TIME
            (util, model) => util.target.size,
            (util, model) => util.target.x,
            (util, model) => util.target.y,
            (util, model) => TuringSensing.fetchColor(util.target),
            (util, model) => this.globalTimer.timeElapsed() / 1000, // Get global timer for the timeline
            (util, model) => NONE,
        ];

        this.user_models = {} // each target has its own model

        this._runtime.emit('TURING_ACTIVE')
        this._runtime.registerTuringExtension(this._extensionId, this);

        this.username = this._initAPI()

        this.observations = []
        this.truth_data = []
        this.lastSampleTime = {};
        this.timers = {};
        this.palette_idx = 0;

        sessionStorage.setItem("username", this.username);

        this.visualisationData = {}
        this.globalTimer = new Timer()

        this._onResetTimer = this._onResetTimer.bind(this);
        this._runtime.on('PROJECT_START', this._onResetTimer);

        this._updateParams = this._updateParams.bind(this);
        this._runtime.on('UPDATE_CUSTOM_PARAMS', data => this._updateParams(data, 'groundTruth'));

        this._onClearSamples = this._onClearSamples.bind(this);
        this._runtime.on('CLEAR_SAMPLES', data => this._onClearSamples(data.modelName));

        this.onDelete = this._onDeleteModel.bind(this);
        this._runtime.on('REMOVE_MODEL', data => this._onDeleteModel(data.modelName));

        this._updateParams = this._updateParams.bind(this);
        this._runtime.on('UPDATE_POSTERIOR_N', data => this._updateParams(data, 'ps'));

        this._runtime.on('UPDATE_TOOLTIP', data => this._updateParams(data, 'helpfulTooltip'));
        this._runtime.on('UPDATE_MEAN_LINES', data => this._updateParams(data, 'meanLines'));

        this._updateParams = this._updateParams.bind(this);
        this._runtime.on('UPDATE_PRIOR_PARAMS', data => this._updateParams(data, 'prior'));

        this._updateViewFactor = this._updateViewFactor.bind(this);
        this._runtime.on('UPDATE_VIEW_FACTOR', data => this._updateViewFactor(data));

        this._updateParams = this._updateParams.bind(this);
        this._runtime.on('UPDATE_GROUND_TRUTH_PARAMS', data => this._updateParams(data, 'groundTruth'));

        this.toggleVisibility = this.toggleVisibility.bind(this);
        this._runtime.on('TOGGLE_VISIBILITY', data => this.toggleVisibility(data));
    }

    _getColorFromPalette() {
        this.palette_idx = (this.palette_idx + 1) % palette.length
        return palette[this.palette_idx]
    }

    _generateRandomUserName(length) {
        // Use crypto.getRandomValues for secure random generation
        const randomBytes = new Uint8Array(length);
        window.crypto.getRandomValues(randomBytes);

        // Convert the bytes to a random string
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let result = "";
        for (let i = 0; i < length; i++) {
            const index = Math.floor(randomBytes[i] / 256 * chars.length);
            result += chars[index];
        }
        return result;
    }


    _initAPI() {
        const userName = this._generateRandomUserName(16);
        console.log(userName); // Output: a random string of length 16

        // if (sessionStorage.getItem("username")) {
        //     // delete this data from the API TTODO get this username
        //     alert('we had already stored a username for this person!');
        // }
        return userName
    }
    /**
     * Create data for a menu in scratch-blocks format, consisting of an array of objects with text and
     * value properties. The text is a translated string, and the value is one-indexed.
     * @param  {object[]} info - An array of info objects each having a name property.
     * @return {array} - An array of objects with text and value properties.
     * @private
     */
    _buildMenu(info) {
        return info.map((entry, index) => {
            const obj = {};
            obj.text = entry.name;
            obj.value = String(index + 1);
            return obj;
        });
    }

    get NUMERIC_MENU_INFO() {
        return [
            {
                name: formatMessage({
                    id: 'turing.randomVarsMenu.timeTaken',
                    default: 'TIME TAKEN',
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
                    id: 'turing.randomVarsMenu.number',
                    default: 'COLOR',
                    description: 'color'
                }),
            },
        ]
    }

    get DISTRIBUTION_INFO() {
        return [
            {
                name: formatMessage({
                    id: 'turing.distInfo.gaussian',
                    default: 'GAUSSIAN',
                    description: 'Gaussian distribution.'
                }),
            },
            {
                name: formatMessage({
                    id: 'turing.distInfo.hue',
                    default: 'HUE',
                    description: 'hue'
                }),
            },
            {
                name: formatMessage({
                    id: 'turing.distInfo.rhythm',
                    default: 'RHYTHM',
                    description: 'rhythm'
                }),
            }
        ]
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo() {
        return {
            id: 'turing',
            name: 'Turing',

            blocks: [
                // {
                //     opcode: 'greet',
                //     blockType: BlockType.REPORTER,
                //     text: formatMessage({
                //         id: 'turing.greet',
                //         default: 'greet',
                //         description: 'turing.greet'
                //     })
                // },
                {
                    opcode: 'viewModel',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'turing.viewModel',
                        default: 'model',
                        description: 'turing.viewModel'
                    })
                },
                {
                    opcode: 'defineModel',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'turing.defineCustomRandomVariable',
                        default: 'model [MODEL] as [DISTRIBUTION]',
                        description: 'turing.defineCustomRandomVariable'
                    }),
                    arguments: {
                        MODEL: {
                            type: ArgumentType.STRING,
                            defaultValue: "height",
                        },
                        RANDOM_VAR: {
                            type: ArgumentType.STRING,
                            defaultValue: 1,
                            menu: 'NUMERIC_MENU',
                        },
                        DISTRIBUTION: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1,
                            menu: 'DISTRIBUTION_MENU',
                        }
                    }
                },
                {
                    opcode: 'takeSampleFromUser',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'turing.takeSampleFromUser',
                        default: 'sample [OBSERVATION] for [MODEL]',
                        description: 'turing.takeSampleFromUser'
                    }),
                    arguments: {
                        OBSERVATION: {
                            type: ArgumentType.STRING,
                            defaultValue: " ",
                        },
                        MODEL: {
                            type: ArgumentType.STRING,
                            defaultValue: "height"
                        }
                    }
                },
                {
                    opcode: 'takeSampleFromSprite',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'turing.takeSampleFromSprite',
                        default: 'sample [RANDOM_VAR] for [MODEL]',
                        description: 'turing.takeSampleFromSprite'
                    }),
                    arguments: {
                        RANDOM_VAR: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1,
                            menu: 'NUMERIC_MENU',
                        },
                        MODEL: {
                            type: ArgumentType.STRING,
                            defaultValue: "height"
                        },
                    }
                },
                {
                    opcode: 'deleteModel',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'turing.deleteModel',
                        default: 'delete model [MODEL]',
                        description: 'turing.deleteModel'
                    }),
                    arguments: {
                        MODEL: {
                            type: ArgumentType.STRING,
                            defaultValue: "height"
                        },
                    }
                }
                // {
                //     opcode: 'clearSamples',
                //     blockType: BlockType.COMMAND,
                //     text: formatMessage({
                //         id: 'turing.clearSamples',
                //         default:  'clear samples',
                //         description: 'turing.clearSamples'
                //     })
                // },
            ],
            menus: {
                NUMERIC_MENU: {
                    acceptReporters: true,
                    items: this._buildMenu(this.NUMERIC_MENU_INFO)
                },
                DISTRIBUTION_MENU: {
                    acceptReporters: true,
                    items: this._buildMenu(this.DISTRIBUTION_INFO)
                }
            }
        };
    }

    removeModel(args, util) {
        var modelToRemove = args.MODEL

        if (this.user_models[modelToRemove] == undefined) {
            return "No model called " + modelToRemove
        } else {
            delete this.user_models[modelToRemove];
            return "Model of " + modelToRemove + " deleted"
        }
        // TTODO remove the model in Turing also. 
    }


    buildModelStrings() {
        var modelList = []
        for (const m in this.user_models) {
            var model = this.user_models[m]
            modelList.push(JSON.stringify({
                "Model Name": model.modelName,
                "Observations": model.data,
                "Type": model.modelType,
                "Distribution": model.distribution,
            }, null, 2))
        }
        if (modelList == []) {
            return "No models yet"
        } else {
            return modelList
        }
    }

    viewModel(args, util) {
        return this.buildModelStrings()
    }

    getClearedModel() {
        return {
            params: {},
            data: null,
            mean: null,
            stdv: null,
            defined: false
        }
    }

    getClearedSampleSpecs() {
        return {
            randomVar: [],
            rvIndex: [],
            unit: [],
            mode: []
        }
    }

    updateSampleSpecs(user_model, rv) {
        user_model.dataSpecs.randomVars.push(RANDOM_VAR_NAMES[rv])
        user_model.dataSpecs.rvIndices.push(rv)
        user_model.dataSpecs.units.push(UNITS[rv])
        user_model.dataSpecs.modes.push(MODES[rv])
    }

    defineTargetModel(util, modelName, modelType) {
        // this.state.type = RANDOM_VAR_NAMES[rv]
        console.log("DEFINING TARGET MODEL?")
        console.log(modelName)

        this.user_models[modelName] = {
            models: {
                prior: {
                    params: {},
                    // barValue: null,
                    data: null,
                    mean: null,
                    stdv: null,
                    defined: false,
                    active: false
                },
                ps: {
                    n: 2,
                    active: false,
                    curves: []
                },
                posterior: {
                    params: {},
                    data: null,
                    mean: null,
                    stdv: null,
                    defined: false,
                    active: false
                },
                groundTruth: {
                    params: {},
                    // barValue: null,
                    data: null,
                    mean: null,
                    stdv: null,
                    defined: false,
                    active: false
                },
                custom: {
                    params: {},
                    // barValue: null,
                    data: null,
                    mean: null,
                    stdv: null,
                    defined: false,
                    active: false
                },
            },
            active: true,
            visible: true,
            fetching: false,
            helpfulTooltip: false,
            meanLines: false,
            hasDistData: false,
            modelName: modelName,
            modelType: modelType, // distribution
            distribution: null,
            dataSpecs: {
                randomVars: [],
                rvIndices: [],
                units: [],
                modes: []
            },
            hueData: {
                hue: Array(360).fill(0),
                activeHues: [],
                hueProportions: Array(360).fill(0),
                hueCount: 0,
                hueFamilies: Array(360).fill().map(() => [])
            },
            rhythmData: {
                viewFactor: 0,
                rhythms: [],
                timeStamps: [],
                fills: {},
                rhythmProportions: {},
                rhythmCounts: {},
                rhythmTotal: 0
            },
            data: [],
            labels: [],
            distLines: [],
            timer: new Timer()
        };
    }

    async defineModel(args, util) {
        var modelName = args.MODEL
        var distribution = DISTRIBUTIONS[args.DISTRIBUTION - 1]

        this.lastSampleTime[modelName] = 0
        this.defineTargetModel(util, modelName)
        this._runtime.emit('PROJECT_CHANGED')

        if (this.user_models[modelName] == null || this.user_models[modelName] == undefined) {
            return "No model called " + modelName
        }

        var user_model = this.user_models[modelName]

        if (distribution != null) {
            user_model['distribution'] = distribution
        }

        if (distribution == "gaussian") {
            this._runtime.emit('TURING_SHOW_LOAD')
            user_model.fetching = true
            this.updateVisualisationData(user_model)
            var message = this.buildQuery(modelName, "defineModel", 'POST', "prior", distribution, -1, [], {}).then(response =>
                this.updateFromResponse(user_model, response, 'prior', true)); // unpacks the new data using the turing samples
            user_model.fetching = false
            return message
        } else {
            this.user_models[modelName].timer.timeElapsed()
            this.updateVisualisationData(user_model)
        }
    }

    parseResponse(response) {
        const responseJSON = JSON.parse(JSON.parse(response))
        summary = responseJSON["summary"]
        chain = responseJSON["chain"]
        data = chain["data"]
        if (data == undefined) {
            data = chain["x"]
        }
        return { 'data': data, 'chain': chain, 'summary': summary }
    }

    async takeSampleFromSprite(args, util) {
        var modelName = args.MODEL
        var random_var_idx = args.RANDOM_VAR - 1
        var user_model = this.user_models[modelName]

        console.log("Taking sample from a sprite behaviour: " + this.user_models[modelName].distribution)

        if (user_model == undefined) {
            return "No model called " + modelName
        }

        if (user_model.distribution == "rhythm") {
            return "Use the other block to sample rhythm"
        }

        if (user_model.distribution != "hue") {
            console.log("-> Buffering the time for a numeric sample.")

            const currentTime = Date.now();
            if (currentTime - this.lastSampleTime[modelName] < 400) {
                return;
            }
            this.lastSampleTime[modelName] = currentTime;

            if (random_var_idx == COLOR) {
                return "We can't add a colour to a normal distribution."
            }

            message = this._getThenSendSample(util, user_model, random_var_idx)
            this.updatePosteriorCurves(user_model, false)

        } else {
            sample = this._getThenSendSample(util, user_model, random_var_idx)
        }

        if (user_model.data.length > 0) {
            const observation = user_model.data[user_model.data.length - 1] // gets most recent sample
            const units = user_model.dataSpecs.units; // gets units for samples
            const lastUnit = units[units.length - 1]// gets the last unit    
            return `${observation} ${lastUnit}`

        } else {
            if (random_var_idx == TIME) {
                return "You haven't used this block in a project, so it has started a stopwatch until clicked again..."
            }
        }
    }

    async updatePosteriorCurves(user_model, afterPrior = false) {
        if (user_model.data.length > 0) {

            if (!afterPrior) {
                this._runtime.emit('TURING_SHOW_LOAD')
            }

            console.log("inside updatePosteriorCurves: We have captured data, and will now update our curves.")

            const n = user_model.models['ps'].n
            user_model.models['ps'].curves = [] // empty list to get new set of posteriors
            user_model.models['ps'].active = true

            for (var i = 0; i < n; i++) {
                await this.conditionOnPrior(user_model)
                    .then(response => this.updatePosteriors(user_model, response))
            }

            // NORMAL ONE
            this.conditionOnPrior(user_model)
                .then(response => this.updateFromResponse(user_model, response, 'posterior'))

            this.updateVisualisationData(user_model)
            user_model['hasDistData'] = true
        }
    }

    updatePosteriors(user_model, response) {
        console.log("UPDATING posteriors here...")
        var posteriorDetails = {}
        dict = this.parseResponse(response)
        if (dict['data'] != undefined) {
            posteriorDetails['data'] = dict['data'][0]
        }
        posteriorDetails['params'] = dict['summary']["parameters"]
        posteriorDetails['mean'] = dict['summary']["mean"][dict['summary']["mean"].length - 1] //TTODO this is a bit hardcoded... is data always the last param?
        posteriorDetails['stdv'] = dict['summary']["std"][dict['summary']["mean"].length - 1]

        console.log("type of nposteriors --> " + typeof user_model.models['ps'])
        console.log("-------------> Pushing this data to our distribution:")
        console.log(posteriorDetails)
        user_model.models.ps.curves.push(posteriorDetails)
    }

    _processChainMessage(message) {
        try {
            return JSON.parse(JSON.parse(message)); // parse twice, first to remove escapes and second time to read into a JSON
        } catch (error) {
            console.error("Error parsing JSON:", error);
        }
    }

    updateFromResponse(user_model, response, modelType, init = false) {
        console.log("Server Response:")
        console.log(response)

        dict = this.parseResponse(response)

        if (dict['data'] != undefined) {
            user_model.models[modelType]['data'] = dict['data'][0]
        }

        if (init) {
            user_model.models[modelType]['params'] = dict['summary']["parameters"]
            user_model.models[modelType]['mean'] = 0
            user_model.models[modelType]['stdv'] = 1
        } else {
            user_model.models[modelType]['params'] = dict['summary']["parameters"]
            user_model.models[modelType]['mean'] = dict['summary']["mean"][dict['summary']["mean"].length - 1] //TTODO this is a bit hardcoded... is data always the last param?
            user_model.models[modelType]['stdv'] = dict['summary']["std"][dict['summary']["mean"].length - 1]
        }

        if (modelType != "posterior") {
            user_model.models[modelType]['defined'] = true
            user_model.models[modelType]['active'] = true
        }
        user_model['hasDistData'] = true
        this._runtime.emit('TURING_CLOSE_LOAD')
        user_model.fetching = false
        this.updateVisualisationData(user_model)
    }

    updateVisualisationData(user_model) {
        console.log("Updating this user model's vis data: " + user_model.modelName)
        console.log(user_model)
        const vis = {
            distribution: user_model.distribution,
            modelName: user_model.modelName,
            dataSpecs: user_model.dataSpecs,
            unit: user_model.unit,
            plot: this.getPlotDataFromDist(user_model),
            samples: user_model.data,
            activeModels: this.getActiveDistributions(),
        }
        this.visualisationData[user_model.modelName] = vis
        this._runtime.emit('TURING_DATA', this.visualisationData)
        this._runtime.emit('TURING_DATA_STATE', this.getModelStatuses())
        this._runtime.emit('PROJECT_CHANGED')
    }

    distributionData(user_model) {
        return this.formatChartData(['prior', 'posterior'], [user_model.models.prior.data, user_model.models.posterior.data])
    }

    formatChartData(names, valuesLists) {
        if (names.length !== valuesLists.length) {
            throw new Error("Number of names must match the number of value lists");
        }
        const plotData = []
        for (let i = 0; i < valuesLists[0].length; i++) {
            const dataPoint = {};
            dataPoint['prior'] = valuesLists[0][i];
            plotData.push(dataPoint);
        }
        return data;
    }

    // TTODO expand to allow multiple models per user (sprite targets etc in JSON)
    takeSampleFromUser(args, util) {
        var modelName = args.MODEL
        var user_model = this.user_models[modelName]

        if (user_model == undefined) {
            return "No model called " + modelName
        }

        if (user_model.distribution == "hue") {
            return "You're modelling HUE. Use the other sample block!"

        } else if (user_model.distribution == "rhythm") {
            return this._getRhythmSample(util, user_model, args.OBSERVATION)

        } else {
            if (Number(args.OBSERVATION) === null || Number(args.OBSERVATION) === undefined || isNaN(Number(args.OBSERVATION))) {
                return "Oops, this should be a number.";
            }
        }

        var observation = Number(args.OBSERVATION);

        if (typeof util.target != undefined && typeof user_model != undefined) {
            user_model.data.push(observation);
            this.updateSampleSpecs(user_model, CUSTOM)
            this.updatePosteriorCurves(user_model)

            console.log("AFTER CONDITIONING ON PRIOR 1 time WE HAVE:")
            console.log(user_model.models['ps'])


            const units = user_model.dataSpecs.units;
            const lastUnit = units[units.length - 1]; // Efficiently access the last unit
            return `${observation} ${lastUnit}`
        } else {
            return "I can't do this alone ;) Add me to your code!"
        }
    }

    hueToHex = (hue) => {
        const hsv = { h: hue, s: 100, v: 100 }
        return Color.rgbToHex(Color.hsvToRgb(hsv))
    }

    hexToHue = (hex) => {
        const hsv = Color.rgbToHsv(Color.hexToRgb(hex))
        return hueToHex(hsv.h)
    }

    updateActiveHues(hue, hex, user_model) {
        // Convert hex to HSV (hue, saturation, value) for easier comparison
        const hsv = Color.rgbToHsv(Color.hexToRgb(hex));

        // Check if the hue already exists in activeHues
        const existingHueIndex = user_model.hueData.activeHues.findIndex(
            (activeHue) => activeHue.hue === hue
        );

        if (existingHueIndex === -1) {
            user_model.hueData.activeHues.push({
                hue,
                hex,
                avg_s: hsv.s, // Initial saturation
                avg_v: hsv.v, // Initial value
            });
        } else {
            // Hue found, update average saturation and value
            const existingHue = user_model.hueData.activeHues[existingHueIndex];
            existingHue.avg_s = (existingHue.avg_s + hsv.s) / 2;
            existingHue.avg_v = (existingHue.avg_v + hsv.v) / 2;
            existingHue.hex = hex; // Update hex to the new value (optional)
        }

        user_model.hueData.activeHues.sort((hue1, hue2) => hue1.hue - hue2.hue); // sort the dictionaries in the list by their hue value
    }

    updateHueData(user_model, hue, hex) {
        console.log("\n-------------------------------------------\n updating  hue")
        var hue = Math.floor(hue % 360)

        this.updateActiveHues(hue, hex, user_model)

        user_model.hueData.hue[hue] = user_model.hueData.hue[hue] + 1
        user_model.hueData.hueCount += 1
        user_model.hueData.hueProportions[hue] = user_model.hueData.hue[hue] / user_model.hueData.hueCount // TODO might not be needed

        const hueFamily = user_model.hueData.hueFamilies[hue]
        if (hueFamily.indexOf(hex) === -1) {
            console.log("we found a new hue at this index: " + hex)
            user_model.hueData.hueFamilies[hue].push(hex)
        }
    }

    updateRhythmData(user_model, rhythm, timeStamp) {
        console.log("\n-------------------------------------------\n updating  rhythm")
        user_model.rhythmData.rhythms.push(rhythm)
        user_model.rhythmData.timeStamps.push(timeStamp)
        if (user_model.rhythmData.rhythmCounts[rhythm] == undefined) {
            user_model.rhythmData.rhythmCounts[rhythm] = 1
            user_model.rhythmData.fills[rhythm] = this._getColorFromPalette() // initialise fill colour for this rhythm type
        } else {
            user_model.rhythmData.rhythmCounts[rhythm] = user_model.rhythmData.rhythmCounts[rhythm] + 1
        }
        user_model.rhythmData.rhythmTotal += 1
        user_model.rhythmData.rhythmProportions[rhythm] = user_model.rhythmData.rhythmCounts[rhythm] / user_model.rhythmData.rhythmTotal // TODO might not be needed
    }


    extractSample = (util, user_model, rv, groundTruth) => {
        var sample = this.TARGET_PROPERTIES[rv](util, user_model);

        if ((rv == TIME || rv == RHYTHM) && sample > 1000000 && user_model.data.length < 1) {
            console.log("RETURNING THIS!!")
            this.globalTimer.start()
            user_model.timer.start();
            console.log(sample)
            return sample
        }

        this.updateSampleSpecs(user_model, rv) // update if not a TIME without timer already started.

        if (user_model.dataSpecs.rvIndices[user_model.dataSpecs.rvIndices.length - 1] === TIME) {
            user_model.timer.start(); // Start a new timer only for TIME
        }

        if (rv == COLOR) {
            this.updateHueData(user_model, Color.rgbToHsv(sample).h, Color.rgbToHex(sample))
            sample = Color.rgbToHex(sample)
        }
        user_model.data.push(sample);
        return sample
    };

    _getThenSendSample(util, user_model, rvIndex, groundTruth = false) {
        var observation = this.extractSample(util, user_model, rvIndex, groundTruth)

        console.log("after taking samples: ")
        console.log(user_model.data)
        // TTODO update line list visualisations... Can I get turing to do this for me?
        this.updateVisualisationData(user_model) // keys define the list of data that's changed? 
        return observation
    }

    _getRhythmSample(util, user_model, rhythm) {
        console.log("RHYTHM SAMPLE---------->")
        var timeStamp = this.extractSample(util, user_model, RHYTHM, groundTruth = false) // TTODO remove groundTruth

        console.log(timeStamp)

        if (timeStamp > 1000000 && user_model.data.length < 1) {
            return
        }

        this.updateRhythmData(user_model, rhythm, timeStamp) // TO FIX THIS
        this.updateVisualisationData(user_model, 'posterior') // keys define the list of data that's changed? 
        return rhythm + ": " + timeStamp
    }

    _getDistLinesAndParams(user_model) {
        var distLines = []
        var means = {}
        var stdvs = {}

        for (const model in user_model.models) {
            if (user_model.models[model].active) {
                console.log("getting the dist lines here for: " + model)
                if (model == 'ps') {
                    console.log("Got ps! Data has length :" + (user_model.models.ps.curves).length + " and n = " + user_model.models['ps'].n)
                    console.log("it looks like: ")
                    console.log(user_model.models.ps.curves)
                    console.log("type? " + typeof user_model.models.ps.curves)

                    var i = 0
                    for (const data of user_model.models.ps.curves) {
                        dss = {}
                        dss.id = model + "-" + i
                        dss.mean = data.mean
                        dss.stdv = data.stdv
                        means[dss.id] = data.mean
                        stdvs[dss.id] = data.stdv
                        distLines.push(dss)
                        i = i + 1
                    }
                } else {
                    dss = {}
                    dss.id = model
                    dss.mean = user_model.models[model].mean
                    dss.stdv = user_model.models[model].stdv
                    stdvs[model] = user_model.models[model].stdv
                    means[model] = user_model.models[model].mean
                    distLines.push(dss)
                }
            }
        }
        console.log(distLines)
        console.log("DIST LINES ABOVE: ^^^^")
        return { distLines: distLines, means: means, stdvs: stdvs }
    }

    toggleVisibility(data) {
        console.log(this.user_models[data.modelName].models)
        if (this.user_models[data.modelName].models[data.mode] != undefined) {
            this.user_models[data.modelName].models[data.mode].active = !this.user_models[data.modelName].models[data.mode].active
        }
    }

    _toggleVisibilityByState(modelName, mode, state) {
        this.user_models[modelName].models[mode].active = state
    }

    async _updateParams(data, mode) {
        console.log("RECEIVED SIGNAL TO UPDATE PARAMS from BUTTON PRESS...")
        console.log(data)

        if (mode == "meanLines") {
            this.user_models[data.modelName].meanLines = !this.user_models[data.modelName].meanLines

        } else if (mode == "helpfulTooltip") {
            console.log("----------> toggling the tooltip of our data for " + data.modelName)
            this.user_models[data.modelName].helpfulTooltip = !this.user_models[data.modelName].helpfulTooltip

        } else if (mode == 'groundTruth') {
            if (data.stdv == 0) {
                this._toggleVisibilityByState(data.modelName, mode, false)
                this.user_models[data.modelName].models[mode].active = false
            } else {
                this.user_models[data.modelName].models[mode].active = true
                this._toggleVisibilityByState(data.modelName, mode, true)
                this.user_models[data.modelName].models[mode].mean = data.mean
                this.user_models[data.modelName].models[mode].stdv = data.stdv
            }


        } else if (mode == 'prior') {
            var changed = (this.user_models[data.modelName].models[mode].mean != data.mean) || (this.user_models[data.modelName].models[mode].stdv != data.stdv)
            if (changed) {
                this.user_models[data.modelName].models[mode].mean = data.mean
                this.user_models[data.modelName].models[mode].stdv = data.stdv
                await this._updateTuringPrior(this.user_models[data.modelName]).then(this.updatePosteriorCurves(this.user_models[data.modelName], true))

            } else {
                console.log("{Prior is unchanged}")
            }
        } else if (mode == 'ps') {
            console.log("Updating posterior Ns?")
            this._runtime.emit('TURING_SHOW_LOAD')
            this.user_models[data.modelName].fetching = true
            this._updatePosteriorNs(data.modelName, data.n)

        } else {
            console.log("unknown mode " + mode)
        }
        this.user_models[data.modelName].fetching = false
        this._runtime.emit('TURING_CLOSE_LOAD')
        this.updateVisualisationData(this.user_models[data.modelName])
    }

    async _updateTuringPrior(user_model) {
        params = {
            mean: user_model.models.prior.mean,
            stdv: user_model.models.prior.stdv,
        }

        console.log("trying to update this model..")
        console.log(user_model)

        this._runtime.emit('TURING_SHOW_LOAD')
        user_model.fetching = true
        this.updateVisualisationData(user_model)
        var message = await this.buildQuery(user_model.modelName, "updateModelPrior", 'POST', 'prior', user_model.distribution, -1, [], params)
        return message
    }

    _getDistributionData(distLines, truncate = false) {
        if (user_model.distribution != null) {
            // console.log(this._getDistLinesAndMeans(user_model))
            // distAndMeans = this._getDistLinesAndMeans(user_model)
            var distributionData = Distributions.generateProbabilityData(distLines)
            if (truncate) {
                console.log("should trim off values below zero")
            }
            console.log("GAUSSIANS TO PLOT: ")
            console.log(distributionData)
            return distributionData
        }
    }

    _updatePosteriorNs(modelName, n) {
        this.user_models[modelName].models.ps.n = n
        this.user_models[modelName].fetching = true
        this.updatePosteriorCurves(this.user_models[modelName], false)
    }

    _getSampleSpace(user_model) {
        label = user_model.showRandomVariable // gets first character for the labels
        var sampleSpace = []
        for (let s = 0; s < user_model.data.length; s++) {
            const l = label + ' ' + (s + 1);
            const dataPoint = { name: l, value: s };
            sampleSpace.push(dataPoint)
        }
        return sampleSpace
    }

    async conditionOnPrior(user_model) { // n defines the number of potential posteriors we would like to visualise...
        console.log("conditionOnPrior")
        console.log("obtaining posterior... since there is data!")
        const newData = user_model.data
        user_model.fetching = true
        message = this.buildQuery(user_model.modelName, "condition", 'POST', 'prior', user_model.distribution, 100, newData, {}) // logic to check number args
        user_model.fetching = false
        console.log("Server responded:")
        console.log(message)
        return message
    }

    getActiveDistributions(models) {
        var active = []
        for (const model in models) {
            if (models[model].active) {
                if (model == "ps") {
                    for (var i = 0; i < models[model].n; i++) {
                        active.push(model + "-" + i)
                    }
                } else {
                    active.push(model)
                }
            }
        }
        return active
    }

    getActiveModels() {
        var active = []
        for (const model of this.user_models) {
            console.log("looking for active user models, got: " + model)
            if (this.user_models[model].active) {
                active.push(model)
            }
        }
        return active
    }

    getDefinedDists(models) {
        var defined = []
        for (const model in models) {
            if (models[model].defined) {
                active.push(model)
            }
        }
        return defined
    }

    getModelStatuses() {
        var active = {}
        for (const modelName in this.user_models) {
            if (this.user_models[modelName].active) {
                active[modelName] = true
            } else {
                active[modelName] = false
            }
        }
        return active
    }

    _getSampleSpaceData(user_model) {
        var observations = user_model.data
        var data = []
        for (var i = 0; i < observations.length; i++) {
            var tmp = { x: i, y: observations[i], z: 0 }
            data.push(tmp)
        }
        return data
    }

    _getColorRanges() {
        var hues = {}
        for (var i = 0; i < 360; i++) {
            var hex = this.hueToHex(i)
            var hue_key = String(i)
            hues[hue_key] = hex
        }
        return hues
    }

    _getHexForActiveHue(user_model, activeHue) {
        console.log("finding hex for active hue " + activeHue)
        const foundHue = user_model.hueData.activeHues.find(hueDict => hueDict.hue === activeHue);

        // console.log("Our active hue list is: ")
        // console.log(user_model.hueData.activeHues)

        if (foundHue) {
            return foundHue.hex;
        } else {
            return "#dddddd"; // Or throw an error, provide a default value, etc.
        }
    }

    _getHuePlotData(user_model) {
        var data = []
        for (var i = 0; i < user_model.hueData.hue.length; i++) {
            data.push({ hue: i, value: user_model.hueData.hue[i], stroke: this._getHexForActiveHue(user_model, i) })
        }
        return data
    }

    mapToPieChartData(user_model) {
        // Define color ranges for each category
        // const colorRanges = {
        //     'yellow': [45, 75],
        //     "yellow-orange": [75, 90],
        //     "yellow-green": [90, 120],
        //     'green': [120, 180],
        //     "blue-green": [180, 210],
        //     'blue': [210, 270],
        //     "blue-violet": [270, 300],
        //     'violet': [300, 330],
        //     "red-violet": [330, 345],
        //     'red': [345, 15],
        //     "red-orange": [15, 45],
        // };

        // const fills = {
        //     "yellow": "#fff200",
        //     "yellow-orange": "#ffc400",
        //     "yellow-green": "#b1ff00",
        //     "green": "#00ff7a",
        //     "blue-green": "#00ffeb",
        //     "blue": "#0081ff",
        //     "blue-violet": "#0007ff",
        //     "violet": "#9000ff",
        //     "red-violet": "#ff00f7",
        //     "red": "#ff0007",
        //     "red-orange": "#ff5000",
        //     "orange": "#ff9400",
        // };

        // Initialize pie chart data
        const pieChartData = [];
        //  const colorRanges = this._getColorRanges();
        console.log("WE want these samples...")
        console.log(user_model.data)

        // Loop through color ranges
        for (const item of user_model.hueData.activeHues) {
            console.log("looping through active hues (in order hopefully!")
            console.log(item.hue)
            const freq = user_model.hueData.hue[item.hue];
            pieChartData.push({ name: String(item.hue), value: freq, fill: item.hex, h: item.hue, avg_s: item.avg_s, avg_v: item.avg_v });
        }
        return pieChartData;
    }

    hueToHex(hue) {
        const hsv = { h: hue, s: 100, v: 100 }
        return Color.rgbToHex(Color.hsvToRgb(hsv))
    }

    // mapToPieChartData(user_model) {
    //     // Initialize pie chart data
    //     const pieChartData = [];

    //     // Loop through color ranges
    //     console.log("HUES?? !!!!!!!!!!!!!!!!!")
    //     console.log(user_model.hueData.hue)

    //     for (var i; i < user_model.hueData.hue.length; i++) {
    //         var freq = user_model.hueData.hue[i]
    //         var color = this.hueToHex(i)
    //         pieChartData.push({ name: i, freq: freq, fill: color});
    //     }

    //     console.log("Format of PIE CHART DATA!!!")
    //     console.log(pieChartData)
    //     return pieChartData;
    // }

    _updateViewFactor(data) {
        var user_model = this.user_models[data.modelName]
        user_model.rhythmData.viewFactor = data.viewFactor < user_model.rhythmData.rhythms.length ? (data.viewFactor) : (user_model.rhythmData.rhythms.length - 1)
        this.updateVisualisationData(user_model)
    }

    _getRhythmTimelineData(user_model) {
        var data = []
        var startIndex = user_model.rhythmData.viewFactor
        for (var i = startIndex; i < user_model.rhythmData.rhythms.length; i++) {
            data.push({ x: user_model.rhythmData.timeStamps[i], y: 1, z: 1, fill: user_model.rhythmData.fills[user_model.rhythmData.rhythms[i]], index: 1 }) // TODO get appropriate colour for the particular type of data
        }
        console.log("Prepared this rhythm timeline data to plot...")
        console.log(data)
        return data
    }


    _getRhythmBars(user_model) {
        var data = []
        for (const rhythm of Object.keys(user_model.rhythmData.rhythmCounts)) {
            data.push({ name: rhythm, value: user_model.rhythmData.rhythms[rhythm], fill: user_model.rhythmData.fills[rhythm] })
        }
        console.log("Prepared this rhythm timeline data to plot...")
        console.log(data)
        return data
    }

    _getRhythmProportionData(user_model) {
        console.log("@@@@@@@@@@@ when getting rhythm props we have:")
        console.log(user_model.rhythmData)

        console.log("rhythm counts")
        console.log(Object.keys(user_model.rhythmData.rhythmCounts))
        var data = []
        for (const rhythm of Object.keys(user_model.rhythmData.rhythmCounts)) {
            data.push({ name: rhythm, value: user_model.rhythmData.rhythmProportions[rhythm], fill: user_model.rhythmData.fills[rhythm] })
        }
        console.log("RHYTHM PIE DATA? ")
        console.log(data)
        return data
    }

    _getHueProportionData(user_model) {
        var data = []
        for (var i = 0; i < user_model.hueData.hue.length; i++) {
            data.push({ hue: i, value: user_model.hueData.hueProportions[i] })
        }
        return data
    }

    _getVisibleModels(user_model) {
        var visible = []
        for (const model in user_model) {
            if (models[model].visible) {
                if (model == "ps") {
                    for (var i = 0; i < models[model].n; i++) {
                        visible.push(model + "-" + i)
                    }
                } else {
                    visible.push(model)
                }
            }
        }
    }

    getPlotDataFromDist(user_model) {
        if (user_model.distribution == "gaussian") {
            console.log(this._getDistLinesAndParams(user_model))
            var distAndParams = this._getDistLinesAndParams(user_model)

            return {
                styles: {
                    'prior': { stroke: "#FFAB1A", dots: false, strokeWidth: "3px", chartName: "Original Belief" },
                    'posterior': { stroke: "#00B295", dots: false, strokeWidth: "2px", chartName: "Updated Belief", strokeDasharray: "5 5" },
                    'groundTruth': { stroke: "#45BDE5", dots: false, strokeWidth: "3px", chartName: "Ground Truth" },
                    'ps-options': { stroke: "#00B295", dots: false, strokeWidth: "1px", chartName: "", strokeDasharray: "5 5" },
                },
                fetching: user_model.fetching,
                helpfulTooltip: user_model.helpfulTooltip,
                meanLines: user_model.meanLines,
                nPosteriors: user_model.models.ps.n,
                visible: this._getVisibleModels(),
                gaussian: Distributions.generateProbabilityData(distAndParams.distLines),
                means: distAndParams.means,
                stdvs: distAndParams.stdvs,
                sampleSpace: this._getSampleSpaceData(user_model),
                distLines: user_model.distLines,
                activeDistributions: this.getActiveDistributions(user_model.models),
            }
        } else if (user_model.distribution == "hue") {
            return {
                histogram: this._getHuePlotData(user_model),
                pie: this.mapToPieChartData(user_model),
                helpfulTooltip: user_model.helpfulTooltip,
                hues: user_model.hueData,
            }
        } else if (user_model.distribution == "rhythm") {
            return {
                timeline: this._getRhythmTimelineData(user_model),
                pie: this._getRhythmProportionData(user_model),
                rdata: user_model.rhythmData,
                histogram: this._getRhythmBars(user_model),
            }
        }
    }

    /* Prepare a JSON of relevant data */

    async buildQuery(modelName, url_path, method, modelType, distribution, n, data = [], params = {}) {
        const url = this.api_host + "/api/turing/v1/" + url_path;

        const dict = {
            "username": this.username,
            "target": modelName,
            "model_type": modelType,
            "distribution": distribution,
            "n": n,
            "data": data,
            "model_params": params
        }
        const payload = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dict)
        };
        const message = await this._sendRequesttoServer(url, payload);
        return message;
    }

    async greet() {
        const url = this.api_host + "/api/turing/v1/greet";
        const payload = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const message = await this._sendRequesttoServer(url, payload);
        return message;
    }

    async turing_createUser() {
        const url = this.api_host + "/api/turing/v1/createUser";
        const dict = {
            "username": this.username
        }
        const payload = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dict)
        };
        const message = await this._sendRequesttoServer(url, payload);
        return message;
    }

    async turing_deleteUser() {
        const url = this.api_host + "/api/turing/v1/deleteUser";
        const dict = {
            "username": this.username
        }
        const payload = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dict)
        };
        const message = await this._sendRequesttoServer(url, payload);
        return message;
    }

    async turing_deleteModel(modelName) {
        const url = this.api_host + "/api/turing/v1/deleteModel";
        const dict = {
            "username": this.username,
            "target": modelName
        }
        const payload = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dict)
        };
        const message = await this._sendRequesttoServer(url, payload);
        return message;
    }

    showRandomVariable() {
        return RANDOM_VAR_NAMES[this.state.random_var]
    }

    clearSamples(args, util) {
        this._onClearSamples(model)
        return "Samples cleared :)"
    }

    _onClearSamples(modelName) {
        console.log("RECEIVED INSTRUCTION TO CLEAR SAMPLES!")
        console.log(modelName)

        var user_model = this.user_models[modelName]

        // clear samples from the list
        user_model.data = []

        // remove posterior curves
        user_model.models.ps.active = false
        user_model.models.ps.curves = []

        // update visualisation data
        this.updateVisualisationData(user_model)
    }

    deleteModel(args, util) {
        const model = args.MODEL
        if (this.user_models.hasOwnProperty(model)) {
            this._onDeleteModel(model);
            return "Success!"
        } else {
            return "No model called " + model
        }
    }

    _onDeleteModel(modelName) {
        // delete model from user_models dict
        this.user_models[modelName].visible = false 
        this.user_models[modelName].active = false // remove from view

        // this._runtime.emit('TURING_DATA_STATE', this.getModelStatuses())
        this._runtime.emit('PROJECT_CHANGED')

        delete this.user_models[modelName] // delete model

        console.log("after the deletion, user models is: ")
        console.log(this.user_models)

        if (this.user_models.length > 0) {
            const [firstModelName, firstModel] = Object.entries(this.user_models)[0];
            this.updateVisualisationData(firstModel)
        }

        this._runtime.emit('TURING_DATA', this.visualisationData)
        this._runtime.emit('TURING_DATA_STATE', this.getModelStatuses())
        this.turing_deleteModel(modelName)
    }
    /**
     * Send a request to the Turing API of a particular type
     * @param {string} url - API destination
     * @param {object} payload - body of information to be sent
     * @returns response code from the server
     */
    async _sendRequesttoServer(url, payload) {
        try {
            const response = await fetch(url, payload);
            const copy = response.clone();
            const text = await response.text();
            if (text) {
                return await this._fixJson(text); // Assuming _fixJson returns the fixed message
            } else {
                return await copy.json();
            }
        } catch (err) {
            if (err instanceof SyntaxError) {
                // Handle syntax errors
                const data = await copy.json();
                return this._fixJson(data);
            } else {
                throw err;
            }
        }
    }

    _fixJson(text) {
        return text
    }

    _onResetTimer() {
        this.globalTimer.start()
        this.globalTimer.timeElapsed()

        for (const modelName in this.user_models) {
            this.user_models[modelName].timer.start()
        }
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

    _generateRandomHexCode() {
        const randomColor = Math.floor(Math.random() * 16777215);
        const hexCode = randomColor.toString(16).padStart(6, '0');
        return `#${hexCode}`;
    }
}
module.exports = Scratch3Turing;
