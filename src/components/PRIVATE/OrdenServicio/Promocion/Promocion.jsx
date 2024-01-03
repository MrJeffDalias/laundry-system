/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable react/display-name */
import axios from 'axios';
import React, { useState } from 'react';
import './promocion.scss';
import Pet from './pet.jpg';
import { useSelector } from 'react-redux';
import moment from 'moment';

const Promocion = ({ /*onRedirect,*/ onAddCupon }) => {
  const infoPromocion = useSelector((state) => state.promocion.infoPromocion);
  const [givenPromotions, setGivenPromotions] = useState([]);

  const handleAddPromocion = async (promo) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/lava-ya/generate-codigo-cupon`);

      if (response.data) {
        const codigoCupon = response.data;
        setGivenPromotions([...givenPromotions, { codigoCupon, ...promo }]);
      } else {
        alert('No se pudo generar promocion');
      }
    } catch (error) {
      console.error('Error al realizar la solicitud:', error);
    }
  };

  const handleRegisterPromocion = () => {
    const promos = [];
    givenPromotions.map((p) => {
      const info = {
        codigoPromocion: p.codigo,
        codigoCupon: p.codigoCupon,
      };
      promos.push(info);
    });
    onAddCupon(promos);
  };

  return (
    <div className="content-p">
      {infoPromocion.length > 0 ? (
        <div className="actions">
          <button
            type="button"
            className="btn-delete"
            onClick={() => {
              const nuevoArray = givenPromotions.filter((_, index) => index < givenPromotions.length - 1);
              setGivenPromotions(nuevoArray);
            }}
          >
            Eliminar
          </button>
          <button
            type="button"
            className="btn-add-promo"
            onClick={() => {
              handleRegisterPromocion();
            }}
          >
            Agregar Promocion
          </button>
        </div>
      ) : null}
      <div style={{ display: givenPromotions.length > 0 ? 'flex' : 'grid', gap: '10px' }}>
        <div className="list-promos">
          {infoPromocion?.map((p) => (
            <button
              className="item-promo"
              key={p.codigo}
              onClick={() => {
                handleAddPromocion(p);
              }}
              type="button"
            >
              {p.descripcion}
            </button>
          ))}
        </div>
        {givenPromotions.length > 0 ? (
          <div className="container-promociones">
            <div className="item-promo">
              {givenPromotions?.map((promo, index) => (
                <div key={index}>
                  <div className="info-promo">
                    <div>
                      <h1>PROMOCION:</h1>
                      <h2 style={{ fontSize: '0.8em', textAlign: 'justify' }}>{promo.descripcion}</h2>
                      <h2 className="cod-i">codigo: {promo.codigoCupon}</h2>
                    </div>
                    <div>
                      <img src={Pet} alt="" />
                    </div>
                  </div>
                </div>
              ))}
              <h2 style={{ float: 'right', fontSize: '0.9em' }}>{moment().format('D [de] MMMM[, del] YYYY')}</h2>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Promocion;
