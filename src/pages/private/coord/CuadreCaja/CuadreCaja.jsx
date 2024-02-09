/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { DateCurrent } from '../../../../utils/functions/index';
import { DatePickerInput } from '@mantine/dates';

import { GetDeliverysDate } from '../../../../redux/actions/aDelivery';
import { GetGastoDate } from '../../../../redux/actions/aGasto';
import { GetOrdenServices_Date } from '../../../../redux/actions/aOrdenServices';
import { GetCuadre, SaveCuadre, UpdateCuadre } from '../../../../redux/actions/aCuadre';
import { GetAnuladoId, GetOrderId } from '../../../../services/default.services';

import { modals } from '@mantine/modals';
import { Button, Text } from '@mantine/core';
import './cuadreCaja.scss';

import { jsPDF } from 'jspdf';
import { PrivateRoutes } from '../../../../models';

import { LS_updateGasto } from '../../../../redux/states/gasto';
import { LS_CancelarDeliveryDevolucion } from '../../../../redux/states/delivery';

import LoaderSpiner from '../../../../components/LoaderSpinner/LoaderSpiner';
import { socket } from '../../../../utils/socket/connect';
import { Notify } from '../../../../utils/notify/Notify';
import { ingresoDigital } from '../../../../services/global';
import CashCounter from './CashCounter/CashCounter';
import InfoCuadre from './InfoCuadre/InfoCuadre';
import FinalBalance from './FinalBalance/FinalBalance';
import ListPagos from './ListPagos/ListPagos';
import Portal from '../../../../components/PRIVATE/Portal/Portal';

const CuadreCaja = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const certificateTemplateRef = useRef(null);
  const InfoUsuario = useSelector((state) => state.user.infoUsuario);
  const { infoCuadre, lastCuadre, cuadrePrincipal, cuadreActual, infoBase } = useSelector((state) => state.cuadre);

  const infoGastos = useSelector((state) => state.gasto.infoGasto);
  const infoDelivery = useSelector((state) => state.delivery.infoDeliveryDate);
  const infoRegisteredDay = useSelector((state) => state.orden.infoRegisteredDay);

  const [datePrincipal, setDatePrincipal] = useState({
    fecha: DateCurrent().format4,
    hora: DateCurrent().format3,
  });

  const [onLoading, setOnLoading] = useState(false);

  const [iState, setIState] = useState();
  const [totalCaja, setTotalCaja] = useState(0);

  const [gastos, setGastos] = useState(0);
  const [delivery, setDelivery] = useState(0);
  const [gastosFinal, setGastosFinal] = useState(0);
  const [pedidosPagadosEfectivo, setPedidosPagadosEfectivo] = useState(0);
  const [pedidosPagadosTransferencia, setPedidosPagadosTransferencia] = useState(0);
  const [pedidosPagadosTarjeta, setPedidosPedidosPagadosTarjeta] = useState(0);

  const [iClienteEfectivo, setIClienteEfectivo] = useState();
  const [iClienteTransferencia, setIClienteTransferencia] = useState();
  const [iClienteTarjeta, setIClienteTarjeta] = useState();

  const [iGastosFinal, setIGastosFinal] = useState([]);

  const [montoPrevisto, setMontoPrevisto] = useState(0);

  const [stateCuadre, setStateCuadre] = useState();

  const [savedActivated, setSavedActivated] = useState(false);

  const [cajaFinal, setCajaFinal] = useState(0);

  const [showPortalCuadres, setShowPortalCuadres] = useState(false);

  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filteredGastos, setFilteredGastos] = useState([]);
  const [filteredDeliverys, setFilteredDeliverys] = useState([]);

  const [posCuadre, setPosCuadre] = useState(-1);
  const [sButtonLeft, setSButtonLeft] = useState(false);
  const [sButtonRight, setSButtonRight] = useState(false);

  ////////////////////////////////////////////////////////////////////////

  const handleChangeMontos = (newMonto) => {
    setIState((prevState) => ({
      ...prevState,
      Montos: newMonto,
    }));
    if (datePrincipal.fecha === DateCurrent().format4) {
      const updatedState = {
        ...iState,
        Montos: newMonto,
      };

      localStorage.setItem('cuadreCaja', JSON.stringify(updatedState));
    }
  };

  const handleChangeTotalCaja = (finalMonto) => {
    setTotalCaja(finalMonto);
  };

  const handleSavedActivated = (value) => {
    setSavedActivated(value);
  };

  const handleChangeCorte = (newCorte) => {
    const boxFinal = parseFloat(totalCaja - newCorte).toFixed(2);

    setIState((prevState) => {
      const updatedState = {
        ...prevState,
        corte: newCorte,
        cajaFinal: boxFinal,
      };

      if (datePrincipal.fecha === DateCurrent().format4) {
        localStorage.setItem('cuadreCaja', JSON.stringify(updatedState));
      }

      return updatedState;
    });

    setCajaFinal(boxFinal);
  };

  const handleChangeNotas = (newNota) => {
    setIState((prevState) => {
      const updatedState = {
        ...prevState,
        notas: newNota,
      };

      // Comprueba la condición y actualiza el localStorage después de establecer el estado
      if (datePrincipal.fecha === DateCurrent().format4) {
        localStorage.setItem('cuadreCaja', JSON.stringify(updatedState));
      }

      return updatedState;
    });
  };

  const MontoPrevisto = () => {
    const MontoInicial = parseFloat(
      datePrincipal.fecha === DateCurrent().format4 && lastCuadre && lastCuadre.date.fecha !== DateCurrent().format4
        ? lastCuadre.cajaFinal
        : iState?.cajaInicial
    );

    setMontoPrevisto(
      (parseFloat(MontoInicial) + parseFloat(pedidosPagadosEfectivo) - parseFloat(gastosFinal)).toFixed(2)
    );
  };

  const handleViewCuadre = (cuadre) => {
    setIState();

    const dPrincipal = moment(datePrincipal.fecha, 'YYYY-MM-DD');
    const dLastCuadre = moment(lastCuadre?.date?.fecha, 'YYYY-MM-DD');

    const sIgual = dPrincipal.isSame(dLastCuadre);

    if (InfoUsuario._id === cuadre.infoUser._id && sIgual && cuadre.index === lastCuadre.index) {
      chageInfo({ ...cuadre, enable: false });
    } else {
      chageInfo(cuadre);
    }
  };

  ////////////////////////////////////////////////////////////////////////

  const GetFilteredOrders = (pagos) => {
    const IdsPagos = {};

    pagos.forEach((pago) => {
      const { _id, idPago } = pago;
      if (IdsPagos[_id]) {
        IdsPagos[_id].idsPago.push(idPago);
      } else {
        IdsPagos[_id] = { idOrder: _id, idsPago: [idPago] };
      }
    });

    // Convertimos el objeto a un array de sus valores para el resultado final
    return Object.values(IdsPagos);
  };

  const AgruparPagosByMetodo = (pagos) => {
    const resultado = {};

    pagos.forEach(({ _id, metodoPago, total, ...resto }) => {
      const clave = `${_id}-${metodoPago}`;

      if (!resultado[clave]) {
        resultado[clave] = {
          _id,
          metodoPago,
          total,
          ...resto,
        };
      } else {
        resultado[clave].total += total;
      }
    });

    return Object.values(resultado).map(({ idPago, ...resto }) => resto);
  };

  const handleGetPagos = (orders, fechaPrincipal) => {
    const pagos = [];
    let index = 0;

    orders.forEach((order) => {
      if (order.Pago !== 'Pendiente') {
        order.ListPago.forEach((pago) => {
          const esPagoValido =
            (order.modeRegistro !== 'antiguo' && pago.date.fecha === fechaPrincipal) ||
            (order.modeRegistro === 'antiguo' &&
              pago.date.fecha !== order.dateRecepcion.fecha &&
              pago.date.fecha === fechaPrincipal);

          if (
            (esPagoValido && pago.idUser === iState?.infoUser._id && pago.idCuadre === '') ||
            pago.idCuadre === iState?._id
          ) {
            pagos.push({
              index: index++,
              _id: order._id,
              idPago: pago._id,
              codRecibo: order.codRecibo,
              Modalidad: order.Modalidad,
              estadoPrenda: order.estadoPrenda,
              metodoPago: pago.metodoPago,
              Nombre: order.Nombre,
              total: pago.total,
              idUser: pago.idUser,
              idCuadre: pago.idCuadre,
            });
          }
        });
      }
    });

    const pagosAprobados = pagos.filter((oa) => !(oa.estadoPrenda === 'anulado' && oa.idCuadre === ''));

    const iOrdersFilter = GetFilteredOrders(pagosAprobados);
    setFilteredOrders(iOrdersFilter);

    const res = AgruparPagosByMetodo(pagosAprobados);

    return res;
  };

  const openModal = (value) => {
    const clonedElement = certificateTemplateRef.current.cloneNode(true);

    modals.openConfirmModal({
      title: value === true ? 'Guardar y Generar PDF' : 'Generar PDF',
      centered: true,
      children: (
        <Text size="sm">{`${
          value === true
            ? '¿ Estas seguro que quieres quieres guardar y generar el PDF ?'
            : '¿ Estas seguro que quieres generar el PDF ?'
        }`}</Text>
      ),
      labels: { confirm: 'Si', cancel: 'No' },
      confirmProps: { color: 'green' },
      onCancel: () => {
        setSavedActivated(false);
        setOnLoading(false);
      },
      onConfirm: () => {
        setOnLoading(true);
        setTimeout(() => {
          value === true ? handleSaved(clonedElement) : handleGeneratePdf(clonedElement);
        }, 500);
      },
    });
  };

  const handleSaved = (clonedElement) => {
    setOnLoading(true);
    const { enable, type, saved, ...infoCuadre } = iState;

    const iCuadre = {
      infoCuadre: {
        ...infoCuadre,
        date: {
          ...infoCuadre.date,
          hora: DateCurrent().format3,
        },
        cajaFinal: cajaFinal,
        egresos: { delivery, gastos },
        ingresos: {
          efectivo: pedidosPagadosEfectivo,
          tarjeta: pedidosPagadosTransferencia,
          transferencia: pedidosPagadosTarjeta,
        },
        estado: stateCuadre === 0 ? 'Cuadro' : stateCuadre > 0 ? 'Sobra' : 'Falta',
        margenError: stateCuadre,
        totalCaja: totalCaja,
        userID: InfoUsuario._id,
      },
      orders: filteredOrders,
      deliverys: filteredDeliverys,
      gastos: filteredGastos,
      rol: InfoUsuario.rol,
    };

    // console.log(iCuadre);

    dispatch(
      type === 'update'
        ? UpdateCuadre({
            idCuadre: infoCuadre._id,
            infoCuadreDiario: iCuadre,
          })
        : SaveCuadre(iCuadre)
    ).then(async (res) => {
      if (res.payload) {
        await handleGeneratePdf(clonedElement);
        localStorage.removeItem('cuadreCaja');
      }
    });
  };

  const handleGeneratePdf = (clonedElement) => {
    clonedElement.style.transform = 'scale(0.338)';
    clonedElement.style.transformOrigin = 'left top';

    // Establecer altura máxima y márgenes
    clonedElement.style.maxHeight = '842px'; // Altura máxima del tamaño A4

    const doc = new jsPDF({
      format: 'a4',
      unit: 'px',
    });

    doc.html(clonedElement, {
      callback: function (pdf) {
        pdf.save(`Informe (${datePrincipal.fecha}).pdf`);
        setTimeout(() => {
          navigate(`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.LIST_ORDER_SERVICE}`);
        }, 1000);
      },
    });
  };

  const sumaMontos = (clientes) => {
    return clientes
      .filter((cliente) => !(cliente.typeRegistro === 'pendiente' && cliente.estadoPrenda === 'anulado'))
      .reduce((sum, cliente) => sum + (parseFloat(cliente.total) || 0), 0)
      .toFixed(2);
  };

  const chageInfo = (info) => {
    setOnLoading(true);
    setIState(info);
    setTimeout(() => {
      setOnLoading(false);
    }, 1500);
  };

  useEffect(() => {
    const handleGetInfoCuadre = async () => {
      await dispatch(GetCuadre({ date: datePrincipal.fecha, id: InfoUsuario._id }));
      await dispatch(GetDeliverysDate(datePrincipal.fecha));
      await dispatch(GetGastoDate(datePrincipal.fecha));
      await dispatch(GetOrdenServices_Date(datePrincipal.fecha));
    };
    handleGetInfoCuadre();
  }, [datePrincipal]);

  useEffect(() => {
    const procesarData = async () => {
      if (infoRegisteredDay) {
        const ordersByPay = await handleGetPagos(infoRegisteredDay, datePrincipal.fecha);

        let orderPaysByIds;

        if (iState?.saved) {
          orderPaysByIds = ordersByPay.filter(
            (pay) => pay.idUser === iState?.infoUser._id && (pay.idCuadre === '' || pay.idCuadre === iState?._id)
          );
        } else {
          orderPaysByIds = ordersByPay.filter((pay) => pay.idUser === iState?.infoUser._id && pay.idCuadre === '');
        }

        const cEfectivo = orderPaysByIds.filter((d) => d.metodoPago === 'Efectivo');
        const cTransferencia = orderPaysByIds.filter((d) => d.metodoPago === ingresoDigital);
        const cTarjeta = orderPaysByIds.filter((d) => d.metodoPago === 'Tarjeta');

        setPedidosPagadosEfectivo(sumaMontos(cEfectivo));
        setPedidosPagadosTransferencia(sumaMontos(cTransferencia));
        setPedidosPedidosPagadosTarjeta(sumaMontos(cTarjeta));

        setIClienteEfectivo(cEfectivo);
        setIClienteTransferencia(cTransferencia);
        setIClienteTarjeta(cTarjeta);
      }

      if (infoDelivery) {
        const infoProductPromises = infoDelivery
          .filter(
            (d) =>
              d.fecha === datePrincipal.fecha &&
              d.idUser === iState?.infoUser._id &&
              (d.idCuadre === '' || d.idCuadre === iState?._id)
          )
          .map(async (d) => {
            const orderByDelivery = await GetOrderId(d.idCliente);

            if (orderByDelivery?.estadoPrenda === 'anulado') {
              const infoAnulacion = await GetAnuladoId(orderByDelivery._id);

              const commonProperties = {
                id: d._id,
                descripcion: `${d.descripcion} - ${d.name}`,
                fecha: d.fecha,
                hora: d.hora,
                monto: d.monto,
                _state: 'anulado',
              };

              return {
                ...commonProperties,
                cSuma: infoAnulacion.fecha === d.fecha && d.idCuadre === '' ? false : true,
              };
            } else {
              return {
                id: d._id,
                descripcion: `${d.descripcion} - ${d.name}`,
                fecha: d.fecha,
                hora: d.hora,
                monto: d.monto,
                _state: 'activo',
                cSuma: true,
              };
            }
          });

        const infoProduct = await Promise.all(infoProductPromises);

        const filteredIds = infoProduct.filter((item) => item._state !== 'anulado').map((item) => item.id);
        setFilteredDeliverys(filteredIds);

        const infoGasto = infoGastos
          .filter(
            (g) =>
              g.fecha === datePrincipal.fecha &&
              g.idUser === iState?.infoUser._id &&
              (g.idCuadre === '' || g.idCuadre === iState?._id)
          )
          .map((g) => {
            return {
              ...g,
              id: g._id,
              _state: 'activo',
              cSuma: true,
            };
          });

        setFilteredGastos(infoGasto.map((g) => g.id));

        const sumaMontos = (lista) => {
          return lista
            .reduce((sum, gastos) => {
              return sum + (gastos.cSuma ? parseFloat(gastos.monto) : 0);
            }, 0)
            .toFixed(2);
        };

        const infoGastosFinal = [...infoGasto, ...infoProduct].flat(1);
        setIGastosFinal(infoGastosFinal);

        const sumaDelivery = sumaMontos(infoProduct);
        const sumaGastos = sumaMontos(infoGasto);

        const sumaGastosFinal = sumaMontos(infoGastosFinal);

        setDelivery(sumaDelivery);
        setGastos(sumaGastos);
        setGastosFinal(sumaGastosFinal);
      }
    };

    procesarData();
  }, [infoRegisteredDay, infoGastos, infoDelivery, datePrincipal, iState]);

  useEffect(() => {
    if (infoCuadre?.length > 0) {
      setPosCuadre(infoCuadre.length);
      setSButtonLeft(true);
    }
  }, [infoCuadre]);

  useEffect(() => {
    if (infoCuadre?.length === 0 || posCuadre === 0) {
      setSButtonLeft(false);
    } else {
      setSButtonLeft(true);
    }

    if (posCuadre >= 0 && posCuadre < infoCuadre?.length) {
      setSButtonRight(true);
    }

    if (posCuadre === infoCuadre?.length) {
      setSButtonRight(false);
    }
  }, [posCuadre, infoCuadre]);

  useEffect(() => {
    setOnLoading(true);
    const cuadreLS = JSON.parse(localStorage.getItem('cuadreCaja'));
    if (cuadreLS?.date.fecha === datePrincipal.fecha && cuadreLS.infoUser._id === InfoUsuario._id) {
      chageInfo(cuadreLS);
    } else {
      chageInfo(cuadreActual);
    }
  }, [datePrincipal, cuadrePrincipal, cuadreActual]);

  useEffect(() => {
    MontoPrevisto();
  }, [pedidosPagadosEfectivo, gastosFinal, totalCaja, datePrincipal, iState]);

  useEffect(() => {
    setCajaFinal(parseFloat(totalCaja - iState?.corte).toFixed(2));
  }, [iState, totalCaja]);

  useEffect(() => {
    setStateCuadre((totalCaja - montoPrevisto).toFixed(2));
  }, [iState, totalCaja, montoPrevisto]);

  // useEffect(() => {
  //   if (iState) {
  //     setOnLoading(false);
  //   }
  // }, [iState]);

  useEffect(() => {
    socket.on('server:cGasto', (data) => {
      dispatch(LS_updateGasto(data));
    });

    socket.on('server:changeCuadre:child', (data) => {
      Notify('CUADRE DE CAJA A SIDO ACTUALIZADO', 'vuelve a ingresar', 'warning');
      navigate(`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.LIST_ORDER_SERVICE}`);
    });

    socket.on('server:cancel-delivery', (data) => {
      if (datePrincipal.fecha === DateCurrent().format4) {
        dispatch(LS_CancelarDeliveryDevolucion(data));
      }
    });

    return () => {
      // Remove the event listener when the component unmounts
      socket.off('server:cancel-delivery');
      socket.off('server:cGasto');
      socket.off('server:changeCuadre:child');
      socket.off('cAnular');
    };
  }, []);

  return (
    <div className="content-cuadre">
      {iState ? (
        <div
          style={{
            display: onLoading === false ? 'block' : 'none',
          }}
        >
          <div className="state-cuadre" style={{ background: iState.saved ? '#53d895' : '#ed7b72' }}>
            <h1>
              {iState.saved
                ? lastCuadre.date.fecha === datePrincipal.fecha && lastCuadre?.infoUser._id === iState?.infoUser._id
                  ? 'Ultimo Cuadre Guardado'
                  : 'Cuadre Guardado'
                : 'Cuadre No guardado'}
            </h1>
          </div>
          <ContainerCC id="cuadreStructure" ref={certificateTemplateRef}>
            <BodyContainerCC>
              <HeaderCC>
                <div className="h-superior">
                  <h1 className="title">CUADRE&nbsp;DIARIO</h1>
                  <h1 className="title">"{iState?.infoUser?.name.toUpperCase()}"</h1>
                </div>
                <div className="h-inferior">
                  <div className="previous">
                    {sButtonLeft && !savedActivated ? (
                      <Button
                        type="button"
                        onClick={() => {
                          chageInfo(infoCuadre[posCuadre - 1]);
                          setPosCuadre(posCuadre - 1);
                        }}
                      >
                        <i className="fas fa-angle-left" />
                      </Button>
                    ) : null}
                  </div>
                  <div className="date-filter">
                    <DatePickerInput
                      clearable={false}
                      value={moment(datePrincipal.fecha).toDate()}
                      maxDate={new Date()}
                      minDate={moment('2023-08-22').toDate()}
                      onChange={(date) => {
                        setDatePrincipal((prevState) => ({
                          ...prevState,
                          fecha: moment(date).format('YYYY-MM-DD'),
                        }));
                      }}
                      mx="auto"
                      maw={200}
                    />
                  </div>
                  <div className="next">
                    {sButtonRight && !savedActivated ? (
                      <Button
                        type="button"
                        onClick={() => {
                          if (posCuadre + 1 === infoCuadre.length) {
                            const cuadreLS = JSON.parse(localStorage.getItem('cuadreCaja'));
                            if (
                              cuadreLS?.date.fecha === datePrincipal.fecha &&
                              cuadreLS.infoUser._id === InfoUsuario._id
                            ) {
                              chageInfo(cuadreLS);
                            } else {
                              chageInfo(cuadreActual);
                            }
                          } else {
                            chageInfo(infoCuadre[posCuadre + 1]);
                          }
                          setPosCuadre(posCuadre + 1);
                        }}
                      >
                        <i className="fas fa-angle-right" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </HeaderCC>
              <BodyCC>
                <div className="info-top">
                  <CashCounter
                    ListMontos={iState?.Montos}
                    handleChangeMontos={handleChangeMontos}
                    totalCaja={totalCaja}
                    handleChangeTotalCaja={handleChangeTotalCaja}
                    datePrincipal={datePrincipal}
                    sDisabledCuadre={iState?.enable}
                  />
                  <InfoCuadre
                    cajaInicial={iState?.cajaInicial}
                    gastos={gastosFinal}
                    pedidosPagadosEfectivo={pedidosPagadosEfectivo}
                    pedidosPagadosTransferencia={pedidosPagadosTransferencia}
                    pedidosPagadosTarjeta={pedidosPagadosTarjeta}
                    montoPrevisto={montoPrevisto}
                    stateCuadre={stateCuadre}
                  />
                  <FinalBalance
                    totalCaja={totalCaja}
                    infoState={iState}
                    sDisabledCuadre={iState?.enable}
                    openModal={openModal}
                    handleSavedActivated={handleSavedActivated}
                    savedActivated={savedActivated}
                    handleChangeCorte={handleChangeCorte}
                    handleChangeNotas={handleChangeNotas}
                    cajaFinal={cajaFinal}
                    datePrincipal={datePrincipal}
                  />
                </div>
                <ListPagos
                  iGastos={iGastosFinal}
                  iClienteEfectivo={iClienteEfectivo}
                  iClienteTarjeta={iClienteTarjeta}
                  iClienteTransferencia={iClienteTransferencia}
                />
              </BodyCC>
            </BodyContainerCC>
          </ContainerCC>
        </div>
      ) : null}
      {onLoading ? (
        <div className="content-loading ">
          <div
            className="loading-general"
            style={{
              display: onLoading === false ? 'none' : 'flex',
            }}
          >
            <LoaderSpiner />
          </div>
        </div>
      ) : null}

      {showPortalCuadres ? (
        <Portal
          onClose={() => {
            setShowPortalCuadres(false);
          }}
        >
          <div className="cuadres-preview">
            {infoCuadre.map((cuadre, index) => (
              <Button
                onClick={() => {
                  handleViewCuadre(cuadre);
                  setShowPortalCuadres(false);
                }}
                key={index}
                type="button"
                className={`btn-preview  ${
                  iState?.index === index + 1 && iState.cuadre.date.fecha === datePrincipal.fecha ? 'selected-ls' : null
                }`}
              >
                {cuadre.infoUser.name.toUpperCase()} -&nbsp; CUADRE : N° {index + 1}
              </Button>
            ))}
          </div>
        </Portal>
      ) : null}
    </div>
  );
};

export const ContainerCC = styled.div`
  position: relative;
  width: 100%;
  max-width: 1350px;
  //border: 1px solid #ccc;
  //border-radius: 4px;
  margin: auto;
  padding-top: 20px;
`;

export const BodyContainerCC = styled.div`
  position: relative;
  padding: 5px;
  background-color: #fff;
  display: grid;
  grid-template-rows: max-content auto;
`;

export const HeaderCC = styled.div`
  display: grid;
  place-items: center;
  padding: 5px 25px;
  border-bottom: solid 1px silver;
  border-top: solid 1px silver;

  .h-superior {
    text-align: center;
    .title {
      margin-bottom: 0;
      margin-bottom: 0;
      word-spacing: 10px;
    }
  }
  .date-filter {
    width: 300px;
    button {
      text-align: center !important;
    }
  }
`;

const BodyCC = styled.div`
  max-width: 1350px;
  display: grid;

  .info-top {
    width: 100%;
    display: grid;
    grid-template-columns: 450px 1fr 1fr;

    .info-cuadre {
      display: grid;
      grid-template-rows: 305px auto;
      padding: 20px 10%;

      .form-ic {
        max-width: 300px;
        display: grid;
        gap: 10px;
      }

      .response-ic {
        .bloques-states {
          margin: 25px 0;
          display: grid;
          grid-template-rows: 1fr 1fr 1fr;
          gap: 10px;

          .sb {
            background: #afffa8;
          }

          .cd {
            background: #f9ffa8;
          }

          .fl {
            background: #ffa8a8;
          }

          .states {
            width: max-content;
            text-align: center;
            color: #6c757d;
            font-weight: bold;
            display: grid;
            grid-template-columns: 125px max-content;

            .bloque {
              padding: 10px 20px;
              line-height: 2;
            }

            .title {
              border: solid 1px silver;
              border-radius: 15px 1px 1px 15px;
              border-right: none;
            }

            .res {
              border: solid 1px silver;
              border-radius: 1px 15px 15px 1px;
              border-left: solid 0.5px silver;
              min-width: 125px;
            }
          }
        }
      }
    }
  }
  }
`;

export default CuadreCaja;
