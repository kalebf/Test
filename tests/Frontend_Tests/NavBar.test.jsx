import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import NavBar from '../NavBar';

const renderWithRoute = (route = '/Dashboard') => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <NavBar />
    </MemoryRouter>
  );
};

describe('NavBar Component', () => {

  test('renders all navigation links', () => {
    renderWithRoute();

    const links = screen.getAllByRole('link');

    expect(links.find(link => link.getAttribute('href') === '/Dashboard')).toBeInTheDocument();
    expect(links.find(link => link.getAttribute('href') === '/Chatbot')).toBeInTheDocument();
    expect(links.find(link => link.getAttribute('href') === '/Goals')).toBeInTheDocument();
    expect(links.find(link => link.getAttribute('href') === '/Settings')).toBeInTheDocument();
  });

  test('highlights the active route', () => {
    renderWithRoute('/Goals');

    const links = screen.getAllByRole('link');
    const activeLink = links.find(link => link.getAttribute('href') === '/Goals');

    expect(activeLink).toHaveStyle('border-left: 4px solid #6BB577');
  });

  test('renders the profile circle and initial', () => {
    renderWithRoute();

    const profileInitial = screen.getByText('U');
    expect(profileInitial).toBeInTheDocument();
  });

  test('sidebar expands and collapses on hover', () => {
    const { container } = renderWithRoute();
    const sidebar = container.querySelector('aside');

    // Collapsed width
    expect(sidebar.classList.contains('w-20')).toBe(true);

    // Hover to expand
    fireEvent.mouseEnter(sidebar);
    expect(sidebar.classList.contains('w-64')).toBe(true);

    // Hover out to collapse
    fireEvent.mouseLeave(sidebar);
    expect(sidebar.classList.contains('w-20')).toBe(true);
  });

  test('shows correct logo based on expanded state', () => {
    const { container } = renderWithRoute();
    const sidebar = container.querySelector('aside');

    const logo = screen.getByRole('img', { name: /logo/i });

    // Collapsed logo
    expect(logo.src).toContain('ClariFi-Logo-Small.png');

    // Expand sidebar
    fireEvent.mouseEnter(sidebar);

    
    const expandedLogo = screen.getByRole('img', { name: /logo/i });
    expect(expandedLogo.src).toContain('ClariFi-Logo.png');
  });

});
