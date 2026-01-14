import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';                                                                                                            
import { Email } from 'meteor/email';                                                                                                                       
import { Migrations } from 'meteor/quave:migrations';
import { Products } from '/lib/collections/products';
import { Apps } from '/lib/collections/apps';
import { ProductOwners } from '/lib/collections/productOwners';
import { AppOwners } from '/lib/collections/appOwners';
import '../lib/collections/users.js';
import '../lib/collections/spokes.js';
import '../lib/collections/ssoNonces.js';
import './methods/subscriptions.js';
import './methods/sso.js';
import './webhooks/lemonSqueezy.js';
import './publications.js';
import './migrations/0_steps.js';
import './api/index.js';
import './api/cleanup.js';
import { isVerifiedUser } from '/imports/utils.js';

// Configure migrations
Migrations.config({
  // Log job run details to console
  log: true,
  // Use a custom logger function (defaults to Meteor's logging package)
  logger: null,
  // Enable/disable logging "Not migrating, already at version {number}"
  logIfLatest: true,
  // migrations collection name to use in the database
  collectionName: "migrations"
});

Meteor.startup(async () => {
  console.log('=== MIGRATIONS STARTUP ===');
  console.log('Checking for pending migrations...');
  
  try {
    // Check current version
    const currentVersion = await Migrations.getVersion();
    console.log('Current migration version in DB:', currentVersion);
    
    // List all registered migrations for debugging
    const migrations = Migrations._migrations || {};
    console.log(`Registered migrations: ${Object.keys(migrations).length}`);
    Object.keys(migrations).forEach(version => {
      console.log(`  Version ${version}: ${migrations[version].name}`);
    });
    
    // Try to migrate to latest regardless
    console.log('Attempting to migrate to latest...');
    try {
      await Migrations.migrateTo('latest');
      const newVersion = await Migrations.getVersion();
      console.log(`✓ Migrations completed successfully. Now at version ${newVersion}`);
    } catch (error) {
      console.error('Migration failed:', error);
    }
    
    // Debug: Check if products exist
    const productCount = await Products.find().countAsync();
    console.log(`Products in database: ${productCount}`);
  } catch (error) {
    console.error('Error running migrations:', error);
    console.error('Error stack:', error.stack);
  }

  // Debug: Check if MAIL_URL is set
  const mailUrl = Meteor.settings?.private?.MAIL_URL;
  if (mailUrl && !process.env.MAIL_URL) {
    process.env.MAIL_URL = mailUrl;
  }

  // Configure accounts to send verification emails                                                                                                         
  Accounts.config({                                                                                                                                         
    sendVerificationEmail: true                                                                                                                             
  });                                                                                                                                                       

  // Configure email "From" address                                                                                                                         
  Accounts.emailTemplates.from = 'Kokokino Hub <info@kokokino.com>';                                                                                     
                                                                                                                                                            
  // Customize the email subject and text                                                                                                        
  Accounts.emailTemplates.siteName = 'Kokokino Hub';                                                                                                        
  Accounts.emailTemplates.verifyEmail.subject = function(user) {                                                                                            
    return 'Verify your email for Kokokino Hub';                                                                                                            
  };                                                                                                                                                        
  Accounts.emailTemplates.verifyEmail.text = function(user, url) {                                                                                          
    return `Welcome to Kokokino Hub!\n\nPlease verify your email by clicking the link below:\n${url}`;                                                      
  };                                                                                                                                                        
 
  // Add error handling for email sending                                                                                                                   
  Accounts.emailTemplates.verifyEmail.html = function(user, url) {                                                                                          
    // Simple HTML version                                                                                                                                  
    return `                                                                                                                                                
      <h2>Welcome to Kokokino Hub!</h2>                                                                                                                     
      <p>Please verify your email by clicking the link below:</p>                                                                                           
      <p><a href="${url}">${url}</a></p>                                                                                                                    
    `;                                                                                                                                                      
  };                                                                                                                                                        
  
  // Add method to resend verification email
  Meteor.methods({
    async resendVerificationEmail() {
      const userId = this.userId;
      if (!userId) {
        throw new Meteor.Error('not-authorized', 'You must be logged in to resend verification email');
      }
      
      const user = await Meteor.users.findOneAsync(userId);
      if (!user) {
        throw new Meteor.Error('user-not-found', 'User not found');
      }
      
      // Check if user has an email address
      if (!user.emails || !user.emails[0]) {
        throw new Meteor.Error('no-email', 'User has no email address');
      }
      
      // Check if already verified using the utility function
      if (isVerifiedUser(user)) {
        throw new Meteor.Error('already-verified', 'Email is already verified');
      }
      
      // Send verification email
      Accounts.sendVerificationEmail(userId, user.emails[0].address);
      
      return true;
    }
  });
  
  // code to run on server at startup                                                                                                                       
});
