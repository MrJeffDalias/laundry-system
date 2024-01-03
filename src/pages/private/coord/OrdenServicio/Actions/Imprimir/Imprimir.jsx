/* eslint-disable react-hooks/rules-of-hooks */
import React from 'react';
import ReactToPrint from 'react-to-print';
import Ticket from './Ticket/Ticket';

import './imprimir.scss';
import { useDispatch } from 'react-redux';
import { setLastRegister, setOrderServiceId } from '../../../../../../redux/states/service_order';
import { PrivateRoutes } from '../../../../../../models';
import { useNavigate } from 'react-router-dom';

const index = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const componentRef = React.useRef();

  const handleAfterPrint = () => {
    console.log('Después de imprimir');
    dispatch(setOrderServiceId(false));
    dispatch(setLastRegister());
    navigate(`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.LIST_ORDER_SERVICE}`);
  };

  return (
    <div className="content-to-print">
      <ReactToPrint
        trigger={() => (
          <button type="button" className="btn-imprimir">
            Imprimir Ticket
          </button>
        )}
        content={() => componentRef.current}
        onAfterPrint={handleAfterPrint}
      />
      <Ticket ref={componentRef} />
    </div>
  );
};

export default index;
