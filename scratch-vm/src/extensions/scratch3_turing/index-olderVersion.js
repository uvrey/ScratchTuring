const ArgumentType = require('../../extension-support/argument-type.js')
const BlockType = require('../../extension-support/block-type.js')
const TargetType = require('../../extension-support/target-type.js')
const Cast = require('../../util/cast.js');
const log = require('../../util/log.js');
const {fetchWithTimeout} = require('../../util/fetch-with-timeout.js');
const languageNames = require('scratch-translate-extension-languages');
const formatMessage = require('format-message');

const Looks = require('../../blocks/scratch3_looks.js');
const Runtime = require('../../engine/runtime.js');
const Sprite = require('../../sprites/sprite.js');
const RenderedTarget = require('../../sprites/rendered-target.js');
const makeTestStorage = require('../../../test/fixtures/make-test-storage.js');
const VirtualMachine = require('../../virtual-machine.js');

class Scratch3Turing {

    constructor (runtime) {
        // put any setup for your extension here
        this.runtime = runtime

        // get reference to the stage
        this.stage = runtime.getTargetForStage ()
// continue to "Storage API Quick Start" section below

         /**
         * The samples collected from a call to Turing
         * @type {number}
         * @private
         */
        this._samples = []
        this.sampleIndex = 0
        this.mapNumber = 0

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
        this.N = '10'; // TODO check this is ok
        this.samples = "none fetched yet"

        this.lists = {};

        // set default methods
        this.samplingMethod = 0; 
        this.modelType = 0;
        this.sampleMax = 100;
        this.response = "none fetched yet"
        this.sampled = false
        this.fetching = false

        /**
         * An array of model names, where indexes correspond to the model code - 1
         * @type {Array}
         * @private
         */
        this._modelTypefromCode = ['bernoulli', 'binomial', 'gaussian'];
        this._samplingMethodFromCode = ['Monte-Carlo', 'Hamiltonian Monte-Carlo', 'Metropolis-Hastings'];
        this._fieldFromCode = ['summary', 'quantiles', 'chain'];
        this._quantileFromCode = ['2.5%', '25.0%', '50.0%', '75.0%', '97.5%'];
        this._listFromCode = ['p', 'data']
        this._summaryFromCode = ['mean', 'std', 'mcse', 'rhat']
        /**
         * An array of responses based on response codes
         * @type {Array}
         * @private
         */
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
                    default: 'bernoulli',
                    description: 'Success or failure in a single trial'
                }),
                // fileName: '1-snare'
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

    get FIRST_IN_LIST_INFO () {
        return [
              {
                name: formatMessage({
                    id: 'turing.list.data',
                    default: 'data',
                    description: 'data'
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
                    default: 'monte carlo',
                    description: 'Uses random sampling, gives numerical estimates and risk assessments.'
                }),
                // fileName: '1-snare'
            },
            {
                name: formatMessage({
                    id: 'turing.sampling.hmc',
                    default: 'hamiltonian monte carlo',
                    description: 'Sophisticated Markov chain Monte Carlo (MCMC) for high dimensional spaces.'
                }),
            },
            {
                name: formatMessage({
                    id: 'turing.sampling.mh',
                    default: 'metropolis-hastings',
                    description: 'MCMC algorithm sampling from target distribution for parameter exploration.'
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
    get FIELD_INFO () {
        return [
            {
                name: formatMessage({
                    id: 'turing.field.summary',
                    default: '(1) Summary',
                    description: 'Summary.'
                }),
                // fileName: '1-snare'
            },
            {
                name: formatMessage({
                    id: 'turing.field.parameters',
                    default: '(2) Quantiles',
                    description: 'Quantiles.'
                }),
            },
            {
                name: formatMessage({
                    id: 'turing.field.quantiles',
                    default: '(3) Chain Info',
                    description: 'Chain Info.'
                }),
            },
        ]
    }

    get SUMMARY_INFO () {
        return [
            {
                name: formatMessage({
                    id: 'turing.field.summary.mean',
                    default: 'mean',
                    description: 'mean'
                }),
                // fileName: '1-snare'
            },
            {
                name: formatMessage({
                    id: 'turing.field.summary.std',
                    default: 'std',
                    description: 'std deviation'
                }),
            },
            {
                name: formatMessage({
                    id: 'turing.field.summary.mcse',
                    default: 'mcse',
                    description: 'mcse'
                }),
            },
            {
                name: formatMessage({
                    id: 'turing.field.summary.rhat',
                    default: 'rhat',
                    description: 'rhat'
                }),
            },
        ]
    }



    get QUANTILES_INFO () {
        return [
            {
                name: formatMessage({
                    id: 'turing.field.quantile.2.5',
                default: 'q0 - 2.5%',
                    description: 'q0'
                }),
                // fileName: '1-snare'
            },
            {
                name: formatMessage({
                    id: 'turing.field.quantile.25',
                default: 'q1 - 25%',
                    description: 'q1'
                }),
                // fileName: '1-snare'
            },
            {
                name: formatMessage({
                    id: 'turing.field.quantile.50',
                    default: 'q2 - 50%',
                    description: 'q2'
                }),
            },
            {
                name: formatMessage({
                    id: 'turing.field.quantile.75',
                    default: 'q3 - 75%',
                    description: 'q3'
                }),
            },
            {
                name: formatMessage({
                    id: 'turing.field.quantile.97.5',
                    default: 'q4 - 97.5%',
                    description: 'q4'
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
            // Theme Colours
            color1: '#33c9af',
            color2: '#e19cff',

            // your Scratch blocks
            blocks: [

                // FAMILY OF FUNCTIONS FOR REPRESENTING IN SCRATCH
                {
                    opcode: 'testStuff',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'turing.testStuff',
                        default: '🎨 load our backdrop',
                        description: 'test some stuff'
                    })
                },

                {
                    opcode: 'mapPtoX',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'turing.mapPtoX',
                        default: '🎨 x-coord for sample [SAMPLE]',
                        description: 'get the x-coord for sample'
                    }),
                    arguments: {
                        SAMPLE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                },
                {
                    opcode: 'mapPtoY',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'turing.mapPtoY',
                        default: '🎨 y-coord for sample [SAMPLE]',
                        description: 'get the y-coord for sample '
                    }),
                    arguments: {
                        SAMPLE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                },
                {
                    opcode: 'mapPtoSize',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'turing.mapPtoSize',
                        default: '🎨 get size [SAMPLE] ([SIZE_MIN], [SIZE_MAX])',
                        description: 'map a probability to a size'
                    }),
                    arguments: {
                        SIZE_MIN: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        SIZE_MAX: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 5
                        },
                        SAMPLE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                },

                {
                    opcode: 'getMapBox',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'turing.getMapBox',
                        default: '🌍 long: [LONG], lat: [LAT]',
                        description: 'download a map for your project'
                    }),
                    arguments: {
                        LONG: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        LAT: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                    }
                },


                // FAMILY OF FUNCTIONS TO GET CONFIG INFORMATION
                {
                    opcode: 'getModel',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'turing.getModel',
                        default: '🚩 model',
                        description: 'get the probabilistic model'
                    }),
                },
                {
                    opcode: 'getSamplingMethod',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'turing.getSamplingMethod',
                        default: '🚩 sampling method',
                        description: 'get the sampling method'
                    }),
                },
                {
                    opcode: 'getChainSize',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'turing.getChainSize',
                        default: '🚩 chain size',
                        description: 'get chain size'
                    }),
                },
                {
                    opcode: 'getQuantile',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'turing.quantile',
                        default: '🚩 quantile [Q]',
                        description: 'get quantile info from chain'
                    }),
                    arguments: {
                        Q: {
                            type: ArgumentType.NUMBER,
                            menu: 'QUANTILES',
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'getSummaryInfo',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'turing.getSummaryInfo',
                        default: '🚩 [INFO]',
                        description: 'get summary information'
                    }),
                    arguments: {
                        INFO: {
                            type: ArgumentType.NUMBER,
                            menu: 'SUMMARY_INFO',
                            defaultValue: 1
                        }
                    }
                },

                // FAMILY OF GENERAL PURPOSE TURING.JL FUNCTIONS
                {
                    opcode: 'fetchChain',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'turing.fetchChain',
                        default: '⚙️ fetch chain',
                        description: 'fetches chain for your model from Turing'
                    }),
                },
                {
                    opcode: 'setModel',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'turing.setModel',
                        default: '⚙️ create [MODEL] model',
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
                        default: '⚙️ set sampler to [SAMPLING_METHOD]',
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
                    opcode: 'setChainSize',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'turing.setChainSize',
                        default: '⚙️ set chain size to [N]',
                        description: 'set number of samples'
                    }),
                    arguments: {
                        N: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 10
                        }
                    }
                },
                    // FAMILY OF FUNCTIONS TO INSPECT PROGRAM STATE
                {
                    opcode: 'inspectList',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'turing.inspectList',
                        default: '👀 look at [LIST]',
                        description: 'shows the list'
                    }),
                    arguments: {
                        LIST: {
                            type: ArgumentType.NUMBER,
                            menu: 'FIRST_IN_LIST',
                            defaultValue: 1
                        },
                    },
                },
                {
                    opcode: 'getFirstInList',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'turing.getFirstInList',
                        default: '👀 first [LIST]',
                        description: 'gets the first sample in list of specified type'
                    }),
                    arguments: {
                        LIST: {
                            type: ArgumentType.NUMBER,
                            menu: 'FIRST_IN_LIST',
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'getNextInList',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'turing.getNextInList',
                        default: '👀 next [LIST]',
                        description: 'gets the next item in the list'
                    }),
                    arguments: {
                        LIST: {
                            type: ArgumentType.NUMBER,
                            menu: 'FIRST_IN_LIST',
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
                    items: this._buildModelMenu(this._models)  
                },
                FIELD_INFO: {
                    acceptReporters: true,
                    items: this._buildMenu(this.FIELD_INFO)
                },
                QUANTILES: {
                    acceptReporters: true,
                    items: this._buildMenu(this.QUANTILES_INFO)
                },
                FIRST_IN_LIST: {
                    acceptReporters: true,
                    items: this._buildMenu(this.FIRST_IN_LIST_INFO)
                },
                SUMMARY_INFO: {
                    acceptReporters: true,
                    items: this._buildMenu(this.SUMMARY_INFO)
                },
            }
        };
    }

    getChainSize () {
        return this.N
    }

    getSummaryInfo(args) {
        infoCode = this._summaryFromCode[args.INFO - 1]
        if (typeof this.messageObject != "undefined"){
            return this.messageObject["summary"][infoCode][0]
        } else {
            return "no chain fetched"
        }
    }
    // Inspect a particular type of list
    inspectList(args) {
        // listCode = this._listFromCode[args.LIST - 1]
        listCode = "data"

        if (typeof this.messageObject != "undefined") {

            // define if the list hasn't been defined yet
            if (typeof this.lists[listCode] == "undefined") {

                console.log("list code is?")
                console.log(listCode)
                this.lists[listCode] = {}
                console.log("TRYING TO GET THIS>")
                console.log(this.messageObject)
                console.log("type?")
                console.log(typeof this.messageObject)
                // this.lists[listCode]["list"] = this.messageObject["chain"][listCode]
                // this.lists[listCode]["index"] = 0
            }
            
            // Round list values to 2 decimal points for display 
            var roundedList = this.messageObject["chain"][listCode][0].map(function(element) {
                return Math.round(element * 100) / 100;
            });
            return roundedList
        } else {
            return "no chain fetched"
        }
    }

    // Fetch the quantile from code
    getQuantile(args) {
        if (typeof this.messageObject != "undefined"){
            quantileCode = this._quantileFromCode[args.Q - 1]
            console.log("quantile code? " + quantileCode)
            return this.messageObject["quantiles"][quantileCode][0] // Get first element in list of size 2 (TODO what does this correspond to?)
        } else {
            return "no chain fetched"
        }
    }

    getInfoFromChain(args) {
        fieldCode = args.FIELD - 1
        fieldName = this._fieldFromCode[args.FIELD]
        return this.getFieldfromChain(fieldName)
    }

    /**
     * Test which costume index the `switch costume`
     * block will jump to given an argument and array
     * of costume names. Works for backdrops if isStage is set.
     *
     * @param {string[]} costumes List of costume names as strings
     * @param {string|number|boolean} arg The argument to provide to the block.
     * @param {number} [currentCostume=1] The 1-indexed default costume for the sprite to start at.
     * @param {boolean} [isStage=false] Whether the sprite is the stage
     * @return {number} The 1-indexed costume index on which the sprite lands.
     */
    // testCostume = (costumes, arg, currentCostume = 1, isStage = false) => {
    //     const rt = new Runtime();
    //     const looks = new Looks(rt);

    //     const sprite = new Sprite(null, rt);
    //     const target = new RenderedTarget(sprite, rt);

    //     sprite.costumes = costumes.map(name => ({name: name}));
    //     target.currentCostume = currentCostume - 1; // Convert to 0-indexed.

    //     if (isStage) {
    //         target.isStage = true;
    //         rt.addTarget(target);
    //         looks.switchBackdrop({BACKDROP: arg}, {target});
    //     } else {
    //         looks.switchCostume({COSTUME: arg}, {target});
    //     }

    //     return target.currentCostume + 1; // Convert to 1-indexed.
    // };

    /**
     * @param {Asset} asset - calculate a URL for this asset.
     * @returns {string} a URL to download a project asset (PNG, WAV, etc.)
     */
    getAssetUrl = function () {
        // var assetUrlParts = [
        //     'https://assets.example.com/path/to/assets/',
        //     asset.assetId,
        //     '.',
        //     asset.dataFormat,
        //     '/get/'
        // ];
        return `https://wallpapercave.com/wp/wp2555019.jpg`
    };


    testStuff() {
        // console.log("Getting extension blocks in the current panel as a JSON!") // TODO get this for the editor?
        // console.log(this.runtime.getBlocksJSON ())
        try {

            const vm = new VirtualMachine();
            const ScratchStorage = require('scratch-storage');
            const testStorage = new ScratchStorage();
            vm.attachStorage(testStorage);
            
            // console.log("Trying to get an image from the web")
            // testStorage.addWebStore(
            //     [AssetType.ImageBitmap],
            //     getAssetUrl);

            // storage.load(AssetType.ImageBitmap, imgId).then(function (imgAsset) {
            //     contents = imgAsset.data
            //     console.log("Loaded:")
            //     console.log(contents)
            //     // `soundAsset` is an `Asset` object. File contents are stored in `soundAsset.data`.
            // });
                                
            // const projectUri = path.resolve(__dirname, '/home/josie/research/ignore-0/scratch-vm/test/fixtures/offline-custom-assets.sb2');
            // const projectZip = AdmZip(projectUri);
            // const project = Buffer.from(fs.readFileSync(projectUri));
            // Custom costume from sb2 file (which was downloaded from offline editor)
            // This sound should not be available on our servers
            // const costume = projectZip.readFile('1.svg');
            // const costumeData = new Uint8Array(costume);

            rt = this.runtime
            const looks = new Looks(rt);
        
            const sprite = new Sprite(null, rt);
            const target = new RenderedTarget(sprite, rt);

            // parameters for testing
            costumes = ['a', 'b', 'c', 'd']
            backdrop = 'random backdrop'
            currentCostume = 3
        
            sprite.costumes = costumes.map(name => ({name: name}));
            target.currentCostume = currentCostume - 1; // Convert to 0-indexed.

            // Add backdrop
            vm.tryAddBackdrop(
                '6b3d87ba2a7f89be703163b6c1d4c964.png', // this is the MD5ext
                { // this is the backdrop object
                    name: 'baseball-field',
                    baseLayerID: 26,
                    baseLayerMD5: '6b3d87ba2a7f89be703163b6c1d4c964.png',
                    bitmapResolution: 2,
                    rotationCenterX: 480,
                    rotationCenterY: 360
                },
                rt,
                this.stage
            );

         //   this.handleSurpriseBackdrop()
            // this.handleBackdropUpload()
            // THIS STUFF SWITCHES BACKDROPS BETWEEN WHAT WAS ALREADY LOADED
            // target.isStage = true;
            // rt.addTarget(target);
            // looks.switchBackdrop({BACKDROP: backdrop}, {target});
        
            // target.currentCostume + 1; // Convert to 1-indexed.
            return "did something happen?"
        
            // return target.currentCostume + 1; // Convert to 1-indexed.

            console.log("Trying to get stage dimensions...");
            console.log(this.stage);
            console.log("Trying to get current costume...");
            console.log(this.stage.currentCostume);
            // Always set to the zeroth costume even when it is changed manually
            this.stage.setCostume(0) // can we just do this to LOAD the backdrop associated? 
            // this.stage.setCostume('random backdrop') // set to random backdrop like this doesn't work
            
        } catch (error) {
            console.log(`error encountered: ${error}`);
        }
    }

    isValidLongLat(long, lat) {
        // Check if values are numbers
        if (typeof long !== 'number' || typeof lat !== 'number') {
            return false;
        }
        
        // Check for valid longitude range (-180 to 180)
        if (long < -180 || long > 180) {
            return false;
        }
        
        // Check for valid latitude range (-90 to 90)
        if (lat < -90 || lat > 90) {
            return false;
        }
        
        // All checks passed, valid longitude and latitude
        return true;
    }

    getMapBox(args) {
        long = Number(args.LONG)
        lat = Number(args.LAT)

        // lat = 0.119167
        // long = 52.205276

        console.log(typeof long)

        if (this.isValidLongLat(long, lat)){
            return this.downloadMap(long, lat)
        } else {
            return "Invalid coordinates"
        }
    }

    downloadMap(long, lat) {
        const accessToken = 'pk.eyJ1Ijoiam1yMjM5IiwiYSI6ImNsdWp1YjczZzBobm4ycWxpNjFwb3Q3eGgifQ.qOHGVYmd3wr7G9_AGVESMg';

        // Define desired map properties
        const styleId = 'satellite-streets-v12';
        const center = [long, lat]; // Replace with your desired coordinates
        const zoom = 12;
        const width = 960;
        const height = 720;

        // Build the Static Images API URL
        const imageUrl = `https://api.mapbox.com/styles/v1/mapbox/${styleId}/static/${lat},${long},14.25,0,60/${width}x${height}?access_token=${accessToken}`;

        function downloadImage(url, filename) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'blob';

        xhr.onload = function() {
            if (this.status === 200) {
            const blob = this.response;
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            } else {
            console.error('Download failed:', this.statusText);
            return "error 1"
            }
        };

        xhr.onerror = function() {
            console.error('Download failed');
            return "err2"
        };

        xhr.send();
        }
        mapFileName = 'ScratchMap_' + this.mapNumber + '.jpg'
        downloadImage(imageUrl, mapFileName); 
        this.mapNumber = this.mapNumber + 1
        return "success!"
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
        return this._samplingMethodFromCode[this.samplingMethod].toLowerCase()
    }

    /**
     * Fetches a chain from a particular sampler
     */
    fetchChain () {
        // Send request to Turing  TODO only fetches once
        if  (!this.sampled && !this.fetching) {
            this.fetching = true
            this._createModelinTuring(this._getModelDict()) // this sets this.response to a list of samples 
            this.sampled = true
            return `fetching chain: ` + this.getSamplingMethod() + ", " + this.getModel() + ", " + this.N
            // return `fetched ${this.N} samples from ${this._modelTypefromCode[this.modelType]} using ${this._samplingMethodFromCode[this.samplingMethod] }`;
        } else if (this.fetching) {
            return `still fetching chain...` // assumed fetched only if model is not changed
        } else {
            return `already fetched chain :)`
        }
    }

    /**
     * Fetches samples
     */
    getSamples () {
        // Send request to Turing
        if (this.sampled) {
            return JSON.stringify(this.samples)
        } else {
            return "haven't fetched samples yet :)"
        }
    }

    
    // Get list of samples and convert to a number array
    _processSampleList(samples) {
        listString = samples.trim().slice(1, -1);

        // Split the string into an array of strings
        const stringArray = listString.split(',');
    
        // Convert each string element into a number
        const numberArray = stringArray.map(str => parseFloat(str.trim()));
        this.samples = numberArray
        console.log("Processed sample list!")
    }

    // Get list of samples and convert to a number array
    _processSampleList(samples) {
        listString = samples.trim().slice(1, -1);

        // Split the string into an array of strings
        const stringArray = listString.split(',');
    
        // Convert each string element into a number
        const numberArray = stringArray.map(str => parseFloat(str.trim()));
        this.samples = numberArray
        console.log("Processed sample list!")
    }

    getFirstInList(args) {
        if (typeof this.messageObject != "undefined") {

            listCode = "data"

            this.lists[listCode] = {} // set up dictionary to store list data
            this.lists[listCode]["index"] = 0
            this.lists[listCode]["list"] = this.messageObject["chain"][listCode][0] // json is list of lists, so we get the list at zeroth index
            this.lists[listCode]["index"] = 0

            console.log("Is there a list yet?")
            console.log(this.lists[listCode]["list"])
            console.log("does something exist at index here?")
            console.log(this.lists[listCode]["index"])

            console.log("Trying to return this otherwise")
            return this.lists[listCode]["list"][this.lists[listCode]["index"]]  // return the first element of the list in focus 
        } else {
            return "No chain fetched yet"
        }
    }
    
    getNextInList (args) {
        if (typeof this.messageObject != "undefined") {
            // get code for list of interest
            listCode = "data"
            // listCode = this._listFromCode[args.LIST - 1]

            // define if the list hasn't been defined yet
            if (typeof this.lists[listCode] == "undefined") {
                this.lists[listCode] = {}
                this.lists[listCode]["list"] = this.messageObject["chain"][listCode][0]
            }

            // increase the index and wrap around if we exceed list length
            this.lists[listCode]["index"] = (this.lists[listCode]["index"] + 1) % this.lists[listCode]["list"].length; // wrap around 

            // fetch the next item at the new index 
            return this.lists[listCode]["list"][this.lists[listCode]["index"]] // return the first element of the list in focus 
        } else {
            return "No chain fetched yet"
        }
    }

    getFirstSample () {
        if (this.sampled) { 
            sampleToReturn = this.samples[0]
            // resets the sample index
            this.sampleIndex = 0 % this.samples.length
            return sampleToReturn
        } else {
            return "no samples fetched yet!"
        }
    }

    mapPtoY(args) { // -180;180
        return this.mapNumberToSize(args.SAMPLE, -150,  150);
    }

    mapPtoX(args) { // -150;150
        return this.mapNumberToSize(args.SAMPLE, -220,  220);
    }

    mapPtoSize(args) {
        return this.mapNumberToSize(parseFloat(args.SAMPLE), parseInt(args.SIZE_MIN), parseInt(args.SIZE_MAX));
    }

    mapNumberToSize(s, min, max) {
        // Ensure sample is within the range [0, 1]
        sample = Math.max(0, Math.min(1, s));
        return (min + sample * (max - min))
    }

    /**
     * Create a model of a particular type.
     * @param {object} args - the block arguments.
     * @param {object} util - utility object provided by the runtime.
     * @property {int} MODEL - the number of the drum to play.
     */
    setModel (args, util) {
        // reduces model code by 1 to correspond to the _modelTypeFromArray 
        this.sampled = false // something has changed so we can now fetch more samples
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
        this.sampled = false // something has changed so we can now fetch more samples
        this.samplingMethod = args.SAMPLING_METHOD - 1
        return `set to method <${this._samplingMethodFromCode[this.samplingMethod]}>`
    }

    /**
     * Sample from a particular model
     * @param {object} args - the block arguments.
     * @param {object} util - utility object provided by the runtime.
     * @property {int} MODEL - the number of the drum to play.
     */
    setChainSize (args) {        
        if (args.N >= 0 && args.N <= this.sampleMax) {
            this.sampled = false // something has changed so we should fetch more samples
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
        this._sendRequesttoServer(url, payload)
    }

    /**
     * Send a request to the Turing API of a particular type
     * @param {string} url - API destination
     * @param {object} payload - body of information to be sent
     * @returns response code from the server
     */
    _sendRequesttoServer(url, payload) {
        this.response = fetch(url, payload)
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
            // TODO write handling function for message here
            this._processChainMessage(message) // get number array for our sample list
            this.fetching = false // set flag to false
            return message;
        });
    }

    _processChainMessage(message) {
        try {        
            this.messageObject = JSON.parse(JSON.parse(message)); // parse twice, first to remove escapes and second time to read into a JSON
        } catch (error) {
            console.error("Error parsing JSON:", error);
        }
    }

    getFieldfromChain(fieldName) {
        if (typeof this.messageObject !== 'undefined') {
            // var summaryObject = this.messageObject["summary"];
            // console.log(this.messageObject)
            // console.log("Type of this object is a ")
            // console.log(typeof this.messageObject)
            // 'this.messageObject' is not undefined, do something here
            // For example:
            // console.log(this.messageObject["summary"])
            // console.log("VS")
            // console.log(this.messageObject["quantiles"])
            // console.log("----")
            // console.log(this.messageObject.fieldName)
            return this.messageObject.fieldName;
        } else {
            // 'this.messageObject' is undefined
            // Optionally, you can do something else here
            console.log("this.messageObject is undefined. Not doing anything.");
        }
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

module.exports = Scratch3Turing;