import { aws_apigateway, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";

export class AppBackendStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id);

    const api = new aws_apigateway.RestApi(this, "RestApi", {});

    const books = api.root.addResource("books");
    books.addMethod("GET");
    books.addMethod("POST");
  }
}
