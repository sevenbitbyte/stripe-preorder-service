# stripe-preorder-service

A simple stripe-preorder-service to learn serverless, cognito and stripe. Not sure its ready for prime time, use at your risk in production.


### Developing

 * Create products and SKU on stripe -> https://dashboard.stripe.com/test/orders/products/

Then start service:


 * `yarn`
 * `yarn watch`
 
 Listens on [http://localhost:4000](http://localhost:4000)
 
### Example Client

See: [example/client-api.ts](example/client-api.ts)

## Configuration

### Funding

 * `FUND_GOAL` - The goal amount, defaults to $50,000
 * `FUND_ACCEPTING` - Is fund raising active? Defaults to `false`
 * `FUND_PRE_TOTAL` - Incase we can't reach stripe, pre-cache a total in env
 * `FUND_TITLE` - Title of the funding campaign

### Serverless

Modifiy [serverless.yml](serverless.yml) to suite your CORS requirements

### Stripe

 * `STRIPE_KEY` - Stripe secret key

### Shopify
 * `SHOPIFY_SHOP_NAME` - Shop name
 * `SHOPIFY_APIKEY` - API Key
 * `SHOPIFY_PASSWORD` - API Password

### AWS Cognito

 * `COGNITO_POOL_ID` - Your cognito pool id
 * `COGNITO_REGION` - AWS region of your cognito pool

### Sendy

See `sendy-api` documentation from https://www.npmjs.com/package/sendy-api

 * `SENDY_URL` - Sendy endpoint
 * `SENDY_KEY` - Sendy secret key
 * `SENDY_LIST` - Sendy list to add users to

## Endpoints

### GET /api/v1/funding-status

### POST /api/v1/has-account

### POST /api/v1/mailing-list

### POST /api/v1/create-customer

### POST /api/v1/create-card

### POST /api/v1/create-order

### POST /api/v1/pay-order

### POST /api/v1/list-orders

### POST /api/v1/attach-token
