# SillyTavern - KoboldCPP .kcpps Loader
Makes call to KoboldCPP's admin api.

Based on: https://github.com/theroyallab/ST-tabbyAPI-loader/blob/main/modelParameters.html

To use
* Install plugin using the git url: https://github.com/kawaii-wolf/ST-koboldcpp-loader-standalone
* Launch KoboldCPP with the --admin and --admindir flags properly set (See KoboldCPP documentation or release 1.83.1 notes for more details).
* Put in the KoboldCPP Loader Base URL in the Extensions settings. Most of the time this will be the same as your KoboldCPP API URL in the Connection profile, but is a seperate variable for more complicated network/proxy setups. Ex: http://127.0.0.1:5001
* Select the desired .kcpps file (from the --admindir) in the Available .kcpps configuration dropdown (or hit the refresh button to grab a new list).
* Use the Reload KoboldCPP Config (or the /kcpp-load command) to have KoboldCPP reload configuration using the selected .kcpps configuration.
* Set a template (or use /kcpp-template) when loading a .gguf file directly to apply the .kcpps template to the .gguf file.
