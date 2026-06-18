
import { ToastProvider, ConfirmProvider } from './components/ui';
import { AuthProvider } from './features/auth/context/AuthContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import AppRoutes from './app/Approutes';
import { BrowserRouter } from 'react-router-dom'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
export default App;
