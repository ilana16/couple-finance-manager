// Routes placeholder - backend integration required
// This file is a placeholder for backend route definitions

export interface RouteConfig {
  path: string;
  method: string;
  handler: string;
}

export const routes: RouteConfig[] = [
  { path: '/api/transactions', method: 'GET', handler: 'getTransactions' },
  { path: '/api/transactions', method: 'POST', handler: 'createTransaction' },
  { path: '/api/budgets', method: 'GET', handler: 'getBudgets' },
  { path: '/api/budgets', method: 'POST', handler: 'createBudget' },
  { path: '/api/reimbursements', method: 'GET', handler: 'getReimbursements' },
  { path: '/api/financial-health', method: 'GET', handler: 'getFinancialHealth' },
];

export function getRouteByPath(path: string): RouteConfig | undefined {
  return routes.find(route => route.path === path);
}
