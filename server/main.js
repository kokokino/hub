import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';                                                                                                            
import { Email } from 'meteor/email';                                                                                                                       

Meteor.startup(() => {
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
  
  // code to run on server at startup                                                                                                                       
});
