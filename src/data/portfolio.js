import { cases } from './cases.js';
export const email = 'aymane.chellak@outlook.fr';
export const team = [
  { name: 'Aymane Chellak', role: 'Co-founder · Software engineer', email: 'aymane.chellak@outlook.fr' },
  { name: 'Zakaria Bak', role: 'Co-founder', email: 'Zakariasurface@outlook.com' },
];
// Profile links. Leave a value empty to hide that link everywhere it is rendered.
export const links = { linkedin: 'https://www.linkedin.com/in/your-favorite-engineer', github: '' };
export const projects = [
  { id: 'affiliate', coverAlt: 'Sage parcels connected by chrome delivery routes on sculptural stone platforms.', category: 'Platforms', label: 'COMMERCE & LOGISTICS', status: 'Live product', cover: 'affiliate', tone: 'sage', headline: 'An entire operation.\nOne connected platform.', summary: 'From the first order to the final payout. A connected workspace for cash-on-delivery commerce.', ...cases.affiliate },
  { id: 'studioNorth', coverAlt: 'Lavender glass arches and silver coins in a sculptural finance still life.', category: 'Interfaces', label: 'FINANCE & PRODUCT DESIGN', status: 'Product interface', cover: 'invoices', tone: 'lavender', summary: 'Making financial complexity feel remarkably simple.', ...cases.studioNorth },
  { id: 'erp', coverAlt: 'Sandstone architectural model with a brass construction crane.', category: 'Platforms', label: 'ERP & CONSTRUCTION', status: 'User acceptance testing', cover: 'erp', tone: 'sand', summary: 'Giving every construction site a clearer operating picture.', ...cases.erp },
  { id: 'crm', coverAlt: 'Mint glass spheres connected into a sculptural relationship network.', category: 'Platforms', label: 'CRM & SALES OPERATIONS', status: 'Sales workspace', cover: 'crm', tone: 'mint', summary: 'Relationships, pipeline, and follow-up. Finally connected.', ...cases.crm },
  { id: 'northstar', coverAlt: 'Copper compass star suspended above dark stone plinths.', category: 'Interfaces', label: 'BRAND & DIGITAL EXPERIENCE', status: 'Live website', cover: null, tone: 'copper', summary: 'A considered digital presence for a business-advisory brand.', ...cases.northstar },
];
export const services = [
  { title: 'Products with purpose.', body: 'SaaS platforms, portals, and internal tools shaped around the people who use them. Clear interfaces backed by thoughtful architecture.', tags: ['Product engineering', 'SaaS', 'Web interfaces'], icon: 'grid' },
  { title: 'Operations, connected.', body: 'Bring sales, inventory, projects, and finance into one coherent workflow. Build on what works and connect what is missing.', tags: ['ERP / CRM', 'Odoo', 'Integrations'], icon: 'connect' },
  { title: 'Intelligence that helps.', body: 'Practical automation and AI assistance for the repetitive, fragmented parts of work. Clear boundaries, useful outputs, and human review.', tags: ['Automation', 'Document intelligence', 'AI systems'], icon: 'spark' },
];
export const steps = [
  { title: 'Understand.', subtitle: 'The right problem comes first.', description: 'Map the actual work, decisions, data, and handoffs. Find the constraint before choosing the technology.', output: 'A shared problem statement and a clear first priority.', diagram: ['People', 'Workflows', 'Constraints'] },
  { title: 'Architect.', subtitle: 'Make the whole system make sense.', description: 'Define the roles, data model, integrations, and useful first release. Make the important decisions while changes are still inexpensive.', output: 'A system blueprint and an achievable first release.', diagram: ['Data model', 'Interfaces', 'Integrations'] },
  { title: 'Build.', subtitle: 'Turn the plan into something useful.', description: 'Deliver in focused slices, test complete journeys, and validate decisions with real use. Keep the implementation close to the operational need.', output: 'Working software, tested against real workflows.', diagram: ['Implement', 'Test', 'Validate'] },
  { title: 'Evolve.', subtitle: 'Good systems keep getting better.', description: 'Deploy with care, prepare recovery paths, and observe the system in context. Use operational feedback to guide the next improvement.', output: 'A supported release and a practical improvement plan.', diagram: ['Release', 'Observe', 'Improve'] },
];
export const questions = [
  ['What kinds of projects are a good fit?', 'SaaS products, ERP and CRM workflows, internal tools, and automation where the operational problem is clear. If your team is coordinating work across disconnected tools, start by describing where context or time gets lost.'],
  ['Can you improve an existing system?', 'Yes. Share the current tools, integrations, and the parts that already work. We start by understanding the constraints and deciding what to preserve, connect, or improve.'],
  ['How do we define scope, budget, and timing?', 'These depend on your workflows, integrations, and delivery requirements. Bring your target date and budget range so we can identify a realistic first release and agree the scope before a build.'],
  ['What should I send in the first message?', 'Tell us about your business, who will use the system, your current tools, and the outcome you need. Include timing or budget constraints. You do not need a finished specification to start.'],
];
