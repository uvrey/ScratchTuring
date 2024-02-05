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
    }

    /**
     * Returns the metadata about your extension.
     */
    getInfo () {
        return {
            // unique ID for your extension
            id: 'turing',

            // name that will be displayed in the Scratch UI
            name: 'Turing',

            // colours to use for your extension blocks
            color1: '#000099',
            color2: '#660066',
            // your Scratch blocks
            blocks: [
                {
                    opcode: 'HelloModel',
                    blockType: BlockType.COMMAND,
                    text: 'Create this model type [TYPE]',
                    arguments: {
                        FOO: {
                            type: ArgumentType.NUMBER,
                            menu: 'fooMenu'
                        }
                    }
                },
                {
                    // name of the function where your block code lives
                    opcode: 'SampleBlock',

                    // type of block - choose from:
                    //   BlockType.REPORTER - returns a value, like "direction"
                    //   BlockType.BOOLEAN - same as REPORTER but returns a true/false value
                    //   BlockType.COMMAND - a normal command block, like "move {} steps"
                    //   BlockType.HAT - starts a stack if its value changes from false to true ("edge triggered")
                    blockType: BlockType.REPORTER,

                    // label to display on the block
                    text: 'Choose [SAMPLES] samples with probability [PROBABILITY]',

                    // true if this block should end a stack
                    terminal: false,

                    // where this block should be available for code - choose from:
                    //   TargetType.SPRITE - for code in sprites
                    //   TargetType.STAGE  - for code on the stage / backdrop
                    // remove one of these if this block doesn't apply to both
                    filter: [ TargetType.SPRITE, TargetType.STAGE ],

                    // arguments used in the block
                    arguments: {
                        SAMPLES: {
                            // default value before the user sets something
                            defaultValue: 10,
                            type: ArgumentType.NUMBER
                        },
                        PROBABILITY: {
                            // default value before the user sets something
                            defaultValue: 0.6,
                            type: ArgumentType.NUMBER
                        }
                    }
                },
                {
                    // name of the function where your block code lives
                    opcode: 'BinomialSamplesBlock',
                    blockType: BlockType.REPORTER,

                    // label to display on the block
                    text: 'Get 10 samples at p = 0.5',

                    // true if this block should end a stack
                    terminal: false,
                    filter: [ TargetType.SPRITE, TargetType.STAGE ],
                },
                {
                    // name of the function where your block code lives
                    opcode: 'IncrementBlock',
                    blockType: BlockType.REPORTER,

                    // label to display on the block
                    text: 'Server adds 1 to [VALUE]',
                    // true if this block should end a stack
                    terminal: false,
                    filter: [ TargetType.SPRITE, TargetType.STAGE ],
                    arguments: {
                        VALUE: {
                            // default value before the user sets something
                            defaultValue: 0,
                            type: ArgumentType.NUMBER
                        }
                    }
                },
                {
                    // name of the function where your block code lives
                    opcode: 'GreetBlock',

                    // type of block - choose from:
                    //   BlockType.REPORTER - returns a value, like "direction"
                    //   BlockType.BOOLEAN - same as REPORTER but returns a true/false value
                    //   BlockType.COMMAND - a normal command block, like "move {} steps"
                    //   BlockType.HAT - starts a stack if its value changes from false to true ("edge triggered")
                    blockType: BlockType.REPORTER,

                    // label to display on the block
                    text: 'Greetings from Turing!',

                    // true if this block should end a stack
                    terminal: false,

                    // where this block should be available for code - choose from:
                    //   TargetType.SPRITE - for code in sprites
                    //   TargetType.STAGE  - for code on the stage / backdrop
                    // remove one of these if this block doesn't apply to both
                    filter: [ TargetType.SPRITE, TargetType.STAGE ],

                    // arguments used in the block
                    // arguments: {
                    //     // MY_STRING: {
                    //     //     // default value before the user sets something
                    //     //     defaultValue: 'hello',

                    //     //     // type/shape of the parameter - choose from:
                    //     //     //     ArgumentType.ANGLE - numeric value with an angle picker
                    //     //     //     ArgumentType.BOOLEAN - true/false value
                    //     //     //     ArgumentType.COLOR - numeric value with a colour picker
                    //     //     //     ArgumentType.NUMBER - numeric value
                    //     //     //     ArgumentType.STRING - text value
                    //     //     //     ArgumentType.NOTE - midi music value with a piano picker
                    //     //     type: ArgumentType.STRING
                    //     // }
                    // }
                }
            ],
            menus: {
                fooMenu: {
                    items: ['a', 'b', 'c']
                }
            }
        };
    }


    /**
     * implementation of the block with the opcode that matches this name
     *  this will be called when the block is used
     * TODO: Make sure that this will trigger the API call appropriately
     */
    fixJson({data}) {
        console.log("Something is broken with this data...")
        console.log(data)
        console.log("**")
    }

    IncrementBlock ({VALUE}) {
        const distUrl = "http://127.0.0.1:8080/api/turing/v1/increment"; //TODO make relevant to project  
        const newPayload = {
            method: 'POST', // Specify the HTTP method as POST
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                value: VALUE //TODO fix this
            })
        };

        return fetch(distUrl, newPayload)
            .then(function (response) {
                // Clone the response so that it can be used in the catch block
                responseCopy = response.clone();
                console.log("Got response! " );
                return  response.text(); // Note: invoking text() to get the text content
            })
            .catch(function (err) {
                if (err instanceof SyntaxError) {
                    // If there's a SyntaxError, attempt to fix JSON and return the fixed data
                    return responseCopy.json()
                        .then(function (data) {
                            return fixJson(data); // Assuming you have a function fixJson to handle fixing JSON - TODO
                        });
                } else {
                    // If it's not a SyntaxError, re-throw the error
                    throw err;
                }
            })
            .then((greeting) => {
                // Use the 'greeting' variable here, which contains the text of the response
                console.log("Sample:", greeting);
                return greeting;
            });
    }

    
    CreateModel ({MODEL_TYPE}) {
        return "hello"
        const distUrl = "http://127.0.0.1:8080/api/turing/v1/createModel"; 
        const newPayload = {
            method: 'POST', // Specify the HTTP method as POST
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model_type: MODEL_TYPE, 
                model_id: 0
            })
        };

        return fetch(distUrl, newPayload)
            .then(function (response) {
                // Clone the response so that it can be used in the catch block
                responseCopy = response.clone();
                console.log("Got response! " );
                return  response.text(); // Note: invoking text() to get the text content
            })
            .catch(function (err) {
                if (err instanceof SyntaxError) {
                    // If there's a SyntaxError, attempt to fix JSON and return the fixed data
                    return responseCopy.json()
                        .then(function (data) {
                            return fixJson(data); // Assuming you have a function fixJson to handle fixing JSON - TODO
                        });
                } else {
                    // If it's not a SyntaxError, re-throw the error
                    throw err;
                }
            })
            .then((greeting) => {
                // Use the 'greeting' variable here, which contains the text of the response
                console.log("Sample:", greeting);
                return greeting;
            });
    }

    SampleBlock ({SAMPLES, PROBABILITY}) {
        const distUrl = "http://127.0.0.1:8080/api/turing/v1/getSamples"; 
        if (PROBABILITY < 0 || PROBABILITY > 1)
            return "Your probability should be between 0 and 1"

        const newPayload = {
            method: 'POST', // Specify the HTTP method as POST
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                samples: SAMPLES, 
                probability: PROBABILITY
            })
        };

        return fetch(distUrl, newPayload)
            .then(function (response) {
                // Clone the response so that it can be used in the catch block
                responseCopy = response.clone();
                console.log("Got response! " );
                return  response.text(); // Note: invoking text() to get the text content
            })
            .catch(function (err) {
                if (err instanceof SyntaxError) {
                    // If there's a SyntaxError, attempt to fix JSON and return the fixed data
                    return responseCopy.json()
                        .then(function (data) {
                            return fixJson(data); // Assuming you have a function fixJson to handle fixing JSON - TODO
                        });
                } else {
                    // If it's not a SyntaxError, re-throw the error
                    throw err;
                }
            })
            .then((greeting) => {
                // Use the 'greeting' variable here, which contains the text of the response
                console.log("Sample:", greeting);
                return greeting;
            });
    }

    HelloModel() {
        return 
    }

    BinomialSamplesBlock ({  }) {
        // example implementation to return a string
        const distUrl = "http://127.0.0.1:8080/api/turing/v1/getbinomialsamples"; //TODO make relevant to project
        var responseCopy

        return fetch(distUrl, {})
            .then(function (response) {
                // Clone the response so that it can be used in the catch block
                responseCopy = response.clone();
                console.log("Got response!");
                return response.text(); // Note: invoking text() to get the text content
            })
            .catch(function (err) {
                if (err instanceof SyntaxError) {
                    // If there's a SyntaxError, attempt to fix JSON and return the fixed data
                    return responseCopy.text()
                        .then(function (data) {
                            return fixJson(data); // Assuming you have a function fixJson to handle fixing JSON - TODO
                        });
                } else {
                    // If it's not a SyntaxError, re-throw the error
                    throw err;
                }
            })
            .then((samples) => {
                // Use the 'greeting' variable here, which contains the text of the response
                console.log("samples:", samples);
                return samples;
            });
    }

    exampleWithInlineImage () {
        return;
    }

    GreetBlock ({  }) {
        // example implementation to return a string
        const distUrl = "http://127.0.0.1:8080/api/turing/v1/greet"; //TODO make relevant to project
        var responseCopy

        return fetch(distUrl, {})
            .then(function (response) {
                // Clone the response so that it can be used in the catch block
                responseCopy = response.clone();
                console.log("Got response!");
                return response.text(); // Note: invoking text() to get the text content
            })
            .catch(function (err) {
                if (err instanceof SyntaxError) {
                    // If there's a SyntaxError, attempt to fix JSON and return the fixed data
                    return responseCopy.text()
                        .then(function (data) {
                            return fixJson(data); // Assuming you have a function fixJson to handle fixing JSON - TODO
                        });
                } else {
                    // If it's not a SyntaxError, re-throw the error
                    throw err;
                }
            })
            .then((greeting) => {
                // Use the 'greeting' variable here, which contains the text of the response
                console.log("Greeting:", greeting);
                return greeting;
            });
    }
}

module.exports = TuringPPL;