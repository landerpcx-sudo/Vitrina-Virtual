import React, { useState } from 'react';
import { XIcon } from './icons/XIcon';

interface PasswordModalProps {
  onClose: () => void;
  onSubmit: (password: string) => void;
  error: string | null;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ onClose, onSubmit, error }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(password);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-sm w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Cerrar modal"
        >
          <XIcon className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-center text-[#008e5a] mb-6">Acceso de Administrador</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <label htmlFor="password-input" className="block text-sm font-medium text-gray-700">
              Ingresa la clave para continuar
            </label>
            <input
              id="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              autoFocus
            />
            {error && <p className="text-red-600 text-sm font-semibold">{error}</p>}
          </div>
          <button
            type="submit"
            className="mt-6 w-full py-3 bg-[#008e5a] text-white font-bold rounded-md hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-400 focus:ring-opacity-50 transition-all duration-300"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;