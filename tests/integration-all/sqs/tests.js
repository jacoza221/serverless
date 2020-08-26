'use strict';

const path = require('path');
const { expect } = require('chai');
const hasFailed = require('@serverless/test/has-failed');
const log = require('log').get('serverless:test');

const { getTmpDirPath } = require('../../utils/fs');
const { createSqsQueue, deleteSqsQueue, sendSqsMessage } = require('../../utils/sqs');
const { confirmCloudWatchLogs } = require('../../utils/misc');
const { createTestService, deployService, removeService } = require('../../utils/integration');

describe('AWS - SQS Integration Test', function() {
  this.timeout(1000 * 60 * 100); // Involves time-taking deploys
  let serviceName;
  let stackName;
  let tmpDirPath;
  let queueName;
  const stage = 'dev';

  before(async () => {
    tmpDirPath = getTmpDirPath();
    log.notice(`Temporary path: ${tmpDirPath}`);
    const serverlessConfig = await createTestService(tmpDirPath, {
      templateDir: path.join(__dirname, 'service'),
      filesToAdd: [path.join(__dirname, '..', 'shared')],
      serverlessConfigHook:
        // Ensure unique queues (to avoid collision among concurrent CI runs)
        config => {
          queueName = `${config.service}-basic`;
          config.functions.sqsBasic.events[0].sqs.arn['Fn::Join'][1][5] = queueName;
        },
    });
    serviceName = serverlessConfig.service;
    stackName = `${serviceName}-${stage}`;
    // create existing SQS queue
    // NOTE: deployment can only be done once the SQS queue is created
    log.notice(`Creating SQS queue "${queueName}"...`);
    return createSqsQueue(queueName).then(() => {
      log.notice(`Deploying "${stackName}" service...`);
      return deployService(tmpDirPath);
    });
  });

  after(async function() {
    if (hasFailed(this.test.parent)) return null;
    log.notice('Removing service...');
    await removeService(tmpDirPath);
    log.notice('Deleting SQS queue');
    return deleteSqsQueue(queueName);
  });

  describe('Basic Setup', () => {
    it('should invoke on queue message(s)', () => {
      const functionName = 'sqsBasic';
      const message = 'Hello from SQS!';

      return confirmCloudWatchLogs(`/aws/lambda/${stackName}-${functionName}`, () =>
        sendSqsMessage(queueName, message)
      ).then(events => {
        const logs = events.reduce((data, event) => data + event.message, '');
        expect(logs).to.include(functionName);
        expect(logs).to.include(message);
      });
    });
  });
});
