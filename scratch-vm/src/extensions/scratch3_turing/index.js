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

const PRIOR_INDEX = 0
const GROUND_TRUTH_INDEX = 1
const POSTERIOR_INDEX = 2

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

        this.api_host = "http://127.0.0.1:8080"

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

        // Set up signal receipt from the GUI
        this._onClearSamples = this._onClearSamples.bind(this);
        this._runtime.on('CLEAR_SAMPLES', targetName => this._onClearSamples(targetName));

        this._onResetTimer = this._onResetTimer.bind(this);
        this._runtime.on('PROJECT_START', this._onResetTimer);

        this._updateParams = this._updateParams.bind(this);
        this._runtime.on('UPDATE_CUSTOM_PARAMS', data => this._updateParams(data, 'custom'));

        this._updateParams = this._updateParams.bind(this);
        this._runtime.on('UPDATE_PRIOR_PARAMS', data => this._updateParams(data, 'prior'));

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
      //  console.log("initialising Turing API")
        const userName = this._generateRandomUserName(16);
        console.log(userName); // Output: a random string of length 16

        // if (sessionStorage.getItem("username")) {
        //     // delete this data from the API
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

    get RHYTHM_INFO() {
        return [
            {
                name: formatMessage({
                    id: 'turing.rhythmInfo.gun',
                    default: 'Gun',
                    description: 'Rhythm Info.'
                }),
            },
            {
                name: formatMessage({
                    id: 'turing.rhythmInfo.go',
                    default: 'go',
                    description: 'Rhythm Info.'
                }),
            },
            {
                name: formatMessage({
                    id: 'turing.rhythmInfo.pa',
                    default: 'pa',
                    description: 'Rhythm Info.'
                }),
            },
            {
                name: formatMessage({
                    id: 'turing.rhythmInfo.dun',
                    default: 'Dun',
                    description: 'Rhythm Info.'
                }),
            },
            {
                name: formatMessage({
                    id: 'turing.rhythmInfo.do',
                    default: 'do',
                    description: 'Rhythm Info.'
                }),
            },
            {
                name: formatMessage({
                    id: 'turing.rhythmInfo.ta',
                    default: 'ta',
                    description: 'Rhythm Info.'
                }),
            },

        ]
    }

    getModelNameInfo() {
        var model_list = []

        if (this.user_models.length < 1) {
            return [
                {
                    name: formatMessage({
                        id: 'turing.modelList.none',
                        default: 'no models defined',
                        description: 'No models defined'
                    }),
                },
            ]
        }

        // build up dynamic menu
        for (const modelName in this.user_models) {
            item = {
                name: formatMessage({
                    id: 'turing.modelList.' + modelName,
                    default: modelName,
                    description: modelName + ' model.'
                }),
            }
            model_list.push(item)
        }
        return model_list
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo() {
        return {
            id: 'turing',
            name: 'Turing',

            blocks: [
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
                    opcode: 'removeModel',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'turing.removeModel',
                        default: 'delete model [MODEL]',
                        description: 'turing.removeModel'
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
                },
                RHYTHM_MENU: {
                    acceptReporters: true,
                    items: this._buildMenu(this.RHYTHM_INFO)
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
            console.log("DEFINED MODEL: ")
            console.log(model)
            modelList.push(JSON.stringify({
                "Model Name": model.modelName,
                "Observations": model.data,
                "Type": model.modelType,
                "Prior": model.models.prior,
                "Posterior": model.models.posterior
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
            // barValue: null,
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
                posterior: {
                    params: {},
                    // barValue: null,
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
            targetSprite: util.target.getName(),
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
                hueProportions: Array(360).fill(0),
                hueCount: 0
            },
            rhythmData: {
                rhythms: [],
                timeStamps: [],
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

        // var random_var_idx = args.RANDOM_VAR - 1
        var modelName = args.MODEL

        this.lastSampleTime[modelName] = 0

        this.defineTargetModel(util, modelName)
        this._runtime.emit('PROJECT_CHANGED')

        var dist = DISTRIBUTIONS[args.DISTRIBUTION - 1]
        if (this.user_models[modelName] == null) {
            return "No model found."
        }

        this._runtime.emit('TURING_SHOW_LOAD')

        if (dist == 'hue') {
            console.log("defined a hue model...")
            var message = this.buildQuery(modelName, "defineModel", 'POST', "prior", dist, -1, [], {}).then(response =>
                this.updateInternals(this.user_models[modelName], response, 'prior', true, distribution = dist)); // unpacks the new data using the turing samples

        } else if (dist == 'rhythm') {
            var message = this.buildQuery(modelName, "defineModel", 'POST', "prior", dist, -1, [], {}).then(response =>
                this.updateInternals(this.user_models[modelName], response, 'prior', true, distribution = dist)); // unpacks the new data using the turing samples
        } else {
            var message = this.buildQuery(modelName, "defineModel", 'POST', "prior", dist, -1, [], {}).then(response =>
                this.updateInternals(this.user_models[modelName], response, 'prior', true, distribution = dist)); // unpacks the new data using the turing samples
            return message
        }
    }

    parseResponse(response) {
        const responseJSON = JSON.parse(JSON.parse(response))
        //  console.log(typeof responseJSON)

        // console.log(responseJSON["chain"])

        // console.log("Showing response data...")

        //  console.log("summary ->")
        summary = responseJSON["summary"]
        //  console.log(responseJSON["summary"])

        //  console.log("chain ->")
        chain = responseJSON["chain"]
        //console.log(responseJSON["chain"])

        //   console.log("data ->")
        data = chain["data"]

        if (data == undefined) {
            data = chain["x"]
        }

        //  console.log(data)
        return { 'data': data, 'chain': chain, 'summary': summary }
    }

    async takeSampleFromSprite(args, util) {
        var modelName = args.MODEL

        if (this.user_models[modelName] == undefined) {
            return "No model called " + modelName
        }

        var random_var_idx = args.RANDOM_VAR - 1

        if (this.user_models[modelName].distribution == "rhythm") {
            return "Use the other block to sample rhythm"

        } else if (this.user_models[modelName].distribution == "hue") {
            console.log("taking sample for hue")

        } else {
            console.log("Taking a numeric sample, so we introduce a time buffer.")
            const currentTime = Date.now();

            if (currentTime - this.lastSampleTime[modelName] < 400) {
                return;
            }
            this.lastSampleTime[modelName] = currentTime;
        }

        var user_model = this.user_models[modelName]

        if (user_model == undefined) {
            return "No model defined!"
        }

        message = this._getThenSendSample(util, user_model, random_var_idx)
        this.conditionOnPrior(user_model)
            .then(response => this.updateInternals(user_model, response, 'posterior'));

        // Handle the case where this is the first sample we take - may not work with green flat...
        // console.log("after taking samples:")
        // console.log(this.user_models[modelName].data)

        if (this.user_models[modelName].data.length > 0) {
            const observation = this.user_models[modelName].data[this.user_models[modelName].data.length - 1] // gets most recent sample
            const units = this.user_models[modelName].dataSpecs.units; // gets units for samples
            const lastUnit = units[units.length - 1]// gets the last unit    
            return `${observation} ${lastUnit}`
        } else {
            if (random_var_idx == TIME) {
                return "You haven't used this block in a project, so it has started a stopwatch until clicked again..."
            }
        }
    }

    _processChainMessage(message) {
        try {
            return JSON.parse(JSON.parse(message)); // parse twice, first to remove escapes and second time to read into a JSON
        } catch (error) {
            console.error("Error parsing JSON:", error);
        }
    }

    updateInternals(user_model, response, modelType, firstModelInit = false, distribution = null,) {

        dict = this.parseResponse(response)
        console.log("AFTER STUFF, UPDATING " + modelType + " INTERNALS WITH!")

        if (distribution != null) {
            user_model['distribution'] = distribution
        }

        console.log(dict)

        console.log("first time init? " + firstModelInit)

        if (dict['data'] != undefined) {
            user_model.models[modelType]['data'] = dict['data'][0]
        }

        if (firstModelInit) { // the parameters will change. 
            user_model.models[modelType]['params'] = dict['summary']["parameters"]
            user_model.models[modelType]['mean'] = 0
            user_model.models[modelType]['stdv'] = 1
        } else {
            user_model.models[modelType]['params'] = dict['summary']["parameters"]
            user_model.models[modelType]['mean'] = dict['summary']["mean"][dict['summary']["mean"].length - 1] //TTODO this is a bit hardcoded... is data always the last param?
            user_model.models[modelType]['stdv'] = dict['summary']["std"][dict['summary']["mean"].length - 1]
        }
        user_model.models[modelType]['defined'] = true
        user_model.models[modelType]['active'] = true

        // this.updateSampleSpecs(user_model, rv)
        user_model['hasDistData'] = true

        this.updateVisualisationData(user_model, modelType) // how we get our distributiond data will change...
        console.log("updated internals, emitting...")
        console.log(this.visualisationData)

        this._runtime.emit('TURING_DATA', this.visualisationData) // ODO get this data as probabilities and represent in the GUI
        this._runtime.emit('TURING_DATA_STATE', this.getTargetsWithDistsAsDict())
        this._runtime.emit('PROJECT_CHANGED')

        // Emit only once the project has finished loading
        this._runtime.emit('TURING_CLOSE_LOAD')
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
        if (this.user_models[modelName] == undefined) {
            return "No model called " + modelName
        }

        if (this.user_models[modelName].distribution == "hue") {
            return "You're modelling HUE. Use the other sample block!"

        } else if (this.user_models[modelName].distribution == "rhythm") {
            // TODO return the rhythm you want to sample at the point in time 
            // Get the 1) time elapsed since start of the project; this helps us to place the rhythm on a timeline. 
            // Get the name of the rhythm and proportion of rhythm categories to each other, potentially make a dictionary like in the case of hue??

            message = this._getRhythmSample(util, this.user_models[modelName], args.OBSERVATION)

            this.conditionOnPrior(this.user_models[modelName])
                .then(response => this.updateInternals(this.user_models[modelName], response, 'posterior'));

            return args.OBSERVATION

        } else {
            if (Number(args.OBSERVATION) === null || Number(args.OBSERVATION) === undefined || isNaN(Number(args.OBSERVATION))) {
                return "Oops, this should be a number.";
            }
        }

        var observation = Number(args.OBSERVATION);

        if (typeof util.target != undefined && typeof this.user_models[modelName] != undefined) {
            user_model = this.user_models[modelName]
            this.user_models[modelName].data.push(observation);
            this.updateSampleSpecs(user_model, CUSTOM)

            this.conditionOnPrior(user_model)
                .then(response => this.updateInternals(user_model, response, 'posterior'));

            const units = this.user_models[modelName].dataSpecs.units;
            const lastUnit = units[units.length - 1]; // Efficiently access the last unit
            return `${observation} ${lastUnit}`
        } else {
            return "I can't do this alone ;) Add me to your code!"
        }
    }

    updateHueData(user_model, hue) {
        console.log("\n-------------------------------------------\n updating with hue")
        var hue = Math.floor(hue % 360)
        user_model.hueData.hue[hue] = user_model.hueData.hue[hue] + 1
        user_model.hueData.hueCount += 1
        user_model.hueData.hueProportions[hue] = user_model.hueData.hue[hue] / user_model.hueData.hueCount // TODO might not be needed
    }

    updateRhythmData(user_model, rhythm, timeStamp) {
        console.log("\n-------------------------------------------\n updating with hue")
        user_model.rhythmData.rhythms.push(rhythm)
        user_model.rhythmData.timeStamps.push(timeStamp)
        user_model.rhythmData.rhythmCounts[rhythm] = user_model.rhythmData.rhythmCounts[rhythm] + 1
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
            this.updateHueData(user_model, Color.rgbToHsv(sample).h)
            sample = Color.rgbToHex(sample)
        }

        if (!groundTruth) {
            user_model.data.push(sample);

        } else {
            user_model.labels.push(sample);
        }
        return sample
    };

    _getThenSendSample(util, user_model, rvIndex, groundTruth = false) {
        console.log("---------->")
        var observation = this.extractSample(util, user_model, rvIndex, groundTruth)

        console.log("after taking samples: ")
        console.log(user_model.data)
        // TTODO update line list visualisations... Can I get turing to do this for me?
        this.updateVisualisationData(user_model, 'posterior') // keys define the list of data that's changed? 
        this._runtime.emit('TURING_DATA', this.visualisationData)
        this._runtime.emit('TURING_DATA_STATE', this.getTargetsWithDistsAsDict())
        return observation
    }

    _getRhythmSample(util, user_model, rhythm) {
        console.log("RHYTHM SAMPLE---------->")
        var timeStamp = this.extractSample(util, user_model, RHYTHM, groundTruth= false) // TTODO remove groundTruth

        console.log(timeStamp)

        if (timeStamp > 1000000 && user_model.data.length < 1) {
            return 
        }

        this.updateRhythmData(user_model, rhythm, timeStamp) // TO FIX THIS

        console.log("after taking samples: ")
        console.log(user_model.data)

        // TTODO update line list visualisations... Can I get turing to do this for me?
        this.updateVisualisationData(user_model, 'posterior') // keys define the list of data that's changed? 
        this._runtime.emit('TURING_DATA', this.visualisationData)
        this._runtime.emit('TURING_DATA_STATE', this.getTargetsWithDistsAsDict())
        return rhythm + ": " + timeStamp
    }

    _getDistLines(user_model) {
        distLines = []
        for (const model in user_model.models) {
            if (user_model.models[model].active) {
                console.log("getting the dist lines here for: " + model)
                console.log(user_model.modelName)
                console.log(user_model.models[model])
                dss = {}
                dss.id = model
                dss.mean = user_model.models[model].mean
                dss.stdv = user_model.models[model].stdv
                distLines.push(dss)
            }
        }
        return distLines
    }

    toggleVisibility(data) {
        console.log("RECEIVED SIGNAL TO TOGGLE VIS OF " + data.modelName + ", " + data.mode)

        console.log("State of our models?")
        console.log(this.user_models[data.modelName].models)

        if (this.user_models[data.modelName].models[data.mode] != undefined) {
            console.log("TOGGLING " + data.modelName + " data.mode? " + data.mode)
            this.user_models[data.modelName].models[data.mode].active = !this.user_models[data.modelName].models[data.mode].active
        }
    }

    _toggleVisibilityByState(modelName, mode, state) {
        this.user_models[modelName].models[mode].active = state
    }

    _updateParams(data, mode) {
        console.log("RECEIVED SIGNAL TO UPDATE PARAMS from BUTTON PRESS...")
        console.log(data)

        if (mode == 'custom') {
            this._toggleVisibilityByState(data.modelName, mode, true)
            this.user_models[data.modelName].models[mode].mean = data.mean
            this.user_models[data.modelName].models[mode].stdv = data.stdv

            this.updateVisualisationData(this.user_models[data.modelName])

            this._runtime.emit('TURING_DATA', this.visualisationData) // ODO get this data as probabilities and represent in the GUI
            this._runtime.emit('TURING_DATA_STATE', this.getTargetsWithDistsAsDict())


        } else if (mode == 'prior') {
            var changed = (this.user_models[data.modelName].models[mode].mean != data.mean) || (this.user_models[data.modelName].models[mode].stdv != data.stdv)

            if (changed) {
                this.user_models[data.modelName].models[mode].mean = data.mean
                this.user_models[data.modelName].models[mode].stdv = data.stdv
                this._resetPriorAndObservations(this.user_models[data.modelName], data.mean, data.stdv)

            } else {
                console.log("{Prior is unchanged}")
            }

            this.updateVisualisationData(this.user_models[data.modelName])
            this._runtime.emit('TURING_DATA', this.visualisationData) // ODO get this data as probabilities and represent in the GUI
            this._runtime.emit('TURING_DATA_STATE', this.getTargetsWithDistsAsDict())
        } else {
            console.log("unknown mode " + mode)
        }
    }

    async _updateModel(user_model) {
        params = {
            mean: user_model.models.prior.mean,
            stdv: user_model.models.prior.stdv,
        }

        console.log("trying to update this model..")
        console.log(user_model)

        var message = await this.buildQuery(user_model.modelName, "updateModelPrior", 'POST', modelType = 'prior', user_model.distribution, -1, [], params)
        console.log("got this from server: " + JSON.parse(message))
        return message
    }

    async _resetPriorAndObservations(user_model, mean, stdv, buildModel = true) {
        console.log("will reset prior etc here to " + mean + ", " + stdv)

        // TODO initialise a new model in turing and update posterior if there is data already
        if (buildModel) {
            this._runtime.emit('TURING_SHOW_LOAD')

            if (user_model.data.length > 0) {
                await this._updateModel(user_model).then(() => this.conditionOnPrior(user_model)
                    .then(response => this.updateInternals(user_model, response, 'posterior')))
            } else {

                await this._updateModel(user_model).then(response => this.updateInternals(user_model, response, 'posterior'))
            }
        }
    }

    _getDistributionData(user_model) {
        // TODO if statement here so that you can use other things 
        if (user_model.distribution != null) { // TTODO add compatibility for other distributions
            console.log("getting dist data for ....")
            console.log(user_model.distribution)
            console.log("dist lines?")
            console.log(this._getDistLines(user_model))
            return Distributions.generateProbabilityData(this._getDistLines(user_model))
        }
    }

    _getBarChartData(user_model) {
        return [
            { type: "prior", value: user_model.models.prior.defined ? user_model.models.prior.mean : null },
            { type: "posterior", value: user_model.models.posterior.defined ? user_model.models.posterior.mean : null },
            { type: "ground truth", value: user_model.models.groundTruth.defined ? user_model.models.groundTruth.mean : null },
        ];
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
        const newData = user_model['data']
        message = this.buildQuery(user_model.modelName, "condition", 'POST', distribution, newData, 100, {}) // logic to check number args
        console.log("Server responded:")
        console.log(message)
        return message
    }

    getActiveDists(models) {
        var active = []
        for (const model in models) {
            if (models[model].active) {
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

    getTargetsWithDistsAsDict() {
        var active = {}
        for (const modelName in this.user_models) {
            if (this.user_models[modelName].hasDistData) {
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

    _getHuePlotData(user_model) {
        var data = []
        for (var i = 0; i < user_model.hueData.hue.length; i++) {
            data.push({ hue: i, value: user_model.hueData.hue[i], stroke: this.hueToHex(i) })
        }
        console.log("Prepared this hue data to plot...")
        console.log(data)
        return data
    }

    mapToPieChartData(user_model) {
        // Define color ranges for each category
        const colorRanges = {
            'yellow': [45, 75],
            "yellow-orange": [75, 90],
            "yellow-green": [90, 120],
            'green': [120, 180],
            "blue-green": [180, 210],
            'blue': [210, 270],
            "blue-violet": [270, 300],
            'violet': [300, 330],
            "red-violet": [330, 345],
            'red': [345, 15],
            "red-orange": [15, 45],
            'orange': [45, 75],
        };

        const fills = {
            "yellow": "#fff200",
            "yellow-orange": "#ffc400",
            "yellow-green": "#b1ff00",
            "green": "#00ff7a",
            "blue-green": "#00ffeb",
            "blue": "#0081ff",
            "blue-violet": "#0007ff",
            "violet": "#9000ff",
            "red-violet": "#ff00f7",
            "red": "#ff0007",
            "red-orange": "#ff5000",
            "orange": "#ff9400",
        };

        // Initialize pie chart data
        const pieChartData = [];

        // Loop through color ranges
        for (const color of Object.keys(colorRanges)) {
            const range = colorRanges[color];

            // Calculate frequency for the range
            const freq = user_model.hueData.hue.slice(range[0], range[1]).reduce((acc, curr) => acc + curr, 0);

            // Add data to pie chart data list
            pieChartData.push({ name: color, freq: freq, fill: fills[color] });
        }

        console.log("Format of PIE CHART DATA!!!")
        console.log(pieChartData)
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

    _getRhythmTimelineData(user_model) {
        var data = []
        for (var i = 0; i < user_model.rhythmData.rhythms.length; i++) {
            data.push({x: user_model.rhythmData.timeStamps[i], y: 1, z: 1})
        }
        console.log("Prepared this rhythm timeline data to plot...")
        console.log(data)
        return data
    }

    _getHueProportionData(user_model) {
        var data = []
        for (var i = 0; i < user_model.hueData.hue.length; i++) {
            data.push({ hue: i, value: user_model.hueData.hueProportions[i] })
        }
        // console.log("Prepared this hue data to plot...")
        // console.log(data)
        return data
    }

    /* Prepare a JSON of relevant data */
    updateVisualisationData(user_model, type = null) {
        if (type != 'observed') {
            newJSON = {
                distribution: user_model.distribution,
                modelName: user_model.modelName,
                targetSprite: user_model.targetSprite,
                dataSpecs: user_model.dataSpecs,
                hueData: user_model.hueData,
                huePlotData: this._getHuePlotData(user_model),
                huePieData: this.mapToPieChartData(user_model),
                rhythmTimelineData: this._getRhythmTimelineData(user_model),
                activeDists: this.getActiveDists(user_model.models),
                styles: {
                    'prior': { stroke: "#FFAB1A", dots: false, strokeWidth: "4px", chartName: "Original Belief" },
                    'posterior': { stroke: "#45BDE5", dots: false, strokeWidth: "4px", chartName: "Updated Belief" },
                    'custom': { stroke: "#9966FF", dots: false, strokeWidth: "4px", chartName: "Ground Truth" }
                },
                user_model: user_model,
                samples: user_model.data, // updates the samples list
                barData: this._getBarChartData(user_model), // plots bar chart data
                distData: this._getDistributionData(user_model), // plots normal distribution TTODO update this with other distribution types
                sampleSpace: this._getSampleSpaceData(user_model),
                distLines: user_model.distLines
            }
            this.visualisationData[user_model.modelName] = newJSON
        }
    }

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

    /**
     *  TBC
     */
    startStopwatch(args, util) {
        this._onResetTimer()
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
        //console.log("Server responded: ", message);
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
       // console.log("Server responded: ", message);
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
        //console.log("Server responded: ", message);
        return message;
    }

    showMean(args, util) {
        return this.state.observed
    }

    showRandomVariable() {
        return RANDOM_VAR_NAMES[this.state.random_var]
    }

    showLastSample() {
        if (this.observations.length < 1) {
            return "No samples yet..."
        }
        return this.state.observed + ' ' + this.state.unit
    }

    showPrior() {
        if (this.state.prior == 0) {
            return "Not sure yet..."
        }
        return this.state.prior + ' ' + this.state.unit // cast to string
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
        this.state.thing = args.SOMETHING
        this._setRandomVariable(COLOR)
        return this._getAffirmation()
    }

    clearSamples(args, util) {
        this._onClearSamples()
        return "Samples cleared :)"
    }

    clearPriorBelief(args, util) {
        this._onClearPriorSamples()
        return "Prior samples cleared :)"
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

    _createModelinTuring(modelDict) {
      //  console.log("Sending model information to Turing to create it :)")

        // build request to Turing
        const url = this.api_host + "/api/turing/v1/createModel";
        const payload = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(modelDict)
        };
        this._sendRequesttoServer(url, payload)
    }

    _onClearSamples(modelName) {
    //    console.log("clearing samples for " + targetName)
        this.user_models[modelName].data = []
        this.observations = []
        this.user_models[modelName].models.posterior = this.getClearedModel()
        this.user_models[modelName].dataSpecs = getClearedSampleSpecs // clear sample specifications

     //   console.log(":0 :0 after clearing, this is usermodels...")
    //    console.log(this.user_models)
        this.user_models[modelName]

        this.updateVisualisationData(this.user_models[modelName])
        this._runtime.emit('TURING_DATA', this.visualisationData)
    }

    clearGroundTruth(args, util) {
        this._onClearGroundTruth()
    }

    _onClearGroundTruth() {
        this.state.ground_truth_mu = 0

        const updatedLineList = [...this.lineList];

        updatedLineList[GROUND_TRUTH_INDEX] = { ...updatedLineList[GROUND_TRUTH_INDEX], mean: 0, stdv: 0 };

        this.lineList = updatedLineList // update line list

        this.truth_data = []

        this.updateVisualisationData(this.observations, 'observed')
        this._runtime.emit('TURING_DATA', this.visualisationData)
        this._runtime.emit('TURING_DATA_STATE', this.getTargetsWithDistsAsDict())
    }

    _onResetTimer() {
      //  console.log("RECEIVED PROJECT START SYMBOL! time to start timers...")
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
            case 'COLOR':
                return true;
            default:
                return false;
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
}
module.exports = Scratch3Turing;
