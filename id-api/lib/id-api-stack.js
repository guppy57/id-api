/* eslint-disable @typescript-eslint/no-var-requires */
const { Stack } = require('aws-cdk-lib');
const apprunner = require('@aws-cdk/aws-apprunner-alpha');
const ecrassets = require('aws-cdk-lib/aws-ecr-assets');

class IdApiStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
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

module.exports = { IdApiStack };
