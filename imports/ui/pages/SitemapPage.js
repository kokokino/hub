import m from 'mithril';
import { Tracker } from 'meteor/tracker';
import { Meteor } from 'meteor/meteor';
import { Apps } from '/lib/collections/apps';
import { routeLink } from '/imports/utils.js';

const SitemapPage = {
  oninit() {
    this.apps = [];
    this.ready = false;

    this.autorun = Tracker.autorun(() => {
      const appsReady = Meteor.subscribe('apps').ready();
      this.ready = appsReady;

      if (this.ready) {
        this.apps = Apps.find({
          isApproved: true,
          isActive: true
        }).fetch();
      }
      m.redraw();
    });
  },

  onremove() {
    if (this.autorun) {
      this.autorun.stop();
    }
  },

  view() {
    return m('section', [
      m('h1', 'Sitemap'),
      m('p', 'Browse all pages and apps available on Kokokino.'),

      m('article', [
        m('h2', 'Main Pages'),
        m('ul', [
          m('li', m('a', routeLink('/'), 'Home')),
          m('li', m('a', routeLink('/about'), 'About Kokokino')),
          m('li', m('a', routeLink('/faq'), 'Frequently Asked Questions')),
          m('li', m('a', routeLink('/contact'), 'Contact Us')),
          m('li', m('a', routeLink('/privacy'), 'Privacy Policy')),
          m('li', m('a', routeLink('/secure-payments'), 'Secure Payments'))
        ])
      ]),

      m('article', [
        m('h2', 'Apps & Games'),
        !this.ready
          ? m('p', 'Loading...')
          : this.apps.length > 0
            ? m('ul', this.apps.map(app => {
                const slug = app.slug || app._id;
                return m('li', { key: app._id },
                  m('a', routeLink(`/apps/${slug}`), app.name)
                );
              }))
            : m('p', 'No apps available yet.')
      ]),

      m('article', [
        m('h2', 'Resources'),
        m('ul', [
          m('li', m('a', {
            href: 'https://github.com/kokokino/hub',
            target: '_blank',
            rel: 'noopener noreferrer'
          }, 'Hub Source Code (GitHub)')),
          m('li', m('a', {
            href: 'https://github.com/kokokino/spoke_app_skeleton',
            target: '_blank',
            rel: 'noopener noreferrer'
          }, 'Spoke App Skeleton (GitHub)')),
          m('li', m('a', {
            href: '/sitemap.xml',
            target: '_blank'
          }, 'XML Sitemap'))
        ])
      ])
    ]);
  }
};

export default SitemapPage;
