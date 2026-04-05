import { render, screen } from '@testing-library/react';
import ProjectAnalytics from './ProjectAnalytics';
import { describe, it, expect } from 'vitest';

describe('ProjectAnalytics Component', () => {
  it('should render the loading state initially', () => {
    // 1. Renderizamos el componente (como si lo pusiéramos en la pantalla)
    render(<ProjectAnalytics projectId="dummy-id" />);

    // 2. Buscamos el texto de carga en el DOM virtual
    const loadingText = screen.getByText(/crunching the numbers/i);

    // 3. Verificamos que exista
    expect(loadingText).toBeInTheDocument();
  });
});