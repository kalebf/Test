import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from '../Settings';


const renderWithRouter = (ui, { route = '/' } = {}) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>
  );
};

describe('SettingsPage', () => {
  beforeEach(() => {
    renderWithRouter(<SettingsPage />);
  });

  test('shows error when changing password with missing fields', async () => {
    const changePasswordButton = screen.getByText(/Change Password/i);
    fireEvent.click(changePasswordButton);

    const saveButton = screen.getByText(/Save Changes/i);
    fireEvent.click(saveButton);

    const errorMessage = await screen.findByText(/Please fill in all password fields/i);
    expect(errorMessage).toBeInTheDocument();
  });

  test('delete chats button exists and can be clicked', () => {
    // Click the "Delete Chats" section if necessary
    const deleteChatsSectionButton = screen.getByText(/Delete Chats/i);
    fireEvent.click(deleteChatsSectionButton);

    
    const deleteButton = screen.getByRole('button', { name: /Delete All Chats/i });
    expect(deleteButton).toBeInTheDocument();

    // Click the button
    fireEvent.click(deleteButton);

    
  });
});
