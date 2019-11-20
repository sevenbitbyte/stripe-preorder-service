const promisify = require('util').promisify
const AWS = require('aws-sdk')
const Axios = require('axios')
const jsonwebtoken = require('jsonwebtoken')
const jwkToPem = require('jwk-to-pem')
const jsonQuery = require('json-query')
const Hoek = require('@hapi/hoek')

const cognitoPoolId = process.env.COGNITO_POOL_ID || 'us-east-1_n5Lw6eoal';
const cognitoRegion = process.env.COGNITO_REGION || 'us-east-1'

AWS.config.update({region: cognitoRegion});
const Cognito = new AWS.CognitoIdentityServiceProvider();


if (!cognitoPoolId) {
  throw new Error('env var required for cognito pool');
}

const cognitoIssuer = `https://cognito-idp.${cognitoRegion}.amazonaws.com/${cognitoPoolId}`;

let cacheKeys = null;
const getPublicKeys = async () => {
  if (!cacheKeys) {
    const url = `${cognitoIssuer}/.well-known/jwks.json`;
    const publicKeys = await Axios.default.get(url);
    cacheKeys = publicKeys.data.keys.reduce((agg, current) => {
      const pem = jwkToPem(current);
      agg[current.kid] = {instance: current, pem};
      return agg;
    }, {});
    return cacheKeys;
  } else {
    return cacheKeys;
  }
};

const verifyPromised = promisify(jsonwebtoken.verify.bind(jsonwebtoken));

const handler = async (token) => {
  let result = null
  try {
    console.log(`user claim verfiy invoked for ${token}`);
    //const token = request.token;
    const tokenSections = (token || '').split('.');
    if (tokenSections.length < 2) {
      throw new Error('requested token is invalid');
    }
    const headerJSON = Buffer.from(tokenSections[0], 'base64').toString('utf8');
    const header = JSON.parse(headerJSON)
    const keys = await getPublicKeys();
    const key = keys[header.kid];
    if (key === undefined) {
      throw new Error('claim made for unknown kid');
    }
    const claim = await verifyPromised(token, key.pem) 
    const currentSeconds = Math.floor( (new Date()).valueOf() / 1000);
    if (currentSeconds > claim.exp || currentSeconds < claim.auth_time) {
      throw new Error('claim is expired or invalid');
    }
    if (claim.iss !== cognitoIssuer) {
      throw new Error('claim issuer is invalid');
    }
    if (claim.token_use !== 'access') {
      throw new Error('claim use is not access');
    }
    console.log(`claim confirmed for ${claim.username}`);
    
    result = {userName: claim.username, clientId: claim.client_id, isValid: true};

    const userInfo = await new Promise((resolve, reject)=>{
      Cognito.getUser({
        AccessToken: token
      }, (err, data)=>{
        if(!err){resolve(data)}
        else{reject(err)}
      })
    })

    result.email = Hoek.reach(
      jsonQuery('UserAttributes[Name=email]', {data: userInfo}),
      'value.Value'
    )

    result.emailVerified = Hoek.reach(
      jsonQuery('UserAttributes[Name=email_verified]', {data: userInfo}),
      'value.Value'
    ) === 'true'
    
    
  } catch (error) {
    result = {userName: '', clientId: '', error, isValid: false};
  }
  return result;
}

/*
{
  userName: 'foo',
  clientId: 'foobarbazbing',
  isValid: true,
  email: 'foo.bar@baz.com',
  emailVerified: true
}
 */

module.exports = handler
