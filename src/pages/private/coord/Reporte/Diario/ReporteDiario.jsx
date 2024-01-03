/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from 'react';
import { DateCurrent } from '../../../../../utils/functions';
import moment from 'moment';
import './reporteDiario.scss';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { GetReporte } from '../../../../../redux/actions/aReporte';
import { clearReport_xDia } from '../../../../../redux/states/reporte';
import { PrivateRoutes } from '../../../../../models';
import LoaderSpiner from '../../../../../components/LoaderSpinner/LoaderSpiner';

const ReporteDiario = ({ onClose }) => {
  const InfoUsuario = useSelector((store) => store.user.infoUsuario);
  const [isLoading, setIsLoading] = useState(true);
  const [infoReport, setInfoReport] = useState([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const infoReporte_xDias = useSelector((state) => state.reporte.infoReporte_xDias);

  const isInitialRender = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      isInitialRender.current = true;
      await dispatch(GetReporte({ type: 'daily', filter: { days: 3 } }));
    };

    if (isInitialRender.current === false) {
      fetchData();
    }
  }, []);

  useEffect(() => {
    if (infoReporte_xDias.length > 0) {
      setIsLoading(false);
      setInfoReport(infoReporte_xDias);
    }
  }, [infoReporte_xDias]);

  return (
    <div>
      {isLoading ? (
        <div className="loading-general">
          <LoaderSpiner />
        </div>
      ) : (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Fecha Entrega</th>
                  <th>Cantidad</th>
                  <th>Ropa x Kilo</th>
                  <th>Edredones</th>
                  <th>Planchado</th>
                  <th>Zapatillas</th>
                  <th>Cortinas</th>
                  <th>Otros</th>
                  <th>Delivery</th>
                </tr>
              </thead>
              <tbody>
                {infoReport.map((dayData, index) => (
                  <tr
                    key={index}
                    style={{
                      background: DateCurrent().format4 === dayData.FechaEntrega ? '#ffd9d9' : null,
                    }}
                    data-fechaentrega={dayData.FechaEntrega}
                    ref={(element) => {
                      if (element && DateCurrent().format4 === element.getAttribute('data-fechaentrega')) {
                        element.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start',
                        });
                      }
                    }}
                  >
                    <td>{dayData.FechaEntrega}</td>
                    <td>{dayData.CantidadPedido}</td>
                    {dayData.InfoCategoria.map((item, itemIndex) => (
                      <td key={itemIndex}>
                        {item.Cantidad % 1 !== 0 ? parseFloat(item.Cantidad).toFixed(2) : item.Cantidad}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {InfoUsuario.rol !== 'pers' ? (
              <div className="action-end">
                <button
                  type="button"
                  onClick={() => {
                    onClose(false);
                    navigate(`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.REPORTE_ORDER_SERVICE}`);
                  }}
                >
                  Informe Completo
                </button>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
};

export default ReporteDiario;
