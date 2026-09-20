const cases = {
  affiliate: {
    kicker: 'Case study 01 / Operational SaaS', title: 'Maroc Affiliate',
    lede: 'A unified cash-on-delivery platform for Moroccan sellers—connecting catalog, inventory, routing, delivery, customer communication, and payouts.', live: 'https://marocaffiliate.com/fr',
    tags: ['Custom SaaS','Inventory','Logistics','WhatsApp automation','Wallet & payouts','Role-based access','FR / AR / EN'],
    sections: [
      ['Challenge','COD operations are often split across spreadsheets, WhatsApp, courier conversations, and informal financial records. Stock, delivery tariffs, order status, and seller margins become difficult to coordinate as volume grows.'],
      ['Solution','One operational platform built around the seller’s workflow. It exposes live variant stock, applies destination tariffs, selects a carrier, reserves inventory, follows the parcel, automates customer messages, and credits the seller wallet after delivery.'],
      ['Key capabilities','Live stock by variant and warehouse; automatic city-based routing; Ozone, G-LOG and internal-fleet delivery; order lifecycle tracking; multilingual WhatsApp journeys; customer history and segments; wallet movements and withdrawals; team permissions and activity logs.'],
      ['Architecture','Localized public site and seller, warehouse, delivery, and administration workspaces connected to inventory, an order-routing engine, carrier integrations, messaging automation, and a financial ledger.'],
      ['Business value','Sellers can focus on sales without operating their own warehouse, courier process, or confirmation infrastructure. Delivery rules become consistent, team responsibilities become visible, and every margin movement has a clear operational source.']
    ]
  },
  erp: {
    kicker: 'Case study 02 / ERP & Construction', title: 'Construction Site ERP',
    lede: 'A custom Odoo 17 construction system connecting site governance, material requests, estimating, BOQ workflows, quality, and project control.',
    tags: ['Odoo 17','Python','PostgreSQL','Inventory','Analytic accounting','RBAC','Docker'],
    gallery: [
      ['odoo-02-chantier-form.png','Controlled chantier lifecycle'],
      ['odoo-03-material-request.png','Material request and procurement visibility'],
      ['odoo-04-estimation.png','Construction estimating and live cost structure'],
      ['odoo-05-boq.png','BOQ revision and approval workflow']
    ],
    sections: [
      ['Challenge','Construction sites need more than task lists. Each site must connect its lifecycle, supplying warehouse, material location, cost structure, managers, and closure conditions. Generic project records leave these relationships fragmented.'],
      ['Solution','A custom Odoo addon that gives every chantier a unique reference and controlled lifecycle. Manager initialization creates its analytic account and internal stock location beneath the selected warehouse.'],
      ['Key capabilities','Chantier numbering; Draft-to-Closed workflow; manager approval and initialization; analytic accounting; dedicated site stock locations; material requests with procurement visibility; construction estimates; BOQ revisions and approvals; daily reports; quality inspections; work packages; issues; RFIs; submittals; variations; and progress certificates.'],
      ['Architecture','Odoo Project provides the project and task foundation. The custom chantier module connects it to native Inventory, Analytic Accounting, company security, PostgreSQL, and a repeatable Docker environment.'],
      ['Verified implementation','The running UAT system exposes dedicated workspaces for material requests, estimating, quality, approved consumption, Tendering & BOQ, and Project Control. Screens shown here use UAT records; modules without populated demo records are described as implemented surfaces without invented usage results.']
    ]
  },
  northstar: {
    kicker: 'Case study 03 / Digital experience', title: 'Northstar',
    lede: 'A cinematic, motion-led website that gives a business-advisory brand a focused and confident digital presence.', live: 'https://demo-beta-seven-31.vercel.app/',
    tags: ['React','Vite','GSAP','ScrollTrigger','Motion design','Vercel'],
    sections: [
      ['Challenge','Professional-service websites often feel interchangeable. Generic layouts and weak hierarchy can make a considered offer appear ordinary before a conversation even begins.'],
      ['Solution','A single-page brand experience structured around a clear hero, four service pillars, the firm’s approach, and a closing call to action. Video, typography, and scroll motion control pace and attention.'],
      ['Key capabilities','Full-viewport video storytelling; scroll-driven chapters; Strategy, Growth, Digital, and People service narratives; responsive typography; media credits; production deployment.'],
      ['Architecture','A React single-page application built with Vite, with GSAP and ScrollTrigger providing the animation layer, static video assets supplying the visual narrative, and Vercel handling deployment.'],
      ['Business value','The experience gives a premium service offer an equally considered public face and creates a clear path from brand impression to service exploration.']
    ]
  }
};

const modal = document.querySelector('#case-modal');
const modalContent = modal.querySelector('.modal-content');
document.querySelectorAll('[data-modal]').forEach(button => button.addEventListener('click', () => {
  const item = cases[button.dataset.modal];
  const liveLink = item.live ? `<a class="modal-live" href="${item.live}" target="_blank" rel="noopener noreferrer"><i></i> Explore the live project <span>↗</span></a>` : '';
  const gallery = item.gallery ? `<div class="case-gallery">${item.gallery.map(([src, caption]) => `<figure><img src="${src}" alt="${caption}" loading="lazy"><figcaption>${caption}</figcaption></figure>`).join('')}</div>` : '';
  modalContent.innerHTML = `<p class="kicker">${item.kicker}</p><h2>${item.title}</h2><p class="modal-lede">${item.lede}</p>${liveLink}<div class="case-stats">${item.tags.map(tag => `<span>${tag}</span>`).join('')}</div>${gallery}${item.sections.map(([heading, copy]) => `<section><h3>${heading}</h3><p>${copy}</p></section>`).join('')}`;
  modal.showModal();
  document.body.style.overflow = 'hidden';
}));
function closeModal(){ modal.close(); document.body.style.overflow = ''; }
modal.querySelector('.modal-close').addEventListener('click', closeModal);
modal.addEventListener('click', event => { if(event.target === modal) closeModal(); });

const menuButton = document.querySelector('.menu-button');
menuButton.addEventListener('click', () => {
  const header = document.querySelector('.site-header');
  const open = header.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('.desktop-nav a').forEach(link => link.addEventListener('click', () => document.querySelector('.site-header').classList.remove('open')));

const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if(entry.isIntersecting){ entry.target.classList.add('visible'); observer.unobserve(entry.target); }
}), {threshold: .12});
document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
