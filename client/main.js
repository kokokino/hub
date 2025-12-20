import m from 'mithril';                                                                       
import { Blaze } from 'meteor/blaze';                                                          
import { Template } from 'meteor/templating';                                                  
import { Tracker } from 'meteor/tracker';                                                      
import { Accounts } from 'meteor/accounts-base';                                               
import './main.html';                                                                          
                                                                                               
// Initialize accounts configuration                                                           
Accounts.ui.config({                                                                           
  passwordSignupFields: 'USERNAME_AND_EMAIL'                                                        
});                                                                                            

// Create a reactive store for verification status
const verificationStore = {
  showNotice: false,
  // Function to update and trigger redraw
  update(user) {
    let newValue = false;
    if (user && user.emails && user.emails[0]) {
      newValue = !user.emails[0].verified;
    }
    if (this.showNotice !== newValue) {
      this.showNotice = newValue;
      // Trigger Mithril redraw when value changes
      m.redraw();
    }
  }
};

// Set up Tracker to monitor verification status
Tracker.autorun(() => {
  const user = Meteor.user();
  verificationStore.update(user);
});

// Component to handle Blaze login buttons                                                     
const LoginButtons = {                                                                         
  oncreate(vnode) {                                                                            
    // Render Blaze login buttons into this component                                          
    this.blazeView = Blaze.render(Template.loginButtons, vnode.dom);                           
  },                                                                                           
                                                                                               
  onremove(vnode) {                                                                            
    // Clean up when component is removed                                                      
    if (this.blazeView) {                                                                      
      Blaze.remove(this.blazeView);                                                            
    }                                                                                          
  },                                                                                           
                                                                                               
  view() {                                                                                     
    return m('div');                                                                           
  }                                                                                            
};                                                                                             

// Verification Notice Component
const VerificationNotice = {
  oninit() {
    this.resending = false;
  },
  
  resendEmail() {
    this.resending = true;
    Meteor.call('resendVerificationEmail', (error) => {
      this.resending = false;
      if (error) {
        console.error('Failed to resend verification email:', error);
        alert('Failed to resend verification email. Please try again later.');
      } else {
        alert('Verification email resent! Please check your inbox.');
      }
      m.redraw();
    });
  },
  
  view() {
    if (!verificationStore.showNotice) return null;
    
    return m('div.verification-notice', 
      [
        m('div.notice-content', [
          m('strong.notice-title', 'Email Verification Required'),
          m('p.notice-message', 
            'Please check your email and click the verification link to complete your account setup.'),
          m('button.resend-button', 
            {
              onclick: () => this.resendEmail(),
              disabled: this.resending
            },
            this.resending ? 'Sending...' : 'Resend Email'
          )
        ])
      ]
    );
  }
};
                                                                                               
// Main App Component                                                                          
const App = {                                                                                  
  view() {                                                                                     
    return m('div', [                                                                          
      m('header', [                                                                            
        m('nav.container-fluid', [                                                             
          m('ul', [                                                                            
            m('li', m('strong', 'Kokokino Hub'))                                               
          ]),                                                                                  
          m('ul', [                                                                            
            m('li', m('a[href="#"]', {onclick: () => {}}, 'Home')),                            
            m('li', m('a[href="#"]', {onclick: () => {}}, 'Apps')),                            
            m('li', m('a[href="#"]', {onclick: () => {}}, 'Billing')),                         
            m('li', m(LoginButtons))                                                           
          ])                                                                                   
        ])                                                                                     
      ]),                                                                                      
                                                                                               
      m('main.container', [                                                                    
        // Add verification notice at the top of main content
        m(VerificationNotice),
        m('section', [                                                                         
          m('h1', 'Welcome to Kokokino Hub'),                                                  
          m('p', 'Your central hub for all Kokokino games and applications.'),                 
                                                                                               
          m('article', [                                                                       
            m('h2', 'What is Kokokino?'),                                                      
            m('p', 'Kokokino is an open‑source cooperative where creative people write games and learn from each other.'),                                                                            
            m('p', 'All games are open source but monetized through monthly subscriptions to keep the servers running.')                                                                    
          ]),                                                                                  
                                                                                               
          m('article', [                                                                       
            m('h2', 'Subscription Model'),                                                     
            m('ul', [                                                                          
              m('li', [m('strong', 'Base monthly charge: $2'), ' - Access to fundamental apps and games']),                                                                                  
              m('li', 'Additional subscriptions for ambitious games with extra development costs')                                                                                        
            ])                                                                                 
          ]),                                                                                  
                                                                                               
          m('article', [                                                                       
            m('h2', 'Available Apps'),                                                         
            m('div.grid', [                                                                    
              m('div', [                                                                       
                m('article', [                                                                 
                  m('h3', 'Backlog Beacon'),                                                   
                  m('p', 'Track your personal video game collection'),                         
                  m('footer', m('small', 'Included in base subscription'))                     
                ])                                                                             
              ]),                                                                              
              m('div', [                                                                       
                m('article', [                                                                 
                  m('h3', 'Coming Soon'),                                                      
                  m('p', 'More games and apps from our community'),                            
                  m('footer', m('small', 'Various subscription levels'))                       
                ])                                                                             
              ])                                                                               
            ])                                                                                 
          ])                                                                                   
        ])                                                                                     
      ]),                                                                                      
                                                                                               
      m('footer.container-fluid', [                                                            
        m('small', `© ${new Date().getFullYear()} Kokokino. All code is open source.`)                           
      ])                                                                                       
    ]);                                                                                        
  }                                                                                            
};                                                                                             
                                                                                               
// Mount the app when DOM is ready                                                             
Meteor.startup(() => {                                                                         
  m.mount(document.getElementById('app'), App);                                                
});                                                                                            
