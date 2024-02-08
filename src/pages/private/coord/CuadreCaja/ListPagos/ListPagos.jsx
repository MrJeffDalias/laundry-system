/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React from 'react';
import styled from 'styled-components';
import { ingresoDigital } from '../../../../../services/global';

const InfoExtra = styled.div`
  display: flex;
  justify-content: space-between;

  .mode-anulado {
    border-top: none;
    background: #ffd0d0;
    td {
      border: none !important;
      &:first-child {
        border-left: 2px solid #ea5b5b !important;
      }
      &:last-child {
        border-right: 2px solid #ea5b5b !important;
      }
    }
  }

  table {
    display: block;
    border-collapse: collapse;
    margin: 10px;

    &::-webkit-scrollbar {
      width: 0;
    }

    tr {
      position: relative;
      display: grid;
    }

    thead {
      tr {
        th {
          background: #5b81ea;
          color: #fff;
          font-weight: bold;
          padding: 10px;
          text-align: center;
          font-size: 18px;
        }
      }
    }

    tbody {
      tr {
        td {
          position: relative;
          padding: 10px 5px;
          text-align: center;
          font-size: 18px;
          vertical-align: top;
          display: flex;
          justify-content: center;
          align-items: center;
          border-right: none !important;
          //border-top: none !important;
        }
      }
    }
  }

  .tb-info {
    display: grid;
    grid-template-rows: 50px auto;
    span {
      margin: auto;
      font-weight: 800;
      font-size: 18px;
      color: #5161ce;
      letter-spacing: 3px;
      border: solid 1px #5161ce;
      padding: 10px;
      padding-bottom: 7px;
    }
  }
  .paid-orders-tarj {
    table {
      tr {
        grid-template-columns: 80px 140px 280px 150px;
      }
      thead {
        tr {
          th {
            background: #007bff;
            color: #fff;
          }
        }
      }
      tbody {
        tr {
          td {
            border: 1px solid #007bff;
            &:last-child {
              border-right: 2px solid #007bff !important;
            }
            &:first-child {
              border-left: 2px solid #007bff !important;
            }
          }
          &:last-child {
            border-bottom: 2px solid #007bff !important;
          }
        }
      }
    }
  }

  .paid-orders-tranf {
    table {
      tr {
        grid-template-columns: 80px 140px 280px 150px;
      }
      thead {
        tr {
          th {
            background: #7a43c9;
            color: #fff;
          }
        }
      }
      tbody {
        tr {
          td {
            border: 1px solid #7a43c9;
            &:last-child {
              border-right: 2px solid #7a43c9 !important;
            }
            &:first-child {
              border-left: 2px solid #7a43c9 !important;
            }
          }
          &:last-child {
            border-bottom: 2px solid #7a43c9 !important;
          }
        }
      }
    }
  }
  .paid-orders-efectivo {
    table {
      tr {
        grid-template-columns: 80px 140px 250px 150px;
      }
      thead {
        tr {
          th {
            background: #3faf84;
            color: #fff;
          }
        }
      }
      tbody {
        tr {
          td {
            border: 1px solid #3faf84;
            &:last-child {
              border-right: 2px solid #3faf84 !important;
            }
            &:first-child {
              border-left: 2px solid #3faf84 !important;
            }
          }
          &:last-child {
            border-bottom: 2px solid #3faf84 !important;
          }
        }
      }
    }
  }
  .daily-expenses {
    table {
      tr {
        grid-template-columns: 300px 250px 100px;
      }
      thead {
        tr {
          th {
            background: #ea5b5b;
          }
        }
      }

      tbody {
        tr {
          td {
            border: 1px solid #ea5b5b;
            &:last-child {
              border-right: 2px solid #ea5b5b !important;
            }
          }
          &:last-child {
            border-bottom: 2px solid #ea5b5b !important;
          }
        }
      }
    }
  }
`;

const ListPagos = ({ iGastos, iClienteEfectivo, iClienteTarjeta, iClienteTransferencia }) => {
  return (
    <InfoExtra>
      <div className="efectivo tb-info">
        <span>EFECTIVO</span>
        {iClienteEfectivo ? (
          <div className="paid-orders-efectivo">
            <table>
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Modalidad</th>
                  <th>Nombre</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                {iClienteEfectivo.map((cliente, index) => (
                  <tr key={index} className={`${cliente.estadoPrenda === 'anulado' ? 'mode-anulado' : null}`}>
                    <td>{cliente.codRecibo}</td>
                    <td>{cliente.Modalidad}</td>
                    <td>{cliente.Nombre}</td>
                    <td>{cliente.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
      <div>
        <div className="gastos tb-info">
          <span>GASTOS</span>
          {iGastos ? (
            <div className="daily-expenses">
              <table>
                <thead>
                  <tr>
                    <th>Descripcion</th>
                    <th>Fecha y Hora</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {iGastos.map((gasto, index) => (
                    <tr
                      key={index}
                      //style={{ background: gasto._state === 'anulado' ? '#ff686847' : '#fff' }}
                      className={`${gasto._state === 'anulado' ? 'mode-anulado' : null}`}
                    >
                      <td>{gasto.descripcion}</td>
                      <td>
                        {gasto.fecha} / {gasto.hora}
                      </td>
                      <td>{gasto.monto}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
        <div className="transferencia tb-info">
          <span>{ingresoDigital}</span>
          {iClienteTransferencia ? (
            <div className="paid-orders-tranf">
              <table>
                <thead>
                  <tr>
                    <th>Codigo</th>
                    <th>Modalidad</th>
                    <th>Nombre</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {iClienteTransferencia.map((cliente, index) => (
                    <tr
                      key={index}
                      // style={{ background: cliente.estadoPrenda === 'anulado' ? '#ff686847' : '#fff' }}
                      className={`${cliente.estadoPrenda === 'anulado' ? 'mode-anulado' : null}`}
                    >
                      <td>{cliente.codRecibo}</td>
                      <td>{cliente.Modalidad}</td>
                      <td>{cliente.Nombre}</td>
                      <td>{cliente.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
        <div className="tarjeta tb-info">
          <span>TARJETA</span>
          {iClienteTarjeta ? (
            <div className="paid-orders-tarj">
              <table>
                <thead>
                  <tr>
                    <th>Codigo</th>
                    <th>Modalidad</th>
                    <th>Nombre</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {iClienteTarjeta.map((cliente, index) => (
                    <tr key={index} className={`${cliente.estadoPrenda === 'anulado' ? 'mode-anulado' : null}`}>
                      <td>{cliente.codRecibo}</td>
                      <td>{cliente.Modalidad}</td>
                      <td>{cliente.Nombre}</td>
                      <td>{cliente.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </InfoExtra>
  );
};

export default ListPagos;
