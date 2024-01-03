/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { NumberInput, TextInput, Modal } from '@mantine/core';
import { DateInput, TimeInput } from '@mantine/dates';
import { Autocomplete } from '@mantine/core';
import React, { useEffect, useState } from 'react';

import { useFormik } from 'formik';
import * as Yup from 'yup';

import { useNavigate } from 'react-router-dom';

import BotonModel from '../BotonModel/BotonModel';
import InputSelectedPrendas from '../InputSelectedPrenda/InputSelectedPrenda';
import MetodoPago from '../MetodoPago/MetodoPago';
import Portal from '../Portal/Portal';
import './ordernServicio.scss';

import { ReactComponent as Eliminar } from '../../../utils/img/OrdenServicio/eliminar.svg';
import { ReactComponent as Lavadora } from '../../../utils/img/OrdenServicio/lavadora.svg';

import Yape from '../../../utils/img/OrdenServicio/Yape.png';
import Efectivo from '../../../utils/img/OrdenServicio/dinero.png';
import Coins from '../../../utils/img/Puntos/coins.png';

import Tag from '../../Tag/Tag';
import InputText from '../InputText/InputText';

import moment from 'moment';
//import 'moment/locale/es';

import { Text, ScrollArea } from '@mantine/core';
import { modals } from '@mantine/modals';
import { useDisclosure } from '@mantine/hooks';
import { useDispatch, useSelector } from 'react-redux';
import { PrivateRoutes } from '../../../models';
import axios from 'axios';
import { DateCurrent, DiasAttencion, HoraAttencion } from '../../../utils/functions';
import SwitchModel from '../../SwitchModel/SwitchModel';
import Promocion from './Promocion/Promocion';
import { setLastRegister } from '../../../redux/states/service_order';
import { socket } from '../../../utils/socket/connect';
import { Notify } from '../../../utils/notify/Notify';

const OrdenServicio = ({ mode, action, onAction, iEdit, onReturn, iDelivery }) => {
  const iCodigo = useSelector((state) => state.codigo.infoCodigo.codActual);
  const infoPrendas = useSelector((state) => state.prenda.infoPrendas);
  const InfoNegocio = useSelector((state) => state.negocio.infoNegocio);
  const InfoUsuario = useSelector((state) => state.user.infoUsuario);

  const { InfoImpuesto, InfoPuntos } = useSelector((state) => state.modificadores);

  const [delivery, setDelivery] = useState(false);

  const [isPortalPago, setIsPortalPago] = useState(false);
  const [PortalValidPromocion, setPortalValiPromocion] = useState(false);
  const [isPromocion, setIsPromocion] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);

  // Lista de Cupones
  const [cupon, setCupon] = useState();
  const [resValidCupon, setResValidCupon] = useState(null);
  const [listCupones, setListCupones] = useState([]);
  // Lista de clientes
  const [infoClientes, setInfoClientes] = useState([]);
  // Puntos del cliente Actual
  const [dataScore, setDataScore] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const validationSchema = Yup.object().shape({
    name: Yup.string().required('Campo obligatorio'),
    productos: Yup.array()
      .min(1, 'Debe haber al menos un producto')
      .test('categoria', 'Debe haber al menos un producto - Delivery no cuenta', function (value) {
        return value.some((item) => item.categoria !== 'Delivery');
      })
      .of(
        Yup.object().shape({
          //cantidad: Yup.string().required("Campo obligatorio"),
          //descripcion: Yup.string().required("Campo obligatorio"),
          //total: Yup.string().required("Campo obligatorio"),
        })
      ),
  });

  const getProductValue = (nombre) => {
    const garment = infoPrendas.find((prenda) => prenda.name.toLowerCase() === nombre.toLowerCase());
    if (garment) {
      return garment.price;
    }

    return 0;
  };

  const formik = useFormik({
    initialValues: {
      dni: iEdit ? iEdit.dni : '',
      name: iEdit ? iEdit.Nombre : mode === 'Delivery' && iDelivery ? iDelivery.name : '',
      phone: iEdit ? iEdit.celular : '',
      dateRecojo: iEdit?.dateRecepcion?.fecha
        ? moment(`${iEdit.dateRecepcion.fecha} ${iEdit.dateRecepcion.hora}`, 'YYYY-MM-DD HH:mm').toDate()
        : new Date(),
      datePrevista: iEdit?.datePrevista?.fecha ? moment(iEdit.datePrevista.fecha, 'YYYY-MM-DD').toDate() : new Date(),
      dayhour: iEdit?.datePrevista?.hora || '17:00',
      datePago: iEdit
        ? iEdit.datePago
        : {
            fecha: '',
            hora: '',
          }, // Cambio agregue datePago
      productos: iEdit
        ? iEdit.Producto
        : mode === 'Delivery'
        ? [
            {
              cantidad: 1,
              descripcion: 'Recojo y Envio',
              expanded: false,
              price: 0,
              producto: 'Delivery',
              stado: true,
              total: getProductValue('Delivery'),
              type: 'Delivery',
              categoria: 'Delivery',
            },
          ]
        : [],
      descuento: iEdit ? iEdit.descuento : 0,
      modoDescuento: iEdit ? iEdit.modoDescuento : 'Puntos',
      swPagado: iEdit ? (iEdit.Pago === 'Pagado' ? true : false) : false,
      metodoPago: iEdit ? iEdit.metodoPago : '',
      factura: iEdit ? iEdit.factura : false,
      subTotal: iEdit ? iEdit.subTotal : 0,
      cargosExtras: iEdit
        ? iEdit.cargosExtras
        : {
            beneficios: {
              puntos: 0,
              promociones: [],
            },
            descuentos: {
              puntos: 0,
              promocion: 0,
            },
            igv: {
              valor: InfoImpuesto.IGV,
              importe: 0,
            },
          },
      totalNeto: iEdit ? iEdit.totalNeto : 0,
      gift_promo: iEdit ? iEdit.gift_promo : [],
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      let correcciones = [];
      if (iEdit?.estado !== 'registrado' && values.modoDescuento === 'Promocion') {
        correcciones = await validProductos(values.cargosExtras.beneficios.promociones);
      }
      if (correcciones.length > 0) {
        alert(`La Promoción Exige:\n\n${correcciones.join('\n')}`);
      } else {
        if (iEdit?.estado === 'registrado') {
          openModal([]);
        } else {
          open();
        }
      }
    },
  });

  const openModal = async (cups) => {
    close();
    setIsPromocion(false);
    const values = { ...formik.values, gift_promo: cups.length > 0 ? cups : [] };

    modals.openConfirmModal({
      title: 'Registro de Factura',
      centered: true,
      children: <Text size="sm">¿Estás seguro de registrar esta factura?</Text>,
      labels: { confirm: 'Si', cancel: 'No' },
      confirmProps: { color: 'green' },
      onCancel: () => formik.setFieldValue('gift_promo', []),
      onConfirm: () => handleGetInfo(values),
    });
  };

  const addRowGarment = (tipo, producto, precio, stateCantidad, categoria) => {
    const newRow = {
      stado: stateCantidad,
      price: precio,
      type: tipo,
      cantidad: stateCantidad === false ? 1 : 1,
      producto: producto,
      descripcion: '',
      expanded: false,
      total: precio,
      categoria: categoria,
    };
    return newRow;
  };

  function tFecha(fecha) {
    const fechaFormateada = moment(fecha).format('YYYY-MM-DD');
    return fechaFormateada;
  }

  function tHora(fecha) {
    const horaFormateada = moment(fecha).format('HH:mm');
    return horaFormateada;
  }

  const handleGetInfo = async (info) => {
    const infoProduct = info.productos.map((p) => ({
      cantidad: p.cantidad,
      producto: p.producto,
      descripcion: p.descripcion,
      precio: p.price,
      total: p.total,
      categoria: p.categoria,
    }));

    let finalUpdatePromo = info.cargosExtras;
    if (info.modoDescuento === 'Promocion' && !iEdit) {
      finalUpdatePromo.beneficios.promociones = listCupones;
    } else if (info.modoDescuento === 'Puntos' && !iEdit) {
      finalUpdatePromo.beneficios.promociones = [];
      finalUpdatePromo.descuentos.promocion = 0;
    }
    !iEdit || iEdit.dateRecepcion.fecha === DateCurrent().format4 || iEdit?.estado === 'reservado';
    const infoRecibo = {
      codRecibo: iEdit ? iEdit.codRecibo : iCodigo,
      dateRecepcion: {
        fecha: tFecha(info.dateRecojo),
        hora: tHora(info.dateRecojo),
      },
      Modalidad: delivery ? 'Delivery' : 'Tienda',
      Nombre: info.name,
      Producto: infoProduct,
      celular: info.phone,
      Pago: info.swPagado ? 'Pagado' : 'Pendiente',
      datePago: info.datePago, // Cambio hice q lo tome del estado
      datePrevista: {
        fecha: tFecha(info.datePrevista),
        hora: info.dayhour,
      },
      dateEntrega: {
        fecha: '',
        hora: '',
      },
      metodoPago: info.metodoPago,
      descuento: info.descuento,
      estadoPrenda: iEdit ? iEdit.estadoPrenda : 'pendiente',
      estado: 'registrado',
      dni: info.dni,
      factura: info.factura,
      subTotal: info.subTotal,
      cargosExtras: finalUpdatePromo,
      totalNeto: info.totalNeto,
      modeRegistro: 'nuevo',
      notas: iEdit ? iEdit.notas : [],
      modoDescuento: info.modoDescuento,
      gift_promo: iEdit ? (iEdit.estado === 'reservado' ? info.gift_promo : iEdit.gift_promo) : info.gift_promo,
      attendedBy: iEdit
        ? iEdit.attendedBy
        : {
            name: InfoUsuario.name,
            rol: InfoUsuario.rol,
          },
      lastEdit: iEdit
        ? [
            ...iEdit.lastEdit,
            {
              name: InfoUsuario.name,
              date: moment().format('YYYY-MM-DD HH:mm:ss.SSS'),
            },
          ]
        : [],
      typeRegistro: 'normal',
    };

    onAction({
      infoRecibo,
      rol: InfoUsuario.rol,
    });
  };

  const handleTextareaHeight = (textarea) => {
    const scrollHeight = textarea.scrollHeight;
    textarea.style.height = `${scrollHeight - 13}px`;
  };

  const handleGetClientes = async (dni) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/lava-ya/get-clientes/${dni}`);
      const data = response.data;
      setInfoClientes(data);
      return data;
    } catch (error) {
      console.error('Error al obtener los datos:', error.message);
    }
  };

  const handleScrollTop = (id) => {
    const element = document.getElementById(id);
    if (element instanceof HTMLTextAreaElement) {
      element.scrollTop = 0;
    }
  };

  const validCupon = async (codigoCupon) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/lava-ya/validar-cupon/${codigoCupon}`);
      const data = response.data;
      await setResValidCupon(data);
      return data;
    } catch (error) {
      // Captura errores y devuelve un mensaje de error genérico
      return {
        mensaje: 'Error al hacer la solicitud: ' + error.message,
      };
    }
  };

  const validProductos = async (promociones) => {
    const listProductos = formik.values.productos;
    const ListCorrecciones = [];

    // si la promo es la misma reducirla a 1 sola
    const listP = promociones.reduce((result, item) => {
      const codigoPromocion = item.codigoPromocion;
      if (!result.some((r) => r.codigoPromocion === codigoPromocion)) {
        result.push(item);
      }
      return result;
    }, []);

    for (const p of listP) {
      const infoCupon = await validCupon(p.codigoCupon);
      const prendaActual = infoCupon.promocion.prenda;
      const productosFiltrados = listProductos.filter((p) => p.producto === prendaActual);
      const cantActual = productosFiltrados.reduce(
        (total, producto) => total + +Number(producto.cantidad).toFixed(1),
        0
      );

      const cantMin = infoCupon.promocion.cantidadMin;
      const res = cantActual >= cantMin;
      if (!res) {
        //const nPrendasFaltante = cantMin - sumaCantidades; // falta registrar
        let infoFaltante = '';
        if (prendaActual === 'Ropa x Kilo') {
          infoFaltante = `Minimo ${cantMin} kilo${cantMin !== 1 ? 's' : ''} de Ropa y ${
            cantActual === 0 ? 'no registraste ninguno' : `solo registraste : ${cantActual}`
          }  `;
        } else if (prendaActual === 'Cortinas') {
          infoFaltante = `Minimo ${cantMin} metro${cantMin !== 1 ? 's' : ''} de ${prendaActual} y ${
            cantActual === 0 ? 'no registraste ninguno' : `solo registraste : ${cantActual}`
          }  `;
        } else if (prendaActual === 'Zapatillas') {
          infoFaltante = `Minimo ${cantMin} par${cantMin !== 1 ? 'es' : ''} de ${prendaActual} y ${
            cantActual === 0 ? 'no registraste ninguno' : `solo registraste : ${cantActual}`
          }  `;
        } else {
          infoFaltante = `Minimo ${cantMin} prenda${cantMin !== 1 ? 's' : ''} de tipo ${prendaActual} y ${
            cantActual === 0 ? 'no registraste ninguno' : `solo registraste : ${cantActual}`
          }  `;
        }

        ListCorrecciones.push(infoFaltante);
      }
    }

    return ListCorrecciones;
  };

  const recalculatePromoDescuento = () => {
    let updateCupon = listCupones;
    const cupTypeDsc = listCupones.filter((cupon) => cupon.tipo === 'Descuento');

    // Agrupacion de cupones segun codigo
    const groupCupon = [...new Set(cupTypeDsc.map((item) => item.codigoPromocion))].map((codigoPromocion) =>
      cupTypeDsc.filter((item) => item.codigoPromocion === codigoPromocion)
    );

    // Iterar a través de grupos de cupones
    if (groupCupon.length > 0) {
      for (const grupo of groupCupon) {
        const prenda = grupo[0].prenda;

        const predasSimilares = formik.values.productos.filter((p) => p.producto === prenda);

        if (predasSimilares.length > 0) {
          let sumaTotales = predasSimilares.reduce((total, prenda) => {
            const prendaTotal = parseFloat(prenda.total);
            return isNaN(prendaTotal) ? total : total + prendaTotal;
          }, 0);

          // Calcular descuentos y actualizar sumaTotales

          for (const dsc of grupo) {
            const dscFinal = +parseFloat(sumaTotales * (dsc.nMultiplicador / 100)).toFixed(1);
            // Actualizar el descuento en cada registro según su código de cupón
            updateCupon = updateCupon.map((c) => {
              if (c.codigoCupon === dsc.codigoCupon) {
                return { ...c, descuento: dscFinal };
              }
              return c;
            });
            sumaTotales -= dscFinal;
          }
        } else {
          for (const dsc of grupo) {
            updateCupon = updateCupon.map((c) => {
              if (c.codigoCupon === dsc.codigoCupon) {
                return { ...c, descuento: 0 };
              }
              return c;
            });
          }
        }
        formik.setFieldValue('cargosExtras.beneficios.promociones', updateCupon);
        setListCupones(updateCupon);
      }
    }
    const LCupones = updateCupon.length > 0 ? updateCupon : listCupones;

    const sumaTotales = LCupones.reduce((total, cupon) => {
      const descuentoTotal = parseFloat(cupon.descuento);
      return isNaN(descuentoTotal) ? total : total + descuentoTotal;
    }, 0);

    formik.setFieldValue('cargosExtras.descuentos.promocion', sumaTotales);
    formik.setFieldValue('descuento', sumaTotales);
  };

  const handleGetDay = (date) => {
    const formattedDayOfWeek = moment(date).format('dddd');
    return `${formattedDayOfWeek} : `;
  };

  const MontoxPoints = (xpoints) => {
    const puntos = parseFloat(InfoPuntos.score);
    const valor = parseFloat(InfoPuntos.valor);
    const equivalenteEnSoles = (xpoints / puntos) * valor;

    return equivalenteEnSoles;
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

  const icoValid = (message) => {
    return (
      <div className="ico-req">
        <i className="fa-solid fa-circle-exclamation ">
          <div className="info-req" style={{ pointerEvents: 'none' }}>
            <span>{message}</span>
          </div>
        </i>
      </div>
    );
  };

  useEffect(() => {
    dispatch(setLastRegister());
  }, []);

  useEffect(() => {
    if (mode === 'Delivery') {
      setDelivery(true);
    }
  }, [mode]);

  useEffect(() => {
    formik.setFieldValue(
      'cargosExtras.descuentos.puntos',
      Number(MontoxPoints(formik.values.cargosExtras.beneficios.puntos).toFixed(2))
    );

    formik.setFieldValue(
      'cargosExtras.igv.valor',
      iEdit && iEdit.factura ? iEdit.cargosExtras.igv.valor : InfoImpuesto.IGV
    );
  }, [InfoPuntos, InfoImpuesto]);

  useEffect(() => {
    const subtotal = Number(calculateTotalNeto(formik.values.productos).toFixed(2));
    formik.setFieldValue('subTotal', subtotal);
  }, [formik.values.productos]);

  useEffect(() => {
    if (!iEdit || iEdit?.estado === 'reservado') {
      recalculatePromoDescuento();
    }
  }, [formik.values.productos, listCupones.length, formik.values.modoDescuento]);

  useEffect(() => {
    const subTotal = formik.values.subTotal;
    let montoIGV = 0;
    if (formik.values.factura === true) {
      montoIGV = +(subTotal * formik.values.cargosExtras.igv.valor).toFixed(2);
    }
    formik.setFieldValue('cargosExtras.igv.importe', montoIGV);
    const total = subTotal + montoIGV;
    const descuento =
      formik.values.modoDescuento === 'Puntos'
        ? formik.values.cargosExtras.descuentos.puntos
        : formik.values.cargosExtras.descuentos.promocion;
    formik.setFieldValue('descuento', descuento);
    const totalNeto = total - descuento;
    formik.setFieldValue('totalNeto', (Math.floor(totalNeto * 10) / 10).toFixed(1));
  }, [
    formik.values.cargosExtras.igv,
    formik.values.productos,
    formik.values.modoDescuento,
    formik.values.cargosExtras.descuentos,
    formik.values.cargosExtras.descuento,
    formik.values.factura,
    formik.values.subTotal,
  ]);

  useEffect(() => {
    socket.on('server:orderUpdated:child', (data) => {
      if (iEdit && data._id === iEdit._id) {
        if (data.estadoPrenda === 'anulado') {
          Notify('ORDERN DE SERVICIO ANULADO', '', 'fail');
        } else {
          Notify('ORDERN DE SERVICIO ACTUALIZADO', '', 'warning');
        }
        navigate(`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.LIST_ORDER_SERVICE}`);
      }
    });

    socket.on('server:updateListOrder:child', (data) => {
      data.some((orden) => {
        if (iEdit && orden._id === iEdit._id) {
          if (orden.estadoPrenda === 'donado') {
            Notify('ORDERN DE SERVICIO DONADO', '', 'fail');
          } else {
            Notify('ORDERN DE SERVICIO ACTUALIZADO', '', 'warning');
          }
          navigate(`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.LIST_ORDER_SERVICE}`);
          return true; // Detener la iteración
        }
        return false; // Continuar la iteración
      });
    });

    socket.on('server:cancel-delivery', (data) => {
      const { dni } = data;
      if (dni !== '') {
        const infoPuntos = handleGetClientes(dni);
        formik.setFieldValue('cargosExtras.descuentos.puntos', 0);
        formik.setFieldValue('cargosExtras.beneficios.puntos', 0);
        setDataScore(infoPuntos);
      }
    });

    return () => {
      // Remove the event listener when the component unmounts
      socket.off('server:cancel-delivery');
      socket.off('server:orderUpdated:child');
      socket.off('server:updateListOrder:child');
    };
  }, []);

  return (
    <div className="content-recibo">
      <form onSubmit={formik.handleSubmit} className="container">
        <div className="body-form">
          <div className="c-title">
            <div className="info-t">
              <Lavadora className="ico-lava-ya" />
              <div className="title">
                <h1>{InfoNegocio?.name}</h1>
                <h2>LAVANDERIA</h2>
                {Object.keys(InfoNegocio).length > 0 ? (
                  <h3>
                    {DiasAttencion(InfoNegocio?.horario.dias)}
                    <br />
                    {HoraAttencion(InfoNegocio?.horario.horas)}
                  </h3>
                ) : null}
                {InfoNegocio?.numero?.state ? <h3>Cel.: {InfoNegocio?.numero?.info}</h3> : null}
              </div>
            </div>
            <div className="n-recibo">
              <h2>RECIBO</h2>
              <h1>N° {String(iEdit ? iEdit.codRecibo : iCodigo).padStart(6, '0')}</h1>
            </div>
          </div>
          <div className="header-info">
            <div className="h-cli">
              <Autocomplete
                name="dni"
                onChange={(dni) => {
                  handleGetClientes(dni);
                  formik.setFieldValue('dni', dni);
                  setDataScore();
                  formik.setFieldValue('cargosExtras.descuentos.puntos', 0);
                  formik.setFieldValue('cargosExtras.beneficios.puntos', 0);
                }}
                tabIndex={'1'}
                autoFocus
                label="Documento :"
                placeholder="Ingrese N° Documento"
                defaultValue={formik.values.dni}
                onItemSubmit={(selected) => {
                  const cliente = infoClientes.find((obj) => obj.dni === selected.value);
                  formik.setFieldValue('name', cliente.nombre);
                  formik.setFieldValue('phone', cliente.phone);

                  setDataScore(cliente);
                }}
                data={infoClientes.length > 0 ? infoClientes.map((obj) => obj.dni) : []}
                disabled={iEdit ? (iEdit.modeEditAll ? false : true) : false}
              />

              <InputText
                name={'name'}
                handleChange={formik.handleChange}
                handleBlur={formik.handleBlur}
                valueName={formik.values.name}
                tabI={'2'}
                text={'Señor(es):'}
                disabled={iEdit ? (iEdit.modeEditAll ? false : true) : false}
                valid={{
                  errors: formik.errors.name && formik.touched.name,
                  req: formik.errors.name,
                }}
              />
              <InputText
                name={'phone'}
                handleChange={formik.handleChange}
                handleBlur={formik.handleBlur}
                tabI={'3'}
                valueName={formik.values.phone}
                text={'Celular:'}
              />
              <SwitchModel
                title="Tipo de Descuento :"
                onSwitch="Puntos" // TRUE
                offSwitch="Promocion" // FALSE
                name="swModalidad"
                defaultValue={formik.values.modoDescuento === 'Puntos' ? true : false}
                disabled={iEdit ? (iEdit.modeEditAll ? false : true) : false}
                onChange={(value) => {
                  formik.setFieldValue('descuento', 0);
                  if (value === true) {
                    formik.setFieldValue('modoDescuento', 'Puntos');
                    formik.setFieldValue('cargosExtras.descuentos.puntos', 0);
                    formik.setFieldValue('cargosExtras.beneficios.puntos', 0);
                  } else {
                    formik.setFieldValue('modoDescuento', 'Promocion');
                    formik.setFieldValue('cargosExtras.descuentos.promocion', 0);
                    formik.setFieldValue('cargosExtras.beneficios.promociones', []);
                  }
                }}
              />
            </div>
            <div className="second-column">
              <div className="h-date">
                <div className="content-date">
                  <label htmlFor="">Ingreso:</label>
                  <DateInput
                    name="dateRecojo"
                    value={formik.values.dateRecojo}
                    onChange={(date) => {
                      formik.setFieldValue('dateRecojo', date);
                    }}
                    tabIndex={'4'}
                    disabled={iEdit ? (iEdit.modeEditAll ? false : true) : false}
                    placeholder="Ingrese Fecha"
                    style={{ pointerEvents: 'none' }}
                    mx="auto"
                  />
                </div>
                <div className="content-date">
                  <label htmlFor="">Entrega:</label>
                  <div className="date-ma">
                    <DateInput
                      name="datePrevista"
                      value={formik.values.datePrevista}
                      onChange={(date) => {
                        formik.setFieldValue('datePrevista', date);
                      }}
                      disabled={iEdit ? (iEdit.modeEditAll ? false : true) : false}
                      placeholder="Ingrese Fecha"
                      minDate={new Date()}
                    />
                    <div className="actions-date">
                      <button
                        type="button"
                        className="btn-preview"
                        disabled={iEdit ? (iEdit.modeEditAll ? false : true) : false}
                        onClick={() => {
                          const currentDate = new Date();
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
                        tabIndex="5"
                        disabled={iEdit ? (iEdit.modeEditAll ? false : true) : false}
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
                </div>
                <div className="content-hour">
                  <label htmlFor=""></label>
                  <div className="date-dh">
                    <TimeInput
                      className="hour-date"
                      name="dayhour"
                      disabled={iEdit ? (iEdit.modeEditAll ? false : true) : false}
                      tabIndex="6"
                      value={formik.values.dayhour}
                      onChange={formik.handleChange}
                    />
                    <label className="day-date">{handleGetDay(formik.values.datePrevista)}</label>
                  </div>
                </div>
              </div>
              <div
                className="switches-container"
                style={{
                  pointerEvents:
                    !iEdit || iEdit.dateRecepcion.fecha === DateCurrent().format4 || iEdit?.estado === 'reservado'
                      ? 'painted'
                      : 'none',
                }}
              >
                <label className="title-switch" htmlFor="">
                  Factura :
                </label>
                <div className="switches-body">
                  <input
                    type="radio"
                    id="sFactura"
                    name="factura"
                    value="SI"
                    checked={formik.values.factura === true}
                    onChange={() => {
                      formik.setFieldValue('factura', true);
                    }}
                  />
                  <label htmlFor="sFactura">SI</label>{' '}
                  <input
                    type="radio"
                    id="hFactura"
                    name="factura"
                    value="NO"
                    checked={formik.values.factura === false}
                    onChange={() => {
                      formik.setFieldValue('factura', false);
                    }}
                  />
                  <label htmlFor="hFactura">NO</label>{' '}
                  <div className="switch-wrapper">
                    <div className="switch">
                      <div>SI</div>
                      <div>NO</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="description-info">
            <div className="actions">
              <div className="button-actions">
                <BotonModel
                  name="Agregar Edredon"
                  tabI="6"
                  disabled={iEdit ? (iEdit.modeEditAll ? false : true) : false}
                  listenClick={() =>
                    formik.setFieldValue('productos', [
                      ...formik.values.productos,
                      addRowGarment('productos', 'Edredon', getProductValue('Edredon'), true, 'Edredon'),
                    ])
                  }
                />
                <BotonModel
                  name="Ropa x Kilo"
                  tabI="7"
                  disabled={iEdit ? (iEdit.modeEditAll ? false : true) : false}
                  listenClick={() =>
                    formik.setFieldValue('productos', [
                      ...formik.values.productos,
                      addRowGarment('productos', 'Ropa x Kilo', getProductValue('Ropa x Kilo'), true, 'Ropa x Kilo'),
                    ])
                  }
                />
              </div>
              <InputSelectedPrendas
                listenClick={(type, producto, precio, estado, categoria) =>
                  formik.setFieldValue('productos', [
                    ...formik.values.productos,
                    addRowGarment(type, producto, precio, estado, categoria),
                  ])
                }
                disabled={iEdit ? (iEdit.modeEditAll ? false : true) : false}
                tabI={'8'}
              />
            </div>
            <table className="tb-prod">
              <thead>
                <tr>
                  <th>Cantidad</th>
                  <th>Producto</th>
                  <th>Descripción</th>
                  <th>Total</th>
                  <th>{''}</th>
                </tr>
              </thead>
              <tbody>
                {formik.values.productos.map((row, index) => (
                  <tr key={index}>
                    <td
                      style={{
                        pointerEvents: !iEdit || (iEdit.modeEditAll ? 'painted' : 'none'),
                      }}
                    >
                      <input
                        type="text"
                        className="txtCantidad"
                        name={`productos.${index}.cantidad`}
                        autoComplete="off"
                        disabled={
                          iEdit?.estado === 'registrado'
                            ? true
                            : row.producto === 'Ropa x Kilo'
                            ? false
                            : row.type === 'productos' && row.stado === true
                            ? true
                            : row.type === 'Delivery'
                            ? true
                            : false
                        }
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          const validInput = inputValue ? inputValue.replace(/[^0-9.]/g, '') : '';
                          const newQuantity = validInput !== '' ? validInput : '';

                          const price = parseFloat(formik.values.productos[index].price) || 0;
                          const newTotal = newQuantity !== '' ? newQuantity * price : '';

                          formik.setFieldValue(`productos.${index}.cantidad`, newQuantity);
                          formik.setFieldValue(
                            `productos.${index}.total`,
                            newTotal !== '' && newTotal !== 0 ? newTotal.toFixed(1) : ''
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
                        onBlur={(e) => {
                          const inputValue = e.target.value;
                          if (inputValue === '0') {
                            // Si el usuario ingresa "0", establece el valor del campo a una cadena vacía
                            formik.setFieldValue(`productos.${index}.cantidad`, '');
                            formik.setFieldValue(`productos.${index}.total`, '');
                          }
                        }}
                        value={formik.values.productos[index].cantidad || ''}
                        required
                      />
                      {formik.values.productos[index].cantidad < 0.1 && icoValid('La cantidad debe ser mayor a 0.1')}
                    </td>
                    <td>
                      <input
                        type="text"
                        className="txtProducto"
                        disabled={
                          iEdit?.estado === 'registrado'
                            ? true
                            : row.type === 'otros'
                            ? false
                            : row.type === ''
                            ? true
                            : row.type === 'productos'
                            ? !row.estado
                            : true
                        }
                        name={`productos.${index}.producto`}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          if (newValue.length <= 15) {
                            formik.handleChange(e);
                          }
                        }}
                        autoComplete="off"
                        onBlur={formik.handleBlur}
                        value={formik.values.productos[index].producto}
                        required
                      />
                    </td>
                    <td className="tADescription">
                      <div className="contentDes">
                        <div className="textarea-container">
                          <textarea
                            rows={1}
                            id={`productos.${index}.descripcion`}
                            name={`productos.${index}.descripcion`}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              handleTextareaHeight(e.target);
                              formik.setFieldValue(`productos.${index}.descripcion`, inputValue);
                              formik.setFieldValue(`productos.${index}.expanded`, true);
                            }}
                            disabled={row.type === 'Delivery' ? true : false}
                            value={formik.values.productos[index].descripcion}
                            autoFocus={
                              row.producto === 'Ropa x Kilo'
                                ? false
                                : row.type === 'otros'
                                ? false
                                : row.type === 'productos' && row.stado === false
                                ? false
                                : true
                            }
                            className={`${formik.values.productos[index].expanded ? 'expanded' : ''}`}
                          />
                          <Tag
                            ELement="div"
                            className={'expand-button'}
                            onClick={() => {
                              formik.setFieldValue(
                                `productos.${index}.expanded`,
                                !formik.values.productos[index].expanded
                              );

                              handleScrollTop(`productos.${index}.descripcion`);
                            }}
                          >
                            {formik.values.productos[index].expanded ? (
                              <i className="fa-solid fa-chevron-up" />
                            ) : (
                              <i className="fa-solid fa-chevron-down" />
                            )}
                          </Tag>
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
                        onBlur={(e) => {
                          const inputValue = e.target.value;
                          // if (inputValue === '0') {
                          //   formik.setFieldValue(`productos.${index}.total`, '');
                          // }
                        }}
                        disabled={iEdit?.estado === 'registrado' ? true : false}
                        value={formik.values.productos[index].total}
                        onFocus={(e) => {
                          e.target.select();
                        }}
                        required
                      />
                    </td>
                    <Tag
                      Etiqueta="td"
                      className="space-action"
                      onClick={() => {
                        if (!iEdit || iEdit?.estado === 'reservado') {
                          const updatedProductos = [...formik.values.productos];
                          updatedProductos.splice(index, 1);
                          formik.setFieldValue('productos', updatedProductos);
                        }
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
                    {dataScore && Object.keys(dataScore).length > 0
                      ? `Total de Puntos : ${dataScore.scoreTotal}`
                      : null}
                  </td>
                  <td>Subtotal :</td>
                  <td>S/ {formik.values.subTotal}</td>
                  <td></td>
                </tr>
                <tr>
                  <td>
                    {dataScore && Object.keys(dataScore).length > 0 && formik.values.modoDescuento === 'Puntos' ? (
                      <div className="input-number dsc">
                        <label>Dsc x Puntos</label>
                        <NumberInput
                          value={formik.values.cargosExtras.beneficios.puntos}
                          max={parseInt(dataScore.scoreTotal)}
                          min={0}
                          step={1}
                          hideControls={true}
                          onChange={(e) => {
                            const data = dataScore.scoreTotal < e ? false : true;
                            formik.setFieldValue(
                              'cargosExtras.descuentos.puntos',
                              data ? Number(MontoxPoints(e).toFixed(2)) : 0
                            );
                            formik.setFieldValue('cargosExtras.beneficios.puntos', e);
                          }}
                        />
                      </div>
                    ) : null}
                  </td>
                  {formik.values.factura ? (
                    <>
                      <td>IGV ({formik.values.cargosExtras.igv.valor * 100} %) :</td>
                      <td>S/ {formik.values.cargosExtras.igv.importe}</td>
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
                  <td>Descuento :</td>
                  <td>S/ {formik.values.descuento}</td>
                  <td></td>
                </tr>
                <tr>
                  <td></td>
                  <td>Total :</td>
                  <td>S/ {formik.values.totalNeto}</td>
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
                <Tag
                  Etiqueta="div"
                  className="switch-container"
                  onClick={() => {
                    if (
                      !iEdit ||
                      iEdit?.dateRecepcion.fecha === DateCurrent().format4 ||
                      iEdit?.estado === 'reservado'
                    ) {
                      if (!formik.values.swPagado === false) {
                        formik.setFieldValue('metodoPago', '');
                        formik.setFieldValue('datePago', {
                          fecha: '',
                          hora: '',
                        }); // Cambio - solo si cambia de estado el swtich cambiara el datepago
                        setIsPortalPago(false);
                      } else {
                        formik.setFieldValue('datePago', {
                          fecha: moment().format('YYYY-MM-DD'),
                          hora: moment().format('HH:mm'),
                        }); // Cambio - solo si cambia de estado el swtich cambiara el datepago
                        setIsPortalPago(!isPortalPago);
                      }
                      formik.setFieldValue('swPagado', !formik.values.swPagado);
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    id="swPagado"
                    checked={formik.values.swPagado}
                    name="swPagado"
                    disabled={!iEdit || iEdit?.dateRecepcion.fecha === DateCurrent().format4 ? false : true}
                    onChange={() => {
                      if (!formik.values.swPagado === false) {
                        formik.setFieldValue('metodoPago', '');
                        formik.setFieldValue('datePago', {
                          fecha: '',
                          hora: '',
                        }); // Cambio - solo si cambia de estado el swtich cambiara el datepago
                        setIsPortalPago(false);
                      } else {
                        formik.setFieldValue('datePago', {
                          fecha: moment().format('YYYY-MM-DD'),
                          hora: moment().format('HH:mm'),
                        }); // Cambio - solo si cambia de estado el swtich cambiara el datepago
                        setIsPortalPago(!isPortalPago);
                      }

                      formik.setFieldValue('swPagado', !formik.values.swPagado);
                    }}
                  />
                  <label htmlFor="swPagado" onClick={(e) => e.stopPropagation()} />
                </Tag>
              </div>
              {formik.values.metodoPago !== '' ? (
                <img
                  className={formik.values.metodoPago === 'Efectivo' ? 'ico-efect' : 'ico-yape'}
                  src={formik.values.metodoPago === 'Efectivo' ? Efectivo : Yape}
                  alt=""
                />
              ) : null}
            </div>
            {isPortalPago === true && (
              <Portal
                onClose={() => {
                  formik.setFieldValue('swPagado', false);
                  setIsPortalPago(false);
                }}
              >
                <MetodoPago setVal={formik.setFieldValue} name="metodoPago" onClose={setIsPortalPago} />
              </Portal>
            )}
          </div>
        </div>
        <div className="target-descuento">
          {!iEdit || iEdit?.estado === 'reservado' ? (
            <>
              {dataScore && Object.keys(dataScore).length > 0 && formik.values.modoDescuento === 'Puntos' ? (
                <div className="card-score">
                  <div className="info">
                    <div className="insignia">
                      <img src={Coins} alt="" />
                    </div>
                    <div className="data">
                      <table className="info-table">
                        <tbody>
                          <tr>
                            <td>NOMBRE :</td>
                            <td>{dataScore.nombre}</td>
                          </tr>
                          <tr>
                            <td>DOCUMENTO :</td>
                            <td>{dataScore.dni}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="visitas">
                    <table>
                      <thead>
                        <tr>
                          <th>N°</th>
                          <th>Orden de Servicio</th>
                          <th>Fecha</th>
                          <th>Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataScore.infoScore.map((row, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{row.codigo}</td>
                            <td>
                              <span>{row.dateService.fecha}</span>
                              <>&nbsp;&nbsp;-&nbsp;&nbsp;</>
                              <span>{row.dateService.hora}</span>
                            </td>
                            <td style={{ background: `${row.score > 0 ? '#60eba8' : '#ff8383'}` }}>{row.score}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="footer-info">
                      <div className="text-info">
                        <span>Total de Puntos :</span>
                        <label htmlFor="">{dataScore.scoreTotal}</label>
                      </div>
                    </div>
                  </div>
                </div>
              ) : formik.values.modoDescuento === 'Promocion' ? (
                <div className="card-promocion">
                  <button
                    className="btn-add-promo"
                    onClick={() => {
                      setPortalValiPromocion(true);
                      setResValidCupon(null);
                      setCupon();
                    }}
                    type="button"
                  >
                    Agregar Promocion
                  </button>
                  {listCupones.length > 0 ? (
                    <div className="list-promociones">
                      <table className="tb-promo">
                        <thead>
                          <tr>
                            <th>Codigo</th>
                            <th>Promociones</th>
                            <th>Descuento</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {listCupones.map((cupon, index) => (
                            <tr key={index}>
                              <td>{cupon.codigoCupon}</td>
                              <td>{cupon.descripcion}</td>
                              <td>{cupon.descuento}</td>
                              <Tag
                                Etiqueta="td"
                                className="space-action"
                                onClick={() => {
                                  const updatedCupones = [...listCupones];
                                  updatedCupones.splice(index, 1);
                                  setListCupones(updatedCupones);
                                  const sumarDescuentos = updatedCupones.reduce(
                                    (total, cupon) => total + cupon.descuento,
                                    0
                                  );
                                  formik.setFieldValue('cargosExtras.descuentos.promocion', sumarDescuentos);
                                  formik.setFieldValue('cargosExtras.beneficios.promociones', updatedCupones);
                                }}
                              >
                                <Eliminar className="delete-row" />
                              </Tag>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td></td>
                            <td></td>
                            <td>Total :</td>
                            <td>S/ {listCupones.reduce((total, cupon) => total + cupon.descuento, 0)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}
          <div className="buttons-external">
            <button
              type="button"
              className="b-cancelar"
              onDoubleClick={() => {
                mode === 'Delivery' && action === 'Editar'
                  ? onReturn()
                  : mode === 'Delivery' && action === 'Guardar'
                  ? onReturn(false)
                  : navigate(`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.LIST_ORDER_SERVICE}/`);
              }}
            >
              Cancelar
            </button>
            <button type="submit" /*disabled={isPortalPago ? true : false}*/ className="b-saved">
              {action}
            </button>
          </div>
        </div>
        {PortalValidPromocion ? (
          <Portal
            onClose={() => {
              setPortalValiPromocion(false);
            }}
          >
            <div className="valid-promocion">
              <h2>Ingresar codigo de Promocion</h2>
              <TextInput
                label="Codigo de Promocion :"
                className="input-promotion"
                radius="md"
                onChange={(e) => {
                  setCupon(e.target.value);
                  setResValidCupon(null);
                }}
                autoComplete="off"
              />
              <button type="button" className="btn-valid" onClick={() => validCupon(cupon)}>
                Validar
              </button>

              {resValidCupon ? (
                <>
                  <textarea
                    style={resValidCupon?.validacion === true ? { borderColor: '#00e676' } : { borderColor: '#f5532f' }}
                    className="description-info"
                    defaultValue={
                      resValidCupon?.validacion === true
                        ? resValidCupon?.promocion.descripcion
                        : resValidCupon?.respuesta
                    }
                    readOnly
                  />
                  {resValidCupon?.validacion === true ? (
                    <button
                      type="button"
                      className="btn-add"
                      onClick={() => {
                        const prendaEncontrada = infoPrendas.find((p) => p.name === resValidCupon.promocion.prenda);
                        // Buscar si ya existe un registro en la lista
                        const exists = listCupones.some((c) => c.codigoCupon === cupon);
                        if (!exists) {
                          let dscFinal = 0;
                          if (resValidCupon.promocion.tipo === 'Descuento') {
                            dscFinal = 0;
                          } else {
                            dscFinal = prendaEncontrada.price * resValidCupon.promocion.descuento;
                          }

                          const cuponActual = {
                            codigoCupon: cupon,
                            codigoPromocion: resValidCupon.promocion.codigo,
                            descripcion: resValidCupon.promocion.descripcion,
                            prenda: resValidCupon.promocion.prenda,
                            nMultiplicador: resValidCupon.promocion.descuento,
                            descuento: resValidCupon.promocion.tipo === 'Descuento' ? 0 : dscFinal,
                            tipo: resValidCupon.promocion.tipo,
                          };

                          setListCupones([...listCupones, cuponActual]);
                          formik.setFieldValue('cargosExtras.beneficios.promociones', [
                            ...formik.values.cargosExtras.beneficios.promociones,
                            cuponActual,
                          ]);

                          alert('¡Se agregó correctamente!');
                          setPortalValiPromocion(false);
                          setResValidCupon(null);
                          setCupon();
                        } else {
                          // Si ya existe un registro con el mismo codigoPromocion, puedes manejarlo como desees
                          alert('¡El registro ya existe!');
                        }
                      }}
                    >
                      Agregar
                    </button>
                  ) : null}
                </>
              ) : null}
            </div>
          </Portal>
        ) : null}
      </form>
      <Modal
        opened={opened}
        onClose={() => {
          close();
          setIsPromocion(false);
          formik.setFieldValue('gift_promo', []);
        }}
        size={550}
        scrollAreaComponent={ScrollArea.Autosize}
        title="¿ Deseas entregar uno o mas cupones de Promocion ?"
        centered
      >
        {isPromocion === true ? (
          <Promocion onAddCupon={openModal} />
        ) : (
          <div className="opcion">
            <button
              className="btn-action acp"
              type="button"
              onClick={() => {
                setIsPromocion(true);
              }}
            >
              Si
            </button>
            <button className="btn-action neg" type="submit" onClick={() => openModal([])}>
              No
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrdenServicio;
