#!/usr/bin/env node
const { program } = require('commander');
const yaml = require('js-yaml');
const fs   = require('fs');
const path = require('path');
const { XMLParser} = require("fast-xml-parser");
const https = require('https');
var FormData = require('form-data');

program
  .option('--browserstack.config <char>', 'BStack yml file', 'browserstack.yml')
  .option('--reportFile <char>', 'JUnit report file to be uploaded');

program.parse();

const options = program.opts();

const configFilename = options['browserstack.config'] 
var doc = {userName: undefined, accessKey: undefined};
try {doc = yaml.load(fs.readFileSync(configFilename, 'utf8'));} catch (e) {}


const username = process.env.BROWSERSTACK_USERNAME || doc.userName;
const key = process.env.BROWSERSTACK_KEY || process.env.BROWSERSTACK_ACCESS_KEY || doc.accessKey;
if(!username || !key)
{
    console.error('Please provide browserstack\'s username and access key.\nYou can set them as environment variable: BROWSERSTACK_USERNAME and BROWSERSTACK_KEY \nor store your credential in a browserstack.yml file as follow: \nuserName: YOUR_USERNAME\naccessKey: YOUR_ACCESS_KEY');
    console.error('Your credentials can be found here: https://www.browserstack.com/accounts/profile/details');
    process.exit(1);
}

function fromDir(startPath, filter) {

    if (!fs.existsSync(startPath)) {
        console.log("no dir ", startPath);
        return;
    }

    var files = fs.readdirSync(startPath);
    var result = [];
    for (var i = 0; i < files.length; i++) {
        var filename = path.join(startPath, files[i]);
        var stat = fs.lstatSync(filename);
        if (stat.isDirectory()) {
            result = result.concat(fromDir(filename, filter)); //recurse
        } else if (filename.endsWith(filter)) {
            result.push(filename)
        };
    };
    return result;
};
xmlFiles = fromDir('./', '.xml');
const alwaysArray = [
    "testsuites.testsuite",
    "testsuites.testsuite.properties.property"
];
const parser = new XMLParser({
    ignoreAttributes: false,
    isArray: (name, jpath, isLeafNode, isAttribute) => { 
        if( alwaysArray.indexOf(jpath) !== -1) return true;
    }
  });
const junitFiles = xmlFiles.filter((aFile) => {
    let jObj = parser.parse(fs.readFileSync(aFile));
    return jObj.testsuites;
});

if(junitFiles)
{
    var latestFile = junitFiles[0];
    for(const aFile of junitFiles)
    {
        if(fs.statSync(aFile).mtime>fs.statSync(latestFile).mtime)
            latestFile = aFile;
    }

    fileToUpload = options.reportFile || latestFile;
    console.log("About to upload report: " + fileToUpload);

    let jObj = parser.parse(fs.readFileSync(fileToUpload));
    let projectName = doc.projectName || jObj.testsuites['@_name'] || 'Junit report uploads';
    let buildName = doc.buildName || jObj.testsuites.testsuite[0]['@_name'] || 'Junit report upload build';
    const form = new FormData();
    form.append('data', fs.readFileSync(fileToUpload), fileToUpload);
    form.append('projectName', projectName);
    form.append('buildName', buildName);
    form.append('tags', 'junit_upload');
    if(jObj.testsuites.testsuite[0].properties)
    {
        const ci = jObj.testsuites.testsuite[0].properties.property.find((each)=> each['@_name'] == 'ci')
        form.append('ci', ci['@_value']);
    }
    const httpsOptions = {
        hostname: 'upload-observability.browserstack.com',
        path: '/upload',
        method: 'POST',
        auth: username+':'+key,
        headers: form.getHeaders()
        };
    const req = https.request(httpsOptions, function (res) {
        const chunks = [];
        
        res.on('data', function (chunk) {
            chunks.push(chunk);
        });
        
        res.on('end', function () {
            const body = Buffer.concat(chunks);
            console.log(body.toString());
        });
        });
    form.pipe(req);
    
}

