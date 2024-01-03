/* eslint-disable no-unused-vars */
import { Button, NumberInput, Select, Table, Textarea } from '@mantine/core';
import * as Yup from 'yup';
import { Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import './promocion.scss';
import SwitchModel from '../../../../components/SwitchModel/SwitchModel';
import { useDispatch, useSelector } from 'react-redux';
import { ReactComponent as Eliminar } from '../../../../utils/img/OrdenServicio/eliminar.svg';
import { DeletePromocion, addPromocion } from '../../../../redux/actions/aPromociones';

const Promociones = () => {
  const dispatch = useDispatch();
  const [listPrendas, setListPrendas] = useState([]);
  //const [listPromociones, setListPromociones] = useState([]);
  const infoProductos = useSelector((state) => state.prenda.infoPrendas);
  const infoPromocion = useSelector((state) => state.promocion.infoPromocion);
  const validationSchema = Yup.object().shape({
    prenda: Yup.string().required('Campo obligatorio'),
    cantidadMin: Yup.string().required('Campo obligatorio'),
    tipo: Yup.string().required('Campo obligatorio'),
    descripcion: Yup.string().required('Campo obligatorio'),
    descuento: Yup.string().required('Campo obligatorio'),
  });

  const formik = useFormik({
    initialValues: {
      prenda: '',
      cantidadMin: '',
      tipo: 'Descuento',
      descripcion: '',
      descuento: '',
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      validAddPromocion(values);
    },
  });

  const validAddPromocion = (data) =>
    modals.openConfirmModal({
      title: 'Registro de Promocion',
      centered: true,
      children: <Text size="sm">¿ Estas seguro de agregar esta nueva Promocion ?</Text>,
      labels: { confirm: 'Si', cancel: 'No' },
      confirmProps: { color: 'green' },
      //onCancel: () => console.log("Cancelado"),
      onConfirm: () => {
        dispatch(addPromocion(data));
        formik.resetForm();
      },
    });

  const validDeletePromocion = (cod) =>
    modals.openConfirmModal({
      title: 'Eliminar Promocion',
      centered: true,
      children: <Text size="sm">¿ Estas seguro de eliminar esta promocion ?</Text>,
      labels: { confirm: 'Si', cancel: 'No' },
      confirmProps: { color: 'red' },
      //onCancel: () => console.log("Cancelado"),
      onConfirm: () => dispatch(DeletePromocion(cod)),
    });

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

  useEffect(() => {
    if (infoProductos.length > 0) {
      const filteredArray = infoProductos.filter((item) => item.name !== 'Delivery');
      const resultArray = filteredArray.map((item) => item.name);
      setListPrendas(resultArray);
    }
  }, [infoProductos]);

  return (
    <div className="content-promos">
      <div className="form-promotion">
        <form onSubmit={formik.handleSubmit} className="container">
          <h1>Promociones</h1>
          <div className="input-item">
            <Select
              name="prenda"
              label="Prenda"
              value={formik.values.prenda}
              onChange={(e) => {
                formik.setFieldValue('prenda', e);
              }}
              placeholder="Escoge una prenda"
              clearable
              searchable
              data={listPrendas}
            />
            {formik.errors.prenda && formik.touched.prenda && validIco(formik.errors.prenda)}
          </div>
          <div className="input-item">
            <NumberInput
              name="cantidadMin"
              label="Cantidad Minima :"
              value={formik.values.cantidadMin}
              placeholder="Ingrese Porcentaje de Descuento"
              precision={0}
              min={0}
              step={1}
              hideControls
              autoComplete="off"
              onChange={(e) => {
                formik.setFieldValue('cantidadMin', e);
              }}
            />
            {formik.errors.cantidadMin && formik.touched.cantidadMin && validIco(formik.errors.cantidadMin)}
          </div>
          <div className="input-item">
            <SwitchModel
              title="Tipo de Promocion :"
              onSwitch="Gratis" // TRUE
              offSwitch="Descuento" // FALSE
              name="tipo"
              defaultValue={formik.values.tipo === 'Descuento' ? false : true}
              onChange={(value) => {
                formik.setFieldValue('descuento', '');
                if (value === true) {
                  formik.setFieldValue('tipo', 'Gratis');
                } else {
                  formik.setFieldValue('tipo', 'Descuento');
                }
              }}
            />
            {formik.errors.tipo && formik.touched.tipo && validIco(formik.errors.tipo)}
          </div>
          <div className="input-item">
            <Textarea
              name="descripcion"
              value={formik.values.descripcion}
              onChange={formik.handleChange}
              placeholder="Promocion 2 x 1 en ..."
              label="Ingrese Descripcion"
            />
            {formik.errors.descripcion && formik.touched.descripcion && validIco(formik.errors.descripcion)}
          </div>
          <div className="input-item">
            {formik.values.tipo === 'Gratis' ? (
              <NumberInput
                name="descuento"
                label="Numero Prendas Gratuitas"
                value={formik.values.descuento}
                precision={0}
                min={1}
                step={1}
                hideControls
                autoComplete="off"
                onChange={(e) => {
                  formik.setFieldValue('descuento', e);
                }}
              />
            ) : (
              <NumberInput
                name="descuento"
                label="Porcentaje de Descuento :"
                value={formik.values.descuento}
                placeholder="Ingrese Porcentaje de Descuento"
                precision={0}
                max={100}
                min={1}
                step={10}
                hideControls
                autoComplete="off"
                onChange={(e) => {
                  formik.setFieldValue('descuento', e);
                }}
              />
            )}
            {formik.errors.descuento && formik.touched.descuento && validIco(formik.errors.descuento)}
          </div>
          <Button type="submit" className="btn-save" variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }}>
            Agregar Promocion
          </Button>
        </form>
      </div>
      <div className="list-promotions">
        {infoPromocion?.length > 0 ? (
          <Table>
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Descripcion</th>
                <th>Descuento</th>
                <th>Prenda</th>
                <th>Cantidad Minima</th>
                <th>Tipo Promo</th>
                <th>Accion</th>
              </tr>
            </thead>
            <tbody>
              {infoPromocion.map((p, index) => (
                <tr key={index}>
                  <td>{p.codigo}</td>
                  <td>{p.descripcion}</td>
                  <td>{p.descuento}</td>
                  <td>{p.prenda}</td>
                  <td>{p.cantidadMin}</td>
                  <td>{p.tipo}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => {
                        validDeletePromocion(p.codigo);
                      }}
                    >
                      <Eliminar className="delete-row" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : null}
      </div>
    </div>
  );
};

export default Promociones;
