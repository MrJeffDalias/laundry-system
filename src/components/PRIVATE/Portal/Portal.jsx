/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { ReactComponent as Close } from './Cruzar.svg';

import './portal.scss';

const Portal = ({ children, onClose }) => {
  const portalRoot = document.getElementById('portal-root');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMounted(false);
        onClose(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (mounted && portalRoot) {
    const handleClose = () => {
      setMounted(false);
      onClose(false);
    };

    return ReactDOM.createPortal(
      <div className="portal-container">
        <Close className="close-button" onClick={handleClose} />
        {children}
      </div>,
      portalRoot
    );
  } else {
    return null;
  }
};

export default Portal;
