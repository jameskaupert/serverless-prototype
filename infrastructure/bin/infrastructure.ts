#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AppFrontendStack } from "../lib/app-frontend-stack";

const app = new cdk.App();
new AppFrontendStack(app, "AppFrontendStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
