const path = require('path');
const file = require('fs-extra');
const homedir = require('os').homedir();
const configFilePath = path.join(homedir, 'lsconfig.json')

const LimeAPI = require('./LimeAPI.cjs.js');
const defaultConfig = require('./default.config.json');

const getConfig = function (force = false, alternativePath = null) {

    let config = null;
    try {
        config = file.readJsonSync(alternativePath || configFilePath);
    } catch (e) {
        throw new Error("Congif file misconfigured or not available");
    }
    return config;
}

const setConfig = function (alternativePath = null, defineOptions = null) {

    let currentConfig = null;
    try {
        currentConfig = getConfig(alternativePath);
    } catch (e) {}

    currentConfig = currentConfig || defaultConfig;
    if(defineOptions != null) {
        currentConfig = Object.assign(currentConfig, defineOptions);
    }
    file.writeJsonSync(configFilePath, currentConfig);
    getConfig(true, null);
}


async function run(command, params, verbosity) {
    setConfig();
    const config = getConfig();
    console.log("Running API call with verbostiy level: " + verbosity );
    if(verbosity > 2) {
        console.log(config);
    }
    const limeApi = new LimeAPI(config, verbosity);
    
    await limeApi.getAuthToken(true);
    const callResult = await limeApi.runCall(command, params, true);
    const dateStamp = (new Date()).getTime();
    console.log("Call successful: ", callResult);
}

async function runExport(command, params, filename, verbosity) {
    setConfig();
    
    const limeApi = new LimeAPI(getConfig(), verbosity);
    
    await limeApi.getAuthToken(true);

    const callResult = await limeApi.runCall(command, params, true);
    if(callResult == null) {
        console.log("No data to export. Exiting");
        return;
    }
    const dateStamp = Math.round((new Date()).getTime()/1000);
    file.writeFileSync(path.join(homedir, 'Downloads', 'API_'+dateStamp+'_'+filename), Buffer.from(callResult, 'base64').toString('utf8'));
    console.log("File "+path.join(homedir, 'Downloads', 'API_'+dateStamp+'_'+filename)+' successfully written');
}
//const callResult = await limeApi.runCall('export_responses', ['654677', 'csv', 'de', 'all', 'full', 'long'], true);

require('yargs')
    .scriptName("LimeAPI")
    .usage('$0 <cmd> [args]')
    .command('setup [url] [username] [password]', 'Setup the URL for your instance', (yargs) => {
        yargs.positional('url', {
            type: 'string',
            default: "https://limesurvey.localhost/index.php/admin/remotecontrol",
            describe: 'The URL of your instance'
        })
        yargs.positional('username', {
            type: 'string',
            default: 'admin',
            describe: 'The username you would login into LimeSurvey with'
        })
        yargs.positional('password', {
            type: 'string',
            default: 'password',
            describe: 'The password you would use for LimeSurvey'
        })
    }, function (argv) {
        setConfig(null, {
            url: argv.url,
            username: argv.username,
            password: argv.password
        }});
        console.log('URL and credentials successfully set');
    })
    .command('run [apicommand] [parameters]', 'Run command against the LimeSurvey RPC', (yargs) => {
        yargs.positional('apicommand', {
            type: 'string',
            describe: 'The method you want to call, please see https://api.limesurvey.org/classes/remotecontrol_handle.html for documentation'
        })
    }, function (argv) {
        console.log('Running '+argv.apicommand+' against the API');
        run(argv.apicommand, argv.parameters, argv.verbose);
    })
    .command('runExport [command] [filename] [parameters]', 'Run command against the LimeSurvey RPC that exports a file', (yargs) => {
        yargs.positional('command', {
            type: 'string',
            describe: 'The method you want to call, please see https://api.limesurvey.org/classes/remotecontrol_handle.html for documentation'
        })
        yargs.positional('filename', {
            type: 'string',
            describe: 'The file you want to save to. Will be located in '+ path.join(homedir, 'Downloads')
        })
    }, function (argv) {
        console.log('Running '+argv.command+' against the API');
        runExport(argv.command, argv.parameters, argv.filename, argv.verbose);
    })
    .option('p', {
        alias: 'parameters',
        type: 'array'
    })
    .option('v', {
        alias: 'verbose',
        type: 'boolean',
        count: true
    })
    .help()
    .argv
