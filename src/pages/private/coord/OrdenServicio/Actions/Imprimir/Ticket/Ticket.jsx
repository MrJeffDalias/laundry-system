/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
/* eslint-disable react/display-name */
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { DateDetail, DiasAttencion, HoraAttencion, roundDecimal } from '../../../../../../../utils/functions';
import './ticket.scss';

import Pet from './pet.jpg';
import AhorroPet from './petAhorro.jpg';

import axios from 'axios';
import moment from 'moment';

const Ticket = React.forwardRef((props, ref) => {
  const [listPromos, setListPromos] = useState([]);
  const { id } = useParams();

  const infoOrden = useSelector((state) => state.orden.registered.find((item) => item._id === id));
  const InfoNegocio = useSelector((state) => state.negocio.infoNegocio);

  const montoDelivery = (dataC) => {
    if (dataC.Modalidad === 'Delivery') {
      return infoOrden.Producto.find((p) => p.categoria === 'Delivery').total;
    } else {
      return 0;
    }
  };

  const handleGetInfoPromo = async (codigoCupon) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/lava-ya/get-info-promo/${codigoCupon}`);
      return response.data;
    } catch (error) {
      // Maneja los errores aquí
      console.error(`No se pudo obtener información de la promoción - ${error}`);
      throw error; // Lanza el error para que pueda ser capturado por Promise.all
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (infoOrden?.gift_promo.length > 0) {
        const promos = infoOrden.gift_promo;

        try {
          // Utiliza Promise.all para esperar a que todas las llamadas asincrónicas se completen
          const results = await Promise.all(
            promos.map(async (promo) => {
              return await handleGetInfoPromo(promo.codigoCupon);
            })
          );

          setListPromos(results);
        } catch (error) {
          // Maneja los errores aquí
          console.error('Error al obtener información de las promociones:', error);
        }
      }
    };

    fetchData();
  }, [infoOrden]);

  return (
    <>
      {infoOrden ? (
        <div className="container-ticket" ref={ref}>
          <div className="body-orden-service">
            <div className="receipt_header">
              <h1>LAVANDERIA {InfoNegocio?.name}</h1>
              <table className="info-table">
                <tbody>
                  <tr>
                    <td>Local:</td>
                    <td>{InfoNegocio?.direccion}</td>
                  </tr>
                  <tr>
                    <td>Horario:</td>
                    <td>
                      {Object.keys(InfoNegocio).length > 0 ? (
                        <>
                          {DiasAttencion(InfoNegocio?.horario.dias)}
                          <hr style={{ visibility: 'hidden' }} />
                          {HoraAttencion(InfoNegocio?.horario.horas)}
                        </>
                      ) : null}
                    </td>
                  </tr>
                  {InfoNegocio?.numero?.state ? (
                    <tr>
                      <td>Celular:</td>
                      <td>{InfoNegocio?.numero?.info}</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <div className="info-client">
              <h1 className="cod-rec">ORDEN DE SERVICIO : {String(infoOrden.codRecibo).padStart(4, '0')}</h1>
              <div className="info-detail">
                <table className="tb-date">
                  <tbody>
                    <tr>
                      <td>Ingreso:</td>
                      <td>
                        {DateDetail(infoOrden.dateRecepcion.fecha)} - {infoOrden.dateRecepcion.hora}
                      </td>
                    </tr>
                    <tr>
                      <td>Entrega:</td>
                      <td>
                        {DateDetail(infoOrden.datePrevista.fecha)} - {infoOrden.datePrevista.hora}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <table className="tb-info-cliente">
                  <tbody>
                    <tr>
                      <td>Nombre: </td>
                      <td>&nbsp;&nbsp;{infoOrden.Nombre}</td>
                    </tr>
                    <tr>
                      <td>Telefono: </td>
                      <td>&nbsp;&nbsp;{infoOrden.celular}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="receipt_body">
              <div className="items">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Item</th>
                      <th>Cantidad</th>
                      {/* <th>{""}</th> */}
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {infoOrden.Producto.filter((p) => p.categoria !== 'Delivery').map((p, index) => (
                      <tr key={`${infoOrden._id}-${index}`}>
                        <td>{index + 1}</td>
                        <td>{p.producto}</td>
                        <td>{roundDecimal(p.cantidad)} </td>
                        {/* <td>{""}</td> */}
                        <td>{roundDecimal(p.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3">Subtotal</td>
                      <td>
                        {roundDecimal(
                          infoOrden.Producto.reduce((total, p) => total + parseFloat(p.total), 0) -
                            montoDelivery(infoOrden)
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="3">Delivery</td>
                      <td>{montoDelivery(infoOrden)}</td>
                    </tr>
                    {infoOrden.factura ? (
                      <tr>
                        <td colSpan="3">IGV ({infoOrden.cargosExtras.igv.valor * 100} %) :</td>
                        <td>{infoOrden.cargosExtras.igv.importe}</td>
                      </tr>
                    ) : null}
                    <tr>
                      <td colSpan="3">Descuento</td>
                      <td>{infoOrden.descuento ? infoOrden.descuento : 0}</td>
                    </tr>
                    <tr>
                      <td colSpan="3">Total</td>
                      <td>{roundDecimal(infoOrden.totalNeto)}</td>
                    </tr>
                  </tfoot>
                </table>
                {infoOrden.modoDescuento === 'Promocion' && infoOrden.descuento > 0 ? (
                  <div className="space-ahorro">
                    <h2 className="title">! Felicidades Ahorraste S/{infoOrden?.descuento} ¡</h2>
                    <div className="info-promo">
                      <div className="list-promo">
                        <span>Usando nuestras promociones :</span>
                        <ul>
                          {infoOrden.cargosExtras.beneficios.promociones.map((p) => (
                            <li key={p.codigoCupon}>{p.descripcion}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="img-pet">
                        <img src={AhorroPet} alt="" />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="monto-final">
              <h2>Total : s/ {roundDecimal(infoOrden.totalNeto)}</h2>
              <h3 className="estado">{infoOrden.Pago === 'Pagado' ? 'PAGADO' : 'PENDIENTE'}</h3>
            </div>
            <p className="aviso">
              NOTA: <span>El plazo maximo para retirar las prendas es de 20 dias</span> despues de entregada a la
              lavanderia; vencido el plazo se donara a instituciones de caridad.No hay lugar a reclamo una ves retirada
              la prenda No nos reposabilizamos por prendas que se destiñan por malos tintes, botones o adornos que no
              resistan al lavado o planchado, por las prendas que se deterioren por estar demasiado usadas, tejidos y
              confecciones defectuosas. La indemnizacion por ropa perdida o malograda se ajusta de acuerdo a la ley R.S.
              2322 que equivale al 20% del valor de la prenda No nos responsabilizamos por dinero u objetos de valor
              dejados en la prenda.
            </p>
          </div>
          {listPromos.length > 0 ? (
            <div className="container-promociones">
              <div className="item-promo">
                {listPromos.map((promo, index) => (
                  <div key={index}>
                    <div className="info-promo">
                      <div className="body-p">
                        <h1 className="date-cup">PROMOCION :</h1>
                        <h2 style={{ fontSize: '0.8em', textAlign: 'justify' }}>{promo.descripcion}</h2>
                        <h2 className="cod-i">codigo: {promo.codigoCupon}</h2>
                      </div>
                      <div>
                        <img src={Pet} alt="" />
                      </div>
                    </div>
                  </div>
                ))}
                <h2 style={{ float: 'right', fontSize: '0.9em', padding: '10px 0' }}>
                  {moment(listPromos[0]?.dateCreacion?.fecha).format('D [de] MMMM[, del] YYYY')}
                </h2>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <>
          <div>Loading...</div>
        </>
      )}
    </>
  );
});

export default Ticket;
