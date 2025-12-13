import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Goals from '../Goals';

// Mock NavBar
jest.mock('./NavBar', () => () => <div data-testid="navbar" />);

describe('Goals Page', () => {

  test('opens Add Goal modal and adds a new goal', () => {
    render(<Goals />);

    // Click the + Create Goal button
    const createBtn = screen.getByText(/\+ Create Goal/i);
    fireEvent.click(createBtn);

    
    expect(screen.getByText(/Add New Goal/i)).toBeInTheDocument();

    // Fill in fields
    fireEvent.change(screen.getByPlaceholderText(/e\.g\., Vacation/i), {
      target: { value: 'Test Goal' }
    });

    fireEvent.change(screen.getByPlaceholderText(/\$0/i), {
      target: { value: '1000' }
    });

    // Submit
    fireEvent.click(screen.getByText(/Add Goal/i));

    // New goal should appear in list
    expect(screen.getByText(/Test Goal/i)).toBeInTheDocument();
  });

  test('opens Edit Goal modal when clicking Edit', () => {
    render(<Goals />);

    // Find the first Edit button 
    const editBtn = screen.getAllByText(/Edit/i)[0];
    fireEvent.click(editBtn);

    
    expect(screen.getByText(/Edit Goal/i)).toBeInTheDocument();

    // The name field should be pre-filled
    expect(screen.getByDisplayValue(/New Car/i)).toBeInTheDocument();
  });

});
