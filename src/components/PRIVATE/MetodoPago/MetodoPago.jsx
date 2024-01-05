/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import './metodoPago.scss';
import { ingresoDigital } from '../../../services/global';

const MetodoPago = ({ setVal, onClose, name }) => {
  const [selectedOption, setSelectedOption] = useState('');

  const handleOptionChange = (event) => {
    setSelectedOption(event.target.value);
    if (name && setVal) {
      setVal(name, event.target.value);
    } else {
      setVal(event.target.value);
    }
    if (onClose) {
      onClose(false);
    }
  };

  return (
    <form className="content-metdo-pago">
      <fieldset className="checkbox-group">
        <legend className="checkbox-group-legend">Escoja Metodo de Pago</legend>
        <div className="checkbox">
          <label className="checkbox-wrapper">
            <input
              type="radio"
              className="checkbox-input"
              name="metodoPago"
              value="Efectivo"
              checked={selectedOption === 'Efectivo'}
              onChange={handleOptionChange}
            />
            <span className="checkbox-tile">
              <span className="checkbox-icon">{/* <Taxi className="custom-icon" /> */}</span>
              <span className="checkbox-label">Efectivo</span>
            </span>
          </label>
        </div>
        <div className="checkbox">
          <label className="checkbox-wrapper">
            <input
              type="radio"
              className="checkbox-input"
              name="metodoPago"
              value={ingresoDigital}
              checked={selectedOption === ingresoDigital}
              onChange={handleOptionChange}
            />
            <span className="checkbox-tile">
              <span className="checkbox-icon">{/* <Moto className="custom-icon" /> */}</span>
              <span className="checkbox-label">{ingresoDigital.charAt(0) + ingresoDigital.slice(1).toLowerCase()}</span>
            </span>
          </label>
        </div>
        <div className="checkbox">
          <label className="checkbox-wrapper">
            <input
              type="radio"
              className="checkbox-input"
              name="metodoPago"
              value="Tarjeta"
              checked={selectedOption === 'Tarjeta'}
              onChange={handleOptionChange}
            />
            <span className="checkbox-tile">
              <span className="checkbox-icon">{/* <Moto className="custom-icon" /> */}</span>
              <span className="checkbox-label">Tarjeta</span>
            </span>
          </label>
        </div>
      </fieldset>
    </form>
  );
};

export default MetodoPago;
