#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { IdApiStack } from '../lib/id-api-stack';

const app = new cdk.App();
new IdApiStack(app, 'IdApiStack', {});
