import m from 'mithril';
import { Tracker } from 'meteor/tracker';
import { Meteor } from 'meteor/meteor';
import { isVerifiedUser } from '/imports/utils.js';
import { Products } from '/lib/collections/products';

const SubscriptionButton = {
  oninit(vnode) {
    this.loading = false;
    this.subscription = null;
    this.userId = null; // Track user ID instead of full user object
    this.product = null;
    
    // Subscribe to products publication
    this.productsHandle = Meteor.subscribe('products');
    
    // Set up Tracker to reactively update when user changes
    this.computation = Tracker.autorun(() => {
      const currentUser = Meteor.user();
      const currentUserId = currentUser ? currentUser._id : null;
      const previousUserId = this.userId;
      const { productId } = vnode.attrs;
      
      // Check if user ID changed (login/logout or different user)
      if (currentUserId !== previousUserId) {
        this.userId = currentUserId;
        
        if (currentUser && productId) {
          // User logged in or changed - load subscription status for this product
          Meteor.call('subscriptions.getStatus', productId, (error, result) => {
            if (!error) {
              this.subscription = result;
            } else {
              this.subscription = null;
            }
            m.redraw();
          });
        } else {
          // User logged out - clear subscription data
          this.subscription = null;
        }
        m.redraw();
      }
      
      // Fetch product details
      if (productId && this.productsHandle.ready()) {
        const product = Products.findOne(productId);
        if (product) {
          this.product = product;
        } else {
          this.product = null;
        }
      }
    });
  },
  
  onremove(vnode) {
    // Clean up Tracker computation when component is destroyed
    if (this.computation) {
      this.computation.stop();
    }
    if (this.productsHandle) {
      this.productsHandle.stop();
    }
  },
  
  view(vnode) {
    const { productId, label = 'Subscribe', variant = 'primary' } = vnode.attrs;
    const user = Meteor.user(); // Get reactive user directly
    
    // If user is not logged in, show login prompt
    if (!user) {
      return m('p', 'Please log in to subscribe.');
    }
    
    // Check if user's email is verified using the utility function
    const emailVerified = isVerifiedUser(user);
    
    // If user is logged in but email is not verified
    if (!emailVerified) {
      return m('div.email-verification-prompt', [
        m('p', [
          m('strong', 'Email verification required'),
          m('br'),
          'Please verify your email address before subscribing.'
        ]),
        m('p.small', 'Check your inbox for the verification email or request a new one from your account settings.')
      ]);
    }
    
    // Check if subscription is still valid based on validUntil date
    const now = new Date();
    let validUntil = this.subscription?.validUntil;
    
    // If validUntil is not available, try to get it from subscription data
    if (!validUntil && this.subscription) {
      // Try to find a valid date from subscription data
      if (this.subscription.renewsAt) {
        validUntil = this.subscription.renewsAt;
      } else if (this.subscription.endsAt) {
        validUntil = this.subscription.endsAt;
      }
    }
    
    const validUntilDate = validUntil ? new Date(validUntil) : null;
    const isSubscriptionValid = validUntilDate && validUntilDate > now;
    
    // User has valid subscription (active or cancelled but not expired)
    if (isSubscriptionValid) {
      const isActive = this.subscription?.status === 'active';
      const isCancelled = this.subscription?.status === 'cancelled';
      
      let statusText = 'Active: ';
      let untilText = 'Renews: ';
      if (isCancelled) {
        statusText = 'Active (cancelled, ends ';
        untilText = 'Valid until: ';
      }
      
      return m('div.subscription-status', [
        m('p', [
          m('strong', statusText),
          this.subscription.planName,
          isCancelled ? ')' : ''
        ]),
        m('p.small', [
          untilText,
          new Date(this.subscription.validUntil).toLocaleDateString()
        ]),
        this.subscription.manageUrl && m('a', {
          href: this.subscription.manageUrl,
          target: '_blank',
          class: 'button button-outline',
          style: 'margin-top: 0.5rem;'
        }, 'Manage Subscription')
      ]);
    }
    
    // No valid subscription - show subscribe button (only if email is verified)
    const buttonLabel = this.product ? `Subscribe to ${this.product.name}` : label;
    return m('button', {
      class: `button button-${variant}`,
      disabled: this.loading || !this.product,
      onclick: () => {
        if (!productId) return;
        this.loading = true;
        m.redraw();
        
        Meteor.call('subscriptions.createCheckout', productId, (error, result) => {
          if (error) {
            console.error('Checkout error:', error);
            alert('Failed to start checkout. Please try again.');
            this.loading = false;
            m.redraw();
          } else {
            window.location.href = result.checkoutUrl;
          }
        });
      }
    }, this.loading ? 'Loading...' : buttonLabel);
  }
};

export default SubscriptionButton;
