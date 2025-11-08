import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Goals from "./pages/Goals";
import Debts from "./pages/Debts";
import Investments from "./pages/Investments";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import RecurringTransactions from "./pages/RecurringTransactions";
import Accounts from "./pages/Accounts";
import Partner from "./pages/Partner";
import Categories from "./pages/Categories";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/transactions"} component={Transactions} />
      <Route path={"/budgets"} component={Budgets} />
      <Route path={"/goals"} component={Goals} />
      <Route path={"/debts"} component={Debts} />
      <Route path={"/investments"} component={Investments} />
      <Route path={"/reports"} component={Reports} />
      <Route path={"/categories"} component={Categories} />
        <Route path="/recurring" component={RecurringTransactions} />
      <Route path="/accounts" component={Accounts} />
        <Route path="/partner" component={Partner} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
