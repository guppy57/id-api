#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

const cdk = require('aws-cdk-lib');
const { IdApiStack } = require('../lib/id-api-stack');

const app = new cdk.App();
new IdApiStack(app, 'IdApiStack', {});
