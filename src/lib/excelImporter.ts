// Excel Import Utility
// This is a client-side utility for importing Excel/CSV files

export interface ImportedBudgetData {
  categories: Array<{
    name: string;
    type: 'income' | 'expense';
    monthlyAmount: number;
    weeklyAmount: number;
  }>;
  startingBalance: number;
  currency: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

/**
 * Parse CSV content
 */
export function parseCSV(content: string): string[][] {
  const lines = content.split('\n');
  return lines.map(line => {
    // Simple CSV parsing (doesn't handle quoted commas)
    return line.split(',').map(cell => cell.trim());
  });
}

/**
 * Detect budget format from CSV data
 */
export function detectBudgetFormat(data: string[][]): 'user-spreadsheet' | 'generic' | 'unknown' {
  // Check for user's spreadsheet format
  const hasMonthlyWeekly = data.some(row => 
    row.some(cell => cell.toLowerCase().includes('monthly')) &&
    row.some(cell => cell.toLowerCase().includes('weekly'))
  );
  
  const hasExpensesIncome = data.some(row =>
    row.some(cell => cell.toLowerCase().includes('expenses')) &&
    row.some(cell => cell.toLowerCase().includes('income'))
  );
  
  if (hasMonthlyWeekly && hasExpensesIncome) {
    return 'user-spreadsheet';
  }
  
  // Check for generic budget format
  const hasCategoryAmount = data.some(row =>
    row.length >= 2 && row[0] && !isNaN(parseFloat(row[1]))
  );
  
  if (hasCategoryAmount) {
    return 'generic';
  }
  
  return 'unknown';
}

/**
 * Import user's spreadsheet format
 */
export function importUserSpreadsheet(data: string[][]): ImportedBudgetData {
  const result: ImportedBudgetData = {
    categories: [],
    startingBalance: 0,
    currency: 'ILS',
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
  };
  
  let inExpenseSection = false;
  let inIncomeSection = false;
  
  for (const row of data) {
    // Detect sections
    if (row.some(cell => cell.toLowerCase().includes('expenses'))) {
      inExpenseSection = true;
      inIncomeSection = false;
      continue;
    }
    if (row.some(cell => cell.toLowerCase().includes('income'))) {
      inExpenseSection = false;
      inIncomeSection = true;
      continue;
    }
    
    // Extract starting balance
    if (row.some(cell => cell.toLowerCase().includes('starting balance'))) {
      const balanceCell = row.find(cell => !isNaN(parseFloat(cell)) && cell !== '');
      if (balanceCell) {
        result.startingBalance = parseFloat(balanceCell);
      }
      continue;
    }
    
    // Extract totals
    if (row[0]?.toLowerCase().includes('total')) {
      continue; // Skip total rows, we'll calculate them
    }
    
    // Extract category data
    if ((inExpenseSection || inIncomeSection) && row[0] && row[0].trim()) {
      const name = row[0].trim();
      
      // Skip if it's a header row
      if (name.toLowerCase().includes('monthly') || name.toLowerCase().includes('weekly')) {
        continue;
      }
      
      // Find monthly and weekly amounts
      let monthlyAmount = 0;
      let weeklyAmount = 0;
      
      for (let i = 1; i < row.length; i++) {
        const value = parseFloat(row[i]);
        if (!isNaN(value) && value > 0) {
          if (monthlyAmount === 0) {
            monthlyAmount = value;
          } else if (weeklyAmount === 0) {
            weeklyAmount = value;
          }
        }
      }
      
      // If only one amount found, assume it's monthly and calculate weekly
      if (monthlyAmount > 0 && weeklyAmount === 0) {
        weeklyAmount = monthlyAmount / 4;
      }
      
      if (monthlyAmount > 0) {
        result.categories.push({
          name,
          type: inExpenseSection ? 'expense' : 'income',
          monthlyAmount,
          weeklyAmount,
        });
        
        if (inExpenseSection) {
          result.totalExpenses += monthlyAmount;
        } else {
          result.totalIncome += monthlyAmount;
        }
      }
    }
  }
  
  result.balance = result.totalIncome - result.totalExpenses + result.startingBalance;
  
  return result;
}

/**
 * Import generic budget format
 */
export function importGenericBudget(data: string[][]): ImportedBudgetData {
  const result: ImportedBudgetData = {
    categories: [],
    startingBalance: 0,
    currency: 'ILS',
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
  };
  
  // Skip header row
  const dataRows = data.slice(1);
  
  for (const row of dataRows) {
    if (row.length < 2) continue;
    
    const name = row[0]?.trim();
    const amountStr = row[1]?.trim();
    const typeStr = row[2]?.toLowerCase().trim();
    
    if (!name || !amountStr) continue;
    
    const amount = parseFloat(amountStr.replace(/[^0-9.-]/g, ''));
    if (isNaN(amount)) continue;
    
    const type: 'income' | 'expense' = 
      typeStr?.includes('income') ? 'income' : 'expense';
    
    result.categories.push({
      name,
      type,
      monthlyAmount: amount,
      weeklyAmount: amount / 4,
    });
    
    if (type === 'income') {
      result.totalIncome += amount;
    } else {
      result.totalExpenses += amount;
    }
  }
  
  result.balance = result.totalIncome - result.totalExpenses;
  
  return result;
}

/**
 * Main import function
 */
export function importBudgetFromFile(content: string): ImportedBudgetData | null {
  try {
    const data = parseCSV(content);
    const format = detectBudgetFormat(data);
    
    switch (format) {
      case 'user-spreadsheet':
        return importUserSpreadsheet(data);
      case 'generic':
        return importGenericBudget(data);
      default:
        return null;
    }
  } catch (error) {
    console.error('Error importing budget:', error);
    return null;
  }
}

/**
 * Validate imported data
 */
export function validateImportedData(data: ImportedBudgetData): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (data.categories.length === 0) {
    errors.push('No categories found in the imported file');
  }
  
  if (data.totalIncome === 0) {
    warnings.push('No income categories found');
  }
  
  if (data.totalExpenses === 0) {
    warnings.push('No expense categories found');
  }
  
  if (data.balance < 0) {
    warnings.push(`Budget shows a deficit of ${Math.abs(data.balance).toFixed(2)}`);
  }
  
  // Check for duplicate categories
  const categoryNames = data.categories.map(c => c.name.toLowerCase());
  const duplicates = categoryNames.filter((name, index) => 
    categoryNames.indexOf(name) !== index
  );
  
  if (duplicates.length > 0) {
    warnings.push(`Duplicate categories found: ${duplicates.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generate preview summary
 */
export function generateImportPreview(data: ImportedBudgetData): string {
  const lines: string[] = [];
  
  lines.push('Import Preview');
  lines.push('='.repeat(50));
  lines.push('');
  lines.push(`Currency: ${data.currency}`);
  lines.push(`Starting Balance: ${data.startingBalance.toFixed(2)}`);
  lines.push('');
  
  lines.push('Income Categories:');
  data.categories
    .filter(c => c.type === 'income')
    .forEach(c => {
      lines.push(`  ${c.name}: ${c.monthlyAmount.toFixed(2)}/month (${c.weeklyAmount.toFixed(2)}/week)`);
    });
  lines.push(`Total Income: ${data.totalIncome.toFixed(2)}`);
  lines.push('');
  
  lines.push('Expense Categories:');
  data.categories
    .filter(c => c.type === 'expense')
    .forEach(c => {
      lines.push(`  ${c.name}: ${c.monthlyAmount.toFixed(2)}/month (${c.weeklyAmount.toFixed(2)}/week)`);
    });
  lines.push(`Total Expenses: ${data.totalExpenses.toFixed(2)}`);
  lines.push('');
  
  lines.push(`Balance: ${data.balance.toFixed(2)} ${data.balance < 0 ? '(DEFICIT)' : '(SURPLUS)'}`);
  
  return lines.join('\n');
}
