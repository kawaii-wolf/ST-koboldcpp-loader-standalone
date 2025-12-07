import { 
    saveSettingsDebounced,
    eventSource,event_types
} from '../../../../script.js';
import { extension_settings } from '../../../extensions.js';

import { SlashCommandParser } from '../../../slash-commands/SlashCommandParser.js';
import { SlashCommand } from '../../../slash-commands/SlashCommand.js';
import { ARGUMENT_TYPE, SlashCommandArgument, SlashCommandNamedArgument } from '../../../slash-commands/SlashCommandArgument.js';

// Variable for saved models.
let kobold_models = [];

// 
let reconnect_attempts = 0;
const max_reconnect_attempts = 300;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function onKoboldURLChanged() {
    extension_settings.koboldapi.url = $(this).val();
    saveSettingsDebounced();
}

function onKoboldTemplateChanged() {
    extension_settings.koboldapi.template = $("#kobold_api_model_list").val();
    $('#kobold_api_template').val(extension_settings.koboldapi.template);
    saveSettingsDebounced();
}

function slashSetTemplate(_, template) {
    extension_settings.koboldapi.template = template;
    $('#kobold_api_template').val(template);
    saveSettingsDebounced();
}

async function loadSettings()
{
    if (! extension_settings.koboldapi )
        extension_settings.koboldapi = { "url": "", "model": ""};
    if ( ! extension_settings.koboldapi.url )
        extension_settings.koboldapi.url = "";
    if ( ! extension_settings.koboldapi.model )
        extension_settings.koboldapi.model = "";
    saveSettingsDebounced();
    await fetchKoboldModels();
}

async function fetchKoboldModels()
{
    await fetch(`${extension_settings.koboldapi.url}/api/admin/list_options`)
        .then((response) => response.json())
        .then((list) => {
            kobold_models=list;
        }).catch(error => console.log("KoboldCCP Loader List Failed: " + error.message));
    return JSON.stringify(kobold_models);
}

async function onModelLoad(args, value){
    extension_settings.koboldapi.model = $('#kobold_api_model_list').val();
    saveSettingsDebounced();

    const modelName = value    ?? $('#kobold_api_model_list').val();

    const body = {
        filename: modelName,
    };
    if (modelName.toLowerCase().indexOf(".gguf") >= 0)
        body.overrideconfig = extension_settings.koboldapi.template;

    await fetch(`${extension_settings.koboldapi.url}/api/admin/reload_config`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-type": "application/json; charset=UTF-8"
        }
    })
    .then( async () => {
        reconnect_attempts = max_reconnect_attempts;
        while (reconnect_attempts > 0)
        {
            reconnect_attempts--;
            console.log("Try to reconnect: " + reconnect_attempts);
            $('#api_button_textgenerationwebui').click();
            await sleep(5000);
            if (reconnect_attempts > 0)
                $('.api_loading').click();
        }
    })
    .catch(error => console.log("KoboldCCP Switch API Load Failed: " + error.message));
}

async function unloadModel() {
    onModelLoad(null, "unload_model");
}

function onStatusChange(e)
{
    if ( e != "no_connection")
        reconnect_attempts = 0;
}

SlashCommandParser.addCommandObject(SlashCommand.fromProps({
    name: "kcpp-list",
    callback: fetchKoboldModels,
    helpString: "Output a list of currently available kcpps config files.",
    returns: "List of kcpps config files",
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({
    name: "kcpp-unload",
    callback: unloadModel,
    helpString: "Unload the current model.",
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({
    name: "kcpp-template",
    callback: slashSetTemplate,
    helpString: "Set a .kcpps model template to load .gguf files directly",
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: ".kcpps config to use for template",
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ]
}));

SlashCommandParser.addCommandObject(SlashCommand.fromProps({
    name: "kcpp-load",
    callback: onModelLoad,
    helpString: "Load/Reload a .kcpps model",
    unnamedArgumentList: [
        SlashCommandArgument.fromProps({
            description: ".kcpps config to load",
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: true,
        }),
    ], /*
    namedArgumentList: [
        SlashCommandNamedArgument.fromProps({
            name: "ctx",
            description: "Model context size",
            typeList: [ARGUMENT_TYPE.NUMBER],
            isRequired: false,
        }),
        SlashCommandNamedArgument.fromProps({
            name: "cmd",
            description: "KCpp extra CLI flags",
            typeList: [ARGUMENT_TYPE.STRING],
            isRequired: false,
        }),
    ],*/
}));

/*
SlashCommandParser.addCommandObject(SlashCommand.fromProps({
    name: "kcpp-unload",
    callback: onModelUnload,
    helpString: "Unload the current KCpp model",
}));
*/

jQuery(async function() {
    const html = `
    <div class="koboldapi_settings">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>KoboldCPP .kcpps Loader</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <div class="flex-container flexFlowColumn">
                    <h4>KoboldCPP Loader Base URL</h4>
                    <input id="kobold_api_url" class="text_pole textarea_compact" type="text" />
                </div>
                <div class="flex-container">
                    <h4>Available .kcpps configurations</h4>
                    <div id="kobold_api_model_reload" title="Refresh model list" data-i18n="[title]Refresh model list" class="menu_button fa-lg fa-solid fa-repeat"></div>
                </div>
                <div class="flex-container flexFlowColumn">
                    <input id="kobold_api_model_list" name="model_list" class="text_pole flex1 wide100p" placeholder="Model name here" maxlength="100" size="35" value="" autocomplete="off">
                </div>
                <div class="flex-container">
                    <input id="kobold_api_load_button" class="menu_button" type="submit" value="Load File" />
                    <input id="kobold_api_template_button" class="menu_button" type="button" value="Use .kccps as Template" />
                </div>
                <div class="flex-container flexFlowColumn">
                    <h4>.kccps Template (for loading .gguf files)</h4>
                    <input id="kobold_api_template" class="text_pole textarea_compact" type="text" />
                    </div>
                </div>
        </div>
    </div>`;

    $('#extensions_settings').append(html);
    eventSource.on(event_types.ONLINE_STATUS_CHANGED, onStatusChange);
    
    await loadSettings();
        
    $('#kobold_api_url').val(extension_settings.koboldapi.url).on('input',onKoboldURLChanged);
    $('#kobold_api_model_reload').on('click', fetchKoboldModels);
    $('#kobold_api_load_button').on('click', onModelLoad);
    $('#kobold_api_template_button').on('click', onKoboldTemplateChanged);
    $('#kobold_api_template').val(extension_settings.koboldapi.template).on('input',onKoboldTemplateChanged);

    $('#kobold_api_model_list')
    .val(extension_settings.koboldapi.model)
    .autocomplete({
        source: (_, response) => {
            return response(kobold_models);
        },
        minLength: 0,
    })
    .focus(function () {
        $(this)
            .autocomplete(
                'search',
                $(this).val(),
            );
    });
});
