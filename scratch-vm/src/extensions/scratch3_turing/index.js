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
const GROUND_TRUTH_INDEX = 1
const POSTERIOR_INDEX = 2

const messagesOfAffirmation = []

const TIME = 0
const SIZE = 1
const X = 2
const Y = 3
const LOUDNESS = 4
const NUMBER = 5
const COLOR = 6
const NONE = 7

const MODES = ['NUMERIC', 'NUMERIC', 'NUMERIC', 'NUMERIC', 'NUMERIC', 'NUMERIC', 'COLOR', 'NONE']
const UNITS = ['s', '', '', '', 'db', '', '', '', '']
const RANDOM_VAR_NAMES = ['TIME TAKEN', 'SIZE', 'X', 'Y', 'LOUDNESS', 'NUMBER', 'COLOR', 'NONE']
const DISTRIBUTIONS = ['gaussian', 'poisson', 'binomial']

window.addEventListener("beforeunload", (event) => {
    // User might be closing the app
    console.log("Session might have ended");
    // Send session end signal or handle cleanup here
  });

  
  
class Scratch3Turing {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this._runtime = runtime;
        this.state = {
            prior_mu: null,
            ground_truth_mu: null,
            posterior_mu: null,
            random_var: NONE,
            unit: NONE,
            mode: NONE,
            thing: ''
        }

        this.api_host = "http://127.0.0.1:8080"

        this._extensionId = 'turing'

        this.TARGET_PROPERTIES = [
            (util) => this._timer.timeElapsed() / 1000, // TIME
            (util) => util.target.size, 
            (util) => util.target.x,
            (util) => util.target.y,
            (util) => 10, // LOUDNESS TODO
            (util) => TuringSensing.fetchColor(util.target),
            (util) => NONE,
        ];

        this.user_models = {} // each target has its own model

        this._runtime.emit('TURING_ACTIVE')
        this._runtime.registerTuringExtension(this._extensionId, this);

        this.username = this._initAPI()

        this.observations = []
        this.truth_data = []
        this.lastSampleTime = 0;
        this._timer = new Timer();
        this._timer.start(); // TODO start this when the program's runtim begins (green flag)
        this.palette_idx = 0;

        sessionStorage.setItem("username", this.username);

        this.visualisationData = {}
       // this._runtime.emit('TURING_DATA', this.visualisationData) Potentially initialise turing data here
        // Build line list
        this.lineList = []

        this._addCurve(0, 1, 'what we expect') // standard normal
        // this._addCurve(0, 0, 'posterior') // standard normal
        this._addCurve(0, 0, 'what we see') // standard normal

        // Set up signal receipt from the GUI
        this._onClearSamples = this._onClearSamples.bind(this);
        this._runtime.on('CLEAR_SAMPLES', this._onClearSamples);
        this._onResetTimer = this._onResetTimer.bind(this);
        this._runtime.on('PROJECT_START', this._onResetTimer);
    }

    // addPosteriorData() {
    //     const updatedLineList = [...this.lineList]; 
    //     updatedLineList[POSTERIOR_INDEX] = { ...updatedLineList[OBSERVED_INDEX], mean: this.state.posterior, stdv: 0};
    //     // updatedLineList[POSTERIOR_INDEX] = { ...updatedLineList[POSTERIOR_INDEX], mean: this.state.posterior, stdv: 0}; // TODO update with genuine Turing values
    //     this.lineList = updatedLineList // update line list
    //     this._addCurve(0, 0, 'posterior') // standard normal
    // }

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
        console.log("initialising Turing API")
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
                    default: 'TIME TAKEN (sec)',
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
            {
                name: formatMessage({
                    id: 'turing.randomVarsMenu.number',
                    default: 'NUMBER',
                    description: 'number'
                }),
            },
        ]
    }

    get DISTRIBUTION_INFO () {
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
                    id: 'turing.distInfo.poisson',
                    default: 'POISSON',
                    description: 'poisson'
                }),
            },
            {
                name: formatMessage({
                    id: 'turing.distInfo.binomial',
                    default: 'BINOMIAL',
                    description: 'binomial'
                }),
            }
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
                // {
                //     opcode: 'showPrior',
                //     blockType: BlockType.REPORTER,
                //     text: formatMessage({
                //         id: 'turing.showPrior',
                //         default:  'our expectation',
                //         description: 'turing.pinLocation'
                //     })
                // },
                // {
                //     opcode: 'greet',
                //     blockType: BlockType.REPORTER,
                //     text: formatMessage({
                //         id: 'turing.greet',
                //         default:  'greet...',
                //         description: 'turing.greet'
                //     })
                // },
                // {
                //     opcode: 'showLastSample',
                //     blockType: BlockType.REPORTER,
                //     text: formatMessage({
                //         id: 'turing.lastSample',
                //         default:  'most recent sample',
                //         description: 'turing.lastSample'
                //     })
                // },
                // {
                //     opcode: 'showMean',
                //     blockType: BlockType.REPORTER,
                //     text: formatMessage({
                //         id: 'turing.showMean',
                //         default:  'average',
                //         description: 'turing.showMean'
                //     })
                // },
                // {
                //     opcode: 'showRandomVariable',
                //     blockType: BlockType.REPORTER,
                //     text: formatMessage({
                //         id: 'turing.showRandomVariable',
                //         default:  'random variable',
                //         description: 'turing.showRandomVariable'
                //     })
                // },
                // {
                //     opcode: 'defineRandomVariableToModel',
                //     blockType: BlockType.COMMAND,
                //     text: formatMessage({
                //         id: 'turing.defineRandomVariableToModel',
                //         default:  'Create a [RANDOM_VAR] model',
                //         description: 'turing.defineRandomVariableToModel'
                //     }),
                //     arguments: {
                //         RANDOM_VAR: {
                //             type: ArgumentType.NUMBER,
                //             defaultValue: 1,
                //             menu: 'NUMERIC_MENU',
                //         }
                //     }
                // },
                {
                    opcode: 'defineModel',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'turing.defineCustomRandomVariable',
                        default:  'model [NAME] as [RANDOM_VAR]',
                        description: 'turing.defineCustomRandomVariable'
                    }),
                    arguments: {
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: "height",
                        },
                        RANDOM_VAR: {
                            type: ArgumentType.STRING,
                            defaultValue: 1,
                            menu: 'NUMERIC_MENU',
                        }
                    }
                },
                {
                    opcode: 'definePrior',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'turing.definePrior',
                        default:  'set expectation as [DISTRIBUTION]',
                        description: 'turing.definePrior'
                    }),
                    arguments: {
                        NAME: {
                            type: ArgumentType.STRING,
                            defaultValue: "height",
                        },
                        DISTRIBUTION: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1,
                            menu: 'DISTRIBUTION_MENU',
                        }
                    }
                },
                {
                    opcode: 'labelGroundTruth',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'turing.labelGroundTruth',
                        default:  'label ground truth',
                        description: 'turing.labelGroundTruth'
                    }),
                },
                // {
                //     opcode: 'setPrior',
                //     blockType: BlockType.COMMAND,
                //     text: formatMessage({
                //         id: 'turing.setPrior',
                //         default:  'I think [RANDOM_VAR] will be [PRIOR]',
                //         description: 'turing.setPrior'
                //     }),
                //     arguments: {
                //         RANDOM_VAR: {
                //             type: ArgumentType.NUMBER,
                //             defaultValue: 1,
                //             menu: 'NUMERIC_MENU',
                //         },
                //         PRIOR: {
                //             type: ArgumentType.NUMBER,
                //             defaultValue: 10
                //         }
                //     }
                // },
                // {
                //     opcode: 'setColourPrior',
                //     blockType: BlockType.COMMAND,
                //     text: formatMessage({
                //         id: 'turing.setColourPrior',
                //         default:  'I think [SOMETHING] is [COLOR]',
                //         description: 'turing.setRandomVariable'
                //     }),
                //     arguments: {
                //         SOMETHING: {
                //             type: ArgumentType.STRING,
                //             defaultValue: 'a field',
                //         },
                //         COLOR: {
                //             type: ArgumentType.COLOR,
                //         }
                //     }
                // },
                {
                    opcode: 'takeSampleFromSprite',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'turing.takeSampleFromSprite',
                        default:  'take sample from sprite',
                        description: 'turing.takeSampleFromSprite'
                    })
                },
                {
                    opcode: 'takeSampleAsNumber',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'turing.takeSampleAsNumber',
                        default:  'take my sample [OBSERVATION]',
                        description: 'turing.takeSampleAsNumber'
                    }),
                    arguments: {
                        OBSERVATION: {
                            type: ArgumentType.NUMBER
                        }
                    }
                },
                {
                    opcode: 'viewModel',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'turing.viewModel',
                        default:  'model',
                        description: 'turing.viewModel' 
                    })
                }
                // {
                //     opcode: 'startStopwatch',
                //     blockType: BlockType.COMMAND,
                //     text: formatMessage({
                //         id: 'turing.startStopwatch',
                //         default:  'start stopwatch',
                //         description: 'turing.startStopwatch'
                //     })
                // },
                // {
                //     opcode: 'labelGroundTruth',
                //     blockType: BlockType.COMMAND,
                //     text: formatMessage({
                //         id: 'turing.labelGroundTruth',
                //         default:  'label [RANDOM_VAR]',
                //         description: 'turing.labelGroundTruth'
                //     }),
                //     arguments: {
                //         RANDOM_VAR: {
                //             type: ArgumentType.NUMBER,
                //             defaultValue: 1,
                //             menu: 'NUMERIC_MENU',
                //         }
                //     }
                // },
                // {
                //     opcode: 'clearSamples',
                //     blockType: BlockType.COMMAND,
                //     text: formatMessage({
                //         id: 'turing.clearSamples',
                //         default:  'clear samples',
                //         description: 'turing.clearSamples'
                //     })
                // },
                // {
                //     opcode: 'clearGroundTruth',
                //     blockType: BlockType.COMMAND,
                //     text: formatMessage({
                //         id: 'turing.clearGroundTruth',
                //         default:  'clear ground truth',
                //         description: 'turing.clearGroundTruth'
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
            }
        };
    }

    // Function to calculate the probability density function (PDF) of a normal distribution
    normalPDF(x, mean, stdDev) {
        const constant = 1 / (stdDev * Math.sqrt(2 * Math.PI));
        const exponent = Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2)));
        return constant * exponent;
    }

    createPoissonCurveData(samples) {
         // Choose the maximum number of events to display (can be adjusted based on data)
        const maxEvents = Math.ceil(Math.max(...samples)) + 2;

        // Generate Poisson probability data
        const poissonData = [];
        for (let i = 0; i <= maxEvents; i++) {
            const probability = Math.exp(-lambda) * Math.pow(lambda, i) / factorial(i);
            poissonData.push({ x: i, y: probability });
        }

        // Function to calculate factorial (used for Poisson probability)
        function factorial(n) {
            return n === 0 ? 1 : n * factorial(n - 1);
        }
        return poissonData
    }

    getDistributionData(user_model) {
        const modelTypes = ["prior", "posterior"]
        var plotData = {}

        for (const modelType of modelTypes) {
            if (user_model[modelType].data != null) {
                plotData[modelType] = user_model[modelType.data]  // just use raw samples for now
                }
            }
        // Choose number of bins for the histogram
        return plotData
    }



    // Function to create histogram data for plotting
    createHistogramData(samples, binCount) {
        console.log("iterating through:")
        console.log(samples)

        const min = Math.min(...samples);
        const max = Math.max(...samples);
        const binWidth = (max - min) / binCount;
        
        const histogram = [];
        for (let i = 0; i < binCount; i++) {
        const binStart = min + i * binWidth;
        const binEnd = binStart + binWidth;
        let count = 0;
        for (const sample of samples) {
            if (sample >= binStart && sample < binEnd) {
            count++;
            }
        }
        histogram.push({ x: binStart + binWidth / 2, count });
        }
        return histogram;
    }

    defineModel(args, util) {
        var random_var_idx = args.RANDOM_VAR - 1
        var modelName = args.NAME
        this.defineTargetModel(util, random_var_idx, modelName)
        return util.target.getName() + " is modelling " + modelName + " as " + RANDOM_VAR_NAMES[random_var_idx]
    }

    viewModel(args, util) {

        if (typeof this.user_models[util.target.getName()] != undefined) {
            var user_model = this.user_models[util.target.getName()]
            return JSON.stringify({"Model Name": user_model.modelName, "Type": user_model.modelType, "Prior": user_model.prior, "Posterior": user_model.posterior}, null, 2)
        } else {
            return "No model found."
        }
    }

    defineTargetModel(util, rv, modelName, modelType) {
        this.state.type = RANDOM_VAR_NAMES[rv]

        console.log("DEFINING TARGET MODEL?")
        console.log(util.target.getName())

        this.user_models[util.target.getName()] = {
                prior: {
                    model: null,
                    params: null,
                    barValue: null,
                    data: null,
                    mean: null,
                    stdv: null,
                    defined: false
                },
                posterior: {
                    model: null,
                    params: null,
                    barValue: null,
                    data: null,
                    mean: null,
                    stdv: null,
                    defined: false
                },
                groundTruth: {
                    model: null,
                    params: null,
                    barValue: null,
                    data: null,
                    mean: null,
                    stdv: null,
                    defined: false
                },
                targetSprite: util.target.getName(),
                modelName: modelName,
                modelType: modelType,
                randomVar: RANDOM_VAR_NAMES[rv], 
                rvIndex: rv, 
                unit: UNITS[rv],  
                mode: MODES[rv],
                data: [],
                labels: [],
                distLines: [],
                timer:  new Timer()
            };
        }

    async definePrior(args, util) {
        var dist = DISTRIBUTIONS[args.DISTRIBUTION - 1]

        if (this.user_models[util.target.getName()] == null) {
            return "No model found."
        }
        // emit loading screen ask

        var message = this.buildQuery(util, "defineModel", 'POST', "prior", distribution = dist).then(response => 
                this.updateInternals(this.user_models[util.target.getName()], response, ["prior"], distribution = dist)); // unpacks the new data using the turing samples
        console.log(this.user_models[util.target.getName()])

        // close loading screen
        return message
        // return util.target.getName() + "'s belief about " + this.user_models[util.target.getName()].modelName + " has a " + dist + " distribution"
    }

    parseResponse(response) {
        const responseJSON = JSON.parse(JSON.parse(response))
        summary = responseJSON["summary"]
        chain = responseJSON["chain"]
        data = chain["data"]
        return {'data': data, 'chain': chain, 'summary': summary}
    }

    async takeSampleFromSprite (args, util) {
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
            user_model = this.user_models[util.target.getName()]
            message = this._getThenSendSample(util, user_model)
            this.conditionOnPrior(util, user_model)
                    .then(response => this.updateInternals(user_model, response, ["posterior"]));            
        } else {
            return "I can't do this alone ;) Add me to your code!"
        }
    }

    _processChainMessage(message) {
        try {        
            return JSON.parse(JSON.parse(message)); // parse twice, first to remove escapes and second time to read into a JSON
        } catch (error) {
            console.error("Error parsing JSON:", error);
        }
    }

    updateInternals(user_model, response, model_type, keys, distribution = null) {
        dict = this.parseResponse(response)

        if (distribution != null) {
            user_model[model_type]['distribution'] = distribution 
        }
        user_model[model_type]['data'] = dict['data']
        user_model[model_type]['params'] = dict['summary']["parameters"]
        user_model[model_type]['mean'] = dict['summary']["mean"]
        user_model[model_type]['stdv'] = dict['summary']["stdv"]
        user_model[model_type]['defined'] = true


        this.addVisualisationData(user_model, data, this.getDummyBar(user_model), this.distributionData(user_model), keys)
        console.log("updated internals, emitting...")
        console.log(this.visualisationData)
        this._runtime.emit('TURING_DATA', this.visualisationData) // ODO get this data as probabilities and represent in the GUI
    }

    distributionData(user_model) {
        return [{type: "prior", value: user_model.prior.data}, {type: "posterior", value: user_model.posterior.data}]
    }

    // TTODO expand to allow multiple models per user (sprite targets etc in JSON)

    takeSampleAsNumber (args, util) {
        if (Number(args.OBSERVATION) === null || Number(args.OBSERVATION) === undefined) {
            return "The observation must be a number";
          }
          
        observation = Number(args.OBSERVATION);

        if (typeof util.target != undefined &&  typeof this.user_models[util.target.getName()] != undefined ) {
            user_model = this.user_models[util.target.getName()]
            this.user_models[util.target.getName()].data.push(observation);
            this.conditionOnPrior(util, user_model) // updates posterior

            this.addVisualisationData(user_model, user_model.data, this.getDummyBar(user_model), this.distributionData(user_model), ["posterior"])
            this._runtime.emit('TURING_DATA', this.visualisationData)
            return util.target.getName() + " took sample " + observation + this.user_models[ util.target.getName()]['unit']
        } else {
            return "I can't do this alone ;) Add me to your code!"
        }
    }

    extractSample = (util, user_model, groundTruth) => {
        var sample = this.TARGET_PROPERTIES[user_model['rvIndex']](util);

        console.log("got sample as " + sample)

        if (user_model.randomVar == COLOR) {
            sample = Color.rgbToHex(sample)
        }

        if (!groundTruth) {
          user_model.data.push(sample);
        } else {
          user_model.labels.push(sample);
        }
        if (user_model.rvIndex === TIME) {
            user_model.timer.start(); // Start a new timer only for TIME
        }
        return sample
      };

    _getThenSendSample(util, user_model, groundTruth = false) {
        console.log("---------->")
        var newSample;
        observation = this.extractSample(util, user_model, groundTruth) 

        // TTODO update line list visualisations... Can I get turing to do this for me?
        this.addVisualisationData(user_model, user_model.data, this.getDummyBar(user_model), this.distributionData(user_model), ["posterior"])
        this._runtime.emit('TURING_DATA', this.visualisationData)
        return  util.target.getName() + " took sample " + observation + this.user_models[ util.target.getName()]['unit']
    }

    _getDistributionData(user_model) {
        // TODO if statement here so that you can use other things 
        return Distributions.generateProbabilityData(user_model.distLines)
    }

    _getBarChartData(user_model) {
        return [
          { type: "what we expected", value: user_model.prior.barValue },
          { type: "updated expectation", value: user_model.posterior.barValue},
          { type: "ground truth", value: user_model.groundTruth.barValue ? user_model.groundTruth.barValue : null },
        ];
      }

    getDummyBar (user_model) {
        return [
                {
                    type: "something", value: 10,
                    type: "else", value: 2
                }
            ]
    }

    async conditionOnPrior(util, user_model) {
        const newData = user_model['data']
        message = this.buildQuery(util, "condition", 'POST', distribution = distribution, data = newData, n = 100) // logic to check number args
        console.log("Server responded:")
        console.log(message)
        return message
    }

    /* Prepare a JSON of relevant data */
    addVisualisationData(user_model, data, barData, distData, keys) {
        newJSON = {
            modelName: user_model.modelName,
            user_model: user_model,
            modelTypeKeys: keys,
            samples: data, // updates the samples list
            barData: barData, // plots bar chart data
            distData: distData, // plots normal distribution TTODO update this with other distribution types
            distLines: user_model.distLines
        }
        this.visualisationData[user_model.targetSprite] = newJSON
    }

    async buildQuery(util, url_path, method, model_type, distribution = '', n='', data = []) {
        const url = this.api_host + "/api/turing/v1/" + url_path;

        const dict = {
            "username": this.username,
            "target": util.target.getName(),
            "model_type": model_type,
            "distribution": distribution,
            "n": n,
            "data": data,
        }
        const payload = {
            method: method, 
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dict)
        };      
        const message = await this._sendRequesttoServer(url, payload);
        console.log("Server responded: ", message);
        return message;
    }


    turing_sample(util, distribution, n) {
        return this.buildQuery(util, "sample", 'POST', distribution, n) // logic to check number args
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
        console.log("Server responded: ", message);
        return message;
      }

          


    // turing_definePrior(util, distribution) {
    //     const mean = 1 // logic here to get appropriate mean
    //     const variance = 2 // logic here to get appropriate variance
    //     message = this.buildQuery(util, "defineModel", 'POST', "prior", mean, variance) // logic to check number args
    //     return message
    // }

    
    turing_defineObserved(args, util) {
        const distribution = args.DIST // convert this
        const mean = 1 // logic here to get appropriate mean
        const variance = 2 // logic here to get appropriate variance
        message = this.buildQuery(util, "defineModel", 'POST', "observed", mean, variance, n = args.N) // logic to check number args
        return message
    }

    turing_definePosterior(args, util) {
        message = this.buildQuery(util, "defineModel", 'POST', "posterior") // logic to check number args
        // TODO define posterior here
        return message
    }

    turing_conditionPriorOnData(args, util) {
        const distribution = args.DIST // convert this
        const data = this.observations
        message = this.buildQuery(util, "condition", 'POST', distribution, data, n = args.N) // logic to check number args
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
        console.log("Server responded: ", message);
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
        console.log("Server responded: ", message);
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
        console.log("Sending model information to Turing to create it :)")

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

    _onClearSamples() {
        this.state.observed = 0
        // this.state.posterior = 0

        const updatedLineList = [...this.lineList]; 

        updatedLineList[OBSERVED_INDEX] = { ...updatedLineList[OBSERVED_INDEX], mean: this.state.observed, stdv: 0};
        // updatedLineList[POSTERIOR_INDEX] = { ...updatedLineList[POSTERIOR_INDEX], mean: this.state.posterior, stdv: 0}; // TODO update with genuine Turing values
        
        this.lineList = updatedLineList // update line list

        this.observations = []

        this.addVisualisationData(this.observations, this._getBarChartData('mean'), this.getDistributionData())
        this._runtime.emit('TURING_DATA', this.visualisationData)
    }

    clearGroundTruth(args, util) {
        this._onClearGroundTruth()
    }

    _onClearGroundTruth() {
        this.state.ground_truth_mu = 0

        const updatedLineList = [...this.lineList]; 

        updatedLineList[GROUND_TRUTH_INDEX] = { ...updatedLineList[GROUND_TRUTH_INDEX], mean: 0, stdv: 0};
        
        this.lineList = updatedLineList // update line list

        this.truth_data = []

        this.addVisualisationData(this.observations, this._getBarChartData('mean'), this.getDistributionData())
        this._runtime.emit('TURING_DATA', this.visualisationData)
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
        this._onClearSamples()

        this.addVisualisationData(this.observations, this._getBarChartData('mean'), this.getDistributionData())

        console.log("emitting ")
        console.log(this.visualisationData)
        this._runtime.emit('TURING_DATA', this.visualisationData)

        return this._getAffirmation()
    }

    // takeSample (args, util) {
    //     console.log("Taking a sample!")
    //     // Slightly buffer requests
    //     const currentTime = Date.now(); 
    //     if (currentTime - this.lastSampleTime < 400) {
    //       return; 
    //     }
    //     this.lastSampleTime = currentTime;

    //     // Check if we can get a sample
    //     console.log(util.target)

    //     if (typeof util.target != undefined) {
    //         this._getThenSendSample(util)
    //     } else {
    //         return "I can't do this alone ;) Add me to your code!"
    //     }
    // }

    _onResetTimer () {
        this._timer.start(); 
    }

    labelGroundTruth (args, util) {
        console.log("Adding a sample to our ground truth!")

        var random_var_idx = args.RANDOM_VAR - 1

        if (this.state.random_var != random_var_idx) {
            this._setRandomVariable(random_var_idx)
        }

        // Slightly buffer requests
        const currentTime = Date.now(); 
        if (currentTime - this.lastSampleTime < 400) {
          return; 
        }
        this.lastSampleTime = currentTime;

        // Check if we can get a sample
        console.log(util.target)

        if (typeof util.target != undefined) {
            this._getThenSendSample(util, groundTruth = true)
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

    _updateGroundTruth() {
        var m, s

        if (this.state.mode === "COLOR") {
          m = 10
          s = 4
        } else {
          [m, s] = this._getMeanAndVariance(this.truth_data); // Numeric random variables here
        }

        // update our observed and posterior distributions
        this.state.prior = m

        const updatedLineList = [...this.lineList]; 

        updatedLineList[GROUND_TRUTH_INDEX] = { ...updatedLineList[GROUND_TRUTH_INDEX], mean: this.state.prior, stdv: s}; // we give the prior the same standard deviation as the observed data - TODO
        
        this.lineList = updatedLineList // update line list
      }
      
    _updateObservedData() {
        var m, s

        if (this.state.mode === "COLOR") {
          m = 10
          s = 4
        } else {
          [m, s] = this._getMeanAndVariance(this.observations); // Numeric random variables here
        }

        console.log("OBSERVED SAMPLES!")
        console.log(this.state.observed)

        // update our observed and posterior distributions
        var randomConstant = Math.random()
        this.state.observed = m
        this.state.posterior = m*randomConstant // TODO fetch this from turing

        const updatedLineList = [...this.lineList]; 

        // updatedLineList[PRIOR_INDEX] = { ...updatedLineList[PRIOR_INDEX], mean: this.state.prior, stdv: s}; // we give the prior the same standard deviation as the observed data - TODO
        console.log("Updating line list with mean " + m + "and stdv " + s)
        Object.assign(updatedLineList[OBSERVED_INDEX], { mean: this.state.observed, stdv: s });

        // updatedLineList[OBSERVED_INDEX] = { ...updatedLineList[OBSERVED_INDEX], mean: this.state.observed, stdv: s};
       // updatedLineList[POSTERIOR_INDEX] = { ...updatedLineList[POSTERIOR_INDEX], mean: this.state.posterior, stdv: s}; // TODO update with genuine Turing values
        
        this.lineList = updatedLineList // update line list
        console.log("UPDATED LINE LIST")
        console.log(this.lineList)
      }

    _updatePrior(new_mean = 0, new_stdv = -1) {
        const updatedLineList = [...this.lineList]; 
        if (new_stdv != -1) {
            updatedLineList[PRIOR_INDEX] = { ...updatedLineList[PRIOR_INDEX], mean: new_mean, stdv: new_stdv};
        } else {
            updatedLineList[PRIOR_INDEX] = { ...updatedLineList[PRIOR_INDEX], mean: new_mean};
        }
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
}
module.exports = Scratch3Turing;

        // if (this.state.random_var == COLOR) {
        //     color = TuringSensing.fetchColor(util.target)
        //     console.log("we extracted this color: ")
        //     console.log(color)
        //     newSample = Color.rgbToHex(color)
        //     if (!buildPrior) {
        //         this.observations.push(newSample)
        //     } else {
        //         this.truth_data.push(newSample)
        //     }
        // } else if (this.state.random_var == TIME) {
        //     newSample = this._timer.timeElapsed() / 1000
        //     if (!buildPrior) {
        //         this.observations.push(newSample)
        //     } else {
        //         this.truth_data.push(newSample)
        //     }
        //     this._timer.start(); // start a new timer

        // } else if (this.state.random_var == SIZE) {

        //     if (!buildPrior) {
        //         this.observations.push(util.target.size)
        //     } else {
        //         this.truth_data.push(util.target.size)
        //     }

        // } else if (this.state.random_var == X) {
            
        //     if (!buildPrior) {
        //         this.observations.push(util.target.x)
        //     } else {
        //         this.truth_data.push(util.target.x)
        //     }
        // } else if (this.state.random_var == Y) {
            
        //     if (!buildPrior) {
        //         this.observations.push(util.target.y)
        //     } else {
        //         this.truth_data.push(util.target.y)
        //     }

        //     this.observations.push(util.target.y)

        // } else if (this.state.random_var == LOUDNESS) {
        //     this.observations.push(10) // TTODO implement this
        // }