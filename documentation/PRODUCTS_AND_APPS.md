# Products and Apps Architecture Plan                                                                                                                       
                                                                                                                                                            
## Overview                                                                                                                                                 
We're transitioning from a single-subscription model to a multi-product system where:                                                                       
1. **Base Subscription** ($2/month) - Required for all users                                                                                                
2. **Optional Product Subscriptions** - Additional monthly charges for ambitious projects                                                                   
3. **Apps** - Individual applications/games that are unlocked by specific products                                                                          
                                                                                                                                                            
## Collections Design                                                                                                                                       
                                                                                                                                                            
### 1. Products Collection (`lib/collections/products.js`)                                                                                                  
```javascript                                                                                                                                               
// Schema for Products collection                                                                                                                           
{                                                                                                                                                           
  _id: String,           // Meteor-generated ID                                                                                                             
  name: String,          // Display name (e.g., "Base Monthly")                                                                                             
  description: String,    // Detailed description                                                                                                           
  sortOrder: Number,     // Display order (lower = first)                                                                                                   
  lemonSqueezyProductId: String,     // Lemon Squeezy product ID (e.g., "739029")
  lemonSqueezyBuyLinkId: String,     // Lemon Squeezy checkout link UUID                                                                                   
  pricePerMonthUSD: Number,  // Decimal price (e.g., 2.00)                                                                                                  
  gitHubURL: String,     // Optional GitHub repo link                                                                                                       
  paymentInstructions: String, // Payment details for owners                                                                                                
  isApproved: Boolean,   // Default: false                                                                                                                  
  createdAt: Date,                                                                                                                                          
  updatedAt: Date,                                                                                                                                          
  createdBy: String,     // User ID who created this                                                                                                        
  isRequired: Boolean,     // Is this product required? (Base subscription)                                                                                   
  isActive: Boolean        // Soft delete flag                                                                                                                
}                                                                                                                                                           
```

### 2. Apps Collection (`lib/collections/apps.js`)                                                                                                                

```javascript                                                                                                                                                            
// Schema for Apps collection                                                                                                                               
{                                                                                                                                                           
  _id: String,           // Meteor-generated ID                                                                                                             
  name: String,          // Display name (e.g., "Backlog Beacon")                                                                                           
  description: String,   // Detailed description                                                                                                            
  productId: String,     // References Products._id                                                                                                         
  gitHubURL: String,     // Optional GitHub repo link                                                                                                       
  ageRating: String,     // ESRB rating (e.g., "E", "T", "M")                                                                                               
  isApproved: Boolean,   // Default: false                                                                                                                  
  createdAt: Date,                                                                                                                                          
  updatedAt: Date,                                                                                                                                          
  createdBy: String,     // User ID who created this                                                                                                        
  isActive: Boolean        // Soft delete flag                                                                                                                
}                                                                                                                                                           
```

### 3. Join Collections (Many-to-Many Relationships)                                                                                                            

#### ProductOwners (`lib/collections/productOwners.js`)                                                                                                            

```javascript                                                                                                                                                            
{                                                                                                                                                           
  _id: String,                                                                                                                                              
  productId: String,     // References Products._id                                                                                                         
  userId: String,       // References Meteor.users._id                                                                                                      
  role: String,         // "owner", "maintainer", "contributor"                                                                                             
  sharePercentage: Number, // Decimal percentage (0-100)                                                                                                    
  createdAt: Date,                                                                                                                                          
  createdById: String     // Who assigned this ownership: References Meteor.users._id
}                                                                                                                                                           
```

#### AppOwners (`lib/collections/appOwners.js`)                                                                                                                    

```javascript                                                                                                                                                            
{                                                                                                                                                           
  _id: String,                                                                                                                                              
  appId: String,         // References Apps._id                                                                                                             
  userId: String,       // References Meteor.users._id                                                                                                      
  role: String,         // "owner", "maintainer", "contributor"                                                                                             
  sharePercentage: Number, // Decimal percentage (0-100)                                                                                                    
  createdAt: Date,                                                                                                                                          
  createdById: String     // Who assigned this ownership: References Meteor.users._id
}                                                                                                                                                           
```

## User Subscription Data Structure

The user subscription data is stored in the `lemonSqueezy` field on the user document.
Each user can have multiple subscriptions, one per Kokokino product.

```javascript
user.lemonSqueezy: {
  customerId: String,              // Lemon Squeezy customer ID
  lastWebhookReceived: Date,       // Timestamp of last webhook processed
  subscriptions: [{
    subscriptionId: String,        // Lemon Squeezy subscription ID
    kokokinoProductId: String,     // References our Products._id (KEY IDENTIFIER)
    lemonSqueezyProductId: String, // Lemon Squeezy product ID
    lemonSqueezyVariantId: String, // Lemon Squeezy variant ID
    customerId: String,            // Lemon Squeezy customer ID
    productName: String,           // Display name from Lemon Squeezy
    variantName: String,           // Variant name from Lemon Squeezy
    status: String,                // "active", "cancelled", "paused", "past_due", "unpaid", "on_trial", "expired"
    validUntil: Date,              // When access expires (calculated from status and dates)
    renewsAt: Date,                // Next renewal date (null if cancelled/paused)
    endsAt: Date,                  // When subscription ends (for cancelled subscriptions)
    trialEndsAt: Date,             // Trial end date (for trial subscriptions)
    pause: {                       // Pause information (null if not paused)
      mode: String,                // Pause mode
      resumesAt: Date              // When subscription resumes
    },
    customerPortalUrl: String,     // URL for customer to manage subscription
    createdAt: Date,
    updatedAt: Date
  }]
}
```

### Key Design Decisions

1. **One subscription per product per user**: The `kokokinoProductId` is the key identifier. When a webhook arrives, we upsert based on this field.

2. **Subscriptions are removed on expiry**: When a subscription expires, it's removed from the array entirely.

3. **validUntil is calculated**: Based on subscription status:
   - Active: `renewsAt`
   - Paused: `pause.resumesAt`
   - Cancelled: `endsAt`
   - On trial: `trialEndsAt` or `renewsAt`
   - Expired: `endsAt`

4. **Product lookup via lemonSqueezyProductId**: When a webhook arrives, we look up our product using the `lemonSqueezyProductId` from the webhook payload (e.g., "739029"). This is authoritative and not user-controllable.

## Security Model

### Why we don't pass kokokino_product_id in checkout URL

Previously, we passed `kokokino_product_id` in the checkout URL's custom data. This was a security vulnerability:

1. User clicks subscribe for Product A ($2/month)
2. URL contains `kokokino_product_id=A`
3. Attacker modifies URL to `kokokino_product_id=B` (expensive product)
4. Attacker pays $2 for Product A
5. Webhook arrives with attacker's `kokokino_product_id=B`
6. System grants access to Product B

### Current secure approach

1. Each Kokokino product has a `lemonSqueezyProductId` field (e.g., "739029")
2. Checkout URL only contains `user_id` in custom data
3. When webhook arrives, we extract `attributes.product_id` from the payload
4. We look up our product by `lemonSqueezyProductId`
5. The `lemonSqueezyProductId` comes from Lemon Squeezy's servers, not user input

This ensures users can only get access to the product they actually paid for.

## Querying Active Subscriptions

To find users with active subscriptions to a specific product:

```javascript
// Find users with active subscription to a specific product
const query = {
  'lemonSqueezy.subscriptions': {
    $elemMatch: {
      kokokinoProductId: productId,
      status: 'active',
      validUntil: { $gt: new Date() }
    }
  }
};

// Find users with any active subscription
const queryAny = {
  'lemonSqueezy.subscriptions': {
    $elemMatch: {
      status: 'active',
      validUntil: { $gt: new Date() }
    }
  }
};
```

## Webhook Flow

When Lemon Squeezy sends a webhook:

1. **Verify signature** using HMAC-SHA256 with webhook secret

2. **Extract user_id** from `data.meta.custom_data`

3. **Look up Kokokino product** using `attributes.product_id` (Lemon Squeezy's product ID):
   ```javascript
   const lemonSqueezyProductId = String(attributes.product_id);
   const kokokinoProduct = await Products.findOneAsync({ lemonSqueezyProductId });
   ```

4. **Build subscription data** from webhook attributes including:
   - Lemon Squeezy IDs (subscription, product, variant, customer)
   - Status and dates (validUntil, renewsAt, endsAt, etc.)
   - Customer portal URL

5. **Upsert subscription** in user's `lemonSqueezy.subscriptions` array:
   - Key on `kokokinoProductId`
   - Update existing or push new subscription

6. **Handle expiry**: On `subscription_expired` event, remove the subscription from the array.

## Checkout Flow

When a user clicks Subscribe:

1. **Validate**: Check user is logged in, email verified, no existing active subscription for this product

2. **Build checkout URL** with only user_id in custom data:
   ```
   https://{storeName}.lemonsqueezy.com/checkout/buy/{buyLinkId}
     ?checkout[email]={userEmail}
     &checkout[custom][user_id]={userId}
   ```

3. **Redirect** user to Lemon Squeezy checkout

4. **Webhook** arrives after successful payment, creating the subscription

## Migration Strategy                                                                                                                                          

### 1. Install Migration Package                                                                                                                                

```bash                                                                                                                                                            
meteor add quave:migrations
# https://packosphere.com/quave/migrations
```

### 2. Initial Migration (`server/migrations/1_initial_products.js`)                                                                                              

```javascript                                                                                                                                                            
import { Migrations } from 'meteor/quave:migrations';                                                                                                   
import { Products } from '/lib/collections/products';                                                                                                           
import { Apps } from '/lib/collections/apps';                                                                                                                   
                                                                                                                                                            
Migrations.add({                                                                                                                                            
  version: 1,                                                                                                                                               
  name: 'Create initial base product and apps',                                                                                                             
  up: async function() {                                                                                                                                                    
    // Create Base Monthly Product                                                                                                                          
    const baseProductId = await Products.insertAsync({                                                                                                                 
      name: 'Base Monthly',                                                                                                                                 
      description: 'Access to fundamental apps and games including Backlog Beacon',                                                                         
      sortOrder: 0,                                                                                                                                         
      pricePerMonthUSD: 2.00,
      lemonSqueezyProductId: '739029',
      lemonSqueezyBuyLinkId: '53df2db1-9867-460f-86b4-fc317238b88a', 
      isApproved: true,                                                                                                                                     
      isRequired: true,                                                                                                                                       
      isActive: true,                                                                                                                                         
      createdAt: new Date(),                                                                                                                                
      updatedAt: new Date(),                                                                                                                                
      createdBy: 'system'                                                                                                                                   
    });                                                                                                                                                     
                                                                                                                                                            
    // Create Backlog Beacon App                                                                                                                            
    await Apps.insertAsync({                                                                                                                                           
      name: 'Backlog Beacon',                                                                                                                               
      description: 'Track your personal video game collection',                                                                                             
      productId: baseProductId,                                                                                                                             
      ageRating: 'E',                                                                                                                                       
      isApproved: true,                                                                                                                                     
      isActive: true,                                                                                                                                         
      createdAt: new Date(),                                                                                                                                
      updatedAt: new Date(),                                                                                                                                
      createdBy: 'system'                                                                                                                                   
    });                                                                                                                                                     
  },                                                                                                                                                        
  down: async function() {                                                                                                                                  
    // Rollback if needed                                                                                                                                   
    await Products.removeAsync({});                                                                                                                         
    await Apps.removeAsync({});                                                                                                                             
  }                                                                                                                                                         
});                                                                                                                                                         
```

## Implementation Status

### Completed

- [x] Create Products and Apps collections
- [x] Create ProductOwners and AppOwners join collections
- [x] Set up migration system with quave:migrations
- [x] Run initial migration for base product and Backlog Beacon app
- [x] Update webhooks to use new `lemonSqueezy.subscriptions` array structure
- [x] Look up kokokinoProductId from lemonSqueezyProductId in webhook (secure approach)
- [x] Update `subscriptions.getStatus` method to accept productId
- [x] Update `subscriptions.createCheckout` to use simplified URL (no kokokino_product_id)
- [x] Update `activeSubscriberCount` publication to accept productId
- [x] Update SubscriberCount component to accept productId prop
- [x] Update SubscriptionButton component to work with productId
- [x] Create ProductList component
- [x] Update HomePage to use base product from database
- [x] Create AppsList component (shows apps with their associated product names)

### Pending

- [ ] Create admin pages for managing products/apps
- [ ] Add approval workflows
- [ ] Add ownership management UI
- [ ] Create UserProducts component (shows user's current subscriptions)

## Server Methods

### `subscriptions.getStatus(productId)`
Get subscription status for a specific product (or any active subscription if productId is null).

### `subscriptions.getAll()`
Get all subscriptions for the current user.

### `subscriptions.createCheckout(productId)`
Create a checkout URL for a specific product.

### `subscriptions.getUserProducts()`
Get user's subscriptions with full product details.

### `products.getAll()`
Get all approved, active products.

### `products.getById(productId)`
Get a specific product by ID.

### `products.getApps(productId)`
Get all approved, active apps for a specific product.

## Publications

### `currentUser`
Publishes user data including `lemonSqueezy.customerId` and `lemonSqueezy.subscriptions`.

### `activeSubscriberCount(productId)`
Publishes count of active subscribers for a specific product (or all products if productId is null).

### `products`
Publishes all approved, active products.

### `apps`
Publishes all approved, active apps.

## UI Components

### `ProductList`
Displays all approved, active products with:
- Product name and description
- Price per month
- Subscriber count (using `SubscriberCount` component)
- Subscribe button (using `SubscriptionButton` component)

### `AppsList`
Displays all approved, active apps with:
- App name and description
- Associated product name ("Included in {Product Name}")
- "Coming Soon" placeholder card at the end

### `SubscriberCount`
Displays the count of active subscribers for a specific product or all products.
- Accepts optional `productId` prop
- Uses reactive publication for real-time updates

### `SubscriptionButton`
Handles subscription flow for a specific product:
- Shows login prompt if not logged in
- Shows email verification prompt if email not verified
- Shows subscription status if already subscribed
- Shows subscribe button with checkout flow

## Security Considerations                                                                                                                                     

1. **Publications Security**: Only publish approved, active products                                                                                            
2. **Method Security**: Check user permissions for admin methods                                                                                                
3. **Ownership Security**: Validate ownership assignments                                                                                                       
4. **Webhook Security**: Verify signature using HMAC-SHA256
5. **Product Lookup Security**: Always look up kokokinoProductId from lemonSqueezyProductId in webhook payload, never trust user-provided custom data for product identification

## Future Enhancements                                                                                                                                         

1. Product Bundles: Combine multiple products                                                                                                               
2. Tiered Pricing: Different price points for same product                                                                                                  
3. Trial Periods: Free trials for products                                                                                                                  
4. Family Plans: Share subscriptions across users                                                                                                           
5. Analytics: Track product popularity and revenue                                                                                                          

---
Last Updated: 2026-01-09
