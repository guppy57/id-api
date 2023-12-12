import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as apprunner from '@aws-cdk/aws-apprunner-alpha';
import * as ecrassets from 'aws-cdk-lib/aws-ecr-assets';

export class IdApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const idApiImage = new ecrassets.DockerImageAsset(
      this,
      'KreativeIdApiImage',
      {
        directory: '../',
        exclude: ['id-api-stack'],
      },
    );

    const idApiAppRunner = new apprunner.Service(this, 'Service', {
      source: apprunner.Source.fromAsset({
        imageConfiguration: { port: 3000 },
        asset: idApiImage,
      }),
      autoDeploymentsEnabled: true,
    });

    idApiAppRunner.addEnvironmentVariable(
      'DOPPLER_TOKEN',
      process.env.DOPPLER_TOKEN,
    );
  }
}
