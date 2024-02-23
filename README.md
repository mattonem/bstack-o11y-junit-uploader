# JUnit uploader for Browserstack Observabilty

This npm cli tool will automatically updoal the latest junit report from your project folder to Browserstack Observability dashboard. 

# Setup

## Install lib

```
npm i  o11y-junit-uploader
```

## Configure your credential

### Via `browserstack.yml`

Create a `browserstack.yml` file to hold your credentials and project details. See below example:

```yml
# =============================
# Set BrowserStack Credentials
# =============================
# Add your BrowserStack userName and acccessKey here or set BROWSERSTACK_USERNAME and
# BROWSERSTACK_ACCESS_KEY as env variables
userName: YOUR_USERNAME
accessKey: YOUR_ACCESS_KEY
buildName: browserstack-build
projectName: Awesome project
```

### Via environment variable

Simply set your credential (username and accesskey) via env variable:

```
export BROWSERSTACK_USERNAME=username
export BROWSERSTACK_ACCESS_KEY=accesskey
```

# How to run

```
npx o11y-junit-uploader
```
