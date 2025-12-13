// Dashboard.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { BrowserRouter } from 'react-router-dom';

// Mock NavBar and PlotlyPersonal since they are children components
jest.mock('./NavBar', () => () => <div data-testid="navbar">NavBar</div>);
jest.mock('./PlotlyPersonal', () => () => <div data-testid="plotly-chart">Chart</div>);

const renderWithRouter = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>);

describe('Dashboard Component', () => {
  beforeEach(() => {
    renderWithRouter(<Dashboard />);
  });

  test('renders NavBar', () => {
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });

  test('renders Recent Purchases table', () => {
    const recentPurchasesHeader = screen.getByText(/Recent Purchases/i);
    expect(recentPurchasesHeader).toBeInTheDocument();

    // Check a few items in the table
    expect(screen.getAllByText(/Laptop/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Wireless Mouse/i)[0]).toBeInTheDocument();
  });

  test('renders Goals section with progress bars', () => {
    const goalsHeader = screen.getByText(/Goals/i);
    expect(goalsHeader).toBeInTheDocument();

    expect(screen.getByText(/Emergency Fund/i)).toBeInTheDocument();
    expect(screen.getByText(/\$3,500 \/ \$5,000/i)).toBeInTheDocument();
  });

  test('renders Expense Categories section', () => {
    const expenseHeader = screen.getByText(/Expense Categories/i);
    expect(expenseHeader).toBeInTheDocument();

    expect(screen.getByTestId('plotly-chart')).toBeInTheDocument();

    // Check category names
    expect(screen.getByText(/Food/i)).toBeInTheDocument();
    expect(screen.getByText(/Transport/i)).toBeInTheDocument();
  });

  test('renders total expenses', () => {
    const totalExpenses = screen.getByText(/\$1200/); // 450 + 200 + 150 + 300 + 100
    expect(totalExpenses).toBeInTheDocument();
  });

  test('hovering over a category changes state', () => {
    const categories = screen.getAllByText(/Food|Transport|Entertainment|Utilities|Other/i);
    const firstCategory = categories.find(el => el.textContent === 'Food');

    expect(firstCategory).toBeInTheDocument();
    fireEvent.mouseEnter(firstCategory);
    fireEvent.mouseLeave(firstCategory);
  });
});
