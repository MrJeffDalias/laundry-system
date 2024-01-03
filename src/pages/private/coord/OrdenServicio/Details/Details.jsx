/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { GetAnuladoId } from '../../../../../redux/actions/aAnular';
import { GetDeliverysID } from '../../../../../redux/actions/aDelivery';
import { GetDonadoId } from '../../../../../services/default.services';

import Nota from './Nota/Nota';

import { PrivateRoutes, Roles } from '../../../../../models';
import './details.scss';
import { useState } from 'react';
import moment from 'moment';

const Details = ({ IdCliente }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showNotas, setShowNotas] = useState(false);
  const [dateDonated, setDateDonated] = useState();
  const infoCliente = useSelector((state) => state.orden.registered.find((item) => item._id === IdCliente));
  const InfoUsuario = useSelector((state) => state.user.infoUsuario);

  const iDelivery = useSelector((state) => state.delivery.infoDeliveryID);
  const iAnulado = useSelector((state) => state.anular.anuladoId);

  const handleDateLarge = (fecha) => {
    const fechaObjeto = moment(fecha);
    const fechaFormateada = fechaObjeto.format('dddd D [de] MMMM, YYYY');
    return fechaFormateada;
  };

  const handleHour = (hora) => {
    const hora12 = moment(hora, 'HH:mm').format('h:mm A');
    return hora12;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (infoCliente.Modalidad === 'Delivery') {
        dispatch(GetDeliverysID(IdCliente));
      }
      if (infoCliente.estadoPrenda === 'anulado') {
        dispatch(GetAnuladoId(IdCliente));
      }
      if (infoCliente.estadoPrenda === 'donado') {
        const fDonacion = await GetDonadoId(IdCliente);
        setDateDonated(fDonacion);
      }
    };
    fetchData();
  }, [infoCliente.Modalidad, infoCliente.estadoPrenda, IdCliente]);

  return (
    <div className="content-detail">
      <h1>Detalle - "{infoCliente.Nombre}"</h1>
      {showNotas === false ? (
        <div className="body-detail">
          {infoCliente.estadoPrenda === 'anulado' && iAnulado ? (
            <div className="anulado-mt">
              <h1>Anulado</h1>
              <textarea rows={5} value={`Motivo : ${iAnulado.motivo}`} readOnly={true} />
              <span>
                {iAnulado.fecha} - {iAnulado.hora}
              </span>
            </div>
          ) : null}
          {infoCliente.estadoPrenda === 'donado' && dateDonated ? (
            <div className="date-donacion">
              <div className="title">
                <span>Donado</span>
              </div>
              <div className="date">
                <span>
                  {handleDateLarge(dateDonated.fecha)} / {handleHour(dateDonated.hora)}
                </span>
              </div>
            </div>
          ) : null}
          <table className="product-t">
            <thead>
              <tr>
                <th>Cantidad</th>
                <th>Producto</th>
                <th>Descripción</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {infoCliente?.Producto.map((p, index) => (
                <tr key={`${p._id}${index}`}>
                  <td>{p.cantidad}</td>
                  <td>{p.producto}</td>
                  <td className="tADescription">
                    <div className="contentDes">
                      <div id={`${index}-dsp`} className="textarea-container">
                        <textarea className="hide" rows={5} value={p.descripcion} readOnly={true} />
                        <button
                          type="button"
                          className="expand-button"
                          onClick={() => {
                            const element = document.getElementById(`${index}-dsp`);

                            if (element) {
                              const hideElement = element.querySelector('.hide');
                              const showElement = element.querySelector('.show');
                              const iconElement = element.querySelector('#ico-action');

                              if (hideElement) {
                                hideElement.classList.replace('hide', 'show');
                                iconElement.classList.replace('fa-chevron-down', 'fa-chevron-up');
                              } else if (showElement) {
                                showElement.classList.replace('show', 'hide');
                                iconElement.classList.replace('fa-chevron-up', 'fa-chevron-down');
                              }
                            }
                          }}
                        >
                          <i id="ico-action" className="fa-solid fa-chevron-down" />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td>{p.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="extras">
            {InfoUsuario.rol !== Roles.PERS &&
              infoCliente.estado === 'registrado' &&
              infoCliente.estadoPrenda !== 'anulado' &&
              infoCliente.estadoPrenda !== 'donado' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      navigate(`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.IMPRIMIR_ORDER_SERVICE}/${infoCliente._id}`);
                    }}
                  >
                    Imprimir Comprobante
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotas(true);
                    }}
                  >
                    Notas
                  </button>
                </>
              )}

            <table className="info-table">
              <tbody>
                {infoCliente.factura ? (
                  <tr>
                    <td>Factura:</td>
                    <td>{infoCliente.cargosExtras.igv.importe}</td>
                  </tr>
                ) : null}
                {infoCliente.descuento > 0 ? (
                  <tr>
                    <td>Decuento:</td>
                    <td>{infoCliente.descuento}</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="more-a">
            <h2>Total - S/{infoCliente.totalNeto}</h2>{' '}
          </div>
          {infoCliente.Modalidad === 'Delivery' && iDelivery ? (
            <div className="list-delivery">
              {iDelivery.map((e) => (
                <div className="gasto-d" key={e._id}>
                  <span>{e.descripcion}</span> - <span>{e.monto}</span>
                </div>
              ))}
            </div>
          ) : null}
          <table className="info-table">
            <tbody>
              <tr>
                <td>Fecha Ingreso:</td>
                <td>
                  {infoCliente.dateRecepcion.fecha} / {infoCliente.dateRecepcion.hora}
                </td>
              </tr>
              <tr>
                <td>Fecha Entrega (Programada) :</td>
                <td>
                  {infoCliente.datePrevista.fecha} / {infoCliente.datePrevista.hora}
                </td>
              </tr>

              {infoCliente.estadoPrenda !== 'donado' ? (
                <tr>
                  <td>Fecha Entrega:</td>
                  <td>
                    {infoCliente.estadoPrenda === 'entregado'
                      ? `${infoCliente.dateEntrega.fecha} / ${infoCliente.dateEntrega.hora}`
                      : 'ENTREGA PENDIENTE'}
                  </td>
                </tr>
              ) : null}
              <tr>
                <td>Fecha Pago:</td>
                <td>
                  {infoCliente.Pago === 'Pagado'
                    ? `${infoCliente.datePago.fecha} / ${infoCliente.datePago.hora} `
                    : 'PAGO PENDIENTE '}
                  <div className="md-pago">
                    {infoCliente.Pago === 'Pagado' ? `Pago por : ${infoCliente.metodoPago}` : null}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <Nota onReturn={() => setShowNotas(false)} infOrden={infoCliente} />
      )}
    </div>
  );
};

export default Details;
