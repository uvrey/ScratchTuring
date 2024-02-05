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
         * The number of models created in this runtime.
         * @type {number}
         * @private
         */
        this._modelCounter = 0;

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

        /**
         * An array of model names, where indexes correspond to the model code - 1
         * @type {Array}
         * @private
         */
        this._modelTypefromCode = ['bernoulli', 'binomial', 'gaussian'];

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
                    opcode: 'createModel',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'turing.createModel',
                        default: 'Create [MODEL] named [MODEL_VAR]',
                        description: 'create a probabilistic model'
                    }),
                    arguments: {
                        MODEL: {
                            type: ArgumentType.NUMBER,
                            menu: 'MODELS',
                            defaultValue: 1
                        }, 
                        MODEL_VAR: {
                            type: ArgumentType.STRING,
                            defaultValue: "Larry"
                        }
                    }
                },
                {
                    opcode: 'sampleDistributions',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'turing.sampleDistributions',
                        default: 'Sample [MODEL] using [SAMPLING_METHOD]',
                        description: 'create a probabilistic model'
                    }),
                    arguments: {
                        MODEL: {
                            type: ArgumentType.NUMBER,
                            menu: 'MODELS',
                            defaultValue: 1
                        }, 
                        SAMPLING_METHOD: {
                            type: ArgumentType.NUMBER,
                            menu: 'SAMPLING_INFO',
                            defaultValue: 1
                        }
                    }
                },
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
                    items: this._buildMenu(this.SAMPLING_INFO)  
                }
            }
        };
    }

    /**
     * Create a model of a particular type.
     * @param {object} args - the block arguments.
     * @param {object} util - utility object provided by the runtime.
     * @property {int} MODEL - the number of the drum to play.
     */
    createModel (args, util) {
        // reduces model code by 1 to correspond to the _modelTypeFromArray 
        return this._createModel(args.MODEL - 1, args.MODEL_VAR, util);
    }

    /**
     * Internal code to create a model of a particular type
     * @param {number} modelCode - the model code.
     * @param {string} modelVar - variable name of the model.
     * @param {object} util - utility object provided by the runtime.
     * @returns message to the end user about their attempted action
     */
    _createModel (modelCode, modelVar, util) {
        // Check if a model already exists with this configuration
        if (this._models.hasOwnProperty(modelVar) && this._models[modelVar] !== null && this._models[modelVar] !== undefined) {
            console.log('Model has a value for key ' + modelVar + ':', this._models[modelVar]);
            
            // Overwrite if the distribution is different
            existingModel = this._models[modelVar] 
            if (existingModel.code != modelCode) {
                this._models[modelVar] = {'id': this._getModelID(), 'type': this._modelTypefromCode[modelCode], 'code': modelCode} // creates new model so overwrites it
                code = this._createModelinTuring(this._models[modelVar])
                return modelVar + " is now " + this._models[modelVar].type
            } else {
                return modelVar + " already exists"
            }
          } else {
            // Create a new model with this variable name
            console.log('Model does not have a value for key ' + modelVar);
            this._models[modelVar] = {'id': this._getModelID(), 'type': this._modelTypefromCode[modelCode], 'code': modelCode}
            code = this._createModelinTuring(this._models[modelVar])
            return "Created a " + this._models[modelVar].type + " model called " + modelVar
          }
    }

    /**
     * Get Turing.jl to create a model of a particular type on the server-side
     * @param {object} model - utility object provided by the runtime.
     * @returns response code 
     */
    _createModelinTuring(model) {
        console.log("Sending model information to Turing to create it :)")

        // build request to Turing
        const url = this.api_host + "/api/turing/v1/createModel"; 
        const payload = {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(model)
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