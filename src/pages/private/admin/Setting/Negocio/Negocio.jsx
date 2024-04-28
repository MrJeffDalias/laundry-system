/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";

import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import "./negocio.scss";
import { modals } from "@mantine/modals";
import { Button, MultiSelect, Text } from "@mantine/core";
import { TextInput } from "@mantine/core";
import { TimeInput } from "@mantine/dates";
import { PrivateRoutes, Roles } from "../../../../../models";
import { useNavigate } from "react-router-dom";
import { UpdateInfoNegocio } from "../../../../../redux/actions/aNegocio";

const Negocio = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const InfoNegocio = useSelector((state) => state.negocio.infoNegocio);

  const InfoServicios = useSelector((state) => state.servicios.listServicios);
  const InfoCategorias = useSelector(
    (state) => state.categorias.listCategorias
  );

  const formik = useFormik({
    initialValues: {
      name: InfoNegocio.name,
      direccion: InfoNegocio.direccion,
      numero: InfoNegocio.numero,
      itemsAtajos: InfoNegocio.itemsAtajos,
      rolQAnulan: InfoNegocio.rolQAnulan,
      horario: InfoNegocio.horario,
      estado: InfoNegocio.estado,
    },
    //validationSchema: validationSchema,
    onSubmit: (values, { setSubmitting }) => {
      openModal(values);
      setSubmitting(false);
    },
  });

  const openModal = (data) =>
    modals.openConfirmModal({
      title: "Acttualizar Informacion de Negocio",
      centered: true,
      children: (
        <Text size="sm">
          ¿ Desea de realizar cambios en el informacion del negocio ?
        </Text>
      ),
      labels: { confirm: "Si", cancel: "No" },
      confirmProps: { color: "green" },
      onCancel: () => console.log("Cancelado"),
      onConfirm: () => handleUpdateNegocio(data),
    });

  const handleUpdateNegocio = (data) => {
    dispatch(UpdateInfoNegocio(data));
    navigate(`/${PrivateRoutes.PRIVATE}/${PrivateRoutes.LIST_ORDER_SERVICE}`);
  };

  const handleChangeDay = (day) => {
    const dias = formik.values.horario?.dias;
    const updatedDias = dias.includes(day)
      ? dias.filter((d) => d !== day)
      : [...dias, day];
    formik.setFieldValue("horario.dias", updatedDias);
  };

  const getListServices = (servicios) => {
    // Crear un mapa para acceder fácilmente al nivel de categoría por _id
    const nivelCategoriaPorId = InfoCategorias.reduce((acc, categoria) => {
      acc[categoria._id] = categoria.nivel;
      return acc;
    }, {});

    // Filtrar servicios para excluir aquellos cuya categoría asociada es de nivel "secundario"
    const serviciosFiltrados = servicios.filter((servicio) => {
      const nivelCategoria = nivelCategoriaPorId[servicio.idCategoria];
      return nivelCategoria !== "primario";
    });

    // Mapear los servicios filtrados a la estructura deseada
    return serviciosFiltrados.map((servicio) => ({
      label: servicio.nombre,
      value: servicio._id,
    }));
  };

  useEffect(() => {
    formik.setFieldValue("name", InfoNegocio.name);
    formik.setFieldValue("direccion", InfoNegocio.direccion);
    formik.setFieldValue("numero", InfoNegocio.numero);
    formik.setFieldValue("horario", InfoNegocio.horario);
    formik.setFieldValue("estado", InfoNegocio.estado);
  }, [InfoNegocio]);

  useEffect(() => {
    if (!formik.values.rolQAnulan.includes(Roles.ADMIN)) {
      // Si no está presente, agregarlo al array
      formik.setFieldValue("rolQAnulan", [
        ...formik.values.rolQAnulan,
        Roles.ADMIN,
      ]);
    }
  }, [formik.values.rolQAnulan]);

  const renderDayCell = (day) => (
    <td key={day} onClick={() => handleChangeDay(day)}>
      <div
        className={`item-day ${
          formik.values.horario?.dias.includes(day) ? "open" : "close"
        }`}
      >
        <div className="day" />
      </div>
    </td>
  );

  return (
    <div className="content-negocio">
      {Object.keys(InfoNegocio).length > 0 ? (
        <form onSubmit={formik.handleSubmit} className="form-info">
          <h1>Informacion del Negocio</h1>
          <div className="data">
            <div className="columns-paralelo">
              <div className="input-item">
                <TextInput
                  name="name"
                  label="Nombre :"
                  defaultValue={formik.values.name}
                  placeholder="Ingrese Nombre del Negocio"
                  autoComplete="off"
                  required
                  onChange={(e) => {
                    formik.setFieldValue("name", e.target.value);
                  }}
                />
                {/* {formik.errors.cantidadMin && formik.touched.cantidadMin && validIco(formik.errors.cantidadMin)} */}
              </div>
              <div className="input-item">
                <TextInput
                  name="direccion"
                  label="direccion :"
                  defaultValue={formik.values.direccion}
                  placeholder="Ingrese Direccion"
                  required
                  autoComplete="off"
                  onChange={(e) => {
                    formik.setFieldValue("direccion", e.target.value);
                  }}
                />
                {/* {formik.errors.cantidadMin && formik.touched.cantidadMin && validIco(formik.errors.cantidadMin)} */}
              </div>
              <div className="input-item">
                <TextInput
                  name="numero"
                  label="Numero :"
                  defaultValue={formik.values.numero?.info}
                  placeholder="Ingrese Numero de contacto"
                  autoComplete="off"
                  required
                  onChange={(e) => {
                    formik.setFieldValue("numero.info", e.target.value);
                  }}
                />
                <button
                  className={`state-ii ${
                    formik.values.numero?.state ? "show" : "hide"
                  }`}
                  type="button"
                  onClick={() => {
                    formik.setFieldValue(
                      "numero.state",
                      !formik.values.numero?.state
                    );
                  }}
                >
                  {formik.values.numero?.state ? (
                    <i className="fa-solid fa-eye" />
                  ) : (
                    <i className="fa-solid fa-eye-slash" />
                  )}
                </button>
                {/* {formik.errors.cantidadMin && formik.touched.cantidadMin && validIco(formik.errors.cantidadMin)} */}
              </div>
            </div>
            <div className="columns-paralelo">
              <div className="input-item">
                <MultiSelect
                  name="itemsAtajos"
                  size="sm"
                  label="Items de Atajos (2 max) :"
                  value={formik.values.itemsAtajos}
                  onChange={(e) => {
                    formik.setFieldValue("itemsAtajos", e);
                  }}
                  placeholder="Escoge categoría"
                  clearable
                  maxSelectedValues={2}
                  searchable
                  data={getListServices(InfoServicios)}
                  maxDropdownHeight={150}
                  max={250}
                />
                {/* {formik.errors.cantidadMin && formik.touched.cantidadMin && validIco(formik.errors.cantidadMin)} */}
              </div>
              <div className="input-item">
                <MultiSelect
                  name="rolQAnulan"
                  size="sm"
                  label="Roles que Anulan:"
                  value={formik.values.rolQAnulan}
                  onChange={(e) => {
                    formik.setFieldValue("rolQAnulan", e);
                  }}
                  placeholder="Escoge categoría"
                  clearable
                  maxSelectedValues={3}
                  searchable
                  data={[
                    { value: Roles.ADMIN, label: "Administrador" },
                    { value: Roles.GERENTE, label: "Gerente" },
                    { value: Roles.COORD, label: "Coordinador" },
                  ]}
                  maxDropdownHeight={150}
                  max={250}
                />
                {/* {formik.errors.cantidadMin && formik.touched.cantidadMin && validIco(formik.errors.cantidadMin)} */}
              </div>
            </div>
          </div>
          <div>
            <h2>Horario de Atencion</h2>
            <table className="t-horario">
              <thead>
                <tr>
                  <th>Período</th>
                  <th>Lunes</th>
                  <th>Martes</th>
                  <th>Miércoles</th>
                  <th>Jueves</th>
                  <th>Viernes</th>
                  <th>Sábado</th>
                  <th>Domingo</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className="horario">
                      <TimeInput
                        name="inicio"
                        required
                        defaultValue={formik.values.horario?.horas.inicio}
                        onChange={(e) => {
                          formik.setFieldValue(
                            "horario.horas.inicio",
                            e.target.value
                          );
                        }}
                      />
                      <TimeInput
                        required
                        name="fin"
                        defaultValue={formik.values.horario?.horas.fin}
                        onChange={(e) => {
                          formik.setFieldValue(
                            "horario.horas.fin",
                            e.target.value
                          );
                        }}
                      />
                    </div>
                  </td>
                  {Array.from({ length: 7 }, (_, day) =>
                    renderDayCell(day + 1)
                  )}
                </tr>
              </tbody>
            </table>
          </div>
          <Button
            type="submit"
            variant="gradient"
            gradient={{ from: "indigo", to: "cyan" }}
          >
            Actualizar
          </Button>
        </form>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
};

export default Negocio;

{
  /* <div className="state">
              <div className="input-item">
                <SwitchModel
                  title="Estado"
                  onSwitch="Abierto" // TRUE
                  offSwitch="Cerrado" // FALSE
                  name="estado"
                  defaultValue={formik.values.estado}
                  onChange={(value) => {
                    formik.setFieldValue('estado', value);
                  }}
                />
              </div>
            </div> */
}
