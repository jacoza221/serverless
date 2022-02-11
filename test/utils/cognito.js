'use strict';

const awsLog = require('log').get('aws');
const awsRequest = require('@serverless/test/aws-request');
const CognitoIdentityServiceProviderService = require('aws-sdk').CognitoIdentityServiceProvider;

function createUserPool(name, config = {}) {
  const params = Object.assign({}, { PoolName: name }, config);
  return awsRequest(CognitoIdentityServiceProviderService, 'createUserPool', params);
}

function createUserPoolClient(name, userPoolId) {
  const params = {
    ClientName: name,
    UserPoolId: userPoolId,
    ExplicitAuthFlows: ['USER_PASSWORD_AUTH'],
  };
  return awsRequest(CognitoIdentityServiceProviderService, 'createUserPoolClient', params);
}

function deleteUserPool(name) {
  return findUserPoolByName(name).then((pool) =>
    awsRequest(CognitoIdentityServiceProviderService, 'deleteUserPool', { UserPoolId: pool.Id })
  );
}

function deleteUserPoolById(poolId) {
  return awsRequest(CognitoIdentityServiceProviderService, 'deleteUserPool', {
    UserPoolId: poolId,
  });
}

function findUserPoolByName(name) {
  awsLog.debug('find cognito user pool by name %s', name);

  const params = {
    MaxResults: 60,
  };

  const pools = [];
  function recursiveFind(nextToken) {
    if (nextToken) params.NextToken = nextToken;
    return awsRequest(CognitoIdentityServiceProviderService, 'listUserPools', params).then(
      (result) => {
        pools.push(...result.UserPools.filter((pool) => pool.Name === name));
        if (result.NextToken) return recursiveFind(result.NextToken);
        switch (pools.length) {
          case 0:
            return null;
          case 1:
            return pools[0];
          default:
            throw new Error(`Found more than one pool named '${name}'`);
        }
      }
    );
  }

  return recursiveFind();
}

function findUserPools() {
  const params = { MaxResults: 60 };

  const pools = [];
  function recursiveFind(nextToken) {
    if (nextToken) params.NextToken = nextToken;
    return awsRequest(CognitoIdentityServiceProviderService, 'listUserPools', params).then(
      (result) => {
        pools.push(...result.UserPools.filter((pool) => pool.Name.includes(' CUP ')));
        if (result.NextToken) return recursiveFind(result.NextToken);
        return null;
      }
    );
  }

  return recursiveFind().then(() => pools);
}

function describeUserPool(userPoolId) {
  return awsRequest(CognitoIdentityServiceProviderService, 'describeUserPool', {
    UserPoolId: userPoolId,
  }).then((result) => {
    awsLog.debug('cognito.describeUserPool %s %j', userPoolId, result);
    return result;
  });
}

function createUser(userPoolId, username, password) {
  const params = {
    UserPoolId: userPoolId,
    Username: username,
    TemporaryPassword: password,
  };
  return awsRequest(CognitoIdentityServiceProviderService, 'adminCreateUser', params);
}

function setUserPassword(userPoolId, username, password) {
  const params = {
    UserPoolId: userPoolId,
    Username: username,
    Password: password,
    Permanent: true,
  };
  return awsRequest(CognitoIdentityServiceProviderService, 'adminSetUserPassword', params);
}

function initiateAuth(clientId, username, password) {
  const params = {
    ClientId: clientId,
    AuthFlow: 'USER_PASSWORD_AUTH',
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    },
  };
  return awsRequest(CognitoIdentityServiceProviderService, 'initiateAuth', params);
}

module.exports = {
  createUserPool,
  deleteUserPool,
  deleteUserPoolById,
  findUserPoolByName,
  findUserPools,
  describeUserPool,
  createUserPoolClient,
  createUser,
  setUserPassword,
  initiateAuth,
};
