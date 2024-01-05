﻿/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { Autocomplete, NumberInput, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import React, { useEffect, useRef, useState } from 'react';

import { useFormik } from 'formik';
import * as Yup from 'yup';

import { useNavigate } from 'react-router-dom';

import BotonModel from '../../../../../components/PRIVATE/BotonModel/BotonModel';
import SwitchModel from '../../../../../components/SwitchModel/SwitchModel';
import InputSelectedPrenda from '../../../../../components/PRIVATE/InputSelectedPrenda/InputSelectedPrenda';
import MetodoPago from '../../../../../components/PRIVATE/MetodoPago/MetodoPago';
import Portal from '../../../../../components/PRIVATE/Portal/Portal';
import './addOld.scss';

import { ReactComponent as Eliminar } from '../../../../../utils/img/OrdenServicio/eliminar.svg';

import Tranferencia from '../../../../../utils/img/OrdenServicio/Transferencia.png';
import Efectivo from '../../../../../utils/img/OrdenServicio/dinero.png';
import Tarjeta from '../../../../../utils/img/OrdenServicio/card.png';

import Tag from '../../../../../components/Tag/Tag';

import moment from 'moment';

import { Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { useDispatch, useSelector } from 'react-redux';
import { PrivateRoutes } from '../../../../../models';
import axios from 'axios';

import { AddOrdenServices } from '../../../../../redux/actions/aOrdenServices';
import { documento, ingresoDigital, nameImpuesto, simboloMoneda } from '../../../../../services/global';

const AddOld = () => {
  const infoPrendas = useSelector((state) => state.prenda.infoPrendas);
  const InfoUsuario = useSelector((state) => state.user.infoUsuario);
  const infoNegocio = useSelector((state) => state.negocio.infoNegocio);

  const { InfoImpuesto, InfoPuntos } = useSelector((state) => state.modificadores);
  const codFinal = useSelector((state) => state.codigo.infoCodigo.codFinal);

  const [isPortal, setIsPortal] = useState(false);

  // Lista de clientes
  const [infoClientes, setInfoClientes] = useState([]);
  // // Puntos del cliente Actual
  const [dataScore, setDataScore] = useState(false);
  // // valor por puntos
  const [vScore, setVScore] = useState(null);
  // Impuesto
  const [impuesto, setImpuesto] = useState(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const validationSchema = Yup.object().shape({
    codigo: Yup.string().required('Campo Numerico obligatorio (1 - 1000)'),
    name: Yup.string().required('Campo obligatorio'),
    dateRecojo: Yup.string().required('Ingrese Fecha (obligatorio)'),
    datePrevista: Yup.string().required('Ingrese Fecha (obligatorio)'),
    productos: Yup.array()
      .min(1, 'Debe haber al menos un producto')
      .test('categoria', 'Debe haber al menos un producto - Delivery no cuenta', function (value) {
        return value.some((item) => item.categoria !== 'Delivery');
      }),
  });

  const getPricePrenda = (nombre) => {
    const garment = infoPrendas.find((prenda) => prenda.name.toLowerCase() === nombre.toLowerCase());
    if (garment) {
      return garment.price;
    }

    return 0;
  };

  const formik = useFormik({
    initialValues: {
      codigo: '',
      name: '',
      phone: '',
      dateRecojo: '',
      datePrevista: '',
      datePago: '',
      productos: [],
      descuento: '',
      swModalidad: 'Tienda',
      swPagado: false,
      metodoPago: '',
      //
      dni: '',
      subTotal: '',
      totalNeto: '',
      cargosExtras: {
        beneficios: {
          puntos: 0,
          promociones: [],
        },
        descuentos: {
          redondeo: 0,
          puntos: 0,
          promocion: 0,
        },
        igv: {
          valor: impuesto,
          importe: 0,
        },
      },
      factura: false,
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      openModal(values);
    },
  });

  const openModal = (data) =>
    modals.openConfirmModal({
      title: 'Registro de Factura',
      centered: true,
      children: <Text size="sm">¿ Estas seguro de registrar esta factura ?</Text>,
      labels: { confirm: 'Si', cancel: 'No' },
      confirmProps: { color: 'green' },
      //onCancel: () => console.log("Cancelado"),
      onConfirm: () => handleGetInfo(data),
    });

  const addRowGarment = (/*tipo, */ producto, precio, stateCantidad /*, categoria*/) => {
    const newRow = {
      stado: stateCantidad,
      price: precio,
      type: 'Prenda',
      cantidad: 1,
      producto: producto,
      descripcion: '',
      expanded: false,
      total: precio,
      // categoria: categoria,
    };
    return newRow;
  };

  function tFecha(fecha) {
    const fechaFormateada = moment(fecha).format('YYYY-MM-DD');
    return fechaFormateada;
  }

  function tHora(horaOriginal, cantidadHoras, antesDespues) {
    const operacion = antesDespues === 'antes' ? 'subtract' : antesDespues === 'despues' ? 'add' : null;

    if (operacion) {
      return moment(horaOriginal, 'HH:mm')[operacion](cantidadHoras, 'hours').format('HH:mm');
    } else {
      return 'Formato no válido. Usa "antes" o "despues".';
    }
  }

  const handleGetInfo = (info) => {
    const infoProduct = info.productos.map((p) => ({
      cantidad: p.cantidad,
      producto: p.producto,
      descripcion: p.descripcion,
      precio: p.price,
      total: p.total,
    }));

    const infoRecibo = {
      codRecibo: info.codigo,
      dateRecepcion: {
        fecha: tFecha(info.dateRecojo),
        hora: tHora(infoNegocio.horario.horas.inicio, 1, 'despues'),
      },
      Modalidad: info.swModalidad,
      Nombre: info.name,
      Producto: infoProduct,
      celular: info.phone,
      Pago: info.swPagado ? 'Pagado' : 'Pendiente',
      datePago: info.swPagado
        ? {
            fecha: tFecha(info.dateRecojo),
            hora: tHora(infoNegocio.horario.horas.inicio, 1, 'despues'),
          }
        : {
            fecha: '',
            hora: '',
          },
      datePrevista: {
        fecha: tFecha(info.datePrevista),
        hora: tHora(infoNegocio.horario.horas.fin, 1, 'antes'),
      },
      dateEntrega: {
        fecha: '',
        hora: '',
      },
      metodoPago: info.metodoPago,
      descuento: info.descuento,
      estadoPrenda: 'pendiente',
      estado: 'registrado',
      dni: info.dni,
      factura: info.factura,
      subTotal: info.subTotal,
      cargosExtras: info.cargosExtras,
      totalNeto: info.totalNeto,
      modeRegistro: 'antiguo',
      modoDescuento: 'Puntos',
      notas: [],
      gift_promo: [],
      attendedBy: {
        name: InfoUsuario.name,
        rol: InfoUsuario.rol,
      },
      lastEdit: [],
      typeRegistro: 'normal',
    };

    dispatch(
      AddOrdenServices({
        infoRecibo,
        rol: InfoUsuario.rol,
      })
    ).then((res) => {
      if (res.payload) {
        navigate(`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.LIST_ORDER_SERVICE}`);
      }
    });
  };

  const handleGetClientes = async (dni) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/lava-ya/get-clientes/${dni}`);
      const data = response.data;
      setInfoClientes(data);
    } catch (error) {
      console.error('Error al obtener los datos:', error.message);
    }
  };

  const validIco = (mensaje) => {
    return (
      <div className="ico-req">
        <i className="fa-solid fa-circle-exclamation ">
          <div className="info-req" style={{ pointerEvents: 'none' }}>
            <span>{mensaje}</span>
          </div>
        </i>
      </div>
    );
  };

  const calculateTotalNeto = (productos) => {
    let subtotal = 0;

    if (productos && productos.length > 0) {
      subtotal = productos.reduce((sum, producto) => {
        const total = parseFloat(producto.total) || 0;

        return sum + total;
      }, 0);
    }

    return subtotal;
  };

  useEffect(() => {
    setVScore(InfoPuntos);

    formik.setFieldValue('cargosExtras.igv.valor', InfoImpuesto.IGV);
    setImpuesto(InfoImpuesto.IGV);
  }, [InfoPuntos, InfoImpuesto]);

  useEffect(() => {
    const subtotal = Number(calculateTotalNeto(formik.values.productos).toFixed(2));

    formik.setFieldValue('subTotal', subtotal);
  }, [formik.values.productos]);

  useEffect(() => {
    const subTotal = formik.values.subTotal;
    let montoImpuesto = 0;
    if (formik.values.factura === true) {
      montoImpuesto = +(subTotal * impuesto).toFixed(2);
    }
    formik.setFieldValue('cargosExtras.igv.importe', montoImpuesto);
    const total = subTotal + montoImpuesto;
    const descuento = formik.values.cargosExtras.descuentos.puntos;
    formik.setFieldValue('descuento', descuento);
    const totalNeto = total - descuento;
    formik.setFieldValue('totalNeto', (Math.floor(totalNeto * 10) / 10).toFixed(1));
  }, [
    formik.values.cargosExtras.igv,
    formik.values.productos,
    formik.values.cargosExtras.descuentos,
    formik.values.factura,
    formik.values.subTotal,
  ]);
  return (
    <div className="space-ra">
      <div className="title-action">
        <h1 className="elegantshadow">Agregando Factura</h1>
        <h1 className="elegantshadow">- Antigua -</h1>
      </div>
      <form onSubmit={formik.handleSubmit} className="content-registro-antiguo">
        <div className="info-ra">
          <>
            <div className="space-paralelos">
              <div className="paralelo">
                <Autocomplete
                  name="dni"
                  onChange={(dni) => {
                    handleGetClientes(dni);
                    formik.setFieldValue('dni', dni);
                    setDataScore();
                    // formik.setFieldValue('name', '');
                    // formik.setFieldValue('phone', '');
                    formik.setFieldValue('cargosExtras.descuentos.puntos', 0);
                    formik.setFieldValue('cargosExtras.beneficios.puntos', 0);
                  }}
                  label={`${documento} :`}
                  placeholder={`Ingrese ${documento}`}
                  defaultValue={formik.values.dni}
                  onItemSubmit={(selected) => {
                    const cliente = infoClientes.find((obj) => obj.dni === selected.value);
                    formik.setFieldValue('name', cliente.nombre);
                    formik.setFieldValue('phone', cliente.phone);

                    setDataScore(cliente);
                  }}
                  data={infoClientes.length > 0 ? infoClientes.map((obj) => obj.dni) : []}
                />
                <div className="space-info">
                  <NumberInput
                    name="codigo"
                    label="Codigo :"
                    value={formik.values.codigo}
                    precision={0}
                    onChange={(e) => {
                      formik.setFieldValue('codigo', !Number.isNaN(e) ? e : 0);
                    }}
                    min={1}
                    step={1}
                    max={+codFinal}
                    hideControls
                    autoComplete="off"
                  />
                  {formik.errors.codigo && formik.touched.codigo && validIco(formik.errors.codigo)}
                </div>
                <div className="space-info">
                  <TextInput
                    name="name"
                    label="Nombre :"
                    radius="md"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    autoComplete="off"
                  />
                  {formik.errors.name && formik.touched.name && validIco(formik.errors.name)}
                </div>
                <TextInput
                  name="phone"
                  label="Celular :"
                  radius="md"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  autoComplete="off"
                />
              </div>
              <div className="paralelo">
                <div className="space-info">
                  <DateInput
                    label="Fecha Recojo :"
                    name="dateRecojo"
                    value={formik.values.dateRecojo}
                    onChange={(date) => {
                      formik.setFieldValue('dateRecojo', date);
                      formik.setFieldValue('datePrevista', date);
                      formik.setFieldValue('datePago', date);
                    }}
                    placeholder="Ingrese Fecha"
                    maxDate={moment().subtract(1, 'day').toDate()}
                    //onNextYear
                  />
                  {formik.errors.dateRecojo && formik.touched.dateRecojo && validIco(formik.errors.dateRecojo)}
                </div>
                <div
                  className="content-date space-info"
                  style={{
                    display: formik.values.dateRecojo !== '' ? 'block' : 'none',
                  }}
                >
                  <label htmlFor="">Fecha Prevista :</label>
                  <div className="date-ma">
                    <DateInput
                      name="datePrevista"
                      value={formik.values.datePrevista}
                      onChange={(date) => {
                        formik.setFieldValue('datePrevista', date);
                      }}
                      placeholder="Ingrese Fecha"
                      minDate={formik.values.dateRecojo}
                    />
                    <div className="actions-date">
                      <button
                        type="button"
                        className="btn-preview"
                        onClick={() => {
                          const currentDate = formik.values.dateRecojo;
                          const newDate = new Date(
                            Math.max(formik.values.datePrevista.getTime() - 24 * 60 * 60 * 1000, currentDate.getTime())
                          );
                          formik.setFieldValue('datePrevista', newDate);
                        }}
                      >
                        {'<'}
                      </button>
                      <button
                        type="button"
                        className="btn-next"
                        onClick={() =>
                          formik.setFieldValue(
                            'datePrevista',
                            new Date(formik.values.datePrevista.getTime() + 24 * 60 * 60 * 1000)
                          )
                        }
                      >
                        {'>'}
                      </button>
                    </div>
                  </div>
                  {formik.errors.datePrevista && formik.touched.datePrevista && validIco(formik.errors.datePrevista)}
                </div>
                <SwitchModel
                  title="Modo :"
                  onSwitch="Tienda"
                  offSwitch="Delivery"
                  name="swModalidad"
                  defaultValue={true}
                  onChange={(value) => {
                    // value = (TRUE O FALSE)
                    //const res = value ? 'Tienda' : 'Delivery';
                    if (value === true) {
                      formik.setFieldValue('swModalidad', 'Tienda');
                      const updatedProductos = formik.values.productos.filter(
                        (producto) => producto.type !== 'Delivery'
                      );
                      formik.setFieldValue('productos', updatedProductos);
                    } else {
                      formik.setFieldValue('swModalidad', 'Delivery');
                      formik.setFieldValue('productos', [
                        ...formik.values.productos,
                        {
                          cantidad: 1,
                          descripcion: '-',
                          expanded: false,
                          price: 0,
                          producto: 'Delivery',
                          stado: true,
                          total: getPricePrenda('Delivery'),
                          type: 'Delivery',
                          // categoria: 'Delivery',
                        },
                      ]);
                    }
                  }}
                />
                <SwitchModel
                  title="Factura :"
                  onSwitch="SI" // ON = TRUE
                  offSwitch="NO" // OFF = FALSE
                  name="factura"
                  defaultValue={false}
                  colorBackground="#F9777F" // COLOR FONDO
                  onChange={(value) => {
                    // value = (TRUE O FALSE)
                    formik.setFieldValue('factura', value);
                  }}
                />
              </div>
            </div>
            <div className="description-info">
              <div className="actions">
                <div className="button-actions">
                  <BotonModel
                    name="Agregar Toalla"
                    tabI="6"
                    listenClick={() =>
                      formik.setFieldValue('productos', [
                        ...formik.values.productos,
                        addRowGarment('Toalla', getPricePrenda('Toalla'), false),
                      ])
                    }
                  />
                  <BotonModel
                    name="Ropa x Kilo"
                    tabI="7"
                    listenClick={() =>
                      formik.setFieldValue('productos', [
                        ...formik.values.productos,
                        addRowGarment('Ropa x Kilo', getPricePrenda('Ropa x Kilo'), false),
                      ])
                    }
                  />
                </div>
                <InputSelectedPrenda
                  listenClick={(/*type, */ producto, precio, estado /*, categoria*/) =>
                    formik.setFieldValue('productos', [
                      ...formik.values.productos,
                      addRowGarment(/*type, */ producto, precio, estado /*, categoria*/),
                    ])
                  }
                  tabI={'8'}
                />
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Cantidad</th>
                    <th>Producto</th>
                    <th>Descripción</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {formik.values.productos.map((row, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          type="text"
                          className="txtCantidad"
                          name={`productos.${index}.cantidad`}
                          autoComplete="off"
                          disabled={
                            row.producto === 'Ropa x Kilo'
                              ? false
                              : row.type === 'productos' && row.stado === true
                              ? true
                              : row.type === 'Delivery'
                              ? true
                              : false
                          }
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            const validInput = inputValue ? inputValue.replace(/[^0-9.]/g, '') : 0;
                            const newQuantity = validInput !== '' ? validInput : 0;

                            const price = parseFloat(formik.values.productos[index].price) || 0;
                            const newTotal = newQuantity !== '' ? newQuantity * price : '';

                            formik.setFieldValue(`productos.${index}.cantidad`, newQuantity);
                            formik.setFieldValue(
                              `productos.${index}.total`,
                              newTotal !== '' ? newTotal.toFixed(1) : ''
                            );
                          }}
                          autoFocus={
                            row.producto === 'Ropa x Kilo'
                              ? true
                              : row.type === 'otros'
                              ? true
                              : row.type === 'productos' && row.stado === false
                              ? true
                              : false
                          }
                          onBlur={formik.handleBlur}
                          value={formik.values.productos[index].cantidad || ''}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="txtProducto"
                          disabled={
                            row.type === 'otros'
                              ? false
                              : row.type === ''
                              ? true
                              : row.type === 'productos'
                              ? !row.estado
                              : true
                          }
                          name={`productos.${index}.producto`}
                          onChange={formik.handleChange}
                          autoComplete="off"
                          onBlur={formik.handleBlur}
                          value={formik.values.productos[index].producto}
                        />
                      </td>
                      <td
                        className="tADescription"
                        style={{
                          pointerEvents: row.type === 'Delivery' ? 'none' : 'painted',
                        }}
                      >
                        <div className="contentDes">
                          <div id={`${index}-dsp`} className="textarea-container">
                            <textarea
                              className="hide"
                              rows={5}
                              name={`productos.${index}.descripcion`}
                              defaultValue={formik.values.productos[index].descripcion}
                              onChange={formik.handleChange}
                            />
                            <div
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
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="txtTotal"
                          name={`productos.${index}.total`}
                          autoComplete="off"
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            const validInput = inputValue ? inputValue.replace(/[^0-9.]/g, '') : '';

                            formik.setFieldValue(`productos.${index}.total`, validInput);
                          }}
                          onBlur={formik.handleBlur}
                          //disabled={row.type === "Delivery" ? true : false}
                          value={formik.values.productos[index].total}
                          onFocus={(e) => {
                            e.target.select();
                          }}
                        />
                      </td>
                      <Tag
                        Etiqueta="td"
                        className="space-action"
                        onClick={() => {
                          const updatedProductos = [...formik.values.productos];
                          updatedProductos.splice(index, 1);
                          formik.setFieldValue('productos', updatedProductos);
                        }}
                      >
                        {row.type === 'Delivery' ? true : <Eliminar className="delete-row" />}
                      </Tag>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ marginTop: '10px' }}>
                    <td>
                      {/* {dataScore && Object.keys(dataScore).length > 0
                        ? `Total de Puntos : ${dataScore.scoreTotal}`
                        : null} */}
                    </td>
                    <td>Subtotal :</td>
                    <td>
                      {simboloMoneda} {formik.values.subTotal}
                    </td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>
                      {/* {dataScore && Object.keys(dataScore).length > 0 ? (
                        <div className="input-number dsc">
                          <label>Dsc x Puntos</label>
                          <NumberInput
                            defaultValue={formik.values.cargosExtras.beneficios.puntos}
                            max={parseInt(dataScore.scoreTotal)}
                            min={0}
                            step={1}
                            hideControls={true}
                            onChange={(e) => {
                              const data = dataScore.scoreTotal < e ? false : true;
                              formik.setFieldValue('cargosExtras.descuentos.puntos', data ? MontoxPoints(e) : 0);
                              formik.setFieldValue('cargosExtras.beneficios.puntos', e);
                            }}
                          />
                        </div>
                      ) : null} */}
                    </td>
                    {formik.values.factura ? (
                      <>
                        <td>
                          {nameImpuesto} ({(InfoImpuesto * 100).toFixed(0)} %) :
                        </td>
                        <td>
                          {simboloMoneda} {formik.values.cargosExtras.igv.importe}
                        </td>
                      </>
                    ) : (
                      <>
                        <td></td>
                        <td></td>
                      </>
                    )}
                    <td></td>
                  </tr>
                  <tr>
                    <td></td>
                    {/* <td>Descuento :</td> */}
                    {/* <td>{simboloMoneda} {formik.values.descuento}</td> */}
                    <td></td>
                  </tr>
                  <tr>
                    <td></td>
                    <td>Total :</td>
                    <td>
                      {simboloMoneda} {formik.values.totalNeto}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
              {formik.errors.productos && formik.touched.productos && (
                <div className="error-message">{formik.errors.productos}</div>
              )}
            </div>
            <div className="footer">
              <div className="f-Pay">
                <div className="input-switch">
                  <label className="qData">Pagado:</label>
                  <div
                    className="switch-container"
                    onClick={() => {
                      if (!formik.values.swPagado === false) {
                        formik.setFieldValue('metodoPago', '');
                        setIsPortal(false);
                      } else {
                        setIsPortal(!isPortal);
                      }
                      formik.setFieldValue('swPagado', !formik.values.swPagado);
                    }}
                  >
                    <input
                      type="checkbox"
                      id="swPagado"
                      checked={formik.values.swPagado}
                      name="swPagado"
                      onChange={() => {
                        if (!formik.values.swPagado === false) {
                          formik.setFieldValue('metodoPago', '');
                          setIsPortal(false);
                        } else {
                          setIsPortal(!isPortal);
                        }
                        formik.setFieldValue('swPagado', !formik.values.swPagado);
                      }}
                    />
                    <label htmlFor="swPagado" onClick={(e) => e.stopPropagation()} />
                  </div>
                </div>
                {formik.values.metodoPago !== '' ? (
                  <img
                    tabIndex="-1"
                    className={
                      formik.values.metodoPago === 'Efectivo'
                        ? 'ico-efect'
                        : formik.values.metodoPago === ingresoDigital
                        ? 'ico-tranf'
                        : 'ico-card'
                    }
                    src={
                      formik.values.metodoPago === 'Efectivo'
                        ? Efectivo
                        : formik.values.metodoPago === ingresoDigital
                        ? Tranferencia
                        : Tarjeta
                    }
                    alt=""
                  />
                ) : null}
              </div>
              {formik.values.metodoPago !== '' && formik.values.dateRecojo !== '' ? (
                <DateInput
                  label="Fecha Pago :"
                  name="datePago"
                  value={formik.values.datePago}
                  onChange={(date) => {
                    formik.setFieldValue('datePago', date);
                  }}
                  style={{
                    pointerEvents: 'none',
                  }}
                />
              ) : null}
              {isPortal === true && (
                <Portal
                  onClose={() => {
                    formik.setFieldValue('swPagado', false);
                    setIsPortal(false);
                  }}
                >
                  <MetodoPago setVal={formik.setFieldValue} name="metodoPago" onClose={setIsPortal} />
                </Portal>
              )}
            </div>
            <div className="action-end">
              <button type="submit">Registrar</button>
              <button
                type="button"
                onDoubleClick={() => navigate(`${PrivateRoutes.PRIVATE}/${PrivateRoutes.LIST_ORDER_SERVICE}`)}
              >
                Cancelar
              </button>
            </div>
          </>
        </div>
      </form>
    </div>
  );
};

export default AddOld;
