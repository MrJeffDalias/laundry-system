/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useDispatch, useSelector } from 'react-redux';

import { AnularOrderService } from '../../../../../../redux/actions/aAnular';
import { CancelEntrega_OrdenService, UpdateOrdenServices } from '../../../../../../redux/actions/aOrdenServices';
import { DateCurrent } from '../../../../../../utils/functions';

import { Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { Form, Formik } from 'formik';
import * as Yup from 'yup';

import Anular from '../Anular/Anular';
import Entregar from './Entregar/Entregar';
import Pagar from './Pagar/Pagar';

import { PrivateRoutes } from '../../../../../../models';
import './endProcess.scss';
import { socket } from '../../../../../../utils/socket/connect';
import { Notify } from '../../../../../../utils/notify/Notify';
import { simboloMoneda } from '../../../../../../services/global';

const EndProcess = ({ IdCliente, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [onAction, setOnAction] = useState('principal');
  const [btnText, setBtnText] = useState();

  const InfoUsuario = useSelector((state) => state.user.infoUsuario);
  const infoCliente = useSelector((state) => state.orden.registered.find((item) => item._id === IdCliente));

  //const PENDIENTE = "pendiente";
  const PAGADO = 'Pagado';

  const handleCancelarEntrega = () => {
    dispatch(CancelEntrega_OrdenService(IdCliente)).then((res) => {
      if (res.payload) {
        onClose(false);
      }
    });
  };

  const handleAnular = (infoAnulacion) => {
    dispatch(
      UpdateOrdenServices({
        id: IdCliente,
        infoRecibo: { estadoPrenda: 'anulado' },
        rol: InfoUsuario.rol,
        infoAnulacion: { ...infoAnulacion, _id: IdCliente },
      })
    ).then((res) => {
      if (res.payload) {
        onClose(false);
      }
    });
  };

  const openModalPagarEntregar = (values) =>
    modals.openConfirmModal({
      title: 'Confirmar Pago y Entrega',
      centered: true,
      children: <Text size="sm">¿ Estas seguro que quieres realizar el PAGO y la ENTREGA ?</Text>,
      labels: { confirm: 'Si', cancel: 'No' },
      confirmProps: { color: 'green' },
      //onCancel: () => console.log("Cancelado"),
      onConfirm: () => handleGetInfo(values),
    });

  const openModalEntregar = () =>
    modals.openConfirmModal({
      title: 'Confirmar Entrega',
      centered: true,
      children: <Text size="sm">¿ Estas seguro que quieres realizar la ENTREGA ?</Text>,
      labels: { confirm: 'Si', cancel: 'No' },
      confirmProps: { color: 'green' },
      //onCancel: () => console.log("Cancelado"),
      onConfirm: () => handleEditEntrega(''),
    });

  // Entregado
  const handleEditEntrega = (iDelivery) => {
    const infoDelivery = {
      name: infoCliente.Nombre,
      descripcion: `[${String(infoCliente.codRecibo).padStart(4, '0')}] Delivery Devolucion en ${
        iDelivery.tipoTrasporte
      }`,
      fecha: DateCurrent().format4,
      hora: DateCurrent().format3,
      monto: iDelivery.mDevolucion,
    };

    dispatch(
      UpdateOrdenServices({
        id: IdCliente,
        infoRecibo: {
          ...infoCliente,
          datePago: infoCliente.datePago.fecha
            ? infoCliente.datePago
            : {
                fecha: DateCurrent().format4,
                hora: DateCurrent().format3,
              },
          dateEntrega: {
            fecha: DateCurrent().format4,
            hora: DateCurrent().format3,
          },
          Pago: iDelivery ? 'Pagado' : infoCliente.Pago,
          estadoPrenda: 'entregado',
          metodoPago: iDelivery
            ? iDelivery.metodoPago !== ''
              ? iDelivery.metodoPago
              : infoCliente.metodoPago
            : infoCliente.metodoPago,
          location: 1,
        },
        ...(iDelivery && { infoDelivery }),
        rol: InfoUsuario.rol,
      })
    ).then((res) => {
      if (res.payload) {
        onClose(false);
      }
    });
  };

  const handleButtonClick = () => {
    if (infoCliente.Pago === PAGADO) {
      if (infoCliente.Modalidad === 'Tienda') {
        openModalEntregar();
      } else {
        setOnAction('concluir');
      }
    } else {
      setOnAction('concluir');
    }
  };

  const validationSchema = Yup.object().shape({
    tipoTrasporte: infoCliente.Modalidad === 'Delivery' ? Yup.string().required('Escoja un tipo de transporte') : null,
    metodoPago: infoCliente.Pago === 'Pendiente' ? Yup.string().required('Escoja Metodo de Pago') : null,
    mDevolucion: infoCliente.Modalidad === 'Delivery' ? Yup.string().required('Escoja Metodo de Pago') : null,
  });

  const handleGetInfo = (info) => {
    infoCliente.Modalidad === 'Delivery' ? handleEditEntrega(info) : handleEditEntrega({ metodoPago: info.metodoPago });
  };

  useEffect(() => {
    setBtnText(infoCliente.Pago === PAGADO ? 'Entregar' : 'Pagar y Entregar');
  }, [infoCliente]);

  useEffect(() => {
    socket.on('server:orderUpdated:child', (data) => {
      if (infoCliente._id === data._id) {
        if (data.estadoPrenda === 'anulado') {
          Notify('ORDERN DE SERVICIO ANULADO', '', 'fail');
        } else {
          Notify('ORDERN DE SERVICIO ACTUALIZADO', '', 'warning');
        }
        onClose(false);
      }
    });

    socket.on('server:updateListOrder:child', (data) => {
      data.some((orden) => {
        if (infoCliente._id === orden._id) {
          if (orden.estadoPrenda === 'donado') {
            Notify('ORDERN DE SERVICIO DONADO', '', 'fail');
          } else {
            Notify('ORDERN DE SERVICIO ACTUALIZADO', '', 'warning');
          }
          onClose(false);
          return true; // Detener la iteración
        }
        return false; // Continuar la iteración
      });
    });

    return () => {
      // Remove the event listener when the component unmounts
      socket.off('server:orderUpdated:child');
      socket.off('server:updateListOrder:child');
    };
  }, []);

  return (
    <div className="actions-container">
      <div className="header-ac">
        <h1>
          {infoCliente.Nombre.split(' ').slice(0, 1).join(' ')} - {infoCliente.Modalidad}
        </h1>
      </div>
      <hr />
      <div className="body-ac">
        {onAction === 'principal' ? ( // Principal
          <div className="actions-init">
            {infoCliente.estadoPrenda === 'pendiente' ? (
              <button type="button" className="btn-exm" onClick={handleButtonClick}>
                {btnText}
              </button>
            ) : null}
            {infoCliente.dateRecepcion.fecha === DateCurrent().format4 || infoCliente.estadoPrenda !== 'entregado' ? (
              <button type="button" className="btn-exm" onClick={() => setOnAction('anular')}>
                Anular
              </button>
            ) : null}
            {infoCliente.dateEntrega.fecha === DateCurrent().format4 && infoCliente.estadoPrenda === 'entregado' ? (
              <button type="button" className="btn-exm" onClick={handleCancelarEntrega}>
                Cancelar Entrega
              </button>
            ) : null}
            {infoCliente.estadoPrenda !== 'entregado' && infoCliente.modeRegistro !== 'antiguo' ? (
              <button
                type="button"
                className="btn-exm"
                onClick={() => {
                  navigate(`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.EDIT_ORDER_SERVICE}/${IdCliente}`);
                }}
              >
                Editar
              </button>
            ) : null}
          </div>
        ) : onAction === 'concluir' ? (
          <Formik
            initialValues={{}}
            validationSchema={validationSchema}
            onSubmit={(values, { setSubmitting }) => {
              openModalPagarEntregar(values);
              setSubmitting(false);
            }}
          >
            {({ handleSubmit, setFieldValue, isSubmitting, values, errors, touched }) => (
              <Form onSubmit={handleSubmit} className="content-pE">
                <h1>
                  {simboloMoneda} {infoCliente.totalNeto}
                </h1>
                <div className="trasporte-pago">
                  {infoCliente.Pago === 'Pendiente' ? (
                    <Pagar setFieldValue={setFieldValue} errors={errors} touched={touched} />
                  ) : null}
                  {infoCliente.Modalidad === 'Delivery' ? (
                    <Entregar setFieldValue={setFieldValue} errors={errors} touched={touched} values={values} />
                  ) : null}
                </div>
                <div className="actions-btns">
                  <button type="button" className="btn-exm" onClick={() => setOnAction('principal')}>
                    Retroceder
                  </button>
                  <button className="btn-exm" type="submit" disabled={isSubmitting}>
                    Guardar
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        ) : (
          <Anular onReturn={setOnAction} onAnular={handleAnular} />
        )}
      </div>
    </div>
  );
};

export default EndProcess;
