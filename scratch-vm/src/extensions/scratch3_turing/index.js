const ArgumentType = require('../../extension-support/argument-type')
const BlockType = require('../../extension-support/block-type')
const TargetType = require('../../extension-support/target-type')
const Cast = require('../../util/cast');
const log = require('../../util/log');
const {fetchWithTimeout} = require('../../util/fetch-with-timeout');
const languageNames = require('scratch-translate-extension-languages');
const formatMessage = require('format-message');

class TuringPPL {

    constructor (runtime) {
        // put any setup for your extension here
        this.runtime = runtime

         /**
         * The samples collected from a call to Turing
         * @type {number}
         * @private
         */
        this._samples = []

        /**
         * Defines the API route and port, as well as API key - TODO
         * @type {string}
         * @private
         */
        this.api_host = "http://127.0.0.1:8080"

        /**
         * An array of models
         * @type {Object}
         * @private
         */
        this._models = {};
        this.N = 10;

        // set default methods
        this.samplingMethod = 1;
        this.modelType = 1;
        this.sampleMax = 100;

        /**
         * An array of model names, where indexes correspond to the model code - 1
         * @type {Array}
         * @private
         */
        this._modelTypefromCode = ['bernoulli', 'binomial', 'gaussian'];
        this._samplingMethodFromCode = ['Monte-Carlo', 'Hamiltonian Monte-Carlo', 'Metropolis-Hastings'];
        /**
         * An array of responses based on response codes
         * @type {Array}
         * @private
         */
        this._responseCode = ['Response 1', 'Response 2', 'Response 3'];
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
     * Create data for a menu in scratch-blocks format, consisting of an array of objects with text and
     * value properties. The text is a translated string, and the value is one-indexed.
     * @param  {object[]} info - An array of info objects each having a name property.
     * @return {array} - An array of objects with text and value properties.
     * @private
     */
    _buildModelMenu (modelDict) {
        let modelMenu = [];
        const numKeys = Object.keys(modelDict).length;

        if (numKeys == 0) {
            return [{text: 'No models created yet', value: -1}];
        } else {
            for (const [key, model] of Object.entries(this._models)) {
                let obj = {};
                obj.text = model.name;
                obj.value = model.id;
                modelMenu.push(obj);
            }
            return modelMenu;
        }
    }

    /**
     * Create an id for the model that is user-created, updating the _modelCount variable accordingly
     * @return {number} - An array of objects with text and value properties.
     * @private
     */
    _getModelID () {
        this._modelCounter = this._modelCounter + 1
        return this._modelCounter
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
                    default: '(1) Bernoulli',
                    description: 'Success or failure in a single trial'
                }),
                // fileName: '1-snare'
            },
            {
                name: formatMessage({
                    id: 'turing.models.binomial',
                    default: '(2) Binomial',
                    description: 'Discrete data, # successes in fixed number of independent trials.'
                }),
            },
            {
                name: formatMessage({
                    id: 'turing.models.gaussian',
                    default: '(3) Gaussian',
                    description: 'Cts data, characterised by a bell-shaped curve and mean-variance parameters.'
                }),
            },
        ]
    }

    /**
     * An array of info about each sampling method.
     * @type {object[]}
     * @param {string} name - the translatable name to display in the drums menu.
     * @param {string} fileName - the name of the audio file containing the drum sound.
    */
    get SAMPLING_INFO () {
        return [
            {
                name: formatMessage({
                    id: 'turing.sampling.mc',
                    default: '(1) Monte Carlo Simulation',
                    description: 'Uses random sampling, gives numerical estimates and risk assessments.'
                }),
                // fileName: '1-snare'
            },
            {
                name: formatMessage({
                    id: 'turing.sampling.hmc',
                    default: '(2) Hamiltonian Monte Carlo',
                    description: 'Sophisticated Markov chain Monte Carlo (MCMC) for high dimensional spaces.'
                }),
            },
            {
                name: formatMessage({
                    id: 'turing.sampling.mh',
                    default: '(3) Metropolis-Hastings',
                    description: 'MCMC algorithm sampling from target distribution for parameter exploration.'
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
            // Theme Colours
            color1: '#33c9af',
            color2: '#e19cff',

            // your Scratch blocks
            blocks: [
                {
                    opcode: 'getModel',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'turing.getModel',
                        default: 'MODEL',
                        description: 'get the probabilistic model'
                    }),
                },
                {
                    opcode: 'getSamplingMethod',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'turing.getSamplingMethod',
                        default: 'SAMPLING METHOD',
                        description: 'get the sampling method'
                    }),
                },
                {
                    opcode: 'getSamples',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'turing.getSamples',
                        default: 'SAMPLES',
                        description: 'fetches samples for your model from Turing'
                    }),
                },
                {
                    opcode: 'setModel',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'turing.setModel',
                        default: 'Create [MODEL] model',
                        description: 'create a probabilistic model'
                    }),
                    arguments: {
                        MODEL: {
                            type: ArgumentType.NUMBER,
                            menu: 'MODELS',
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'setSampler',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'turing.setSampler',
                        default: 'set sampler to [SAMPLING_METHOD]',
                        description: 'set sampling method'
                    }),
                    arguments: {
                        SAMPLING_METHOD: {
                            type: ArgumentType.NUMBER,
                            menu: 'SAMPLING',
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'setSampleNumber',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'turing.setSampleNumber',
                        default: 'set to [N] samples',
                        description: 'set number of samples'
                    }),
                    arguments: {
                        N: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 10
                        }
                    }
                }
            ],
            menus: {
                MODELS: {
                    acceptReporters: true,
                    items: this._buildMenu(this.MODEL_INFO)
                },
                SAMPLING: {
                    acceptReporters: true,
                    items: this._buildMenu(this.SAMPLING_INFO)
                },
                USER_MODELS: { //TODO adjust based on user-created model options
                    acceptReporters: true,
                    items: this._buildModelMenu(this._models)  
                }
            }
        };
    }

    /**
     * Get the current model type.
     */
    getModel () {
        // reduces model code by 1 to correspond to the _modelTypeFromArray 
        return this._modelTypefromCode[this.modelType]
    }

    /**
     * Get the current sampling method.
     */
    getSamplingMethod () {
        return this._samplingMethodFromCode[this.samplingMethod]
    }

    /**
     * Fetches samples
     */
    getSamples () {
        // Send request to Turing
        // response = this._createModelinTuring(this._getModelDict())
        // return response
        return `fetched ${this.N} samples from ${this._modelTypefromCode[this.modelType]} using ${this._samplingMethodFromCode[this.samplingMethod] }`;
    }


    /**
     * Create a model of a particular type.
     * @param {object} args - the block arguments.
     * @param {object} util - utility object provided by the runtime.
     * @property {int} MODEL - the number of the drum to play.
     */
    setModel (args, util) {
        // reduces model code by 1 to correspond to the _modelTypeFromArray 
        this.modelType = args.MODEL - 1
        return `set to ${this._modelTypefromCode[this.modelType]}` 
    }

    /**
     * Sample from a particular model
     * @param {object} args - the block arguments.
     * @param {object} util - utility object provided by the runtime.
     * @property {int} MODEL - the number of the drum to play.
     */
    setSampler (args) {
        this.samplingMethod = args.SAMPLING_METHOD - 1
        return `set to method <${this._samplingMethodFromCode[this.samplingMethod]}>`
    }

    /**
     * Sample from a particular model
     * @param {object} args - the block arguments.
     * @param {object} util - utility object provided by the runtime.
     * @property {int} MODEL - the number of the drum to play.
     */
    setSampleNumber (args) {
        if (args.N >= 0 && args.N <= this.sampleMax) {
            this.N = args.N;
            return `set to ${this.N} samples`;
        } else {
            return "too many/few samples!";
        }
    }

    /**
     * Internal code to create a model of a particular type
     * @param {number} modelCode - the model code.
     * @param {string} modelVar - variable name of the model.
     * @param {object} util - utility object provided by the runtime.
     * @returns message to the end user about their attempted action
     */
    _getModelDict () {
        // Check if a model already exists with this configuration
        return  {'type': this.modelType, 'N': this.N, 'sampler': this.samplingMethod};
    }

    /**
     * Get Turing.jl to create a model of a particular type on the server-side
     * @param {object} model - utility object provided by the runtime.
     * @returns response code 
     */
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
        return this._sendRequesttoServer(url, payload)
    }

    /**
     * Send a request to the Turing API of a particular type
     * @param {string} url - API destination
     * @param {object} payload - body of information to be sent
     * @returns response code from the server
     */
    _sendRequesttoServer(url, payload) {
        return fetch(url, payload)
        .then(function (response) {
            copy = response.clone();
            console.log("Got response" );
            return response.text(); 
        })
        .catch(function (err) {
            if (err instanceof SyntaxError) {
                // Handle syntax errors
                return copy.json()
                    .then(function (data) {
                        return _fixJson(data); 
                    });
            } else {
                // Throw error if not SyntaxError
                throw err;
            }
        })
        .then((message) => {
            console.log("Server responded: ", message);
            return message;
        });
    }

    /**
     * Utility to repair damaged JSON data
     * @param {object} data - damaged JSON data 
     */
    fixJson({data}) {
        console.log("Something is broken with this data...")
        console.log(data)
        console.log("**")
    }
}

module.exports = TuringPPL;

//     /**
//      * Get the current model type.
//      * @param {object} args - the block arguments.
//      * @param {object} util - utility object provided by the runtime.
//      * @property {int} MODEL - the number of the drum to play.
//      */
//     getModel (args, util) {
//         // reduces model code by 1 to correspond to the _modelTypeFromArray 
//         if (this.model != -1){
//             return this.model.type
//         } else{
//             return "not yet set"
//         }
//     }

//     /**
//      * Get the current sampling method.
//      * @param {object} args - the block arguments.
//      * @param {object} util - utility object provided by the runtime.
//      * @property {int} MODEL - the number of the drum to play.
//      */
//     getSamplingMethod (args, util) {
//         if (this.samplingMethod != -1){
//             return "method (" + this.samplingMethod + ")"
//         } else{
//             return "default - method (1)"
//         }
//     }

//     /**
//      * Get the current number of samples.
//      * @param {object} args - the block arguments.
//      * @param {object} util - utility object provided by the runtime.
//      * @property {int} MODEL - the number of the drum to play.
//      */
//     getSamples (args, util) {
//         // reduces model code by 1 to correspond to the _modelTypeFromArray 
//         if (this.model == -1) {
//             return "set your model first :)"
//         } else {
//             return "sending to turing!: " + this.model.type + ", " + this.samplingMethod + ", " + this.N
//             // return this._createModelinTuring(this.model)
//         }
//     }


//     /**
//      * Create a model of a particular type.
//      * @param {object} args - the block arguments.
//      * @param {object} util - utility object provided by the runtime.
//      * @property {int} MODEL - the number of the drum to play.
//      */
//     setModel (args, util) {
//         // reduces model code by 1 to correspond to the _modelTypeFromArray 
//         return this._createModel(args.MODEL - 1, util);
//     }

//     /**
//      * Sample from a particular model
//      * @param {object} args - the block arguments.
//      * @param {object} util - utility object provided by the runtime.
//      * @property {int} MODEL - the number of the drum to play.
//      */
//     setSampler (args, util) {
//         this.samplingMethod = args.SAMPLING_METHOD
//         return "set to method (" + this.samplingMethod + ")"
//     }

//     /**
//      * Sample from a particular model
//      * @param {object} args - the block arguments.
//      * @param {object} util - utility object provided by the runtime.
//      * @property {int} MODEL - the number of the drum to play.
//      */
//     setSampleNumber (args, util) {
//         if (args.N >= 0 & args.N <= 100) {
//             this.N = args.N
//             return "set to " + this.N + " samples"
//         } else {
//             return "Too many/ few samples!"
//         }
//     }

//     /**
//      * Internal code to create a model of a particular type
//      * @param {number} modelCode - the model code.
//      * @param {string} modelVar - variable name of the model.
//      * @param {object} util - utility object provided by the runtime.
//      * @returns message to the end user about their attempted action
//      */
//     _createModel (modelCode, modelVar, util) {
//         // Check if a model already exists with this configuration
//         this.model = {'params': [], 'type': this._modelTypefromCode[modelCode]};
//         return "Created a " + this.model.type + " model";
//     }
//      // _createModel (modelCode, modelVar, util) {
//     //     // Check if a model already exists with this configuration
//     //     if (this._models.hasOwnProperty(modelVar) && this._models[modelVar] !== null && this._models[modelVar] !== undefined) {
//     //         console.log('Model has a value for key ' + modelVar + ':', this._models[modelVar]);
            
//     //         // Overwrite if the distribution is different
//     //         existingModel = this._models[modelVar] 
//     //         if (existingModel.code != modelCode) {
//     //             this._models[modelVar] = {'id': this._getModelID(), 'type': this._modelTypefromCode[modelCode], 'code': modelCode} // creates new model so overwrites it
//     //             code = this._createModelinTuring(this._models[modelVar])
//     //             return modelVar + " is now " + this._models[modelVar].type
//     //         } else {
//     //             return modelVar + " already exists"
//     //         }
//     //       } else {
//     //         // Create a new model with this variable name
//     //         console.log('Model does not have a value for key ' + modelVar);
//     //         this._models[modelVar] = {'id': this._getModelID(), 'type': this._modelTypefromCode[modelCode], 'code': modelCode}
//     //         code = this._createModelinTuring(this._models[modelVar])
//     //         return "Created a " + this._models[modelVar].type + " model"
//     //       }
//     // }

//     /**
//      * Get Turing.jl to create a model of a particular type on the server-side
//      * @param {object} model - utility object provided by the runtime.
//      * @returns response code 
//      */
//     _createModelinTuring(model) {
//         console.log("Sending model information to Turing to create it :)")

//         // build request to Turing
//         const url = this.api_host + "/api/turing/v1/createModel"; 
//         const payload = {
//             method: 'POST', 
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(model)
//         };
//         return this._sendRequesttoServer(url, payload)
//     }

//     /**
//      * Send a request to the Turing API of a particular type
//      * @param {string} url - API destination
//      * @param {object} payload - body of information to be sent
//      * @returns response code from the server
//      */
//     _sendRequesttoServer(url, payload) {
//         return fetch(url, payload)
//         .then(function (response) {
//             copy = response.clone();
//             console.log("Got response" );
//             return response.text(); 
//         })
//         .catch(function (err) {
//             if (err instanceof SyntaxError) {
//                 // Handle syntax errors
//                 return copy.json()
//                     .then(function (data) {
//                         return _fixJson(data); 
//                     });
//             } else {
//                 // Throw error if not SyntaxError
//                 throw err;
//             }
//         })
//         .then((message) => {
//             console.log("Server responded: ", message);
//             return message;
//         });
//     }

//     /**
//      * Utility to repair damaged JSON data
//      * @param {object} data - damaged JSON data 
//      */
//     fixJson({data}) {
//         console.log("Something is broken with this data...")
//         console.log(data)
//         console.log("**")
//     }
// }

// module.exports = TuringPPL;