const Stripe = require('stripe')

console.log(process.env.STRIPE_KEY)


const PRODUCTS = {
  processor: {
    producr: {
      name: 'processor',
      description: 'Processor Type',
      type: 'good',
      shippable: true,
      active: true,
      attributes: ['lora', 'processor']
    },
    sku: {
      gr8: {
        price: 0,
        active: true,
        attributes: {
          processor: 'gr8'
        },
        inventory: {
          type: 'finite',
          quantity: 450
        }
      }
    }
  },
  pocket: {
    product: {
      name: 'pocket-pc',
      description: 'Pocket Popcorn Computer',
      type: 'good',
      shippable: true,
      active: true,
      attributes: ['lora', 'processor', 'sku', 'rf-region']
    },
    sku: {
      'pocket-pc': {
        price: 20000,
        active: true,
        attributes: {
          sku: 0,
          lora: false,
          processor: 'gr8'
        }
      },
      'pocket-pc-lora-eu': {
        price: 29900,
        active: true,
        attributes: {
          sku: 1,
          lora: true,
          processor: 'gr8',
          'rf-region': 'eu'
        }
      },
      'pocket-pc-lora': {
        price: 29900,
        active: true,
        attributes: {
          sku: 1,
          lora: true,
          processor: 'gr8',
          'rf-region': 'eu-us-as-kr-in-au'
        }
      },
      'pocket-pc-lora-cn': {
        price: 29900,
        active: true,
        attributes: {
          sku: 1,
          lora: true,
          processor: 'gr8',
          'rf-region': 'cn'
        }
      }
    }
  },
  'popcorn-computer': {
    product: {
      name: 'popcorn-computer',
      description: 'Pocket Popcorn Computer',
      type: 'good',
      shippable: true,
      active: true,
      attributes: ['processor', 'sku']
    },
    sku: {
      'original': {
        price: 4900,
        active: true,
        attributes: {
          sku: 2,
          processor: 'r8'
        }
      }
    }
  }
}

const BUNDLES = {
  'pocket-preorder': {
    items: ['processor.gr8', 'pocket.pocket-pc']
  },
  'pocket-lora-preorder': {
    items: ['processor.gr8', 'pocket.pocket-pc-lora']
  },

}

let stripe = Stripe(process.env.STRIPE_KEY)

class ProductSKUListing {
  constructor(stripe){
    //
  }

  async addProduct(details){}

  async addSKU(productNameOrId, details){}

  async getInventory()
}

/**
 * 1. create products
 * 2. create SKUs
 */


