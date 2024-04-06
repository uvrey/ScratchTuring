# ScratchTuring
This extension equips a Scratch environment with Probabilistic Programming capabilities. It relies on the separate `TuringAPI`, which must be started before this code is run. 

## Set-up
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
For more:
https://scratch.mit.edu/discuss/topic/336496/

It may take a little while to build, but should soon appear at `localhost:8601``
