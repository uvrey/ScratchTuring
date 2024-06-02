# ScratchTuring

## Setup
This extension equips a Scratch environment with Probabilistic Programming capabilities. It relies on the separate `ScratchTuringAPI`, which must be started before this code is run. 

(*Optional*): To run the VM:
```
npm start
```

Now link the VM with the GUI:

    In your local scratch-gui repository's top level:
        Make sure you have run `npm install`
        Build the dist directory by running BUILD_MODE=dist npm run build
        Establish a link to this repository by running npm link

    From the top level of each repository (such as scratch-vm) that depends on scratch-gui:
        Make sure you have run `npm install`
        Run `npm link scratch-gui`


In `scratch-gui`, link the vm and start the GUI. 
```
npm link scratch-vm
npm start
```
For more guidance, please consult this resource:
https://scratch.mit.edu/discuss/topic/336496/

This code may take a little while to build, but will appear at `localhost:8601``

## Contributions

ScratchTuring modifies the Scratch infrastructure through several modifications to its base virtual machine, runtime and GUI code. While more adjustments were made to multiple files than shown in the following tables, we have included the documents and contributions with the most substantial changes below. We have placed changes made in modified files between a `/** Start -- ScratchTuring */` and `/** End -- ScratchTuring */` tag. 

### Modified and Added Files

#### Modified Files

| File Path                                   |
|---------------------------------------------|
| scratch-gui/src/lib/vm-listener-hoc.jsx     |
| scratch-gui/src/lib/alerts/index.jsx        |
| scratch-vm/src/engine/runtime.js            |

#### Added Files

| File Path                                      |
|------------------------------------------------|
| scratch-gui/src/containers/turing-tab.jsx      |
| scratch-gui/src/containers/turing-selector-item.jsx |
| scratch-gui/src/containers/turing-modal.jsx    |
| scratch-gui/src/containers/map-modal.jsx       |
| scratch-gui/src/reducers/turing-data.js        |

#### Added Folders

| Folder Path                                       |
|---------------------------------------------------|
| scratch-vm/src/extensions/scratch3_turing         |
| scratch-gui/src/components/turing-asset-panel     |
| scratch-gui/src/components/turing-modal           |
| scratch-gui/src/components/turing-selector-item   |
| scratch-gui/src/components/turing-viz-panel       |
| scratch-gui/src/components/map-modal              |

## Attributions
This codebase was developed with the support of numerous online resources and, in overlaying the Scratch codebase, builds on years of contributions from Scratch developers. Additionally, some parts of the tool's functionality use work by other programmers. We highlight the most substantial contributions from these external sources below, and the functionality affected by these contributions.

### External Resources
| Description                                                    | Functionality Affected               | Source                                                       |
|----------------------------------------------------------------|--------------------------------------|--------------------------------------------------------------|
| Recharts Documentation to build dashboard visualisations       | ScratchTuring Visualisation panel    | [Recharts](https://recharts.org/)                            |
| Data generation for normal distribution curves given parameters | `Normal` dashboard                   | [Norms-R-Us](https://github.com/Coby-Burckard/Norms-R-Us), used in `scratch-vm/src/extensions/scratch3_turing/distributions.js` |
| Spinning mechanism in dashboards                               | Simulating the spinning mechanism of a real-world spinner                             | [Fortune-Wheel](https://github.com/cirocki/Fortune-Wheel)    |

We also wish to acknowledge the use of [Google Gemini](https://gemini.google.com/) and [ChatGPT](https://chat.openai.com/) to assist with explaining code segments, suggesting debugging strategies for erroneous functions, and producing code for the `_generateRandomUserName` function in `scratch-vm/src/extensions/scratch3_turing/index.js`.
