#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { PipelineStack } from "../lib/pipeline/pipeline-stack";
import { AppFrontendStack } from "../lib/stacks/app-frontend-stack";

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new cdk.App();

new PipelineStack(app, "PipelineStack", {
  env,
  frontendStack: new AppFrontendStack(app, "Frontend", {}),
});
