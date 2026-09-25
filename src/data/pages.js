export const pages = {
  home: { path: '/', label: 'Home', title: 'AYNKO — Human ideas. Exceptional systems.', description: 'Thoughtful software, connected workflows, and intelligent systems by Aymane Chellak and Zakaria Bak.' },
  work: { path: '/work', label: 'Work', title: 'Selected work — AYNKO', description: 'Explore five software projects across commerce, finance, construction, CRM, and digital experiences.' },
  expertise: { path: '/expertise', label: 'Expertise', title: 'Software engineering & expertise — AYNKO', description: 'Product engineering, ERP and CRM integrations, and practical automation shaped around real operations.' },
  process: { path: '/process', label: 'Process', title: 'Our working process — AYNKO', description: 'Explore how we understand, architect, build, and evolve useful software with interactive system diagrams.' },
  about: { path: '/about', label: 'About', title: 'The people behind the systems — AYNKO', description: 'Meet Aymane Chellak and Zakaria Bak, explore our studio skills, and bring a challenge to our interactive desk.' },
  contact: { path: '/contact', label: 'Contact', title: 'Start a conversation — AYNKO', description: 'Tell AYNKO about your product, workflow, or next software project. Based in Morocco, working worldwide.' },
};
export function pageForPath(path) {
  return Object.keys(pages).find(key => pages[key].path === (path.replace(/\/$/, '') || '/')) || 'home';
}
