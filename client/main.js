import m from 'mithril';                                                                       
import { Blaze } from 'meteor/blaze';                                                          
import { Template } from 'meteor/templating';                                                  
import { Tracker } from 'meteor/tracker';                                                      
import { Accounts } from 'meteor/accounts-base';                                               
import './main.html';                                                                          
                                                                                               
// Initialize accounts configuration                                                           
Accounts.ui.config({                                                                           
  passwordSignupFields: 'USERNAME_ONLY'                                                        
});                                                                                            
                                                                                               
// Main App Component                                                                          
const App = {                                                                                  
  oncreate(vnode) {                                                                            
    // Render the login buttons after the component is created                                 
    Tracker.autorun(() => {                                                                    
      const loginDiv = document.getElementById('login-buttons');                               
      if (loginDiv && !loginDiv._blazeView) {                                                  
        // Use the loginButtons template directly                                              
        loginDiv._blazeView = Blaze.render(Template.loginButtons, loginDiv);                   
      }                                                                                        
    });                                                                                        
  },                                                                                           
                                                                                               
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
            m('li', m('div#login-buttons'))                                                    
          ])                                                                                   
        ])                                                                                     
      ]),                                                                                      
                                                                                               
      m('main.container', [                                                                    
        m('section', [                                                                         
          m('h1', 'Welcome to Kokokino Hub'),                                                  
          m('p', 'Your central hub for all Kokokino games and applications.'),                 
                                                                                               
          m('article', [                                                                       
            m('h2', 'What is Kokokino?'),                                                      
            m('p', 'Kokokino is an open‑source COOP where creative people write games and learn from each other.'),                                                                            
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
        m('small', '© 2025 Kokokino COOP. All code is open source.')                           
      ])                                                                                       
    ]);                                                                                        
  }                                                                                            
};                                                                                             
                                                                                               
// Mount the app when DOM is ready                                                             
Meteor.startup(() => {                                                                         
  m.mount(document.getElementById('app'), App);                                                
});    