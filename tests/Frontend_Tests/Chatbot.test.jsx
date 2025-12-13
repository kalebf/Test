import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatBot from '../Chatbot'

// Mock NavBar because test environment doesn't need it
jest.mock('./NavBar', () => () => <div data-testid="navbar" />);

describe('ChatBot Component', () => {
  test('sends a message when user types and presses send', () => {
    render(<ChatBot />);

    const input = screen.getByPlaceholderText(/type your message here/i);
    const sendButton = screen.getByRole('button');

    // Type a message
    fireEvent.change(input, { target: { value: 'Hello bot!' } });
    fireEvent.click(sendButton);

    // Expect message to appear
    expect(screen.getByText('Hello bot!')).toBeInTheDocument();
  });

  test('switches chat history when a user clicks on another chat', () => {
    render(<ChatBot />);

    // Click a previous chat title
    const historyItem = screen.getByText(/Budget Planning Help/i);
    fireEvent.click(historyItem);

    // Expect a message specific to that chat to appear
    expect(
      screen.getByText("I need help creating a monthly budget")
    ).toBeInTheDocument();
  });
});
