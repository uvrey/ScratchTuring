const BlockType = require('../../extension-support/block-type.js')
const formatMessage = require('format-message');

class Scratch3Turing {

    constructor (runtime) {
        this.runtime = runtime
        this.api_host = "http://127.0.0.1:8080" // link to Turing
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
                    opcode: 'testStuff',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'turing.testStuff',
                        default: '🎨 do something',
                        description: 'test some stuff'
                    })
                },
            ],
            menus: {
                MODELS: {
                    acceptReporters: true,
                    items: this._buildMenu(this.MODEL_INFO)
                },
            }
        };
    }

    testStuff() {
        return "Hello world!"
    }
}

module.exports = Scratch3Turing;
